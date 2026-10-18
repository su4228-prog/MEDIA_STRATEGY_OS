import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPrograms, PROGRAM_LOAD_POLICY } from '../src/utils/loadPrograms.js';

const programs = Array.from({ length: 17 }, (_, i) => ({ program_id: `MBN${i + 1}` }));
const ok = () => Response.json({ programs });
const fast = { timeoutMs: 100, maxElapsedMs: 1_000, delaysMs: [1, 2, 4, 8] };

test('normal response loads 17 programs once with GET', async () => {
  let calls = 0;
  const result = await loadPrograms({ fetchImpl: async (url, options) => {
    calls += 1;
    assert.equal(url, '/api/v1/programs');
    assert.equal(options.method, 'GET');
    return ok();
  } });
  assert.equal(result.length, 17);
  assert.equal(calls, 1);
});

test('network error and 503 recover without duplicate rows', async () => {
  let calls = 0;
  let retries = 0;
  const result = await loadPrograms({ policy: fast, onRetry: () => retries++, fetchImpl: async () => {
    calls += 1;
    if (calls === 1) throw new TypeError('offline');
    if (calls === 2) return new Response('', { status: 503 });
    return ok();
  } });
  assert.deepEqual(result, programs);
  assert.equal(calls, 3);
  assert.equal(retries, 2);
});

for (const status of [408, 425, 429, 500, 502, 504]) {
  test(`temporary HTTP ${status} retries`, async () => {
    let calls = 0;
    await loadPrograms({ policy: fast, fetchImpl: async () => ++calls === 1 ? new Response('', { status }) : ok() });
    assert.equal(calls, 2);
  });
}

for (const status of [400, 401, 403, 404, 422]) {
  test(`permanent HTTP ${status} stops immediately`, async () => {
    let calls = 0;
    await assert.rejects(loadPrograms({ policy: fast, fetchImpl: async () => {
      calls += 1;
      return new Response('', { status });
    } }));
    assert.equal(calls, 1);
  });
}

test('exhausted retries stop; a manual new load can succeed', async () => {
  let calls = 0;
  await assert.rejects(loadPrograms({ policy: fast, fetchImpl: async () => {
    calls += 1;
    throw new TypeError('offline');
  } }));
  assert.equal(calls, 5);
  assert.deepEqual(await loadPrograms({ fetchImpl: async () => ok() }), programs);
});

test('timeout aborts the request and can recover', async () => {
  let calls = 0;
  const result = await loadPrograms({ policy: { ...fast, timeoutMs: 5 }, fetchImpl: async (_, { signal }) => {
    calls += 1;
    if (calls > 1) return ok();
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } });
  assert.deepEqual(result, programs);
  assert.equal(calls, 2);
});

test('navigation/unmount aborts an active request without retrying', async () => {
  const controller = new AbortController();
  let calls = 0;
  const promise = loadPrograms({ signal: controller.signal, policy: fast, fetchImpl: async (_, { signal }) => {
    calls += 1;
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } });
  controller.abort();
  await assert.rejects(promise, { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('navigation/unmount also cancels the retry wait', async () => {
  const controller = new AbortController();
  let calls = 0;
  const promise = loadPrograms({ signal: controller.signal, policy: fast, onRetry: () => controller.abort(), fetchImpl: async () => {
    calls += 1;
    throw new TypeError('offline');
  } });
  await assert.rejects(promise, { name: 'AbortError' });
  assert.equal(calls, 1);
});

test('total deadline bounds repeated timeouts', async () => {
  let calls = 0;
  const started = Date.now();
  await assert.rejects(loadPrograms({ policy: { timeoutMs: 50, maxElapsedMs: 25, delaysMs: [1, 2, 4, 8] }, fetchImpl: async (_, { signal }) => {
    calls += 1;
    return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
  } }));
  assert.equal(calls, 1);
  assert.ok(Date.now() - started < 500);
  assert.equal(PROGRAM_LOAD_POLICY.maxElapsedMs, 110_000);
  assert.equal(PROGRAM_LOAD_POLICY.delaysMs.length + 1, 8);
  const retryWindow = PROGRAM_LOAD_POLICY.delaysMs.reduce((sum, delay) => sum + delay, 0);
  assert.ok(retryWindow >= 90_000 && retryWindow < PROGRAM_LOAD_POLICY.maxElapsedMs);
});

test('invalid data is not retried or silently treated as an empty list', async () => {
  let calls = 0;
  await assert.rejects(loadPrograms({ policy: fast, fetchImpl: async () => {
    calls += 1;
    return Response.json({ detail: 'invalid' });
  } }));
  assert.equal(calls, 1);
});
