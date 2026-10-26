// Tattoo James v2 · «Del stencil a la piel»: cada foto se convierte en un stencil morado (bordes Sobel)
// y la máquina de tatuar (el cursor) lo «tatúa» para descubrir la pieza real.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const L = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const PAPER = [242, 238, 230], VIOLET = [80, 54, 205];

  const load = (src) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });

  // ---------- stencil: bordes de la foto en tinta violeta sobre papel de calco ----------
  function stencil(img, w, h) {
    const W = Math.round(Math.min(560, w)), H = Math.round(W * h / w);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true });
    // object-fit: cover sobre el lienzo
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight), dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    g.filter = 'blur(1.2px)';
    g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    g.filter = 'none';
    const src = g.getImageData(0, 0, W, H).data, lum = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) lum[i] = src[i * 4] * .3 + src[i * 4 + 1] * .59 + src[i * 4 + 2] * .11;
    const mag = new Float32Array(W * H); const hist = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx = -lum[i - W - 1] - 2 * lum[i - 1] - lum[i + W - 1] + lum[i - W + 1] + 2 * lum[i + 1] + lum[i + W + 1];
      const gy = -lum[i - W - 1] - 2 * lum[i - W] - lum[i - W + 1] + lum[i + W - 1] + 2 * lum[i + W] + lum[i + W + 1];
      const m = Math.sqrt(gx * gx + gy * gy); mag[i] = m; if ((x + y) % 7 === 0) hist.push(m);
    }
    hist.sort((a, b) => a - b);
    const lo = hist[Math.floor(hist.length * .78)] || 40, hi = hist[Math.floor(hist.length * .97)] || 160;
    const out = g.createImageData(W, H), d = out.data;
    for (let i = 0; i < W * H; i++) {
      const a = Math.max(0, Math.min(1, (mag[i] - lo) / (hi - lo)));
      const k = a * .92;
      d[i * 4] = PAPER[0] * (1 - k) + VIOLET[0] * k;
      d[i * 4 + 1] = PAPER[1] * (1 - k) + VIOLET[1] * k;
      d[i * 4 + 2] = PAPER[2] * (1 - k) + VIOLET[2] * k;
      d[i * 4 + 3] = 255;
    }
    g.putImageData(out, 0, 0);
    return c;
  }

  // ---------- portada: tatúa tú ----------
  async function heroTattoo() {
    const box = document.getElementById('tat'), photo = box.querySelector('.tat-photo'), cv = box.querySelector('.tat-stencil'), pct = document.getElementById('tatPct');
    const img = photo.complete && photo.naturalWidth ? photo : await load(photo.src);
    let st, g, cells, inked = 0, done = false;
    const GRID = 24;
    function reset() {
      const r = box.getBoundingClientRect();
      const d = Math.min(2, devicePixelRatio || 1);
      cv.width = r.width * d; cv.height = r.height * d;
      g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
      st = stencil(img, r.width, r.height);
      g.globalCompositeOperation = 'source-over';
      g.drawImage(st, 0, 0, r.width, r.height);
      cells = new Uint8Array(GRID * GRID); inked = 0; done = false;
      box.classList.remove('done'); pct.textContent = '0%';
      cv.style.opacity = 1;
    }
    function ink(x, y, rad) {
      const r = box.getBoundingClientRect();
      g.globalCompositeOperation = 'destination-out';
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(.6, 'rgba(0,0,0,.85)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, rad, 0, 6.283); g.fill();
      const cx = Math.floor(x / r.width * GRID), cy = Math.floor(y / r.height * GRID);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const a = cx + i, b = cy + j; if (a < 0 || b < 0 || a >= GRID || b >= GRID) continue;
        const k = b * GRID + a; if (!cells[k]) { cells[k] = 1; inked++; }
      }
      const p = Math.min(100, Math.round(inked / (GRID * GRID) * 100 / .7));
      pct.textContent = p + '%';
      if (p >= 100 && !done) { done = true; finish(); }
    }
    function finish() {
      box.classList.add('done');
      if (typeof gsap !== 'undefined' && !reduce) gsap.to(cv, { opacity: 0, duration: .9, ease: 'power2.out' }); else cv.style.opacity = 0;
      pct.textContent = L() === 'en' ? 'Done!' : '¡Listo!';
    }
    let last = null;
    const stroke = (e) => {
      const r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const rad = Math.max(18, r.width * .045);
      if (last) { const dx = x - last.x, dy = y - last.y, n = Math.ceil(Math.hypot(dx, dy) / (rad * .4)); for (let i = 1; i <= n; i++) ink(last.x + dx * i / n, last.y + dy * i / n, rad); }
      else ink(x, y, rad);
      last = { x, y };
    };
    // ratón: basta con pasar la máquina por encima; táctil: arrastrar
    box.addEventListener('pointermove', (e) => { if (done) return; if (e.pointerType === 'mouse' || e.buttons) stroke(e); });
    box.addEventListener('pointerdown', (e) => { if (done) return; box.setPointerCapture(e.pointerId); last = null; stroke(e); });
    box.addEventListener('pointerleave', () => (last = null));
    box.addEventListener('pointerup', () => (last = null));
    document.getElementById('tatReset').addEventListener('click', (e) => { e.stopPropagation(); reset(); });
    reset();
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (!done) reset(); }, 200); }).observe(box);
    if (reduce) { finish(); return null; }
    // demostración: una pasada automática en diagonal
    return () => new Promise((ok) => {
      const r = box.getBoundingClientRect(), o = { t: 0 };
      gsap.to(o, { t: 1, duration: 1.4, ease: 'power1.inOut', onUpdate: () => { const t = o.t; ink(r.width * (.18 + t * .64), r.height * (.28 + Math.sin(t * 3.14) * .1 + t * .3), Math.max(18, r.width * .045)); }, onComplete: ok });
    });
  }

  // ---------- galería: stencil → tinta al entrar ----------
  async function gallery() {
    const tiles = [...document.querySelectorAll('.w')];
    for (const f of tiles) {
      const src = `assets/img/${f.dataset.img}.jpg`;
      const img = document.createElement('img');
      img.src = src; img.alt = f.querySelector('figcaption').textContent; img.loading = 'lazy';
      const scan = document.createElement('span'); scan.className = 'scan';
      f.prepend(scan); f.prepend(img);
      f._img = img;
    }
    const make = async (f) => {
      if (f._st) return;
      f._st = true;
      try {
        const im = await load(f._img.src);
        const r = f.getBoundingClientRect();
        const c = stencil(im, Math.max(200, r.width), Math.max(200, r.height));
        f.prepend(c);
      } catch (_) { /* sin stencil: se ve la foto */ }
    };
    const inkIt = (f) => {
      if (f.classList.contains('inked')) return;
      if (reduce || typeof gsap === 'undefined') { f.style.setProperty('--cut', '0%'); f.classList.add('inked'); return; }
      const o = { c: 100 };
      f.style.setProperty('--scan', 1);
      gsap.to(o, { c: 0, duration: 1.6, ease: 'power2.inOut', delay: .25, onUpdate: () => f.style.setProperty('--cut', o.c + '%'), onComplete: () => { f.style.setProperty('--scan', 0); f.classList.add('inked'); } });
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { make(e.target).then(() => setTimeout(() => inkIt(e.target), 200)); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -15% 0px' });
    tiles.forEach((f) => { make(f); io.observe(f); });
  }

  function now() {
    const el = document.getElementById('now');
    const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    const m = d.getHours() * 60 + d.getMinutes(), open = m >= 660 && m < 1320;
    el.classList.toggle('open', open);
    el.textContent = open ? (L() === 'en' ? 'OPEN NOW · UNTIL 22:00' : 'ABIERTO AHORA · HASTA LAS 22:00') : (L() === 'en' ? 'CLOSED NOW · OPEN EVERY DAY FROM 11:00' : 'AHORA CERRADO · ABRIMOS CADA DÍA A LAS 11:00');
  }

  function header() {
    const top = document.querySelector('.top'); let last = 0;
    addEventListener('scroll', () => {
      const y = scrollY; top.classList.toggle('solid', y > 50);
      if (y > 500 && y > last + 4) top.classList.add('hide'); else if (y < last - 4) top.classList.remove('hide');
      last = y;
    }, { passive: true });
  }

  function motion() {
    gsap.registerPlugin(ScrollTrigger);
    // los títulos se «tatúan»: primero el contorno violeta, luego se rellenan de tinta
    gsap.utils.toArray('main h2:not(.sr)').forEach((h) => {
      gsap.fromTo(h, { color: 'rgba(0,0,0,0)', webkitTextStroke: '1.2px #5b3fd6' }, { color: getComputedStyle(h).color, webkitTextStroke: '0px #5b3fd6', duration: 1.3, ease: 'power2.inOut', scrollTrigger: { trigger: h, start: 'top 85%' } });
      gsap.from(h, { y: 40, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } });
    });
    gsap.utils.toArray('.steps li, .sec-head p, .art, .chips li, .rs blockquote, .visita dl').forEach((el) => gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
    gsap.from('.vs-img', { clipPath: 'inset(0 100% 0 0)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.vs-img', start: 'top 80%' } });
  }

  async function intro(demo) {
    if (reduce || typeof gsap === 'undefined') { document.body.classList.add('ready'); return; }
    gsap.set('.hero-k, .hero h1, .hero-sub, .hero-cta, .hero-lang', { opacity: 0, y: 30 });
    gsap.set('.tat', { opacity: 0, scale: .94 });
    await new Promise((ok) => gsap.timeline({ onComplete: ok })
      .to('.lt-ink', { clipPath: 'inset(0 0% 0 0)', duration: 1.3, ease: 'power2.inOut' }, .2)
      .from('.loader-s', { opacity: 0, duration: .5 }, .2)
      .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'expo.inOut' }, '+=.2')
      .set('.loader', { display: 'none' })
      .to('.hero-k, .hero h1, .hero-sub, .hero-cta, .hero-lang', { opacity: 1, y: 0, duration: 1, stagger: .07, ease: 'expo.out', clearProps: 'all' }, '-=.4')
      .to('.tat', { opacity: 1, scale: 1, duration: 1.1, ease: 'expo.out' }, '<'));
    document.body.classList.add('ready');
    if (demo) setTimeout(demo, 300);
  }

  async function init() {
    now(); header();
    if (!reduce && typeof gsap !== 'undefined') gsap.set('.loader', { clipPath: 'inset(0 0 0% 0)' });
    const demo = await heroTattoo().catch(() => null);
    gallery();
    if (!reduce && typeof gsap !== 'undefined') motion();
    intro(demo);
    document.fonts && document.fonts.ready.then(() => typeof ScrollTrigger !== 'undefined' && ScrollTrigger.refresh());
  }
  document.addEventListener('langchange', () => { if (document.body.dataset.inited) now(); });
  const go = () => { init(); document.body.dataset.inited = '1'; };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
