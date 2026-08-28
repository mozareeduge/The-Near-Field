const API = 'https://en.wikipedia.org/w/api.php';
const app = document.getElementById('app');
const mapEl = document.getElementById('map');
const tilesEl = document.getElementById('tiles');
const svg = document.getElementById('svg');
const orientationEl = document.getElementById('orientation');
const previewEl = document.getElementById('preview');
const registerEl = document.getElementById('register');
const ledgerEl = document.getElementById('ledger');
const inspectorEl = document.getElementById('inspector');
const enrichmentEl = document.getElementById('enrichment');
const newPlaceBtn = document.getElementById('new-place');
const queryEl = document.getElementById('place-search');
const resultsEl = document.getElementById('results');
const searchStateEl = document.getElementById('search-state');
const mapPickEl = document.getElementById('map-pick');

const params = new URLSearchParams(location.search);
const fixtureMode = params.get('fixture') || null;

const state = {
  phase:'orientation', center:{lat:31,lon:12}, zoom:2.2, pick:false, anchor:null,
  radius:null, candidates:[], field:null, active:null, dragging:false, dragStart:null
};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const words=(s,n)=>s.replace(/\s+/g,' ').trim().split(' ').slice(0,n).join(' ');
const urlForTitle=t=>`https://en.wikipedia.org/wiki/${encodeURIComponent(t.replace(/ /g,'_'))}`;
const coordLabel=c=>`${Math.abs(c.lat).toFixed(4)}°${c.lat>=0?'N':'S'} · ${Math.abs(c.lon).toFixed(4)}°${c.lon>=0?'E':'W'}`;
const distanceLabel=m=>m<1000?`${m} m`:`${(m/1000).toFixed(m<10000?1:0)} km`;

function worldPx(c,z){ const scale=256*Math.pow(2,z); const x=(c.lon+180)/360*scale; const sin=Math.sin(c.lat*Math.PI/180); const y=(0.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))*scale; return {x,y}; }
function lonLatFromWorld(x,y,z){ const scale=256*Math.pow(2,z); const lon=x/scale*360-180; const n=Math.PI-2*Math.PI*y/scale; const lat=180/Math.PI*Math.atan(Math.sinh(n)); return {lat,lon}; }
function project(c){ const center=worldPx(state.center,state.zoom), p=worldPx(c,state.zoom); return {x:mapEl.clientWidth/2+(p.x-center.x),y:mapEl.clientHeight/2+(p.y-center.y)}; }
function metersPerPixel(){ return Math.cos(state.center.lat*Math.PI/180)*2*Math.PI*6378137/(256*Math.pow(2,state.zoom)); }

function renderTiles(){
  // The deterministic fixture harness must be fully local so browser QA does
  // not depend on third-party tile availability. Live mode still renders OSM.
  if(fixtureMode){ tilesEl.replaceChildren(); return; }
  const z=Math.round(state.zoom); const center=worldPx(state.center,z); const w=mapEl.clientWidth,h=mapEl.clientHeight;
  const minX=Math.floor((center.x-w/2)/256),maxX=Math.floor((center.x+w/2)/256),minY=Math.floor((center.y-h/2)/256),maxY=Math.floor((center.y+h/2)/256);
  const n=Math.pow(2,z); const frag=document.createDocumentFragment(); tilesEl.replaceChildren();
  for(let x=minX;x<=maxX;x++) for(let y=minY;y<=maxY;y++){
    if(y<0||y>=n) continue; const tx=((x%n)+n)%n; const img=document.createElement('img'); img.alt=''; img.draggable=false;
    img.src=`https://tile.openstreetmap.org/${z}/${tx}/${y}.png`; img.style.left=`${x*256-(center.x-w/2)}px`; img.style.top=`${y*256-(center.y-h/2)}px`; frag.appendChild(img);
  }
  tilesEl.appendChild(frag);
}

