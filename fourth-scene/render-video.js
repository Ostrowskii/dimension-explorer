const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../../shapeshift-labs-ink-studio');
const kit = require(path.join(root, 'index.js')).load();
const scene = require('./scene.js')(kit);
const world = scene.build(scene.seed);
const renderer = require(path.join(root, 'cli/render.js'));
const png = require(path.join(root, 'cli/png.js'));
const framesDir = path.join(__dirname, 'frames-tower');
const preview = process.argv.includes('--preview');
const fps = 15;
const seconds = 12;
const count = preview ? 1 : fps * seconds;
fs.mkdirSync(framesDir, { recursive: true });

console.log(`Scene ready: ${world.count} splats; rendering ${count} frame(s).`);
for (let i = 0; i < count; i++) {
  const progress = preview ? 0 : i / (count - 1);
  const eased = progress * progress * (3 - 2 * progress);
  const yaw = -0.15 + eased * Math.PI * 1.1;
  const pitch = 0.29 + 0.035 * Math.sin(progress * Math.PI);
  const output = path.join(framesDir, `frame-${String(i).padStart(4, '0')}.png`);
  if (fs.existsSync(output)) continue;
  const frame = renderer.render(world, {
    yaw, pitch, target: [0, 3.0, 0], w: 480, h: 270, px: 1, zoom: 0.85,
    colored: false, reflections: true, atmosphere: true
  });
  png.write(output, frame.w, frame.h, frame.rgb);
  if (i % 15 === 0 || i === count - 1) console.log(`Frame ${i + 1}/${count}`);
}

if (!preview) {
  const result = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-framerate', String(fps),
    '-i', path.join(framesDir, 'frame-%04d.png'),
    '-vf', 'scale=960:540:flags=neighbor',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    path.join(__dirname, 'orbit.mp4')
  ], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
  console.log('Video ready: fourth-scene/orbit.mp4');
}
