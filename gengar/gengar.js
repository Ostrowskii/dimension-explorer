// Gengar sculpted as pixel-art Gaussian splats. Render with:
// node ../../shapeshift-labs-ink-studio/cli/ink-studio.js render gengar.js --out gengar.png
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'gengar',
  name: 'Gengar',
  seed: 94,
  build(seed) {
    const B = makeBuilder(seed, [
      0x0c0a14,                                         // 0 background
      0x241a3a, 0x3b2a5e, 0x55408a, 0x7158ad, 0x9078c8, // 1-5 purple skin
      0x5a0f1a, 0xc8203a, 0xff5a66,                     // 6-8 eye reds
      0xf2f0ea, 0x14101c,                               // 9 teeth, 10 mouth line
      0x1c2a24, 0x2b3d33, 0x3e5446,                     // 11-13 ground
      0x3a3546, 0x5c566a                                // 14-15 stones
    ]);
    const S = K.sculpt(makeSculpt(B));
    const C = [0, 1.35, 0];

    // Face painted onto the front of the body (camera looks from +z).
    const face = (x, y, z) => {
      if (z < 0.35) return undefined;
      const u = Math.abs(x), v = y - C[1];
      // Eyes: angry slanted tops (lower toward the middle), rounded bottoms.
      if (u > 0.14 && u < 0.78) {
        const top = 0.30 + ((u - 0.14) / 0.64) * 0.34;
        const bottom = 0.10 + 1.1 * (u - 0.48) * (u - 0.48);
        if (v < top && v > bottom) {
          if (Math.hypot(u - 0.36, v - 0.25) < 0.06) return 10; // pupil
          if (v > top - 0.04 || v < bottom + 0.035) return 6;    // dark rim
          return v > 0.4 && u > 0.5 ? 8 : 7;
        }
      }
      // Wide grin full of teeth.
      if (u < 0.86) {
        const upper = -0.10 + 0.34 * x * x;
        const lower = -0.46 + 0.56 * x * x;
        if (v < upper && v > lower) {
          if (v > upper - 0.03 || v < lower + 0.03) return 10;
          const mid = (upper + lower) / 2;
          if (Math.abs(v - mid) < 0.02) return 10;
          if (Math.abs(((x + 2.14) % 0.28) - 0.14) < 0.016) return 10;
          return 9;
        }
      }
      return undefined;
    };
    const skin = { r: [1, 2, 3, 4, 5], tex: face };
    const plain = { r: [1, 2, 3, 4, 5] };
    const claw = { r: [3, 4, 5] };
    const mirror = (fn) => { fn(1); fn(-1); };

    S.ground({ r: [11, 12, 13] }, { h: (x, z) => 0.04 * Math.sin(x * 1.3) * Math.cos(z * 1.1), rad: 4.6, zs: 1, edge: 0.06, res: 0.1 });
    for (let i = 0; i < 9; i++) {
      const a = B.R() * Math.PI * 2, r = 2.3 + B.R() * 1.8;
      S.ball([Math.cos(a) * r, 0.05, Math.sin(a) * r], [0.14 + B.R() * 0.2, 0.08 + B.R() * 0.12, 0.14 + B.R() * 0.18], { r: [0, 14, 15] }, { res: 0.06 });
    }

    // Round body.
    S.ball(C, [1.25, 1.1, 1.05], skin, { res: 0.045 });

    // Pointed ears.
    mirror(s => S.tube([[s * 0.72, 2.05, -0.05], [s * 1.0, 2.55, -0.12], [s * 1.28, 3.0, -0.2]], 0.34, 0.02, plain, { res: 0.05 }));

    // Spikes running down the back.
    const spikes = [
      [[0, 2.3, -0.4], [0, 2.95, -0.95]],
      [[0.42, 2.15, -0.5], [0.6, 2.65, -1.2]],
      [[-0.42, 2.15, -0.5], [-0.6, 2.65, -1.2]],
      [[0, 1.95, -0.8], [0, 2.3, -1.65]],
      [[0.6, 1.7, -0.75], [0.9, 1.95, -1.5]],
      [[-0.6, 1.7, -0.75], [-0.9, 1.95, -1.5]],
      [[0, 1.45, -0.95], [0, 1.55, -1.75]]
    ];
    for (const [a, b] of spikes) S.tube([a, b], 0.26, 0.02, plain, { res: 0.05 });

    // Stubby arms with three pointed fingers.
    mirror(s => {
      S.tube([[s * 1.0, 1.25, 0.2], [s * 1.35, 1.12, 0.42], [s * 1.6, 1.0, 0.6]], 0.25, 0.18, plain, { res: 0.05 });
      S.ball([s * 1.64, 0.98, 0.64], 0.2, plain, { res: 0.045 });
      for (const [dx, dy, dz] of [[0.28, 0.05, 0.12], [0.22, -0.1, 0.25], [0.12, -0.2, 0.3]]) {
        S.tube([[s * 1.7, 0.98, 0.66], [s * (1.7 + dx), 0.98 + dy, 0.66 + dz]], 0.075, 0.01, claw, { res: 0.035 });
      }
    });

    // Short legs and wide feet with claws.
    mirror(s => {
      S.tube([[s * 0.55, 0.55, 0.1], [s * 0.66, 0.15, 0.28]], 0.3, 0.27, plain, { res: 0.05 });
      S.ball([s * 0.68, 0.13, 0.42], [0.34, 0.15, 0.4], plain, { res: 0.045 });
      for (const dx of [-0.16, 0, 0.16]) {
        S.tube([[s * 0.68 + dx, 0.12, 0.72], [s * 0.68 + dx * 1.3, 0.06, 0.92]], 0.065, 0.01, claw, { res: 0.035 });
      }
    });

    // Little curled tail.
    S.tube([[0, 0.55, -0.9], [0.18, 0.62, -1.3], [0.42, 0.85, -1.5]], 0.17, 0.02, plain, { res: 0.05 });

    S.bake();
    return B.finish({
      cam: { target: [0, 1.45, 0], dist: 8.4, pitch: 0.2, yaw: 0.3 },
      detail: 15,
      palName: 'Ghost',
      dither: 0.2,
      radius: 5
    });
  }
});
