#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo '== Round-2 Node tests =='
node --experimental-strip-types --test tests/*.test.mjs

echo '== Canonical Nearby Narrative suite =='
python packages/nearby-narrative/tests/run_tests.py

echo '== Canonical skill static check =='
python packages/nearby-narrative/scripts/static_check.py

echo '== Round-1 UI static contract =='
python tests/static-ui-check.py

echo '== Round-2 UI static contract =='
python tests/round2-ui-static.py

echo '== Standalone Round-2 syntax =='
node --check standalone-r2/app.js

echo '== TS/TSX syntax-transpile gate =='
node <<'JS'
const ts=require('typescript'), fs=require('fs');
const files=['apps/web/src/App.tsx','apps/web/src/components/MapView.tsx','apps/web/src/lib/api.ts','apps/web/src/lib/types.ts','apps/worker/src/index.ts','apps/worker/src/round2.ts'];
for(const p of files){
 const r=ts.transpileModule(fs.readFileSync(p,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
 const errs=(r.diagnostics||[]).filter(d=>d.category===ts.DiagnosticCategory.Error);
 if(errs.length) throw new Error(p+': '+errs.map(e=>ts.flattenDiagnosticMessageText(e.messageText,'\\n')).join('; '));
 console.log('PASS',p);
}
JS
