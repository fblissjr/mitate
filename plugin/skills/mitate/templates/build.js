#!/usr/bin/env bun
// Build pipeline: scene source -> offline bundle -> frames -> mp4.
// The scene file is the single source of truth; everything here is derived,
// so deriving it is one command instead of shell archaeology.
//
//   bun run build.js vendor <scene.html>      -> embed three into the scene
//   bun run build.js bundle <scene.html>      -> assert the scene is self-contained (embeds first if needed)
//   bun run build.js frames <scene.html> [fps]-> frames/ via shoot.js
//   bun run build.js video  <name> [fps]      -> <name>.mp4 from frames/
//   bun run build.js all    <scene.html> [fps]-> vendor + bundle + frames + video
//   bun run build.js loop   <scene.html> [fps] [w] -> <name>.webp, inline in a README (decodes smoothly; wants a held camera)
//   bun run build.js avif   <scene.html> [fps] [w] -> <name>.avif, inline, much smaller file (decode-heavy at playback)
//   bun run build.js poster <scene.html> [t] [w]   -> <name>.jpg still + markdown snippet
//   bun run build.js sheet  <scene.html> [w] [frac] [nocap] -> <name>.sheet.jpg contact sheet + .squint.jpg
//   bun run build.js aspect <scene.html> [t]      -> <name>.aspect.jpg, one moment at four window shapes
//   bun run build.js strip  <scene.html> <t0> <t1> [fps] -> <name>.strip.jpg, consecutive frames
//   bun run build.js motion <scene.html> [fps]     -> per-beat motion profile + dead air, no files kept
//   bun run build.js check  <scene.html>           -> cross-reference the declarative tables, no browser, no frames
//
// Prereqs: bun add three@0.185.1 playwright-core@1.61.1. That is the whole list
// for BUILDING AND REVIEWING a scene — `vendor`, `bundle`, `frames`, `probe`,
// `poster`, `sheet`, `aspect` and `strip` need no external binary at all.
// `check` needs neither: it is string work over the scene file.
// EXPORT needs encoders: `video`/`all` need ffmpeg, `avif` needs avifenc (macOS:
// brew install libavif), `loop` needs img2webp (brew install webp). `motion`
// still needs ffmpeg pending a recalibration of its scale.
// execFileSync, not execSync: no shell means no quoting rules to get wrong, and
// a path containing a space cannot break the command. Same class of bug as the
// exec-form rule for plugin hooks -- that rule covers hooks.json and says
// nothing about plugin scripts, but the surface is identical. (This cited a doc
// path in a DIFFERENT repo until 0.16.30: it resolved for nobody holding this
// file, in a clone or an install cache. A comment may name a rule; it may not
// cite a path it cannot reach.)
const { execFileSync } = require('child_process');
const run = (cmd, args, opts = {}) => execFileSync(cmd, args, { stdio: 'inherit', ...opts });
const fs = require('fs');
const path = require('path');

// three dropped its UMD build after 0.160 (`build/three.min.js` no longer
// exists), and its ESM build splits across three.module.min.js +
// three.core.min.js. We can't use ESM in the scene either: Chrome CORS-blocks
// module imports over file://, and opening the scene straight from disk is the
// point. So we bundle three ourselves into one classic script that sets
// window.THREE — same ergonomics the old UMD build had, no network, no CDN.
// Review passes capture JPEG: ~6x faster than PNG over the identical readback
// path, and they tile to .jpg anyway. Measurements (motion) and deliverables
// (frames/all) override this back to png -- a frame-difference metric must not
// eat JPEG artifacts, and a master must stay lossless.
const REVIEW_FMT = 'jpeg';
const REVIEW_EXT = REVIEW_FMT === 'jpeg' ? 'jpg' : 'png';
// One place for the output-basename rule, including the .bundled legacy suffix
// now that nothing produces .bundled.html.
const outBase = s => s.replace(/(\.bundled)?\.html$/, '');
const VENDOR = 'three.global.js';
const VENDOR_TAG = /<script src="\.\/three\.global\.js"><\/script>/;
// THE pin, in one place. It was prose in a comment at the top of this file and
// nothing checked it, so a workspace where someone ran `bun add three` without
// the version embedded whatever it had — silently, permanently, into a scene
// that then looks self-contained and correct. Minification mangles three's own
// REVISION into a getter (`REVISION:()=>bK`), so the shipped bytes cannot be
// interrogated for a version after the fact. Hence the stamp below: the scene
// carries, in readable text, which three is inside it.
const THREE_PIN = '0.185.1';
// Written here, verified by scripts/selfcheck.js — which fails loudly on every
// scene at once if this format ever changes, so the format needs no second copy
// on this side.
const STAMP = v => `<!-- three ${v} embedded by build.js vendor -->`;

function vendor(dir, target) {
  // Which three is actually about to be embedded — resolved from the workspace,
  // not read off the pin, because the pin is what we WANT and this is what we
  // HAVE. Refuse on mismatch: an unnoticed version swap is undetectable in the
  // output afterwards (see THREE_PIN). VENDOR_ANY_THREE=1 for a deliberate
  // upgrade spike, which then has to re-stamp every scene it touches.
  // Resolved BEFORE the cache check, because the cached path embeds too and a
  // stamp reading "three undefined" would be worse than no stamp at all.
  let resolved;
  try {
    resolved = require(require.resolve('three/package.json', { paths: [dir, process.cwd()] })).version;
  } catch (e) {
    throw new Error(`cannot resolve three from ${dir} — run: bun add three@${THREE_PIN}`);
  }
  if (resolved !== THREE_PIN && process.env.VENDOR_ANY_THREE !== '1') {
    throw new Error(`three ${resolved} installed, but this skill pins ${THREE_PIN}. `
      + `Embedding the wrong version is invisible in the output. `
      + `Run: bun add three@${THREE_PIN}   (or VENDOR_ANY_THREE=1 to override deliberately)`);
  }
  // VENDOR_CACHE: reuse the built library text across calls within one run.
  // The bundle is a pure function of the pinned three version, but smoke.js
  // bundles every template scene through a per-scene `build.js bundle` call,
  // which used to re-run the full `bun build --minify` of three (~1-2s) once
  // per scene per gate run — identical input, identical output, product
  // discarded each time. The cache is set (and deleted) by the caller, so a
  // normal single-scene invocation is unaffected.
  const cache = process.env.VENDOR_CACHE;
  if (cache && fs.existsSync(cache)) {
    const embedded = target ? embedInto(target, fs.readFileSync(cache, 'utf8'), resolved) : [];
    if (embedded.length) console.log('embedded three (cached) into: ' + embedded.join(', '));
    return embedded;
  }
  // PID-salted, like workspace() below. Both are build inputs that this
  // function creates, reads, and unlinks — nothing else on disk names them (the
  // scene matches VENDOR_TAG's TEXT, not a file). Unsalted, two concurrent
  // build.js runs in one scene folder shared them, and the loser's `finally`
  // deleted the winner's entry file mid-build. Reachable in exactly the case
  // this repo already documents: more than one session live in one checkout.
  const out = path.join(dir, `.${process.pid}-${VENDOR}`);
  const entry = path.join(dir, `.three-entry-${process.pid}.js`);
  // The NODE stack: three/webgpu (WebGPURenderer with transparent WebGL2
  // fallback, node materials) + three/tsl (the shading-language node functions,
  // spread flat onto THREE so scene code writes THREE.uniform, THREE.mix,
  // THREE.mx_fractal_noise_float) + the TSL display passes and SkyMesh (the
  // node-stack Sky). Always included: they cost bundle bytes when unused
  // (about a megabyte; figure and conditions in references/webgpu-stack.md), and the
  // alternative — a second vendor file with its own staleness and load-order
  // rules — costs a failure mode. Determinism note for scene authors: every
  // bundled pass is per-frame pure; temporal passes (TRAA, afterimage,
  // accumulation motion blur) are NOT bundled and must stay out — they carry
  // state across frames and break the seekTo byte-identity contract. The TSL
  // `time` node auto-increments and is banned for the same reason: drive a
  // THREE.uniform(0) from seekTo instead.
  fs.writeFileSync(entry, [
    "import * as THREE from 'three/webgpu';",
    "import * as TSL from 'three/tsl';",
    "import {SkyMesh} from 'three/addons/objects/SkyMesh.js';",
    "import {bloom} from 'three/addons/tsl/display/BloomNode.js';",
    "import {dof} from 'three/addons/tsl/display/DepthOfFieldNode.js';",
    "import {film} from 'three/addons/tsl/display/FilmNode.js';",
    "import {chromaticAberration} from 'three/addons/tsl/display/ChromaticAberrationNode.js';",
    "globalThis.THREE = Object.assign({}, THREE, TSL, {SkyMesh, bloom, dof, film, chromaticAberration});",
    "",
  ].join('\n'));
  try {
    // --format=iife is required, not cosmetic: the scene is a classic script, so
    // an esm/plain bundle's top-level identifiers land in global scope and
    // collide with scene variables (a minified `MW` shadowed one and broke the
    // example). IIFE keeps the library's internals to itself, exactly as the old
    // UMD build did; only globalThis.THREE escapes.
    run('bun', ['build', entry, '--target=browser', '--format=iife', '--minify', '--outfile', out]);
  } finally {
    fs.unlinkSync(entry);
  }
  // EMBED, then delete the .js. The library is a build input, never a shipped
  // artifact: a scene that loads it via <script src> is not self-contained, and
  // the moment anyone copies or commits just the .html it silently renders
  // nothing. That shipped -- a committed 3D example sat in examples/ with a
  // dangling ./three.global.js reference and did not run at all. Embedding is
  // the only form that makes "opens straight from disk" true by construction,
  // so the tooling does it automatically rather than asking authors to remember
  // a bundle step. Cost is about a megabyte per scene, paid once, and accepted.
  const lib = fs.readFileSync(out, 'utf8');
  fs.unlinkSync(out);
  if (cache) fs.writeFileSync(cache, lib);
  const embedded = target ? embedInto(target, lib, resolved) : [];
  if (embedded.length) console.log('embedded three into: ' + embedded.join(', '));
  else console.log('three already embedded (no vendor tag in ' + target + ')');
  return embedded;
}

