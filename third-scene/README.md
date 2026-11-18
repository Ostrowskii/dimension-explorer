# Torre, árvore dourada e lago

Terceira cena explorável do Dimension Explorer. Mantém a torre de pedra, a árvore de 5/4 da altura da torre, o jardim e os feixes solares. O lago maior ocupa a frente esquerda da clareira na vista inicial, com uma margem irregular. Dois feixes alcançam a água e dois alcançam o chão; há também regiões do lago fora dos feixes.

O terreno é recortado para abrir espaço para a água. O visualizador aplica o mesmo princípio da reflexão planar do Ink Studio: desenha a cena espelhada em uma textura a partir do ângulo atual e usa essa imagem apenas na superfície do lago. A água usa 1.381 splats translúcidos sobrepostos e uma margem clara. O projeto não carrega cópias espelhadas abaixo do terreno; o visualizador WebGL local lê os dados exportados sem precisar do motor depois da geração.

Abra `index.html` para explorar. A cena-fonte é `pond-garden.js`; rode `node export-scene.js` nesta pasta para regenerar `scene-data.js` após alterações.
