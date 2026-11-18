# Torre, árvore dourada e lago

Terceira cena explorável do Dimension Explorer. Mantém a torre de pedra, a árvore de 5/4 da altura da torre, o jardim e os feixes solares. O novo lago ocupa a frente da clareira. Parte dos feixes alcança a água e parte alcança o chão; há também regiões do lago fora dos feixes.

O terreno é recortado para abrir espaço para a água. O reflexo usa `B.mirror` do motor procedural Ink Studio, que copia as formas espelhadas abaixo do plano do lago, com cores frias e pequenas ondulações. A superfície translúcida usa 544 splats sobrepostos e uma margem clara para delimitar o lago. O visualizador WebGL local lê os dados exportados sem precisar do motor depois da geração.

Abra `index.html` para explorar. A cena-fonte é `pond-garden.js`; rode `node export-scene.js` nesta pasta para regenerar `scene-data.js` após alterações.
