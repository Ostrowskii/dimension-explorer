// Fairy-tale tower and luminous old tree in a woodland clearing.
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'tower-and-golden-tree',
  name: 'Torre e árvore dourada',
  seed: 57,
  build(seed) {
    const B = makeBuilder(seed, [
      0x10202a, 0x25404a, 0x49656a, 0x8fa7a0, 0xd7d2b4, // sky and stone
      0x1e3d2e, 0x315a37, 0x4f7b43, 0x83a650, 0xb8c96a, // foliage and grass
      0x3d2b25, 0x684333, 0xa66b42, 0xcd9458, 0x7a3656, // wood and roof
      0xf0ca72, 0xe9ece2
    ]);
    const S = K.sculpt(makeSculpt(B));
    const grass = { r: [6, 7, 8, 9] };
    const stone = { r: [2, 3, 4, 4] };
    const darkStone = { r: [1, 2, 3] };
    const roof = { r: [12, 13, 14] };
    const trunk = { r: [10, 11, 12] };
    const leaves = { r: [6, 7, 8, 9] };

    const height = (x, z) => {
      const hill = 0.18 * Math.sin(x * 0.55) * Math.cos(z * 0.42);
      const clearing = Math.exp(-(x * x + z * z) / 18) * 0.12;
      return hill - clearing - 0.12;
    };
    S.ground(grass, { h: height, rad: 9, zs: 1.15, edge: 0.06, res: 0.14 });

    // Tower: a tapered stone body with a broad base, two decorative rings and a pointed roof.
    S.lathe([0, height(0, 0), 0], 5.5, t => 1.38 - t * 0.22 + 0.035 * Math.sin(t * 15), stone, { res: 0.09 });
    S.lathe([0, height(0, 0) - 0.06, 0], 0.38, [1.62, 1.48], darkStone, { res: 0.08 });
    S.lathe([0, height(0, 0) + 2.15, 0], 0.18, [1.3, 1.43], darkStone, { res: 0.07 });
    S.lathe([0, height(0, 0) + 5.34, 0], 0.3, [1.2, 1.38], darkStone, { res: 0.07 });
    S.lathe([0, height(0, 0) + 5.58, 0], 2.25, t => 1.52 * (1 - t) + 0.08, roof, { res: 0.075 });
    S.ball([0, height(0, 0) + 7.9, 0], 0.12, { r: [15, 16], em: true }, { res: 0.05 });

    // Door and warm windows face the camera (positive z).
    S.box([0, height(0, 0) + 0.74, 1.3], [0.43, 0.74, 0.055], trunk, { rd: 0.18, res: 0.06 });
    for (const [x, y] of [[-0.72, 2.35], [0.72, 2.35], [0, 4.05]]) {
      S.box([x, height(0, 0) + y, 1.17], [0.22, 0.36, 0.055], { r: [15, 16], em: true }, { rd: 0.12, res: 0.055 });
      S.box([x, height(0, 0) + y, 1.24], [0.27, 0.42, 0.04], darkStone, { rd: 0.14, res: 0.055 });
      S.box([x, height(0, 0) + y, 1.3], [0.17, 0.31, 0.035], { r: [15, 16], em: true }, { rd: 0.1, res: 0.05 });
    }

    // A winding path and scattered stones lead to the entrance.
    for (let i = 0; i < 13; i++) {
      const z = 1.7 + i * 0.48;
      const x = Math.sin(i * 0.82) * 0.24;
      S.ball([x, height(x, z) + 0.035, z], [0.38, 0.055, 0.29], { r: [4, 4, 3] }, { res: 0.07 });
    }
    for (let i = 0; i < 23; i++) {
      const a = B.R() * Math.PI * 2, r = 2.1 + B.R() * 5.7;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      S.ball([x, height(x, z) + 0.08, z], [0.12 + B.R() * 0.18, 0.09 + B.R() * 0.1, 0.12 + B.R() * 0.16], darkStone, { res: 0.065 });
    }

    // Trees frame the clearing, leaving the tower readable from the chosen camera.
    const trees = [[-5.3, 1.2, 1.25], [-4.3, -3.8, 1.0], [4.8, -3.5, 1.15], [5.6, 1.8, 1.3], [-2.9, 5.6, 0.9], [3.5, 5.2, 1.0]];
    for (const [x, z, scale] of trees) {
      const y = height(x, z);
      S.lathe([x, y, z], 1.65 * scale, [0.16 * scale, 0.11 * scale], trunk, { res: 0.075 });
      S.ball([x, y + 1.75 * scale, z], [0.8 * scale, 1.05 * scale, 0.76 * scale], leaves, { res: 0.1 });
      S.ball([x - 0.32 * scale, y + 1.45 * scale, z + 0.18], [0.58 * scale, 0.7 * scale, 0.55 * scale], leaves, { res: 0.1 });
      S.ball([x + 0.38 * scale, y + 1.55 * scale, z - 0.12], [0.54 * scale, 0.72 * scale, 0.56 * scale], leaves, { res: 0.1 });
    }

    // An old tree as tall as the tower, with a broad, warm crown.
    const tx = -4.05, tz = -0.7, ty = height(tx, tz);
    const bark = { r: [10, 11, 12] };
    const goldLeaves = { r: [12, 13, 13, 15] };
    S.tube([[tx, ty, tz], [tx - 0.12, ty + 1.5, tz], [tx + 0.1, ty + 3.5, tz - 0.12], [tx + 0.55, ty + 5.4, tz]], 0.52, 0.20, bark, { res: 0.1 });
    for (const [dx, dy, dz, reach] of [
      [-2.1, 5.5, -0.4, 0.23], [-1.25, 6.5, 0.4, 0.25],
      [1.65, 6.0, -0.2, 0.26], [2.3, 5.0, 0.35, 0.20],
      [-0.25, 7.1, -0.45, 0.18]
    ]) {
      S.tube([[tx + 0.05, ty + 3.3, tz], [tx + dx * 0.55, ty + dy * 0.78, tz + dz * 0.5], [tx + dx, ty + dy, tz + dz]], 0.20, reach * 0.35, bark, { res: 0.12 });
    }
    for (const [dx, dy, dz, rx, ry, rz] of [
      [-1.9, 5.8, -0.3, 1.15, 0.8, 0.85], [-0.9, 6.55, 0.2, 1.25, 0.85, 0.9],
      [0.35, 6.85, -0.4, 1.25, 0.9, 0.95], [1.5, 6.1, -0.1, 1.15, 0.8, 0.85],
      [2.15, 5.25, 0.35, 0.95, 0.7, 0.75], [-0.45, 7.25, -0.45, 1.1, 0.65, 0.85]
    ]) S.ball([tx + dx, ty + dy, tz + dz], [rx, ry, rz], goldLeaves, { res: 0.12 });

    // Light shafts pass through the branches and land on the flowered clearing.
    const shafts = [
      [[tx + 0.4, ty + 6.25, tz + 0.6], [-1.9, height(-1.9, 2.7) + 0.1, 2.7]],
      [[tx + 1.1, ty + 5.9, tz + 0.8], [-0.8, height(-0.8, 3.3) + 0.1, 3.3]],
      [[tx - 0.8, ty + 6.3, tz + 0.7], [-3.1, height(-3.1, 3.7) + 0.1, 3.7]],
      [[tx + 1.7, ty + 5.25, tz + 0.6], [0.0, height(0, 4.2) + 0.1, 4.2]]
    ];
    for (const [start, end] of shafts) {
      for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * 0.11;
        S.tube(
          [[start[0] + offset, start[1], start[2]], [end[0] + offset * 1.8, end[1], end[2]]],
          0.018, 0.035, { r: [13, 15, 15], em: true }, { res: 0.11 }
        );
      }
      S.ball(end, [0.28, 0.035, 0.28], { r: [13, 15], em: true }, { res: 0.09 });
    }

    // Low shrubs and small flowers around the clearing.
    for (let i = 0; i < 38; i++) {
      const a = B.R() * Math.PI * 2, r = 1.9 + B.R() * 5.3;
      const x = Math.cos(a) * r, z = Math.sin(a) * r, y = height(x, z);
      S.ball([x, y + 0.14, z], [0.19 + B.R() * 0.16, 0.15 + B.R() * 0.15, 0.17 + B.R() * 0.14], leaves, { res: 0.075 });
      if (i % 3 === 0) S.ball([x + 0.06, y + 0.33, z], 0.045, { r: [14, 15] }, { res: 0.045 });
    }

    S.bake();
    return B.finish({
      cam: { target: [-0.9, 2.9, 0], dist: 20, pitch: 0.18, yaw: 0.08, sway: 0.18 },
      detail: 15,
      palName: 'Woodland tower',
      dither: 0.22,
      radius: 12
    });
  }
});
