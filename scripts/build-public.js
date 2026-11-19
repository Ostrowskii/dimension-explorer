// Monta public/ com as cenas que podem ser publicadas (sem as cenas de fan art).
// A página inicial pública é o index.html da raiz sem o bloco <!-- fanart:start/end -->.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public');
const scenes = ['dist', 'next-scene', 'third-scene', 'fourth-scene'];
const files = ['index.html', 'style.css', 'viewer.js', 'scene-data.js'];
const panelCss = fs.readFileSync(path.join(root, 'panel.css'), 'utf8');
fs.rmSync(out, { recursive: true, force: true });
for (const scene of scenes) {
  fs.mkdirSync(path.join(out, scene), { recursive: true });
  for (const file of files) {
    let data = fs.readFileSync(path.join(root, scene, file));
    if (file === 'index.html') {
      data = data.toString()
        .replace(/\s*<!-- fanart:start -->[\s\S]*?<!-- fanart:end -->/g, '')
        .replace('<a class="brand" href="../index.html">← Dimension Explorer</a>', '<span class="brand">Dimension Explorer</span>')
        .replace(/<link rel="stylesheet" href="\.\.\/panel\.css(\?v=\d+)?" \/>/, `<style>\n${panelCss}</style>`);
    }
    fs.writeFileSync(path.join(out, scene, file), data);
  }
}
fs.copyFileSync(path.join(root, 'explorer.js'), path.join(out, 'explorer.js'));
fs.copyFileSync(path.join(root, 'fourth-scene/orbit.mp4'), path.join(out, 'fourth-scene/orbit.mp4'));
fs.mkdirSync(path.join(out, 'thumbs'));
for (const image of [...scenes, 'como-pontos', 'como-elipses', 'como-modelo']) fs.copyFileSync(path.join(root, 'thumbs', `${image}.png`), path.join(out, 'thumbs', `${image}.png`));

// O publicador de Artifacts adiciona doctype/html/head/body; aqui ficam só título, estilos e conteúdo.
const css = fs.readFileSync(path.join(root, 'home.css'), 'utf8');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/\s*<!-- fanart:start -->[\s\S]*?<!-- fanart:end -->/g, '')
  .replace(/<link rel="stylesheet" href="home\.css(\?v=\d+)?">/, `<style>\n${css}</style>`)
  .replace(/<!doctype html>\s*|<\/?html[^>]*>\s*|<\/?head>\s*|<\/?body>\s*|<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*/gi, '')
  ;
fs.writeFileSync(path.join(out, 'home.html'), home);

// Página do passo a passo: arquivo à parte, com o CSS embutido e links de volta para a página inicial.
const tutorial = fs.readFileSync(path.join(root, 'como-fazer.html'), 'utf8')
  .replace(/\s*<!-- fanart:start -->[\s\S]*?<!-- fanart:end -->/g, '')
  .replace(/<link rel="stylesheet" href="home\.css(\?v=\d+)?">/, `<style>\n${css}</style>`)
  .replace(/href="index\.html/g, 'href="./');
fs.writeFileSync(path.join(out, 'como-fazer.html'), tutorial);
console.log('public/ pronto:', scenes.join(', '));
