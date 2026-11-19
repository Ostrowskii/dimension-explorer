// Animação 2 — Pikachu feliz: loop de 6 s com três pulinhos, orelhas balançando com atraso,
// aceno, cabeça inclinada e rabo abanando. Todo movimento fecha o ciclo em 6 s.
// node feliz.js            → quadros + feliz.mp4 + feliz.gif
// node feliz.js --preview  → só alguns quadros para conferir
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const R = require('../gengar-animacoes/rig.js');
const P = require('./pikachu-rig.js');
const { V, affine, compose, rotX, rotY, rotZ, scale3, mm, turnToward } = R;

const LOOP = 6, HOP = 2; // um pulo a cada 2 s
const wave = (t, cycles, phase = 0) => Math.sin((t / LOOP) * cycles * Math.PI * 2 + phase);

// um pulo: agacha (0–0,2), voa (0,2–0,7), aterrissa achatando (0,7–0,85), descansa
const hopAt = t => {
  const u = (t % HOP) / HOP;
  const air = u > 0.2 && u < 0.7 ? Math.sin(Math.PI * (u - 0.2) / 0.5) : 0;
  const crouch = u < 0.2 ? Math.sin(Math.PI * u / 0.2) : 0;
  const land = u > 0.7 && u < 0.85 ? Math.sin(Math.PI * (u - 0.7) / 0.15) : 0;
  const velocity = u > 0.2 && u < 0.7 ? Math.cos(Math.PI * (u - 0.2) / 0.5) : 0; // + subindo, − caindo
  return { air, crouch, land, velocity };
};

const g = P.load({});
const pivot = P.PIVOTS;
const armRest = s => [s * 0.12, -0.19, 0.36];

function frame(t) {
  const h = hopAt(t);
  const lag = hopAt((t - 0.12 + LOOP) % LOOP); // orelhas seguem o corpo com atraso
  const sy = 1 - 0.13 * h.crouch - 0.15 * h.land + 0.1 * h.air;
  const sx = 1 + 0.07 * h.crouch + 0.09 * h.land - 0.04 * h.air;
  const turn = 0.22 * wave(t, 1);
  const body = affine(mm(rotY(turn), scale3(sx, sy, sx)), [0, 0, 0], [0, 0.55 * h.air, 0]);

  const headLocal = affine(mm(rotZ(0.16 * wave(t, 1, 0.8)), rotX(-0.06 * h.air)), pivot.head);
  // orelhas: caem quando o corpo sobe e sobem quando ele cai, com atraso
  const ear = s => affine(mm(rotZ(s * (-0.28 * lag.velocity + 0.08 * wave(t, 6, s))), rotX(0.18 * lag.air)), pivot[s > 0 ? 'earR' : 'earL']);
  // braço direito acena; o esquerdo acompanha o pulo
  const arm = s => {
    const lift = s > 0 ? 0.5 + 0.5 * wave(t, 1, -Math.PI / 2) : 0;
    const dir = s > 0 ? V.lerp(armRest(1), [0.45, 0.85, 0.25], lift) : V.lerp(armRest(-1), [-0.45, 0.2, 0.3], h.air);
    const waveHand = s > 0 ? 0.4 * lift * wave(t, 12) : 0;
    return affine(mm(turnToward(armRest(s), dir, 1), rotZ(waveHand)), pivot[s > 0 ? 'armR' : 'armL']);
  };
  const foot = s => affine(rotX(-0.35 * h.air + 0.1 * h.land), pivot[s > 0 ? 'footR' : 'footL']);
  const tail = affine(mm(rotY(0.5 * wave(t, 9)), rotX(0.12 * h.air)), pivot.tail);

  g.pose({ body, head: headLocal, earR: compose(headLocal, ear(1)), earL: compose(headLocal, ear(-1)), armR: arm(1), armL: arm(-1), footR: foot(1), footL: foot(-1), tail });
  return g.world;
}

const camera = t => ({ yaw: 0.3 + 0.2 * wave(t, 1, 0.3), pitch: 0.16, dist: 7.4, target: [0.15, 1.95, 0] });

R.film({ name: 'feliz', seconds: LOOP, fps: 15, frame, camera, outDir: __dirname, preview: [0, 0.3, 0.8, 1.45, 2.8, 3.4, 4.5, 5.3] });

if (!process.argv.includes('--preview')) {
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '15', '-i', path.join(__dirname, 'frames-feliz', 'frame-%04d.png'),
    '-vf', 'split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=none', '-loop', '0', path.join(__dirname, 'feliz.gif')], { stdio: 'inherit' });
  console.log('gif pronto: pikachu-animacoes/feliz.gif');
}
