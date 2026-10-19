"""무료 전략 미리보기와 수동 AI 전략 생성 API를 제공한다."""

import inspect
import json
import logging
import os

from fastapi import APIRouter, HTTPException, Request
from openai import (
    APIConnectionError,
    APIStatusError,
    AuthenticationError,
    OpenAI,
    RateLimitError,
)

from app.schemas.strategy import INSTRUCTIONS, STRATEGY_SCHEMA
from app.services.ai_rate_limit import USER_DAILY_LIMIT, SITE_DAILY_LIMIT, reserve, release
from app.services.strategy_evidence import _program_index, build_evidence
from app.services.strategy_report import (
    _local_fallback,
    _validate_model_text,
    format_report,
)

router = APIRouter(prefix="/api/v1/ai", tags=["AI Strategy (manual trigger)"])
logger = logging.getLogger("msos.ai")
DIAGNOSTIC_VERSION = "strategy-quality-v3.1-20261017"


@router.get("/status")
def status():
    """설정 여부·진단 버전·일일 한도를 반환하며 외부 API는 호출하지 않는다."""
    return {
        "configured": bool(os.getenv("OPENAI_API_KEY")),
        "model": os.getenv("OPENAI_MODEL", "gpt-5-mini"),
        "api_called": False,
        "diagnostic_version": DIAGNOSTIC_VERSION,
        "daily_limits": {
            "per_client": USER_DAILY_LIMIT,
            "site_total": SITE_DAILY_LIMIT,
        },
    }


@router.get("/route-diagnostics")
def route_diagnostics(request: Request):
    """현재 요청의 앱을 검사해 전략 엔드포인트의 등록 정보를 반환한다."""
    matching = []
    for index, route in enumerate(request.app.routes):
        path = getattr(route, "path", None)
        endpoint = getattr(route, "endpoint", None)
        if not path or "/api/v1/ai/strategy/" not in path or endpoint is None:
            continue
        matching.append(
            {
                "order": index,
                "path": path,
                "method": sorted(getattr(route, "methods", []) or []),
                "handler_module": getattr(endpoint, "__module__", "unknown"),
                "handler_name": getattr(endpoint, "__name__", "unknown"),
                "handler_file": inspect.getsourcefile(endpoint),
                "is_this_router_function": endpoint is generate_strategy,
            }
        )
    return {
        "diagnostic_version": DIAGNOSTIC_VERSION,
        "api_called": False,
        "strategy_routes_in_registration_order": matching,
    }


@router.get("/strategy-preview/{program_id}")
def strategy_preview(program_id: str):
    """프로그램 ID로 확정 계산 근거를 반환하며 외부 API는 호출하지 않는다."""
    program = _program_index().get(program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    evidence = build_evidence(program)
    return {"api_called": False, "diagnostic_version": DIAGNOSTIC_VERSION, **evidence}


@router.post("/strategy/{program_id}")
def generate_strategy(program_id: str, request: Request):
    """프로그램 ID로 수동 전략 생성을 수행하고 기존 보고서 응답 구조를 반환한다."""
    if os.getenv("MSOS_ENABLE_AI", "false").lower() != "true":
        raise HTTPException(
            status_code=403, detail="AI generation disabled. Check MSOS_ENABLE_AI."
        )
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(
            status_code=503, detail="OPENAI_API_KEY not configured on backend"
        )
    program = _program_index().get(program_id)
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    evidence = build_evidence(program)
    model_input = {
        "프로그램": evidence["program_name"],
        "장르": evidence["genre"],
        "분석 기간": evidence["period"],
        "관측 사실": evidence["observations"],
        "확인 가능한 영상 제목 단서": evidence["video_title_clues"],
        "주의 사항": evidence["limitations"],
        "실행 전 검증 필요": not evidence["execution_allowed"],
    }
    reservation = reserve(request, program_id)
    try:
        client = OpenAI(api_key=key, timeout=65.0, max_retries=0)
        response = client.responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5-mini"),
            instructions=INSTRUCTIONS,
            input=json.dumps(model_input, ensure_ascii=False),
            reasoning={"effort": "low"},
            text={
                "format": {
                    "type": "json_schema",
                    "name": "program_strategy",
                    "strict": True,
                    "schema": STRATEGY_SCHEMA,
                }
            },
            max_output_tokens=4600,
            store=False,
        )
        raw = (getattr(response, "output_text", "") or "").strip()
        report_source = "openai_validated"
        try:
            if getattr(response, "status", None) != "completed" or not raw:
                raise ValueError("Empty or incomplete model response")
            generated = _validate_model_text(
                json.loads(raw), evidence["program_name"], evidence
            )
        except (ValueError, json.JSONDecodeError, TypeError) as exc:
            # Never spend the user's API credit on another request merely because
            # a formatting/quality rule rejected a useful first response.
            logger.warning("Report quality fallback for %s: %s", program_id, exc)
            generated = _local_fallback(evidence)
            report_source = "verified_evidence_fallback"
        analysis = format_report(evidence, generated)
        return {
            "program_id": program_id,
            "model": getattr(response, "model", "unknown"),
            "ai_generated": report_source == "openai_validated",
            "report_source": report_source,
            "validation_status": "STRATEGY_REVIEW_ONLY",
            "analysis": analysis,  # backwards-compatible with existing frontend
            "report": {
                "title": evidence["program_name"],
                "period": evidence["period"],
                "week_labels": evidence["week_labels"],
                "headline": generated["headline"],
                "insight": generated["insight"],
                "comparison_rows": evidence["comparison_rows"],
                "racoi": evidence["racoi"],
                "opportunities": generated["opportunities"],
                "experiment": {
                    "title": generated["experiment_title"],
                    "plan": generated["experiment_plan"],
                    "metrics": generated["experiment_metrics"],
                    "decision": generated["experiment_decision"],
                },
                "conclusion": generated["conclusion"],
                "limitations": evidence["limitations"],
            },
        }
    except HTTPException:
        raise
    except AuthenticationError:
        raise HTTPException(status_code=401, detail="OpenAI API 인증을 확인해 주세요.")
    except RateLimitError:
        raise HTTPException(
            status_code=429, detail="OpenAI 사용 한도 또는 결제 설정을 확인해 주세요."
        )
    except APIConnectionError:
        raise HTTPException(
            status_code=502, detail="OpenAI 서버에 연결하지 못했습니다."
        )
    except APIStatusError as exc:
        logger.warning("OpenAI API status: %s", exc.status_code)
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI 요청이 실패했습니다. 응답 상태: {exc.status_code}",
        )
    finally:
        release(reservation)