// Splice the library into every .html in `dir` that still carries the vendor
// tag. Replacement MUST be a function, not a string: in a string replacement
// `$&`, `$'` and `` $` `` are substitution patterns and minified three contains
// `$&`, which would splice the matched tag into the middle of the library. Also
// split any literal </script> so the library cannot terminate the host tag.
function embedInto(target, lib, version) {
  // ONE file: the scene we were asked about. An earlier version walked the whole
  // directory and rewrote every .html carrying the tag, which meant running any
  // command on a scene sitting beside the template it was copied from silently
  // rewrote `scene.template.html` itself with 0.77 MB of inlined three.js — and
  // the result looks idempotent, so nothing ever flags it.
  const inline = STAMP(version) + '\n<script>' + lib.replace(/<\/script>/gi, '<\\/script>') + '</script>';
  const html = fs.readFileSync(target, 'utf8');
  if (!VENDOR_TAG.test(html)) return [];
  fs.writeFileSync(target, html.replace(VENDOR_TAG, () => inline));
  return [path.basename(target)];
}

// bundle() is now an ASSERTION, not a transform. Vendoring embeds the library
// directly into the scene (see vendor/embedInto), so a scene is self-contained
// by the time anything can open it and there is no second ".bundled.html"
// artifact to keep in sync. Kept as a command because callers and habits refer
// to it, and because "make sure this file is self-contained" is still a thing
// worth being able to ask for. Idempotent: safe to run any number of times.
function bundle(src) {
  ensureVendor(src);                       // embeds in place if the tag is still there
  const html = fs.readFileSync(src, 'utf8');
  if (VENDOR_TAG.test(html)) {
    throw new Error(`could not embed three into ${src} — vendor tag still present`);
  }
  // Then assert the PROPERTY, not one spelling of one tag. The check above only
  // knows the canonical `<script src="./three.global.js"></script>`; a scene
  // referencing anything external under any other spelling -- single quotes, a
  // CDN, a differently-named bundle -- passed "self-contained" while pointing at
  // a file that would not travel with it. That failure already shipped once: a
  // committed 3D example carried a dangling reference and rendered nothing at
  // all.
  //
  // Two subtleties, both found by controls rather than by reasoning:
  //  - HTML permits UNQUOTED attribute values, so `src=./evil.js` is valid and
  //    an approximation requiring quotes waves it through -- the same
  //    "knows one spelling" defect one level down. Hence the optional-quote
  //    alternation.
  //  - It is not only <script>. A Canvas2D scene is likelier to pull a font or
  //    stylesheet than a script, so restricting this to <script src> made the
  //    guarantee weakest exactly where it was advertised strongest. <link>,
  //    <img>, <iframe>, <video>, <audio>, <source>, <track> and <embed> travel
  //    the same way. <a href> is deliberately NOT included: a hyperlink is not
  //    an embedded resource and a scene may legitimately link out.
  // data: and blob: URIs are genuinely self-contained and are allowed.
  const EXTERNAL_REF =
    /<(?:script|link|img|iframe|video|audio|source|track|embed)\b[^>]*?\b(?:src|href)\s*=\s*(?:"(?!data:|blob:)[^"]*"|'(?!data:|blob:)[^']*'|(?!["']|data:|blob:)[^\s>]+)/i;
  const ext = html.match(EXTERNAL_REF);
  if (ext) {
    throw new Error(`${src} is not self-contained — external reference remains: ${ext[0].trim()}`);
  }
  console.log(`self-contained -> ${src}`);
  return src;
}
function ensureVendor(scene) {
  const dir = path.dirname(path.resolve(scene));
  let src = '';
  try { src = fs.readFileSync(scene, 'utf8'); } catch (e) { return; }
  if (!VENDOR_TAG.test(src)) return;
  // NEVER embed into a shipped template. Embedding is right for an authored
  // film -- that is what makes it self-contained -- but a *.template.html is a
  // 32 KB starting point that must KEEP its vendor tag to stay readable and
  // copyable. Running any command on one used to silently inflate it with
  // 0.77 MB of inlined three.js, and because the result is idempotent nothing
  // ever flagged it; it reached `git add` once. Copy the template first, then
  // work on the copy -- which is what the workflow says to do anyway.
  if (/\.template\.html$/.test(path.basename(scene))) {
    throw new Error(
      `refusing to embed three into ${path.basename(scene)} — it is a shipped `
      + `template and must keep its vendor tag. Copy it to a working scene first.`);
  }
  vendor(dir, path.resolve(scene));                             // embeds THIS scene only
}

// dir defaults to the SAME expression video() uses, so the shoot half and the
// encode half of `all` can never disagree about where frames live. It used to
// default to a bare 'frames', which then OVERRODE an ambient FRAMES_DIR on its
// way to shoot.js while video() still honoured that ambient value -- so
// `FRAMES_DIR=X build.js all` shot into frames/ and encoded from X/. That is
// the same ship-the-wrong-film failure video()'s comment below describes, just
// reintroduced through the other half of the pair, and it is SILENT whenever X
// already holds frames: measured, a stale single frame in X produced a 0.0 MB
// one-frame mp4 and exit 0. Callers that deliberately own a scratch dir
// (sheet/loop/avif/strip) still pass one explicitly and are unaffected.

/* ---------- workspace: ONE door to scratch space -----------------------------
   Every review command used to hardcode its own dir name in the CWD
   (.sheetframes, .motionframes, .stripframes, .aspectframes, .loopsrc,
   .loopframes, .avifsrc, .avifframes) and rmSync it at entry AND in finally.
   Five independent agents hit the consequence: two commands in one directory
   silently corrupt each other. Measured worst case, two concurrent `frames`
   runs produced a single dir holding 3 frames from one film and 70 from
   another — 73 where one film alone needs 74 — and the next encode would have
   shipped that chimera without a word.

   Suffixing each of the six names with a pid would be the bandaid, and it is
   the wrong shape: the seventh command someone adds will hardcode a seventh
   name. So there is one function, and it is the only way to get scratch space.
   A new command gets isolation for free, which is the whole point. */
function workspace(scene, tag) {
  const base = path.basename(String(scene || 'scene')).replace(/\.[^.]+$/, '').replace(/[^\w.-]/g, '_');
  const dir = `.wk-${base}-${tag}-${process.pid}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}


function frames(scene, fps = 30, dir = process.env.FRAMES_DIR || 'frames', extraEnv = {}) {
  ensureVendor(scene);
  run('bun', ['run', path.join(__dirname, 'shoot.js'), scene, 'full', String(fps)],
      { env: { ...process.env, FRAMES_DIR: dir, SHOOT_FORMAT: 'png', ...extraEnv } });
}

function video(name, fps = 30) {
  const out = outBase(name) + '.mp4';
  // Honour the same override shoot.js does. video() hardcoded 'frames/' while
  // shoot.js read FRAMES_DIR, so a hand-run `FRAMES_DIR=shots shoot.js ... full`
  // followed by `build.js video` silently encoded the STALE frames/ from a
  // previous render -- shipping the old film, which is the exact failure the
  // stale-tail fix exists to prevent.
  const dir = process.env.FRAMES_DIR || 'frames';
  run('ffmpeg', ['-y', '-framerate', String(fps), '-i', path.join(dir, 'f%05d.png'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', out]);
  const bytes = fs.statSync(out).size;
  console.log(`encoded -> ${out} (${(bytes / 1048576).toFixed(1)} MB)`);
  // crf 17 is chosen for quality, and for anything past ~20s it lands well over
  // the 10MB ceiling on a GitHub issue/PR attachment -- which is the ONLY way to
  // get a real player, since a repo-relative mp4 is served as text/plain. So the
  // pipeline's own output could not be delivered the way poster() tells you to
  // deliver it, and the fix was left to be rediscovered by hand every time. A
  // 39s film came out at 19MB and needed a manual crf 24 pass to reach 8.3MB.
  if (bytes > ATTACH_LIMIT) {
    const small = out.replace(/\.mp4$/, '-small.mp4');
    // Limit read from the constant, not typed into the string: a forced test of
    // this branch printed "0.2 MB exceeds the 10MB limit", which is the shape of
    // a message that will lie the first time anyone edits the constant.
    console.error(`\nWARNING: ${(bytes / 1048576).toFixed(1)} MB exceeds the ` +
      `${(ATTACH_LIMIT / 1048576).toFixed(0)}MB attachment limit, so this` +
      `\nfile cannot be dragged into an issue/PR composer -- and that is the only route` +
      `\nto an inline player. Re-encode at a higher crf:\n` +
      `\n  ffmpeg -i ${out} -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p \\` +
      `\n         -movflags +faststart ${small}\n`);
  }
}

// GitHub renders animated WebP inline in markdown; it does NOT render a
// repo-relative mp4 as a player. Mechanism (verified by fetching both): GitHub's
// raw endpoint serves .webp as `image/webp`, but serves video as
// `text/plain; charset=utf-8` with X-Content-Type-Options: nosniff, so no
// browser will treat it as media. <video> is stripped from GFM on top of that.
// So `loop` is the output that embeds in a README, and mp4 is the output you
// attach via an issue/PR composer to get a real player.
//
// Do not track the .webp under Git LFS — raw returns the pointer file, not the
// image, and the README shows a broken image.
//
// Sizing is the whole game — GitHub's cap is 10MB. Measured on the 12s template
// scene at 960px/24fps: mp4 0.52MB, gif 12.08MB, webp 15.56MB. WebP loses to GIF
// there because the template's camera sway moves every pixel every frame, which
// defeats inter-frame compression. Hold the camera (CONFIG.sway = 0) and keep it
// short; see references/recordings.md.
//
// ...unless you ship AVIF, which dissolves the size side of that constraint but
// adds a playback cost. Same 12s moving-camera scene re-measured today: webp
// 15.16MB (reproducing the number above), mp4 0.68MB, AVIF 0.28MB. On the
// held-camera example: webp 0.195MB, AVIF 0.029MB. AVIF is an AV1
// keyframe-plus-deltas stream, so it inter-frame compresses the way the mp4 does
// instead of collapsing like WebP. But that same AV1 sequence is decoded in
// software at playback (no hardware video path), so it costs decode CPU and was
// observed to stutter on modest hardware. So `loop` (WebP) and `avif` are peer
// options with different costs -- WebP's is on disk, AVIF's is at playback --
// choose by camera style and audience hardware.
const LOOP_LIMIT = 10 * 1024 * 1024;
// Same 10MB number, different mechanism: LOOP_LIMIT is the inline-image cap a
// committed .webp has to fit under, ATTACH_LIMIT is the issue/PR upload cap an
// .mp4 has to fit under. Named separately so changing one does not silently
// move the other.
const ATTACH_LIMIT = 10 * 1024 * 1024;

// Shoot the scene into srcDir, scale each frame into tmpDir, and return the
// scaled PNG paths in order. The shoot->scale->glob prefix is identical for
// every animated inline export; only the final encoder call differs, so both
// avif() and loop() share this and diverge only at the encode step.
function shootAndScale(scene, fps, width, srcDir, tmpDir) {
  // JPEG q92 intermediates, not PNG masters: these frames exist only to be
  // downscaled and re-encoded lossy at q60, and PNG capture measured 164-190
  // ms/frame against 29 ms for JPEG over the identical readback path (~95% of
  // capture time on hardware GL). q92 sits far above the q60 final, so the
  // generational loss is below the deliverable's own floor. Measurements
  // (motion) and lossless masters (frames/all) stay PNG — see frames().
  frames(scene, fps, srcDir, { SHOOT_FORMAT: 'jpeg' });
  fs.mkdirSync(tmpDir, { recursive: true });
  run('ffmpeg', ['-y', '-i', path.join(srcDir, 'f%05d.jpg'), '-vf', `scale=${width}:-2`,
    path.join(tmpDir, 'f%05d.png')], { stdio: ['ignore', 'ignore', 'inherit'] });
  const pngs = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort()
                 .map(f => path.join(tmpDir, f));
  if (!pngs.length) throw new Error('no scaled frames in ' + tmpDir);
  return pngs;
}

// The small-file inline output. Same shape as loop() -- shoot, scale, encode --
// but avifenc instead of img2webp, and no sway warning, because sway is not what
// costs an AVIF anything. Wins decisively on size, but that is not the whole
// picture: an animated AVIF is an AV1 still-image sequence, decoded in software
// frame by frame with no hardware video path, so it costs decode CPU at playback
// and was observed to stutter on modest hardware (worse in macOS Preview than
// Chrome). loop() (WebP) trades that away -- larger on disk, but smooth to play
// and verified rendering inline. Peer options, chosen by camera style and
// audience hardware, not a ranking. The -s knob below is encode-time only; it
// cannot make an AVIF cheaper to PLAY.
//
// -s 6 is the measured knee on encoder speed: s8 produced files 2.3x larger for
// (encoder effort — unrelated to the renderer-backend speedup that shares this
//  number; see recordings.md vs webgpu-stack.md)
// one second less, s4 gave no further size gain for double the time. Encoding
// 288 frames costs ~11s, negligible against the ~65s it takes to shoot them.
// -q 60 matches what `loop` passes img2webp; decoded frames were inspected and
// hold up (crisp overlay text, smooth gradients, SSIM 0.97 against source).
//
// Verifying the output is animated: use `avifdec --info <file>`, which prints
// "N frames" and the repeat count. Do NOT use ffprobe -- it reports an animated
// AVIF as a single frame, which reads exactly like "avifenc silently wrote a
// still" and would send you rewriting a working encoder. Cross-check by size if
// unsure: one 960px still of this scene is 7.3KB against 290KB for the 288-frame
// sequence, so a sequence that collapsed to a still is off by a factor of 40.
// Shared scaffolding for the two animated inline exports — avif() and loop()
// differ only in encoder and warning text, and their setup had already drifted
// apart once before this extraction. Shape, and why each piece:
//   - own workspace pair, never frames/: `loop` once reused frames/ and
//     silently destroyed the full-resolution masters a previous `build.js all`
//     had shot;
//   - encoder probed BEFORE the shoot: the missing-binary failure used to
//     surface only after the full multi-second shoot had already run;
//   - explicit file list rather than a shell glob: not for ARG_MAX (execFileSync
//     argv hits the same execve limit) but for deterministic ordering and a
//     loud failure when scaling produced nothing;
//   - clean in finally: a failed run used to leave scratch dirs full of frames
//     in the scene directory, where `git add -A` sweeps them in.
function inlineExport(scene, width, fps, o) {
  const out = outBase(scene) + o.ext;
  const src = workspace(scene, o.tag + 'src'), tmp = workspace(scene, o.tag);
  try {
    try { execFileSync(o.encoder, o.probeArgs, { stdio: 'ignore' }); }
    catch (e) { throw new Error(`${o.encoder} not found — install it (macOS: brew install ${o.brew})`); }
    const pngs = shootAndScale(scene, fps, width, src, tmp);
    o.encode(pngs, out);
  } finally {
    for (const d of [src, tmp]) fs.rmSync(d, { recursive: true, force: true });
  }
  const bytes = fs.statSync(out).size;
  const mb = (bytes / 1048576).toFixed(o.digits);
  console.log(`${o.tag} -> ${out} (${mb} MB, ${width}px @ ${fps}fps)`);
  if (bytes > LOOP_LIMIT) {
    console.error(`WARNING: ${mb} MB exceeds GitHub's 10MB inline limit. ${o.shrink(width)}`);
  }
  return out;
}

