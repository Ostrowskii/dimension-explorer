# Prompt para o Claude criar uma cena 3D em splats

Cole o texto abaixo no Claude (Fable), numa pasta vazia, e escreva no final o que você quer que ele crie.

---

```text
Quero criar uma cena 3D em pixel-art e explorá-la no navegador, girando com o mouse. Faça tudo sozinho: baixe o que precisar, escreva o código, gere a cena, monte o visualizador e me mostre o resultado. Fale comigo em português simples, porque não sou programador.

FERRAMENTA: Ink Studio — https://github.com/siliconjungle/shapeshift-labs-ink-studio
- É um motor procedural em JavaScript (Node 18+, sem dependências). Não é IA generativa: a cena é descrita em código.
- Uma cena é um arquivo: module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({ id, name, seed, build(seed) }).
  Dentro de build: B = makeBuilder(seed, [paleta de cores 0xRRGGBB]); S = K.sculpt(makeSculpt(B)); formas como S.ground, S.ball, S.box, S.lathe, S.tube, S.extrude, S.join('round', …); materiais { r: [índices da paleta] } (podem ter tex(x,y,z) para pintar detalhes); S.bake() transforma as formas em splats; return B.finish({ cam: { target, dist, pitch, yaw }, detail }).
- Leia o README do Ink Studio e os exemplos em lab/ e examples/ antes de escrever a cena.
- Prévia em PNG: node cli/ink-studio.js render <cena.js> --out cena.png --w 900 --h 900 (mude o ângulo com --yaw).
- O mundo gerado tem world.data (Float32Array, 16 números por splat): [x, y, z, densidade, c00, c01, c02, corRGB, c11, c12, c22, tipo, …]. Os c são a covariância (forma e orientação da mancha) e a cor vem empacotada (R + G·256 + B·65536).

VISUALIZADOR: faça um visualizador 3D básico, em WebGL puro, sem bibliotecas e sem servidor.
- Um script Node exporta posição, cor, covariância e densidade de cada splat para um arquivo scene-data.js (em base64).
- Uma página index.html + viewer.js desenha cada splat como uma elipse projetada a partir da covariância (gl.POINTS com o tamanho calculado no vertex shader). Não desenhe bolinhas soltas: sem a forma da covariância, as paredes ficam cheias de furos.
- Splats opacos (densidade ≥ 1) primeiro, com teste de profundidade; translúcidos depois, com mistura de cor.
- Controles: arrastar gira, roda do mouse aproxima, botão direito move o foco. Redesenhe só quando a câmera mudar.
- Referência de um projeto que já faz isso: https://github.com/Ostrowskii/dimension-explorer (veja modelo/export-scene.js e modelo/viewer.js). Use só como exemplo; o seu visualizador pode ser mais simples.

COMO TRABALHAR
1. Escreva a cena, gere o PNG e olhe a imagem. Corrija proporções, cores e enquadramento até ficar bom.
2. Exporte e abra no visualizador. Confira com uma captura de tela do Chrome sem janela (google-chrome --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --screenshot=…) antes de dizer que está pronto.
3. Me mostre a imagem e me diga como abrir a cena. Se o meu navegador não abrir o WebGL, me passe o comando do Chrome com --use-angle=swiftshader.
4. Depois disso eu vou pedir ajustes ("mais alto", "mais árvores", "outra cor").

O QUE EU QUERO CRIAR:
```

---

Exemplos do que escrever no final: *"uma torre de pedra numa clareira de bosque, com árvores e um caminho"*, *"um farol numa ilha, com o mar em volta"*, *"uma vila de casinhas com telhado vermelho"*.
