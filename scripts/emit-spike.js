#!/usr/bin/env bun
// emit-spike.js — the R1 feasibility spike from docs/representation.md's
// decision section: can the fenced kit be single-sourced and every carrier
// re-emitted byte-identically from (film skeleton + canonical fences)?
//
// This is a spike, not the emitter. It writes nothing. It decomposes every
// parity carrier into film segments and fence regions, builds a canonical
// fence store from the first occurrence of each fence, verifies every other
// occurrence against it, reassembles each carrier from its own skeleton plus
// the canonical store, and byte-compares the result to the tracked file.
// Exit 0 only if every carrier reassembles byte-identically, every scanned
// directory contributed at least one carrier, no carrier declares a fence
// twice, AND both inline red arms behave (a mutated canonical fence must be
// detected; a malformed skeleton must be refused). Uncontrolled by any bracket — the two arms are
// self-reported by this run, which is weaker than an external control and is
// labelled as such in CLAUDE.md's map.
//
// Scope: the seven ==== NAME-START/END ==== fence regions only. The embedded
// three.js vendor blob sits OUTSIDE the fences and is deliberately not
// deduplicated here; it is the obvious second occupant of a canonical store
// (build.js vendor already owns its boundaries) and is out of this spike's
// scope on purpose.

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const DIRS = [
  "plugin/skills/mitate/templates",
  "plugin/skills/mitate/examples",
  "fixtures/defect-corpus",
];
const MARK = /==== ([A-Z]+)-(START|END) ====/;

// Every DIRS entry must contribute at least one carrier: a green over a
// reduced scope is indistinguishable from a green over the full one, which is
// the run-brackets.sh lesson one tier down. The adversarial audit of
// 2026-08-02 demonstrated both failure shapes this block closes — a silent
// green with one directory empty, and an uncaught crash blaming the wrong
// line with all three empty.
const files = DIRS.flatMap((d) => {
  const found = readdirSync(d)
    .filter((f) => f.endsWith(".html"))
    .sort()
    .map((f) => join(d, f));
  if (found.length === 0) {
    console.error(`emit-spike: FAIL — ${d} matched no carriers`);
    process.exit(1);
  }
  return found;
});

class SpikeError extends Error {}

// Decompose a file into ordered parts: film line-arrays and named fence
// line-arrays. Fence = START marker line through END marker line, inclusive.
function decompose(text, label) {
  const lines = text.split("\n");
  const parts = [];
  const seenNames = new Set();
  let cur = { kind: "film", lines: [] };
  let open = null;
  for (const line of lines) {
    const m = line.match(MARK);
    if (m && m[2] === "START") {
      if (open) throw new SpikeError(`${label}: ${m[1]}-START inside open fence ${open}`);
      if (seenNames.has(m[1]))
        throw new SpikeError(`${label}: fence ${m[1]} declared twice in one carrier`);
      seenNames.add(m[1]);
      parts.push(cur);
      open = m[1];
      cur = { kind: "fence", name: open, lines: [line] };
    } else if (m && m[2] === "END") {
      if (open !== m[1]) throw new SpikeError(`${label}: ${m[1]}-END without matching START`);
      cur.lines.push(line);
      parts.push(cur);
      open = null;
      cur = { kind: "film", lines: [] };
    } else {
      cur.lines.push(line);
    }
  }
  if (open) throw new SpikeError(`${label}: unterminated fence ${open}`);
  parts.push(cur);
  return parts;
}

function assemble(parts, canon) {
  return parts
    .flatMap((p) => {
      if (p.kind === "film") return p.lines;
      const c = canon.get(p.name);
      if (!c) throw new SpikeError(`assemble: no canonical content for fence ${p.name}`);
      return c;
    })
    .join("\n");
}

// ---- pass 1: canonical store from first occurrence, verify the rest -------
const canon = new Map();
const canonSource = new Map();
const perFile = [];
let divergent = 0;

for (const f of files) {
  const text = readFileSync(f, "utf8");
  let parts;
  try {
    parts = decompose(text, f);
  } catch (e) {
    // A malformed real carrier is refused with the same clean FAIL a scoped
    // miss gets, not an uncaught stack trace that blames the parser's line.
    if (e instanceof SpikeError) {
      console.error(`emit-spike: FAIL — ${e.message}`);
      process.exit(1);
    }
    throw e;
  }
  const fences = parts.filter((p) => p.kind === "fence");
  for (const p of fences) {
    const joined = p.lines.join("\n");
    if (!canon.has(p.name)) {
      canon.set(p.name, p.lines);
      canonSource.set(p.name, f);
    } else if (canon.get(p.name).join("\n") !== joined) {
      divergent++;
      console.error(`  DIVERGENT fence ${p.name} in ${f} (canonical from ${canonSource.get(p.name)})`);
    }
  }
  perFile.push({ f, text, parts, fences });
}

// ---- pass 2: reassemble each carrier from skeleton + canon, byte-compare --
let mismatched = 0;
for (const e of perFile) {
  const out = assemble(e.parts, canon);
  const ok = out === e.text;
  if (!ok) mismatched++;
  const filmLines = e.parts.filter((p) => p.kind === "film").reduce((n, p) => n + p.lines.length, 0);
  console.log(
    `  ${ok ? "ok  " : "FAIL"} ${e.f} — ${e.fences.length} fence(s), skeleton ${filmLines} line(s), ` +
      (ok ? "reassembles byte-identical" : "reassembly differs"),
  );
}

// ---- red arms: prove the comparison can fail and the parser can refuse ----
let armsOk = true;

// arm 1: a mutated canonical fence must produce a detected mismatch
{
  const victim = perFile[0];
  const name = victim.fences[0].name;
  const mutated = new Map(canon);
  mutated.set(name, [...canon.get(name)]);
  mutated.get(name)[0] += "X";
  const out = assemble(victim.parts, mutated);
  if (out === victim.text) {
    armsOk = false;
    console.error(`  ARM-FAIL mutation of ${name} was not detected by byte comparison`);
  } else {
    console.log(`  arm ok — mutated ${name} detected as a mismatch (red is reachable)`);
  }
}

// arm 2: a skeleton with an unterminated fence must be refused, not glossed
{
  try {
    decompose("a\n/* ==== KERNEL-START ==== */\nb\n", "synthetic");
    armsOk = false;
    console.error("  ARM-FAIL unterminated fence was accepted");
  } catch (e) {
    if (e instanceof SpikeError) console.log("  arm ok — unterminated fence refused");
    else throw e;
  }
}

const totalCanon = [...canon.values()].reduce((n, l) => n + l.length, 0);
console.log(
  `\nemit-spike: ${files.length} carrier(s) scanned, ${canon.size} distinct fence(s), ` +
    `${totalCanon} canonical line(s), ${divergent} divergent fence(s), ${mismatched} reassembly mismatch(es)`,
);

// `mismatched` cannot fire from carrier content alone — content divergence is
// pass 1's job and sets `divergent` first. The term guards the round-trip
// machinery (decompose/assemble) against its own future bugs; arm 1 is the
// proof that the byte comparison itself can go red.
if (divergent || mismatched || !armsOk) {
  console.error("emit-spike: FAIL");
  process.exit(1);
}
console.log("emit-spike: ok — every carrier is reproducible from skeleton + canonical fences");
