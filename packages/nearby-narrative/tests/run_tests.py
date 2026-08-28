#!/usr/bin/env python3
from pathlib import Path
import subprocess, json, tempfile, shutil, sys, os

root=Path(__file__).resolve().parents[1]
py=sys.executable
results=[]

def run(name,args,input_text=None,expect=0):
    p=subprocess.run(args,input=input_text,text=True,capture_output=True)
    ok=(p.returncode==expect) if expect==0 else (p.returncode!=0)
    results.append((name,ok,(p.stdout+p.stderr).strip()))
    if not ok:
        print("FAIL",name,p.returncode,p.stdout,p.stderr)
        raise SystemExit(1)

run("static_check",[py,str(root/"scripts/static_check.py")])
run("taft_candidate",[py,str(root/"scripts/validate.py"),"candidate",str(root/"tests/fixtures/taft-candidate.json")])
run("taft_gather",[py,str(root/"scripts/validate.py"),"gather",str(root/"tests/fixtures/taft-candidate.json"),str(root/"tests/fixtures/taft-gatherer.json")])
run("ney_candidate",[py,str(root/"scripts/validate.py"),"candidate",str(root/"tests/fixtures/neyshabur-symbolic-candidate.json")])
run("taft_synth_structure",[py,str(root/"scripts/validate.py"),"synth",str(root/"tests/fixtures/taft-gatherer.json"),str(root/"tests/fixtures/taft-synth-simulation.json")])

# Offline candidate preparation simulation
tmp=Path(tempfile.mkdtemp(prefix="nnv7-"))
prepared=tmp/"prepared.json"
p=subprocess.run([py,str(root/"scripts/prepare_field.py"),"--fixture",str(root/"tests/fixtures/taft-raw-api.json"),
                  "--date","2026-08-24","--context","Yazd Iran"],capture_output=True,text=True)
if p.returncode: raise SystemExit(p.stderr)
prepared.write_text(p.stdout,encoding="utf-8")
run("prepared_candidate",[py,str(root/"scripts/validate.py"),"candidate",str(prepared)])

# Single-place movement
movement=tmp/"movement.json"
inp=json.dumps({"anchor":{"lat":31.74944,"lon":54.20889},
                "places":[{"place_id":"P01","latitude":31.74944,"longitude":54.20889}]})
p=subprocess.run([py,str(root/"scripts/order_points.py")],input=inp,text=True,capture_output=True)
if p.returncode: raise SystemExit(p.stderr)
movement.write_text(p.stdout,encoding="utf-8")
m=json.loads(p.stdout)
assert m["state"]=="NONE" and m["route_verified"] is False
results.append(("single_place_movement",True,"NONE/unverified"))

# Boundary: raw source fields cannot cross
p=subprocess.run([py,str(root/"scripts/build_synth_input.py"),str(root/"tests/fixtures/taft-candidate.json"),
                  str(root/"tests/fixtures/taft-gatherer.json"),str(movement)],capture_output=True,text=True)
if p.returncode: raise SystemExit(p.stderr)
payload=p.stdout
for forbidden in ("candidate_pages","extract","enrichment","snippet"):
    if forbidden in payload: raise SystemExit("raw-source boundary failed: "+forbidden)
results.append(("synth_payload_boundary",True,"raw source fields absent"))

# Canaries
cand=json.load(open(root/"tests/fixtures/taft-candidate.json",encoding="utf-8"))
g=json.load(open(root/"tests/fixtures/taft-gatherer.json",encoding="utf-8"))

def dump(name,obj):
    q=tmp/name; q.write_text(json.dumps(obj),encoding="utf-8"); return q

x=json.loads(json.dumps(cand)); x["candidate_pages"][0]["extract"]="word "*111
run("canary_extract_budget",[py,str(root/"scripts/validate.py"),"candidate",str(dump("c1.json",x))],expect=1)

x=json.loads(json.dumps(cand)); x["enrichment"][0]["snippet"]="No local name appears here."
run("canary_enrichment_term",[py,str(root/"scripts/validate.py"),"candidate",str(dump("c2.json",x))],expect=1)

x=json.loads(json.dumps(g)); x["plot"]="A man solves a problem."
run("canary_gather_plot",[py,str(root/"scripts/validate.py"),"gather",str(root/"tests/fixtures/taft-candidate.json"),str(dump("g1.json",x))],expect=1)

x=json.loads(json.dumps(g)); x["selected_places"][0]["source_candidate_id"]="C999"
run("canary_gather_source",[py,str(root/"scripts/validate.py"),"gather",str(root/"tests/fixtures/taft-candidate.json"),str(dump("g2.json",x))],expect=1)

x={"paragraph":"One.\n\nTwo.","used_place_ids":["P01"],"bindings":[]}
run("canary_two_paragraphs",[py,str(root/"scripts/validate.py"),"synth",str(root/"tests/fixtures/taft-gatherer.json"),str(dump("s1.json",x))],expect=1)

x={"paragraph":"She was in Taft.","used_place_ids":["P01"],"bindings":[
    {"place_id":"P01","relation":"mention","start":100,"end":104,"evidence_ids":["P01-F1"]}]}
run("canary_binding",[py,str(root/"scripts/validate.py"),"synth",str(root/"tests/fixtures/taft-gatherer.json"),str(dump("s2.json",x))],expect=1)

shutil.rmtree(tmp)
for name,ok,obs in results:
    print(("PASS" if ok else "FAIL"),name,("— "+obs if obs else ""))
print("TOTAL",len(results),"PASS",sum(1 for _,x,_ in results if x))
