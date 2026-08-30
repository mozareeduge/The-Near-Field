#!/usr/bin/env python3
"""Zero-dependency structural/prompt-budget check."""
from pathlib import Path
import re, sys

root=Path(__file__).resolve().parents[1]
limits={
    "SKILL.md":300,
    "references/GATHERER.md":350,
    "references/SYNTHESIZER.md":500,
    "references/RETRIEVAL.md":350,
}
prohibited=["hemingway","ginzburg","ginsburg","natalia ginzburg"]
fail=[]

skill=(root/"SKILL.md").read_text(encoding="utf-8")
if not skill.startswith("---\n"): fail.append("SKILL frontmatter missing")
parts=skill.split("---",2)
if len(parts)<3: fail.append("SKILL frontmatter malformed")
else:
    fm=parts[1]
    m=re.search(r"(?m)^name:\s*[\"']?([^\"'\n]+)",fm)
    name=m.group(1).strip() if m else ""
    if name!="nearby-narrative": fail.append("bad skill name")
    if root.name!=name: fail.append("skill directory/name mismatch")
    dm=re.search(r"(?m)^description:\s*(.+)$",fm)
    if not dm or not (1 <= len(dm.group(1).strip()) <= 1024): fail.append("description length")
    cm=re.search(r"(?m)^compatibility:\s*(.+)$",fm)
    if cm and len(cm.group(1).strip())>500: fail.append("compatibility length")
    # Agent Skills metadata values should be strings for maximum client portability.
    meta=re.search(r"(?ms)^metadata:\s*\n((?:  .+\n?)*)",fm)
    if meta:
        for line in meta.group(1).splitlines():
            if not line.strip() or ":" not in line: continue
            val=line.split(":",1)[1].strip()
            if not (val.startswith('"') and val.endswith('"')) and not (val.startswith("'") and val.endswith("'")):
                fail.append("metadata value not explicitly string: "+line.strip())

for rel,limit in limits.items():
    p=root/rel
    if not p.exists(): fail.append(f"missing {rel}"); continue
    text=p.read_text(encoding="utf-8")
    body=text.split("---",2)[2] if rel=="SKILL.md" and text.count("---")>=2 else text
    wc=len(re.findall(r"\S+",body))
    if wc>limit: fail.append(f"{rel} word budget {wc}>{limit}")
    low=text.lower()
    for name in prohibited:
        if name in low: fail.append(f"{rel} contains prohibited writer name: {name}")

for ref in ["references/RETRIEVAL.md","references/GATHERER.md","references/SYNTHESIZER.md","references/RUNTIME.md"]:
    if ref not in skill: fail.append(f"SKILL missing direct reference {ref}")

if len(skill.splitlines())>500: fail.append("SKILL over 500 lines")

if fail:
    print("\n".join("FAIL "+x for x in fail)); sys.exit(1)
print("VALID")
