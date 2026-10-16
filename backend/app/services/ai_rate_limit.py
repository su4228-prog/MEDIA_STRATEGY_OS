"""Redis REST 기반 AI 생성 횟수 제한과 중복 요청 잠금.

별도 서버 파일에 의존하지 않고, Redis Lua 스크립트로 원자적으로 제한을 적용한다.
저장소가 없거나 통신이 실패하면 유료 OpenAI 호출을 진행하지 않는다.
"""

import hashlib
import hmac
import json
import os
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import HTTPException, Request as FastAPIRequest


# 확인 -> 제한 -> 할당 -> 잠금을 하나의 Redis 연산으로 처리한다.
_RESERVE_LUA = """
local user_count = tonumber(redis.call('GET', KEYS[1]) or '0')
local total_count = tonumber(redis.call('GET', KEYS[2]) or '0')
if total_count >= tonumber(ARGV[3]) then return 2 end
if user_count >= tonumber(ARGV[2]) then return 1 end
if redis.call('EXISTS', KEYS[3]) == 1 then return 3 end
if not redis.call('SET', KEYS[3], ARGV[1], 'NX', 'EX', tonumber(ARGV[5])) then return 3 end
redis.call('INCR', KEYS[1])
redis.call('EXPIRE', KEYS[1], tonumber(ARGV[4]))
redis.call('INCR', KEYS[2])
redis.call('EXPIRE', KEYS[2], tonumber(ARGV[4]))
return 0
"""

# 다른 요청의 잠금을 지우지 않도록 생성 당시 토큰을 비교한다.
_RELEASE_LUA = """
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
"""


@dataclass(frozen=True)
class Reservation:
    lock_key: str
    token: str


def _redis_command(*args):
    """Upstash Redis REST API로 명령 하나를 보내고 결과를 반환한다."""
    endpoint = os.getenv('UPSTASH_REDIS_REST_URL', '').strip().rstrip('/')
    token = os.getenv('UPSTASH_REDIS_REST_TOKEN', '').strip()
    if not endpoint.startswith('https://') or not token:
        raise HTTPException(
            status_code=503,
            detail='AI 생성 보호 설정이 완료되지 않았습니다. 잠시 후 다시 이용해 주세요.',
        )
    body = json.dumps(list(args)).encode('utf-8')
    request = Request(
        endpoint,
        data=body,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        method='POST',
    )
    try:
        with urlopen(request, timeout=5) as response:
            payload = json.load(response)
        if payload.get('error') is not None or 'result' not in payload:
            raise ValueError('Redis returned an error')
        return payload['result']
    except (OSError, HTTPError, URLError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=503,
            detail='일시적으로 AI 사용량을 확인할 수 없어 생성을 중단했습니다. 잠시 후 다시 시도해 주세요.',
        ) from exc


def _client_id(request: FastAPIRequest):
    """IP 원문을 저장하지 않고 비밀 솔트로 해시한 식별값만 보존한다.

    Render 앞단 프록시가 전달한 첫 X-Forwarded-For 항목을 이용한다.
    헤더 조작만으로는 전체 생성 횟수 제한을 우회할 수 없다.
    """
    salt = os.getenv('MSOS_RATE_LIMIT_SALT', '').strip()
    if len(salt) < 24:
        raise HTTPException(status_code=503, detail='AI 사용량 보호 설정을 확인해 주세요.')
    forwarded = request.headers.get('x-forwarded-for', '')
    remote = forwarded.split(',')[0].strip() if forwarded else ''
    ip = remote or (request.client.host if request.client else 'unknown')
    return hmac.new(salt.encode('utf-8'), ip.encode('utf-8'), hashlib.sha256).hexdigest()


def reserve(request: FastAPIRequest, program_id: str):
    """UTC 날짜별 개인 3회/전체 30회 제한과 중복 잠금을 원자적으로 예약한다.

    성공한 예약은 API 오류가 발생해도 사용량에서 차감하지 않는다. API 비용이
    발생한 뒤 응답이 실패할 수 있으므로, 과금 방지 목적의 보수적 계산이다.
    """
    now = datetime.now(timezone.utc)
    day = now.strftime('%Y%m%d')
    ttl = int(((now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0) - now).total_seconds()) + 3600
    hashed = _client_id(request)
    prefix = 'msos:ai:v1'
    user_key = f'{prefix}:user:{day}:{hashed}'
    all_key = f'{prefix}:all:{day}'
    lock_key = f'{prefix}:lock:{hashed}:{program_id}'
    token = secrets.token_urlsafe(24)
    outcome = _redis_command('EVAL', _RESERVE_LUA, 3, user_key, all_key, lock_key, token, 3, 30, ttl, 120)
    try:
        code = int(outcome)
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=503, detail='AI 사용량 보호 응답을 확인할 수 없습니다.') from exc
    errors = {
        1: '오늘 이 접속 환경에서 생성할 수 있는 AI 보고서 3회를 모두 사용했습니다.',
        2: '오늘 사이트 전체 AI 보고서 생성 한도에 도달했습니다. 내일 다시 이용해 주세요.',
        3: '같은 프로그램의 AI 보고서가 이미 생성 중입니다. 잠시 후 다시 확인해 주세요.',
    }
    if code in errors:
        raise HTTPException(status_code=429, detail=errors[code])
    if code != 0:
        raise HTTPException(status_code=503, detail='AI 사용량 확인에 실패했습니다.')
    return Reservation(lock_key=lock_key, token=token)


def release(reservation: Reservation):
    """요청 종료 후 자신의 중복 실행 잠금만 해제한다."""
    try:
        _redis_command('EVAL', _RELEASE_LUA, 1, reservation.lock_key, reservation.token)
    except HTTPException:
        # 잠금에는 TTL이 있어 일시적인 Redis 장애로 영구 잠금이 되지는 않는다.
        pass
