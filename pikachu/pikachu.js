// Gengar, detailed version: smooth blended body, interlocking teeth, glossy eyes
// and a deliberately plain floor. Render with:
// node ../../shapeshift-labs-ink-studio/cli/ink-studio.js render pikachu.js --out pikachu.png --w 900 --h 900
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'pikachu',
  name: 'Pikachu',
  seed: 94,
  build(seed) {
    const B = makeBuilder(seed, [
      0x0c0a14,                                         // 0 background
      0x1f1633, 0x342655, 0x4c3a80, 0x6650a2, 0x8169bf, // 1-5 purple skin
      0x5a0f1a, 0xb01a32, 0xe0303f, 0xff6b72,           // 6-9 eye reds
      0xf2f0ea, 0xc9c3d6,                               // 10-11 teeth (lit, shaded)
      0x120c1c,                                         // 12 mouth / outline
      0x23262e, 0x2c3039,                               // 13-14 plain floor
      0xa892de, 0xffffff                                // 15 skin gloss, 16 eye glint
    ]);
    const S = K.sculpt(makeSculpt(B));
    const C = [0, 1.35, 0];
    const H = { hold: true };

    // Everything above the body front (z > 0.35) gets the painted face.
    const face = (x, y, z) => {
      if (z < 0.35) return undefined;
      const u = Math.abs(x), v = y - C[1];

      // Eyes: angry slanted tops, rounded bottoms, dark outline, glint.
      if (u > 0.12 && u < 0.8) {
        const top = 0.31 + ((u - 0.12) / 0.68) * 0.34;
        const bottom = 0.09 + 1.05 * (u - 0.48) * (u - 0.48);
        if (v < top + 0.035 && v > bottom - 0.03) {
          const inside = v < top && v > bottom;
          if (!inside) return 12;                                   // outline
          if (Math.hypot(u - 0.56, v - 0.47) < 0.035) return 16;    // glint
          const pupil = Math.hypot((u - 0.36) * 1.15, v - 0.25);
          if (pupil < 0.05) return 12;                              // pupil
          if (pupil < 0.075) return 6;                              // pupil ring
          if (v > top - 0.045) return 6;                            // brow shadow
          const lift = (v - bottom) / Math.max(0.01, top - bottom);
          return lift > 0.62 ? 9 : lift > 0.3 ? 8 : 7;
        }
      }

      // Grin: interlocking triangular teeth over a dark mouth.
      if (u < 0.9) {
        const upper = -0.09 + 0.33 * x * x;
        const lower = -0.47 + 0.57 * x * x;
        if (v < upper + 0.028 && v > lower - 0.028) {
          if (v > upper || v < lower) return 12;                    // lips
          const mid = (upper + lower) / 2, half = (upper - lower) / 2;
          const w = 0.13;
          const fu = (((x + 10) % w) + w) % w / w;
          const fl = (((x + 10 + w / 2) % w) + w) % w / w;
          const triU = 1 - Math.abs(2 * fu - 1), triL = 1 - Math.abs(2 * fl - 1);
          const shade = u > 0.55 ? 11 : 10;
          if (v > upper - half * (0.2 + 0.95 * triU)) return Math.abs(fu - 0.5) > 0.46 ? 12 : shade;
          if (v < lower + half * (0.2 + 0.95 * triL)) return Math.abs(fl - 0.5) > 0.46 ? 12 : shade;
          return v > mid ? 12 : 6;                                   // throat
        }
      }
      return undefined;
    };
    const skinMod = (x, y, z) => 0.1 * (B.n3(x * 2.2, y * 2.2, z * 2.2) - 0.5);
    const skin = { r: [1, 2, 3, 4, 5], mod: skinMod, tex: face, gloss: { c: 15, at: 0.997 } };
    const claw = { r: [3, 4, 5] };
    const mirror = fn => [fn(1), fn(-1)];

    // Plain floor: a flat, quiet disc so the eye stays on Gengar.
    S.ground({ r: [13, 14] }, { h: () => 0, rad: 3.6, zs: 1, edge: 0.04, res: 0.16 });

    const body = S.ball(C, [1.25, 1.1, 1.05], skin, H);
    const parts = [];

    // Pointed ears, slightly curved outward.
    mirror(s => parts.push(S.tube([[s * 0.7, 2.0, -0.05], [s * 0.98, 2.5, -0.1], [s * 1.2, 2.82, -0.16], [s * 1.36, 3.08, -0.22]], 0.36, 0.015, skin, H)));

    // Back spikes: large crest plus smaller spikes between them.
    const spikes = [
      [[0, 2.28, -0.38], [0, 2.7, -0.7], [0, 3.0, -1.0], 0.27],
      [[0.42, 2.15, -0.5], [0.52, 2.45, -0.85], [0.66, 2.7, -1.25], 0.25],
      [[-0.42, 2.15, -0.5], [-0.52, 2.45, -0.85], [-0.66, 2.7, -1.25], 0.25],
      [[0, 1.95, -0.8], [0, 2.15, -1.2], [0, 2.32, -1.72], 0.27],
      [[0.62, 1.72, -0.72], [0.78, 1.85, -1.1], [0.95, 1.98, -1.55], 0.24],
      [[-0.62, 1.72, -0.72], [-0.78, 1.85, -1.1], [-0.95, 1.98, -1.55], 0.24],
      [[0, 1.45, -0.95], [0, 1.5, -1.35], [0, 1.58, -1.82], 0.25],
      [[0.75, 2.0, -0.35], [0.9, 2.2, -0.6], [1.02, 2.38, -0.85], 0.16],
      [[-0.75, 2.0, -0.35], [-0.9, 2.2, -0.6], [-1.02, 2.38, -0.85], 0.16],
      [[0.36, 1.85, -0.85], [0.44, 2.0, -1.2], [0.52, 2.1, -1.48], 0.15],
      [[-0.36, 1.85, -0.85], [-0.44, 2.0, -1.2], [-0.52, 2.1, -1.48], 0.15],
      [[0.55, 1.35, -0.85], [0.68, 1.36, -1.2], [0.8, 1.4, -1.5], 0.16],
      [[-0.55, 1.35, -0.85], [-0.68, 1.36, -1.2], [-0.8, 1.4, -1.5], 0.16]
    ];
    for (const [a, b, c, r] of spikes) parts.push(S.tube([a, b, c], r, 0.012, skin, H));

    // Arms, hands and three fingers each.
    const fingerTips = [];
    mirror(s => {
      parts.push(S.tube([[s * 0.95, 1.28, 0.18], [s * 1.32, 1.14, 0.4], [s * 1.58, 1.0, 0.58]], 0.27, 0.19, skin, H));
      parts.push(S.ball([s * 1.64, 0.98, 0.64], [0.22, 0.19, 0.2], skin, H));
      for (const [dx, dy, dz] of [[0.26, 0.07, 0.1], [0.24, -0.06, 0.24], [0.13, -0.17, 0.3]]) {
        const base = [s * 1.7, 0.98, 0.66], tip = [s * (1.7 + dx), 0.98 + dy, 0.66 + dz];
        parts.push(S.tube([base, tip], 0.085, 0.06, skin, H));
        fingerTips.push([tip, [s * (1.7 + dx * 1.45), 0.98 + dy * 1.45, 0.66 + dz * 1.45]]);
      }
    });

    // Legs, wide feet and three toes each.
    const toeTips = [];
    mirror(s => {
      parts.push(S.tube([[s * 0.52, 0.6, 0.05], [s * 0.6, 0.35, 0.16], [s * 0.66, 0.16, 0.28]], 0.32, 0.27, skin, H));
      parts.push(S.ball([s * 0.68, 0.14, 0.42], [0.35, 0.15, 0.4], skin, H));
      for (const dx of [-0.17, 0, 0.17]) {
        const toe = [s * 0.68 + dx, 0.12, 0.74];
        parts.push(S.ball(toe, [0.09, 0.08, 0.1], skin, H));
        toeTips.push([[toe[0], 0.1, 0.8], [s * 0.68 + dx * 1.25, 0.05, 0.98]]);
      }
    });

    // Curled tail.
    parts.push(S.tube([[0, 0.55, -0.88], [0.14, 0.6, -1.25], [0.38, 0.78, -1.48], [0.6, 1.02, -1.5]], 0.19, 0.015, skin, H));

    // One smooth, rounded solid: the limbs flow into the body instead of being stuck on.
    S.join('round', body, parts, { r: 0.14, res: 0.026 });

    // Small sharp claws stay separate so their points remain crisp.
    for (const [a, b] of fingerTips.concat(toeTips)) S.tube([a, b], 0.055, 0.006, claw, { res: 0.022 });

    S.bake();
    return B.finish({
      cam: { target: [0, 1.45, 0], dist: 8.0, pitch: 0.2, yaw: 0.3 },
      detail: 18,
      palName: 'Ghost detail',
      dither: 0.15,
      radius: 4.5
    });
  }
});
