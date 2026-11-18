// Dimension Explorer — o modo 3D da Splat Gallery.
// Cuida de entrar (tela de entrada) e sair (botão Sair ✕ e tecla Esc) do modo.
// Carregado depois de scene-data.js e viewer.js em cada cena.
(() => {
  const RETURN_KEY = 'splat-gallery-return';
  const ENTERING_KEY = 'splat-gallery-entering';
  const read = key => { try { return sessionStorage.getItem(key); } catch (error) { return null; } };
  const forget = key => { try { sessionStorage.removeItem(key); } catch (error) { /* sem armazenamento */ } };

  // Sair: volta ao cartão de onde a pessoa entrou, mesmo depois de trocar de cena lá dentro.
  const exit = () => {
    const target = read(RETURN_KEY);
    if (target) { location.href = target; return; }
    let sameSite = false;
    try { sameSite = document.referrer && new URL(document.referrer).origin === location.origin; } catch (error) { sameSite = false; }
    if (sameSite && history.length > 1) history.back();
    else location.href = '../index.html';
  };
  const exitButton = document.getElementById('de-exit');
  if (exitButton) exitButton.addEventListener('click', exit);
  addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    const details = document.querySelector('.panel details');
    if (details && details.contains(document.activeElement) && document.activeElement.tagName === 'SUMMARY') return;
    exit();
  });

  // Entrada: mostra o nome da cena e quantos splats foram carregados, e some.
  const overlay = document.getElementById('de-enter');
  if (!overlay) return;
  const title = document.querySelector('.de-bar h1');
  const name = overlay.querySelector('strong');
  const load = overlay.querySelector('.de-load');
  if (title && name) name.textContent = title.textContent;
  const scene = window.TOWER_SCENE;
  if (scene && load) load.textContent = `${scene.count.toLocaleString('pt-BR')} splats carregados`;
  const entering = read(ENTERING_KEY) === '1';
  forget(ENTERING_KEY);
  setTimeout(() => overlay.classList.add('gone'), entering ? 900 : 200);
})();
