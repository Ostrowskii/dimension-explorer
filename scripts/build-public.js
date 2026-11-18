// Monta public/ com as cenas que podem ser publicadas (sem as cenas de fan art).
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public');
const scenes = ['dist', 'next-scene', 'third-scene', 'fourth-scene'];
const files = ['index.html', 'style.css', 'viewer.js', 'scene-data.js'];
fs.rmSync(out, { recursive: true, force: true });
for (const scene of scenes) {
  fs.mkdirSync(path.join(out, scene), { recursive: true });
  for (const file of files) {
    let data = fs.readFileSync(path.join(root, scene, file));
    if (file === 'index.html') {
      data = data.toString().split('\n').filter(line => !/>(Picachu|Pikachu)<\/a>/.test(line)).join('\n');
    }
    fs.writeFileSync(path.join(out, scene, file), data);
  }
}
fs.copyFileSync(path.join(root, 'fourth-scene/orbit.mp4'), path.join(out, 'fourth-scene/orbit.mp4'));
fs.cpSync(path.join(__dirname, 'thumbs'), path.join(out, 'thumbs'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'public-home.html'), path.join(out, 'home.html'));
console.log('public/ pronto:', scenes.join(', '));
