// Esqueleto do Pikachu de verdade (pikachu-de-verdade/cena.js) para o rig compartilhado.
const path = require('node:path');
const R = require('../gengar-animacoes/rig.js');
const { smooth, segDist } = R;

const BODY = { c: [0, 0.92, 0], r: [0.62, 0.7, 0.55] };
const HEAD = { c: [0, 1.78, 0.05], r: [0.66, 0.58, 0.56] };
const TAIL = [0.2, 0.7, -0.48];
const ell = (p, e) => Math.hypot((p[0] - e.c[0]) / e.r[0], (p[1] - e.c[1]) / e.r[1], (p[2] - e.c[2]) / e.r[2]);

// pontos de giro de cada osso
const PIVOTS = {
  head: [0, 1.38, 0.02],
  earR: [0.3, 2.18, 0], earL: [-0.3, 2.18, 0],
  armR: [0.46, 1.17, 0.16], armL: [-0.46, 1.17, 0.16],
  footR: [0.3, 0.3, 0.12], footL: [-0.3, 0.3, 0.12],
  tail: TAIL
};
const BONES = ['head', 'earR', 'earL', 'armR', 'armL', 'footR', 'footL', 'tail'];
const idx = name => BONES.indexOf(name) + 1;

function classify(p, { hex, basePalette }) {
  const grass = [12, 13, 14, 15].some(i => basePalette[i] === hex);
  const rxz = Math.hypot(p[0], p[2]);
  if ((grass && p[1] < 0.06) || (rxz > 0.9 && p[1] < 0.5)) return { part: -1 };
  const s = p[0] >= 0 ? 1 : -1;
  const eb = ell(p, BODY), eh = ell(p, HEAD);
  // orelhas: acima da cabeça, fora dela
  const ear = segDist(p, [s * 0.3, 2.18, 0], [s * 0.86, 3.2, -0.1]);
  if (ear < 0.28 && p[1] > 2.0 && eh > 0.95) return { part: idx(s > 0 ? 'earR' : 'earL'), weight: smooth((eh - 0.95) / 0.2) };
  // rabo: atrás do corpo
  if (p[2] < -0.42 && eb > 1.0 && eh > 1.06 && p[1] < 3.0) return { part: idx('tail'), weight: smooth((eb - 1.0) / 0.15) };
  // braços: perto do segmento ombro → mão, fora do corpo
  const arm = segDist(p, [s * 0.46, 1.17, 0.16], [s * 0.58, 0.98, 0.52]);
  if (arm < 0.3 && eb > 0.95 && eh > 1.0) return { part: idx(s > 0 ? 'armR' : 'armL'), weight: smooth((eb - 0.95) / 0.15) * (1 - smooth((arm - 0.22) / 0.08)) };
  // pés
  if (p[1] < 0.32) return { part: idx(s > 0 ? 'footR' : 'footL'), weight: 1 - smooth((p[1] - 0.18) / 0.14) };
  // cabeça: acima do pescoço
  if (p[1] > 1.32) return { part: idx('head'), weight: smooth((p[1] - 1.32) / 0.2) };
  return { part: 0 };
}

const load = options => R.load(Object.assign({ scene: path.resolve(__dirname, '../pikachu-de-verdade/cena.js'), bones: BONES, classify }, options));

module.exports = { load, BONES, PIVOTS, BODY, HEAD, TAIL };
