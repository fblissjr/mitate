#!/usr/bin/env bun
/* Bracket for scripts/run-brackets.sh — the loop BOTH workflows now call.
 *
 * It earns a control because its failure is the largest one available in this
 * repo: every other bracket is a check over one thing, and this is the harness
 * that decides whether any of them run at all. A green step that executed zero
 * controls looks identical to a green step that executed five.
 *
 * Three properties, one arm each, all learned the expensive way:
 *   - a red bracket does NOT hide its siblings (0.16.41: bracket-commands
 *     failed under `bash -e` and four controls never ran);
 *   - a glob matching nothing FAILS rather than reporting green;
 *   - a fully green set exits 0 and says how many ran.
 *
 * Fixtures are assembled at runtime in a temp directory and are never the real
 * brackets: a control that drives the shipped controls to test itself would
 * take minutes and would fail for their reasons rather than its own.
 *
 *   bun run scripts/bracket-run-brackets.js
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const RUNNER = path.join(__dirname, 'run-brackets.sh');

// Fake brackets: the cheapest thing that exits with a chosen code.
const fake = code => `process.stdout.write("fixture ran\\n"); process.exit(${code});\n`;

// [label, files, expect]
//   expect.code — 'zero' | 'nonzero'
//   expect.says — RegExp the combined output must match
//   expect.ran  — basenames that MUST each have reported running
const ARMS = [
  ['all green', { 'bracket-a.js': fake(0), 'bracket-b.js': fake(0) },
    { code: 'zero', says: /every bracket ran \(2\), all green/, ran: ['bracket-a.js', 'bracket-b.js'] }],

  // THE ARM THAT MATTERS. `a` is red; `b` must still run. Under `bash -e` — the
  // shell GitHub Actions uses — a bare `bun run` in the loop body aborts the
  // step here, and b never executes while the log looks merely failed.
  ['a red bracket does not hide the next one',
    { 'bracket-a.js': fake(1), 'bracket-b.js': fake(0) },
    { code: 'nonzero', says: /brackets failed: *bracket-a\.js/, ran: ['bracket-a.js', 'bracket-b.js'] }],

  ['every red is reported, not just the first',
    { 'bracket-a.js': fake(1), 'bracket-b.js': fake(1) },
    { code: 'nonzero', says: /bracket-a\.js bracket-b\.js/, ran: ['bracket-a.js', 'bracket-b.js'] }],

  // A glob matching nothing used to run the loop zero times and fall through to
  // the success line: a green step having executed no controls at all.
  ['a glob matching nothing fails', {},
    { code: 'nonzero', says: /matched no bracket/, ran: [] }],
];

let wrong = 0, ran = 0;
for (const [label, files, expect] of ARMS) {
  ran++;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-runbrackets-'));
  try {
    for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
    let out = '', code = 0;
    try {
      out = execFileSync('bash', [RUNNER, 'bracket-*.js'],
        { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      code = e.status ?? 1;
      out = String(e.stdout || '') + String(e.stderr || '');
    }
    const codeOk = expect.code === 'zero' ? code === 0 : code !== 0;
    const saidOk = expect.says.test(out);
    // Each named bracket must have announced itself. Exit codes alone cannot
    // tell "b ran and passed" from "b never ran", which is the entire defect
    // this file exists to keep fixed.
    const missing = expect.ran.filter(n => !out.includes(`--- ${n} ---`));
    const ok = codeOk && saidOk && !missing.length;
    if (!ok) wrong++;
    console.log(`${label.padEnd(42)} exit ${code}`
      + `${saidOk ? '' : '  WRONG-MESSAGE'}`
      + `${missing.length ? `  DID-NOT-RUN: ${missing.join(' ')}` : ''}`
      + `${ok ? '' : `  BRACKET FAILED (expected exit ${expect.code}, saying ${expect.says})`}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — run-brackets.sh is the loop both`
    + ` workflows call, so a defect here disables every control at once while CI stays green.`
    + ` Do not trust any bracket result until this is 0.`);
  process.exit(1);
}
console.log(`\nall ${ran} arms as specified`);
