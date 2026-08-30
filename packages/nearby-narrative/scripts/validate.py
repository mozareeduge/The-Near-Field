#!/usr/bin/env python3
"""Invariant validator for candidate, Gatherer, and Synthesizer artifacts."""
import json, sys, re

def bad(msg):
    raise SystemExit("INVALID: "+msg)

def words(s): return len(re.findall(r"\S+",s or ""))

def candidate(c):
    pages=c.get("candidate_pages",[])
    enrich=c.get("enrichment",[])
    if len(pages)>16: bad("candidate cap exceeded")
    if len(enrich)>4: bad("enrichment cap exceeded")
    ids=set()
    for p in pages:
        if p["candidate_id"] in ids: bad("duplicate candidate_id")
        ids.add(p["candidate_id"])
        if words(p.get("extract"))>110: bad("candidate extract word budget exceeded")
    eids=set()
    for e in enrich:
        if e["source_id"] in eids: bad("duplicate enrichment source_id")
        eids.add(e["source_id"])
        if words(e.get("snippet"))>80: bad("enrichment word budget exceeded")
        term=e.get("explicit_local_term","").strip().lower()
        if not term or term not in e.get("snippet","").lower(): bad("enrichment lacks explicit local term")
    print("VALID")

def gather(c,g):
    cids={x["candidate_id"]:x for x in c.get("candidate_pages",[])}
    sids={x["source_id"] for x in c.get("enrichment",[])}
    ps=g.get("selected_places",[])
    if not 1<=len(ps)<=5: bad("selected_places must be 1–5")
    pids=set(); evidence=set()
    for p in ps:
        if p["place_id"] in pids: bad("duplicate place_id")
        pids.add(p["place_id"])
        cid=p.get("source_candidate_id")
        if cid not in cids: bad("unknown selected source")
        src=cids[cid]
        if p.get("title")!=src.get("title") or p.get("url")!=src.get("url"): bad("source identity drift")
        if len(p.get("facts",[]))>3 or len(p.get("particulars",[]))>3: bad("evidence cap")
        if len(p.get("affordances",[]))>2 or len(p.get("semantic_lures",[]))>2: bad("compact field cap")
        for bucket in ("facts","particulars"):
            for e in p.get(bucket,[]):
                if e["evidence_id"] in evidence: bad("duplicate evidence_id")
                evidence.add(e["evidence_id"])
    for x in g.get("local_material",[]):
        if x.get("source_id") not in sids: bad("unknown enrichment source")
        if x["evidence_id"] in evidence: bad("duplicate evidence_id")
        evidence.add(x["evidence_id"])
    forbidden={"character","characters","plot","story","story_idea","mood","theme","dialogue","protagonist"}
    if forbidden.intersection(g.keys()): bad("fiction field leaked into Gatherer")
    for r in g.get("relations",[]):
        if r.get("a") not in pids or r.get("b") not in pids: bad("relation uses unknown place")
    print("VALID")

def synth(g,s):
    pids={p["place_id"] for p in g.get("selected_places",[])}
    evid={r["relation_id"] for r in g.get("relations",[])}
    for p in g.get("selected_places",[]):
        for b in ("facts","particulars"): evid.update(x["evidence_id"] for x in p.get(b,[]))
    evid.update(x["evidence_id"] for x in g.get("local_material",[]))
    para=s.get("paragraph","").strip()
    if not para: bad("blank paragraph")
    if "\n\n" in para: bad("multiple paragraphs")
    if words(para)>260: bad("paragraph unexpectedly over budget")
    for pid in s.get("used_place_ids",[]):
        if pid not in pids: bad("unknown used_place_id")
    for b in s.get("bindings",[]):
        if b.get("place_id") not in pids: bad("binding unknown place")
        rel=b.get("relation")
        st,en=b.get("start"),b.get("end")
        if rel in ("mention","reference"):
            if not isinstance(st,int) or not isinstance(en,int) or not (0<=st<en<=len(para)): bad("binding offsets")
        elif rel=="structural":
            if st is not None or en is not None: bad("structural binding offsets")
        else: bad("binding relation")
        for eid in b.get("evidence_ids",[]):
            if eid not in evid: bad("binding unknown evidence")
    print("VALID")

def main():
    if len(sys.argv)<3: raise SystemExit("usage: validate.py candidate file | gather candidate gather | synth gather synth")
    mode=sys.argv[1]
    if mode=="candidate":
        candidate(json.load(open(sys.argv[2],encoding="utf-8")))
    elif mode=="gather" and len(sys.argv)==4:
        gather(json.load(open(sys.argv[2],encoding="utf-8")),json.load(open(sys.argv[3],encoding="utf-8")))
    elif mode=="synth" and len(sys.argv)==4:
        synth(json.load(open(sys.argv[2],encoding="utf-8")),json.load(open(sys.argv[3],encoding="utf-8")))
    else: raise SystemExit("bad arguments")
if __name__=="__main__": main()
