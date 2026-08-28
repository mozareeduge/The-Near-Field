import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../apps/worker/src/index.ts';
import { handleGather } from '../apps/worker/src/round2.ts';

test('exact coordinates cannot enter /api/field via a GET query string', async () => {
  const req = new Request('https://worker.test/api/field?lat=39.3&lon=-77.7');
  const res = await worker.fetch(req, {});
  assert.equal(res.status, 404, 'GET must not be routed -- only POST with a JSON body is accepted');
});

test('CORS reflects any origin when ALLOWED_ORIGINS is unset (dev-only default)', async () => {
  const req = new Request('https://worker.test/health', { headers: { Origin: 'https://evil.example' } });
  const res = await worker.fetch(req, {});
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://evil.example');
});

test('CORS allow-lists exact origins when ALLOWED_ORIGINS is configured, rejecting others', async () => {
  const allowed = new Request('https://worker.test/health', { headers: { Origin: 'https://nearby.example' } });
  const resAllowed = await worker.fetch(allowed, { ALLOWED_ORIGINS: 'https://nearby.example,https://staging.nearby.example' });
  assert.equal(resAllowed.headers.get('access-control-allow-origin'), 'https://nearby.example');

  const hostile = new Request('https://worker.test/health', { headers: { Origin: 'https://evil.example' } });
  const resHostile = await worker.fetch(hostile, { ALLOWED_ORIGINS: 'https://nearby.example,https://staging.nearby.example' });
  assert.equal(resHostile.headers.get('access-control-allow-origin'), null, 'a disallowed Origin gets no allow-origin header, so the browser blocks the response');
  assert.equal(resHostile.status, 200, 'the request itself still succeeds server-side -- the browser enforces CORS, not the server');
});

test('API responses are marked no-store', async () => {
  const res = await worker.fetch(new Request('https://worker.test/health'), {});
  assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('oversized /api/gather request body is rejected before JSON parsing', async () => {
  const oversized = 'x'.repeat(250_000);
  const req = new Request('https://worker.test/api/gather', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': String(oversized.length) },
    body: oversized
  });
  const res = await handleGather(req, {});
  assert.equal(res.status, 413);
});

test('malformed JSON body is a clean 400, not a thrown exception', async () => {
  const req = new Request('https://worker.test/api/gather', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{not valid json'
  });
  const res = await handleGather(req, {});
  assert.equal(res.status, 400);
});
