// Animação 1 — Choque do trovão: agacha, as bochechas faíscam, solta raios em volta e comemora.
// node choque.js            → quadros + choque.mp4
// node choque.js --preview  → só alguns quadros para conferir
const R = require('../gengar-animacoes/rig.js');
const P = require('./pikachu-rig.js');
const { V, affine, compose, rotX, rotY, rotZ, scale3, mm, turnToward, span, smooth, IDENTITY } = R;

const CHEEKS = [[0.43, 1.69, 0.5], [-0.43, 1.69, 0.5]];
const CENTER = [0, 1.35, 0];

// um raio: linha quebrada com núcleo branco e brilho amarelo, e às vezes um galho
function bolt(B, start, dir, length, seed) {
  const n = 7;
  const side = V.norm(V.cross(dir, [0.3, 1, 0.2]));
  const side2 = V.cross(dir, side);
  let prev = start;
  const pts = [start];
  for (let i = 1; i <= n; i++) {
    const along = V.add(start, V.mul(dir, (length * i) / n));
    const jitter = V.add(V.mul(side, (B.R() - 0.5) * 0.45), V.mul(side2, (B.R() - 0.5) * 0.45));
    pts.push(i === n ? along : V.add(along, jitter));
  }
  const draw = (a, b, core) => {
    const steps = Math.ceil(V.len(V.sub(b, a)) / 0.035);
    for (let k = 0; k <= steps; k++) {
      const p = V.lerp(a, b, k / steps);
      B.dab(p[0], p[1], p[2], [0, 0, 1], [1, 0, 0], core, core, core, [255, 252, 224], 0.95, { em: true });
      if (k % 2 === 0) B.dab(p[0], p[1], p[2], [0, 0, 1], [1, 0, 0], core * 3.2, core * 3.2, core * 3.2, [255, 225, 77], 0.12, { em: true });
    }
  };
  for (let i = 0; i < n; i++) draw(pts[i], pts[i + 1], 0.03);
  // galho
  const from = pts[2 + (seed % 3)];
  const branchDir = V.norm(V.add(dir, V.mul(side, 0.9)));
  let a = from;
  for (let i = 1; i <= 3; i++) {
    const b = V.add(V.add(from, V.mul(branchDir, 0.28 * i)), V.mul(side2, (B.R() - 0.5) * 0.25));
    const steps = Math.ceil(V.len(V.sub(b, a)) / 0.035);
    for (let k = 0; k <= steps; k++) {
      const p = V.lerp(a, b, k / steps);
      B.dab(p[0], p[1], p[2], [0, 0, 1], [1, 0, 0], 0.022, 0.022, 0.022, [255, 252, 224], 0.9, { em: true });
    }
    a = b;
  }
}

const boltGroup = seed => ({ B }) => {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + seed * 0.7 + B.R() * 0.5;
    const dir = V.norm([Math.cos(a), 0.35 + B.R() * 0.9, Math.sin(a) * 0.8]);
    bolt(B, V.add(CENTER, V.mul(dir, 0.55)), dir, 1.6 + B.R() * 0.9, seed + i);
  }
};
const sparkGroup = () => ({ B }) => {
  for (const c of CHEEKS) for (let i = 0; i < 16; i++) {
    const p = V.add(c, [(B.R() - 0.5) * 0.4, (B.R() - 0.5) * 0.35, B.R() * 0.15]);
    const big = B.R() < 0.3;
    B.dab(p[0], p[1], p[2], [0, 0, 1], [1, 0, 0], big ? 0.045 : 0.025, big ? 0.045 : 0.025, 0.025, big ? [255, 252, 224] : [255, 225, 77], 0.9, { em: true });
  }
};

const g = P.load({
  extraPalette: [0xfffce0, 0xffe14d],
  fx: {
    sparksA: sparkGroup(), sparksB: sparkGroup(), sparksC: sparkGroup(),
    bolts1: boltGroup(1), bolts2: boltGroup(2), bolts3: boltGroup(3),
    flash: ({ B }) => {
      for (let i = 0; i < 700; i++) {
        const u = B.R() * 2 - 1, a = B.R() * Math.PI * 2, r = 0.5 + B.R() * 3.2, s = Math.sqrt(1 - u * u);
        B.dab(CENTER[0] + Math.cos(a) * s * r, CENTER[1] + u * r, CENTER[2] + Math.sin(a) * s * r, [0, 0, 1], [1, 0, 0], 0.35, 0.35, 0.35, [255, 252, 224], 0.05, { em: true });
      }
    }
  }
});

const cam = { yaw: 0.3, pitch: 0.16, dist: 6.6, target: [0.15, 1.55, 0] };
const pivot = P.PIVOTS;
const armRest = s => [s * 0.12, -0.19, 0.36];

