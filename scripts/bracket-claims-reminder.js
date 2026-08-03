/* Bracket for the CLAIMS REMINDER hook (scripts/claims-reminder.sh).
 *
 * The reminder is check-shaped — it classifies tool calls and speaks or stays
 * silent — so invariant 6 applies: it must be provable red. The rot this
 * bracket exists to notice is the classifier WIDENING by accident (a new path
 * added to a class starts firing on ordinary edits, the class becomes
 * wallpaper, and the reminder trains people to scroll past it) and the dedup
 * breaking (every edit fires, same outcome). Arms 2-4 are the ones that go
 * red for those; arm 6 catches the message citing a commit that no longer
 * resolves — a reminder that cites a dangling sha is a reminder nobody
 * believes.
 *
 *   bun run scripts/bracket-claims-reminder.js        (repo root; needs git)
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const HOOK = path.join(__dirname, 'claims-reminder.sh');
const TMP = process.env.TMPDIR || os.tmpdir();
// Unique per bracket run so a previous run's dedup state cannot leak in.
const SID = `bracket-${process.pid}`;
const sessions = new Set();

const run = (payload) => {
  if (payload && typeof payload === 'object' && payload.session_id) sessions.add(payload.session_id);
  const input = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const r = spawnSync('bash', [HOOK], { input, encoding: 'utf8' });
  return { code: r.status ?? 1, out: (r.stdout || '') + (r.stderr || '') };
};

// [label, payload, expect]
//   expect.speaks — additionalContext MUST be present and match this RegExp
//   expect.silent — additionalContext MUST be absent
//   every arm also requires exit 0 and permissionDecision allow: a hook that
//   crashes or denies is worse than one that says nothing.
const ARMS = [
  // Deleting this arm loses the only proof the reminder ever speaks at all.
  ['a CHANGELOG edit fires the changelog class',
    { tool_name: 'Edit', session_id: `${SID}-a`, tool_input: { file_path: '/x/CHANGELOG.md' } },
    { speaks: /contradicted its own next paragraph/ }],
  // THE DEDUP ARM. Without it, removing the state-file check leaves every arm
  // green while the reminder fires on every edit — the wallpaper failure the
  // whole design exists to avoid. Recorded red against a dedup-stripped copy
  // before this file was trusted.
  ['the same edit in the same session is silent',
    { tool_name: 'Edit', session_id: `${SID}-a`, tool_input: { file_path: '/x/CHANGELOG.md' } },
    { silent: true }],
  // Arms 3 and 4 pin the classifier's EDGES: a tool file and a plain command
  // are not record surfaces, and a widened pattern turns these red first.
  ['a template tool edit is silent (no false class)',
    { tool_name: 'Edit', session_id: `${SID}-b`, tool_input: { file_path: '/x/plugin/skills/mitate/templates/smoke.js' } },
    { silent: true }],
  ['a non-commit Bash call is silent',
    { tool_name: 'Bash', session_id: `${SID}-b`, tool_input: { command: 'ls -la' } },
    { silent: true }],
  ['a record-set edit fires the record class',
    { tool_name: 'Write', session_id: `${SID}-c`, tool_input: { file_path: '/x/internal/log/log_2026-01-01.md' } },
    { speaks: /cite the command, not its output/ }],
  // A SECOND path per multi-path class, so accidental narrowing of the
  // pattern list goes red somewhere: with only one path pinned, losing
  // docs/postmortems/ from the record class or docs/README.md from the
  // status class would leave every arm green (peer review, 2026-08-03).
  ['a postmortem write fires the record class too',
    { tool_name: 'Write', session_id: `${SID}-f`, tool_input: { file_path: '/x/docs/postmortems/2026-01-01_session_x.md' } },
    { speaks: /cite the command, not its output/ }],
  ['a status-surface edit fires the status class',
    { tool_name: 'Edit', session_id: `${SID}-d`, tool_input: { file_path: '/x/docs/working-plan.md' } },
    { speaks: /validity window/ }],
  ['a docs README edit fires the status class too',
    { tool_name: 'Edit', session_id: `${SID}-g`, tool_input: { file_path: '/x/docs/README.md' } },
    { speaks: /validity window/ }],
  ['the first git commit of a session fires once',
    { tool_name: 'Bash', session_id: `${SID}-e`, tool_input: { command: 'git commit -m "x"' } },
    { speaks: /checks no count, status or attribution/ }],
  ['malformed stdin allows silently, exit 0',
    'this is not json',
    { silent: true }],
];

// The PostCompact arm needs a three-step sequence (fire, clear, fire again),
// which the table above cannot express — so it runs after the loop.

let wrong = 0, ran = 0;
try {
  for (const [label, payload, expect] of ARMS) {
    const { code, out } = run(payload);
    let obj = null;
    try { obj = JSON.parse(out.trim().split('\n').pop()); } catch (e) { /* judged below */ }
    const hso = obj && obj.hookSpecificOutput;
    const allowOk = code === 0 && hso && hso.permissionDecision === 'allow';
    const ctx = hso ? hso.additionalContext : undefined;
    const ok = expect.speaks
      ? allowOk && typeof ctx === 'string' && expect.speaks.test(ctx)
      : allowOk && ctx === undefined;
    ran++;
    if (!ok) wrong++;
    console.log(`${label.padEnd(52)} exit ${code}  ${ctx !== undefined ? 'SPOKE' : 'silent'}`
      + `${ok ? '' : `  BRACKET FAILED (expected ${expect.speaks ? `to speak, matching ${expect.speaks}` : 'silence'}, allow, exit 0)`}`);
  }

  // THE POST-COMPACT ARM: compaction can summarize a delivered reminder out
  // of context while state says "fired", so --clear-session must restore one
  // more fire — and without this arm, breaking the clear mode leaves every
  // other arm green while long sessions run unguarded after compaction and
  // the retirement measurement counts their corrections unfairly.
  {
    const sid = `${SID}-h`;
    sessions.add(sid);
    const p1 = run({ tool_name: 'Edit', session_id: sid, tool_input: { file_path: '/x/CHANGELOG.md' } });
    const clr = spawnSync('bash', [HOOK, '--clear-session'],
      { input: JSON.stringify({ session_id: sid }), encoding: 'utf8' });
    const p2 = run({ tool_name: 'Edit', session_id: sid, tool_input: { file_path: '/x/CHANGELOG.md' } });
    const spoke = o => { try { return JSON.parse(o.trim().split('\n').pop()).hookSpecificOutput.additionalContext !== undefined; } catch (e) { return false; } };
    const ok = spoke(p1.out) && clr.status === 0 && spoke(p2.out);
    ran++;
    if (!ok) wrong++;
    console.log(`${'post-compact state clear restores one fire'.padEnd(52)} `
      + `${spoke(p1.out) ? 'SPOKE' : 'silent'}/clear ${clr.status}/${spoke(p2.out) ? 'SPOKE' : 'silent'}`
      + `${ok ? '' : '  BRACKET FAILED (expected SPOKE, exit 0, SPOKE)'}`);
  }

  // Arm: every commit sha the reminder's message text cites must resolve.
  // A message teaching from a dangling example reads as archaeology and
  // stops being believed — this is how the reminder itself rots.
  {
    const text = fs.readFileSync(HOOK, 'utf8');
    // The digit requirement excludes pure-letter hex-lookalikes ("effaced");
    // there is deliberately NO letter requirement, because an all-digit sha
    // prefix (1232664 is a real one in this repo) is still a sha and still
    // rots. A 7+ digit number in a message that is not a sha goes red here,
    // and rephrasing the message is the correct fix (peer review, 2026-08-03).
    const shas = [...new Set(text.match(/\b[0-9a-f]{7,40}\b/g) || [])]
      .filter(s => /\d/.test(s));
    let bad = [];
    for (const s of shas) {
      const r = spawnSync('git', ['cat-file', '-e', `${s}^{commit}`], { cwd: path.join(__dirname, '..') });
      if (r.status !== 0) bad.push(s);
    }
    const ok = shas.length > 0 && bad.length === 0;
    ran++;
    if (!ok) wrong++;
    console.log(`${'every sha the messages cite resolves'.padEnd(52)} ${shas.length} sha(s)`
      + `${ok ? '' : `  BRACKET FAILED (${shas.length === 0 ? 'no shas found — the grep is broken' : `dangling: ${bad.join(' ')}`})`}`);
  }
} finally {
  for (const s of sessions) fs.rmSync(path.join(TMP, `claims-reminder.${s}`), { recursive: true, force: true });
}

if (wrong) {
  console.log(`\n${wrong} arm(s) did not behave as specified — the reminder is firing on the wrong `
    + `calls, has gone silent on the right ones, or teaches from a dangling example. A reminder `
    + `that fires wrong trains people to ignore it, which is worse than deleting it.`);
  process.exit(1);
}
console.log(`\nall ${ran} arms as specified`);