function renderOverlay(){
  svg.replaceChildren();
  if(!state.anchor) return;
  const a=project(state.anchor.coordinate); const ns='http://www.w3.org/2000/svg';
  if(state.radius){ const c=document.createElementNS(ns,'circle'); c.setAttribute('cx',a.x); c.setAttribute('cy',a.y); c.setAttribute('r',state.radius/metersPerPixel()); c.setAttribute('fill','none'); c.setAttribute('stroke','#E8E6DF'); c.setAttribute('stroke-opacity','.22'); c.setAttribute('stroke-width','1'); c.setAttribute('stroke-dasharray','3 7'); svg.appendChild(c); }
  const h=document.createElementNS(ns,'path'); h.setAttribute('d',`M ${a.x-7} ${a.y} L ${a.x+7} ${a.y} M ${a.x} ${a.y-7} L ${a.x} ${a.y+7}`); h.setAttribute('stroke',state.phase==='orientation'||state.phase==='preview'?'#111413':'#E8E6DF'); h.setAttribute('stroke-width','1'); svg.appendChild(h);
  for(const cand of state.candidates){ const p=project({lat:cand.latitude,lon:cand.longitude}); const g=document.createElementNS(ns,'g'); g.style.pointerEvents='all'; g.style.cursor='pointer'; g.dataset.id=cand.candidate_id; const hit=document.createElementNS(ns,'circle'); hit.setAttribute('cx',p.x); hit.setAttribute('cy',p.y); hit.setAttribute('r','14'); hit.setAttribute('fill','transparent'); const dot=document.createElementNS(ns,'circle'); dot.setAttribute('cx',p.x); dot.setAttribute('cy',p.y); dot.setAttribute('r',state.active===cand.candidate_id?'5':'3'); dot.setAttribute('fill','#0B0C0C'); dot.setAttribute('stroke',state.active===cand.candidate_id?'#A9C7BE':'#B7BBB5'); dot.setAttribute('stroke-width',state.active===cand.candidate_id?'1.7':'1'); g.append(hit,dot); g.addEventListener('click',()=>showCandidate(cand.candidate_id)); svg.appendChild(g); }
}
function renderMap(){ renderTiles(); renderOverlay(); }
function setCenter(c,z=state.zoom){ state.center={...c}; state.zoom=clamp(z,2,17); renderMap(); }
function register(message,detail=''){ registerEl.hidden=false; registerEl.innerHTML=`<div class="register-line"><span class="register-pulse"></span>${esc(message)}</div>${detail?`<div class="register-detail">${esc(detail)}</div>`:''}`; }
function setPhase(p){ state.phase=p; app.className=`app phase-${p}`; mapEl.classList.toggle('field',!['orientation','preview'].includes(p)); }

mapEl.addEventListener('pointerdown',e=>{ if(e.target.closest('button,a')) return; state.dragging=true; state.dragStart={x:e.clientX,y:e.clientY,center:worldPx(state.center,state.zoom)}; mapEl.setPointerCapture(e.pointerId); });
mapEl.addEventListener('pointermove',e=>{ if(!state.dragging)return; const dx=e.clientX-state.dragStart.x,dy=e.clientY-state.dragStart.y; state.center=lonLatFromWorld(state.dragStart.center.x-dx,state.dragStart.center.y-dy,state.zoom); renderMap(); });
mapEl.addEventListener('pointerup',e=>{ state.dragging=false; try{mapEl.releasePointerCapture(e.pointerId)}catch{} });
mapEl.addEventListener('wheel',e=>{ e.preventDefault(); state.zoom=clamp(state.zoom+(e.deltaY<0?1:-1),2,17); renderMap(); },{passive:false});
document.getElementById('zoom-in').onclick=()=>{state.zoom=clamp(state.zoom+1,2,17);renderMap()};
document.getElementById('zoom-out').onclick=()=>{state.zoom=clamp(state.zoom-1,2,17);renderMap()};
window.addEventListener('resize',renderMap);

async function wiki(q){ const u=new URL(API); u.searchParams.set('origin','*'); u.searchParams.set('action','query'); u.searchParams.set('format','json'); u.searchParams.set('formatversion','2'); for(const[k,v]of Object.entries(q))u.searchParams.set(k,String(v)); const r=await fetch(u); if(!r.ok)throw new Error(`Wikipedia ${r.status}`); return r.json(); }

