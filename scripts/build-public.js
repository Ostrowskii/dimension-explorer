// Monta public/ com as cenas que podem ser publicadas (sem as cenas de fan art).
// A página inicial pública é o index.html da raiz sem o bloco <!-- fanart:start/end -->.
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
fs.mkdirSync(path.join(out, 'thumbs'));
for (const scene of scenes) fs.copyFileSync(path.join(root, 'thumbs', `${scene}.png`), path.join(out, 'thumbs', `${scene}.png`));

// O publicador de Artifacts adiciona doctype/html/head/body; aqui ficam só título, estilos e conteúdo.
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/\s*<!-- fanart:start -->[\s\S]*?<!-- fanart:end -->/, '')
  .replace(/<!doctype html>\s*|<\/?html[^>]*>\s*|<\/?head>\s*|<\/?body>\s*|<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*/gi, '')
  .replace('Cenas 3D em pixel-art', 'Quatro cenas 3D em pixel-art');
fs.writeFileSync(path.join(out, 'home.html'), home);
console.log('public/ pronto:', scenes.join(', '));
