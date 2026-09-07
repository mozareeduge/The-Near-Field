from pathlib import Path
root=Path(__file__).resolve().parents[1]
app=(root/'apps/web/src/App.tsx').read_text()
mapv=(root/'apps/web/src/components/MapView.tsx').read_text()
css=(root/'apps/web/src/styles.css').read_text()
stand=(root/'standalone-r2/app.js').read_text()
for signal in ['gathering','routing','synthesizing','complete','again','retry this stage','sources / run']:
    assert signal in app, f'missing Round-2 state/action: {signal}'
for signal in ['selectedPlaces','routeGeometry','activePlaceId','RELATIONAL_UNVERIFIED','feature-state']:
    assert signal in mapv, f'missing map behavior marker: {signal}'
for signal in ['reading-field','selected']:
    assert signal in css, f'missing Round-2 craft rule: {signal}'
# The reading paragraph is plain, uninterrupted prose: no in-text links or
# highlighted spans (owner direction 2026-09-07). map<->prose bridging survives
# on the map/candidate side only.
assert 'prose-binding' not in css and 'prose-binding' not in app, 'the reading paragraph must carry no in-text links'
# literary-surface (a floating glass panel over the map) was a documented visual
# defect (§16 Final composition; verification brief item 6) — replaced by
# reading-field, an in-flow section below the settled map.
assert 'literary-surface' not in css, 'prose must not return to a floating panel over the map'
for signal in ["dataset.nfReady",'RELATIONAL_UNVERIFIED','renderProse','setActive']:
    assert signal in stand, f'missing standalone R2 behavior: {signal}'
assert 'displayedPlace=hoverPlace||activePlace' in app, 'transient hover and pinned selection must be separate'
assert 'onCandidateHover={hoverCandidate}' in app, 'map hover must bridge into shared object state'
print('PASS Round-2 static interaction contract — stages/selection/movement/prose/map↔prose/failure recovery present')
