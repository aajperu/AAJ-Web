/* Arrastre de bandas: independiente de las animaciones de entrada. */
(() => {
  'use strict';
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const vector = (matrix, x, y) => ({x: matrix.a*x + matrix.c*y, y: matrix.b*x + matrix.d*y});
  const limits = (section, box, viewport) => ({
    minX: Math.min(0, Math.max(0, section.left) - box.left),
    maxX: Math.max(0, Math.min(viewport, section.right) - box.right),
    minY: Math.min(0, section.top - box.top),
    maxY: Math.max(0, section.bottom - box.bottom)
  });
  const snap = (x, y) => Math.hypot(x,y) < 18 ? {x:0,y:0} : {x:Math.round(x/16)*16,y:Math.round(y/16)*16};
  if (typeof module !== 'undefined' && module.exports) { module.exports = {clamp, vector, limits, snap}; return; }
  if (!window.PointerEvent || !window.DOMMatrix) return;
  const ns = 'http://www.w3.org/2000/svg';
  const states = [], hosts = new Set(), refreshDrag = [];
  let active, toolbar, status, announcement;
  let overBand = false, bandFocused = false, overToolbar = false, controlsInView = true, controlsTimer;
  function updateControls(delay = false) {
    clearTimeout(controlsTimer);
    const apply = () => { if (toolbar) toolbar.hidden = !(innerWidth > 720 && controlsInView && (overBand || bandFocused || overToolbar)); };
    if (delay) controlsTimer = setTimeout(apply, 180); else apply();
  }
  const make = tag => document.createElementNS(ns, tag);
  function announce(message) {
    if (!status) return;
    clearTimeout(announcement); status.textContent = '';
    announcement = setTimeout(() => { status.textContent = message; }, 80);
  }
  function render(state) {
    for (const group of state.groups) group.setAttribute('transform', `translate(${state.x} ${state.y})`);
    if (typeof CustomEvent !== 'undefined') {
      dispatchEvent(new CustomEvent('aaj:composition-change', {detail: {
        movingHandle: state.handle,
        bands: states.filter(band => band.host === state.host).map(band => ({
          handle: band.handle, moved: Math.abs(band.x) + Math.abs(band.y) > .5
        }))
      }}));
    }
  }
  function show(state) { state.host.classList.add('exp-drag-touched'); }
  function resetAll() {
    if (active) stop(null, true);
    for (const state of states) { state.x = 0; state.y = 0; render(state); }
    for (const host of hosts) host.classList.remove('exp-drag-touched');
    announce('Títulos restablecidos a su posición original.');
  }
  function controls() {
    if (toolbar) return;
    toolbar = document.createElement('aside'); toolbar.className = 'exp-play-controls';
    toolbar.setAttribute('aria-label', 'Experimento de composición');
    toolbar.hidden = true;
    toolbar.addEventListener('pointerenter', () => { overToolbar = true; updateControls(); });
    toolbar.addEventListener('pointerleave', () => { overToolbar = false; updateControls(true); });
    toolbar.addEventListener('focusin', () => { overToolbar = true; updateControls(); });
    toolbar.addEventListener('focusout', () => { overToolbar = false; updateControls(true); });
    const help = document.createElement('span'); help.id = 'exp-drag-help';
    help.textContent = 'Arrastra los títulos'; help.title = 'Con teclado: flechas para mover, Inicio o Escape para restablecer una banda.';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Restablecer';
    button.addEventListener('click', resetAll);
    const instructions = document.createElement('span'); instructions.className = 'sr-only'; instructions.id = 'exp-drag-instructions';
    instructions.textContent = 'Usa las flechas para mover la banda. Mayúsculas mueve más rápido. Inicio o Escape devuelve la banda a su posición original.';
    status = document.createElement('span'); status.className = 'sr-only'; status.setAttribute('role','status');
    status.setAttribute('aria-live','polite'); status.setAttribute('aria-atomic','true');
    toolbar.append(help,button,instructions,status); document.body.append(toolbar);
    const playground=document.querySelector('.hero-grid, .call-hero');
    if (playground && 'IntersectionObserver' in window) {
      const observer=new IntersectionObserver(([entry])=>{
        controlsInView = entry.isIntersecting; updateControls();
      });
      observer.observe(playground);
    }
  }
  function geometry(state) {
    const matrix = state.svg.getScreenCTM();
    if (!matrix || !Number.isFinite(matrix.a) || Math.abs(matrix.a*matrix.d-matrix.b*matrix.c) < .000001) return null;
    const box = state.handle.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    return {matrix, inverse:matrix.inverse(), bounds:limits(state.section.getBoundingClientRect(),box,innerWidth)};
  }
  function moveBy(state, dx, dy, measured = geometry(state), origin = state) {
    if (!measured) return;
    const b = measured.bounds;
    const local = vector(measured.inverse,clamp(dx,b.minX,b.maxX),clamp(dy,b.minY,b.maxY));
    state.x = origin.x + local.x; state.y = origin.y + local.y; render(state);
  }
  function start(event, state) {
    if (innerWidth <= 720 || active || !event.isPrimary || event.button !== 0) return;
    const measured = geometry(state); if (!measured) return;
    show(state); state.handle.focus({preventScroll:true});
    active = {state, measured, pointer:event.pointerId, clientX:event.clientX, clientY:event.clientY, x:state.x,y:state.y};
    state.handle.setPointerCapture(event.pointerId);
    state.host.classList.add('exp-is-dragging');
    event.preventDefault();
  }
  function move(event) {
    if (!active || event.pointerId !== active.pointer) return;
    moveBy(active.state,event.clientX-active.clientX,event.clientY-active.clientY,active.measured,active);
  }
  function stop(event, cancel = false) {
    if (!active || (event && event.pointerId !== active.pointer)) return;
    const drag = active; active = null;
    drag.state.host.classList.remove('exp-is-dragging');
    if (cancel) { drag.state.x=drag.x; drag.state.y=drag.y; render(drag.state); }
    else {
      const measured = geometry(drag.state);
      if (measured) {
        const screen = vector(measured.matrix,drag.state.x,drag.state.y), target = snap(screen.x,screen.y);
        moveBy(drag.state,target.x-screen.x,target.y-screen.y,measured);
      }
      announce(`Banda ${drag.state.name} colocada.`);
    }
    if (drag.state.handle.hasPointerCapture(drag.pointer)) drag.state.handle.releasePointerCapture(drag.pointer);
  }
  function keyboard(event,state) {
    if (innerWidth <= 720) return;
    if (event.key === 'Home' || event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); if (active?.state === state) stop(null,true);
      state.x=0;state.y=0;render(state);announce(`Banda ${state.name} restablecida.`);return;
    }
    const direction = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if (!direction) return;
    event.preventDefault();show(state);
    const step=event.shiftKey?40:12;moveBy(state,direction[0]*step,direction[1]*step);
  }
  function initialize(host,image,svg,names) {
    if (hosts.has(host)) return;
    hosts.add(host); host.classList.add('exp-drag-host');
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    const section = host.closest('.hero-grid, .call-hero') || host.closest('section') || host;
    const models = new Map();
    const pieces = [...svg.querySelectorAll('.exp-hero-strip')];
    for (const piece of pieces) {
      const id=Number(piece.dataset.piece), outer=make('g');
      piece.before(outer);outer.append(piece);
      if (!models.has(id)) models.set(id,{x:0,y:0,accepted:{x:0,y:0},groups:[],host,svg,section,name:names[id]||image.alt||'Título'});
      const state=models.get(id);state.groups.push(outer);
      if (!state.handle) {
        state.handle=outer;
        outer.classList.add('exp-drag-handle');outer.setAttribute('role','button');outer.setAttribute('tabindex','-1');
        outer.setAttribute('focusable','true');outer.setAttribute('aria-label',`Mover banda ${state.name}`);
        outer.setAttribute('aria-describedby','exp-drag-instructions');
        outer.addEventListener('pointerdown',event=>start(event,state));
        outer.addEventListener('pointermove',move);
        outer.addEventListener('pointerup',event=>stop(event));
        outer.addEventListener('pointercancel',event=>stop(event,true));
        outer.addEventListener('lostpointercapture',event=>stop(event,true));
        outer.addEventListener('keydown',event=>keyboard(event,state));
        outer.addEventListener('focus',()=>{ show(state); bandFocused = true; updateControls(); });
        outer.addEventListener('blur',()=>{ bandFocused = false; updateControls(true); });
        outer.addEventListener('pointerenter',event=>{ if (!event.pointerType || event.pointerType === 'mouse') { overBand = true; updateControls(); } });
        outer.addEventListener('pointerleave',()=>{ overBand = false; updateControls(true); });
      } else {outer.classList.add('exp-drag-foreground');outer.setAttribute('aria-hidden','true');}
    }
    states.push(...models.values());
    let enabled = false;
    function enable() {
      if (innerWidth <= 720) {
        if (enabled) {
          host.classList.remove('exp-drag-ready', 'exp-drag-touched');
          enabled = false;
        }
        svg.setAttribute('aria-hidden', 'true');
        for (const state of models.values()) state.handle.setAttribute('tabindex', '-1');
        overBand = false; bandFocused = false; overToolbar = false; updateControls();
        return;
      }
      if (enabled) return;
      const settled=host.classList.contains(host.id==='hero-title'?'exp-hero-settled':'exp-art-settled');
      const noMotion=matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('motion')==='off';
      if (!settled && !noMotion) return;
      controls();
      svg.removeAttribute('aria-hidden');svg.setAttribute('role','group');svg.setAttribute('aria-label','Bandas que puedes mover');
      enabled = true;
      for (const state of models.values()) state.handle.setAttribute('tabindex','0');
      host.classList.add('exp-drag-ready');
    }
    refreshDrag.push(enable);
    new MutationObserver(enable).observe(host,{attributes:true,attributeFilter:['class']});
    image.addEventListener('load',enable);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',enable);
    enable();
  }
  // Solo los títulos principales de Inicio y Convocatoria participan en el arrastre.
  for (const host of document.querySelectorAll('#hero-title, #call-title')) {
    const image=host.querySelector('img'),svg=host.querySelector('.exp-hero-pieces, .exp-art-pieces');
    if (!image || !svg) continue;
    const names=host.id==='hero-title'?['APUESTA','POR','ARTISTAS','JÓVENES']:['POSTULA','A LA','CONVOCATORIA'];
    initialize(host,image,svg,names);
  }
  addEventListener('aaj:composition-accept',()=>{
    for(const state of states)state.accepted={x:state.x,y:state.y};
  });
  addEventListener('aaj:composition-reject',event=>{
    const state=states.find(band=>band.handle===event.detail.handle);
    if(!state || (state.x===state.accepted.x && state.y===state.accepted.y))return;
    state.x=state.accepted.x;state.y=state.accepted.y;render(state);
  });
  let viewportWidth = innerWidth;
  addEventListener('resize',()=>{
    // La barra del navegador móvil cambia el alto al hacer scroll: no borra la composición.
    if (Math.abs(innerWidth-viewportWidth) > 1) { viewportWidth=innerWidth; resetAll(); }
    refreshDrag.forEach(refresh => refresh());
  },{passive:true});
  addEventListener('orientationchange',resetAll,{passive:true});
  addEventListener('beforeprint',resetAll);
  addEventListener('pagehide',()=>{if(active)stop(null,true)});
})();