function frame(t) {
  const f = Math.round(t * 15);
  const crouch = span(t, 1.0, 1.8) * (1 - span(t, 4.1, 4.4));
  const charge = span(t, 1.6, 4.2);
  const blast = span(t, 4.15, 4.35) * (1 - span(t, 5.6, 6.3));
  const victory = span(t, 6.3, 6.7);
  const hop = Math.max(0, Math.sin(Math.PI * (t - 6.6) / 0.5)) * (t > 6.6 && t < 7.1 ? 1 : 0);
  const shake = charge * (1 - span(t, 4.2, 4.3)) * 0.025 * Math.sin(t * 90) + blast * 0.03 * Math.sin(t * 70);
  const breathe = 0.02 * Math.sin(t * 3);

  const sy = 1 + breathe - 0.12 * crouch + 0.1 * blast + 0.08 * hop;
  const sx = 1 + 0.06 * crouch - 0.04 * blast;
  const lean = 0.14 * crouch - 0.08 * blast;
  const body = affine(mm(mm(rotX(lean), rotZ(shake)), scale3(sx, sy, sx)), [0, 0, 0], [shake * 0.5, 0.35 * hop, 0]);

  const headLocal = affine(mm(rotX(0.12 * crouch - 0.18 * blast), rotZ(0.12 * victory * Math.sin(t * 5))), pivot.head);
  const earAngle = s => {
    const perk = 0.32 * Math.max(crouch, charge, blast);
    const twitch = s > 0 ? 0.35 * Math.max(0, Math.sin(Math.PI * (t - 0.5) / 0.3)) * (t > 0.5 && t < 0.8 ? 1 : 0) : 0;
    const flop = 0.15 * victory * Math.sin(t * 9 + s);
    return affine(rotZ(s * (perk - twitch + flop) - s * 0.1 * blast * Math.sin(t * 40)), pivot[s > 0 ? 'earR' : 'earL']);
  };
  const armPose = s => {
    let dir = V.lerp(armRest(s), [s * 0.2, -0.45, 0.25], crouch);
    dir = V.lerp(dir, [s * 0.7, 0.55, 0.25], blast);
    if (s > 0) dir = V.lerp(dir, [0.35, 0.9, 0.15], victory);
    const wave = s > 0 ? 0.35 * victory * Math.sin(t * 12) : 0;
    return affine(mm(turnToward(armRest(s), dir, 1), rotZ(wave)), pivot[s > 0 ? 'armR' : 'armL']);
  };
  const footPose = s => affine(rotX(-0.3 * hop), pivot[s > 0 ? 'footR' : 'footL']);
  const tailPose = affine(rotY(0.45 * victory * Math.sin(t * 10) + 0.1 * Math.sin(t * 2)), pivot.tail);

  const headWorld = compose(body, headLocal);
  const fx = name => {
    if (name.startsWith('sparks')) {
      const on = charge > 0.05 && t < 5.6 && ['sparksA', 'sparksB', 'sparksC'][f % 3] === name;
      return on ? { T: headWorld, alpha: Math.min(1, charge * 1.5 + blast) } : null;
    }
    if (name.startsWith('bolts')) {
      const on = blast > 0.02 && ['bolts1', 'bolts2', 'bolts3'][f % 3] === name;
      return on ? { T: affine(rotY(f * 0.9), CENTER, [0, 0, 0]), alpha: blast } : null;
    }
    if (name === 'flash') {
      const a = span(t, 4.15, 4.25) * (1 - span(t, 4.3, 4.9));
      return a > 0.01 ? { T: IDENTITY, alpha: a * 0.55 } : null;
    }
    return null;
  };
  g.pose({ body, head: headLocal, earR: compose(headLocal, earAngle(1)), earL: compose(headLocal, earAngle(-1)), armR: armPose(1), armL: armPose(-1), footR: footPose(1), footL: footPose(-1), tail: tailPose }, fx);
  return g.world;
}

const camera = t => {
  const shake = span(t, 4.15, 4.3) * (1 - span(t, 4.9, 5.6)) * 0.07;
  const push = span(t, 1.4, 4.1) * (1 - span(t, 6.0, 7.5));
  return { yaw: cam.yaw, pitch: cam.pitch, dist: cam.dist * (1 - 0.12 * push), target: [cam.target[0] + shake * Math.sin(t * 95), cam.target[1] + shake * Math.cos(t * 81), cam.target[2]] };
};

R.film({ name: 'choque', seconds: 8, fps: 15, frame, camera, outDir: __dirname, preview: [0.6, 1.8, 3.0, 4.0, 4.25, 4.8, 5.4, 6.85] });
