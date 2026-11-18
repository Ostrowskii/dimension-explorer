// Esqueleto simples para animar o Gengar detalhado (pikachu/pikachu.js) quadro a quadro.
// A cena é montada uma vez; a cada quadro os splats de corpo, braços e pernas são movidos
// (posição e forma), e efeitos extras (FX) são acrescentados como splats próprios.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const studioRoot = process.env.INK_STUDIO || path.resolve(__dirname, '../../shapeshift-labs-ink-studio');
const kit = require(path.join(studioRoot, 'index.js')).load();
const renderer = require(path.join(studioRoot, 'cli/render.js'));
const png = require(path.join(studioRoot, 'cli/png.js'));

// ---------- pequenas contas de vetor e matriz 3x3 ----------
const V = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
};
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const mm = (A, B) => {
  const R = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c];
  return R;
};
const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
const axisAngle = (axis, angle) => {
  const [x, y, z] = V.norm(axis), c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
  return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c];
};
const rotX = a => axisAngle([1, 0, 0], a), rotY = a => axisAngle([0, 1, 0], a), rotZ = a => axisAngle([0, 0, 1], a);
const scale3 = (sx, sy, sz) => [sx, 0, 0, 0, sy, 0, 0, 0, sz];
// rotação que leva a direção a até a direção b, aplicada em fração `amount`
const turnToward = (a, b, amount) => {
  a = V.norm(a); b = V.norm(b);
  const axis = V.cross(a, b), s = V.len(axis);
  if (s < 1e-6) return I3;
  return axisAngle(axis, Math.atan2(s, V.dot(a, b)) * amount);
};
// transformação afim: x' = M (x - pivot) + pivot + move
const affine = (M, pivot, move = [0, 0, 0]) => ({ M, pivot, move });
const apply = (T, p) => V.add(V.add(mv(T.M, V.sub(p, T.pivot)), T.pivot), T.move);
const compose = (outer, inner) => { // outer(inner(p))
  const M = mm(outer.M, inner.M);
  const origin = apply(outer, apply(inner, [0, 0, 0]));
  return { M, pivot: [0, 0, 0], move: origin };
};
const IDENTITY = affine(I3, [0, 0, 0]);

