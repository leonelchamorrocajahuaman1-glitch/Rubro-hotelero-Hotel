/* =========================================================
   HOTEL PARAÍSO · Interacción general
   Navegación, animaciones al desplazarse, habitaciones 3D,
   reservas, experiencias, galería con visor y contacto.
   ========================================================= */
(() => {
  const H = window.HOTEL;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const money = n => `${H.moneda} ${n.toLocaleString('es-PE')}`;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } },
    push(k, v) { try { const a = store.get(k); a.push(v); localStorage.setItem(k, JSON.stringify(a.slice(-20))); } catch {} }
  };
  const waLink = text => `https://wa.me/${H.whatsapp}?text=${encodeURIComponent(text)}`;

  /* ---------- Datos del hotel en la página ---------- */
  const values = { ...H, whatsappTexto: '+' + H.whatsapp.replace(/^(\d{2})(\d{3})(\d{3})(\d+)$/, '$1 $2 $3 $4') };
  $$('[data-hotel]').forEach(el => { const v = values[el.dataset.hotel]; if (v != null) el.textContent = v; });
  const hrefs = {
    tel: 'tel:' + H.telefono.replace(/[^\d+]/g, ''),
    whatsapp: waLink(`Hola ${H.nombre}, quisiera información para reservar.`),
    mail: 'mailto:' + H.email,
    maps: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${H.nombre}, ${H.direccion}, ${H.ciudad}`)
  };
  $$('[data-hotel-href]').forEach(a => { a.href = hrefs[a.dataset.hotelHref]; });
  $$('[data-price]').forEach(el => { el.textContent = money(H.habitaciones[el.dataset.price].precio); });
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Toast ---------- */
  const toastEl = $('#toast'); let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('is-on'), 3200);
  }

  /* ---------- Cabecera: sólida al bajar, se oculta al hacer scroll hacia abajo ---------- */
  const header = $('#header'), wa = $('.wa-float');
  let lastY = scrollY, ticking = false;
  function onScroll() {
    const y = scrollY;
    header.classList.toggle('is-solid', y > innerHeight * .72);
    const menuOpen = document.body.classList.contains('is-locked');
    header.classList.toggle('is-hidden', !menuOpen && y > innerHeight && y > lastY + 4);
    if (y < lastY - 4 || y < innerHeight) header.classList.remove('is-hidden');
    lastY = y;
    wa.classList.toggle('is-hero', y < innerHeight * .6);
    parallax();
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  // Enlace activo según la sección visible
  const links = $$('.nav-links a');
  const sections = links.map(a => $(a.getAttribute('href')));
  const bookingSec = $('#reservar');
  const activeIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const id = en.target === bookingSec ? 'habitaciones' : en.target.id; // la reserva pertenece a Habitaciones
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  [...sections, bookingSec].forEach(s => activeIO.observe(s));

  /* ---------- Menú móvil ---------- */
  const burger = $('#burger'), menu = $('#mobile-menu');
  $$('li', menu).forEach((li, i) => li.style.setProperty('--i', i));
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('is-locked', open);
    header.classList.remove('is-hidden');
    header.classList.toggle('is-solid', open || scrollY > innerHeight * .72);
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); $('a', menu).focus({ preventScroll: true }); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 450); }
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); } });
  addEventListener('resize', () => { if (innerWidth > 1180 && burger.getAttribute('aria-expanded') === 'true') setMenu(false); });

  /* ---------- Animaciones al desplazarse ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); revealIO.unobserve(en.target); } });
  }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal]').forEach(el => revealIO.observe(el));

  // Contadores
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target, end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0);
      if (calm) { el.textContent = end.toFixed(dec); return; }
      const t0 = performance.now(), dur = 1800;
      const step = t => { const x = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - x, 4);
        el.textContent = (end * e).toFixed(dec); if (x < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  // Parallax suave de imágenes
  const pars = $$('[data-parallax]');
  function parallax() {
    if (calm) return;
    for (const el of pars) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const c = (r.top + r.height / 2 - innerHeight / 2);
      el.style.transform = `translate3d(0,${(c * parseFloat(el.dataset.parallax)).toFixed(1)}px,0)`;
    }
  }
  parallax(); wa.classList.toggle('is-hero', scrollY < innerHeight * .6);

  /* ---------- Habitaciones: inclinación 3D ---------- */
  if (finePointer && !calm) {
    $$('[data-tilt]').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', ((x - .5) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((.5 - y) * 6).toFixed(2) + 'deg');
        card.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Reserva ---------- */
  const bf = $('#booking-form'), bIn = $('#b-in'), bOut = $('#b-out'), bRoom = $('#b-room'), bAd = $('#b-ad'), bNi = $('#b-ni');
  const bName = $('#b-name'), bPhone = $('#b-phone');
  const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const parse = v => v ? new Date(v + 'T12:00:00') : null;
  const today = new Date(); today.setHours(12, 0, 0, 0);
  bIn.min = iso(today); bIn.value = iso(addDays(today, 1));
  bOut.min = iso(addDays(today, 1)); bOut.value = iso(addDays(today, 4));
  let bTried = false;

  // Seleccionar habitación desde las tarjetas
  $$('[data-book]').forEach(btn => btn.addEventListener('click', () => {
    bRoom.value = btn.dataset.book;
    syncGuests(); summary();
    bookingSec.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    toast(`Habitación ${H.habitaciones[btn.dataset.book].nombre} seleccionada. Elige tus fechas.`);
    setTimeout(() => bIn.focus({ preventScroll: true }), calm ? 0 : 900);
  }));

  // Contadores de huéspedes
  function cap() { return H.habitaciones[bRoom.value]; }
  function syncGuests() {
    const c = cap();
    bAd.max = c.adultos; bNi.max = Math.max(0, c.total - 1);
    $$('[data-step]').forEach(b => {
      const inp = $('#' + b.dataset.for), v = +inp.value, d = +b.dataset.step;
      b.disabled = d < 0 ? v <= +inp.min : v >= +inp.max || (+bAd.value + +bNi.value) >= c.total;
    });
  }
  $$('[data-step]').forEach(b => b.addEventListener('click', () => {
    const inp = $('#' + b.dataset.for);
    inp.value = Math.min(+inp.max, Math.max(+inp.min, +inp.value + +b.dataset.step));
    syncGuests(); summary(); if (bTried) validateBooking();
  }));
  [bAd, bNi].forEach(inp => inp.addEventListener('change', () => {
    inp.value = Math.min(+inp.max, Math.max(+inp.min, parseInt(inp.value, 10) || +inp.min));
    syncGuests(); summary(); if (bTried) validateBooking();
  }));
  bRoom.addEventListener('change', () => { syncGuests(); summary(); if (bTried) validateBooking(); });
  bIn.addEventListener('change', () => {
    const a = parse(bIn.value);
    if (a) { bOut.min = iso(addDays(a, 1)); const b = parse(bOut.value); if (!b || b <= a) bOut.value = iso(addDays(a, 2)); }
    summary(); if (bTried) validateBooking();
  });
  bOut.addEventListener('change', () => { summary(); if (bTried) validateBooking(); });
  [bName, bPhone].forEach(i => i.addEventListener('input', () => { if (bTried) validateBooking(); }));

  function nights() {
    const a = parse(bIn.value), b = parse(bOut.value);
    return a && b ? Math.round((b - a) / 864e5) : 0;
  }
  function summary() {
    const n = nights(), r = cap();
    $('#s-nights').textContent = n > 0 ? `${n} ${n === 1 ? 'noche' : 'noches'}` : '—';
    $('#s-rate').textContent = money(r.precio);
    $('#s-total').textContent = n > 0 && n <= H.maxNoches ? money(n * r.precio) : '—';
  }

  function setErr(input, id, msg) {
    $('#' + id).textContent = msg || '';
    if (input) { input.classList.toggle('is-invalid', !!msg); input.setAttribute('aria-invalid', String(!!msg)); if (msg) input.setAttribute('aria-describedby', id); else input.removeAttribute('aria-describedby'); }
    return !msg;
  }
  const phoneOk = v => /^\+?[\d\s()-]{7,20}$/.test(v.trim()) && v.replace(/\D/g, '').length >= 7;

  function validateBooking() {
    const a = parse(bIn.value), b = parse(bOut.value), n = nights(), c = cap(), g = +bAd.value + +bNi.value;
    const r = [
      setErr(bIn, 'b-in-err', !a ? 'Elige la fecha de entrada.' : a < today ? 'La fecha de entrada no puede ser anterior a hoy.' : ''),
      setErr(bOut, 'b-out-err', !b ? 'Elige la fecha de salida.' : a && n < 1 ? 'La salida debe ser posterior a la entrada.' : n > H.maxNoches ? `Máximo ${H.maxNoches} noches por reserva en línea.` : ''),
      setErr($('.stepper'), 'b-guests-err', +bAd.value < 1 ? 'Debe viajar al menos un adulto.' : +bAd.value > c.adultos || g > c.total ? `La habitación ${c.nombre} admite hasta ${c.total} ${c.total === 1 ? 'huésped' : 'huéspedes'}${c.adultos < c.total ? ` (${c.adultos} adultos)` : ''}.` : ''),
      setErr(bName, 'b-name-err', bName.value.trim().length < 3 ? 'Escribe tu nombre completo.' : ''),
      setErr(bPhone, 'b-phone-err', !bPhone.value.trim() ? 'Necesitamos un teléfono para confirmar.' : !phoneOk(bPhone.value) ? 'Escribe un teléfono válido (solo números, espacios y +).' : '')
    ];
    return r.every(Boolean);
  }

  const fmt = v => parse(v).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  bf.addEventListener('submit', e => {
    e.preventDefault(); bTried = true;
    if (!validateBooking()) { const first = $('.is-invalid', bf) || $('.err:not(:empty)', bf); (first.matches('input,select') ? first : bIn).focus(); toast('Revisa los campos marcados.'); return; }
    const c = cap(), n = nights(), code = 'PRS-' + Date.now().toString(36).slice(-5).toUpperCase();
    const data = { code, habitacion: c.nombre, entrada: bIn.value, salida: bOut.value, noches: n, adultos: +bAd.value, ninos: +bNi.value, total: n * c.precio, nombre: bName.value.trim(), telefono: bPhone.value.trim(), creada: new Date().toISOString() };
    store.push('paraiso-reservas', data);
    const rows = [['Habitación', c.nombre], ['Entrada', fmt(data.entrada)], ['Salida', fmt(data.salida)], ['Huéspedes', `${data.adultos} adulto${data.adultos > 1 ? 's' : ''}${data.ninos ? `, ${data.ninos} niño${data.ninos > 1 ? 's' : ''}` : ''}`], ['Total estimado', money(data.total)]];
    $('#d-list').replaceChildren(...rows.map(([k, v]) => { const li = document.createElement('li'); li.innerHTML = `<span></span><b></b>`; li.firstChild.textContent = k; li.lastChild.textContent = v; return li; }));
    $('#d-name').textContent = data.nombre.split(' ')[0];
    $('#d-code').textContent = code;
    $('#d-wa').href = waLink(`Hola ${H.nombre}, quiero confirmar mi solicitud de reserva ${code}:\n• Habitación: ${c.nombre}\n• Entrada: ${fmt(data.entrada)}\n• Salida: ${fmt(data.salida)} (${n} noche${n > 1 ? 's' : ''})\n• Huéspedes: ${rows[3][1]}\n• Total estimado: ${money(data.total)}\n• Nombre: ${data.nombre}\n• Teléfono: ${data.telefono}`);
    bf.hidden = true; const done = $('#booking-done'); done.hidden = false; done.focus();
  });
  $('#d-new').addEventListener('click', () => { $('#booking-done').hidden = true; bf.hidden = false; bTried = false; bName.value = ''; bPhone.value = ''; bIn.focus(); });
  syncGuests(); summary();

  /* ---------- Proyectos / experiencias ---------- */
  const items = $$('.xp-item'), slides = $$('.xp-slide'), bar = $('#xp-bar'), xp = $('.xp'), xpCta = $('#xp-cta');
  const XP_MS = 6500; let xpI = 0, xpT = 0, xpPaused = false, xpVisible = false;
  function xpGo(i, user) {
    xpI = (i + items.length) % items.length;
    items.forEach((b, j) => { const on = j === xpI; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    slides.forEach((s, j) => s.classList.toggle('is-on', j === xpI));
    if (user) xpPaused = true;
    xpTimer();
  }
  function xpTimer() {
    clearTimeout(xpT);
    bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)';
    if (xpPaused || !xpVisible || calm) return;
    void bar.offsetWidth;
    bar.style.transition = `transform ${XP_MS}ms linear`; bar.style.transform = 'scaleX(1)';
    xpT = setTimeout(() => xpGo(xpI + 1), XP_MS);
  }
  items.forEach((b, i) => {
    b.addEventListener('click', () => xpGo(i, true));
    b.addEventListener('keydown', e => {
      const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); xpGo(i + d, true); items[xpI].focus(); }
    });
  });
  xp.addEventListener('pointerenter', () => { xpPaused = true; xpTimer(); });
  xp.addEventListener('pointerleave', () => { xpPaused = false; xpTimer(); });
  new IntersectionObserver(([en]) => { xpVisible = en.isIntersecting; xpTimer(); }, { threshold: .35 }).observe(xp);
  xpCta.addEventListener('click', () => {
    const it = items[xpI]; $('#c-subject').value = it.dataset.subject;
    const msg = $('#c-msg'); if (!msg.value) { msg.value = `Hola, me interesa ${$('b', it).textContent}. ¿Podrían darme más información y disponibilidad?`; msg.dispatchEvent(new Event('input')); }
    setTimeout(() => $('#c-name').focus({ preventScroll: true }), calm ? 0 : 900);
  });
  xpGo(0);

  /* ---------- Galería ---------- */
  const GALERIA = [
    ['g01', 'ambientes', 'Piscina de borde infinito al atardecer', 700, 906],
    ['g02', 'habitaciones', 'Dormitorio con ventanales y luz natural', 700, 467],
    ['g03', 'sabores', 'Restaurante Brisa', 700, 467],
    ['g04', 'ambientes', 'Terraza y piscina frente a la bahía', 700, 467],
    ['g05', 'habitaciones', 'Suite con iluminación cálida', 700, 467],
    ['g06', 'sabores', 'Rituales del Spa Aurora', 700, 467],
    ['g07', 'ambientes', 'Piscina rodeada de palmeras', 700, 525],
    ['g08', 'habitaciones', 'Baño con ducha de lluvia', 700, 525],
    ['g09', 'sabores', 'Café y bar del lobby', 700, 467],
    ['g10', 'ambientes', 'Palmeras junto a la piscina', 700, 875],
    ['g11', 'habitaciones', 'Habitación con vista a las montañas', 700, 467],
    ['g12', 'ambientes', 'Piscina del jardín', 700, 467],
    ['g13', 'habitaciones', 'Habitación clásica', 700, 525],
    ['g14', 'ambientes', 'Fachada iluminada al anochecer', 700, 394],
    ['g15', 'habitaciones', 'Habitación ejecutiva', 700, 467],
    ['g16', 'ambientes', 'Atardecer en la piscina principal', 700, 467]
  ];
  const masonry = $('#masonry');
  masonry.replaceChildren(...GALERIA.map(([id, cat, cap, w, h], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'shot'; b.dataset.cat = cat; b.dataset.i = i;
    b.setAttribute('aria-label', `Ampliar imagen: ${cap}`);
    b.innerHTML = `<img src="assets/img/galeria/${id}-min.webp" alt="" width="${w}" height="${h}" loading="lazy" decoding="async"><span class="shot-cap"><span></span><svg class="ico" aria-hidden="true"><use href="#i-expand"/></svg></span>`;
    $('img', b).alt = cap; $('.shot-cap span', b).textContent = cap;
    b.setAttribute('data-reveal', 'zoom'); b.style.setProperty('--d', `${(i % 3) * .07}s`);
    revealIO.observe(b);
    return b;
  }));
  const shots = $$('.shot', masonry);
  $$('.chip').forEach(chip => chip.addEventListener('click', () => {
    $$('.chip').forEach(c => { const on = c === chip; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
    const f = chip.dataset.filter;
    shots.forEach(s => { const show = f === 'todo' || s.dataset.cat === f; s.classList.toggle('is-hidden', !show); if (show) s.classList.add('is-in'); });
  }));

  // Visor (lightbox)
  const lb = $('#lightbox'), lbImg = $('#lb-img');
  let lbList = [], lbI = 0, lbReturn = null;
  function lbShow(i) {
    lbI = (i + lbList.length) % lbList.length;
    const [id, , cap] = GALERIA[lbList[lbI]];
    lbImg.classList.add('is-loading');
    const src = `assets/img/galeria/${id}.webp`;
    const pre = new Image(); pre.src = src;
    const done = () => { lbImg.src = src; lbImg.alt = cap; lbImg.classList.remove('is-loading'); };
    pre.decode ? pre.decode().then(done, done) : (pre.onload = done);
    $('#lb-cap').textContent = cap;
    $('#lb-count').textContent = `${lbI + 1} / ${lbList.length}`;
    [1, -1].forEach(d => { const n = GALERIA[lbList[(lbI + d + lbList.length) % lbList.length]][0]; new Image().src = `assets/img/galeria/${n}.webp`; });
  }
  function lbOpen(i) {
    lbList = shots.filter(s => !s.classList.contains('is-hidden')).map(s => +s.dataset.i);
    lbReturn = document.activeElement;
    lb.hidden = false; document.body.classList.add('is-locked');
    requestAnimationFrame(() => lb.classList.add('is-open'));
    lbShow(lbList.indexOf(i)); $('#lb-close').focus();
  }
  function lbClose() {
    lb.classList.remove('is-open'); document.body.classList.remove('is-locked');
    setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, 350);
    lbReturn && lbReturn.focus();
  }
  shots.forEach(s => s.addEventListener('click', () => lbOpen(+s.dataset.i)));
  $('#lb-close').addEventListener('click', lbClose);
  $('#lb-prev').addEventListener('click', () => lbShow(lbI - 1));
  $('#lb-next').addEventListener('click', () => lbShow(lbI + 1));
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-fig')) lbClose(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    else if (e.key === 'ArrowRight') lbShow(lbI + 1);
    else if (e.key === 'ArrowLeft') lbShow(lbI - 1);
    else if (e.key === 'Tab') { // Mantener el foco dentro del visor
      const f = $$('.lb-btn', lb), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let sx = 0, sy = 0;
  lb.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) lbShow(lbI + (dx < 0 ? 1 : -1));
  });

  /* ---------- Contacto ---------- */
  const cf = $('#contact-form'), cName = $('#c-name'), cEmail = $('#c-email'), cPhone = $('#c-phone'), cSub = $('#c-subject'), cMsg = $('#c-msg'), cOk = $('#c-ok');
  let cTried = false;
  cMsg.addEventListener('input', () => { $('#c-count').textContent = `${cMsg.value.length} / 600`; });
  function validateContact() {
    const email = cEmail.value.trim();
    const r = [
      setErr(cName, 'c-name-err', cName.value.trim().length < 2 ? 'Escribe tu nombre.' : ''),
      setErr(cEmail, 'c-email-err', !email ? 'Escribe tu correo electrónico.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Ese correo no parece válido (ej. nombre@correo.com).' : ''),
      setErr(cPhone, 'c-phone-err', cPhone.value.trim() && !phoneOk(cPhone.value) ? 'Escribe un teléfono válido o deja el campo vacío.' : ''),
      setErr(cSub, 'c-subject-err', !cSub.value ? 'Elige un asunto.' : ''),
      setErr(cMsg, 'c-msg-err', cMsg.value.trim().length < 15 ? 'Cuéntanos un poco más (mínimo 15 caracteres).' : ''),
      setErr(cOk, 'c-ok-err', !cOk.checked ? 'Necesitamos tu autorización para responderte.' : '')
    ];
    return r.every(Boolean);
  }
  cf.addEventListener('input', () => { if (cTried) validateContact(); });
  cf.addEventListener('change', () => { if (cTried) validateContact(); });
  cf.addEventListener('submit', e => {
    e.preventDefault(); cTried = true;
    if (!validateContact()) { $('.is-invalid', cf).focus(); toast('Revisa los campos marcados.'); return; }
    const d = { nombre: cName.value.trim(), email: cEmail.value.trim(), telefono: cPhone.value.trim(), asunto: cSub.value, mensaje: cMsg.value.trim(), creada: new Date().toISOString() };
    store.push('paraiso-mensajes', d);
    const body = `${d.mensaje}\n\n— ${d.nombre}\n${d.email}${d.telefono ? '\n' + d.telefono : ''}`;
    $('#cd-name').textContent = d.nombre.split(' ')[0];
    $('#cd-wa').href = waLink(`Hola ${H.nombre}, les escribe ${d.nombre}.\nAsunto: ${d.asunto}\n\n${body}`);
    $('#cd-mail').href = `mailto:${H.email}?subject=${encodeURIComponent(`${d.asunto} · Consulta web`)}&body=${encodeURIComponent(body)}`;
    cf.hidden = true; const done = $('#contact-done'); done.hidden = false; done.focus();
  });
  $('#cd-new').addEventListener('click', () => { cf.reset(); cTried = false; $('#c-count').textContent = '0 / 600'; $('#contact-done').hidden = true; cf.hidden = false; cName.focus(); });

  /* ---------- Varios ---------- */
  $('#to-top').addEventListener('click', () => scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' }));
  setTimeout(() => { wa.classList.add('is-hint'); setTimeout(() => wa.classList.remove('is-hint'), 4000); }, 7000);
})();
