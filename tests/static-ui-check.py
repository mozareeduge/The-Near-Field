from html.parser import HTMLParser
from pathlib import Path

class IDs(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=set()
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if 'id' in d: self.ids.add(d['id'])

root=Path(__file__).resolve().parents[1]
p=IDs(); p.feed((root/'standalone/index.html').read_text())
required={'map','place-search','results','use-location','choose-map','use-center','preview','register','ledger','inspector','enrichment','new-place'}
missing=required-p.ids
assert not missing, f'missing UI affordances: {sorted(missing)}'
js=(root/'standalone/app.js').read_text()
for signal in ['field / 1 km','field sparse','reading local traces','non-geographic enrichment remains off-map']:
    assert signal in js, f'missing state signal: {signal}'
css=(root/'standalone/styles.css').read_text()
assert '@media (prefers-reduced-motion: reduce)' in css
assert '@media (max-width: 767px)' in css
print('PASS static UI contract — entry/confirm/field/sparse/mobile/reduced-motion surfaces present')