function avif(scene, width = 720, fps = 12) {
  // avifenc, not ffmpeg: same dependency shape as img2webp for the webp path —
  // the ffmpeg most people have does not reliably mux an animated AVIF even
  // when it can encode AV1.
  return inlineExport(scene, width, fps, {
    ext: '.avif', tag: 'avif', encoder: 'avifenc', probeArgs: ['--version'], brew: 'libavif',
    digits: 3,
    encode: (pngs, out) => run('avifenc', ['--fps', String(fps), '-q', '60', '-s', '6',
      '--repetition-count', 'infinite', ...pngs, out]),
    shrink: w => `Shorten it or drop to ${Math.round(w * 0.75)}px.`,
  });
}

function loop(scene, width = 720, fps = 12) {
  // Warn about sway BEFORE shooting a single frame. Without this, the 10x-90x
  // size penalty documented above LOOP_LIMIT is only discovered after the full
  // shoot-and-encode has already run -- expensive to find out, and expensive to
  // find out AGAIN if the fix (CONFIG.sway = 0) gets missed and re-run.
  try {
    const sceneSrc = fs.readFileSync(scene, 'utf8');
    const swayMatch = sceneSrc.match(/sway:\s*([0-9.]+)/);
    if (swayMatch && Number(swayMatch[1]) > 0) {
      console.error(`WARNING: ${scene} has CONFIG.sway = ${swayMatch[1]}. Camera sway moves ` +
        'every pixel every frame, which defeats WebP inter-frame compression -- measured ' +
        '10x-90x on file size (see the note above LOOP_LIMIT). Set CONFIG.sway = 0 for an inline loop.');
    }
  } catch (e) { /* unreadable scene source is not this check's problem -- the shoot below will fail loudly instead */ }
  // img2webp, not ffmpeg: Homebrew's ffmpeg ships without libwebp, so
  // `-c:v libwebp` fails with "Encoder not found".
  return inlineExport(scene, width, fps, {
    ext: '.webp', tag: 'loop', encoder: 'img2webp', probeArgs: ['-version'], brew: 'webp',
    digits: 2,
    encode: (pngs, out) => run('img2webp', ['-loop', '0', '-d', String(Math.round(1000 / fps)),
      '-q', '60', ...pngs, '-o', out]),
    shrink: w => `Shorten it, drop to ${Math.round(w * 0.75)}px, or hold the camera (CONFIG.sway = 0).`,
  });
}

