// Animação 3 — Risada flutuante: loop contínuo de 6 s (o último quadro emenda no primeiro).
// Todo movimento usa frequências múltiplas de 1/6 Hz para fechar o ciclo.
// node risada.js            → quadros + risada.mp4 + risada.gif
// node risada.js --preview  → só alguns quadros para conferir
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const R = require('./rig.js');
const { affine, rotX, rotY, rotZ, scale3, mm, turnToward } = R;

const LOOP = 6;
const wave = (t, cycles, phase = 0) => Math.sin((t / LOOP) * cycles * Math.PI * 2 + phase);

const g = R.load({
  flatFloor: true,
  extraPalette: [0x0d0b12, 0x7a5fc0],
  fx: {
    // sombra redonda no chão, mais escura no centro
    sombra: ({ B, P }) => {
      for (let z = -1; z <= 1; z += 0.1) for (let x = -1; x <= 1; x += 0.1) {
        const r = Math.hypot(x, z);
        if (r > 1) continue;
        B.disc(x, 0.012, z, B.UP, 0.14, 0.01, B.P[P(0)], 0.5 * (1 - r * r), {});
      }
    },
    // fiapos de fantasma que sobem em volta dele (três anéis girando)
    fiapos: ({ B, P }) => {
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2, r = 1.7 + 0.25 * Math.sin(i * 2.3), y = 0.4 + (i % 6) * 0.45;
        B.dab(Math.cos(a) * r, y, Math.sin(a) * r, [0, 0, 1], [1, 0, 0], 0.045, 0.045, 0.045, B.P[P(1)], 0.45, { em: true });
      }
    }
  }
});

function frame(t) {
  // flutua: altura base + ondulação lenta
  const lift = 0.42 + 0.14 * wave(t, 2);
  // gargalhada em rajadas: "ha-ha-ha" rápido, modulado por uma onda lenta
  const burst = Math.max(0, wave(t, 2, -Math.PI / 2)) ** 2;
  const ha = burst * Math.abs(wave(t, 24));
  const lean = -0.12 * burst + 0.04 * wave(t, 1);
  const sway = 0.09 * wave(t, 1, 0.6);
  const squash = 1 + 0.07 * ha;
  const M = mm(mm(rotX(lean), rotZ(sway + 0.03 * wave(t, 24) * burst)), scale3(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash)));
  const body = affine(mm(rotY(0.18 * wave(t, 1, 1.2)), M), [0, 0.3, 0], [0, lift + 0.06 * ha, 0]);

  // braços: abrem e fecham rindo; na rajada, sobem como quem se diverte
  const armPose = s => {
    const open = 0.5 + 0.5 * wave(t, 3, s > 0 ? 0 : Math.PI);
    const dir = [s * (0.6 + 0.2 * open), -0.35 + 0.75 * burst + 0.15 * open, 0.4 + 0.2 * (1 - open)];
    return affine(mm(turnToward([s * 0.69, -0.3, 0.46], dir, 1), rotZ(s * 0.12 * wave(t, 12) * burst)), R.BONES[s > 0 ? 'armR' : 'armL'].a);
  };
  // pernas balançando soltas no ar
  const legPose = s => affine(rotX(0.22 * wave(t, 3, s > 0 ? 0 : Math.PI)), R.BONES[s > 0 ? 'legR' : 'legL'].a);

  const shadowSize = 1.05 - 0.25 * (lift - 0.28);
  const fx = name => {
    if (name === 'sombra') return { T: affine(scale3(shadowSize, 1, shadowSize * 0.85), [0, 0, 0], [0, 0, 0.1]), alpha: 1 };
    if (name === 'fiapos') return { T: affine(rotY((t / LOOP) * Math.PI * 2 / 3), [0, 0, 0], [0, 0.15 * wave(t, 2), 0]), alpha: 0.8 };
    return null;
  };
  g.pose({ body, armR: armPose(1), armL: armPose(-1), legR: legPose(1), legL: legPose(-1) }, fx);
  return g.world;
}

const camera = t => ({ yaw: 0.3 + 0.22 * wave(t, 1), pitch: 0.2, dist: 6.6, target: [0, 1.85, 0] });

R.film({ name: 'risada', seconds: LOOP, fps: 15, frame, camera, preview: [0, 0.75, 1.5, 2.25, 3, 3.75, 4.5, 5.25] });

if (!process.argv.includes('--preview')) {
  const dir = path.join(__dirname, 'frames-risada');
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '15', '-i', path.join(dir, 'frame-%04d.png'),
    '-vf', 'split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=none', '-loop', '0', path.join(__dirname, 'risada.gif')], { stdio: 'inherit' });
  console.log('gif pronto: gengar-animacoes/risada.gif');
}
