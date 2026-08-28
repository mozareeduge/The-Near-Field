import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GATHERER_PROMPT, SYNTHESIZER_PROMPT } from '../apps/worker/src/round2.ts';

test('embedded Gatherer role matches canonical skill reference', () => {
  assert.equal(GATHERER_PROMPT.trim(), fs.readFileSync('packages/nearby-narrative/references/GATHERER.md','utf8').trim());
});

test('embedded Synthesizer role matches canonical skill reference', () => {
  assert.equal(SYNTHESIZER_PROMPT.trim(), fs.readFileSync('packages/nearby-narrative/references/SYNTHESIZER.md','utf8').trim());
});