async function searchPlaces(q){
  if(fixtureMode==='taft') return [{id:'fixture:taft',label:'Taft, Iran',secondary:'City in Yazd province, Iran',coordinate:{lat:31.74944,lon:54.20889},granularity:'city'}];
  const s=await wiki({list:'search',srsearch:q,srnamespace:0,srlimit:16,srprop:'snippet'}); const hits=s.query?.search||[]; if(!hits.length)return[];
  const d=await wiki({pageids:hits.map(x=>x.pageid).join('|'),prop:'coordinates|pageterms',wbptterms:'description',coprimary:'primary'}); const rank=new Map(hits.map((x,i)=>[x.pageid,i]));
  return (d.query?.pages||[]).filter(p=>p.coordinates?.[0]).sort((a,b)=>(rank.get(a.pageid)??99)-(rank.get(b.pageid)??99)).slice(0,6).map(p=>({id:`wiki:${p.pageid}`,label:p.title,secondary:p.terms?.description?.[0]||null,coordinate:{lat:p.coordinates[0].lat,lon:p.coordinates[0].lon},granularity:'locality'}));
}
function useful(page){ const text=(page.extract||'').replace(/\s+/g,' ').trim(); const wc=text.split(/\s+/).filter(Boolean).length; if(page.pageprops?.disambiguation!==undefined||wc<24)return false; const stub=/(?:is a (?:village|city)|in .* district).*?(?:2006 census|national census|population was)/i.test(text); return !(stub&&wc<85); }
async function liveField(anchor){
  const g=await wiki({list:'geosearch',gscoord:`${anchor.coordinate.lat}|${anchor.coordinate.lon}`,gsradius:10000,gslimit:50,gsnamespace:0}); const geos=g.query?.geosearch||[];
  const d=geos.length?await wiki({pageids:geos.map(x=>x.pageid).join('|'),prop:'extracts|pageprops',exintro:1,explaintext:1}):{query:{pages:[]}}; const by=new Map((d.query?.pages||[]).map(p=>[p.pageid,p]));
  const all=geos.map(x=>({g:x,p:by.get(x.pageid)})).filter(x=>x.p&&useful(x.p)).sort((a,b)=>a.g.dist-b.g.dist).slice(0,16).map((x,i)=>({candidate_id:`C${String(i+1).padStart(2,'0')}`,pageid:x.g.pageid,title:x.g.title,url:urlForTitle(x.g.title),latitude:x.g.lat,longitude:x.g.lon,distance_from_anchor_m:Math.round(x.g.dist),extract:words(x.p.extract||'',110)}));
  const counts={1000:all.filter(x=>x.distance_from_anchor_m<=1000).length,3000:all.filter(x=>x.distance_from_anchor_m<=3000).length,10000:all.length}; const radius=counts[1000]>=3?1000:counts[3000]>=3?3000:10000; const cand=all.filter(x=>x.distance_from_anchor_m<=radius); const sparse=cand.length<3; let enrichment=[];
  if(sparse&&anchor.label){ const term=anchor.label.replace(/\s*\([^)]*\)/g,'').split(/[ ,]/).find(x=>x.length>=3); if(term){ const tails=['','watermill','qanat','garden','architecture']; const hitMap=new Map(); for(const tail of tails){ const s=await wiki({list:'search',srsearch:`"${term}" ${tail}`.trim(),srnamespace:0,srlimit:10}); for(const h of s.query?.search||[]) if(!cand.some(c=>c.pageid===h.pageid))hitMap.set(h.pageid,h); } const hits=[...hitMap.values()].slice(0,24); if(hits.length){ const ed=await wiki({pageids:hits.map(h=>h.pageid).join('|'),prop:'extracts|pageprops',explaintext:1}); for(const p of ed.query?.pages||[]){ if(enrichment.length>=4)break; if(!p.extract||p.pageprops?.disambiguation!==undefined)continue; const idx=p.extract.toLowerCase().indexOf(term.toLowerCase()); if(idx<0)continue; const before=p.extract.slice(0,idx).replace(/\s+/g,' ').split(' ').slice(-24); const after=p.extract.slice(idx).replace(/\s+/g,' ').split(' '); enrichment.push({source_id:`E${String(enrichment.length+1).padStart(2,'0')}`,title:p.title,url:urlForTitle(p.title),snippet:[...before,...after].slice(0,80).join(' '),explicit_local_term:term}); } } } }
  return {logical_radius_m:radius,candidate_pages:cand,enrichment,sparse,counts};
}
async function fieldFor(anchor){
  if(fixtureMode==='taft') return {logical_radius_m:10000,sparse:true,counts:{1000:0,3000:0,10000:1},candidate_pages:[{candidate_id:'C01',pageid:1,title:'Taft, Iran',url:'https://en.wikipedia.org/wiki/Taft%2C_Iran',latitude:31.74944,longitude:54.20889,distance_from_anchor_m:0,extract:'Taft is a city in Yazd province and the capital of Taft County. It lies southwest of Yazd; Sadri Garden is in the Bagh-e Golestan neighbourhood in southeastern Taft.'}],enrichment:[{source_id:'E01',title:'Qanat',url:'https://en.wikipedia.org/wiki/Qanat',snippet:'Watermills within a qanat system had to be carefully situated. At Taft and Ardestan mills were placed at the outflow from the qanat, before irrigation of the fields.',explicit_local_term:'Taft'}]};
  return liveField(anchor);
}

