const fs = require('node:fs');
const path = require('node:path');

const outputPath = path.resolve(__dirname, 'scene-data.js');

const studioRoot = path.resolve(__dirname, '../../shapeshift-labs-ink-studio');
const kit = require(path.join(studioRoot, 'index.js')).load();
const scene = require('./pond-garden.js')(kit);
const world = scene.build(scene.seed);
const positions = new Float32Array(world.count * 3);
const colors = new Uint8Array(world.count * 3);
const sizes = new Float32Array(world.count);
const covariance = new Float32Array(world.count * 6);
const density = new Float32Array(world.count);
let transparentStart = world.count;

for (let index = 0; index < world.count; index++) {
  const source = index * 16;
  const target = index * 3;
  positions[target] = world.data[source];
  positions[target + 1] = world.data[source + 1];
  positions[target + 2] = world.data[source + 2];
  const packed = world.data[source + 7] | 0;
  colors[target] = packed & 255;
  colors[target + 1] = (packed >>> 8) & 255;
  colors[target + 2] = (packed >>> 16) & 255;
  sizes[index] = Math.max(0.025, Math.sqrt(Math.abs(world.data[source + 4]) + Math.abs(world.data[source + 8]) + Math.abs(world.data[source + 10])));
  density[index] = world.data[source + 3];
  if (transparentStart === world.count && density[index] < 1) transparentStart = index;
  for (let component = 0; component < 6; component++) {
    covariance[index * 6 + component] = world.data[source + [4, 5, 6, 8, 9, 10][component]];
  }
}

const encoded = value => Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('base64');
const output = `window.TOWER_SCENE = ${JSON.stringify({
  title: scene.name,
  count: world.count,
  target: world.cam.target,
  distance: world.cam.dist,
  radius: world.radius,
  transparentStart,
  atmosphere: world.atmosphere,
  positions: encoded(positions),
  colors: encoded(colors),
  sizes: encoded(sizes),
  covariance: encoded(covariance),
  density: encoded(density)
})};\n`;
fs.writeFileSync(outputPath, output);
console.log(`Exported ${world.count} splats to third-scene/scene-data.js`);
