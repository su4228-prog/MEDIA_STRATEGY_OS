// 무료 프로그램 조회 전용 재시도입니다. AI 생성 등 POST 요청에는 사용하지 않습니다.
export const PROGRAM_LOAD_POLICY = {
  timeoutMs: 18_000,
  maxElapsedMs: 110_000,
  // 즉시 503이 반복돼도 서버가 깨어날 시간을 확보하고 간격은 최대 24초로 제한합니다.
  delaysMs: [2_000, 4_000, 8_000, 16_000, 24_000, 24_000, 24_000],
};

class ProgramLoadError extends Error {
  constructor(retryable) {
    super('Program data unavailable');
    this.retryable = retryable;
  }
}

function abortReason(signal) {
  return signal?.reason ?? new DOMException('Request cancelled', 'AbortError');
}

function waitForRetry(delayMs, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortReason(signal));
    const cancel = () => {
      clearTimeout(timer);
      reject(abortReason(signal));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    }, delayMs);
    signal?.addEventListener('abort', cancel, { once: true });
  });
}

/** GET 한 건씩만 실행하고 성공·취소·횟수/시간 한도 도달 시 즉시 종료합니다. */
export async function loadPrograms({
  signal,
  onRetry = () => {},
  fetchImpl = globalThis.fetch,
  policy = PROGRAM_LOAD_POLICY,
} = {}) {
  const deadline = Date.now() + policy.maxElapsedMs;

  for (let attempt = 0; attempt <= policy.delaysMs.length; attempt += 1) {
    if (signal?.aborted) throw abortReason(signal);
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw new ProgramLoadError(false);

    const request = new AbortController();
    const cancel = () => request.abort(abortReason(signal));
    signal?.addEventListener('abort', cancel, { once: true });
    let timedOut = false;
    // 응답 헤더뿐 아니라 JSON 본문 수신까지 한 요청의 제한 시간에 포함합니다.
    const timer = setTimeout(() => {
      timedOut = true;
      request.abort();
    }, Math.min(policy.timeoutMs, remainingMs));

    try {
      const response = await fetchImpl('/api/v1/programs', {
        method: 'GET',
        signal: request.signal,
      });
      if (!response.ok) {
        const retryable = [408, 425, 429].includes(response.status)
          || (response.status >= 500 && response.status <= 599);
        throw new ProgramLoadError(retryable);
      }
      const data = await response.json();
      if (signal?.aborted) throw abortReason(signal);
      if (!Array.isArray(data.programs)) throw new ProgramLoadError(false);
      return data.programs;
    } catch (error) {
      if (signal?.aborted) throw abortReason(signal);
      const retryable = timedOut || error instanceof TypeError
        || (error instanceof ProgramLoadError && error.retryable);
      if (!retryable || attempt === policy.delaysMs.length) throw error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
    }

    const delayMs = policy.delaysMs[attempt];
    if (Date.now() + delayMs >= deadline) throw new ProgramLoadError(false);
    onRetry();
    await waitForRetry(delayMs, signal);
  }
}
