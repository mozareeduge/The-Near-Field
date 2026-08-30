# Next steps to go live

Everything in this file is a wall this sandbox genuinely cannot get past —
a secret, an account, or a manual GitHub/Cloudflare UI toggle no tool
available here can supply. Code, config, and CI workflows for all of it are
already written, committed, and (where testable without live credentials)
verified — see `RELEASE_STATE.md` and `QA_EVIDENCE.md`. Nothing below is
"unfinished work"; it's the human-only part of getting a v1.0.0 build of
this project actually live.

Do these roughly in order — each unblocks the next.

## 1. Enable GitHub Pages for this repository

No tool available in this session can read or change a repo's Pages
settings, so whether this is already on is unverified.

- Go to **Settings → Pages** on `mozareeduge/The-Near-Field`.
- Under **Build and deployment → Source**, choose **GitHub Actions** (not
  "Deploy from a branch").
- Nothing else to configure — `.github/workflows/deploy-pages.yml` handles
  the rest once this PR is merged to `main` (it triggers on push to `main`
  under `apps/web/**`, or manually via **Actions → Deploy web to GitHub
  Pages → Run workflow**).
- Once it runs once, the site is at `https://mozareeduge.github.io/The-Near-Field/`.

## 2. Create a Cloudflare account and API token (if you don't have one)

- Sign up at https://dash.cloudflare.com if needed — the Workers Free plan
  covers everything this project needs, including Durable Objects (free
  since April 2025) and Workers AI.
- Create an API token: **My Profile → API Tokens → Create Token** — the
  "Edit Cloudflare Workers" template covers it. Note the **Account ID**
  from the dashboard's right sidebar on any zone/account overview page too.

## 3. Add repository secrets for the Cloudflare Workers deploy

Go to **Settings → Secrets and variables → Actions → Secrets** on the repo
and add:

| Secret | Required | Where it comes from |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | yes | step 2 above |
| `CLOUDFLARE_ACCOUNT_ID` | yes | step 2 above |
| `MAPTILER_API_KEY` | optional | https://cloud.maptiler.com — free tier exists. Without it, search falls back to the tested Wikipedia coordinate-search path (a real, working, tested fallback — not broken, just plainer) |
| `ORS_API_KEY` | optional | https://openrouteservice.org/dev/#/signup — free tier exists. Without it, movement falls back to an honestly-labeled `RELATIONAL_UNVERIFIED` state instead of a verified walking route |

Optionally add a repo **variable** (Settings → Secrets and variables →
Actions → **Variables**, not Secrets) named `ALLOWED_ORIGINS` if the
GitHub Pages URL ever differs from `https://mozareeduge.github.io` (a
custom domain, a repo rename, etc.) — the deploy workflow defaults to that
origin automatically otherwise.

Once `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` exist,
`.github/workflows/deploy-worker.yml` stops skipping itself and deploys
for real on the next push to `main` under `apps/worker/**` (or via
**Actions → Deploy worker to Cloudflare → Run workflow**). It will deploy
to `https://nearby-field-r2.<your-subdomain>.workers.dev` — the exact
`<your-subdomain>` is assigned by Cloudflare on first deploy and visible
in that workflow run's log, or in the Cloudflare dashboard afterward.

## 4. Point the Pages build at the deployed Worker

Once step 3 has run once and you have the real Worker URL:

- Add a repo **variable** (not secret) named `VITE_API_BASE` set to that
  URL, e.g. `https://nearby-field-r2.your-subdomain.workers.dev` (no
  trailing slash).
- Re-run **Deploy web to GitHub Pages** (push anything under `apps/web/**`,
  or trigger it manually). This rebuilds the static site with the real API
  origin baked into both `apps/web/src/lib/api.ts`'s runtime calls and the
  page's CSP `connect-src` (see `apps/web/index.html` and
  `apps/web/.env.production` — `KNOWN_LIMITS.md` explains the mechanism).
- Until this is set, the deployed Pages site builds and serves fine, but
  its own CSP blocks it from calling anywhere (fails closed, not open) —
  confirmed by inspecting the built `dist/index.html` directly in this
  sandbox with and without the variable set.

## 5. Sanity-check the live app

Once both deploys have run at least once with real credentials:

- Open `https://mozareeduge.github.io/The-Near-Field/`, confirm the map
  tiles actually render (this sandbox's network egress proxy blocked
  `tiles.openfreemap.org` outright — this is genuinely unverified pixel
  appearance, not a code gap; see `KNOWN_LIMITS.md`).
- Run a real search → confirm → gather → route → synthesize pass end to
  end against the live Worker, with real Workers AI, and (if configured)
  real ORS/MapTiler. This exercises the one thing this sandbox categorically
  could not: live model and provider behavior (`MODEL_EVALUATION.md`).
- Check `GET https://<worker-origin>/health` returns
  `{"ok":true,"ai":true,"routing":<bool>,"rateLimited":true}`. If
  `rateLimited` is `false`, the Durable Object migration didn't apply —
  re-check the `wrangler deploy` log from step 3.

## 6. Things that are done and don't need further action

- Rate limiting: implemented as a Durable-Object-backed sliding window,
  unit tested, wired into `wrangler.jsonc`. Nothing to configure — it
  activates automatically the moment the worker deploys with the
  `RATE_LIMITER` binding, which it always will via
  `deploy-worker.yml`. Defaults (60 requests / 300s per client IP) are
  reasonable for a single-artwork deployment; override via the
  `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_S` Cloudflare Worker vars in the
  dashboard if real traffic patterns say otherwise.
- `ALLOWED_ORIGINS`: set automatically by `deploy-worker.yml` on every
  deploy through that workflow (see step 3's table). Only a concern if you
  ever run `wrangler deploy` by hand outside CI.

## 7. A gap that cannot be fully closed on GitHub Pages

GitHub Pages serves static files only and does not support custom response
headers. `apps/web/index.html` carries a `<meta>` CSP that covers as much
as that mechanism allows, but there is no way on GitHub Pages to send
`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, or
`Permissions-Policy`, and `frame-ancestors` is silently dropped from a
`<meta>` CSP by the HTML spec itself. `apps/web/public/_headers` still
carries the full header set in case this app is ever moved to Cloudflare
Pages instead, where it would take effect immediately. This is a real,
informed trade-off of the hosting choice this round targeted (GitHub
Pages, per the task), not an oversight — see `KNOWN_LIMITS.md`.
