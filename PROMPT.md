# Prompt para recriar o Dimension Explorer

Cole o texto abaixo num agente de IA de programação (Claude Code, Codex ou similar), aberto numa pasta vazia. Troque o trecho entre colchetes pela cena que você quer.

---

```text
Quero criar uma cena 3D em pixel-art, feita com Gaussian splats, que eu possa girar no navegador. Use o projeto Dimension Explorer como base.

MINHA CENA: [descreva aqui. Ex.: "um farol numa ilha de pedra, com o mar em volta e uma gaivota pousada"]

CONTEXTO
- Motor: Ink Studio (https://github.com/siliconjungle/shapeshift-labs-ink-studio). É um motor procedural em JavaScript, não é IA generativa: você descreve formas em código (S.ball, S.box, S.lathe, S.tube, S.ground, S.extrude, S.join) e S.bake() transforma tudo em splats (16 números por splat: posição, densidade, covariância/forma, cor).
- Visualizador: Dimension Explorer (https://github.com/Ostrowskii/dimension-explorer). Tem um modelo pronto em modelo/ (cena.js + export-scene.js + viewer.js WebGL sem dependências). O site se chama Splat Gallery; "Dimension Explorer" é o modo 3D onde se entra para explorar uma cena.
- Leia antes de começar: o README.md e o como-fazer.html do Dimension Explorer, e o README do Ink Studio (seções "Geometry and materials" e "Reflections, ripples and atmosphere").

PASSOS
1. Crie uma pasta, clone os dois repositórios lado a lado dentro dela e confira que o Node é 18 ou mais novo.
2. Dentro de dimension-explorer, copie o modelo: cp -r modelo <nome-da-cena>. Nunca edite o modelo nem as cenas que já existem.
3. Escreva a cena em <nome-da-cena>/cena.js seguindo a estrutura comentada do modelo: paleta (cores do escuro para o claro), materiais { r: [índices] }, formas, S.bake(), câmera em B.finish.
   - Junte peças de um mesmo objeto com S.join('round', principal, [peças], { r }) criando as peças com { hold: true }.
   - Pinte detalhes (olhos, marcas, janelas) com uma função tex(x, y, z) no material, que devolve um índice da paleta.
   - Use res entre 0.1 (rascunho) e 0.026 (detalhado). Mantenha a cena abaixo de ~100 mil splats.
4. Gere uma prévia PNG e OLHE a imagem antes de seguir:
   node ../../shapeshift-labs-ink-studio/cli/ink-studio.js render cena.js --out cena.png --w 900 --h 900
   Corrija proporções, cores e enquadramento. Gere também uma vista de lado (--yaw 1.5) e de trás (--yaw 3.14).
5. Gere os dados 3D: node export-scene.js (dentro da pasta da cena). Ajuste o <h1>, o título e os links do seletor no index.html da cena.
6. Confira o resultado no navegador de verdade, tirando uma captura de tela com o Chrome sem janela:
   google-chrome --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --window-size=1300,800 --virtual-time-budget=12000 --screenshot=shot.png file://$PWD/<nome-da-cena>/index.html
   Não diga que está pronto sem ter visto essa captura.
7. Coloque a cena na Splat Gallery: um cartão <a class="scene" id="<nome-da-cena>"> no index.html da raiz (com a prévia 720×480 em thumbs/) e um link no seletor das outras cenas. Para textos novos, preencha também o atributo data-en com a versão em inglês.
8. Salve cada etapa no Git com uma mensagem curta.

OPCIONAL
- Animação em vídeo: use o esqueleto de gengar-animacoes/rig.js (veja pikachu-animacoes/ como exemplo de personagem com ossos próprios). Ele move partes do corpo e efeitos quadro a quadro e gera MP4 com ffmpeg.
- Vídeo com a câmera girando: veja fourth-scene/render-video.js.

COMO TRABALHAR COMIGO
- Fale comigo em português e de forma simples; não sou programador.
- Antes de cada mudança grande, diga em uma frase o que vai fazer.
- Depois de cada etapa, me mostre a imagem e espere eu aprovar ou pedir ajustes ("mais alto", "outra cor", "mais detalhe").
- Se o navegador disser "Não foi possível iniciar o WebGL", me passe o comando do Chrome com --use-angle=swiftshader para abrir a cena.
```

---

O prompt foi escrito a partir do que deu certo neste projeto: olhar cada imagem antes de seguir, nunca mexer nas cenas antigas e salvar cada etapa no Git.
