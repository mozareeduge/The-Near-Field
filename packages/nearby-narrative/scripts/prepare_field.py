#!/usr/bin/env python3
"""Prepare a bounded English-Wikipedia field.

Zero third-party dependencies.

Live:
  prepare_field.py --place "Taft, Yazd province, Iran" --date 2026-08-24
  prepare_field.py --lat 31.74944 --lon 54.20889 --label Taft --context "Yazd Iran" --date 2026-08-24

Offline test:
  prepare_field.py --fixture raw-api-fixture.json --date 2026-08-24

The script performs no LLM calls.
"""
from __future__ import annotations
import argparse, json, urllib.parse, urllib.request, re, html

BASE="https://en.wikipedia.org/w/api.php"
UA="nearby-narrative/7.1.0 (portable Agent Skill)"

def request(params):
    q={"format":"json","formatversion":2,**params}
    req=urllib.request.Request(BASE+"?"+urllib.parse.urlencode(q),headers={"User-Agent":UA})
    with urllib.request.urlopen(req,timeout=20) as r:
        return json.load(r)

def wiki_url(title):
    return "https://en.wikipedia.org/wiki/"+urllib.parse.quote(title.replace(" ","_"),safe="()_',:-")

def clean_html(s):
    s=re.sub(r"<[^>]+>"," ",s or "")
    return re.sub(r"\s+"," ",html.unescape(s)).strip()

def cap_words(s,n):
    words=re.findall(r"\S+",s or "")
    return " ".join(words[:n])

def resolve_place(query):
    hits=request({"action":"query","list":"search","srsearch":query,"srnamespace":0,"srlimit":10}).get("query",{}).get("search",[])
    if not hits: raise RuntimeError("ANCHOR_UNRESOLVED")
    ids="|".join(str(x["pageid"]) for x in hits)
    pages=request({"action":"query","pageids":ids,"prop":"coordinates|pageprops","ppprop":"disambiguation"}).get("query",{}).get("pages",[])
    byid={p["pageid"]:p for p in pages}
    options=[]
    for h in hits:
        p=byid.get(h["pageid"],{})
        if "disambiguation" in p.get("pageprops",{}): continue
        coords=p.get("coordinates") or []
        if not coords: continue
        c=next((x for x in coords if "primary" in x),coords[0])
        options.append({"label":p.get("title",h["title"]),"lat":c["lat"],"lon":c["lon"],"pageid":h["pageid"]})
    if not options: raise RuntimeError("ANCHOR_UNRESOLVED")
    return options[0], options

def fetch_extracts(ids):
    out={}
    for i in range(0,len(ids),20):
        pages=request({
            "action":"query","pageids":"|".join(map(str,ids[i:i+20])),
            "prop":"extracts|pageprops","exintro":1,"explaintext":1,"exsentences":7,
            "ppprop":"disambiguation"
        }).get("query",{}).get("pages",[])
        for p in pages:
            if "missing" in p or "disambiguation" in p.get("pageprops",{}): continue
            ex=clean_html(p.get("extract",""))
            if len(ex.split())<18: continue
            out[p["pageid"]]={"title":p["title"],"url":wiki_url(p["title"]),"extract":cap_words(ex,110)}
    return out

def live_raw(anchor, place_query, context):
    hits=request({
        "action":"query","list":"geosearch","gscoord":f'{anchor["lat"]}|{anchor["lon"]}',
        "gsradius":10000,"gslimit":30,"gsnamespace":0
    }).get("query",{}).get("geosearch",[])
    ex=fetch_extracts([h["pageid"] for h in hits])
    geo=[]
    for h in hits:
        if h["pageid"] in ex:
            geo.append({**h,**ex[h["pageid"]]})
    raw={"anchor":anchor,"geosearch":geo,"enrichment_search":[]}
    if len(geo)<3:
        term=(anchor.get("label") or place_query or "").split(",")[0].strip()
        if term:
            q=f'"{term}"'
            if context: q+=" "+context
            sr=request({"action":"query","list":"search","srsearch":q,"srnamespace":0,"srlimit":12}).get("query",{}).get("search",[])
            raw["enrichment_search"]=sr
            raw["enrichment_term"]=term
    return raw

def build(raw,date,context=None):
    anchor=raw["anchor"]
    geo=sorted(raw.get("geosearch",[]),key=lambda x:(x.get("dist",10**18),x.get("pageid",0)))
    # Normalize before choosing the smallest useful radius.
    normalized=[]
    seen_titles=set()
    for h in geo:
        ex=cap_words(clean_html(h.get("extract","")),110)
        title=h.get("title","").strip()
        if not title or title.lower() in seen_titles or len(ex.split())<18: continue
        seen_titles.add(title.lower())
        normalized.append({
            "pageid":int(h["pageid"]),"title":title,"url":h.get("url") or wiki_url(title),
            "latitude":float(h["lat"]),"longitude":float(h["lon"]),
            "distance_from_anchor_m":float(h.get("dist",0)),"extract":ex
        })
    for radius in (1000,3000,10000):
        if len([x for x in normalized if x["distance_from_anchor_m"]<=radius])>=3:
            logical=radius; break
    else: logical=10000
    chosen=[x for x in normalized if x["distance_from_anchor_m"]<=logical][:16]
    for i,x in enumerate(chosen,1): x["candidate_id"]=f"C{i:02d}"

    enrich=[]
    if len(chosen)<3:
        term=raw.get("enrichment_term") or (anchor.get("label") or "").split(",")[0].strip()
        candidate_ids={x["pageid"] for x in chosen}
        for s in raw.get("enrichment_search",[]):
            if len(enrich)>=4: break
            if int(s.get("pageid",-1)) in candidate_ids: continue
            snippet=cap_words(clean_html(s.get("snippet","")),80)
            if not term or term.lower() not in snippet.lower(): continue
            enrich.append({
                "source_id":f"E{len(enrich)+1:02d}",
                "title":s.get("title",""),
                "url":wiki_url(s.get("title","")),
                "snippet":snippet,
                "explicit_local_term":term
            })

    label=anchor.get("label")
    return {
        "current_date":date,
        "anchor":{"label":label,"lat":anchor["lat"],"lon":anchor["lon"]},
        "regional_context":{"anchor_label":label,"context":context},
        "logical_radius_m":logical,
        "candidate_pages":chosen,
        "enrichment":enrich
    }

def main():
    ap=argparse.ArgumentParser()
    source=ap.add_mutually_exclusive_group(required=True)
    source.add_argument("--place")
    source.add_argument("--lat",type=float)
    source.add_argument("--fixture")
    ap.add_argument("--lon",type=float)
    ap.add_argument("--label")
    ap.add_argument("--context")
    ap.add_argument("--date",required=True)
    a=ap.parse_args()
    if a.fixture:
        raw=json.load(open(a.fixture,encoding="utf-8"))
    else:
        if a.place:
            anchor,options=resolve_place(a.place)
            # Caller/host should disambiguate before invoking when materially ambiguous.
            raw=live_raw(anchor,a.place,a.context or a.place)
        else:
            if a.lon is None: ap.error("--lon required with --lat")
            anchor={"label":a.label,"lat":a.lat,"lon":a.lon}
            raw=live_raw(anchor,None,a.context)
    print(json.dumps(build(raw,a.date,a.context),ensure_ascii=False,indent=2))

if __name__=="__main__": main()
