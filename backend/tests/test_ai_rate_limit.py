"""외부 Redis·OpenAI 호출 없이 일일 한도 경계와 유료 호출 차단을 검증한다."""

import os
import unittest
from unittest.mock import patch

from fastapi import HTTPException, Request

from app.routers import ai
from app.services import ai_rate_limit as quota


class DailyLimitTests(unittest.TestCase):
    """모의 Redis 응답으로 새 한도·기존 카운터·중복 잠금을 확인한다."""

    def setUp(self):
        self.request = Request(
            {"type": "http", "headers": [], "client": ("127.0.0.1", 1)}
        )

    def test_reservation_sends_ten_and_preserves_site_limit_lock_and_keys(self):
        with patch.object(
            quota, "_client_id", return_value="client-hash"
        ), patch.object(quota, "_redis_command", return_value=0) as redis:
            reservation = quota.reserve(self.request, "MBN11")
        args = redis.call_args.args
        self.assertEqual(args[2], 3)  # Redis 키 개수이며 생성 한도와 다르다.
        self.assertEqual(args[7:9], (10, 30))
        self.assertEqual(args[10], 120)
        self.assertTrue(args[3].startswith("msos:ai:v1:user:"))
        self.assertTrue(args[4].startswith("msos:ai:v1:all:"))
        self.assertEqual(reservation.lock_key, "msos:ai:v1:lock:client-hash:MBN11")

    def test_existing_usage_is_reused_and_tenth_is_allowed_eleventh_blocked(self):
        # 기존 사용량 3회에서 시작하며 카운터 초기화 없이 새 상한을 적용한다.
        used = 3

        def redis_result(*args):
            nonlocal used
            if used >= args[7]:
                return 1
            used += 1
            return 0

        with patch.object(
            quota, "_client_id", return_value="client-hash"
        ), patch.object(quota, "_redis_command", side_effect=redis_result):
            for _ in range(7):
                quota.reserve(self.request, "MBN11")
            self.assertEqual(used, 10)
            with self.assertRaises(HTTPException) as error:
                quota.reserve(self.request, "MBN11")
        self.assertEqual(error.exception.status_code, 429)
        self.assertIn("10회", error.exception.detail)
        self.assertEqual(used, 10)

    def test_site_limit_and_duplicate_request_still_block(self):
        for outcome, expected in [(2, "사이트 전체"), (3, "이미 생성 중")]:
            with self.subTest(outcome=outcome), patch.object(
                quota, "_client_id", return_value="client-hash"
            ), patch.object(quota, "_redis_command", return_value=outcome):
                with self.assertRaises(HTTPException) as error:
                    quota.reserve(self.request, "MBN11")
                self.assertEqual(error.exception.status_code, 429)
                self.assertIn(expected, error.exception.detail)

    def test_redis_failure_stops_reservation(self):
        with patch.object(
            quota, "_client_id", return_value="client-hash"
        ), patch.object(
            quota, "_redis_command", side_effect=HTTPException(status_code=503)
        ):
            with self.assertRaises(HTTPException) as error:
                quota.reserve(self.request, "MBN11")
        self.assertEqual(error.exception.status_code, 503)

    def test_blocked_request_never_constructs_openai_client(self):
        evidence = {
            "program_name": "검증용",
            "genre": "검증용",
            "period": "검증용",
            "observations": [],
            "video_title_clues": [],
            "limitations": [],
            "execution_allowed": False,
        }
        with patch.dict(
            os.environ,
            {"MSOS_ENABLE_AI": "true", "OPENAI_API_KEY": "local-test-placeholder"},
        ), patch.object(
            ai, "_program_index", return_value={"MBN11": {"program_id": "MBN11"}}
        ), patch.object(
            ai, "build_evidence", return_value=evidence
        ), patch.object(
            quota, "_client_id", return_value="client-hash"
        ), patch.object(
            quota, "_redis_command", return_value=1
        ), patch.object(
            ai, "OpenAI"
        ) as client:
            with self.assertRaises(HTTPException) as error:
                ai.generate_strategy("MBN11", self.request)
            self.assertEqual(error.exception.status_code, 429)
            client.assert_not_called()

    def test_free_status_reports_current_limits(self):
        with patch.object(quota, "_redis_command") as redis, patch.object(
            ai, "OpenAI"
        ) as client:
            status = ai.status()
        self.assertEqual(status["daily_limits"], {"per_client": 10, "site_total": 30})
        self.assertFalse(status["api_called"])
        redis.assert_not_called()
        client.assert_not_called()


if __name__ == "__main__":
    unittest.main()