// ---- the review tiler: scale and lay out stills, with no encoder -----------
//
// Track E1. `poster`, `aspect`, `sheet` (twice) and `strip` all did the same
// thing through ffmpeg — read already-rasterized stills, scale each, lay them
// out on a background — and that one shape was the whole reason five review
// verbs needed a binary on PATH. VISION.md's subject is the build-review loop;
// every external dependency on that loop is a tax on what the project is for.
// Export keeps its encoders, deliberately: see working-plan.md Track E.
//
// WHY THE DOWNSCALE STAYS, since removing it is the obvious cheaper idea and is
// REJECTED on evidence. The squint strip's 480→90 reduction is 5.3x
// supersampling, and that supersampling IS the antialiasing. A native 90px
// render gets only the renderer's MSAA and scored **44.8%** intermediate tones
// on edges against canvas's **59.9%** — aliased, not crisp. So only the scaler
// changed; the two-step render-then-reduce did not.
//
// WHY CANVAS IS SAFE HERE: on that same evidence canvas is better antialiased
// than the ffmpeg default (59.9% vs 57.4%), at a 1.9% edge-energy cost.
//
// NOTHING IN THIS REPO RE-RUNS THOSE NUMBERS. They were established once, by
// hand, and the table lives in working-plan.md Track E1 — treat them as a
// recorded finding, not as a control. What IS controlled is that these verbs
// execute and write their artifact with no encoder present, which is the
// review-tier row in bracket-commands.js. Three metrics were needed to get the
// finding right: PSNR ranked fidelity to a reference rather than the property
// in use, Sobel could not separate a crisp edge from a jagged one, and both
// produced clean, plausible, wrong tables. Do not re-derive this from PSNR.
//
// NO GPU FLAGS, and that is not an oversight: this is 2D canvas work over
// decoded stills, so it takes none of backend.js's ANGLE/WEBGPU selection. A
// review still therefore does not change shape because someone exported
// WEBGPU=metal, which the ffmpeg path also guaranteed and which is worth
// keeping.
const REVIEW_JPEG_Q = 0.92;          // ~ffmpeg's -q:v 4, the quality it replaced
async function tileStills({ files, cellW, cellH, cols, rows, pad, bg, out, quality = REVIEW_JPEG_Q }) {
  // Lazy require, exactly like probe() and smoke.js's loadBrowserDeps: `bundle`
  // and `vendor` are string work and must not be made to need a browser.
  const { chromium } = require('playwright-core');
  const { chromiumPath } = require(path.join(__dirname, 'backend.js'));
  const srcs = files.map(f => {
    const mime = path.extname(f).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${fs.readFileSync(f).toString('base64')}`;
  });
  const browser = await chromium.launch({ executablePath: chromiumPath(),
    args: ['--hide-scrollbars', '--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const b64 = await page.evaluate(async (a) => {
      const imgs = await Promise.all(a.srcs.map(s => new Promise((res, rej) => {
        const im = new Image();
        im.onload = () => res(im);
        im.onerror = () => rej(new Error('could not decode a still'));
        im.src = s;
      })));
      // Cell height derives from the FIRST image when the caller does not fix
      // it. Uniform inputs (sheet, strip, poster) then fit exactly; `aspect`
      // passes a square box on purpose and every cell letterboxes into it,
      // which is what shows each window shape at true proportions.
      const cw = a.cellW;
      const ch = a.cellH || Math.round(cw * imgs[0].height / imgs[0].width);
      const cv = document.createElement('canvas');
      cv.width  = a.cols * cw + (a.cols - 1) * a.pad;
      cv.height = a.rows * ch + (a.rows - 1) * a.pad;
      const g = cv.getContext('2d');
      // The default is already true; set it because it is the entire reason
      // this produces an antialiased reduction rather than a point-sampled one,
      // and a future edit that turns it off would look harmless.
      g.imageSmoothingEnabled = true;
      g.fillStyle = a.bg;
      g.fillRect(0, 0, cv.width, cv.height);
      imgs.forEach((im, i) => {
        const col = i % a.cols, row = Math.floor(i / a.cols);
        const x0 = col * (cw + a.pad), y0 = row * (ch + a.pad);
        const s = Math.min(cw / im.width, ch / im.height);       // contain
        const w = Math.round(im.width * s), h = Math.round(im.height * s);
        g.drawImage(im, x0 + Math.round((cw - w) / 2), y0 + Math.round((ch - h) / 2), w, h);
      });
      return cv.toDataURL('image/jpeg', a.quality).split(',')[1];
    }, { srcs, cellW, cellH: cellH || 0, cols, rows, pad, bg, quality });
    fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  } finally {
    await browser.close();
  }
}

// The inline artifact for a MOVING-camera scene. A swooping walkthrough makes a
// multi-megabyte loop AND shows different content than the mp4, so don't make
// one — ship a still that links to the video instead. Costs ~20KB and needs no
// held-camera compromise. Prints the markdown to paste.
async function poster(scene, t = 0, width = 960) {
  const base = outBase(scene);
  const out = base + '.jpg';
  const tag = String(t).replace('.', '_');
  ensureVendor(scene);
  // shoot.js writes <scene>_sample_<t>.png into FRAMES_DIR (scene-prefixed so two
  // scenes sampled at the same t cannot overwrite each other). Own a workspace
  // and read from it rather than guessing at a name in the CWD.
  const pdir = workspace(scene, 'poster');
  try {
    run('bun', ['run', path.join(__dirname, 'shoot.js'), scene, 'sample', String(t)],
        { env: { ...process.env, FRAMES_DIR: pdir } });
    const shotPath = path.join(pdir, `${path.basename(base)}_sample_${tag}.png`);
    if (!fs.existsSync(shotPath)) throw new Error(`poster: shoot.js did not write ${shotPath}`);
    // One cell, no padding: the same scale-and-encode ffmpeg did, minus ffmpeg.
    await tileStills({ files: [shotPath], cellW: width, cols: 1, rows: 1, pad: 0,
      bg: '#000000', out });
  } finally { fs.rmSync(pdir, { recursive: true, force: true }); }
  console.log(`poster -> ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB)`);
  console.log(`\nPaste into the README, with VIDEO_URL from dragging the mp4 into an\n` +
              `issue/PR composer (a repo-relative mp4 will NOT render as a player):\n\n` +
              `  [![${path.basename(base)}](${out})](VIDEO_URL)\n`);
  return out;
}

// A contact sheet + a silhouette check, one frame per beat instead of one
// frame per second — the thing you actually want to eyeball before committing
// to a full render. squint.jpg exists because a subject that does not read as
// a distinct shape at 90px will not read at full size either; the tile-of-
// thumbnails forces that check without you having to physically squint at
// your monitor.
// frac is where inside each beat to sample. 0.6 is a reasonable default -- far
// enough in that the beat's action has fired -- but it is exactly the wrong
// place to catch an effect that PARKS at the end of its ramp and never leaves.
// Both instances of that bug in a real scene were found by looking at a later
// frame, so `sheet <scene> 480 0.95` is the pass that surfaces them: every beat
// at its own end, where a station that should be dark is still lit.
// `aspect` — render one moment at several window shapes and tile them.
//
// smoke.js's framing-invariance check can REJECT a scene whose design frame
// changes with the window. It cannot APPROVE one: passing only means nothing
// moved, not that the composition reads at a phone-shaped window. This is the
// looking half, and it is the same division of labour the rest of the method
// uses -- the lint is the floor, the eye is the judgment.
//
// Shapes are expressed RELATIVE to the scene's own FRAME.aspect, so this stays
// meaningful for a 9:16 vertical or 1:1 square scene, not just 16:9.
async function aspectSheet(scene, t = 0, width = 520) {
  ensureVendor(scene);
  const out = outBase(scene) + '.aspect.jpg';
  const dir = workspace(scene, 'aspect');
  try {
    const stdout = execFileSync('bun', ['run', path.join(__dirname, 'shoot.js'), scene, 'aspects', String(t)],
      { encoding: 'utf8', env: { ...process.env, FRAMES_DIR: dir, SHOOT_FORMAT: REVIEW_FMT },
        stdio: ['ignore', 'pipe', 'inherit'] });
    const shapes = JSON.parse(stdout.trim().split('\n').pop()).shapes;
    const n = shapes.length;
    // Each shape has DIFFERENT pixel dimensions, which is the whole point of the
    // command and used to be its hardest constraint: it ruled out ffmpeg's tile
    // filter (needs uniform inputs) AND the image2 demuxer (stops reading at the
    // first dimension change), either of which silently yields a sheet holding
    // only the first cell. The tiler's `contain` fit into a SQUARE box handles
    // it directly — every cell shows its window shape at true proportions
    // against the same reference area, and the letterbox is the background.
    const files = [];
    for (let i = 0; i < n; i++) files.push(path.join(dir, `f${String(i).padStart(5, '0')}.${REVIEW_EXT}`));
    await tileStills({ files, cellW: width, cellH: width, cols: n, rows: 1, pad: 0,
      bg: '#101010', out });
    console.log(`aspect -> ${out}`);
    console.log('\nlegend (each cell is the SAME t at a different window shape):');
    shapes.forEach((sh, i) => console.log(`  cell ${i + 1}  ${sh.tag.padEnd(10)} ${sh.w}x${sh.h}  aspect ${(sh.w / sh.h).toFixed(2)}`));
    console.log('\nRead the image. Every cell must show the SAME composition — a subject that\n' +
                'drifts, crops, or reflows between cells is a framing bug the render will hide,\n' +
                'because shoot.js only ever records the design shape.');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// `strip` here is the text-strip flag, not the strip command: sheet(scene, w,
// frac, true) renders the same beats with every word removed, which is the
// semantics pass. An author used to build this by hand-editing a copy.
async function sheet(scene, width = 480, frac = 0.6, stripText = false) {
  ensureVendor(scene);
  const base = outBase(scene);
  const sheetOut = base + (stripText ? '.nocap.sheet.jpg' : '.sheet.jpg');
  const squintOut = base + '.squint.jpg';
  // Own this dir outright rather than trusting ambient FRAMES_DIR, then
  // rmSync it whole in the finally below -- same reasoning as loop()'s
  // .loopsrc/.loopframes. Honouring an inherited FRAMES_DIR here and then
  // recursively deleting it would reopen the "FRAMES_DIR=. erased the scene"
  // failure shoot.js's full-mode comment describes, just one caller removed.
  const dir = workspace(scene, 'sheet');
  try {
    // encoding: 'utf8' (not stdio: 'inherit') so the JSON line shoot.js prints
    // comes back to us instead of straight to our own stdout, where we'd have
    // no way to read the beat list back into this process. stderr still goes
    // through so scene errors are not swallowed.
    const stdout = execFileSync('bun', ['run', path.join(__dirname, 'shoot.js'), scene, 'beats', String(frac)],
      { encoding: 'utf8', env: { ...process.env, FRAMES_DIR: dir, SHOOT_FORMAT: REVIEW_FMT,
        ...(stripText ? { SCENE_QUERY: 'strip=text' } : {}) }, stdio: ['ignore', 'pipe', 'inherit'] });
    const { beats } = JSON.parse(stdout.trim().split('\n').pop());
    const n = beats.length;
    const cols = Math.min(4, Math.ceil(Math.sqrt(n)));
    const rows = Math.ceil(n / cols);

    // Named explicitly rather than handed to a %05d pattern: the sequence is
    // dense and zero-based here, but `strip` below is neither, and one way of
    // naming frames for both is one fewer thing that can be subtly wrong.
    const files = [];
    for (let i = 0; i < n; i++) files.push(path.join(dir, `f${String(i).padStart(5, '0')}.${REVIEW_EXT}`));

    await tileStills({ files, cellW: width, cols, rows, pad: 6, bg: '#1a1a1a', out: sheetOut });

    // 90px wide, one row: small enough that detail disappears and only the
    // silhouette is left, which is the point. This is the reduction the whole
    // scaler question was about — 480→90 is 5.3x supersampling, and it is what
    // antialiases the silhouette. See tileStills's header before touching it.
    await tileStills({ files, cellW: 90, cols: n, rows: 1, pad: 3, bg: '#1a1a1a', out: squintOut });

    console.log(`sheet -> ${sheetOut}`);
    console.log(`squint -> ${squintOut}`);
    // No drawtext burn-in: libfreetype is not guaranteed present in every
    // ffmpeg build, and a hard dependency on it would fail the command on
    // builds that lack it. The legend goes to stdout instead.
    console.log('\nlegend:');
    beats.forEach((b, idx) => {
      const r = Math.floor(idx / cols) + 1, c = (idx % cols) + 1;
      console.log(`  r${r}c${c}  ${b.name}   t=${b.t}`);
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Motion defects that don't show up in any still: a property that jumps
// discontinuously at a beat boundary (a "pop"), and motion that stalls to
// zero velocity mid-film (a "stall"). tblend=all_mode=difference diffs each
// frame against its predecessor; signalstats' YAVG on that diff is the mean
// absolute luma change, i.e. a cheap proxy for "how much moved this frame".
// metadata=print writes that number to stdout as text instead of burning it
// into a video, which is the only way to get the numbers back out of a
// filtergraph without decoding to raw and hand-rolling the diff ourselves.
// CONSECUTIVE frames from one narrow window, tiled. The contact sheet shows
// error across BEATS; this shows what happens between ADJACENT FRAMES, which is
// the only pixel-level access anyone gets to the continuity axis without playing
// the film -- and an agent reviewing a scene cannot play anything.
//
// Bracketed on a moving-camera scene, both sides measured, not guessed:
//
//   NOT visible: a 0.35 rad single-frame rotation on one limb (~2% of frame
//     area). Adjacent cells are indistinguishable. Same signal that measured
//     1.00x its local baseline in `motion` -- small localized steps are simply
//     not recoverable from full frames while a camera is moving.
//   VISIBLE: a 1.2-unit whole-body translation (~15% of frame height), injected
//     deliberately as a positive control. Obvious comparing the cells either
//     side of the boundary.
//
// So this catches whole-object and world-level discontinuities, not limb-level
// ones, and it will do better on a held camera where nothing else competes.
// Use it as a look-closer, not a gate, and keep checking the three source
// shapes in references/method.md -- those cover the cases below the bracket.
const STRIP_MAX = 16;
async function strip(scene, t0, t1, fps = 30, width = 480) {
  ensureVendor(scene);
  const base = outBase(scene);
  const out = base + '.strip.jpg';
  const a = Math.round(t0 * fps);
  let n = Math.round(t1 * fps) - a;
  if (!(n >= 2)) throw new Error(`strip: ${t0}..${t1} at ${fps}fps is ${n} frame(s) -- widen the window or raise fps`);
  if (n > STRIP_MAX) {
    console.error(`strip: window holds ${n} frames, showing the first ${STRIP_MAX}. ` +
      'A strip is for a suspect MOMENT; narrow the window rather than skimming a whole beat.');
    n = STRIP_MAX;
  }
  const dir = workspace(scene, 'strip');
  try {
    run('bun', ['run', path.join(__dirname, 'shoot.js'), scene, 'range',
      String(a), String(a + n), String(fps)], { env: { ...process.env, FRAMES_DIR: dir, SHOOT_FORMAT: REVIEW_FMT } });
    const cols = Math.min(4, n), rows = Math.ceil(n / cols);
    // `range` names frames by their GLOBAL index (f00259), not from zero -- that
    // is what makes a re-shot range drop back into a full render. ffmpeg needed
    // -start_number told to it; naming the files outright says the same thing
    // without a second convention, and it is the same loop `sheet` uses.
    const files = [];
    for (let i = 0; i < n; i++) files.push(path.join(dir, `f${String(a + i).padStart(5, '0')}.${REVIEW_EXT}`));
    await tileStills({ files, cellW: width, cols, rows, pad: 6, bg: '#1a1a1a', out });
    console.log(`strip -> ${out}  (${n} consecutive frames at ${fps}fps)`);
    console.log('\nlegend:');
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols) + 1, c = (i % cols) + 1;
      console.log(`  r${r}c${c}  t=${((a + i) / fps).toFixed(4)}s`);
    }
    console.log('\nRead the image and compare ADJACENT cells. Smooth motion moves a similar');
    console.log('amount per cell; a discontinuity moves once and stops. A small localized');
    console.log('step under a moving camera may not be visible here -- see the note in build.js.');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function motion(scene, fps = 12) {
  const dir = workspace(scene, 'motion');
  // The beats manifest rides along as a side product of the shoot itself
  // (shoot.js MANIFEST_OUT) — this command used to launch a SECOND browser
  // and boot the scene again just to read window.BEATS.
  const manifestPath = path.join(dir, 'beats.json');
  try {
    frames(scene, fps, dir, { MANIFEST_OUT: manifestPath });
    // Provenance: what we read must be what we wrote. Without this, a clobbered
    // scratch dir produced a completely plausible per-beat profile covering a
    // THIRD of the film -- 65 frames reported for a 254-frame render, exit 0,
    // the only symptom one ffmpeg stderr line nobody reads. A wrong number that
    // looks right is worse than no number.
    const wroteN = fs.readdirSync(dir).filter(f => /^f\d{5}\.png$/.test(f)).length;  // motion is PNG by contract
    if (wroteN < 2) throw new Error(`motion: only ${wroteN} frame(s) in ${dir} — the shoot did not produce a film`);

    const out = execFileSync('ffmpeg', ['-y', '-framerate', String(fps), '-i', path.join(dir, 'f%05d.png'),
      '-vf', 'tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=-',
      '-f', 'null', '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });

    // Output alternates a `frame:<n>` line and a `lavfi.signalstats.YAVG=<v>`
    // line per frame. Pull them out as a pair rather than assuming a fixed
    // line offset between them -- ffmpeg versions differ in how much other
    // metadata they interleave.
    const series = [];
    let pendingFrame = null;
    for (const line of out.split('\n')) {
      const fm = line.match(/frame:(\d+)/);
      if (fm) { pendingFrame = Number(fm[1]); continue; }
      const vm = line.match(/lavfi\.signalstats\.YAVG=([\d.]+)/);
      if (vm && pendingFrame !== null) { series[pendingFrame] = Number(vm[1]); pendingFrame = null; }
    }

    // Frame 0 has no predecessor, so tblend diffs it against itself (or
    // whatever ffmpeg does at the boundary depending on version) -- not a real
    // motion sample, and left in it would skew the median toward zero.
    // Provenance BEFORE any early return. The one outcome worse than a profile
    // for part of a film is a reassuring line and exit 0 for none of it, and
    // that path used to sit 75 lines above the assertion meant to prevent it.
    // tblend emits exactly one delta per adjacent pair, so N frames -> N-1
    // deltas; anything else means the scratch dir moved under us or ffmpeg
    // stopped early. (The old `series.length < wroteN * 0.9` was wrong both
    // ways: N-1 < 0.9N holds for every N < 10, so short films threw spuriously,
    // while 25 frames could vanish from a 254-frame render undetected.)
    const present = series.filter(v => v !== undefined).length;
    if (present !== wroteN - 1) {
      throw new Error(`motion: ${wroteN} frames written to ${dir} but ${present} deltas parsed `
        + `(expected ${wroteN - 1}). The scratch dir was modified mid-run, or ffmpeg stopped `
        + `early — refusing to report a profile for part of the film.`);
    }
    // FINDING: tblend has ALREADY dropped the unpaired first input, so its
    // frame:0 IS the genuine 0->1 delta at pts 1/fps. Dropping it again hid the
    // film's first inter-frame delta entirely and shifted every reported
    // timestamp one frame early. Verified against ffmpeg output.
    const values = series.filter(v => v !== undefined);
    if (!values.length) { throw new Error('motion: no deltas parsed — nothing to report'); }
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    // Beats come from the manifest the shoot wrote alongside the frames — we
    // use only start/dur for bucketing, never the beat frames themselves.
    const parsed = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const beats = parsed.beats;
    const synthetic = parsed.synthetic;
    // Only annotate findings with a beat name when window.BEATS was actually
    // present -- the synthetic 8-way fallback isn't a real beat, and labeling
    // a pop "(3 @ 40%)" against a segment nobody authored would just mislead.
    const beatFor = (t) => {
      if (synthetic || !beats || !beats.length) return '';
      const b = beats.find(b => t >= b.start && t < b.start + b.dur) || beats[beats.length - 1];
      const frac = b.dur > 0 ? (t - b.start) / b.dur : 0;
      return ` [${b.name} @ ${Math.round(frac * 100)}%]`;
    };

    // What this reports, and what it deliberately does NOT.
    //
    // The first version of this command tried to flag pops (a property jumping
    // discontinuously) and stalls (motion decelerating to a dead stop). Both
    // were measured against a scene with a KNOWN discontinuity and a KNOWN
    // pair of stalls, and both failed:
    //
    //   - The pop was a 0.35 rad rotation on one limb. Whole-frame mean luma
    //     change at that boundary measured 1.00x its own local baseline --
    //     literally invisible -- because the camera and six mechanisms were
    //     already moving. A step-halving probe (exploiting seekTo's purity:
    //     smooth motion halves its delta when you halve dt, a step does not)
    //     separated it no better: 1.60 at the known step vs 1.69 at a control
    //     boundary. The signal is real and it is buried.
    //   - Stalls fired at EVERY beat boundary on that scene and ~10 times on a
    //     known-good one, because a film is SUPPOSED to settle between beats.
    //     Pixels cannot tell a deliberate rest from a flywheel that stopped.
    //
    // A detector that returns ten findings on every film trains you to ignore
    // it, and one that reports "0 pops" on a scene that has one is worse than
    // no check at all -- it converts an open question into a settled one. So
    // this command reports only what whole-frame statistics genuinely measure
    // well: how much each beat moves, and where nothing moves at all.
    // Continuity review stays a watch-the-loop activity; the three failure
    // shapes to check in SOURCE are in references/method.md.
    const perBeat = [];
    if (!synthetic && beats && beats.length) {
      for (const b of beats) {
        const lo = Math.max(0, Math.round(b.start * fps) - 1);
        const hi = Math.min(values.length, Math.round((b.start + b.dur) * fps) - 1);
        const slice = values.slice(lo, hi);
        if (!slice.length) continue;
        perBeat.push({ name: b.name, dur: b.dur, mean: slice.reduce((s, v) => s + v, 0) / slice.length });
      }
    }

    // Dead air: an absolute floor, not a fraction of the median. A fraction
    // scales with the scene's own energy, so a held-camera diagram (median
    // 0.16 measured) and a moving-camera walkthrough (median 3.90) would get
    // wildly different definitions of "nothing is happening".
    const DEAD_FLOOR = 0.05, DEAD_MIN_FRAMES = Math.max(3, Math.round(fps * 0.75));
    const dead = [];
    let runStart = -1, runLen = 0;
    values.forEach((v, i) => {
      if (v < DEAD_FLOOR) { if (runLen === 0) runStart = i; runLen++; }
      else { if (runLen >= DEAD_MIN_FRAMES) dead.push([runStart, i - 1]); runLen = 0; }
    });
    if (runLen >= DEAD_MIN_FRAMES) dead.push([runStart, values.length - 1]);
    console.log(`motion: ${values.length} frames at ${fps}fps, median frame-diff ${median.toFixed(2)}`);
    if (perBeat.length) {
      const peak = Math.max(...perBeat.map(b => b.mean)) || 1;
      console.log('\n  per-beat motion (relative bar, not an absolute scale):');
      for (const b of perBeat) {
        const bar = '#'.repeat(Math.max(1, Math.round(24 * b.mean / peak)));
        console.log(`    ${b.name.padEnd(10)} ${b.dur.toFixed(1)}s  ${b.mean.toFixed(2).padStart(6)}  ${bar}`);
      }
      console.log('  A beat far below its neighbours is either a deliberate hold or a beat');
      console.log('  whose action never fires. A run of near-identical bars is a slideshow.');
    } else {
      console.log('  per-beat profile: skipped, window.BEATS not present');
    }
    for (const [s, e] of dead) {
      const t = (s + 1) / fps;
      console.log(`  DEAD AIR  t=${t.toFixed(2)}s-${((e + 1) / fps).toFixed(2)}s — nothing on screen changes${beatFor(t)}`);
    }
    console.log(`\n${dead.length} dead-air stretch(es). This does NOT detect pops or stalls — see the`);
    console.log('comment in build.js for the measurements showing why, and check those in source.');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/* ---- check: the declarative layer, cross-referenced ------------------------
 *
 * references/breakdown.md enumerates the tables a scene declares — BEATS,
 * SHOTS, SUBJECTS, SIZES, CONFIG, FRAME, KEYS — and its "what validates it"
 * column is mostly empty. Validation clusters where a mistake is
 * UNREPRESENTABLE (an unknown name fails a lookup, so it throws) rather than
 * where it is expensive. This closes the other half: errors that are perfectly
 * representable, decidable from the tables alone, and today found by a viewer.
 *
 * IT DOES NOT DRIVE THE SCENE, which is why it is not a second exception beside
 * `probe`. The prime directive binds tooling that DRIVES a scene to the window
 * contract; this launches no browser, calls no `seekTo`, and reads no runtime
 * state. It reads source text, and only for the KIT-OWNED table names above —
 * never a film's own identifiers, which is the property that keeps every other
 * tool swappable across scenes. Same category as `smoke.js --parity-only`
 * (string work over files, no render) and as loop()'s CONFIG.sway warning.
 *
 * WHY STATIC RATHER THAN THROUGH THE CONTRACT, since the contract is this
 * repo's default answer. `window.SHOTS` is deliberately a projection —
 * `{t, cutEnd}`, for smoke's transition sampling — and SUBJECTS, SIZES and the
 * authored shot fields are on no window at all. Widening the contract to carry
 * them is a real option and a separate change across every carrier. It would
 * also buy less than it costs here: a shot naming a beat that does not exist
 * throws inside `beatAt` at load, so the scene never reaches `sceneReady` and a
 * contract reader has nothing to inspect. These are the errors worth having
 * BEFORE the page can load at all.
 *
 * WHAT IT CANNOT SEE lives with the other instrument limits in
 * references/instruments.md. The short version: it cannot compare a declared
 * extent against the geometry that extent claims to describe — the layer's most
 * expensive gap by breakdown.md's account — because measuring geometry means
 * naming scene objects, and that is `probe`'s admitted exception, not this
 * command's to take.
 */

// Two severities. An ERROR is a statement the tables cannot both satisfy — a
// name that resolves to nothing, an anchor outside its own beat — and it sets
// the exit code. A WARN is a composition judgement the tables merely make
// visible; those stay advisory for the same reason smoke's exposure lint does,
// because a lint that fires on a defensible choice is one people stop reading.
const CHECK_ERR = 'ERROR', CHECK_WARN = 'warn';

// Three or more shots sharing one framing. Bounded on BOTH sides by the shipped
// corpus rather than chosen: `bracket-commands.js` covers the firing side, and
// two shipped examples sit at two identical framings apiece — gearbox and
// menagerie each return to their establishing shot, which is ordinary grammar
// and must not fire. The defect corpus's `after-hours.html` sits at four.
const IDENTICAL_FRAMING_WARN = 3;
// FRAME.px must describe FRAME.aspect. A tolerance rather than equality because
// aspect is written as a ratio (16/9) and px as integers, so exactness is not
// available at every frame shape; 0.5% is tighter than any deliberate choice
// and looser than rounding.
const FRAME_ASPECT_TOL = 0.005;

// Read one TOP-LEVEL declaration's initialiser out of scene source text.
// Anchored at the start of a line, so a same-named local inside a function is
// not mistaken for the table. Returns null when the scene simply does not
// declare it — a 2D scene has no SHOTS — which the caller separates from the
// case where it is declared and could not be read.
const TABLE_OPEN = { '[': ']', '{': '}', '(': ')' };
// Returned when a table IS declared but its value is not a literal this reader
// can slice — assembled by a call, or a literal that later lines mutate. It is
// deliberately NOT null: `null` means "this scene has no such table", which is
// legitimate (a 2D scene has no SHOTS), and conflating the two let a loop-built
// SHOTS report `0 shot(s)` under a green verdict until 0.16.68.
const IMPERATIVE = Symbol('imperative');

// A literal that later lines push into is a literal this reader captured BEFORE
// the film finished writing it. Scanned rather than parsed, and narrow on
// purpose: only mutations that change membership, only on the bare table name.
// `.map()` is absent from this list because the templates all end their table
// with one and it returns a new array the declaration binds — that is the house
// idiom, not a mutation of the captured value.
function mutatedAfterDeclaration(text, name) {
  const re = new RegExp('(?:^|[^\\w.])' + name +
    '(?:\\s*\\.\\s*(?:push|unshift|splice|pop|shift)\\s*\\(|\\s*\\[[^\\]]*\\]\\s*=[^=])', 'm');
  return re.test(text);
}
function tableSource(text, name) {
  const m = new RegExp('^[ \\t]*(?:const|let|var)[ \\t]+' + name + '[ \\t]*=', 'm').exec(text);
  if (!m) return null;
  let i = m.index + m[0].length;
  // Skip whitespace AND comments. `const CONFIG = /* … */ {` is legal, and a
  // whitespace-only skip reads it as "no such table" — a silent miss, which is
  // the one outcome a checker must never produce.
  for (;;) {
    while (i < text.length && /\s/.test(text[i])) i++;
    if (text[i] === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (text[i] === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); if (e < 0) return null; i = e + 2; continue; }
    break;
  }
  // DECLARED, but not as a literal — `const SHOTS = buildShots();`, or
  // `const STYLE = BIBLES.workshop;`. Returning null here would make it
  // indistinguishable from a scene that never declares the table, which is a
  // silent miss rather than a coverage gap the reader can see. The caller
  // separates the two.
  if (!TABLE_OPEN[text[i]]) return IMPERATIVE;
  const stack = [];
  for (const from = i; i < text.length; i++) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '/') { while (i < text.length && text[i] !== '\n') i++; continue; }
    if (c === '/' && text[i + 1] === '*') { const e = text.indexOf('*/', i + 2); if (e < 0) return null; i = e + 1; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      for (i++; i < text.length; i++) { if (text[i] === '\\') { i++; continue; } if (text[i] === q) break; }
      continue;
    }
    if (TABLE_OPEN[c]) { stack.push(TABLE_OPEN[c]); continue; }
    if (c === ']' || c === '}' || c === ')') {
      if (stack.pop() !== c) return null;
      if (!stack.length) return text.slice(from, i + 1);
    }
  }
  return null;
}

// A stand-in for anything the table names that this process cannot know: a
// scene constant, a rig, a helper. It absorbs property access, calls and
// arithmetic and collapses to NaN, so `h: bear.height*SCALE+.3` yields NaN
// rather than throwing and taking the whole table with it. The shipped corpus
// needs this — several SUBJECTS entries size themselves from geometry built at
// runtime — and without it those scenes would report "unreadable" and the
// checks that only need the KEYS of that table would be lost with it.
const UNRESOLVED = new Proxy(function () {}, {
  get(t, k) { return k === Symbol.toPrimitive || k === 'valueOf' ? () => NaN : UNRESOLVED; },
  apply() { return UNRESOLVED; },
  construct() { return UNRESOLVED; },
  has() { return true; },
});
// Deliberately tiny: enough for the arithmetic and JSON a table legitimately
// contains, and nothing that touches the filesystem, the network or a process.
// This evaluates text out of a file the caller named, so the surface it offers
// that text is the whole safety argument.
const TABLE_GLOBALS = { Math, JSON, Number, String, Array, Object, Boolean, isNaN, parseFloat, parseInt };
function tableValue(text, name) {
  const src = tableSource(text, name);
  if (src === null) return { state: 'absent' };
  if (src === IMPERATIVE) return { state: 'imperative', why: 'its initializer is not a literal' };
  const scope = new Proxy({}, {
    has: () => true,
    get(t, k) {
      if (k === Symbol.unscopables) return undefined;
      return k in TABLE_GLOBALS ? TABLE_GLOBALS[k] : UNRESOLVED;
    },
  });
  try {
    const value = new Function('__s', `with(__s){return (${src});}`)(scope);
    if (mutatedAfterDeclaration(text, name)) {
      return { state: 'imperative', why: 'later lines add to or remove from it, so the literal read here is not the table the scene runs' };
    }
    return { state: 'ok', value };
  } catch (e) {
    return { state: 'unreadable', why: String(e.message).split('\n')[0] };
  }
}

// The caption thresholds have ONE home and it is smoke.js, which already runs
// this lint per render. Read out of its source rather than restated here: a
// second copy of the number is the drift docs/source-of-truth.md forbids, and
// two instruments must not be able to disagree about the same beat. It throws
// when the constant is renamed, because a silent fallback would let the copies
// diverge — which is the entire failure being avoided.
function smokeConst(name) {
  const p = path.join(__dirname, 'smoke.js');
  let src;
  try { src = fs.readFileSync(p, 'utf8'); } catch (e) {
    throw new Error(`check: cannot read ${p}, which owns the caption thresholds. `
      + `Copy smoke.js beside build.js — the setup step copies both.`);
  }
  const m = new RegExp('^const ' + name + '\\s*=\\s*([0-9.]+)\\s*;', 'm').exec(src);
  if (!m) {
    throw new Error(`check: smoke.js no longer declares ${name}. That constant is its one home; `
      + `repoint this reader at the new name rather than restating the number here.`);
  }
  return Number(m[1]);
}

function check(scene) {
  const text = fs.readFileSync(scene, 'utf8');
  const found = {}, out = [], uncovered = [], covered = [];
  const add = (sev, msg) => out.push([sev, msg]);
  for (const name of ['BEATS', 'SHOTS', 'SUBJECTS', 'SIZES', 'CONFIG', 'FRAME', 'KEYS']) {
    const r = tableValue(text, name);
    found[name] = r.state === 'ok' ? r.value : null;
    if (r.state === 'ok') covered.push(name);
    // Declared and unreadable is a hole in THIS tool, not a verdict on the
    // scene, and it is said out loud: an instrument that quietly checks less
    // than it reports is the failure references/instruments.md exists to track.
    if (r.state === 'unreadable') add(CHECK_WARN, `${name} is declared but could not be read here, so nothing below covers it — ${r.why}`);
    if (r.state === 'imperative') {
      add(CHECK_WARN, `${name} is declared but assembled at runtime, so nothing below covers it — ${r.why}. `
                    + `This verb reads literals; a table built by a loop or a call is beyond it.`);
      uncovered.push(name);
    }
  }
  const beats = Array.isArray(found.BEATS) ? found.BEATS : null;
  if (!beats || !beats.length) {
    throw new Error(`check: no BEATS table found in ${path.basename(scene)} — every mitate scene `
      + `declares one, so either this is not a scene or the declaration is not top-level.`);
  }

  // BEAT spans, accumulated exactly as the kit accumulates them. TOTAL is
  // derived here for the same reason it is derived in the scene: a declared
  // duration and an actual one cannot disagree if only one of them exists.
  const span = {}; let acc = 0;
  for (const b of beats) {
    if (typeof b.name !== 'string') { add(CHECK_ERR, `BEATS has an entry with no name`); continue; }
    if (span[b.name]) add(CHECK_ERR, `BEATS declares "${b.name}" twice — every other table addresses beats by name, so the second is unreachable`);
    const dur = typeof b.dur === 'number' && b.dur > 0 ? b.dur : NaN;
    if (!Number.isFinite(dur)) add(CHECK_ERR, `BEATS "${b.name}" has dur ${JSON.stringify(b.dur)} — a beat is a positive number of seconds`);
    span[b.name] = [acc, acc + (Number.isFinite(dur) ? dur : 0)];
    acc += Number.isFinite(dur) ? dur : 0;
  }
  const TOTAL = acc;
  const known = n => Object.prototype.hasOwnProperty.call(span, n);
  // A beat name that resolves, and the absolute t an [beat, fraction] anchor
  // addresses. `at` defaults to 0 in the kit's beatAt, so an omitted fraction
  // is correct rather than missing — flagging it would condemn valid source.
  const anchorAt = (bn, fr) => span[bn][0] + (fr === undefined ? 0 : fr) * (span[bn][1] - span[bn][0]);

  const subjects = found.SUBJECTS && typeof found.SUBJECTS === 'object' ? Object.keys(found.SUBJECTS) : null;
  const sizes = found.SIZES && typeof found.SIZES === 'object' ? found.SIZES : null;
  // WIDE RUNGS, DERIVED, not listed. A rung's `a` is a vertical anchor ON the
  // subject — a body landmark, which is what makes MS "waist-up". A union box
  // has no waist, so the rungs that are meaningful for one are exactly those
  // that aim at the box centre. Deriving it means an edit to the ladder cannot
  // leave a hand-written list behind.
  const wide = sizes ? new Set(Object.keys(sizes).filter(k => sizes[k] && Math.abs(sizes[k].a - 0.5) < 1e-9)) : null;
  const shots = Array.isArray(found.SHOTS) ? found.SHOTS : null;
  const framings = new Map();

  if (shots) {
    let prev = null;
    shots.forEach((s, i) => {
      const at = Array.isArray(s.at) ? s.at : null;
      const bn = at ? at[0] : null;
      const where = `SHOTS[${i}]` + (typeof bn === 'string' ? ` (${bn})` : '');
      if (!at || typeof bn !== 'string') {
        add(CHECK_ERR, `${where}: \`at\` must be [beatName, fraction] — got ${JSON.stringify(s.at)}`);
      } else if (!known(bn)) {
        add(CHECK_ERR, `${where}: anchored to beat "${bn}", which BEATS does not declare`);
      } else {
        const fr = at[1];
        if (fr !== undefined && !(typeof fr === 'number' && fr >= 0 && fr <= 1)) {
          // The anchor is a FRACTION of the beat. 1.4 is not "late in the
          // beat", it is a shot that starts inside some later beat entirely —
          // silently, because beatAt happily returns the number.
          add(CHECK_ERR, `${where}: anchor fraction ${JSON.stringify(fr)} is outside 0..1, so the shot does not start inside its own beat`);
        } else {
          const t = anchorAt(bn, fr);
          if (prev && t < prev.t) {
            add(CHECK_ERR, `${where}: starts at t=${t.toFixed(2)}s, before ${prev.where} at t=${prev.t.toFixed(2)}s — `
              + `a shot runs until the NEXT shot starts, so an out-of-order entry gives the earlier one a negative length`);
          }
          prev = { t, where };
        }
      }
      const named = Array.isArray(s.subject) ? s.subject : [s.subject];
      if (subjects) {
        for (const n of named) {
          if (typeof n !== 'string') { add(CHECK_ERR, `${where}: subject ${JSON.stringify(n)} is not a name`); continue; }
          // The lookup that throws at RUNTIME, and only on a frame where this
          // shot is live — so a typo in a shot nobody seeks to is found by a
          // viewer today. Here it costs no frame.
          if (!subjects.includes(n)) add(CHECK_ERR, `${where}: subject "${n}" is not in SUBJECTS (${subjects.join(', ')})`);
        }
        if (typeof s.focus === 'string' && !subjects.includes(s.focus)) {
          add(CHECK_ERR, `${where}: focus "${s.focus}" is not in SUBJECTS (${subjects.join(', ')})`);
        }
      }
      if (sizes) {
        for (const k of ['size', 'size2']) {
          if (typeof s[k] === 'string' && !sizes[s[k]]) {
            add(CHECK_ERR, `${where}: ${k} "${s[k]}" is not a rung in SIZES (${Object.keys(sizes).join(' ')})`);
          }
        }
        // NARROWED, and the narrowing is the point. The flat rule "a union
        // takes wide rungs only" condemns a shipped two-shot in
        // bear-and-bees.html that is deliberate and annotated as such — it asks
        // for MS on a pair and supplies `anchor:.45`, aiming low at the face.
        // An explicit anchor IS the landmark the union lacks, and the solver
        // prefers it over the rung's `a`, so a shot that supplies one is not
        // making the mistake this looks for.
        if (Array.isArray(s.subject) && wide && typeof s.size === 'string' && sizes[s.size]
            && !wide.has(s.size) && s.anchor === undefined) {
          add(CHECK_WARN, `${where}: union of ${s.subject.length} subjects on rung ${s.size}, whose anchor `
            + `${sizes[s.size].a} aims at a body landmark a union box does not have. Use a wide rung `
            + `(${[...wide].join(' ')}) or set \`anchor\` explicitly.`);
        }
      }
      const key = JSON.stringify([s.subject, s.size, s.size2, s.angle, s.angle2, s.elev, s.fov, s.anchor, s.anchorX]);
      if (!framings.has(key)) framings.set(key, []);
      framings.get(key).push(i);
    });
    for (const [key, idx] of framings) {
      if (idx.length < IDENTICAL_FRAMING_WARN) continue;
      const s = shots[idx[0]];
      add(CHECK_WARN, `SHOTS[${idx.join(',')}]: ${idx.length} shots share one framing `
        + `(subject ${JSON.stringify(s.subject)}, ${s.size}, angle ${s.angle || 0}) — `
        + `distinct beats reading as the same card`);
      void key;
    }
  }

  // 2D keeps explicit keyframes where 3D has a solver. Same anchor grammar,
  // spelled `{beat, at}` rather than `at:[beat, fraction]`.
  if (Array.isArray(found.KEYS)) {
    found.KEYS.forEach((k, i) => {
      if (typeof k.beat !== 'string' || !known(k.beat)) {
        add(CHECK_ERR, `KEYS[${i}]: anchored to beat ${JSON.stringify(k.beat)}, which BEATS does not declare`);
      } else if (k.at !== undefined && !(typeof k.at === 'number' && k.at >= 0 && k.at <= 1)) {
        add(CHECK_ERR, `KEYS[${i}] (${k.beat}): anchor fraction ${JSON.stringify(k.at)} is outside 0..1`);
      }
    });
  }

  const config = found.CONFIG && typeof found.CONFIG === 'object' ? found.CONFIG : {};
  if (Array.isArray(config.flashes)) {
    config.flashes.forEach((f, i) => {
      if (typeof f.beat !== 'string' || !known(f.beat)) {
        add(CHECK_ERR, `CONFIG.flashes[${i}]: anchored to beat ${JSON.stringify(f.beat)}, which BEATS does not declare`);
      }
    });
  }

  // Captions, against the reading speed smoke.js already owns. A caption is
  // only fully legible between its fade-in and its fade-out, so the readable
  // window is (dur - 2*capFade) and not the beat.
  const cps = smokeConst('CPS_WARN_THRESHOLD');
  const fade = typeof config.capFade === 'number' ? config.capFade : smokeConst('CAP_FADE_DEFAULT');
  for (const b of beats) {
    if (typeof b.cap !== 'string' || !b.cap) continue;
    const rate = b.cap.length / Math.max((span[b.name] ? span[b.name][1] - span[b.name][0] : 0) - 2 * fade, 0.01);
    if (rate > cps) add(CHECK_WARN, `beat "${b.name}": caption reads at ${rate.toFixed(1)} cps against a ${cps} cps limit — "${b.cap}"`);
  }

  // FRAME.px is what the recorder renders at; FRAME.aspect is what the scene
  // composes against. breakdown.md lists their agreement as unvalidated, and it
  // is the one thing in that table decidable without a frame.
  const frame = found.FRAME;
  if (frame && Array.isArray(frame.px) && typeof frame.aspect === 'number' && frame.px.length === 2
      && frame.px.every(n => typeof n === 'number' && n > 0)) {
    const r = frame.px[0] / frame.px[1];
    if (Math.abs(r - frame.aspect) / frame.aspect > FRAME_ASPECT_TOL) {
      add(CHECK_ERR, `FRAME.px ${frame.px.join('x')} is ${r.toFixed(4)}, but FRAME.aspect is ${frame.aspect.toFixed(4)} — `
        + `the recorder would render at a shape the scene was not composed for`);
    }
  }

  const errors = out.filter(([sev]) => sev === CHECK_ERR).length;
  const warns = out.length - errors;
  console.log(`check ${path.basename(scene)} — ${beats.length} beat(s) / ${TOTAL.toFixed(1)}s`
    + (shots ? `, ${shots.length} shot(s)`
             : uncovered.includes('SHOTS') ? ', SHOTS unread' : ', no SHOTS (2D)')
    + (subjects ? `, ${subjects.length} subject(s)` : '')
    + (Array.isArray(found.KEYS) ? `, ${found.KEYS.length} camera key(s)` : ''));
  for (const [sev, msg] of out) console.log(`  ${sev.padEnd(5)} ${msg}`);
  // Said on every run, green ones included: a clean report here is not a clean
  // scene, and the gap is the expensive one. See references/instruments.md.
  console.log(`\n  not checked here: whether a declared h/w/d matches the geometry it describes.`);
  console.log(`  That needs the scene's own objects — \`build.js probe <scene> <t> 'bb(x)'\`.`);
  if (errors) {
    console.log(`\n${errors} error(s), ${warns} warning(s) — the tables disagree with each other, `
      + `and no frame has to render for that to be true.`);
    process.exitCode = 1;
    return;
  }
  // THE VERDICT STATES ITS SCOPE. `ok` on its own cannot be told apart from a
  // run that read nothing, which is the shape --parity-only's file count and the
  // brackets' arm tallies already close one tier up — and which this verb
  // shipped with in 0.16.67: a loop-built SHOTS gave `0 shot(s)` and a green.
  const scope = uncovered.length
    ? ` — ${uncovered.length} table(s) NOT covered: ${uncovered.join(', ')}`
    : ` over ${covered.join(', ')}`;
  console.log(`\ncheck: ok — 0 errors, ${warns} warning(s)${scope}`);
}

