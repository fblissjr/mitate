#!/usr/bin/env bun
/* Bracket for scripts/cold-build.sh.
 *
 * The script's value is in what it REFUSES and what it DERIVES, and both are
 * claims until something shows them going red. No model is called here: a stub
 * `claude` on MITATE_CLAUDE_BIN prints canned stream-json transcripts, one per
 * arm, so the bracket runs in seconds and in CI.
 *
 *   bun run scripts/bracket-cold-build.js
 *
 * What each arm would miss if it rotted:
 *   refusals   — a run with no cold root, a root inside the repo, a brief that
 *                names the skill, or no plugin to load would silently produce
 *                a transcript of the WRONG population and get analysed as a
 *                cold build;
 *   NOT-A-BUILD — a session that never activated the skill counted as a build
 *                of the docs (it is a routing measurement, and only that);
 *   CONTAMINATED — a read outside the plugin counted as cold;
 *   CAPPED     — a hung session held forever, or reported as complete;
 *   COMPLETE   — the happy path, and the derived read table's one entry.
 *
 * Nothing tracked is written: runs land under a temp root the bracket removes.
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(__dirname, 'cold-build.sh');
const PLUGIN = path.join(ROOT, 'plugin');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mitate-cold-bracket-'));
const COLD = path.join(TMP, 'cold');
const STUB = path.join(TMP, 'claude');

// The stub: `--version` answers like a CLI; otherwise it prints the transcript
// for STUB_MODE. Reads the brief from stdin so the pipe is exercised.
fs.writeFileSync(STUB, `#!/usr/bin/env bash
if [ "\${1:-}" = "--version" ]; then echo "stub 0.0.0 (bracket)"; exit 0; fi
cat >/dev/null
init='{"type":"system","subtype":"init","cwd":"'"$PWD"'"}'
skill='{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Skill","input":{"skill":"mitate:mitate","args":"a film"}}]}}'
readp='{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","input":{"file_path":"'"$MITATE_PLUGIN_DIR"'/skills/mitate/references/method.md"}}]}}'
readinplace='{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","input":{"file_path":"'"$STUB_PLUGIN"'/skills/mitate/references/method.md"}}]}}'
readx='{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Read","input":{"file_path":"'"$STUB_ROOT"'/docs/plan.md"}}]}}'
bashx='{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"cp -R '"$MITATE_PLUGIN_DIR"'/skills/mitate/templates/fences . && cat '"$STUB_ROOT"'/VISION.md"}}]}}'
result='{"type":"result","subtype":"success","total_cost_usd":0.5,"num_turns":3,"permission_denials":[],"usage":{}}'
case "\${STUB_MODE:-build}" in
  nobuild) echo "$init"; echo "$readp"; echo "$result" ;;
  build)   echo "$init"; echo "$skill"; echo "$readp"; echo "$readp"; echo "$result" ;;
  contam)  echo "$init"; echo "$skill"; echo "$readp"; echo "$readx"; echo "$result" ;;
  inplace) echo "$init"; echo "$skill"; echo "$readinplace"; echo "$result" ;;
  bashcontam) echo "$init"; echo "$skill"; echo "$bashx"; echo "$result" ;;
  hang)    echo "$init"; echo "$skill"; sleep 30; echo "$result" ;;
esac
`);
fs.chmodSync(STUB, 0o755);

const run = (args, env, opts = {}) => {
  const r = spawnSync('bash', [opts.script || SCRIPT, ...args], {
    cwd: ROOT, encoding: 'utf8',
    env: { ...process.env, MITATE_COLD_ROOT: COLD, MITATE_CLAUDE_BIN: STUB,
           STUB_PLUGIN: PLUGIN, STUB_ROOT: ROOT, ...(env || {}) },
  });
  return { code: r.status ?? 1, out: String(r.stdout || '') + String(r.stderr || '') };
};
const verdictOf = (label) => {
  const dir = path.join(COLD, 'runs');
  const d = fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => n.endsWith('-' + label)) : [];
  if (!d.length) return null;
  const v = path.join(dir, d[0], 'verdict.json');
  return fs.existsSync(v) ? JSON.parse(fs.readFileSync(v, 'utf8')) : null;
};

const results = [];
const check = (label, ok, detail) => results.push([label, ok, detail]);

try {
  // ---- refusals: each must exit 2 without producing a run ---------------
  {
    const r = run(['--dry-run'], { MITATE_COLD_ROOT: '' });
    check('refuses with no cold root', r.code === 2 && /MITATE_COLD_ROOT is unset/.test(r.out), `exit ${r.code}`);
  }
  {
    const r = run(['--dry-run'], { MITATE_COLD_ROOT: path.join(ROOT, 'site') });
    check('refuses a cold root inside the repo', r.code === 2 && /inside the repo/.test(r.out), `exit ${r.code}`);
  }
  {
    const brief = path.join(TMP, 'names-it.md');
    fs.writeFileSync(brief, 'Use mitate to make me a film about a kettle.\n');
    const r = run(['--dry-run', '--brief', brief]);
    check('refuses a brief that names the skill', r.code === 2 && /brief names mitate/.test(r.out), `exit ${r.code}`);
  }
  {
    // A fake repo with the script and a brief but no plugin/ — the script
    // derives PLUGIN from its own location, so this is the only way to remove it.
    const fake = path.join(TMP, 'fake-repo');
    fs.mkdirSync(path.join(fake, 'scripts', 'cold-briefs'), { recursive: true });
    fs.copyFileSync(SCRIPT, path.join(fake, 'scripts', 'cold-build.sh'));
    fs.writeFileSync(path.join(fake, 'scripts', 'cold-briefs', 'market-crash.md'), 'a film about a kettle\n');
    const r = run(['--dry-run'], {}, { script: path.join(fake, 'scripts', 'cold-build.sh') });
    check('refuses when there is no plugin to load', r.code === 2 && /no plugin at/.test(r.out), `exit ${r.code}`);
  }

  {
    // The cold root may be a git repo of its own; one instruction file there
    // would load into every run. Refuse before anything is copied.
    const rootWithClaude = path.join(TMP, 'root-with-claude');
    fs.mkdirSync(rootWithClaude, { recursive: true });
    fs.writeFileSync(path.join(rootWithClaude, 'CLAUDE.md'), '# not for a cold session\n');
    const r = run(['--dry-run'], { MITATE_COLD_ROOT: rootWithClaude });
    check('refuses a cold root carrying an instruction file', r.code === 2 && /would load into every cold session/.test(r.out), `exit ${r.code}`);
  }

  // ---- derived verdicts, one canned transcript each ------------------------
  {
    const r = run(['--label', 'nobuild', '--cap', '1'], { STUB_MODE: 'nobuild' });
    const v = verdictOf('nobuild');
    check('a session that never activates the skill is NOT-A-BUILD, exit 1',
      r.code === 1 && v && /^NOT-A-BUILD/.test(v.status) && v.skill_activated === false,
      `exit ${r.code}, status ${v && v.status}`);
  }
  {
    const r = run(['--label', 'build', '--cap', '1'], { STUB_MODE: 'build' });
    const v = verdictOf('build');
    const key = 'skills/mitate/references/method.md';
    check('a clean build is COMPLETE, exit 0, and the read table derives its one entry',
      r.code === 0 && v && v.status === 'COMPLETE' && v.plugin_reads && v.plugin_reads[key] === 2
        && v.contaminating_paths.length === 0,
      `exit ${r.code}, status ${v && v.status}, reads ${v && JSON.stringify(v.plugin_reads)}`);
    const m = (() => { try {
      const d = fs.readdirSync(path.join(COLD, 'runs')).find(n => n.endsWith('-build'));
      return JSON.parse(fs.readFileSync(path.join(COLD, 'runs', d, 'manifest.json'), 'utf8'));
    } catch { return null; } })();
    check('the manifest records the copy, the brief hash and the status',
      m && /^working-tree/.test(m.plugin_copy) && /^[0-9a-f]{64}$/.test(m.brief_sha256) && m.status === 'COMPLETE',
      m ? `copy ${m.plugin_copy}, status ${m.status}` : 'no manifest');
  }
  {
    const r = run(['--label', 'contam', '--cap', '1'], { STUB_MODE: 'contam' });
    const v = verdictOf('contam');
    check('a Read outside plugin/ marks the run CONTAMINATED, exit 1',
      r.code === 1 && v && /^CONTAMINATED/.test(v.status) && v.contaminating_paths.some(p => p.endsWith('docs/plan.md')),
      `exit ${r.code}, status ${v && v.status}`);
  }
  {
    // The session is meant to see only its copy. A read of the repo's in-place
    // plugin/ means it found the checkout, which a cache install cannot.
    const r = run(['--label', 'inplace', '--cap', '1'], { STUB_MODE: 'inplace' });
    const v = verdictOf('inplace');
    check('a read of the repo\'s in-place plugin/ (not the run copy) is CONTAMINATED',
      r.code === 1 && v && /^CONTAMINATED/.test(v.status) && Object.keys(v.plugin_reads).length === 0,
      `exit ${r.code}, status ${v && v.status}`);
  }
  {
    const r = run(['--label', 'bashcontam', '--cap', '1'], { STUB_MODE: 'bashcontam' });
    const v = verdictOf('bashcontam');
    check('a repo path inside a Bash command marks CONTAMINATED, while the plugin path in the same command does not',
      r.code === 1 && v && /^CONTAMINATED/.test(v.status)
        && v.contaminating_paths.length === 1 && v.contaminating_paths[0].endsWith('VISION.md'),
      `exit ${r.code}, status ${v && v.status}, paths ${v && JSON.stringify(v.contaminating_paths)}`);
  }
  {
    const r = run(['--label', 'hang', '--cap', '0.03'], { STUB_MODE: 'hang' });
    const v = verdictOf('hang');
    check('a session past the cap is killed and reported CAPPED, not held or called complete',
      r.code === 1 && v && /CAPPED/.test(v.status),
      `exit ${r.code}, status ${v && v.status}`);
  }
} finally {
  fs.rmSync(TMP, { recursive: true, force: true });
}

let red = 0;
for (const [label, ok, detail] of results) {
  console.log(`${ok ? '  ok  ' : '  FAIL'} ${label} — ${detail}`);
  if (!ok) red++;
}
if (red) { console.log(`bracket-cold-build: ${red} of ${results.length} arm(s) FAILED`); process.exit(1); }
console.log(`bracket-cold-build: all ${results.length} arms as specified`);
