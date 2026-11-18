// Animação 1 — Shadow Ball: flutua rindo, junta as mãos, carrega uma esfera de sombra e lança na câmera.
// node shadow-ball.js            → quadros + shadow-ball.mp4
// node shadow-ball.js --preview  → só alguns quadros para conferir
const R = require('./rig.js');
const { V, affine, compose, rotX, rotY, rotZ, scale3, mm, turnToward, span, smooth, IDENTITY } = R;

const g = R.load({
  // cores extras da esfera: núcleo escuro, roxo, magenta da aura, brilho
  extraPalette: [0x12061f, 0x2b0d4a, 0x4b1a7a, 0x8a3fd1, 0xd77bff, 0xf6d8ff],
  fx: {
    ball: ({ S, P }) => {
      S.ball([0, 0, 0], 0.5, { r: [P(0), P(0), P(1), P(1), P(2)] }, { res: 0.035 });
    },
    aura: ({ B, P }) => {
      // anel de pontos translúcidos e brilhantes em volta da esfera
      for (let i = 0; i < 1400; i++) {
        const u = B.R() * 2 - 1, a = B.R() * Math.PI * 2, r = 0.52 + B.R() * 0.32;
        const s = Math.sqrt(1 - u * u);
        const x = Math.cos(a) * s * r, y = u * r, z = Math.sin(a) * s * r;
        const color = B.R() < 0.8 ? [138, 63, 209] : [215, 123, 255];
        B.dab(x, y, z, [0, 0, 1], [1, 0, 0], 0.06, 0.06, 0.06, color, 0.025 + 0.05 * (1 - (r - 0.52) / 0.32), { em: true });
      }
    },
    sparks: ({ B }) => {
      // faíscas que giram mais longe da esfera
      for (let i = 0; i < 90; i++) {
        const a = (i / 90) * Math.PI * 2 * 3, r = 0.95 + 0.25 * Math.sin(i * 1.7), y = 0.35 * Math.sin(i * 0.9);
        B.dab(Math.cos(a) * r, y, Math.sin(a) * r, [0, 0, 1], [1, 0, 0], 0.03, 0.03, 0.03, [215, 123, 255], 0.5, { em: true });
      }
    }
  }
});

const cam = { yaw: 0.3, pitch: 0.16, dist: 6.4, target: [0, 1.75, 0] };
const eye = V.add(cam.target, V.mul([Math.cos(cam.pitch) * Math.sin(cam.yaw), Math.sin(cam.pitch), Math.cos(cam.pitch) * Math.cos(cam.yaw)], cam.dist));

// direções dos braços (do ombro até a mão): parado, mãos juntas na frente, empurrando
const shoulder = s => R.BONES[s > 0 ? 'armR' : 'armL'].a;
const restDir = s => [s * 0.69, -0.3, 0.46];
const gatherDir = s => [-s * 0.55, -0.12, 1.0];
const pushDir = s => [-s * 0.22, 0.05, 1.0];
const armPose = (s, t) => {
  const gather = span(t, 1.4, 2.4) * (1 - span(t, 6.2, 7.0));
  const push = span(t, 5.45, 5.75) * (1 - span(t, 6.2, 7.0));
  const pull = span(t, 4.9, 5.4) * (1 - span(t, 5.45, 5.6));
  let dir = V.lerp(restDir(s), gatherDir(s), gather);
  dir = V.lerp(dir, pushDir(s), push);
  dir = V.lerp(dir, [s * 0.4, 0.25, 0.3], pull * 0.6);
  const wave = (1 - gather) * 0.18 * Math.sin(t * 7 + s); // braços balançando ao rir
  const tremble = span(t, 2.6, 3.0) * (1 - span(t, 5.4, 5.5)) * 0.04 * Math.sin(t * 55 + s);
  const M = mm(turnToward(restDir(s), dir, 1), rotZ(s * (wave + tremble)));
  return affine(M, shoulder(s));
};

function frame(t) {
  // flutuar: sobe no começo e oscila; ri balançando
  const lift = 0.3 * smooth(t / 0.9) + 0.07 * Math.sin(t * Math.PI * 1.3);
  const laugh = (1 - span(t, 1.6, 2.2) + span(t, 6.3, 6.8)) * 0.07 * Math.sin(t * 13);
  const lean = -0.16 * span(t, 4.9, 5.4) * (1 - span(t, 5.45, 5.6)) + 0.2 * span(t, 5.45, 5.7) * (1 - span(t, 6.2, 7.0));
  const squash = 1 + 0.035 * Math.sin(t * 13) * (laugh !== 0 ? 1 : 0);
  const M = mm(mm(rotX(lean), rotZ(laugh)), scale3(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash)));
  const body = affine(M, [0, 0.3, 0], [0, lift, 0]);
  const legSwing = s => affine(rotX(0.12 * Math.sin(t * 3 + s)), R.BONES[s > 0 ? 'legR' : 'legL'].a);

  // esfera: nasce entre as mãos, cresce pulsando e voa até a câmera
  const holdPoint = [0, 0.98 + lift, 1.75];
  const grow = span(t, 2.4, 4.9);
  const throwT = span(t, 5.55, 6.15);
  let size = 0.1 + 0.62 * grow + 0.05 * Math.sin(t * 18) * grow;
  let center = V.add(holdPoint, [0, 0.05 * lean, 0.3 * span(t, 5.45, 5.6)]);
  if (throwT > 0) {
    const toward = V.lerp(center, V.lerp(eye, cam.target, 0.12), throwT * throwT);
    center = toward;
    size *= 1 + 1.4 * throwT;
  }
  const visible = t > 2.4 && throwT < 0.999;
  const spin = t * 2.4;
  const fx = name => {
    if (!visible) return null;
    if (name === 'ball') return { T: affine(scale3(size, size, size), [0, 0, 0], center), alpha: 1 };
    if (name === 'aura') return { T: affine(mm(rotY(spin), scale3(size, size, size)), [0, 0, 0], center), alpha: Math.min(1, grow * 1.5) };
    if (name === 'sparks') return { T: affine(mm(rotY(-spin * 1.6), scale3(size, size, size)), [0, 0, 0], center), alpha: span(t, 3.0, 3.6) };
    return null;
  };
  g.pose({ body, armR: armPose(1, t), armL: armPose(-1, t), legR: legSwing(1), legL: legSwing(-1) }, fx);
  return g.world;
}

// câmera: aproxima um pouco durante a carga e treme no lançamento
const camera = t => {
  const push = span(t, 2.4, 5.2) * (1 - span(t, 6.2, 7.5));
  const shake = span(t, 5.5, 5.7) * (1 - span(t, 6.0, 6.5)) * 0.06;
  return {
    yaw: cam.yaw, pitch: cam.pitch,
    dist: cam.dist * (1 - 0.12 * push),
    target: [cam.target[0] + shake * Math.sin(t * 90), cam.target[1] + shake * Math.cos(t * 77), cam.target[2]]
  };
};

R.film({ name: 'shadow-ball', seconds: 8, fps: 15, frame, camera, preview: [0.4, 2.2, 3.4, 4.8, 5.4, 5.8, 6.05, 7.3] });
