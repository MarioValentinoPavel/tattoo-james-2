// Idiomas ES (texto del HTML) / EN (diccionario window.I18N_EN).
// data-i18n="clave" cambia el contenido; data-i18n-attr="aria-label:clave;alt:clave2" cambia atributos.
// Guarda la elección (?lang=en, localStorage) y avisa con el evento "langchange".
(() => {
  const site = document.currentScript?.dataset.site || 'web';
  const KEY = site + '-lang';
  const EN = window.I18N_EN || {};
  const orig = new Map();
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} };
  const load = (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } };

  function apply(lang) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.dataset.i18n;
      if (!orig.has(el)) orig.set(el, el.innerHTML);
      el.innerHTML = lang === 'en' && EN[k] != null ? EN[k] : orig.get(el);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, k] = pair.split(':').map((s) => s.trim());
        const ok = 'i18nOrig' + attr.replace(/-./g, (m) => m[1].toUpperCase());
        if (el.dataset[ok] == null) el.dataset[ok] = el.getAttribute(attr) || '';
        el.setAttribute(attr, lang === 'en' && EN[k] != null ? EN[k] : el.dataset[ok]);
      });
    });
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    store(KEY, lang);
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  const q = new URLSearchParams(location.search).get('lang');
  let start = q || load(KEY) || ((navigator.language || 'es').slice(0, 2) === 'es' || (navigator.language || '').slice(0, 2) === 'ca' ? 'es' : 'en');
  if (start !== 'en') start = 'es';
  window.I18N = { set: apply, get: () => document.documentElement.lang, t: (es, en) => (document.documentElement.lang === 'en' ? en : es) };
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-lang]'); if (b) { e.preventDefault(); apply(b.dataset.lang); } });
  const go = () => apply(start);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
