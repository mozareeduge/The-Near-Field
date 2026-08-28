#!/usr/bin/env python3
"""Deterministic coordinate-order fallback. This never proves walkability."""
import json, sys, math, itertools
R=6371008.8

def hav(a,b):
    la1,lo1=map(math.radians,(a["latitude"],a["longitude"]))
    la2,lo2=map(math.radians,(b["latitude"],b["longitude"]))
    dlat,dlon=la2-la1,lo2-lo1
    x=math.sin(dlat/2)**2+math.cos(la1)*math.cos(la2)*math.sin(dlon/2)**2
    return 2*R*math.asin(math.sqrt(x))

def main():
    d=json.load(sys.stdin)
    ps=d["places"]
    if not 1 <= len(ps) <= 5:
        raise SystemExit("places must contain 1–5 items")
    if len(ps)==1:
        print(json.dumps({"state":"NONE","route_verified":False,"order":[ps[0]["place_id"]],
                          "total_distance_m":0,"legs":[]},indent=2)); return
    anchor={"latitude":d["anchor"]["lat"],"longitude":d["anchor"]["lon"]}
    start=min(ps,key=lambda p:(hav(anchor,p),p["place_id"]))
    rest=[p for p in ps if p["place_id"]!=start["place_id"]]
    best=None
    for perm in itertools.permutations(rest):
        seq=(start,)+perm
        ds=[hav(seq[i],seq[i+1]) for i in range(len(seq)-1)]
        key=(sum(ds),tuple(p["place_id"] for p in seq))
        if best is None or key < best[0]:
            best=(key,seq,ds)
    _,seq,ds=best
    print(json.dumps({
        "state":"RELATIONAL_UNVERIFIED","route_verified":False,
        "order":[p["place_id"] for p in seq],
        "total_distance_m":round(sum(ds),1),
        "legs":[{"from":seq[i]["place_id"],"to":seq[i+1]["place_id"],"distance_m":round(ds[i],1)}
                for i in range(len(ds))]
    },indent=2))
if __name__=="__main__": main()
