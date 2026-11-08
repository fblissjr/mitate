#!/usr/bin/env bun
/* mitate v2 repository self-check.
 *
 * Verifies the structural invariants of the mitate v2 repository and shipped
 * plugin subtree (`plugin/`):
 *   1. Front-door & core architecture docs (`AGENTS.md`, `CLAUDE.md` -> `@AGENTS.md`,
 *      `VISION.md`, `docs/plan.md`, and `wiki/` router entries).
 *   2. Version cascade coherence (`plugin/plugin.json`,
 *      `plugin/.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`,
 *      and `CHANGELOG.md`).
 *   3. Shipped `plugin/` markdown relative link resolution (no link escapes
 *      `plugin/` or points to a missing file).
 *   4. Shipped `plugin/` markdown is ISO-date-free, and every reference in
 *      `plugin/skills/mitate/references/` carries a valid `**Not here.**` edge.
 *   5. Agent Skills frontmatter `description` fits the 1024-char limit.
 *   6. Installed `.git/hooks/pre-commit.local` matches `scripts/install-hooks.sh`.
 *   7. Relative markdown links in root docs (`AGENTS.md`, `README.md`, `VISION.md`),
 *      `docs/*.md`, and `wiki/*.md` resolve to existing files in the repository.
 *
 *   bun run scripts/selfcheck.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PLUGIN_ROOT = path.join(ROOT, 'plugin');
const SUBTREE = path.join(PLUGIN_ROOT, 'skills', 'mitate');
const REFS = path.join(SUBTREE, 'references');
const HEADER_WINDOW = 2500;

const R = f => fs.readFileSync(f, 'utf8');
const SKIP = /^(\.git|node_modules|internal|\.archive|\.build)$/;
const walkFiles = (dir, onFile) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.test(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, onFile); else onFile(p, e.name);
  }
};

const fails = [];
const notes = [];
const fail = m => fails.push(m);

/* ---- 1. AGENTS.md, CLAUDE.md (@AGENTS.md), core docs & wiki router --------- */
{
  const claudePath = path.join(ROOT, 'CLAUDE.md');
  const agentsPath = path.join(ROOT, 'AGENTS.md');
  const visionPath = path.join(ROOT, 'VISION.md');
  const planPath = path.join(ROOT, 'docs', 'plan.md');

  for (const [label, p] of [
    ['AGENTS.md', agentsPath],
    ['CLAUDE.md', claudePath],
    ['VISION.md', visionPath],
    ['docs/plan.md', planPath],
  ]) {
    if (!fs.existsSync(p)) fail(`missing required repository document: ${label}`);
  }

  if (fs.existsSync(claudePath)) {
    const claudeText = R(claudePath).trim();
    if (claudeText !== '@AGENTS.md') {
      fail(`CLAUDE.md must contain only "@AGENTS.md" so AGENTS.md is the single front door (got: ${JSON.stringify(claudeText.slice(0, 80))})`);
    } else {
      notes.push('CLAUDE.md delegates cleanly to @AGENTS.md');
    }
  }

  const expectedWikiPages = [
    'wiki/index.md',
    'wiki/time-and-beats.md',
    'wiki/soundstage-schema.md',
    'wiki/cinematography-and-rigging.md',
    'wiki/metal-engine-and-kernels.md',
    'wiki/instruments-and-review.md',
    'wiki/patterns-and-recipes.md',
  ];

  if (fs.existsSync(agentsPath)) {
    const agentsText = R(agentsPath);
    const missingRoutes = expectedWikiPages.filter(w => !agentsText.includes(w));
    if (missingRoutes.length) {
      fail(`AGENTS.md is missing wiki router references for: ${missingRoutes.join(', ')}`);
    } else {
      const existingWiki = expectedWikiPages.filter(w => fs.existsSync(path.join(ROOT, w)));
      notes.push(`AGENTS.md routes all ${expectedWikiPages.length} wiki modules (${existingWiki.length}/${expectedWikiPages.length} present on disk)`);
    }
  }
}

