// MODELO DE CENA — copie esta pasta (cp -r modelo minha-cena) e edite só este arquivo.
// Depois de cada mudança: node export-scene.js  e recarregue a página com Ctrl+Shift+R.
module.exports = ({ makeBuilder, makeSculpt, KIT: K }) => ({
  id: 'modelo',
  name: 'Cogumelo',          // aparece como título da página
  seed: 7,                   // mude para sortear outra variação das pedras e do mato
  build(seed) {
    // 1. PALETA — cada material usa índices desta lista, do mais escuro ao mais claro.
    const B = makeBuilder(seed, [
      0x0b171e,                               // 0 fundo
      0x1e3d2e, 0x315a37, 0x4f7b43, 0x83a650, // 1-4 grama
      0x8a6f5a, 0xcbb8a0, 0xeee4cf,           // 5-7 caule
      0x5e1622, 0x9c2a35, 0xd2453f,           // 8-10 chapéu vermelho
      0xf6efe0,                               // 11 bolinhas brancas
      0x3a3546, 0x5c566a                      // 12-13 pedras
    ]);
    const S = K.sculpt(makeSculpt(B));

    // 2. MATERIAIS — { r: [índices] } é uma rampa de cor; a luz escolhe o tom.
    const grama = { r: [1, 2, 3, 4] };
    const caule = { r: [5, 6, 7] };
    const pedra = { r: [0, 12, 13] };
    // tex pinta pontos da superfície: devolve um índice da paleta ou undefined (cor normal).
    const bolinhas = (x, y, z) => {
      const n = B.n3(x * 5, y * 5, z * 5);
      return y > 1.5 && n > 0.64 ? 11 : undefined;
    };
    const chapeu = { r: [8, 9, 10], tex: bolinhas };

    // 3. FORMAS
    // chão: um disco de grama com relevo suave (h = altura em cada x, z)
    S.ground(grama, { h: (x, z) => 0.05 * Math.sin(x * 1.4) * Math.cos(z * 1.2), rad: 3.2, res: 0.1 });

    // caule: S.lathe gira um perfil em torno do eixo Y — [base], altura, [raio embaixo, raio em cima]
    S.lathe([0, 0, 0], 1.5, [0.42, 0.3], caule, { res: 0.04 });

    // chapéu: S.ball é uma esfera; com [rx, ry, rz] vira elipse (aqui, achatada)
    S.ball([0, 1.65, 0], [1.15, 0.55, 1.15], chapeu, { res: 0.04 });

    // pedras e tufos espalhados ao redor; B.R() é um número aleatório estável (depende do seed)
    for (let i = 0; i < 14; i++) {
      const a = B.R() * Math.PI * 2, r = 1.3 + B.R() * 1.6;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (i % 2) S.ball([x, 0.06, z], [0.12 + B.R() * 0.12, 0.08, 0.12 + B.R() * 0.1], pedra, { res: 0.05 });
      else S.ball([x, 0.12, z], [0.18, 0.16, 0.18], grama, { res: 0.06 });
    }

    // 4. TRANSFORMA AS FORMAS EM SPLATS (sempre depois de todas as formas)
    S.bake();

    // 5. CÂMERA INICIAL — target: para onde olha; dist: distância; pitch: altura; yaw: giro
    return B.finish({
      cam: { target: [0, 1.0, 0], dist: 6.5, pitch: 0.3, yaw: 0.5 },
      detail: 15,
      radius: 4
    });
  }
});
