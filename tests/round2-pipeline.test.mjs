import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import worker from '../apps/worker/src/index.ts';
import { buildSynthInput, validateGatherer, validateSynthesis } from '../apps/worker/src/round2.ts';

const root = path.resolve(import.meta.dirname, '..');
const field = JSON.parse(fs.readFileSync(path.join(root,'fixtures/harpers-ferry/candidate_field.json'),'utf8'));
const gatherer = JSON.parse(fs.readFileSync(path.join(root,'fixtures/harpers-ferry/gatherer.json'),'utf8'));

function jsonReq(url, body) { return new Request(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}); }
function aiSequence(outputs) {
  let i=0; const calls=[];
  return { calls, async run(model,input){ calls.push({model,input}); const output=outputs[Math.min(i++,outputs.length-1)]; return {response:structuredClone(output),usage:{prompt_tokens:111,completion_tokens:77,total_tokens:188}}; } };
}

function synthFixture() {
  const paragraph = 'Mara waited beside Harpers Ferry station with the box already retaped twice. At Jefferson Rock she set it down to press the split seam flat, then carried it uphill toward Lockwood House with one jar moved into her tote, where it knocked against her keys as she walked.';
  const bindings=[];
  for (const [place_id,text,evidence_ids] of [
    ['P01','Harpers Ferry station',['F01']],['P02','Jefferson Rock',['D03']],['P03','Lockwood House',['F05']]
  ]) { const start=paragraph.indexOf(text); bindings.push({place_id,relation:'mention',start,end:start+text.length,evidence_ids}); }
  return {paragraph,used_place_ids:['P01','P02','P03'],bindings};
}

test('Gatherer validation rejects unknown candidate IDs',()=>{
  const bad=structuredClone(gatherer); bad.selected_places[0].source_candidate_id='C99';
  assert.ok(validateGatherer(bad,field).some(x=>x.includes('unknown source_candidate_id C99')));
});

test('Gatherer endpoint retries once then accepts corrected known IDs', async()=>{
  const bad=structuredClone(gatherer); bad.selected_places[0].source_candidate_id='C99';
  const ai=aiSequence([bad,gatherer]);
  const res=await worker.fetch(jsonReq('https://nf.test/api/gather',{run_id:'R2-TEST',field,anchor_granularity:'town'}),{AI:ai});
  assert.equal(res.status,200); const body=await res.json();
  assert.equal(body.meta.attempts,2); assert.equal(body.gatherer.selected_places.length,3); assert.equal(ai.calls.length,2);
  const userPayload=JSON.parse(ai.calls[0].input.messages[1].content);
  assert.equal(userPayload.candidate_pages.length,3);
  assert.equal('route' in userPayload,false); assert.equal('search_history' in userPayload,false);
});

test('Gatherer endpoint stays red after one bounded retry', async()=>{
  const bad=structuredClone(gatherer); bad.selected_places[0].source_candidate_id='C99';
  const ai=aiSequence([bad,bad,bad]);
  const res=await worker.fetch(jsonReq('https://nf.test/api/gather',{run_id:'R2-BAD',field}),{AI:ai});
  assert.equal(res.status,422); const body=await res.json(); assert.ok(body.validation_errors.some(x=>x.includes('C99'))); assert.equal(ai.calls.length,2);
});

test('Movement without routing evidence is relational-unverified, never VERIFIED', async()=>{
  const res=await worker.fetch(jsonReq('https://nf.test/api/movement',{anchor:field.anchor,field,gatherer}),{});
  assert.equal(res.status,200); const body=await res.json();
  assert.equal(body.movement.state,'RELATIONAL_UNVERIFIED'); assert.equal(body.movement.route_verified,false); assert.equal(body.route_geometry,null);
  assert.deepEqual(new Set(body.movement.order),new Set(['P01','P02','P03']));
});

test('Movement becomes VERIFIED only with exact ORS matrix + directions evidence', async()=>{
  const realFetch=globalThis.fetch; const calls=[];
  globalThis.fetch=async (url,init)=>{
    calls.push(String(url));
    if(String(url).includes('/matrix/')) return new Response(JSON.stringify({distances:[[0,180,410],[180,0,230],[410,230,0]],durations:[[0,160,370],[160,0,210],[370,210,0]]}),{status:200,headers:{'content-type':'application/json'}});
    if(String(url).includes('/directions/')) return new Response(JSON.stringify({features:[{geometry:{type:'LineString',coordinates:[[-77.73111,39.32444],[-77.733278,39.322611],[-77.73549,39.32371]]},properties:{summary:{distance:410,duration:370},segments:[{distance:180,duration:160},{distance:230,duration:210}]}}]}),{status:200,headers:{'content-type':'application/json'}});
    throw new Error('unexpected fetch '+url);
  };
  try {
    const res=await worker.fetch(jsonReq('https://nf.test/api/movement',{anchor:field.anchor,field,gatherer}),{ORS_API_KEY:'test-key'});
    assert.equal(res.status,200); const body=await res.json();
    assert.equal(body.movement.state,'VERIFIED'); assert.equal(body.movement.route_verified,true); assert.equal(body.route_geometry.provider,'openrouteservice'); assert.equal(body.route_geometry.geojson.type,'LineString'); assert.equal(calls.length,2);
  } finally { globalThis.fetch=realFetch; }
});

