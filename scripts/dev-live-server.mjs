// Local dev live server: runs the Cloudflare Worker entry (apps/worker/src/index.ts)
// directly under Node with 9router credentials, on port 8789.
//
// Why this exists: the 9router LLM gateway (localhost:20128) is a local service,
// so `wrangler dev` and the deployed worker cannot reach it. This shim invokes
// the worker's fetch handler in-process and forwards localhost traffic to it.
//
// Usage (from repo root):
//   node --experimental-strip-types scripts/dev-live-server.mjs
// Requires: NINEROUTER_API_KEY in the environment (or in
//   %LOCALAPPDATA%/hermes/.env as HERMES_CUSTOM_9ROUTER_API_KEY), 9router running
//   on localhost:20128, then start the web app with:
//   VITE_API_BASE=http://localhost:8789 npm run dev:web
//
// Gotchas encoded here (do not "simplify" them away):
// - listen() binds ALL interfaces (dual-stack): Chrome resolves `localhost` to
//   IPv6 ::1 first; binding 127.0.0.1 only causes silent "Failed to fetch".
// - All request headers are forwarded (the worker's CORS layer needs `Origin`)
//   and ALL response headers are passed back (access-control-allow-origin
//   would otherwise be stripped and the browser blocks every response).
// - The production CSP only allows connect-src http://localhost:8789 — serve
//   the web app on localhost (not 127.0.0.1 or LAN names) or the CSP blocks it.
// - Set NF_DEBUG_CAPTURE=1 to log every upstream request/response body to
//   %LOCALAPPDATA%/Temp/nf_live_*.txt (LLM debugging).
import http from 'node:http';
import fs from 'node:fs';
const worker = (await import(new URL('../apps/worker/src/index.ts', import.meta.url).href)).default;

const DEBUG = process.env.NF_DEBUG_CAPTURE === '1';
const realFetch = globalThis.fetch;
let fcount = 0;
if (DEBUG) {
  globalThis.fetch = async (url, init) => {
    const res = await realFetch(url, init);
    try {
      fcount += 1;
      const txt = await res.clone().text();
      const dir = process.env.TEMP || process.env.TMP || '/tmp';
      fs.writeFileSync(`${dir}/nf_live_raw${fcount}.txt`, `URL:${url}\nSTATUS:${res.status}\nLEN:${txt.length}\nBODY:\n${txt.slice(0, 60000)}`);
      try {
        const b = JSON.parse(init.body);
        fs.writeFileSync(`${dir}/nf_live_req${fcount}.txt`, `MODEL:${b.model}\nSTREAM:${b.stream}\nREASON:${b.reasoning_effort}\nMSGLEN:${JSON.stringify(b.messages).length}\nLASTMSG:${JSON.stringify(b.messages[b.messages.length - 1]).slice(0, 1500)}`);
      } catch { /* not json */ }
    } catch (e) { /* capture must never break serving */ }
    return res;
  };
}

function readApiKey() {
  if (process.env.NINEROUTER_API_KEY) return process.env.NINEROUTER_API_KEY;
  try {
    const dot = fs.readFileSync(process.env.LOCALAPPDATA + '/hermes/.env', 'utf8');
    const m = dot.match(/HERMES_CUSTOM_9ROUTER_API_KEY=([^\r\n]+)/);
    return m ? m[1].trim() : '';
  } catch { return ''; }
}

const ENV = { NINEROUTER_BASE_URL: 'http://localhost:20128', NINEROUTER_API_KEY: readApiKey() };

const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const url = `http://live${req.url}`;
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) headers[k] = Array.isArray(v) ? v.join(', ') : v;
    const wreq = new Request(url, {
      method: req.method,
      headers,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? Buffer.concat(chunks) : undefined,
    });
    const wres = await worker.fetch(wreq, ENV);
    const resHeaders = {};
    wres.headers.forEach((v, k) => { resHeaders[k] = v; });
    res.writeHead(wres.status, resHeaders);
    res.end(await wres.text());
  } catch (e) { res.writeHead(500); res.end(String(e && e.stack || e)); }
});

server.listen(8789, () => console.log('LIVE-READY 8789'));
