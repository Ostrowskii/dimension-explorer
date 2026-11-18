# Torre e árvore dourada

Nova cena explorável: torre de pedra, telhado, janelas, árvores, arbustos, flores, pedras e caminho, com uma árvore antiga de aproximadamente 5/4 da altura da torre. Os quatro feixes de luz usam splats dourados translúcidos, desenhados com mistura de cor no visualizador. Não há personagens.

Esta é a versão final preservada. Abra `index.html` no navegador. O arquivo `scene-data.js` está protegido contra regeneração acidental, e o visualizador funciona sem o motor procedural irmão. O código `tree-garden.js` registra como a cena foi criada. A torre anterior permanece preservada em `../dist/`.

O motor oferece `K.atmosphere.shaft` para descrever volumes de luz, além de recursos separados para reflexos de água. A cena guarda as descrições de quatro feixes solares paralelos, que entram por pontos próximos da copa e seguem a direção oposta ao vetor `S.sun` que ilumina a cena. Cada feixe usa 1.800 pontos translúcidos distribuídos ao longo do volume para a visualização WebGL local.
