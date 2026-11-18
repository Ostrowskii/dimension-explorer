// Animação 2 — Sumir na sombra: afunda numa poça de sombra, desliza pelo chão com os olhos e o
// sorriso brilhando dentro dela e reaparece do outro lado.
// node sombra.js            → quadros + sombra.mp4
// node sombra.js --preview  → só alguns quadros para conferir
const R = require('./rig.js');
const { V, affine, rotX, rotY, rotZ, scale3, mm, turnToward, span, smooth } = R;

const g = R.load({
  flatFloor: true,
  extraPalette: [0x07040c, 0x150a24, 0xff3b4e, 0xf2f0ea],
  fx: {
    // poça escura: discos translúcidos deitados no chão, mais densos no meio
    poca: ({ B, P }) => {
      for (let z = -1; z <= 1; z += 0.09) for (let x = -1; x <= 1; x += 0.09) {
        const r = Math.hypot(x, z / 0.8);
        if (r > 1) continue;
        const wobble = 0.06 * Math.sin(Math.atan2(z, x) * 5);
        if (r > 0.94 + wobble) continue;
        B.disc(x, 0.012, z, B.UP, 0.13, 0.01, B.P[r < 0.6 ? P(0) : P(1)], 0.55 * (1 - 0.6 * r * r), {});
      }
    },
    // olhos bravos e sorriso, pintados na poça e brilhando
    rosto: ({ B, P }) => {
      for (const s of [-1, 1]) for (let i = 0; i <= 10; i++) {
        const u = i / 10, x = s * (0.12 + 0.3 * u), z = -0.32 + 0.12 * u - 0.07 * Math.sin(u * Math.PI);
        for (let k = 0; k < 3; k++) B.disc(x, 0.03, z + k * 0.04 - 0.04 * u, B.UP, 0.07, 0.008, B.P[P(2)], 3, { em: true });
      }
      for (let i = 0; i <= 26; i++) {
        const u = i / 26 * 2 - 1, x = u * 0.5, z = 0.12 + 0.18 * (1 - u * u);
        B.disc(x, 0.03, z, B.UP, 0.06, 0.008, B.P[P(3)], 3, { em: true });
        if (i % 2 === 0) B.disc(x, 0.03, z - 0.06 * (1 - u * u), B.UP, 0.035, 0.008, B.P[P(3)], 3, { em: true });
      }
    }
  }
});

const cam = { yaw: 0.25, pitch: 0.34, dist: 7.6, target: [-0.85, 1.15, 0.2] };
const start = [0, 0, 0], end = [-1.75, 0, 0.55];

function frame(t) {
  // onde ele está no chão: parado → desliza (como poça) → parado do outro lado
  const slide = span(t, 2.6, 4.6);
  const at = V.lerp(start, end, slide);
  // quanto afundou: 0 em pé, 1 todo dentro da sombra
  const sink = span(t, 1.2, 2.6) * (1 - span(t, 5.2, 6.6));
  const depth = 3.4 * Math.pow(sink, 1.3);
  const melt = 1 + 0.35 * sink;                              // alarga ao derreter
  const laugh = (1 - span(t, 1.0, 1.4) + span(t, 6.4, 6.9)) * 0.07 * Math.sin(t * 13);
  const pop = span(t, 6.2, 6.6) * (1 - span(t, 6.6, 7.1)) * 0.12; // estica ao sair
  const M = mm(rotZ(laugh), scale3(melt * (1 - pop * 0.5), 1 + pop - 0.1 * sink, melt * (1 - pop * 0.5)));
  const body = affine(M, [0, 0, 0], [at[0], -depth + 0.05 * Math.sin(t * 4) * (1 - sink), at[2]]);

  // braços: balançam rindo, levantam ao afundar (como quem é puxado para baixo)
  const armPose = s => {
    const up = sink;
    const wave = (1 - up) * 0.2 * Math.sin(t * 7 + s);
    const M = mm(turnToward([s * 0.69, -0.3, 0.46], [s * 0.5, 0.85, 0.2], up * 0.9), rotZ(s * wave));
    return affine(M, R.BONES[s > 0 ? 'armR' : 'armL'].a);
  };
  const legPose = s => affine(rotX(0.1 * Math.sin(t * 3 + s)), R.BONES[s > 0 ? 'legR' : 'legL'].a);

  // poça: é a sombra dele; cresce quando ele afunda e leva o rosto junto enquanto desliza
  const pool = 0.55 + 1.15 * span(t, 0.9, 2.2) * (1 - span(t, 6.0, 7.2));
  const face = span(t, 2.3, 2.8) * (1 - span(t, 5.1, 5.5));
  const look = 0.25 * Math.sin(t * 2.2);
  const fx = name => {
    if (name === 'poca') return { T: affine(mm(rotY(slide * 0.6), scale3(pool, 1, pool)), [0, 0, 0], [at[0], 0, at[2] + 0.1]), alpha: 1 };
    if (name === 'rosto' && face > 0) return { T: affine(mm(rotY(look * face), scale3(1.7, 1, 1.7)), [0, 0, 0], [at[0], 0, at[2] + 0.1]), alpha: face };
    return null;
  };
  g.pose({ body, armR: armPose(1), armL: armPose(-1), legR: legPose(1), legL: legPose(-1) }, fx, { clipY: 0.0 });
  return g.world;
}

// câmera: sobe e se aproxima da poça enquanto ela desliza, depois volta
const camera = t => {
  const k = span(t, 1.6, 2.6) * (1 - span(t, 4.9, 5.7));
  const at = V.lerp(start, end, span(t, 2.6, 4.6));
  return {
    yaw: cam.yaw, pitch: cam.pitch + 0.42 * k, dist: cam.dist - 1.6 * k,
    target: V.lerp(cam.target, [at[0], 0.2, at[2] + 0.2], k)
  };
};

R.film({ name: 'sombra', seconds: 8, fps: 15, frame, camera, preview: [0.5, 1.6, 2.2, 3.0, 3.8, 4.8, 5.8, 7.2] });
