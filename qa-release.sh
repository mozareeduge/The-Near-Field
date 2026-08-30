#!/usr/bin/env bash
# Nearby Field v1.0.0 release gate. Runs the actual checks the release brief
# requires: deterministic/static suites, canonical skill checks, and real
# builds of both apps (not the syntax-transpile approximation qa-round2.sh
# used before a working Chromium/npm-install environment was available).
set -euo pipefail
cd "$(dirname "$0")"

echo '== Node test suite (app + worker + security) =='
node --experimental-strip-types --test tests/*.test.mjs

echo '== Canonical Nearby Narrative suite =='
python3 packages/nearby-narrative/tests/run_tests.py

echo '== Canonical skill static check =='
python3 packages/nearby-narrative/scripts/static_check.py

echo '== Static UI contracts =='
python3 tests/static-ui-check.py
python3 tests/round2-ui-static.py

echo '== apps/web: real TypeScript + Vite build =='
npm --workspace apps/web run build

echo '== apps/worker: real TypeScript build + Wrangler dry-run deploy =='
npm --workspace apps/worker run check

echo
echo 'ALL GREEN'
