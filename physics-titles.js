/* Gravedad dirigida y amortiguación del borrador aprobado.
   Cada fondo y su texto comparten el mismo movimiento. Sin interacción. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const disabled = new URLSearchParams(location.search).get('motion') === 'off';
  const stepSize = 1 / 120;
  const states = [];
  let frame = 0, last = 0, accumulator = 0;

  function finish(state) {
    state.done = true;
    for (const piece of state.pieces) {
      for (const el of piece.els) {
        el.removeAttribute('transform');
        el.style.visibility = 'visible';
      }
    }
    state.host.classList.add('aaj-physics-settled', state.key === 'home' ? 'exp-hero-settled' : 'exp-art-settled');
  }

  function measure(state) {
    const imageStyle = getComputedStyle(state.image);
    Object.assign(state.svg.style, {
      left: state.image.offsetLeft + 'px', top: state.image.offsetTop + 'px',
      width: imageStyle.width, height: imageStyle.height
    });
  }

  function prepare(state) {
    if (state.ready || !state.image.offsetWidth || !state.image.offsetHeight) return;
    state.host.classList.add('aaj-physics-ready');
    measure(state);
    const blocks = new Map();
    for (const [i, el] of [...state.svg.children].entries()) {
      if (el.tagName.toLowerCase() !== 'g') continue;
      const key = el.getAttribute('data-block') ?? String(i);
      if (!blocks.has(key)) blocks.set(key, []);
      blocks.get(key).push(el);
    }
    state.pieces = [...blocks.values()].map((els, i) => {
      // The first group is the band's background; additional groups are its text.
      const box = els[0].getBBox();
      return {els, box, anchor: box.y + box.height,
        offset: -(state.svg.viewBox.baseVal.height + box.height + 60), v: 0,
        angle: (i % 2 ? -1 : 1) * .075, av: 0, hit: false, settled: false,
        impact: 0, release: 0, cx: box.x + box.width / 2, cy: box.y + box.height / 2};
    }).sort((a, b) => b.anchor - a.anchor);
    state.pieces.forEach((p, i) => {
      p.release = i * .62;
      for (const el of p.els) el.style.visibility = 'hidden';
    });
    state.ready = true;
  }

  function physics(state, dt) {
    state.clock += dt;
    for (let i = 0; i < state.pieces.length; i++) {
      const p = state.pieces[i];
      if (state.clock < p.release || p.settled) continue;
      for (const el of p.els) el.style.visibility = 'visible';
      if (!p.hit) {
        p.v += 2200 * dt;
        p.offset += p.v * dt;
        p.angle *= .995;
        if (p.offset >= 0) {
          p.offset = 0; p.v = -p.v * .14; p.hit = true;
          p.impact = state.clock; p.av = (i % 2 ? -1 : 1) * .65;
          for (let j = 0; j < i; j++) {
            const lower = state.pieces[j];
            if (lower.hit && !lower.settled) {
              lower.v += 32 / (i - j);
              lower.av += (i % 2 ? -1 : 1) * .10 / (i - j);
            }
          }
        }
      } else {
        p.v += (-200 * p.offset - 22 * p.v) * dt;
        p.offset += p.v * dt;
        p.av += (-145 * p.angle - 19 * p.av) * dt;
        p.angle += p.av * dt;
        if (state.clock - p.impact > 1.6 && Math.abs(p.offset) < .06 && Math.abs(p.v) < .35 && Math.abs(p.angle) < .0015) {
          p.settled = true; p.offset = 0; p.angle = 0;
          for (const el of p.els) el.removeAttribute('transform');
        }
      }
    }
    if (state.pieces.every(p => p.settled) || state.clock > 10) finish(state);
  }

  function paint(state) {
    for (const p of state.pieces) {
      if (p.settled) continue;
      for (const el of p.els) el.setAttribute('transform',
        `translate(0 ${p.offset.toFixed(4)}) rotate(${(p.angle * 180 / Math.PI).toFixed(4)} ${p.cx} ${p.cy})`);
    }
  }

  function tick(t) {
    frame = 0;
    accumulator += Math.min((t - last) / 1000, .05);
    last = t;
    while (accumulator >= stepSize) {
      for (const state of states) if (state.playing && !state.done) physics(state, stepSize);
      accumulator -= stepSize;
    }
    for (const state of states) if (state.playing && !state.done) paint(state);
    if (states.some(s => s.playing && !s.done) && !document.hidden) frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (!frame && !document.hidden && states.some(s => s.playing && !s.done)) {
      last = performance.now(); accumulator = 0;
      frame = requestAnimationFrame(tick);
    }
  }

  function refresh() {
    for (const state of states) {
      if (reduced.matches || disabled) { finish(state); continue; }
      if (state.done || state.host.closest('.mobile-inactive')) continue;
      prepare(state);
      if (!state.ready) continue;
      measure(state);
      const box = state.image.getBoundingClientRect();
      const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
      if (!state.playing && box.width && box.height && box.bottom > 0 &&
          (box.top < innerHeight * 2 / 3 || (atBottom && box.top < innerHeight))) {
        state.playing = true;
        paint(state);
      }
    }
    schedule();
  }

  for (const host of document.querySelectorAll('[data-physics]')) {
    const image = host.querySelector(':scope > img');
    const svg = host.querySelector(':scope > .aaj-physics-svg');
    if (!image || !svg) continue;
    const state = {host, image, svg, key: host.dataset.physics, pieces: [], clock: 0, playing: false, ready: false, done: false};
    states.push(state);
    image.addEventListener('load', refresh);
  }
  addEventListener('scroll', refresh, {passive: true});
  addEventListener('resize', refresh, {passive: true});
  addEventListener('hashchange', () => requestAnimationFrame(refresh));
  addEventListener('pageshow', refresh);
  addEventListener('beforeprint', () => states.forEach(finish));
  reduced.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
    else refresh();
  });
  if (document.fonts) document.fonts.ready.then(refresh);
  refresh();
})();
