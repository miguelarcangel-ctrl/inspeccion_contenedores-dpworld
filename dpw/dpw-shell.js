/* DP World Panamá · cascarón común de las apps (molde: Last Mile).
   Menú desplegable lateral, botón de tema con texto y arranque de la escena animada del login.
   Marcado esperado (ver SKILL.md): botón [data-dpw="menu"], #dpwOv, #dpwDrawer con #dpwItems y #dpwWho,
   y en el login dos <svg> con data-dpw-art / data-dpw-ground. Sin íconos ni emojis. */
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

/* Botón de tema con texto: muestra a qué tema cambia */
DPW.botonTema=function(btn,claro){if(!btn)return;btn.textContent=claro?'Oscuro':'Claro';const l=claro?'Cambiar a tema oscuro':'Cambiar a tema claro';btn.setAttribute('aria-label',l);btn.title=l;};

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
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&isOpen()){e.stopPropagation();setOpen(false);}},true);
})();
