// Idiomas da Splat Gallery: português (padrão no HTML) e inglês (atributos data-en).
// O botão mostra a bandeira do idioma para o qual vai trocar: 🇺🇸 em português, 🇧🇷 em inglês.
// A escolha fica guardada entre as páginas; na primeira visita vale o idioma do navegador.
(() => {
  const KEY = 'splat-gallery-lang';
  const ATTRS = ['alt', 'aria-label'];
  const read = () => { try { return localStorage.getItem(KEY); } catch (error) { return null; } };
  const save = value => { try { localStorage.setItem(KEY, value); } catch (error) { /* sem armazenamento */ } };
  const browser = (navigator.language || 'pt').toLowerCase().startsWith('pt') ? 'pt' : 'en';
  let lang = read() === 'en' || read() === 'pt' ? read() : browser;

  const FLAGS = {
    // Estados Unidos (mostrada em português: "mudar para inglês")
    en: '<svg viewBox="0 0 30 20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/><g fill="#b22234">' +
      [0, 2, 4, 6, 8, 10, 12].map(i => `<rect y="${(i * 20 / 13).toFixed(2)}" width="30" height="${(20 / 13).toFixed(2)}"/>`).join('') +
      '</g><rect width="12" height="10.77" fill="#3c3b6e"/><g fill="#fff">' +
      [[2, 2], [5, 2], [8, 2], [3.5, 4.5], [6.5, 4.5], [2, 7], [5, 7], [8, 7], [3.5, 9.2], [6.5, 9.2]].map(([x, y]) => `<circle cx="${x + 1}" cy="${y}" r=".7"/>`).join('') +
      '</g></svg>',
    // Brasil (mostrada em inglês: "mudar para português")
    pt: '<svg viewBox="0 0 30 21" aria-hidden="true"><rect width="30" height="21" fill="#009c3b"/><path d="M15 2.2 27.6 10.5 15 18.8 2.4 10.5z" fill="#ffdf00"/>' +
      '<circle cx="15" cy="10.5" r="5.2" fill="#002776"/><path d="M10.1 9.3c3.4-1 7.3-.4 9.9 1.7" stroke="#fff" stroke-width="1" fill="none"/></svg>'
  };

  // guarda o português original de tudo o que tem tradução
  const texts = [...document.querySelectorAll('[data-en]')].map(el => ({ el, pt: el.tagName === 'TITLE' ? el.textContent : el.innerHTML, en: el.dataset.en }));
  const attrs = ATTRS.flatMap(name => [...document.querySelectorAll(`[data-en-${name}]`)].map(el => ({ el, name, pt: el.getAttribute(name), en: el.getAttribute(`data-en-${name}`) })));

  // textos que os scripts escrevem na hora (contador de splats, tela de entrada, erro de WebGL)
  const status = document.getElementById('status');
  const load = document.querySelector('.de-enter .de-load');
  const dynamic = [status, load].filter(Boolean).map(el => ({ el, pt: el.textContent }));
  const toEnglishNumber = n => n.replace(/\./g, ',');
  const translateDynamic = text => text
    .replace(/([\d.]+) partículas 3D · cena local/, (m, n) => `${toEnglishNumber(n)} 3D particles · local scene`)
    .replace(/([\d.]+) splats carregados/, (m, n) => `${toEnglishNumber(n)} splats loaded`)
    .replace('Não foi possível iniciar o WebGL ou carregar a cena.', 'Could not start WebGL or load the scene.')
    .replace('Carregando cena…', 'Loading scene…')
    .replace('Entrando…', 'Entering…');

  // botão de bandeira
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'lang-toggle';
  const host = document.querySelector('.de-bar') || document.querySelector('.topbar .menu');
  if (host) host.append(button);

  function apply(next) {
    lang = next;
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
    for (const t of texts) {
      const value = lang === 'en' ? t.en : t.pt;
      if (t.el.tagName === 'TITLE') document.title = value; else t.el.innerHTML = value;
    }
    for (const a of attrs) a.el.setAttribute(a.name, lang === 'en' ? a.en : a.pt);
    for (const d of dynamic) d.el.textContent = lang === 'en' ? translateDynamic(d.pt) : d.pt;
    const enterName = document.querySelector('.de-enter strong'), title = document.querySelector('.de-bar h1');
    if (enterName && title) enterName.textContent = title.textContent;
    document.querySelectorAll('.copy').forEach(copy => { copy.textContent = lang === 'en' ? 'Copy' : 'Copiar'; });
    const target = lang === 'en' ? 'pt' : 'en';
    button.innerHTML = FLAGS[target];
    button.setAttribute('aria-label', target === 'en' ? 'Switch to English' : 'Mudar para português');
    button.title = target === 'en' ? 'English' : 'Português';
  }
  button.addEventListener('click', () => { const next = lang === 'en' ? 'pt' : 'en'; save(next); apply(next); });
  apply(lang);
  window.splatLang = () => lang;
})();