/* probe — measure the scene's own geometry at one t, instead of inferring it.
 *
 * The defect class this exists for is the most-repeated in the project's
 * history: two things that must touch, and do not. `h` and `w` are the FRAMING
 * extent; the contact point is a different number, so authors reach for the one
 * that is written down. references/method.md owns the technique and the worked
 * instances; this is that technique as a command, because the technique existed
 * for the whole life of the project and got re-derived or skipped every time.
 *
 *   bun run build.js probe <scene.html> <when> '<expr>' ['<expr>' ...]
 *
 * <when> is a NUMBER or a JS EXPRESSION evaluated in the scene's own scope, so
 * a probe addresses time the way the kit does: `beatAt('boop',.55)`, not 8.31.
 * A raw second is accepted and is the thing that rots when a beat is retimed.
 *
 * Why it can read scene objects at all: scenes are classic scripts, so their
 * top-level `let`/`const` live in the global lexical scope -- reachable by name
 * from page.evaluate, and NOT on window (`bear` resolves; `window.bear` does
 * not). Nothing needs instrumenting.
 *
 * This names scene internals, which the prime directive forbids of tooling that
 * DRIVES a scene. The exception is written into that rule rather than argued
 * here, and it is conditional: read-only, authoring-time, and in no pipeline
 * that produces an artifact. If probe ever gets called by another verb, a
 * workflow, or a hook, the exception lapses and this needs rethinking.
 *
 * Prelude, deliberately small:
 *   bb(o)      world AABB. ACCEPTS A RIG OR AN Object3D -- buildCharacter
 *              returns {root, body, head, ...}, so setFromObject(bear) throws
 *              `updateWorldMatrix is not a function`, measured, and that trap
 *              is why this unwraps .root rather than documenting the wrapping.
 *   sep(a,b)   per-axis gap. NEGATIVE means overlap. All three axes, because
 *              one recorded miss had an x-overlap of -1.66 and a y-overlap of
 *              0.01: it arced cleanly over the body it was meant to hit.
 *   proj(v)    NDC + whether it is on screen, for "the hit the camera cannot
 *              see did not land".
 *   reach(l)   L1+L2 of a limb, for "no rotation reaches a target past the arm".
 *   shape(x)   what a thing IS -- keys, array length, Object3D type. Scene
 *              names live in the global lexical scope and cannot be listed, so
 *              this is the half that is possible: stop guessing at STRUCTURE
 *              once you have a name.
 */
