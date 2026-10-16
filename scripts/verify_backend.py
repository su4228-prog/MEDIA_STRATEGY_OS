"""원본 보관본과 API·계산·AI 응답 계약을 비교하며 실제 외부 호출을 차단한다."""

import ast
import hashlib
import json
import logging
import os
from pathlib import Path
import socket
import sys
import types
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from fastapi.testclient import TestClient


def load_original(name, filename):
    """보관된 소스를 기존 경로 기준으로 메모리에 로드해 원본 동작을 재현한다."""
    module = types.ModuleType(name)
    module.__file__ = str(ROOT / "backend" / filename)
    source = (ROOT / ".local/refactor-original" / filename).read_text(encoding="utf-8")
    sys.modules[name] = module
    exec(compile(source, module.__file__, "exec"), module.__dict__)
    return module


def normalized(node):
    """한국어 설명 추가를 제외한 AST를 비교한다."""
    node = ast.fix_missing_locations(node)
    for child in ast.walk(node):
        if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.Module)):
            if child.body and isinstance(child.body[0], ast.Expr):
                value = child.body[0].value
                if isinstance(value, ast.Constant) and isinstance(value.value, str):
                    child.body = child.body[1:]
    return ast.dump(node, include_attributes=False)


def verify():
    """읽기 API와 모의 AI 성공·대체 응답, 불변 파일을 비교하고 결과를 반환한다."""
    original_ai = load_original("original_ai_router", "ai_router.py")
    sys.modules["ai_router"] = original_ai
    original_main = load_original("original_main", "main.py")
    del sys.modules["ai_router"]
    import main
    from app.routers import ai

    before = TestClient(original_main.app)
    after = TestClient(main.app)
    paths = ["/", "/health", "/api/v1/meta", "/api/v1/programs", "/api/v1/ai/status"]
    for i in range(1, 18):
        pid = f"MBN{i:02}"
        paths += [
            f"/api/v1/programs/{pid}",
            f"/api/v1/programs/{pid}/videos",
            f"/api/v1/programs/{pid}/episodes",
            f"/api/v1/ai/strategy-preview/{pid}",
        ]
    paths += [
        "/api/v1/programs/UNKNOWN",
        "/api/v1/programs/UNKNOWN/videos",
        "/api/v1/programs/UNKNOWN/episodes",
        "/api/v1/ai/strategy-preview/UNKNOWN",
    ]
    for path in paths:
        a, b = before.get(path), after.get(path)
        assert (a.status_code, a.json()) == (b.status_code, b.json()), path

    instructions = original_ai.INSTRUCTIONS
    assert instructions == ai.INSTRUCTIONS
    assert original_ai.STRATEGY_SCHEMA == ai.STRATEGY_SCHEMA
    original_functions = {
        n.name: n
        for n in ast.parse(
            (ROOT / ".local/refactor-original/ai_router.py").read_text(encoding="utf-8")
        ).body
        if isinstance(n, ast.FunctionDef)
    }
    current_functions = {}
    for p in (ROOT / "backend/app").rglob("*.py"):
        current_functions.update(
            {
                n.name: n
                for n in ast.parse(p.read_text(encoding="utf-8")).body
                if isinstance(n, ast.FunctionDef)
            }
        )
    for name, node in original_functions.items():
        assert normalized(node) == normalized(current_functions[name]), name

    generated = {
        key: "관측 근거를 바탕으로 콘텐츠 소개 방식을 검토합니다."
        for key in original_ai.STRATEGY_SCHEMA["required"]
    }
    generated["opportunities"] = [
        {
            key: "확인된 근거를 바탕으로 검토할 콘텐츠 전략입니다."
            for key in original_ai.OPPORTUNITY_SCHEMA["required"]
        }
        for _ in range(2)
    ]
    for raw in [json.dumps(generated, ensure_ascii=False), "{}"]:
        response = types.SimpleNamespace(
            status="completed", output_text=raw, model="mock-model"
        )
        for i in range(1, 18):
            outputs = []
            for module, client in [(original_ai, before), (ai, after)]:
                fake = Mock()
                fake.responses.create.return_value = response
                with patch.object(module, "OpenAI", return_value=fake), patch.dict(
                    os.environ,
                    {
                        "MSOS_ENABLE_AI": "true",
                        "OPENAI_API_KEY": "local-test-placeholder",
                    },
                ):
                    r = client.post(f"/api/v1/ai/strategy/MBN{i:02}")
                    assert r.status_code == 200
                    assert fake.responses.create.call_count == 1
                    if raw != "{}" and i == 11 and module is ai:
                        (ROOT / ".local/mock-report.json").write_text(
                            json.dumps(r.json()["report"], ensure_ascii=False),
                            encoding="utf-8",
                        )
                    outputs.append((r.json(), fake.responses.create.call_args))
            assert outputs[0] == outputs[1], (raw, i)
    for client in [before, after]:
        with patch.dict(os.environ, {"MSOS_ENABLE_AI": "false"}):
            assert client.post("/api/v1/ai/strategy/MBN01").status_code == 403
        with patch.dict(os.environ, {"MSOS_ENABLE_AI": "true", "OPENAI_API_KEY": ""}):
            assert client.post("/api/v1/ai/strategy/MBN01").status_code == 503
    hashes = json.loads(
        (ROOT / ".local/refactor-original/protected-hashes.json").read_text(
            encoding="utf-8"
        )
    )
    for path, expected in hashes.items():
        assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == expected, path
    return {
        "read_api_comparisons": len(paths),
        "ai_mock_comparisons": 34,
        "original_ai_functions_unchanged": len(original_functions),
        "protected_files_unchanged": len(hashes),
        "prompt_and_schema_unchanged": True,
        "paid_api_calls": 0,
    }


if __name__ == "__main__":
    logging.getLogger("msos.ai").setLevel(logging.CRITICAL)
    # Windows 이벤트 루프의 로컬 소켓은 허용하고 외부 연결은 차단한다.
    original_connect = socket.socket.connect

    def local_connect(sock, address):
        if not isinstance(address, tuple) or address[0] not in (
            "127.0.0.1",
            "::1",
            "localhost",
        ):
            raise AssertionError("External network disabled during verification")
        return original_connect(sock, address)

    with patch.object(socket.socket, "connect", local_connect):
        result = verify()
    target = ROOT / ".local/verification-backend.json"
    target.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
