// Fairy-tale tower, golden tree, sunlight and a reflective pond.
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'tower-golden-tree-pond',
  name: 'Torre, árvore e lago',
  seed: 57,
  build(seed) {
    const B = makeBuilder(seed, [
      0x10202a, 0x25404a, 0x49656a, 0x8fa7a0, 0xd7d2b4, // sky and stone
      0x1e3d2e, 0x315a37, 0x4f7b43, 0x83a650, 0xb8c96a, // foliage and grass
      0x3d2b25, 0x684333, 0xa66b42, 0xcd9458, 0x7a3656, // wood and roof
      0xf0ca72, 0xe9ece2,
      0x102b3b, 0x285b70, 0x5892a2, 0xa9c9c3, 0xf0d987 // pond and reflected sunlight
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
    const pond = { x: 0.75, z: -4.45, rx: 1.15, rz: 1.12 };
    const pondRadius = (x, z) => Math.hypot((x - pond.x) / pond.rx, (z - pond.z) / pond.rz);
    const waterY = height(pond.x, pond.z) + 0.04;
    S.ground(grass, { h: height, rad: 9, zs: 1.15, edge: 0.06, res: 0.14, keep: (x, z) => pondRadius(x, z) > 1.01 });

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

    // An old tree 5/4 as tall as the tower, with a broad, warm crown.
    const tx = -4.05, tz = -0.7, ty = height(tx, tz);
    const treeScale = 1.25;
    const treePoint = (dx, dy, dz) => [tx + dx * treeScale, ty + dy * treeScale, tz + dz * treeScale];
    const bark = { r: [10, 11, 12] };
    const goldLeaves = { r: [12, 13, 13, 15] };
    S.tube([treePoint(0, 0, 0), treePoint(-0.12, 1.5, 0), treePoint(0.1, 3.5, -0.12), treePoint(0.55, 5.4, 0)], 0.52 * treeScale, 0.20 * treeScale, bark, { res: 0.11 });
    for (const [dx, dy, dz, reach] of [
      [-2.1, 5.5, -0.4, 0.23], [-1.25, 6.5, 0.4, 0.25],
      [1.65, 6.0, -0.2, 0.26], [2.3, 5.0, 0.35, 0.20],
      [-0.25, 7.1, -0.45, 0.18]
    ]) {
      S.tube([treePoint(0.05, 3.3, 0), treePoint(dx * 0.55, dy * 0.78, dz * 0.5), treePoint(dx, dy, dz)], 0.20 * treeScale, reach * 0.35 * treeScale, bark, { res: 0.13 });
    }
    for (const [dx, dy, dz, rx, ry, rz] of [
      [-1.9, 5.8, -0.3, 1.15, 0.8, 0.85], [-0.9, 6.55, 0.2, 1.25, 0.85, 0.9],
      [0.35, 6.85, -0.4, 1.25, 0.9, 0.95], [1.5, 6.1, -0.1, 1.15, 0.8, 0.85],
      [2.15, 5.25, 0.35, 0.95, 0.7, 0.75], [-0.45, 7.25, -0.45, 1.1, 0.65, 0.85]
    ]) S.ball(treePoint(dx, dy, dz), [rx * treeScale, ry * treeScale, rz * treeScale], goldLeaves, { res: 0.13 });

    // Parallel sunlight enters through nearby gaps in the crown.
    // S.sun points from the ground toward the sun; shafts travel the opposite way.
    const sunDirection = [-S.sun[0] / S.sun[1], -1, -S.sun[2] / S.sun[1]];
    const sunlightStart = [-0.7, -0.25, 0.25, 0.7].map(dx => treePoint(dx, 6.8, 0.7));
    const shafts = sunlightStart.map(from => {
      let travel = from[1];
      for (let i = 0; i < 3; i++) {
        const x = from[0] + sunDirection[0] * travel;
        const z = from[2] + sunDirection[2] * travel;
        travel = from[1] - height(x, z) - 0.1;
      }
      return [from, [from[0] + sunDirection[0] * travel, from[1] - travel, from[2] + sunDirection[2] * travel]];
    });
    const atmosphere = shafts.map(([from, to]) => K.atmosphere.shaft({ from, to, radius: 0.38, density: 0.18, color: '#f0ca72' }));

    // Low shrubs and small flowers around the clearing.
    for (let i = 0; i < 38; i++) {
      const a = B.R() * Math.PI * 2, r = 1.9 + B.R() * 5.3;
      const x = Math.cos(a) * r, z = Math.sin(a) * r, y = height(x, z);
      if (pondRadius(x, z) < 1.12) continue;
      S.ball([x, y + 0.14, z], [0.19 + B.R() * 0.16, 0.15 + B.R() * 0.15, 0.17 + B.R() * 0.14], leaves, { res: 0.075 });
      if (i % 3 === 0) S.ball([x + 0.06, y + 0.33, z], 0.045, { r: [14, 15] }, { res: 0.045 });
    }

    // A low, irregular stone bank frames the water without crossing the sunlit ground nearby.
    for (let i = 0; i < 74; i++) {
      const angle = i * Math.PI * 2 / 74;
      const x = pond.x + Math.cos(angle) * pond.rx * (1.02 + B.R() * 0.09);
      const z = pond.z + Math.sin(angle) * pond.rz * (1.02 + B.R() * 0.09);
      S.ball([x, height(x, z) + 0.03, z], [0.11 + B.R() * 0.11, 0.05 + B.R() * 0.04, 0.11 + B.R() * 0.12], darkStone, { res: 0.07 });
    }

    S.bake();
    // Ink Studio's mirror copies nearby forms below the water plane in cool tones.
    const reflectionMap = Array.from({ length: 22 }, (_, i) => i >= 12 ? 20 : i >= 5 ? 19 : 18);
    B.mirror(waterY, () => true, reflectionMap, { gap: 2.5, maxH: 10 });
    // The translucent surface lets mirrored splats show through the pond opening.
    for (let z = pond.z - pond.rz; z <= pond.z + pond.rz; z += 0.115) {
      for (let x = pond.x - pond.rx; x <= pond.x + pond.rx; x += 0.115) {
        const edge = pondRadius(x, z);
        if (edge >= 0.99) continue;
        const ripple = Math.sin(x * 12 + z * 5) + Math.sin(z * 14 - x * 3);
        const color = ripple > 1.6 ? 20 : ripple < -1.1 ? 18 : 19;
        B.disc(x, waterY + 0.012, z, B.UP, 0.11, 0.015, B.P[color], 0.58);
      }
    }
    // Soft, translucent splats make the light visible in the air. Add after the solid geometry.
    const lightSamplesPerShaft = 1800;
    for (const [from, to] of shafts) {
      for (let i = 0; i < lightSamplesPerShaft; i++) {
        const t = (i + B.R()) / lightSamplesPerShaft;
        const angle = i * 2.399963229728653 + B.R() * 0.4;
        const radius = Math.sqrt(B.R()) * (0.20 + 0.20 * t);
        const x = from[0] + (to[0] - from[0]) * t + Math.cos(angle) * radius;
        const y = from[1] + (to[1] - from[1]) * t;
        const z = from[2] + (to[2] - from[2]) * t + Math.sin(angle) * radius;
        B.dab(x, y, z, [0, 0, 1], [1, 0, 0], 0.13, 0.13, 0.13, [240, 202, 114], 0.0075 + (1 - t) * 0.0075, { em: true });
      }
    }
    return B.finish({
      cam: { target: [-1.1, 3.4, 0], dist: 22, pitch: 0.18, yaw: 0.08, sway: 0.18 },
      atmosphere,
      detail: 15,
      palName: 'Woodland tower',
      dither: 0.22,
      radius: 12
    });
  }
});