let searchTimer=null,searchAbort=0;
queryEl.addEventListener('input',()=>{ clearTimeout(searchTimer); const q=queryEl.value.trim(); if(q.length<2){resultsEl.hidden=true;return} const token=++searchAbort; searchTimer=setTimeout(async()=>{searchStateEl.textContent='searching';searchStateEl.classList.add('active');try{const rows=await searchPlaces(q);if(token!==searchAbort)return;resultsEl.innerHTML=rows.map((r,i)=>`<button class="search-result" data-i="${i}"><span class="result-primary">${esc(r.label)}</span><span class="result-secondary">${esc(r.secondary||coordLabel(r.coordinate))}</span></button>`).join('')+`<div class="provider-note">${fixtureMode?'fixture search':'prototype search · coordinate-bearing Wikipedia pages'}</div>`;resultsEl.hidden=false;resultsEl.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>preview(rows[i]));}catch(e){resultsEl.innerHTML=`<div class="search-error">${esc(e.message)}</div>`;resultsEl.hidden=false}finally{searchStateEl.textContent='';searchStateEl.classList.remove('active')}} ,180);});

function preview(result){ state.anchor={label:result.label,coordinate:result.coordinate,source:'search',granularity:result.granularity||'locality',regionalContext:{}}; setPhase('preview'); orientationEl.hidden=true; previewEl.hidden=false; previewEl.innerHTML=`<span class="micro-label">anchor preview</span><h1>${esc(result.label||'Map point')}</h1><p>${esc(coordLabel(result.coordinate))}</p><div class="preview-actions"><button id="confirm" class="primary-action">Use this place</button><button id="back" class="secondary-action">Back</button></div>`; setCenter(result.coordinate,12.8); registerEl.hidden=true; document.getElementById('confirm').onclick=confirm;document.getElementById('back').onclick=reset; }
function previewPoint(c,source='map_point'){preview({label:source==='device_location'?'Current location':null,coordinate:c,granularity:source}) ; state.anchor.source=source;}
document.getElementById('choose-map').onclick=()=>{state.pick=!state.pick;mapEl.classList.toggle('pick-active',state.pick);mapPickEl.hidden=!state.pick;document.getElementById('choose-map').textContent=state.pick?'Cancel map pick':'Choose on map'};
document.getElementById('use-center').onclick=()=>{state.pick=false;mapEl.classList.remove('pick-active');mapPickEl.hidden=true;previewPoint(state.center)};
document.getElementById('use-location').onclick=()=>{ if(!navigator.geolocation){document.getElementById('location-error').hidden=false;document.getElementById('location-error').textContent='Location is unavailable. Search instead.';return} register('locating'); navigator.geolocation.getCurrentPosition(p=>previewPoint({lat:p.coords.latitude,lon:p.coords.longitude},'device_location'),()=>{document.getElementById('location-error').hidden=false;document.getElementById('location-error').textContent='Location permission was unavailable. Search or choose a map point instead.'},{enableHighAccuracy:true,timeout:8000,maximumAge:30000}) };

