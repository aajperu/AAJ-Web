/* Entrada por grupos al cruzar el primer tercio desde abajo de la pantalla. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('motion') === 'off') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [...document.querySelectorAll('main p')]
    .filter(element => !element.matches('.sr-only, .curator-label-desktop') &&
      !element.closest('.curator-label, .contact, .legal-footer'))
    .map(element => ({element, played: false, animation: null}));
  const groups = new Map();
  entries.forEach(entry => {
    const group = entry.element.closest('.intro-copy, .program, .call-copy') || entry.element.closest('section') || entry.element;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(entry);
  });
  let frame = 0;
  if (typeof window !== 'undefined') clearTimeout(window.AAJ_ENTRY_SAFETY);
  function settle(entry) {
    entry.played = true;
    entry.element.classList.add('exp-drop-visible');
    entry.animation?.cancel();
    entry.animation = null;
  }
  function update() {
    frame = 0;
    const atBottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
    const ready = new Set();
    for (const group of groups.values()) {
      const boxes = group.map(entry => entry.element.getBoundingClientRect()).filter(box => box.width && box.height);
      if (!boxes.length) continue;
      const top = Math.min(...boxes.map(box => box.top));
      if (top <= innerHeight * 2 / 3 || (atBottom && top < innerHeight)) group.forEach(entry => ready.add(entry));
    }
    for (const entry of entries) {
      if (entry.played) continue;
      if (reduced.matches) { settle(entry); continue; }
      const box = entry.element.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      if (box.bottom <= 0) { settle(entry); continue; }
      if (!ready.has(entry)) continue;
      entry.played = true;
      entry.element.classList.add('exp-drop-visible');
      if (!entry.element.animate) continue;
      const side = entries.indexOf(entry) % 2 ? 1 : -1;
      const animation = entry.element.animate([
        {transform: `translate(${side * 14}px, -56px) rotate(${side * 2.8}deg)`, offset: 0},
        {transform: `translate(0, 7px) rotate(${-side * .5}deg)`, offset: .72},
        {transform: `translate(0, -2px) rotate(${side * .12}deg)`, offset: .9},
        {transform: 'translate(0, 0) rotate(0deg)', offset: 1}
      ], {duration: 620, delay: 0,
        easing: 'cubic-bezier(.2,.75,.3,1)', fill: 'backwards'});
      entry.animation = animation;
      const cleanup = () => { if (entry.animation === animation) entry.animation = null; };
      animation.finished.then(cleanup, cleanup);
      entry.element.addEventListener('focusin', () => settle(entry), {once: true});
      entry.element.addEventListener('pointerdown', () => settle(entry), {once: true});
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function settleAll() { entries.forEach(settle); }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', () => { entries.filter(entry => entry.animation).forEach(settle); schedule(); }, {passive: true});
  addEventListener('hashchange', schedule);
  addEventListener('pageshow', schedule);
  addEventListener('beforeprint', settleAll);
  addEventListener('aaj:copy-interaction', event => {
    entries.filter(entry => event.detail.root.contains(entry.element)).forEach(entry => {
      entry.played = true; settle(entry);
    });
  });
  reduced.addEventListener('change', () => {
    if (reduced.matches) { settleAll(); entries.forEach(entry => entry.played = true); }
  });
  if (!reduced.matches) schedule();
})();
