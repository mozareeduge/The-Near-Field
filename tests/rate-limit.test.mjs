import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRateLimit, RateLimiter, DEFAULT_RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_WINDOW_S } from '../apps/worker/src/rate-limit.ts';
import worker from '../apps/worker/src/index.ts';

test('evaluateRateLimit allows up to max requests inside the window, then blocks', () => {
  let timestamps = [];
  const now = 1_000_000;
  for (let i = 0; i < 5; i++) {
    const decision = evaluateRateLimit(timestamps, now, 60_000, 5);
    assert.equal(decision.allowed, true, `request ${i + 1} of 5 should be allowed`);
    timestamps = decision.timestamps;
  }
  const sixth = evaluateRateLimit(timestamps, now, 60_000, 5);
  assert.equal(sixth.allowed, false);
  assert.equal(sixth.remaining, 0);
  assert.equal(sixth.retryAfterSeconds, 60, 'the oldest of 5 requests all made at `now` expires exactly one window later');
});

test('evaluateRateLimit evicts timestamps once the window has passed', () => {
  const now = 1_000_000;
  const timestamps = [now - 61_000, now - 61_000, now - 61_000];
  const decision = evaluateRateLimit(timestamps, now, 60_000, 3);
  assert.equal(decision.allowed, true, 'all three prior timestamps fell outside a 60s window and must not count');
  assert.deepEqual(decision.timestamps, [now]);
});

test('evaluateRateLimit retryAfterSeconds counts down to the oldest timestamp leaving the window', () => {
  const now = 1_000_000;
  const timestamps = [now - 50_000];
  const decision = evaluateRateLimit(timestamps, now, 60_000, 1);
  assert.equal(decision.allowed, false);
  assert.equal(decision.retryAfterSeconds, 10);
});

function makeRateLimiterNamespace() {
  const instances = new Map();
  return {
    idFromName(name) { return name; },
    get(id) {
      if (!instances.has(id)) {
        const store = new Map();
        const state = { storage: {
          async get(key) { return store.get(key); },
          async put(key, value) { store.set(key, value); }
        } };
        instances.set(id, new RateLimiter(state));
      }
      const instance = instances.get(id);
      return { fetch: (url, init) => instance.fetch(new Request(url, init)) };
    }
  };
}

test('worker.fetch enforces the rate limit per client IP on /api/ routes when RATE_LIMITER is bound', async () => {
  const env = { RATE_LIMITER: makeRateLimiterNamespace(), RATE_LIMIT_MAX: '3', RATE_LIMIT_WINDOW_S: '60' };
  const req = () => new Request('https://worker.test/api/search?q=a', { headers: { 'cf-connecting-ip': '203.0.113.1' } });

  for (let i = 0; i < 3; i++) {
    const res = await worker.fetch(req(), env);
    assert.equal(res.status, 200, `request ${i + 1} of 3 should pass`);
  }
  const blocked = await worker.fetch(req(), env);
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get('retry-after'), 'a 429 must carry a Retry-After header');
  const body = await blocked.json();
  assert.match(body.error, /Rate limit exceeded/);
});

test('worker.fetch rate limit is scoped per client IP, not global', async () => {
  const env = { RATE_LIMITER: makeRateLimiterNamespace(), RATE_LIMIT_MAX: '1', RATE_LIMIT_WINDOW_S: '60' };
  const reqFor = (ip) => new Request('https://worker.test/api/search?q=a', { headers: { 'cf-connecting-ip': ip } });

  const first = await worker.fetch(reqFor('203.0.113.1'), env);
  assert.equal(first.status, 200);
  const secondSameIp = await worker.fetch(reqFor('203.0.113.1'), env);
  assert.equal(secondSameIp.status, 429);
  const otherIp = await worker.fetch(reqFor('198.51.100.7'), env);
  assert.equal(otherIp.status, 200, 'a different client IP has its own independent limit');
});

test('/health is never rate limited even when the client is throttled on /api/ routes', async () => {
  const env = { RATE_LIMITER: makeRateLimiterNamespace(), RATE_LIMIT_MAX: '1', RATE_LIMIT_WINDOW_S: '60' };
  const ip = '203.0.113.1';
  await worker.fetch(new Request('https://worker.test/api/search?q=a', { headers: { 'cf-connecting-ip': ip } }), env);
  const blocked = await worker.fetch(new Request('https://worker.test/api/search?q=a', { headers: { 'cf-connecting-ip': ip } }), env);
  assert.equal(blocked.status, 429);
  const health = await worker.fetch(new Request('https://worker.test/health', { headers: { 'cf-connecting-ip': ip } }), env);
  assert.equal(health.status, 200);
});

test('rate limiting is a no-op when RATE_LIMITER is unbound (local/dev-only default)', async () => {
  const req = () => new Request('https://worker.test/api/search?q=a', { headers: { 'cf-connecting-ip': '203.0.113.1' } });
  for (let i = 0; i < 10; i++) {
    const res = await worker.fetch(req(), {});
    assert.equal(res.status, 200, 'without a RATE_LIMITER binding, requests are never throttled (matches the ALLOWED_ORIGINS dev-open pattern)');
  }
});

test('/health reports whether rate limiting is active', async () => {
  const withLimiter = await worker.fetch(new Request('https://worker.test/health'), { RATE_LIMITER: makeRateLimiterNamespace() });
  assert.equal((await withLimiter.json()).rateLimited, true);
  const without = await worker.fetch(new Request('https://worker.test/health'), {});
  assert.equal((await without.json()).rateLimited, false);
});

test('default constants match documented production defaults', () => {
  assert.equal(DEFAULT_RATE_LIMIT_MAX, 60);
  assert.equal(DEFAULT_RATE_LIMIT_WINDOW_S, 300);
});
