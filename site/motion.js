/* Motion layer for the landing page. Runs after app.js has rendered the page. */
(() => {
'use strict';
const root=document.documentElement;
const reduce=matchMedia('(prefers-reduced-motion:reduce)');
const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
const $$=(sel,ctx=document)=>[...ctx.querySelectorAll(sel)];
const header=document.querySelector('.site-header');

// Scroll progress and the active nav link work with reduced motion too: they are state, not animation.
const bar=document.createElement('div');bar.className='scroll-progress';bar.setAttribute('aria-hidden','true');header.append(bar);
const navLinks=$$('.desktop-nav a');
const spySections=navLinks.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
let ticking=false;
function onScroll(){
 if(ticking)return;ticking=true;
 requestAnimationFrame(()=>{
  ticking=false;
  const max=root.scrollHeight-innerHeight;
  bar.style.setProperty('--progress',max>0?Math.min(1,scrollY/max).toFixed(4):0);
  const line=header.offsetHeight+innerHeight*.3;let current=null;
  for(const s of spySections){if(s.getBoundingClientRect().top<=line)current=s;}
  if(current&&current.getBoundingClientRect().bottom<header.offsetHeight)current=null;
  navLinks.forEach(a=>{const on=current&&a.getAttribute('href')==='#'+current.id;a.classList.toggle('is-active',!!on);on?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current');});
 });
}
addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);onScroll();

if(reduce.matches)return;
root.classList.add('motion');

// Dot-matrix scramble: Doto is monospaced, so glyph swaps never shift the layout.
const GLYPHS='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=<>/';
function scramble(el,duration=1100){
 if(el.dataset.scrambling)return;el.dataset.scrambling='1';
 const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];
 while(walker.nextNode())nodes.push({node:walker.currentNode,text:walker.currentNode.nodeValue});
 const total=nodes.reduce((n,x)=>n+x.text.length,0)||1;
 const finalText=el.textContent;if(!el.hasAttribute('aria-label'))el.setAttribute('aria-label',finalText),el.dataset.scrambleLabel='1';
 const start=performance.now();let k=0;
 const reveal=nodes.map(x=>[...x.text].map(()=>(k++/total)*.65+Math.random()*.3));
 let last=0;
 (function frame(now){
  const t=Math.min(1,(now-start)/duration);
  if(now-last>45||t===1){
   last=now;
   nodes.forEach((x,i)=>{x.node.nodeValue=[...x.text].map((ch,j)=>(t>=reveal[i][j]||!/[\p{L}\p{N}]/u.test(ch))?ch:GLYPHS[Math.random()*GLYPHS.length|0]).join('');});
  }
  if(t<1)requestAnimationFrame(frame);
  else{nodes.forEach(x=>x.node.nodeValue=x.text);delete el.dataset.scrambling;if(el.dataset.scrambleLabel){el.removeAttribute('aria-label');delete el.dataset.scrambleLabel;}}
 })(start);
}

// Hero title decodes on load; the brand decodes on hover.
const h1=document.querySelector('.hero h1');
if(h1)setTimeout(()=>scramble(h1,1400),200);
const brand=document.querySelector('.brand>span:not(.brand-dot)');
document.querySelector('.brand')?.addEventListener('mouseenter',()=>scramble(brand,600));

// Scroll reveal with per-group stagger.
const groups=[
 ['.section-heading>*'],['.info-cell'],['.format-labels,.format-column'],['.format-card'],
 ['.merch-item'],['.merch-remote'],['.partner-cell','rv-scale'],['.partnership-copy>div,.partnership-copy>.button'],
 ['.support-row'],['.apply-sidebar .sidebar-content>*'],['.form-group'],['.form-bottom'],['.mobile-contacts'],['.footer-grid>div']
];
const parents=new Map();
groups.forEach(([sel,extra])=>$$(sel).forEach(el=>{
 const p=el.parentElement;const i=parents.get(p)||0;parents.set(p,i+1);
 el.classList.add('rv');if(extra)el.classList.add(extra);el.style.setProperty('--i',Math.min(i,8));
}));
// Hairline scans along the top edge of rows of cells.
$$('.info-grid,.partner-grid,.formats-desktop,.support-list,.partnership,.apply-layout,.footer-grid').forEach(el=>el.classList.add('line-draw'));

const io=new IntersectionObserver(entries=>entries.forEach(e=>{
 if(!e.isIntersecting)return;const el=e.target;el.classList.add('in');io.unobserve(el);
 if(el.matches('.display-date,.format-index'))scramble(el,900);
}),{rootMargin:'0px 0px -12% 0px',threshold:0});
$$('.rv,.section,.line-draw,.partnership,.footer-wordmark,.display-date,.format-index').forEach(el=>io.observe(el));

// Cursor spotlight and eye parallax for precise pointers only.
if(finePointer.matches){
 document.addEventListener('pointermove',e=>{
  const cell=e.target.closest?.('.partner-cell,.support-row');if(!cell)return;
  const r=cell.getBoundingClientRect();cell.style.setProperty('--mx',(e.clientX-r.left)+'px');cell.style.setProperty('--my',(e.clientY-r.top)+'px');
 },{passive:true});
 const art=document.querySelector('.partnership-art'),eye=art?.querySelector('picture');
 const section=document.querySelector('.partnership');
 if(art&&eye&&section){
  section.addEventListener('pointermove',e=>{const r=art.getBoundingClientRect();const dx=(e.clientX-(r.left+r.width/2))/innerWidth,dy=(e.clientY-(r.top+r.height/2))/innerHeight;eye.style.transform=`translate(${(dx*28).toFixed(1)}px,${(dy*22).toFixed(1)}px)`;},{passive:true});
  section.addEventListener('pointerleave',()=>{eye.style.transform='';});
 }
}

// Mobile menu links stagger in.
$$('.menu-link').forEach((a,i)=>a.style.setProperty('--i',i));

// If the user switches to reduced motion mid-visit, show everything at rest.
reduce.addEventListener('change',e=>{if(e.matches){root.classList.remove('motion');$$('.rv').forEach(el=>el.classList.add('in'));}});
})();
