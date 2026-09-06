// Expose the local 9router gateway (localhost:20128) to the public internet so
// the DEPLOYED Cloudflare worker can use muse-spark during the test phase.
//
// Why: 9router is a localhost-only service. The worker's provider chain prefers
// 9router when NINEROUTER_BASE_URL is set AND reachable, and silently falls back
// to OpenRouter otherwise -- so running this is what "turns on" free-token burn
// on the live site, and stopping it just reverts the live site to OpenRouter.
// Nothing breaks either way.
//
// Usage (from repo root, with 9router already running on 20128):
//   node scripts/expose-9router.mjs
//
// It prints a public https URL. That URL must match the NINEROUTER_BASE_URL
// repository secret (Settings -> Secrets and variables -> Actions). If the
// printed URL differs from what is configured, update the secret and re-run
// `gh workflow run deploy-worker.yml`.
//
// Keep this process running for as long as you want the live site on 9router.
// It reconnects automatically if the tunnel drops.
import { spawn } from 'node:child_process';

const PORT = 20128;
const SUBDOMAIN = process.env.NF_TUNNEL_SUBDOMAIN || 'nf9router-nearfield';

function once() {
  return new Promise((resolve) => {
    const p = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['--yes', 'localtunnel@2', '--port', String(PORT), '--subdomain', SUBDOMAIN],
      { stdio: ['ignore', 'pipe', 'inherit'] }
    );
    let printed = false;
    p.stdout.on('data', (b) => {
      const s = String(b);
      process.stdout.write(s);
      const m = s.match(/https:\/\/[^\s]+\.loca\.lt/);
      if (m && !printed) {
        printed = true;
        console.log('\n  PUBLIC 9router URL: ' + m[0]);
        console.log('  Set repo secret  NINEROUTER_BASE_URL = ' + m[0]);
        console.log('  (the worker also needs NINEROUTER_API_KEY set to your 9router key)\n');
        if (m[0] !== `https://${SUBDOMAIN}.loca.lt`) {
          console.log('  NOTE: requested subdomain was taken; the URL above is the real one.\n');
        }
      }
    });
    p.on('exit', (code) => { console.log(`[tunnel] exited (${code}); reconnecting in 3s`); resolve(); });
  });
}

console.log(`[tunnel] exposing localhost:${PORT} as https://${SUBDOMAIN}.loca.lt (Ctrl+C to stop)`);
// eslint-disable-next-line no-constant-condition
while (true) { await once(); await new Promise((r) => setTimeout(r, 3000)); }
