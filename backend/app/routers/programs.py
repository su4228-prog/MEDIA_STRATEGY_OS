"""프로그램·영상 후보·방송 회차 및 출처 조회 API를 제공한다."""

import json

from fastapi import APIRouter, HTTPException

from app.config import DATA_DIR
from app.services.program_data import programs, videos, episodes, program_index

router = APIRouter()


@router.get("/")
def home():
    """서비스 실행 상태와 프로그램 수를 반환한다."""
    return {
        "message": "MEDIA STRATEGY OS backend is running!",
        "program_count": len(programs),
    }


@router.get("/health")
def health():
    """상태와 기존 데이터 버전을 반환한다."""
    return {"status": "ok", "data_version": "v11.22", "program_count": len(programs)}


@router.get("/api/v1/programs")
def list_programs():
    """원본 프로그램 목록과 개수를 반환한다."""
    return {"count": len(programs), "programs": programs}


@router.get("/api/v1/programs/{program_id}")
def get_program(program_id: str):
    """프로그램 ID에 해당하는 원본 사전을 반환한다."""
    program = program_index.get(program_id)
    if program is None:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


@router.get("/api/v1/programs/{program_id}/videos")
def get_videos(program_id: str):
    """프로그램 ID에 연결된 영상 후보와 기존 분류 상태를 반환한다."""
    if program_id not in program_index:
        raise HTTPException(status_code=404, detail="Program not found")
    matches = [v for v in videos if v.get("program_id_candidate") == program_id]
    return {
        "program_id": program_id,
        "count": len(matches),
        "classification_status": "EXPERIMENTAL_CANDIDATES",
        "videos": matches,
    }


@router.get("/api/v1/programs/{program_id}/episodes")
def get_episodes(program_id: str):
    """프로그램 ID에 연결된 방송 회차와 기존 대조 상태를 반환한다."""
    if program_id not in program_index:
        raise HTTPException(status_code=404, detail="Program not found")
    matches = [e for e in episodes if e.get("program_id") == program_id]
    return {
        "program_id": program_id,
        "count": len(matches),
        "matching_status": "DATE_CROSSMATCH_NOT_CONTENT_VERIFICATION",
        "episodes": matches,
    }


@router.get("/api/v1/meta")
def get_meta():
    """집계 개수와 원본 출처 정보를 반환한다."""
    with (DATA_DIR / "provenance_v1.json").open("r", encoding="utf-8") as file:
        provenance = json.load(file)
    return {
        "analysis_version": "v11.22",
        "classifier_baseline": "v11.3",
        "program_count": len(programs),
        "video_candidate_count": len(videos),
        "episode_count": len(episodes),
        "provenance": provenance,
    }
