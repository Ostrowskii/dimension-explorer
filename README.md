# Dimension Explorer

Cenas 3D em pixel-art que você gira com o mouse no navegador. Cada cena é escrita em JavaScript, vira uma nuvem de **Gaussian splats** (manchas 3D com posição, cor, forma e orientação) e é desenhada por um visualizador WebGL próprio, sem bibliotecas e sem internet.

As cenas são geradas com o motor procedural **[Ink Studio](https://github.com/siliconjungle/shapeshift-labs-ink-studio)** (licença MIT). Ele não é IA generativa: você descreve formas, cores e luz em código, e ele calcula os splats.

**Ver online:** https://ostrowskii.github.io/dimension-explorer/

## Cenas

| Pasta | Projeto | O que tem |
|---|---|---|
| `dist/` | Torre | Torre de pedra com telhado, jardim, árvores e caminho |
| `next-scene/` | Árvore | A torre + uma árvore dourada 5/4 mais alta, com feixes de sol |
| `third-scene/` | Lago | Tudo acima + um lago com reflexo planar em tempo real |
| `fourth-scene/` | Filme | Versão mais detalhada + vídeo `orbit.mp4` com a câmera girando |
| `picachu/` | Picachu | Gengar (primeira versão), com chão de grama |
| `pikachu/` | Pikachu | Gengar detalhado, com chão liso |

Os dois Gengar ficam numa tela própria, `gengar.html`, separada da página inicial.

Torre, Árvore e Lago estão **congeladas**: o `export-scene.js` delas se recusa a sobrescrever os dados.

## Como abrir

Abra `index.html` (a página com todos os projetos) no Chrome. Se aparecer "Não foi possível iniciar o WebGL", force o WebGL por software:

```bash
google-chrome \
  --user-data-dir=/tmp/dimension-explorer-webgl \
  --enable-webgl --ignore-gpu-blocklist --use-angle=swiftshader \
  file://$PWD/index.html
```

Controles: arrastar = girar · roda = zoom · botão direito = mover o foco.

## Passo a passo para criar uma cena nova

### 1. Prepare as duas pastas lado a lado

```text
www/
├── shapeshift-labs-ink-studio/   ← o motor (git clone do link acima)
└── dimension-explorer/           ← este projeto
```

Precisa de **Node 18+**. O Ink Studio não tem dependências npm. Para gerar vídeo, também precisa do **ffmpeg**.

```bash
git clone https://github.com/siliconjungle/shapeshift-labs-ink-studio
cd shapeshift-labs-ink-studio && node cli/ink-studio.js scenes   # teste rápido
```

### 2. Crie a pasta da cena a partir da mais parecida

Nunca edite uma cena congelada; copie-a. Para um objeto isolado, a melhor base é `pikachu/`; para cenário com torre/lago, `fourth-scene/`.

```bash
cd dimension-explorer
mkdir minha-cena
cp pikachu/viewer.js pikachu/style.css pikachu/export-scene.js pikachu/index.html minha-cena/
cp pikachu/pikachu.js minha-cena/minha-cena.js
```

No `export-scene.js`, troque `./pikachu.js` por `./minha-cena.js` e o texto `pikachu/scene-data.js` por `minha-cena/scene-data.js`.

### 3. Escreva a cena

Uma cena é um módulo que recebe o kit do Ink Studio e devolve um `build(seed)`:

```js
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'minha-cena',
  name: 'Minha cena',
  seed: 1,
  build(seed) {
    // 1. Paleta: cada material escolhe índices desta lista (escuro → claro)
    const B = makeBuilder(seed, [0x0c0a14, 0x2b3d33, 0x4f7b43, 0x83a650, 0x8fa7a0, 0xd7d2b4]);
    const S = K.sculpt(makeSculpt(B));
    const grama = { r: [1, 2, 3] };
    const pedra = { r: [4, 5] };

    // 2. Formas
    S.ground(grama, { h: () => 0, rad: 4, res: 0.14 });          // chão
    S.lathe([0, 0, 0], 3, [0.8, 0.6], pedra, { res: 0.08 });     // coluna girada em torno do eixo Y
    S.ball([0, 3.3, 0], 0.5, pedra, { res: 0.06 });              // esfera (ou elipse: [rx, ry, rz])
    S.tube([[1, 0, 0], [1.5, 1, 0]], 0.2, 0.02, pedra, { res: 0.05 }); // tubo que afina (chifres, espinhos)

    // 3. Transforma as formas em splats
    S.bake();

    // 4. Câmera inicial
    return B.finish({ cam: { target: [0, 1.5, 0], dist: 9, pitch: 0.2, yaw: 0.3 }, detail: 15, radius: 5 });
  }
});
```

Dicas que funcionaram nas cenas daqui:

- **`res` menor = mais splats = mais detalhe** (e mais pesado). 0.1 é rascunho; 0.03 é detalhado.
- **Juntar peças com curva suave:** crie as formas com `{ hold: true }` e junte com `S.join('round', corpo, [peca1, peca2], { r: 0.14, res: 0.03 })`.
- **Pintar detalhes na superfície** (olhos, boca, marcas): use `tex` no material. A função recebe `(x, y, z)` e devolve um índice da paleta, ou `undefined` para manter a cor normal. Veja `pikachu/pikachu.js`.
- **Brilho/luz própria:** `{ r: [...], em: true }`.
- **Luz no ar (feixes de sol):** depois do `S.bake()`, adicione muitos splats translúcidos com `B.dab(...)` (densidade ~0.01), paralelos à direção do sol `S.sun`. Veja `third-scene/pond-garden.js`.
- **Água com reflexo:** splats de água com `B.disc(..., { k: 7 })` e `pond: {...}` no `B.finish`; o visualizador reflete a cena só neles. Veja `third-scene/`.
- Elementos translúcidos (luz, água) devem vir **depois** dos sólidos.

### 4. Veja um PNG rápido (opcional)

```bash
cd minha-cena
node ../../shapeshift-labs-ink-studio/cli/ink-studio.js render minha-cena.js --out minha-cena.png --w 900 --h 900
```

Ângulos: `--yaw 1.5` (lado), `--yaw 3.14` (costas), `--pitch 0.8` (de cima).

### 5. Gere os dados 3D e abra no visualizador

```bash
node export-scene.js          # cria minha-cena/scene-data.js
```

Edite `minha-cena/index.html` (título, `<h1>`, seletor de projetos) e adicione um link para `minha-cena/index.html` no seletor das outras cenas. Na página inicial (`index.html`), copie um dos cartões `<a class="scene">` e gere a imagem de prévia em `thumbs/` (uma captura de tela da cena, 720×480). Abra no Chrome e recarregue com `Ctrl+Shift+R` a cada mudança.

### 6. Salve e congele

Este projeto usa o Git em `.git-local` (não em `.git`):

```bash
git --git-dir=.git-local --work-tree=. add -A
git --git-dir=.git-local --work-tree=. commit -m "feat: add minha-cena"
```

Para congelar uma cena, coloque no começo do `export-scene.js`:

```js
if (fs.existsSync(outputPath)) { console.error('Cena arquivada.'); process.exit(1); }
```

### 7. Vídeo (opcional)

`fourth-scene/render-video.js` renderiza 180 quadros com o Ink Studio, girando a câmera, e junta tudo em MP4 com o ffmpeg:

```bash
cd fourth-scene && node render-video.js
```

### 8. Publicar

- **GitHub Pages:** cada `git push` para a branch `main` atualiza o site em poucos minutos.
- **Versão sem fan art:** `node scripts/build-public.js` gera `public/` só com as quatro cenas da torre (e a página inicial sem o menu do Gengar), usada no link publicado pelo Claude.

## Como funciona por dentro

```text
minha-cena.js ──(Ink Studio: S.bake)──▶ splats (16 números cada)
      │
export-scene.js ──▶ scene-data.js (posição, cor, covariância, densidade em base64)
      │
viewer.js (WebGL) ──▶ cada splat vira uma elipse orientada na tela
```

- **Sólidos** são desenhados opacos, com teste de profundidade; **translúcidos** (luz, água) depois, com mistura de cor.
- A forma de cada elipse vem da matriz de covariância do splat, projetada pela câmera. É isso que faz as paredes parecerem contínuas, sem furos.
- O visualizador só redesenha quando a câmera muda e usa resolução menor enquanto você arrasta.

## Créditos

Motor procedural: [Ink Studio](https://github.com/siliconjungle/shapeshift-labs-ink-studio), © 2026 siliconjungle, licença MIT. Gengar é um personagem de Pokémon (© Nintendo / Creatures / GAME FREAK / The Pokémon Company); as cenas Picachu e Pikachu são fan art sem fins comerciais.
