import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../apps/worker/src/index.ts';

const long = (s) => `${s} ` + Array.from({length: 75}, (_,i)=>`material${i}`).join(' ');

function mockWikipediaFetch() {
  return async (input) => {
    const u = new URL(String(input));
    const list = u.searchParams.get('list');
    const prop = u.searchParams.get('prop');
    if (list === 'geosearch') {
      return Response.json({ query: { geosearch: [
        {pageid:1,title:'Taft, Iran',lat:31.74944,lon:54.20889,dist:0},
        {pageid:2,title:'Aliabadak',lat:31.75,lon:54.22,dist:1336},
        {pageid:3,title:'Hoseyni',lat:31.76,lon:54.24,dist:3129},
        {pageid:4,title:'Khalilabad',lat:31.77,lon:54.25,dist:4399},
        {pageid:5,title:'Mobarakeh',lat:31.79,lon:54.22,dist:4560},
        {pageid:6,title:'Cham',lat:31.80,lon:54.18,dist:6467},
        {pageid:7,title:'Zeynabad',lat:31.81,lon:54.27,dist:7721},
        {pageid:8,title:'Jameh Mosque of Eslamiyeh',lat:31.82,lon:54.24,dist:9992}
      ]}});
    }
    if (list === 'search') {
      return Response.json({query:{search:[{pageid:100,title:'Qanat'}]}});
    }
    if (prop?.includes('extracts') && u.searchParams.get('pageids')?.includes('1|2|3')) {
      const stub=(title)=>`${title} is a village in a rural district in Taft County, Yazd Province, Iran. At the 2006 census, its population was 120, in 45 families.`;
      return Response.json({query:{pages:[
        {pageid:1,title:'Taft, Iran',extract:'Taft is a city in Yazd province and the capital of Taft County. It lies southwest of Yazd and contains historic gardens, water systems, streets, religious buildings and neighborhoods that connect the city to surrounding agricultural land.'},
        {pageid:2,title:'Aliabadak',extract:stub('Aliabadak')},
        {pageid:3,title:'Hoseyni',extract:stub('Hoseyni')},
        {pageid:4,title:'Khalilabad',extract:stub('Khalilabad')},
        {pageid:5,title:'Mobarakeh',extract:stub('Mobarakeh')},
        {pageid:6,title:'Cham',extract:stub('Cham')},
        {pageid:7,title:'Zeynabad',extract:stub('Zeynabad')},
        {pageid:8,title:'Jameh Mosque of Eslamiyeh',extract:long('The Jameh Mosque of Eslamiyeh is a historic religious and architectural complex near Taft with a courtyard, prayer space, brickwork, plaster and multiple building phases.')}
      ]}});
    }
    if (prop?.includes('extracts') && u.searchParams.get('pageids') === '100') {
      return Response.json({query:{pages:[{pageid:100,title:'Qanat',extract:long('A qanat is an underground water system. Watermills were positioned in relation to qanat outflow; at Taft the water passed through mills before irrigating fields.')} ]}});
    }
    throw new Error(`Unhandled Wikipedia mock: ${u}`);
  };
}

test('exact Worker /api/field route keeps Taft sparse and enrichment off-map', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = mockWikipediaFetch();
  try {
    const req = new Request('https://worker.test/api/field', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lat: 31.74944, lon: 54.20889, label: 'Taft, Iran', date: '2026-08-26' })
    });
    const res = await worker.fetch(req, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.current_date, '2026-08-26');
    assert.equal(body.logical_radius_m, 10000);
    assert.equal(body.sparse, true);
    assert.ok(body.candidate_pages.length < 3);
    assert.ok(body.candidate_pages.every((c)=>Number.isFinite(c.latitude)&&Number.isFinite(c.longitude)));
    assert.equal(body.enrichment[0].title, 'Qanat');
    assert.equal('latitude' in body.enrichment[0], false);
    assert.equal('longitude' in body.enrichment[0], false);
  } finally { globalThis.fetch = realFetch; }
});

test('exact Worker /api/search fallback returns coordinate-bearing place candidates without a geocoder key', async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const u = new URL(String(input));
    if (u.searchParams.get('list') === 'search') {
      return Response.json({query:{search:[{pageid:42,title:'Taft, Iran'}]}});
    }
    if (u.searchParams.get('prop') === 'coordinates|pageterms') {
      return Response.json({query:{pages:[{pageid:42,title:'Taft, Iran',coordinates:[{lat:31.74944,lon:54.20889}],terms:{description:['city in Yazd province, Iran']}}]}});
    }
    throw new Error(`Unhandled search mock: ${u}`);
  };
  try {
    const res = await worker.fetch(new Request('https://worker.test/api/search?q=Taft'), {});
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.provider, 'wikipedia-coordinate-fallback');
    assert.equal(body.results.length, 1);
    assert.equal(body.results[0].label, 'Taft, Iran');
    assert.equal(body.results[0].coordinate.lat, 31.74944);
  } finally { globalThis.fetch = realFetch; }
});
