import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import worker from '../apps/worker/src/index.ts';
import { NINEROUTER_DEFAULT_MODEL, OPENROUTER_DEFAULT_MODEL, providerChain } from '../apps/worker/src/round2.ts';

const root = path.resolve(import.meta.dirname, '..');
const field = JSON.parse(fs.readFileSync(path.join(root, 'fixtures/harpers-ferry/candidate_field.json'), 'utf8'));
const gatherer = JSON.parse(fs.readFileSync(path.join(root, 'fixtures/harpers-ferry/gatherer.json'), 'utf8'));

function jsonReq(url, body) { return new Request(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }

function sseResponse(chunks, status = 200) {
  const body = chunks.map(c => `data: ${c}\n\n`).join('') + 'data: [DONE]\n\n';
  return new Response(body, { status, headers: { 'content-type': 'text/event-stream' } });
}

function withMockFetch(handler, fn) {
  const realFetch = globalThis.fetch;
  globalThis.fetch = handler;
  return Promise.resolve().then(fn).finally(() => { globalThis.fetch = realFetch; });
}

const NINE_ENV = { NINEROUTER_BASE_URL: 'https://nine.test', NINEROUTER_API_KEY: 'k9' };

test('Gatherer via 9router assembles SSE deltas and uses muse-spark medium', async () => {
  const full = JSON.stringify(gatherer);
  const mid = Math.floor(full.length / 2);
  const seen = {};
  await withMockFetch(async (url, init) => {
    seen.url = String(url);
    const body = JSON.parse(init.body);
    seen.body = body;
    const part1 = JSON.stringify({ choices: [{ delta: { content: full.slice(0, mid) } }] });
    const part2 = JSON.stringify({ choices: [{ delta: { content: full.slice(mid) } }], usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 } });
    return sseResponse([part1, part2]);
  }, async () => {
    const res = await worker.fetch(jsonReq('https://nf.test/api/gather', { run_id: 'R9-1', field }), NINE_ENV);
    assert.equal(res.status, 200);
    const out = await res.json();
    assert.equal(out.meta.provider, 'ninerouter');
    assert.equal(out.meta.model, NINEROUTER_DEFAULT_MODEL);
    assert.deepEqual(out.gatherer.selected_places.map(p => p.place_id), gatherer.selected_places.map(p => p.place_id));
  });
  assert.equal(seen.url, 'https://nine.test/v1/chat/completions');
  assert.equal(seen.body.stream, true);
  assert.equal(seen.body.reasoning_effort, 'medium');
  assert.equal(seen.body.model, NINEROUTER_DEFAULT_MODEL);
});

test('Gatherer via 9router surfaces provider error envelopes honestly', async () => {
  await withMockFetch(async () => {
    const err1 = JSON.stringify({ error: { message: 'upstream overloaded', code: 503 } });
    const err2 = JSON.stringify({ error: { message: 'upstream overloaded', code: 503 } });
    // attempt 1 then retry attempt 2, both error envelopes
    withMockFetch.calls = (withMockFetch.calls || 0) + 1;
    return sseResponse([withMockFetch.calls === 1 ? err1 : err2]);
  }, async () => {
    const res = await worker.fetch(jsonReq('https://nf.test/api/gather', { run_id: 'R9-2', field }), NINE_ENV);
    assert.equal(res.status, 422);
    const out = await res.json();
    assert.match(out.error, /upstream overloaded/);
    assert.ok(!/output must be an object/.test(out.error));
  });
});

test('providerChain prefers 9router, then OpenRouter, then Workers AI, filtered to what is configured', () => {
  assert.deepEqual(providerChain({ NINEROUTER_API_KEY: 'k', NINEROUTER_BASE_URL: 'u', OPENROUTER_API_KEY: 'o', AI: {} }), ['ninerouter', 'openrouter', 'workers-ai']);
  assert.deepEqual(providerChain({ OPENROUTER_API_KEY: 'o', AI: {} }), ['openrouter', 'workers-ai']);
  assert.deepEqual(providerChain({ NINEROUTER_API_KEY: 'k', AI: {} }), ['workers-ai'], '9router needs BOTH key and base URL');
  assert.deepEqual(providerChain({ OPENROUTER_API_KEY: 'o' }), ['openrouter']);
  assert.deepEqual(providerChain({}), ['workers-ai'], 'never empty');
});

test('9router transport failure falls through to OpenRouter, deployed sites stay up', async () => {
  const seen = { nine: 0, or: null };
  await withMockFetch(async (url, init) => {
    const u = String(url);
    if (u.includes('nine.test')) { seen.nine += 1; return new Response('gateway down', { status: 502 }); }
    if (u.includes('openrouter.ai')) {
      seen.or = JSON.parse(init.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(gatherer) } }], usage: { total_tokens: 42 } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    throw new Error('unexpected fetch ' + u);
  }, async () => {
    const res = await worker.fetch(jsonReq('https://nf.test/api/gather', { run_id: 'R9-3', field }), { NINEROUTER_BASE_URL: 'https://nine.test', NINEROUTER_API_KEY: 'k9', OPENROUTER_API_KEY: 'or-key' });
    assert.equal(res.status, 200);
    const out = await res.json();
    assert.equal(out.meta.provider, 'openrouter');
    assert.equal(out.meta.model, OPENROUTER_DEFAULT_MODEL);
  });
  assert.equal(seen.nine, 2, '9router gets both of its attempts before the chain drops down');
  assert.equal(seen.or.model, OPENROUTER_DEFAULT_MODEL);
  assert.equal(seen.or.stream, false);
  assert.equal(seen.or.reasoning.effort, 'low');
});
