#!/usr/bin/env python3
"""Build the strict Synthesizer payload; raw source fields cannot cross this boundary."""
import json, sys

def main():
    if len(sys.argv)!=4:
        raise SystemExit("usage: build_synth_input.py candidate_field.json gatherer.json movement.json")
    cand=json.load(open(sys.argv[1],encoding="utf-8"))
    g=json.load(open(sys.argv[2],encoding="utf-8"))
    m=json.load(open(sys.argv[3],encoding="utf-8"))
    out={
        "current_date":cand["current_date"],
        "regional_context":cand.get("regional_context",{}),
        "selected_places":g["selected_places"],
        "local_material":g.get("local_material",[]),
        "relations":g.get("relations",[]),
        "unknown_current_conditions":g.get("unknown_current_conditions",[]),
        "movement":m
    }
    print(json.dumps(out,ensure_ascii=False,indent=2))
if __name__=="__main__": main()