async function probe(scene, when, exprs) {
  // Lazy, exactly like smoke.js's loadBrowserDeps: every other verb here is
  // dependency-free string-and-ffmpeg work, and requiring playwright at module
  // scope would make `build.js vendor` need a browser it never opens.
  const { chromium } = require('playwright-core');
  const { chromiumPath, angleArgs, seekSynced } = require(path.join(__dirname, 'backend.js'));
  const PRELUDE = `
    const __rt = o => (o && o.root && o.root.isObject3D) ? o.root : o;
    const bb = o => new THREE.Box3().setFromObject(__rt(o));
    const sep = (a, b) => { const A = bb(a), B = bb(b), r = {};
      for (const k of ['x','y','z'])
        r[k] = +(Math.max(A.min[k], B.min[k]) - Math.min(A.max[k], B.max[k])).toFixed(4);
      r.touching = r.x <= 0 && r.y <= 0 && r.z <= 0; return r; };
    const proj = v => { const p = (v && v.isVector3 ? v.clone()
        : __rt(v).getWorldPosition(new THREE.Vector3())).project(camera);
      return { x: +p.x.toFixed(3), y: +p.y.toFixed(3),
               onScreen: Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1 }; };
    const reach = l => +(l.L1 + l.L2).toFixed(4);
    // shape(x) -- what IS this thing? A scene's top-level let/const live in the
    // global lexical environment, which is not enumerable, so probe can never
    // list what exists; you must know a name. What it can do is stop you
    // guessing at a name's STRUCTURE. Built after two wasted page loads spent
    // discovering that a rig's limbs are keyed HL/HR/FL/FR rather than indexed.
    const shape = x => {
      if (x === null || x === undefined) return String(x);
      if (Array.isArray(x)) return 'Array(' + x.length + ') of ' + shape(x[0]);
      if (x.isObject3D) return (x.type || 'Object3D') + (x.name ? ' "' + x.name + '"' : '')
        + ' children:' + x.children.length;
      if (x.isVector3) return 'Vector3';
      if (typeof x === 'object') return '{ ' + Object.keys(x).join(', ') + ' }';
      return typeof x + ' ' + String(x);
    };
  `;
  const browser = await chromium.launch({ executablePath: chromiumPath(), args: angleArgs() });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => console.error('scene error: ' + e.message));
    await page.goto('file://' + path.resolve(scene) + '?record=1');
    await page.waitForFunction('window.sceneReady === true', { timeout: 20000 })
      .catch(() => { throw new Error('scene never set window.sceneReady — check the errors above'); });
    await page.evaluate('window.stopPlayback()');
    const t = await page.evaluate(`(() => { const v = (${when}); if (!Number.isFinite(v))
      throw new Error('<when> did not evaluate to a number: ' + JSON.stringify(v)); return v; })()`);
    // seekSynced, not a bare seek: a probe that reads geometry does not strictly
    // need the readback, but every capture site in this repo goes through one
    // primitive and a second pattern here is how the first one drifted.
    await seekSynced(page, t);
    console.log(`${path.basename(scene)}  t=${t.toFixed(4)}  (${when})`);
    for (const e of exprs) {
      let out;
      try {
        out = await page.evaluate(`(() => { ${PRELUDE}; return (${e}); })()`);
      } catch (err) {
        const msg = String(err.message).split('\n')[0];
        out = 'ERROR — ' + msg;
        // A "cannot read properties of undefined" here almost always means the
        // shape was guessed, not that the object is missing. Say what to run
        // next instead of leaving the reader to invent a second probe call.
        // Suggest the SCENE object, not the prelude helper that wrapped it. The
        // first version matched the leading identifier and proposed `shape(bb)`,
        // which is this file's own function -- useless, and a small instance of
        // the thing probe exists to stop: answering with what is easy to compute
        // rather than what was asked.
        if (/undefined|not a function/.test(msg)) {
          const HELPERS = new Set(['bb', 'sep', 'proj', 'reach', 'shape', 'JSON', 'Math', 'Object', 'Array']);
          const chains = (e.match(/[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+/g) || [])
            .filter(c => !HELPERS.has(c.split('.')[0]));
          const best = chains.sort((a, b) => b.length - a.length)[0];
          if (best) {
            // Indexing something that is not an array is the common case, and
            // there the chain ITSELF is what you want described -- `bear.limbs[0]`
            // failing means `shape(bear.limbs)`, not `shape(bear)`. Otherwise the
            // last component is the property that came back undefined, so drop it.
            const indexed = e.includes(best + '[');
            const parts = best.split('.');
            const target = indexed ? best : parts.slice(0, Math.max(1, parts.length - 1)).join('.');
            out += `\n    try: 'shape(${target})'`;
          }
        }
      }
      console.log(`  ${e}`);
      console.log(`    ${typeof out === 'object' ? JSON.stringify(out) : out}`);
    }
  } finally {
    await browser.close();
  }
}

