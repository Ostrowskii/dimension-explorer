// Gera scene-data.js a partir de cena.js. Rode dentro desta pasta: node export-scene.js
const fs = require('node:fs');
const path = require('node:path');

const outputPath = path.resolve(__dirname, 'scene-data.js');
// O Ink Studio precisa estar ao lado do dimension-explorer (ou indique o caminho em INK_STUDIO).
const studioRoot = process.env.INK_STUDIO || path.resolve(__dirname, '../../shapeshift-labs-ink-studio');
if (!fs.existsSync(path.join(studioRoot, 'index.js'))) {
  console.error(`Não encontrei o Ink Studio em ${studioRoot}.\nClone https://github.com/siliconjungle/shapeshift-labs-ink-studio ao lado da pasta dimension-explorer.`);
  process.exit(1);
}
const kit = require(path.join(studioRoot, 'index.js')).load();
const scene = require('./cena.js')(kit);
const world = scene.build(scene.seed);
const positions = new Float32Array(world.count * 3);
const colors = new Uint8Array(world.count * 3);
const covariance = new Float32Array(world.count * 6);
const density = new Float32Array(world.count);
const water = new Uint8Array(world.count);
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
  density[index] = world.data[source + 3];
  water[index] = (Math.round(world.data[source + 11]) % 16) === 7 ? 1 : 0;
  if (transparentStart === world.count && density[index] < 1) transparentStart = index;
  for (let component = 0; component < 6; component++) {
    covariance[index * 6 + component] = world.data[source + [4, 5, 6, 8, 9, 10][component]];
  }
}

const encoded = value => Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('base64');
fs.writeFileSync(outputPath, `window.TOWER_SCENE = ${JSON.stringify({
  title: scene.name,
  count: world.count,
  target: world.cam.target,
  distance: world.cam.dist,
  pitch: world.cam.pitch,
  yaw: world.cam.yaw,
  radius: world.radius,
  transparentStart,
  atmosphere: world.atmosphere,
  pond: world.pond || null,
  positions: encoded(positions),
  colors: encoded(colors),
  covariance: encoded(covariance),
  density: encoded(density),
  water: encoded(water)
})};\n`);
console.log(`${world.count} splats gravados em ${path.basename(__dirname)}/scene-data.js — recarregue a página com Ctrl+Shift+R.`);