test('ORS directions failure downgrades to relational-unverified', async()=>{
  const realFetch=globalThis.fetch;
  globalThis.fetch=async (url)=> String(url).includes('/matrix/')
    ? new Response(JSON.stringify({distances:[[0,180,410],[180,0,230],[410,230,0]],durations:[[0,160,370],[160,0,210],[370,210,0]]}),{status:200})
    : new Response('no route',{status:503});
  try {
    const res=await worker.fetch(jsonReq('https://nf.test/api/movement',{anchor:field.anchor,field,gatherer}),{ORS_API_KEY:'test-key'});
    const body=await res.json(); assert.equal(body.movement.state,'RELATIONAL_UNVERIFIED'); assert.equal(body.route_geometry,null);
  } finally { globalThis.fetch=realFetch; }
});

test('Synth input boundary excludes raw candidates, extracts and route geometry',()=>{
  const movement={state:'RELATIONAL_UNVERIFIED',route_verified:false,order:['P01','P02','P03'],total_distance_m:400,legs:[{from:'P01',to:'P02',distance_m:180},{from:'P02',to:'P03',distance_m:220}]};
  const input=buildSynthInput('R2',field,gatherer,movement); const text=JSON.stringify(input);
  assert.equal('candidate_pages' in input,false); assert.equal('enrichment' in input,false); assert.equal(text.includes(field.candidate_pages[0].extract),false); assert.equal(text.includes('geojson'),false);
});

test('Synthesizer endpoint returns required validated bindings', async()=>{
  const output=synthFixture(), ai=aiSequence([output]);
  const movement={state:'RELATIONAL_UNVERIFIED',route_verified:false,order:['P01','P02','P03'],total_distance_m:400,legs:[{from:'P01',to:'P02',distance_m:180},{from:'P02',to:'P03',distance_m:220}]};
  const res=await worker.fetch(jsonReq('https://nf.test/api/synthesize',{run_id:'R2-SYNTH',field,gatherer,movement}),{AI:ai});
  assert.equal(res.status,200); const body=await res.json(); assert.equal(body.result.bindings.length,3); assert.equal(body.result.paragraph,output.paragraph);
  const payload=JSON.parse(ai.calls[0].input.messages[1].content); assert.equal('candidate_pages' in payload,false); assert.equal(payload.movement.route_verified,false);
});

test('Invalid paragraph binding is a red test', async()=>{
  const bad=synthFixture(); bad.bindings[0].end=bad.paragraph.length+20;
  assert.ok(validateSynthesis(bad,gatherer).some(x=>x.includes('offsets invalid')));
  const ai=aiSequence([bad,bad]);
  const movement={state:'NONE',route_verified:false,order:['P01'],total_distance_m:0,legs:[]};
  const res=await worker.fetch(jsonReq('https://nf.test/api/synthesize',{field,gatherer,movement}),{AI:ai});
  assert.equal(res.status,422); assert.equal(ai.calls.length,2);
});

test('Movement rejects a selected-places packet that was never validated against the supplied field', async()=>{
  // A client could skip /api/gather entirely and post arbitrary coordinates
  // disguised as "selected_places" straight to /api/movement. This must be
  // revalidated against the real field, exactly like Synthesizer does.
  const forged=structuredClone(gatherer);
  forged.selected_places[0].latitude = forged.selected_places[0].latitude + 5;
  const res=await worker.fetch(jsonReq('https://nf.test/api/movement',{anchor:field.anchor,field,gatherer:forged}),{});
  assert.equal(res.status,422);
  const body=await res.json();
  assert.ok(body.validation_errors.some(x=>x.includes('coordinate mismatch')));
});

test('Movement requires field in the request body (cannot be omitted to skip revalidation)', async()=>{
  const res=await worker.fetch(jsonReq('https://nf.test/api/movement',{anchor:field.anchor,gatherer}),{});
  assert.equal(res.status,400);
});

test('Taft enrichment cannot enter movement because movement accepts selected geographic places only', async()=>{
  const taftField=JSON.parse(fs.readFileSync(path.join(root,'packages/nearby-narrative/tests/fixtures/taft-candidate.json'),'utf8'));
  const taftGather=JSON.parse(fs.readFileSync(path.join(root,'packages/nearby-narrative/tests/fixtures/taft-gatherer.json'),'utf8'));
  const res=await worker.fetch(jsonReq('https://nf.test/api/movement',{anchor:taftField.anchor,field:taftField,gatherer:taftGather}),{}); const body=await res.json();
  assert.equal(body.movement.state,'NONE'); assert.deepEqual(body.movement.order,['P01']); assert.equal(JSON.stringify(body).includes('E01'),false);
});
