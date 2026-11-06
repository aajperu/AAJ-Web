/* AAJ! — movimiento de la copia experimental. Sin dependencias externas. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('motion') === 'off') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 720px)');
  const clamp = value => Math.max(0, Math.min(1, value));
  const titles = [...document.querySelectorAll('#hero-title:not([data-physics]), [data-exp-art]:not([data-physics])')].map(host => ({
    host, image: host.querySelector('img'), svg: host.querySelector('.exp-hero-pieces, .exp-art-pieces'), played: false
  })).filter(title => title.image && title.svg);
  const singleTitles = [...document.querySelectorAll('.activity-heading > span > img')].map(element => ({element, played: false}));
  const timeline = document.querySelector('ol.timeline');
  let scene, track, trackTop = 0, trackHeight = 0, frame = 0, timelineAmount = 0;
  const animations = new Set();

  if (timeline) {
    scene = document.createElement('div'); scene.className = 'exp-timeline-scene';
    timeline.before(scene); scene.append(timeline);
    track = document.createElement('div'); track.className = 'exp-timeline-track';
    track.setAttribute('aria-hidden', 'true');
    const progress = document.createElement('span'); progress.className = 'exp-timeline-progress';
    track.append(progress); scene.prepend(track);
  }
  function measureTitles() {
    for (const title of titles) {
      if (title.host.id === 'hero-title') continue;
      Object.assign(title.svg.style, {
        left: `${title.image.offsetLeft}px`, top: `${title.image.offsetTop}px`,
        width: `${title.image.offsetWidth}px`, height: `${title.image.offsetHeight}px`
      });
    }
  }
  function measureTimeline() {
    if (!scene || reduced.matches) return;
    const items = [...timeline.children], box = scene.getBoundingClientRect();
    if (!box.width || !box.height || !items.length) return;
    const first = items[0].getBoundingClientRect(), last = items.at(-1).getBoundingClientRect();
    if (mobile.matches) {
      const title = items[0].querySelector('h3').getBoundingClientRect();
      trackTop = first.top - box.top; trackHeight = last.bottom - first.top;
      Object.assign(track.style, {left: `${title.left - box.left}px`, top: `${trackTop}px`, width: '2.75px', height: `${trackHeight}px`});
    } else {
      const number = items[0].querySelector('.step-number');
      const heading = items[0].querySelector('h3');
      const numberBox = number.getBoundingClientRect(), headingBox = heading.getBoundingClientRect();
      const numberStyle = getComputedStyle(number), headingStyle = getComputedStyle(heading);
      const numberBottom = numberBox.bottom - box.top - (parseFloat(numberStyle.paddingBottom) || 0) - (parseFloat(numberStyle.borderBottomWidth) || 0);
      const headingTop = headingBox.top - box.top + (parseFloat(headingStyle.paddingTop) || 0) + (parseFloat(headingStyle.borderTopWidth) || 0);
      trackHeight = 3.75;
      trackTop = (numberBottom + headingTop) / 2 - trackHeight / 2;
      Object.assign(track.style, {left: `${first.left - box.left}px`, top: `${trackTop}px`, width: `${last.right - first.left}px`, height: '3.75px'});
    }
    scene.classList.add('exp-timeline-ready');
  }
  function playTitle(title) {
    title.played = true;
    const prefix = title.host.id === 'hero-title' ? 'exp-hero' : 'exp-art';
    title.host.classList.add(`${prefix}-ready`, `${prefix}-play`);
    const last = Math.max(...[...title.svg.querySelectorAll('.exp-hero-strip')].map(piece => Number(piece.dataset.piece)));
    const settle = () => title.host.classList.add(`${prefix}-settled`);
    title.svg.addEventListener('animationend', event => {
      if (event.animationName === 'exp-band-place' && Number(event.target.dataset.piece) === last) settle();
    });
    setTimeout(settle, 800 + last * 110);
  }
  function update() {
    frame = 0;
    if (reduced.matches) return;
    const viewport = innerHeight;
    const atBottom = scrollY + viewport >= document.documentElement.scrollHeight - 2;
    for (const title of titles) {
      const box = title.image.getBoundingClientRect();
      if (!title.played && box.width && box.height && (box.top <= viewport * 2 / 3 || (atBottom && box.top < viewport)) && box.bottom > 0) playTitle(title);
    }
    for (const title of singleTitles) {
      const box = title.element.getBoundingClientRect();
      if (title.played || !box.width || !box.height || (box.top > viewport * 2 / 3 && !(atBottom && box.top < viewport)) || box.bottom <= 0) continue;
      title.played = true;
      title.element.classList.add('exp-single-played');
      if (!title.element.animate) continue;
      const animation = title.element.animate([
        {opacity: 0, translate: '-22px -16px', rotate: '-7deg'},
        {opacity: 1, translate: '0 0', rotate: '0deg'}
      ], {duration: 650, easing: 'cubic-bezier(.18,.8,.2,1.04)'});
      animations.add(animation);
      animation.finished.then(() => animations.delete(animation)).catch(() => animations.delete(animation));
    }
    if (scene?.classList.contains('exp-timeline-ready')) {
      const box = scene.getBoundingClientRect();
      const amount = mobile.matches
        ? clamp((viewport * 2 / 3 - box.top - trackTop) / Math.max(1, trackHeight))
        : clamp((viewport * 2 / 3 - box.top - trackTop) / Math.max(1, viewport * .38));
      // Una vez revelado, el contenido permanece legible al volver hacia arriba.
      timelineAmount = Math.max(timelineAmount, atBottom ? 1 : amount);
      scene.style.setProperty('--exp-timeline-progress', String(timelineAmount));
      [...timeline.children].forEach(item => {
        item.style.setProperty('--exp-step-opacity', '1');
      });
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  function refresh() {
    if (reduced.matches) {
      for (const title of titles) {
        const prefix = title.host.id === 'hero-title' ? 'exp-hero' : 'exp-art';
        title.host.classList.add(`${prefix}-settled`);
      }
      for (const animation of animations) animation.cancel();
      animations.clear();
      scene?.classList.remove('exp-timeline-ready');
      return;
    }
    measureTitles(); measureTimeline(); schedule();
  }
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', refresh, {passive: true});
  addEventListener('hashchange', () => requestAnimationFrame(refresh));
  addEventListener('pageshow', refresh);
  addEventListener('beforeprint', () => document.body.classList.add('exp-print'));
  addEventListener('afterprint', () => document.body.classList.remove('exp-print'));
  reduced.addEventListener('change', refresh);
  mobile.addEventListener('change', refresh);
  if (document.fonts) document.fonts.ready.then(refresh);
  document.querySelectorAll('[data-exp-art] > img').forEach(image => image.addEventListener('load', refresh));
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(refresh);
    titles.forEach(title => observer.observe(title.image));
    if (scene) observer.observe(scene);
  }
  refresh();
})();
