#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
node --check standalone/app.js
python3 tests/static-ui-check.py
node --experimental-strip-types --test tests/*.test.mjs
tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM apps/worker/src/index.ts
(
  cd packages/nearby-narrative
  python3 scripts/static_check.py
  python3 tests/run_tests.py
)
echo "ROUND1 QA: PASS for dependency-free/static/Worker candidate checks"
