'use strict';

/* AAJ! — comportamiento de las dos páginas.
   Para cambiar contenido, usa los HTML o site-config.js. */
const config = window.AAJ_CONFIG || {};
const mobile = window.matchMedia('(max-width: 720px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const views = [...document.querySelectorAll('[data-view]')];
const menu = document.getElementById('mobile-menu');
const toggle = document.querySelector('.menu-toggle');
let menuTimer;

// 1. Navegación: secciones continuas en desktop, vistas independientes en móvil.
function syncLock() {
  document.documentElement.classList.toggle('scroll-locked', Boolean(document.querySelector('dialog[open]')));
}

function markCurrentNavigation(selected) {
  for (const link of document.querySelectorAll('.desktop-nav a, .menu-stage a')) {
    const href = link.getAttribute('href') || '';
    const current = views.length ? href.endsWith('#' + selected) : href === 'convocatoria.html';
    if (current) link.setAttribute('aria-current', views.length ? 'location' : 'page');
    else link.removeAttribute('aria-current');
  }
}

function setView({ scroll = false, focus = false } = {}) {
  if (!views.length) {
    markCurrentNavigation();
    return;
  }
  const requested = location.hash.slice(1);
  const selected = views.some(view => view.dataset.view === requested) ? requested : 'inicio';
  document.body.dataset.currentView = selected;
  for (const view of views) {
    const inactive = mobile.matches && view.dataset.view !== selected;
    view.classList.toggle('mobile-inactive', inactive);
    view.inert = inactive;
  }
  markCurrentNavigation(selected);
  if (!mobile.matches) return;
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.content = { inicio: '#fcff71', ediciones: '#9aff76', actividades: '#c2bdff', contacto: '#5d94ff' }[selected];
  if (scroll) window.scrollTo(0, 0);
  if (focus) {
    const heading = views.find(view => view.dataset.view === selected)?.querySelector('h1, h2, h3');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }
}

setView();
// Saltar al contenido conserva la sección móvil elegida; no cambia el hash a #contenido.
document.querySelector('.skip-link')?.addEventListener('click', event => {
  event.preventDefault();
  const main = document.getElementById('contenido');
  const activeView = views.find(view => view.dataset.view === document.body.dataset.currentView);
  const target = mobile.matches ? (activeView?.querySelector('h1, h2, h3') || main) : main;
  target?.setAttribute('tabindex', '-1');
  target?.focus({ preventScroll: true });
  if (mobile.matches) window.scrollTo(0, 0);
  else main?.scrollIntoView({ block: 'start' });
});
window.addEventListener('hashchange', () => setView({ scroll: true, focus: true }));
mobile.addEventListener('change', () => {
  closeMenu(true);
  setView();
});

// 2. Menú: dialog nativo, cierre con Escape y enlaces reales entre páginas.
function openMenu() {
  if (!mobile.matches || !menu || menu.open) return;
  clearTimeout(menuTimer);
  menu.classList.remove('is-closing', 'menu-ready');
  menu.showModal();
  syncLock();
  fitMenuComposition();
  toggle?.setAttribute('aria-expanded', 'true');
  requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
}

function closeMenu(immediate = false, after) {
  if (!menu?.open) {
    after?.();
    return;
  }
  clearTimeout(menuTimer);
  toggle?.setAttribute('aria-expanded', 'false');
  const finish = () => {
    menu.close();
    menu.classList.remove('is-open', 'is-closing', 'menu-ready');
    syncLock();
    after?.();
  };
  if (immediate || reducedMotion.matches) {
    finish();
    return;
  }
  menu.classList.add('is-closing');
  menuTimer = setTimeout(finish, 320);
}

toggle?.addEventListener('click', openMenu);
menu?.querySelector('.menu-close')?.addEventListener('click', () => closeMenu());
menu?.addEventListener('cancel', event => {
  event.preventDefault();
  closeMenu();
});
menu?.addEventListener('close', () => {
  toggle?.setAttribute('aria-expanded', 'false');
  syncLock();
});
menu?.addEventListener('animationend', event => {
  if (event.animationName === 'menu-fall' && event.target.classList.contains('menu-contact')) {
    menu.classList.add('menu-ready');
  }
});
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', event => {
  const target = new URL(link.href);
  const sameDocument = target.pathname === location.pathname || (location.pathname.endsWith('/') && target.pathname.endsWith('/index.html'));
  if (!sameDocument) {
    closeMenu(true);
    return;
  }
  event.preventDefault();
  closeMenu(false, () => {
    if (location.hash === target.hash) setView({ scroll: true, focus: true });
    else location.hash = target.hash;
  });
}));

