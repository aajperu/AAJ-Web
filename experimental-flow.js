/* Texto por grafemas: cada renglón ocupa ambos lados del contorno de las bandas. */
(() => {
 'use strict';
 function clipY(points,bound,keepAbove) {
  const output=[];
  for(let i=0;i<points.length;i++) {
   const a=points[i],b=points[(i+1)%points.length];
   const ai=keepAbove?a.y>=bound:a.y<=bound,bi=keepAbove?b.y>=bound:b.y<=bound;
   if(ai)output.push(a);
   if(ai!==bi) {const t=(bound-a.y)/(b.y-a.y);output.push({x:a.x+t*(b.x-a.x),y:bound});}
  }
  return output;
 }
 function freeIntervals(width,y,height,polygons,gap=5) {
  const blocked=[];
  for(const polygon of polygons) {
   const slice=clipY(clipY(polygon,y-gap,true),y+height+gap,false);
   if(!slice.length)continue;
   const left=Math.max(0,Math.min(...slice.map(p=>p.x))-gap),right=Math.min(width,Math.max(...slice.map(p=>p.x))+gap);
   if(right>left)blocked.push([left,right]);
  }
  blocked.sort((a,b)=>a[0]-b[0]);
  const result=[];let x=0;
  for(const [left,right] of blocked) {if(left>x)result.push([x,left]);x=Math.max(x,right);}
  if(x<width)result.push([x,width]);
  return result;
 }
 function layout(glyphs,width,lineHeight,polygons,gap=5,maxHeight=Infinity) {
  const positions=Array(glyphs.length).fill(null);
  let index=0,line=0;
  const lowest=Math.max(0,...polygons.flat().map(p=>p.y));
  const maxLines=Math.min(Math.ceil(lowest/lineHeight)+glyphs.length+10,Math.floor((maxHeight+.001)/lineHeight));
  while(index<glyphs.length && line<maxLines) {
   const y=line*lineHeight;
   for(const [left,right] of freeIntervals(width,y,lineHeight,polygons,gap)) {
    let x=left;
    while(index<glyphs.length) {
     const glyph=glyphs[index];
     if(glyph.space && x===left) {index++;continue;}
     if(x+glyph.width>right+.001)break;
     positions[index]={x,y};x+=glyph.width;index++;
    }
   }
   line++;
  }
  return {positions,height:Math.max(lineHeight,line*lineHeight),complete:index===glyphs.length};
 }
 function fit(glyphs,width,lineHeight,polygons,maxHeight,roomLeft=0,roomRight=0) {
  // Primero conserva la columna. Si faltan huecos, usa espacio lateral, nunca renglones extra.
  const extra=Math.max(roomLeft,roomRight);
  const steps=[0];for(let amount=24;amount<extra;amount+=24)steps.push(amount);
  if(extra)steps.push(extra);
  for(const amount of steps) {
   const left=Math.min(amount,roomLeft),right=Math.min(amount,roomRight);
   const shifted=polygons.map(points=>points.map(p=>({x:p.x+left,y:p.y})));
   const result=layout(glyphs,width+left+right,lineHeight,shifted,5,maxHeight);
   if(result.complete) {
    result.positions=result.positions.map(p=>p?{x:p.x-left,y:p.y}:null);
    return result;
   }
  }
  return null;
 }
 if(typeof module!=='undefined' && module.exports) {module.exports={clipY,freeIntervals,layout,fit};return;}
 const copy=document.querySelector('[data-view="inicio"] .intro-copy, .call-hero .call-copy');
 if(!copy)return;
 const canvas=document.createElement('canvas'),context=canvas.getContext('2d');
 if(!context)return;
 const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter('es',{granularity:'grapheme'}):null;
 const playground=copy.closest('.hero-grid, .call-hero');
 let entries=[],bands=[],lastPlans=[],movingHandle=null,frame=0,dirty=true,prepared=false;
 const accept=()=>dispatchEvent(new CustomEvent('aaj:composition-accept'));
 function restore(entry) {
  entry.element.classList.remove('exp-letter-active');
  if(entry.originalHeight)entry.element.style.height=entry.originalHeight;
  else entry.element.style.removeProperty('height');
 }
 function prepare() {
  if(prepared)return;
  dispatchEvent(new CustomEvent('aaj:copy-interaction',{detail:{root:copy}}));
  for(const element of copy.querySelectorAll(':scope > p')) {
   const source=document.createElement('span');source.className='exp-letter-source';
   source.append(...element.childNodes);element.append(source);
   const layer=document.createElement('span');layer.className='exp-letter-layer';layer.setAttribute('aria-hidden','true');element.append(layer);
   entries.push({element,source,layer,glyphs:[],originalHeight:element.style.height});
  }
  prepared=true;
 }
 function measure(entry) {
  restore(entry);entry.glyphs=[];entry.layer.replaceChildren();
  const style=getComputedStyle(entry.element);
  entry.lineHeight=parseFloat(style.lineHeight)||parseFloat(style.fontSize)*1.25;
  entry.naturalHeight=entry.element.getBoundingClientRect().height;
  const walker=document.createTreeWalker(entry.source,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
   const node=walker.currentNode,font=getComputedStyle(node.parentElement);
   context.font=`${font.fontStyle} ${font.fontWeight} ${font.fontSize} ${font.fontFamily}`;
   const text=node.textContent.replace(/\s+/gu,' ');
   const segments=segmenter?[...segmenter.segment(text)].map(s=>s.segment):Array.from(text);
   for(const character of segments) {
    const space=character===' ';
    if(space && (!entry.glyphs.length || entry.glyphs.at(-1).space))continue;
    const span=document.createElement('span');span.className='exp-letter-glyph';span.textContent=character;
    Object.assign(span.style,{fontFamily:font.fontFamily,fontWeight:font.fontWeight,fontSize:font.fontSize,fontStyle:font.fontStyle,lineHeight:`${entry.lineHeight}px`});
    const width=context.measureText(character).width+(parseFloat(font.letterSpacing)||0);
    entry.glyphs.push({space,width,span});entry.layer.append(span);
   }
  }
  if(entry.glyphs.at(-1)?.space)entry.glyphs.pop().span.remove();
 }
 function polygon(handle) {
  const path=handle.querySelector('path[fill="#1d1d1b"]');
  if(path) {
   const data=path.getAttribute('d'),matrix=path.getScreenCTM();
   if(matrix && !/[CQASTHV]/i.test(data)) {
    const numbers=(data.match(/-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/gi)||[]).map(Number),points=[];
    for(let i=0;i<numbers.length;i+=2)points.push({x:matrix.a*numbers[i]+matrix.c*numbers[i+1]+matrix.e,y:matrix.b*numbers[i]+matrix.d*numbers[i+1]+matrix.f});
    if(points.length>=3)return points;
   }
  }
  const b=handle.getBoundingClientRect();
  return [{x:b.left,y:b.top},{x:b.right,y:b.top},{x:b.right,y:b.bottom},{x:b.left,y:b.bottom}];
 }
 function paint(plans) {
  for(const {entry,result} of plans) {
   if(!result) {restore(entry);continue;}
   entry.element.style.height=`${entry.naturalHeight}px`;
   entry.element.classList.add('exp-letter-active');
   result.positions.forEach((position,i)=>{
    const span=entry.glyphs[i].span;
    span.style.visibility=position?'visible':'hidden';
    if(position)span.style.transform=`translate(${position.x.toFixed(2)}px,${position.y.toFixed(2)}px)`;
   });
  }
 }
 function update() {
  frame=0;
  const visible=bands.filter(b=>b.handle.getBoundingClientRect().width);
  const moved=visible.filter(b=>b.moved);
  if(!moved.length) {entries.forEach(restore);lastPlans=[];accept();return;}
  prepare();
  if(dirty) {entries.forEach(measure);dirty=false;}
  const obstacles=visible.map(b=>polygon(b.handle));
  const movingObstacles=moved.map(b=>polygon(b.handle));
  const area=(playground||copy).getBoundingClientRect(),plans=[];
  for(let index=0;index<entries.length;index++) {
   const entry=entries[index];
   restore(entry);
   const box=entry.element.getBoundingClientRect();
   if(!box.width || !box.height)continue;
   const polygons=obstacles.map(points=>points.map(p=>({x:p.x-box.left,y:p.y-box.top})));
   // Conserva exactamente la tipografía base en los párrafos que no toca ninguna banda.
   const touched=movingObstacles.some(points=>Math.max(...points.map(p=>p.x))>box.left-5 && Math.min(...points.map(p=>p.x))<box.right+5 && Math.max(...points.map(p=>p.y))>box.top-5 && Math.min(...points.map(p=>p.y))<box.bottom+5);
   if(!touched) {plans.push({entry,result:null});continue;}
   const next=entries[index+1]?.element||copy.querySelector('.call-link')||playground?.querySelector('.call-action');
   const nextTop=next?.getBoundingClientRect().top;
   // Solo aprovecha el margen vacío existente antes del siguiente párrafo o enlace.
   const maxHeight=Number.isFinite(nextTop)?Math.max(entry.naturalHeight,nextTop-box.top-12):entry.naturalHeight;
   const result=fit(entry.glyphs,box.width,entry.lineHeight,polygons,maxHeight,Math.max(0,box.left-area.left-5),Math.max(0,area.right-box.right-5));
   if(!result) {
    // Una posición que no deja caber todas las letras se limita al último punto válido.
    paint(lastPlans);
    dispatchEvent(new CustomEvent('aaj:composition-reject',{detail:{handle:movingHandle}}));
    return;
   }
   plans.push({entry,result});
  }
  paint(plans);lastPlans=plans;
  accept();
 }
 function schedule(remeasure=false) {dirty ||= remeasure;if(!frame)frame=requestAnimationFrame(update);}
 addEventListener('aaj:composition-change',event=>{bands=event.detail.bands;movingHandle=event.detail.movingHandle;schedule()});
 addEventListener('resize',()=>schedule(true),{passive:true});
 addEventListener('hashchange',()=>schedule(true));
 addEventListener('scroll',()=>{if(prepared)schedule()},{passive:true});
 addEventListener('beforeprint',()=>{bands=[];entries.forEach(restore)});
 if(document.fonts)document.fonts.ready.then(()=>schedule(true));
})();