const USAGE = 'usage: bun run build.js vendor|bundle|frames|video|all|avif|loop|poster|sheet|aspect|strip|motion|check|probe <scene.html> [fps|t|t0] [width|t1] [frac|fps]\n'
  + "       probe: bun run build.js probe <scene.html> <when> '<expr>' ['<expr>' ...]";
// arg1/arg2/arg3 are deliberately neutral: their meaning is per-command (fps
// for frames, t for poster, width for sheet, ...) and the old names (fpsArg,
// widthArg) lied for most commands — each dispatch line below names what it
// actually reads.
const [, , step, target, arg1, arg2, arg3] = process.argv;
// Every command needs the scene — vendor() with no target used to build the
// full minified bundle, embed it into nothing, and delete it: a do-nothing
// path that cost a full three build and needed a SKILL.md caveat to explain.
if (step && !target) {
  console.error(`${step}: missing <scene.html>\n${USAGE}`); process.exit(1);
}
// The four review-still verbs became async when they moved off ffmpeg (Track
// E1): the tiler drives a browser, where the encoder was a blocking child
// process. `die` gives them the same failure shape the synchronous verbs have —
// message on stderr, exit 1 — because an unhandled rejection would otherwise
// print a stack trace AND exit 0 on some runtimes, which is a command that fails
// while reporting success.
const die = p => p.catch(e => { console.error(String(e && e.message || e)); process.exit(1); });
if (step === 'vendor') { const tp = path.resolve(target); vendor(path.dirname(tp), tp); }
else if (step === 'avif') avif(target, Number(arg2 || 720), Number(arg1 || 12));
else if (step === 'loop') loop(target, Number(arg2 || 720), Number(arg1 || 12));
else if (step === 'poster') die(poster(target, Number(arg1 || 0), Number(arg2 || 960)));
else if (step === 'bundle') bundle(target);
else if (step === 'frames') frames(target, Number(arg1 || 30));
else if (step === 'video') video(target, Number(arg1 || 30));
else if (step === 'all') { bundle(target); frames(target, Number(arg1 || 30)); video(target, Number(arg1 || 30)); }
else if (step === 'aspect') die(aspectSheet(target, Number(arg1 || 0), Number(arg2 || 520)));
else if (step === 'sheet') die(sheet(target, Number(arg1 || 480), arg2 === undefined ? 0.6 : Number(arg2), arg3 === 'nocap'));
else if (step === 'strip') die(strip(target, Number(arg1), Number(arg2), Number(arg3 || 30)));
else if (step === 'motion') motion(target, Number(arg1 || 12));
// Synchronous and browserless, so it needs no encoder probe and no `die`. It
// sets process.exitCode rather than calling process.exit, so the whole report
// reaches the terminal before the code is read. The catch is `die`'s shape for
// a sync verb, and it is here rather than nowhere because this command's entire
// output is a report: answering "is this a scene?" with an interpreter stack
// trace would be the one verb whose failure mode is harder to read than its
// subject.
else if (step === 'check') {
  try { check(target); } catch (e) { console.error(String(e && e.message || e)); process.exit(1); }
}
// probe takes ALL remaining argv rather than the neutral arg1..arg3 slots: the
// point is measuring several offsets at one t in one page load, and capping it
// at three would send an author back to hand-written page.evaluate for the
// fourth — which is the thing this command exists to retire.
else if (step === 'probe') {
  const exprs = process.argv.slice(5);
  if (!arg1 || !exprs.length) {
    console.error("probe: need <when> and at least one expression\n" + USAGE); process.exit(1);
  }
  probe(target, arg1, exprs).catch(e => { console.error(String(e.message)); process.exit(1); });
}
else { console.error(USAGE); process.exit(1); }