// ---------- curvas de tempo ----------
const clamp01 = t => Math.max(0, Math.min(1, t));
const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
const span = (t, a, b) => smooth((t - a) / (b - a)); // 0 antes de a, 1 depois de b
const easeOutBack = t => { t = clamp01(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

// ---------- partes do corpo ----------
const C = [0, 1.35, 0], RADII = [1.25, 1.1, 1.05];
const BONES = {
  armR: { a: [0.95, 1.28, 0.18], b: [1.9, 0.95, 0.85], r: 0.5 },
  armL: { a: [-0.95, 1.28, 0.18], b: [-1.9, 0.95, 0.85], r: 0.5 },
  legR: { a: [0.5, 0.62, 0.05], b: [0.72, 0.08, 1.0], r: 0.55 },
  legL: { a: [-0.5, 0.62, 0.05], b: [-0.72, 0.08, 1.0], r: 0.55 }
};
const segDist = (p, a, b) => {
  const ab = V.sub(b, a), t = clamp01(V.dot(V.sub(p, a), ab) / V.dot(ab, ab));
  return V.len(V.sub(p, V.add(a, V.mul(ab, t))));
};

// Monta a cena do Gengar (com a paleta estendida para os efeitos) e devolve o boneco pronto para animar.
function load({ extraPalette = [], fx } = {}) {
  let basePalette = null;
  const wrapped = Object.assign({}, kit, {
    makeBuilder: (seed, pal) => { basePalette = pal; return kit.makeBuilder(seed, [...pal, ...extraPalette]); }
  });
  const scene = require(path.resolve(__dirname, '../pikachu/pikachu.js'))(wrapped);
  const world = scene.build(scene.seed);
  const palette = [...basePalette, ...extraPalette];
  const floor = new Set([basePalette[13], basePalette[14]].map(h => h));

  const N = world.count;
  const base = Float32Array.from(world.data);
  // peso de cada parte por splat; o chão fica parado
  const part = new Int8Array(N); // -1 chão, 0 corpo, 1..4 osso dominante
  const weight = new Float32Array(N);
  const names = Object.keys(BONES);
  for (let i = 0; i < N; i++) {
    const q = i * 16, p = [base[q], base[q + 1], base[q + 2]];
    const rgb = base[q + 7] | 0, hex = ((rgb & 255) << 16) | (rgb & 0xff00) | ((rgb >>> 16) & 255);
    if (p[1] < 0.03 && floor.has(hex)) { part[i] = -1; continue; }
    const e = Math.hypot((p[0] - C[0]) / RADII[0], (p[1] - C[1]) / RADII[1], (p[2] - C[2]) / RADII[2]);
    const outside = smooth((e - 0.98) / 0.16);
    let best = 0, bestW = 0;
    names.forEach((name, k) => {
      const bone = BONES[name];
      const near = 1 - smooth((segDist(p, bone.a, bone.b) - bone.r) / 0.15);
      const w = near * outside;
      if (w > bestW) { bestW = w; best = k + 1; }
    });
    part[i] = bestW > 0.01 ? best : 0;
    weight[i] = bestW;
  }

  // Efeitos extras: cada grupo é montado numa cena própria e vira linhas acrescentadas ao mundo.
  // fx = { nome: ({ B, S, K, P }) => { ...formas... } }  — P(i) é o índice da i-ésima cor extra.
  const fxGroups = {}, chunks = [];
  let fxCount = 0;
  for (const [name, make] of Object.entries(fx || {})) {
    const B = kit.makeBuilder(world.seed || 1, palette);
    const S = kit.KIT.sculpt(kit.makeSculpt(B));
    make({ B, S, K: kit.KIT, P: i => basePalette.length + i });
    if (S.bake) S.bake();
    const fw = B.finish({ cam: world.cam, detail: world.detail, radius: 3 });
    chunks.push(fw.data.subarray(0, fw.count * 16));
    fxGroups[name] = [fxCount, fxCount + fw.count];
    fxCount += fw.count;
  }
  const fxRows = new Float32Array(fxCount * 16);
  let offset = 0;
  for (const chunk of chunks) { fxRows.set(chunk, offset); offset += chunk.length; }
  const totalFx = fxRows.length / 16;
  world.data = new Float32Array((N + totalFx) * 16);
  world.count = N + totalFx;
  world.pal = palette;

  const out = world.data;
  const writeSplat = (src, si, dst, di, T) => {
    const s = si * 16, d = di * 16;
    for (let k = 0; k < 16; k++) out[d + k] = src[s + k];
    if (!T) return;
    const p = apply(T, [src[s], src[s + 1], src[s + 2]]);
    out[d] = p[0]; out[d + 1] = p[1]; out[d + 2] = p[2];
    transformCov(T.M, src, s, out, d);
  };

  return {
    world, palette, part, weight, N, fxRows, fxGroups, totalFx,
    /** pose: { body: affine, armR, armL, legR, legL: affine (locais, aplicados antes do corpo) }
        fxPose(name) devolve { T: affine | null (null esconde), alpha: 0..1 } para cada grupo de efeito */
    pose(pose, fxPose) {
      const body = pose.body || IDENTITY;
      const bones = names.map(n => compose(body, pose[n] || IDENTITY));
      for (let i = 0; i < N; i++) {
        const k = part[i];
        if (k < 0) { writeSplat(base, i, out, i, null); continue; }
        const w = weight[i];
        if (k === 0 || w <= 0) { writeSplat(base, i, out, i, body); continue; }
        const q = i * 16, p = [base[q], base[q + 1], base[q + 2]];
        const pb = apply(body, p), pk = apply(bones[k - 1], p);
        writeSplat(base, i, out, i, w > 0.5 ? bones[k - 1] : body);
        const d = i * 16;
        out[d] = pb[0] + (pk[0] - pb[0]) * w;
        out[d + 1] = pb[1] + (pk[1] - pb[1]) * w;
        out[d + 2] = pb[2] + (pk[2] - pb[2]) * w;
      }
      for (const [name, [a, b]] of Object.entries(fxGroups)) {
        const state = fxPose ? fxPose(name) : null;
        for (let j = a; j < b; j++) {
          const di = N + j;
          if (!state || !state.T || state.alpha <= 0) { // escondido: bem abaixo do chão, sem densidade
            writeSplat(fxRows, j, out, di, null);
            out[di * 16 + 1] = -500; out[di * 16 + 3] = 0;
            continue;
          }
          writeSplat(fxRows, j, out, di, state.T);
          out[di * 16 + 3] = fxRows[j * 16 + 3] * state.alpha;
        }
      }
    }
  };
}

// C' = M C Mᵀ para a matriz de forma (covariância) de um splat
function transformCov(M, src, s, out, d) {
  const c00 = src[s + 4], c01 = src[s + 5], c02 = src[s + 6], c11 = src[s + 8], c12 = src[s + 9], c22 = src[s + 10];
  const Cm = [c00, c01, c02, c01, c11, c12, c02, c12, c22];
  const MC = mm(M, Cm);
  const Mt = [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]];
  const R = mm(MC, Mt);
  out[d + 4] = R[0]; out[d + 5] = R[1]; out[d + 6] = R[2];
  out[d + 8] = R[4]; out[d + 9] = R[5]; out[d + 10] = R[8];
}

// Renderiza todos os quadros e junta em MP4.
function film({ name, seconds, fps = 15, frame, camera, preview = [] }) {
  const dir = path.join(__dirname, `frames-${name}`);
  fs.mkdirSync(dir, { recursive: true });
  const count = Math.round(seconds * fps);
  const only = process.argv.includes('--preview') ? preview.map(s => Math.round(s * fps)) : null;
  for (let i = 0; i < count; i++) {
    if (only && !only.includes(i)) continue;
    const t = i / fps;
    const world = frame(t);
    const cam = camera(t);
    const img = renderer.render(world, Object.assign({ w: 480, h: 270, px: 1, t }, cam));
    png.write(path.join(dir, `frame-${String(i).padStart(4, '0')}.png`), img.w, img.h, img.rgb);
    if (i % fps === 0) console.log(`${name}: ${i + 1}/${count}`);
  }
  if (only) return console.log(`prévias em ${dir}`);
  const mp4 = path.join(__dirname, `${name}.mp4`);
  const result = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', path.join(dir, 'frame-%04d.png'),
    '-vf', 'scale=960:540:flags=neighbor', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(dir, `frame-${String(Math.round(count * 0.55)).padStart(4, '0')}.png`), '-vf', 'scale=960:540:flags=neighbor', path.join(__dirname, `${name}.png`)]);
  console.log(`vídeo pronto: gengar-animacoes/${name}.mp4`);
}

module.exports = { kit, load, film, V, I3, mm, axisAngle, rotX, rotY, rotZ, scale3, turnToward, affine, compose, IDENTITY, BONES, C, smooth, span, clamp01, easeOutBack };
