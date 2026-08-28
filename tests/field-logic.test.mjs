import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedWords, isUsefulPage, logicalRadius } from '../apps/worker/src/index.ts';

test('boundedWords never exceeds the retrieval contract', () => {
  const text = Array.from({length: 140}, (_, i) => `w${i}`).join(' ');
  assert.equal(boundedWords(text, 110).split(/\s+/).length, 110);
});

test('Taft-style census settlement stubs are rejected as weak evidence', () => {
  const extract = 'Aliabadak is a village in Aliabad Rural District, in the Central District of Taft County, Yazd Province, Iran. At the 2006 census, its population was 120, in 45 families.';
  assert.equal(isUsefulPage({ title: 'Aliabadak', extract }), false);
});

test('materially descriptive local pages survive the pre-Gatherer filter', () => {
  const extract = 'The Jameh Mosque is a historic religious complex in the Taft area. Its courtyard, prayer hall, brickwork, plaster surfaces, entrances, structural bays and later repairs record several phases of local building practice. The complex occupies a distinct site within the settlement and its fabric contains material evidence beyond administrative description or a census count. Architectural details, spatial organization, inscriptions, restoration history and the relation between interior and exterior spaces make the page usable as local evidence for a nearby field.';
  assert.equal(isUsefulPage({ title: 'Jameh Mosque of Eslamiyeh', extract }), true);
});

test('logical radius stops at the smallest radius with three useful candidates', () => {
  const mk = (m) => ({ distance_from_anchor_m: m });
  assert.equal(logicalRadius([mk(100),mk(600),mk(900),mk(4000)]), 1000);
  assert.equal(logicalRadius([mk(100),mk(1500),mk(2800),mk(7000)]), 3000);
  assert.equal(logicalRadius([mk(100),mk(3100),mk(7000)]), 10000);
});
