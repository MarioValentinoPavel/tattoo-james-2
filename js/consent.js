// Aviso de cookies: primera capa (Aceptar / Rechazar / Configurar) + panel con las categorías.
// La web solo guarda en el navegador el idioma y esta elección (técnicas, sin consentimiento).
// Lo único de terceros es el mapa de Google (.cc-map[data-src]), que se carga solo si se acepta.
(() => {
  const site = document.currentScript?.dataset.site || 'web';
  const KEY = site + '-consent', VERSION = 1, MAX_AGE = 365 * 864e5;
  const TX = {
    es: {
      h: 'Cookies, solo las justas',
      p: 'No usamos cookies de publicidad ni de analítica. Guardamos en tu navegador el idioma y esta elección. Si aceptas, cargaremos también el mapa de Google, que usa sus propias cookies.',
      more: 'Política de cookies', reject: 'Rechazar', config: 'Configurar', accept: 'Aceptar todo',
      ph: 'Configurar cookies', tech: 'Necesarias', techP: 'Recuerdan tu idioma y tu elección sobre cookies. Siempre activas.',
      maps: 'Mapas y contenido externo', mapsP: 'Muestra el mapa de Google Maps dentro de la web. Al cargarlo, Google puede usar sus cookies.',
      on: 'Siempre activas', save: 'Guardar mi elección', all: 'Aceptar todo', close: 'Cerrar', label: 'Aviso de cookies',
      mapBtn: 'Ver el mapa', mapTxt: 'El mapa es de Google y usa sus cookies. Se carga solo si lo aceptas.'
    },
    en: {
      h: 'Cookies, only the essentials',
      p: 'We use no advertising or analytics cookies. We store your language and this choice in your browser. If you accept, we will also load the Google map, which uses its own cookies.',
      more: 'Cookie policy', reject: 'Reject', config: 'Settings', accept: 'Accept all',
      ph: 'Cookie settings', tech: 'Necessary', techP: 'They remember your language and your cookie choice. Always on.',
      maps: 'Maps and external content', mapsP: 'Shows the Google Maps map on this website. When it loads, Google may use its cookies.',
      on: 'Always on', save: 'Save my choice', all: 'Accept all', close: 'Close', label: 'Cookie notice',
      mapBtn: 'Show the map', mapTxt: 'The map is provided by Google and uses its cookies. It only loads if you accept.'
    }
  };
  const T = () => TX[document.documentElement.lang === 'en' ? 'en' : 'es'];
  const policy = document.currentScript?.dataset.policy || 'cookies.html';

  function read() {
    try {
      const c = JSON.parse(localStorage.getItem(KEY));
      if (c && c.v === VERSION && Date.now() - c.t < MAX_AGE) return c;
    } catch (_) { /* sin almacenamiento */ }
    return null;
  }
  let state = read();
  function save(c) {
    state = { v: VERSION, t: Date.now(), maps: !!c.maps };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* sin almacenamiento */ }
    maps(); hideBanner(); closePanel();
  }

  // ---------- mapas ----------
  function maps() {
    document.querySelectorAll('.cc-map[data-src]').forEach((box) => {
      if (state && state.maps) {
        if (!box.querySelector('iframe')) {
          box.innerHTML = `<iframe src="${box.dataset.src}" title="${box.dataset.title || 'Google Maps'}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
        }
      } else {
        box.innerHTML = `<div class="cc-map-ph"><p></p><button type="button" class="cc-map-btn"></button></div>`;
        box.querySelector('p').textContent = T().mapTxt;
        const b = box.querySelector('button');
        b.textContent = T().mapBtn;
        b.addEventListener('click', () => save({ maps: true }));
      }
    });
  }

  // ---------- aviso ----------
  let banner = null;
  function buildBanner() {
    banner = document.createElement('section');
    banner.className = 'ck';
    banner.innerHTML = `<p class="ck-h"></p><p class="ck-p"><span></span> <a href="${policy}"></a></p>
      <div class="ck-btns"><button type="button" class="ck-b" data-ck="reject"></button><button type="button" class="ck-b" data-ck="config"></button><button type="button" class="ck-b ck-main" data-ck="accept"></button></div>`;
    banner.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ck]'); if (!b) return;
      if (b.dataset.ck === 'accept') save({ maps: true });
      else if (b.dataset.ck === 'reject') save({ maps: false });
      else openPanel();
    });
    document.body.appendChild(banner);
    fill();
  }
  function showBanner() {
    if (!banner) buildBanner();
    setTimeout(() => banner && banner.classList.add('show'), 40);
  }
  function hideBanner() {
    if (!banner) return;
    banner.classList.remove('show');
    const b = banner; banner = null;
    setTimeout(() => b.remove(), 500);
  }

  // ---------- panel ----------
  let dlg = null;
  function buildPanel() {
    dlg = document.createElement('dialog');
    dlg.className = 'ck-dlg';
    dlg.setAttribute('aria-labelledby', 'ck-ph');
    dlg.innerHTML = `<form method="dialog" class="ck-in">
        <div class="ck-top"><h2 class="ck-ph" id="ck-ph"></h2><button type="button" class="ck-x" data-ck="close">×</button></div>
        <div class="ck-row"><div><b data-t="tech"></b><p data-t="techP"></p></div><span class="ck-fixed" data-t="on"></span></div>
        <label class="ck-row"><div><b data-t="maps"></b><p data-t="mapsP"></p></div><span class="ck-sw"><input type="checkbox" id="ck-maps"><i aria-hidden="true"></i></span></label>
        <div class="ck-btns"><button type="button" class="ck-b" data-ck="save"></button><button type="button" class="ck-b ck-main" data-ck="all"></button></div>
        <p class="ck-more"><a href="${policy}"></a></p>
      </form>`;
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) { closePanel(); return; }
      const b = e.target.closest('[data-ck]'); if (!b) return;
      if (b.dataset.ck === 'close') closePanel();
      else if (b.dataset.ck === 'all') save({ maps: true });
      else if (b.dataset.ck === 'save') save({ maps: dlg.querySelector('#ck-maps').checked });
    });
    document.body.appendChild(dlg);
    fill();
  }
  function openPanel() {
    if (!dlg) buildPanel();
    dlg.querySelector('#ck-maps').checked = !!(state && state.maps);
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  function closePanel() { if (dlg && dlg.open) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); } }

  function fill() {
    const t = T();
    if (banner) {
      banner.setAttribute('aria-label', t.label);
      banner.querySelector('.ck-h').textContent = t.h;
      banner.querySelector('.ck-p span').textContent = t.p;
      banner.querySelector('.ck-p a').textContent = t.more;
      banner.querySelector('[data-ck="reject"]').textContent = t.reject;
      banner.querySelector('[data-ck="config"]').textContent = t.config;
      banner.querySelector('[data-ck="accept"]').textContent = t.accept;
    }
    if (dlg) {
      dlg.querySelector('.ck-ph').textContent = t.ph;
      dlg.querySelectorAll('[data-t]').forEach((el) => { el.textContent = t[el.dataset.t]; });
      dlg.querySelector('.ck-x').setAttribute('aria-label', t.close);
      dlg.querySelector('[data-ck="save"]').textContent = t.save;
      dlg.querySelector('[data-ck="all"]').textContent = t.all;
      dlg.querySelector('.ck-more a').textContent = t.more;
    }
  }

  document.addEventListener('click', (e) => { if (e.target.closest('[data-cookies-open]')) { e.preventDefault(); openPanel(); } });
  document.addEventListener('langchange', () => { fill(); if (!(state && state.maps)) maps(); });

  window.CONSENT = { get: () => state, open: openPanel };
  const start = () => {
    maps();
    if (!state) setTimeout(showBanner, document.body.classList.contains('legal-page') ? 0 : 1800);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