/* ---- 2. version cascade coherence ----------------------------------------- */
{
  const plugin = JSON.parse(R(path.join(ROOT, 'plugin', '.claude-plugin', 'plugin.json'))).version;
  const agyPluginPath = path.join(ROOT, 'plugin', 'plugin.json');
  const agyPlugin = fs.existsSync(agyPluginPath) ? JSON.parse(R(agyPluginPath)).version : plugin;
  const mkt = JSON.parse(R(path.join(ROOT, '.claude-plugin', 'marketplace.json')));
  const mktMeta = mkt.metadata.version;
  const mktPlugin = mkt.plugins.find(p => p.name === 'mitate').version;
  const heading = (R(path.join(ROOT, 'CHANGELOG.md')).match(/^## (\d+\.\d+\.\d+)/m) || [])[1];
  const all = {
    'plugin/.claude-plugin/plugin.json': plugin,
    'plugin/plugin.json': agyPlugin,
    'marketplace.metadata': mktMeta,
    'marketplace.plugins[mitate]': mktPlugin,
    'CHANGELOG newest heading': heading,
  };
  const distinct = [...new Set(Object.values(all))];
  if (distinct.length !== 1) {
    fail('version cascade disagrees — ' + Object.entries(all).map(([k, v]) => `${k}=${v}`).join(', '));
  } else {
    notes.push(`version cascade coherent at ${distinct[0]}`);
  }
}

/* ---- 3. no pointer inside SHIPPED content escapes plugin/ ----------------- */
{
  const files = [];
  walkFiles(PLUGIN_ROOT, (p, n) => { if (/\.md$/.test(n)) files.push(p); });
  let checked = 0;
  for (const f of files) {
    for (const m of R(f).matchAll(/\]\(([^)#\s]+)(?:#[^)\s]*)?\)/g)) {
      const t = m[1];
      if (/^(https?:|mailto:)/.test(t)) continue;
      checked++;
      const resolved = path.resolve(path.dirname(f), t);
      const inSubtree = resolved.startsWith(PLUGIN_ROOT + path.sep) || resolved === PLUGIN_ROOT;
      if (!inSubtree) {
        fail(`${path.relative(ROOT, f)} links out of the install cache: ${t} — use an absolute repo URL`);
      } else if (!fs.existsSync(resolved)) {
        fail(`${path.relative(ROOT, f)} links to a missing file: ${t}`);
      }
    }
  }
  notes.push(`${checked} relative markdown links inside the shipped plugin/ subtree, all resolving`);
}

/* ---- 4. shipped markdown is date-free current state, with routing edges --- */
{
  const shippedMd = [];
  walkFiles(PLUGIN_ROOT, (p, n) => { if (n.endsWith('.md')) shippedMd.push(p); });
  for (const f of shippedMd) {
    const rel = path.relative(ROOT, f);
    const lines = R(f).split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (/\b20\d\d-\d\d-\d\d\b/.test(lines[i])) {
        fail(`${rel}:${i + 1} carries a dated annotation — shipped markdown under plugin/ is current-state only`);
      }
    }
  }
  const refs = fs.existsSync(REFS) ? fs.readdirSync(REFS).filter(f => f.endsWith('.md')) : [];
  for (const f of refs) {
    const head = R(path.join(REFS, f)).slice(0, HEADER_WINDOW);
    const edge = head.match(/\*\*Not here\.\*\*(.*)/);
    if (!edge) {
      fail(`${f} has no "Not here" edge — say where the adjacent thing lives`);
    } else {
      for (const m of edge[1].matchAll(/`([\w.-]+\.md)`/g)) {
        if (!fs.existsSync(path.join(REFS, m[1]))) {
          fail(`${f}'s "Not here" edge points at ${m[1]}, which is not in references/`);
        }
      }
    }
  }
  notes.push(`${shippedMd.length} shipped markdown files date-free; ${refs.length} references, each with a "Not here" edge`);
}

/* ---- 5. a skill's frontmatter description must fit the Agent Skills limit -- */
{
  const DESCRIPTION_LIMIT = 1024;
  const skillsRoot = path.join(PLUGIN_ROOT, 'skills');
  const skills = fs.existsSync(skillsRoot)
    ? fs.readdirSync(skillsRoot, { withFileTypes: true })
        .filter(e => e.isDirectory() && fs.existsSync(path.join(skillsRoot, e.name, 'SKILL.md')))
        .map(e => [e.name, path.join(skillsRoot, e.name, 'SKILL.md')])
    : [];
  if (!skills.length) {
    fail('no plugin/skills/*/SKILL.md found');
  }
  for (const [name, file] of skills) {
    const fm = (R(file).match(/^---\n([\s\S]*?)\n---/) || [, ''])[1];
    const lines = fm.split('\n');
    let desc = [], inDesc = false;
    for (const l of lines) {
      if (/^description:\s*>/.test(l)) { inDesc = true; continue; }
      if (inDesc) { if (/^[A-Za-z_-]+:/.test(l)) break; desc.push(l.trim()); }
    }
    const inline = (fm.match(/^description:[ \t]+(?!>)(.+)$/m) || [])[1];
    const value = desc.length ? desc.join(' ').trim() : (inline || '').trim();
    if (!value) {
      fail(`plugin/skills/${name}/SKILL.md has no readable frontmatter description`);
    } else if (value.length > DESCRIPTION_LIMIT) {
      fail(`plugin/skills/${name}/SKILL.md frontmatter description is ${value.length} characters, over the Agent Skills limit of ${DESCRIPTION_LIMIT}`);
    } else {
      notes.push(`${name} frontmatter description ${value.length}/${DESCRIPTION_LIMIT} (${DESCRIPTION_LIMIT - value.length} to spare)`);
    }
  }
}

/* ---- 6. installed pre-commit.local hook matches scripts/install-hooks.sh -- */
{
  const hookPath = path.join(ROOT, '.git', 'hooks', 'pre-commit.local');
  let installed = null;
  try { installed = R(hookPath); } catch (e) {}
  if (installed === null) {
    notes.push('no pre-commit.local installed — nothing to compare (run ./scripts/install-hooks.sh to install)');
  } else {
    const gen = R(path.join(__dirname, 'install-hooks.sh'));
    const m = gen.match(/<<'HOOK_BODY'[^\n]*\n([\s\S]*?)\nHOOK_BODY/);
    if (!m) {
      fail('scripts/install-hooks.sh has no readable HOOK_BODY heredoc');
    } else if (installed.trim() !== m[1].trim()) {
      fail('.git/hooks/pre-commit.local differs from scripts/install-hooks.sh — re-run ./scripts/install-hooks.sh --force');
    } else {
      notes.push('installed pre-commit.local matches its generator');
    }
  }
}

/* ---- 7. relative links in root docs, docs/, and wiki/ resolve ------------- */
{
  const docFiles = [
    path.join(ROOT, 'AGENTS.md'),
    path.join(ROOT, 'README.md'),
    path.join(ROOT, 'VISION.md'),
  ].filter(f => fs.existsSync(f));
  walkFiles(path.join(ROOT, 'docs'), (p, n) => { if (/\.md$/.test(n)) docFiles.push(p); });
  walkFiles(path.join(ROOT, 'wiki'), (p, n) => { if (/\.md$/.test(n)) docFiles.push(p); });

  let checked = 0;
  for (const f of docFiles) {
    for (const m of R(f).matchAll(/\]\(([^)#\s]+)(?:#[^)\s]*)?\)/g)) {
      const t = m[1];
      if (/^(https?:|mailto:)/.test(t)) continue;
      checked++;
      const resolved = path.resolve(path.dirname(f), t);
      if (!fs.existsSync(resolved)) {
        fail(`${path.relative(ROOT, f)} links to a missing file: ${t}`);
      }
    }
  }
  notes.push(`${checked} relative markdown links across root docs, docs/, and wiki/, all resolving`);
}

for (const n of notes) console.log('  ok   ' + n);
if (fails.length) {
  console.log('');
  for (const f of fails) console.log('  FAIL ' + f);
  console.log(`\n${fails.length} self-check failure(s)`);
  process.exit(1);
}
console.log('\nself-check: ok');