function fitMenuComposition() {
  if (!menu || !mobile.matches) return;
  const headerHeight = menu.querySelector('.menu-head')?.offsetHeight || 90;
  const availableHeight = Math.max(1, menu.clientHeight - headerHeight - 8);
  // En un teléfono horizontal se permite desplazar el menú para mantenerlo legible.
  const shortViewport = availableHeight < 480;
  menu.classList.toggle('short-viewport', shortViewport);
  const scale = shortViewport ? Math.min(menu.clientWidth / 390, 1) : Math.min(menu.clientWidth / 390, availableHeight / 650);
  menu.style.setProperty('--menu-scale', String(scale));
  menu.style.setProperty('--menu-top', headerHeight + 'px');
  menu.style.setProperty('--menu-height', (headerHeight + 650 * scale) + 'px');
}
window.addEventListener('resize', fitMenuComposition);
document.fonts?.ready.then(fitMenuComposition);

// 3. Popups: texto inicial legible con lector de pantalla y retorno al botón que lo abrió.
function openContentDialog(dialog, initialFocus) {
  if (!dialog || dialog.open) return;
  const opener = document.activeElement;
  dialog.addEventListener('close', () => {
    if (opener?.isConnected && !opener.closest('[inert]')) opener.focus({ preventScroll: true });
  }, { once: true });
  dialog.showModal();
  if (initialFocus) dialog.querySelector(initialFocus)?.focus({ preventScroll: true });
  syncLock();
}

for (const dialog of document.querySelectorAll('dialog:not(.mobile-menu)')) {
  dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', syncLock);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
}
document.querySelector('.bio-open')?.addEventListener('click', () => openContentDialog(document.getElementById('bio-dialog'), '#bio-content'));
document.querySelector('[data-bases]')?.addEventListener('click', () => {
  if (config.basesUrl) {
    window.open(config.basesUrl, '_blank', 'noopener,noreferrer');
    return;
  }
  openContentDialog(document.getElementById('bases-dialog'));
});

// El enlace oficial funciona también sin JavaScript; la configuración puede actualizarlo.
if (config.instagramUrl) {
  for (const link of document.querySelectorAll('[data-instagram]')) link.href = config.instagramUrl;
}

// 4. Slideshow manual: flechas, teclado, gesto táctil, fundido y manejo de errores.
const carousel = document.querySelector('.slideshow');
if (carousel && config.slides?.length) {
  const slides = config.slides;
  const img = carousel.querySelector('.slide-image');
  const caption = carousel.querySelector('.slide-caption');
  const status = carousel.querySelector('.slide-status');
  let displayed = 0;
  let requested = 0;
  let sequence = 0;
  let incoming = null;
  let fade = null;

  function clearTransition() {
    fade?.cancel();
    incoming?.remove();
    fade = null;
    incoming = null;
  }

  function commitSlide(index, announce = true) {
    const slide = slides[index];
    img.src = slide.image;
    img.alt = slide.alt || slide.caption || 'Actividad de AAJ!';
    img.style.setProperty('--slide-position', slide.position || '50% 50%');
    caption.textContent = slide.caption || '';
    status.textContent = `Fotografía ${index + 1} de ${slides.length}${announce && slide.caption ? ': ' + slide.caption : ''}`;
    displayed = index;
  }

  async function show(index) {
    const target = (index + slides.length) % slides.length;
    requested = target;
    const token = ++sequence;
    clearTransition();
    const preload = new Image();
    preload.src = slides[target].image;
    try {
      await preload.decode();
    } catch {
      if (token === sequence) {
        status.textContent = 'No se pudo cargar la fotografía. Se mantiene la anterior; prueba con la siguiente.';
      }
      return;
    }
    if (token !== sequence) return;
    if (!reducedMotion.matches && target !== displayed && typeof preload.animate === 'function') {
      const layer = preload;
      layer.className = 'slide-image slide-image-incoming';
      layer.alt = '';
      layer.setAttribute('aria-hidden', 'true');
      layer.style.setProperty('--slide-position', slides[target].position || '50% 50%');
      img.parentElement.append(layer);
      incoming = layer;
      const animation = layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: 'ease-out', fill: 'forwards' });
      fade = animation;
      await animation.finished.catch(() => {});
      if (token !== sequence) {
        layer.remove();
        return;
      }
    }
    commitSlide(target);
    clearTransition();
    const next = new Image();
    next.src = slides[(target + 1) % slides.length].image;
  }

  // La primera entrada de site-config.js también controla la primera foto y su pie.
  commitSlide(0, false);
  const previous = carousel.querySelector('.slide-prev');
  const next = carousel.querySelector('.slide-next');
  previous?.addEventListener('click', () => show(requested - 1));
  next?.addEventListener('click', () => show(requested + 1));
  if (slides.length === 1) {
    previous.hidden = true;
    next.hidden = true;
  }
  carousel.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      show(requested + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let pointer = null;
  carousel.addEventListener('pointerdown', event => {
    if (event.target.closest('button') || event.pointerType === 'mouse') return;
    pointer = { x: event.clientX, y: event.clientY };
  });
  carousel.addEventListener('pointerup', event => {
    if (!pointer) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) show(requested + (dx < 0 ? 1 : -1));
  });
  carousel.addEventListener('pointercancel', () => { pointer = null; });
} else if (carousel) {
  // Respaldo si la configuración de la galería está vacía o no se cargó.
  const previous = carousel.querySelector('.slide-prev');
  const next = carousel.querySelector('.slide-next');
  if (previous) previous.hidden = true;
  if (next) next.hidden = true;
}

