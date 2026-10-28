/* DP World Panamá · cascarón común de las apps (molde: Last Mile).
   Menú desplegable lateral, tema claro/oscuro, botón Instalar (PWA) y arranque de la escena animada del login.
   Marcado esperado (ver SKILL.md): botón [data-dpw="menu"], #dpwOv, #dpwDrawer con #dpwItems y #dpwWho,
   botones [data-dpw="tema"] y [data-dpw="instalar"], y en el login dos <svg> con data-dpw-art / data-dpw-ground.
   Sin íconos ni emojis. */
(function(){
'use strict';
const DPW=window.DPW=window.DPW||{};
DPW.ESCENAS=DPW.ESCENAS||{};
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let items=[],activeId=null,lastFocus=null;

function isOpen(){const d=$('dpwDrawer');return !!d&&d.classList.contains('open');}
function setOpen(open){
  const d=$('dpwDrawer'),o=$('dpwOv');if(!d)return;
  d.classList.toggle('open',open);d.setAttribute('aria-hidden',String(!open));if(o)o.hidden=!open;
  document.querySelectorAll('[data-dpw="menu"]').forEach(b=>b.setAttribute('aria-expanded',String(open)));
  if(open){lastFocus=document.activeElement;const a=d.querySelector('.dpw-item.active')||d.querySelector('.dpw-item');if(a)a.focus();}
  else if(lastFocus&&lastFocus.focus){lastFocus.focus();lastFocus=null;}
}
DPW.abrirMenu=()=>setOpen(true);
DPW.cerrarMenu=()=>setOpen(false);

/* items: [{id, label, on(), badge?, hint?, group?, hidden?}] · los grupos se separan con un título pequeño */
DPW.menu=function(list,active){
  items=list||[];if(active!==undefined)activeId=active;
  const box=$('dpwItems');if(!box)return;
  let html='',grp=null;
  items.forEach((it,i)=>{
    if(it.hidden)return;
    if(it.group&&it.group!==grp){grp=it.group;html+='<div class="dpw-group">'+esc(grp)+'</div>';}
    const on=it.id===activeId;
    html+='<button type="button" class="dpw-item'+(on?' active':'')+'" data-dpw-i="'+i+'"'+(on?' aria-current="page"':'')+'>'+
      '<span>'+esc(it.label)+'</span>'+(it.badge?'<span class="dpw-badge">'+esc(it.badge)+'</span>':it.hint?'<small>'+esc(it.hint)+'</small>':'')+'</button>';
  });
  box.innerHTML=html;
  const n=items.reduce((s,it)=>s+(!it.hidden&&+it.badge||0),0);
  document.querySelectorAll('[data-dpw="menu"]').forEach(b=>{if(n)b.setAttribute('data-n',n>99?'99+':n);else b.removeAttribute('data-n');});
};
DPW.activo=function(id){activeId=id;DPW.menu(items);};
DPW.quien=function(etiqueta,valor){const w=$('dpwWho');if(w)w.innerHTML='<span>'+esc(etiqueta||'Sesión')+'</span><b>'+esc(valor)+'</b>';};

/* Tema claro/oscuro en <html data-theme>. El <head> de cada app lleva el script de arranque del SKILL.md
   (lee la misma clave) para que no parpadee. Los botones [data-dpw="tema"] muestran a qué tema cambian. */
const TEMA_KEY='dpw_tema';
DPW.botonTema=function(btn,claro){if(!btn)return;btn.textContent=claro?'Oscuro':'Claro';const l=claro?'Cambiar a tema oscuro':'Cambiar a tema claro';btn.setAttribute('aria-label',l);btn.title=l;};
DPW.tema=()=>document.documentElement.getAttribute('data-theme')==='light'?'light':'dark';
function pintarTema(){
  const claro=DPW.tema()==='light';
  document.querySelectorAll('[data-dpw="tema"]').forEach(b=>DPW.botonTema(b,claro));
  const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',claro?'#1A1060':'#0d0b28');
}
DPW.ponerTema=function(t){
  document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');
  try{localStorage.setItem(TEMA_KEY,DPW.tema());}catch(e){}
  pintarTema();document.dispatchEvent(new CustomEvent('dpw:tema',{detail:DPW.tema()}));
};
DPW.alternarTema=()=>DPW.ponerTema(DPW.tema()==='light'?'dark':'light');

/* Instalar la app (PWA): los botones [data-dpw="instalar"] se muestran solos cuando el navegador lo permite;
   en iPhone se explica el paso manual. DPW.pwa() registra el service worker. DPW.aviso se puede reemplazar por el toast de la app. */
let _instalar=null;
const esIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
const instalada=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
function pintarInstalar(){const ver=!instalada()&&(!!_instalar||esIOS);document.querySelectorAll('[data-dpw="instalar"]').forEach(b=>{b.hidden=!ver;});}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();_instalar=e;pintarInstalar();});
window.addEventListener('appinstalled',()=>{_instalar=null;pintarInstalar();DPW.aviso('App instalada.');});
DPW.aviso=DPW.aviso||(msg=>alert(msg));
DPW.instalar=async function(){
  if(_instalar){_instalar.prompt();try{await _instalar.userChoice;}catch(e){}_instalar=null;pintarInstalar();return;}
  DPW.aviso('En iPhone: abre la app en Safari, toca Compartir y luego «Agregar a inicio».');
};
DPW.pwa=function(sw){if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register(sw||'sw.js').catch(e=>console.warn('DPW: service worker',e));};
DPW.pintar=()=>{pintarTema();pintarInstalar();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',DPW.pintar);else DPW.pintar();

/* Escena animada del login: se dibuja una vez y se pausa sola cuando el login no está a la vista */
DPW.escena=function(nombre,root){
  root=root||document;
  const art=root.querySelector('[data-dpw-art]'),ground=root.querySelector('[data-dpw-ground]');
  if(!art||art.dataset.dpwOn)return;
  const fn=DPW.ESCENAS[nombre];if(!fn){console.warn('DPW: escena desconocida',nombre);return;}
  art.dataset.dpwOn='1';
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctl=fn(art,ground,{still:still})||{};
  const svgs=[art,ground].filter(Boolean);
  const run=on=>{svgs.forEach(s=>{try{on&&!still?s.unpauseAnimations():s.pauseAnimations();}catch(e){}});if(on&&!still&&ctl.play)ctl.play();if(!on&&ctl.pause)ctl.pause();};
  if(still)svgs.forEach(s=>{try{s.setCurrentTime(2.6);s.pauseAnimations();}catch(e){}});
  if('IntersectionObserver' in window)new IntersectionObserver(es=>run(es.some(e=>e.isIntersecting))).observe(art);
};

document.addEventListener('click',e=>{
  const t=e.target.closest('[data-dpw],[data-dpw-i]');if(!t)return;
  if(t.dataset.dpwI!==undefined){const it=items[+t.dataset.dpwI];setOpen(false);if(it&&it.on)it.on();return;}
  if(t.dataset.dpw==='menu')setOpen(!isOpen());
  else if(t.dataset.dpw==='menu-close')setOpen(false);
  else if(t.dataset.dpw==='tema')DPW.alternarTema();
  else if(t.dataset.dpw==='instalar')DPW.instalar();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen()){e.stopPropagation();setOpen(false);}},true);
})();
