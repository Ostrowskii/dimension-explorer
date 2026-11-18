// Pikachu de verdade — esculpido em splats como o Gengar detalhado:
// corpo, cabeça, orelhas, braços, pés e rabo fundidos num sólido só; rosto, bochechas,
// pontas das orelhas, listras e base do rabo pintados na superfície (tex).
// node export-scene.js  → scene-data.js para o Dimension Explorer
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'pikachu-de-verdade',
  name: 'Pikachu de verdade',
  seed: 25,
  build(seed) {
    const B = makeBuilder(seed, [
      0x0b171e,                                         // 0 fundo
      0x7a4e0e, 0xb98012, 0xe8b51f, 0xfad53c, 0xffeb85, // 1-5 amarelo
      0x15110c, 0xffffff,                               // 6 preto, 7 branco
      0xc22a24, 0xe8483a,                               // 8-9 bochechas
      0x6b3f16, 0x95602a,                               // 10-11 marrom
      0x1f3d2b, 0x2f5a37, 0x4f7b43, 0x83a650,           // 12-15 grama
      0xfff6c8, 0x3a2a1c                                // 16 brilho, 17 boca
    ]);
    const S = K.sculpt(makeSculpt(B));
    const H = { hold: true };
    const HEAD = [0, 1.78, 0.05];
    const TAIL = [0.2, 0.7, -0.48];

    // Tudo o que é pintado, decidido pela posição de cada ponto da superfície.
    const paint = (x, y, z) => {
      // pontas pretas das orelhas
      if (y > 2.86 && Math.abs(x) > 0.55) return 6;
      // base marrom do rabo
      if (Math.hypot(x - TAIL[0], y - TAIL[1], z - TAIL[2]) < 0.34 && z < -0.35) return 10;
      // duas listras marrons nas costas
      if (z < -0.3 && Math.abs(x) < 0.42 && ((y > 0.86 && y < 0.98) || (y > 1.12 && y < 1.22))) return 11;
      const u = x - HEAD[0], v = y - HEAD[1], w = z - HEAD[2];
      if (w < 0.15) return undefined;
      const au = Math.abs(u);
      // bochechas vermelhas
      const cheek = Math.hypot(au - 0.43, (v + 0.09) * 1.1);
      if (cheek < 0.135 && w > 0.12) return cheek < 0.1 ? 9 : 8;
      if (w < 0.3) return undefined;
      // olhos: pretos, um pouco mais altos que largos, com brilho branco
      const eye = Math.hypot(au - 0.25, (v - 0.09) * 0.85);
      if (eye < 0.105) {
        // brilho no alto, à esquerda de cada olho (como visto de frente)
        if (Math.hypot(u - (Math.sign(u) * 0.25 - 0.035), v - 0.135) < 0.042) return 7;
        return 6;
      }
      // nariz
      if (Math.hypot(u, (v + 0.02) * 1.3) < 0.026) return 6;
      // boca em "ω": dois arquinhos embaixo do nariz
      if (v < -0.055 && v > -0.16 && au < 0.15) {
        const arc = Math.hypot(au - 0.07, v + 0.06);
        if (Math.abs(arc - 0.065) < 0.014) return 17;
      }
      return undefined;
    };
    const skinMod = (x, y, z) => 0.06 * (B.n3(x * 2.5, y * 2.5, z * 2.5) - 0.5);
    const fur = { r: [1, 2, 3, 4, 5], mod: skinMod, tex: paint, gloss: { c: 16, at: 0.996 } };
    const mirror = fn => [fn(1), fn(-1)];

    // chão de grama com relevo suave
    S.ground({ r: [12, 13, 14, 15] }, { h: (x, z) => 0.04 * Math.sin(x * 1.5) * Math.cos(z * 1.3), rad: 3.1, res: 0.1 });
    for (let i = 0; i < 16; i++) {
      const a = B.R() * Math.PI * 2, r = 1.3 + B.R() * 1.5;
      S.ball([Math.cos(a) * r, 0.1, Math.sin(a) * r], [0.16, 0.14, 0.16], { r: [12, 13, 14, 15] }, { res: 0.06 });
      if (i % 3 === 0) S.ball([Math.cos(a) * r + 0.1, 0.27, Math.sin(a) * r], 0.045, { r: [8, 9], em: true }, { res: 0.03 });
    }

    // corpo em forma de pera e cabeça grande e larga
    const body = S.ball([0, 0.92, 0], [0.62, 0.7, 0.55], fur, H);
    const parts = [S.ball(HEAD, [0.66, 0.58, 0.56], fur, H)];

    // orelhas longas e pontudas
    mirror(s => parts.push(S.tube([[s * 0.3, 2.18, 0], [s * 0.58, 2.7, -0.04], [s * 0.86, 3.2, -0.1]], 0.2, 0.015, fur, H)));

    // bracinhos curtos e pés compridos
    mirror(s => {
      parts.push(S.tube([[s * 0.48, 1.16, 0.18], [s * 0.56, 1.02, 0.42]], 0.13, 0.1, fur, H));
      parts.push(S.ball([s * 0.55, 1.0, 0.48], [0.11, 0.1, 0.11], fur, H));
      parts.push(S.ball([s * 0.32, 0.12, 0.22], [0.17, 0.11, 0.27], fur, H));
    });

    // rabo em forma de raio: um contorno 2D extrudado, de pé, saindo das costas para trás e para o lado
    const back = [0.66, 0, -0.75], up = [0, 1, 0];
    const side = [up[1] * back[2] - up[2] * back[1], up[2] * back[0] - up[0] * back[2], up[0] * back[1] - up[1] * back[0]];
    const bolt = [[[0, 0], [0.2, 0], [0.28, 0.4], [0.55, 0.36], [0.66, 0.86], [1.1, 0.8], [1.25, 1.6], [0.8, 1.66], [0.72, 1.1], [0.42, 1.14], [0.34, 0.64], [0.1, 0.68]].map(([a, b]) => [a * 1.35, b * 1.35])];
    parts.push(S.extrude(bolt, TAIL, 0.11, fur, Object.assign({ ax: [back, up, side] }, H)));

    S.join('round', body, parts, { r: 0.1, res: 0.026 });
    S.bake();
    return B.finish({
      cam: { target: [0.25, 1.55, 0], dist: 7.4, pitch: 0.16, yaw: 0.3 },
      detail: 18,
      dither: 0.15,
      radius: 3.5
    });
  }
});