// El navegador puede intentar desplazar al ancla después de cargar una vista móvil.
window.addEventListener('load', () => {
  if (mobile.matches) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, 0)));
});
window.addEventListener('pageshow', () => {
  setView();
  if (mobile.matches) requestAnimationFrame(() => window.scrollTo(0, 0));
});

// 5. Medidas reales: se mantiene la separación al footer al cambiar pantalla o pie de foto.
// Instagram acompaña la primera línea de Dirección general cuando Contacto está visible.
{
  const footer = document.querySelector('.legal-footer');
  const direction = document.querySelector('.contact > p');
  const icon = footer?.querySelector('.instagram-link');
  const contactBrand = document.querySelector('.contact-heading .brand');
  let alignmentFrame = 0;
  function alignInstagram() {
    alignmentFrame = 0;
    if (!footer || !direction || !icon) return;
    const textBox = direction.getBoundingClientRect();
    const visible = !mobile.matches && textBox.width > 0 && textBox.height > 0;
    if (visible) {
      const style = getComputedStyle(direction);
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
      const footerTop = footer.getBoundingClientRect().top;
      let top = textBox.top - footerTop + (lineHeight - icon.offsetHeight) / 2;
      const brandBox = contactBrand?.getBoundingClientRect();
      // El icono conserva su tamaño, pero nunca invade el logo al estrechar la ventana.
      if (brandBox?.width && brandBox.height) top = Math.max(top, brandBox.bottom - footerTop + 12);
      footer.style.setProperty('--instagram-contact-top', `${top}px`);
    }
    footer.classList.toggle('instagram-at-contact', visible);
  }
  function scheduleInstagram() {
    if (!alignmentFrame) alignmentFrame = requestAnimationFrame(alignInstagram);
  }
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(scheduleInstagram);
    [footer, direction, contactBrand, document.querySelector('main')].filter(Boolean).forEach(element => observer.observe(element));
  }
  ['resize', 'load', 'pageshow', 'hashchange'].forEach(type => window.addEventListener(type, scheduleInstagram));
  document.fonts?.ready.then(scheduleInstagram);
  scheduleInstagram();
}

if (document.querySelector('.activities') && typeof ResizeObserver !== 'undefined') {
  const activitySizing = new ResizeObserver(() => {
    for (const [selector, variable, fallback] of [
      ['.site-header', '--header-height', 90],
      ['.legal-footer', '--footer-height', 75],
      ['.slide-caption', '--caption-height', 65]
    ]) {
      const height = document.querySelector(selector)?.offsetHeight || fallback;
      document.documentElement.style.setProperty(variable, height + 'px');
    }
  });
  for (const selector of ['.site-header', '.legal-footer', '.slide-caption']) {
    const element = document.querySelector(selector);
    if (element) activitySizing.observe(element);
  }
}