async function confirm(){
  if(!state.anchor)return; previewEl.hidden=true; setPhase('discovering'); state.radius=1000;state.candidates=[];renderMap(); register('field / 1 km','reading English Wikipedia geography');
  try{ const data=await fieldFor(state.anchor); state.field=data; const seq=[1000]; if(data.logical_radius_m>=3000)seq.push(3000); if(data.logical_radius_m>=10000)seq.push(10000); for(const r of seq){state.radius=r;state.candidates=data.candidate_pages.filter(c=>c.distance_from_anchor_m<=r);renderMap();const n=data.counts[r];register(r===1000?'field / 1 km':`field widened / ${r/1000} km`,`${n} useful geographic ${n===1?'page':'pages'}`);await sleep(r===data.logical_radius_m?420:650)} if(data.sparse){register('field sparse',`${data.candidate_pages.length} geographic ${data.candidate_pages.length===1?'page':'pages'} within 10 km`);await sleep(460);register('reading local traces','non-geographic enrichment remains off-map');await sleep(460)} state.radius=data.logical_radius_m;state.candidates=data.candidate_pages;setPhase('field');renderMap();renderLedger();register(data.sparse?'field / sparse':`field / ${data.logical_radius_m/1000} km`,data.sparse?`${data.candidate_pages.length} geographic · ${data.enrichment.length} local ${data.enrichment.length===1?'reference':'references'}`:`${data.candidate_pages.length} geographic candidates retained`);newPlaceBtn.hidden=false; if(data.sparse&&data.enrichment.length)renderEnrichment(); }
  catch(e){setPhase('error');register('field unavailable',e.message);newPlaceBtn.hidden=false}
}
function renderLedger(){ const data=state.field; if(!data)return; ledgerEl.hidden=false; ledgerEl.innerHTML=`<div class="ledger-head"><span>geographic field</span><span>${String(data.candidate_pages.length).padStart(2,'0')}</span></div><ol>${data.candidate_pages.map(c=>`<li><button class="candidate-row" data-id="${c.candidate_id}"><span class="candidate-id">${c.candidate_id.slice(1)}</span><span class="candidate-title">${esc(c.title)}</span><span class="candidate-distance">${distanceLabel(c.distance_from_anchor_m)}</span></button></li>`).join('')}</ol>${data.sparse?`<div class="sparse-register"><span>field sparse</span><span>${data.enrichment.length} local references held off-map</span></div>`:''}`; ledgerEl.querySelectorAll('.candidate-row').forEach(b=>b.onclick=()=>showCandidate(b.dataset.id)); }
function showCandidate(id){state.active=state.active===id?null:id;renderOverlay();const c=state.field?.candidate_pages.find(x=>x.candidate_id===state.active);if(!c){inspectorEl.hidden=true;return}inspectorEl.hidden=false;inspectorEl.innerHTML=`<div class="inspector-meta">${c.candidate_id} · ${distanceLabel(c.distance_from_anchor_m)}</div><h2>${esc(c.title)}</h2><p>${esc(c.extract)}</p><a href="${c.url}" target="_blank" rel="noreferrer">Wikipedia source ↗</a>`;}
function renderEnrichment(){const e=state.field.enrichment;enrichmentEl.hidden=false;enrichmentEl.innerHTML=`<summary>local traces · ${e.length}</summary><div class="enrichment-body"><p class="enrichment-rule">These references have no map coordinate and are not route nodes.</p>${e.map(x=>`<article><div>${x.source_id} · ${esc(x.title)}</div><p>${esc(x.snippet)}</p></article>`).join('')}</div>`;}
function reset(){ state.phase='orientation';state.anchor=null;state.radius=null;state.candidates=[];state.field=null;state.active=null;state.pick=false;setPhase('orientation');orientationEl.hidden=false;previewEl.hidden=true;registerEl.hidden=true;ledgerEl.hidden=true;inspectorEl.hidden=true;enrichmentEl.hidden=true;newPlaceBtn.hidden=true;mapPickEl.hidden=true;queryEl.value='';resultsEl.hidden=true;state.center={lat:31,lon:12};state.zoom=2.2;renderMap(); }
newPlaceBtn.onclick=reset;

renderMap();
if(fixtureMode==='taft'){
  if(params.get('autorun')==='1'){
    preview({id:'fixture:taft',label:'Taft, Iran',secondary:'City in Yazd province, Iran',coordinate:{lat:31.74944,lon:54.20889},granularity:'city'});
    setTimeout(confirm,120);
  } else {
    queryEl.value='Taft'; queryEl.dispatchEvent(new Event('input'));
  }
}
