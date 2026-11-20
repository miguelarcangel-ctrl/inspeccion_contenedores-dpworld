/* Código de referencia de la app Facturas y Pagos a Proveedores
   (inspeccion_contenedores-dpworld/proveedores/index.html), donde está funcionando completo.
   No se carga tal cual: se copia la pieza que la app necesita y se adapta.
   Usa estas funciones de la app: $ (getElementById), esc, uid, ahora, hoy, fecha, money, toast,
   modal / cerrarModal, ir(vista), pintar(), S (estado: S.user, S.db, S.vista), api (guardar, _persistir) y DPW (kit). */
/* ════════ NOTIFICACIONES ════════
   Cada usuario elige con interruptores qué avisos le llegan. Se guardan en el centro de notificaciones de la app y,
   si activó los avisos en su equipo, también llegan como notificación del sistema.
   En el prototipo la notificación del sistema la muestra el service worker del mismo equipo donde ocurre la acción.
   Con Supabase, una Edge Function con web-push las envía a cada equipo registrado aunque la app esté cerrada (ver sw.js). */
const NOTIF=[
  ['fac_nueva','Facturas fiscales nuevas','Cuando un proveedor sube una factura desde su portal.',['coordinador','admin']],
  ['fac_validada','Facturas por aprobar','Validadas y listas para tu aprobación de pago.',['aprobador','admin']],
  ['fac_resuelta','Facturas aprobadas o rechazadas','Para incluirlas en una solicitud de pago o corregirlas.',['coordinador','admin']],
  ['prov_pend','Proveedores por aprobar','Registros nuevos o con cambio de cuenta bancaria.',['aprobador','admin']],
  ['prov_resuelto','Proveedores aprobados o rechazados','Respuesta a los proveedores que registraste.',['coordinador','admin']],
  ['pago_pend','Pagos por autorizar','Cada solicitud de pago nueva.',['aprobador','admin']],
  ['pago_aut','Pagos autorizados o rechazados','Listos para ejecutar o devueltos.',['coordinador','admin']],
  ['reclamo_nuevo','Reclamos de proveedores','Solicitudes de información o de programación de pago.',['coordinador','aprobador','admin']],
  ['venc','Resumen de vencimientos','Al entrar cada día: facturas vencidas y las que vencen en 3 días.',['coordinador','aprobador','admin']],
  ['p_fac','Estado de tus facturas','Validada, aprobada para pago o rechazada.',['proveedor']],
  ['p_pago','Tus pagos','Pago programado y pago realizado con su referencia.',['proveedor']],
  ['p_reclamo','Respuestas a tus reclamos','Cuando DP World responde o programa el pago.',['proveedor']],
  ['p_venc','Facturas vencidas sin pago','Al entrar cada día, para que puedas reclamarlas.',['proveedor']]
];
const notifDe=r=>NOTIF.filter(n=>n[3].includes(r));
const notifOn=(u,k)=>!((u.notif||{})[k]===false);
const misNotifs=()=>S.user?S.db.notifs.filter(n=>n.para===S.user.u).sort((a,b)=>b.t.localeCompare(a.t)):[];
const PUSH_KEY='dpw_proveedores_push';
let swReg=null;
const pushSubs=()=>{try{return JSON.parse(localStorage.getItem(PUSH_KEY))||{};}catch(e){return {};}};
const pushSet=o=>{try{localStorage.setItem(PUSH_KEY,JSON.stringify(o));}catch(e){}};
const esIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const instalada=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const pushOK=()=>!!swReg&&'Notification' in window;
const pushActivo=u=>pushOK()&&Notification.permission==='granted'&&!!pushSubs()[u];
function avisoSistema(u,titulo,texto,ref){
  if(!pushActivo(u.u))return;
  swReg.showNotification(titulo,{body:texto+'\nPara: '+u.nombre,icon:'dpw/pwa/icon-192.png',badge:'dpw/pwa/icon-192.png',tag:uid('n'),data:{ref:ref||null}}).catch(()=>{});
}
/* opts.users: solo esos usuarios · opts.provId: los usuarios de ese proveedor · sin opts: los perfiles internos del aviso. Nunca a quien hizo la acción. */
function notificar(ev,titulo,texto,ref,opts){
  const cat=NOTIF.find(n=>n[0]===ev);if(!cat)return;opts=opts||{};
  let dest=S.db.usuarios.filter(u=>u.activo&&(!S.user||u.u!==S.user.u)&&cat[3].includes(u.rol));
  if(opts.users)dest=dest.filter(u=>opts.users.includes(u.u));
  else if(opts.provId)dest=dest.filter(u=>u.rol==='proveedor'&&u.provId===opts.provId);
  else dest=dest.filter(u=>u.rol!=='proveedor');
  dest=dest.filter(u=>notifOn(u,ev));
  dest.forEach(u=>{S.db.notifs.push({id:uid('n'),t:ahora(),para:u.u,ev,titulo,texto,ref:ref||null,leida:false});avisoSistema(u,titulo,texto,ref);});
  if(S.db.notifs.length>800)S.db.notifs=S.db.notifs.slice(-800);
  api._persistir();
}
/* resumen diario al entrar: vencidas y por vencer, una vez al día por usuario */
async function resumenDiario(){
  const u=S.user;if(!u||u.digest===hoy())return;
  const pv=esProv(),ev=pv?'p_venc':'venc';
  u.digest=hoy();await api.guardar('usuarios',u);
  if(!notifOn(u,ev))return;
  const fs=facturasVisibles().filter(f=>f.estado!=='rechazada').map(f=>({f,c:calc(f)})).filter(x=>x.c.saldo>0.004);
  const v=fs.filter(x=>x.c.vencida),pr=fs.filter(x=>!x.c.vencida&&x.c.dias>=-3);
  if(!v.length&&(pv||!pr.length))return;
  const titulo=pv?'Tienes facturas vencidas sin pago':'Resumen de vencimientos';
  const texto=(v.length?v.length+' vencida'+(v.length>1?'s':'')+' por '+money(v.reduce((s,x)=>s+x.c.saldo,0)):'Sin vencidas')+(pv?'. Puedes reclamarlas desde Reclamos.':' · '+pr.length+' vence'+(pr.length===1?'':'n')+' en 3 días o menos.');
  S.db.notifs.push({id:uid('n'),t:ahora(),para:u.u,ev,titulo,texto,ref:{act:'irVista',id:pv?'reclamos':'facturas'},leida:false});api._persistir();
  avisoSistema(u,titulo,texto,{act:'irVista',id:pv?'reclamos':'facturas'});pintar();
}
function vAvisos(){
  const u=S.user,L=notifDe(u.rol),on=L.filter(n=>notifOn(u,n[0])).length,ios=esIOS(),inst=instalada(),perm=pushOK()?Notification.permission:'';
  let est;
  if(ios&&!inst)est='<div class="aviso warn">En iPhone los avisos solo funcionan con la app agregada a la pantalla de inicio.</div><ol class="ntf-steps"><li>Abre esta página en <b>Safari</b>.</li><li>Toca <b>Compartir</b> y elige <b>Agregar a inicio</b>.</li><li>Abre la app desde el ícono nuevo y vuelve a esta pantalla para activarlos.</li></ol>';
  else if(!pushOK())est='<div class="aviso warn">Este navegador no permite notificaciones en esta página. Ábrela desde el enlace publicado (https) en Chrome, Edge o Firefox, o en Safari con la app agregada a inicio.</div>';
  else if(perm==='denied')est='<div class="aviso warn">Las notificaciones están <b>bloqueadas</b> para esta página. Permítelas en los ajustes del sitio (junto a la dirección) o en los ajustes de notificaciones del teléfono y vuelve aquí.</div>';
  else{const a=pushActivo(u.u);est='<div class="ntf-state'+(a?' on':'')+'"><span class="dot"></span><div><b>'+(a?'Activadas en este equipo':'Desactivadas en este equipo')+'</b><span>'+esc(u.nombre)+'</span></div></div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap">'+(a?'<button class="btn" data-act="pushTest">Enviar prueba</button><button class="btn mal" data-act="pushOff">Desactivar</button>':'<button class="btn ok" data-act="pushOn">Activar en este equipo</button>')+'</div>';}
  return '<div class="vhead"><div><h1 class="vtitle">Notificaciones</h1><p class="vsub">Elige qué avisos te llegan según tu perfil y actívalos en este equipo.</p></div></div>'+
  '<div class="grid two" style="align-items:start">'+
    '<div class="card" id="ntConfig"><h2>Qué avisos recibir</h2><div class="nt"><div class="nt-h"><span>'+on+' de '+L.length+' encendidos</span><span><button type="button" class="link" data-act="avisoSw" data-id="*1">Encender todos</button> · <button type="button" class="link" data-act="avisoSw" data-id="*0">Apagar todos</button></span></div>'+
      L.map(n=>{const x=notifOn(u,n[0]);return '<div class="nt-i"><div><b>'+n[1]+'</b><span>'+n[2]+'</span></div><button type="button" class="sw'+(x?' on':'')+'" role="switch" aria-checked="'+x+'" aria-label="'+esc(n[1])+'" data-act="avisoSw" data-id="'+n[0]+'"><i></i></button></div>';}).join('')+'</div></div>'+
    '<div class="grid" style="align-content:start"><div class="card"><h2>Este equipo</h2>'+est+
      '<p class="mut" style="margin:12px 0 0">Los avisos que enciendes llegan siempre al centro de notificaciones de abajo. Activados en este equipo, también aparecen como notificación del teléfono o la computadora. En el prototipo se muestran en el equipo donde ocurre la acción; con el servidor (Supabase) llegarán a cada equipo registrado aunque la app esté cerrada.</p></div>'+
    '<div class="card"><h2 style="display:flex;justify-content:space-between;align-items:center;gap:8px">Recibidas <button class="link" data-act="marcarLeidas">Marcar todas como leídas</button></h2><div id="ntLista"></div></div></div>'+
  '</div>';
}
function listaAvisos(){
  const l=misNotifs().slice(0,60);
  $('ntLista').innerHTML=l.length?'<div class="grid" style="gap:6px">'+l.map(n=>'<button type="button" class="notif'+(n.leida?'':' nueva')+'" data-act="abrirAviso" data-id="'+n.id+'"><div><b>'+esc(n.titulo)+'</b><p>'+esc(n.texto)+'</p></div><time>'+esc(n.t.slice(0,10).split('-').reverse().join('/').slice(0,5)+' '+n.t.slice(11))+'</time></button>').join('')+'</div>':'<div class="mut">Todavía no tienes notificaciones.</div>';
}
async function avisoSw(k){
  const u=S.user;u.notif=u.notif||{};
  if(k[0]==='*')notifDe(u.rol).forEach(n=>u.notif[n[0]]=k[1]==='1');else u.notif[k]=!notifOn(u,k);
  await api.guardar('usuarios',u);pintar();
}
function marcarLeidas(){misNotifs().forEach(n=>n.leida=true);api._persistir();pintar();}
function abrirRef(ref){
  if(!ref||!S.user)return;
  if(ref.act==='irVista')return ir(ref.id);
  const fn={verFac,verPago,verProv,verReclamo}[ref.act];
  if(fn&&(ref.act!=='verProv'||!esProv()))fn(ref.id);
}
function abrirAviso(id){const n=S.db.notifs.find(x=>x.id===id);if(!n)return;n.leida=true;api._persistir();pintar();abrirRef(n.ref);}
function swListo(){
  if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
  navigator.serviceWorker.ready.then(r=>{swReg=r;if(S.user&&S.vista==='avisos')pintar();}).catch(()=>{});
  navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.abrir)abrirRef(e.data.abrir);});
}
function pushActivar(){
  if(!pushOK())return;
  Notification.requestPermission().then(pm=>{
    if(pm==='granted'){const s=pushSubs();s[S.user.u]=Date.now();pushSet(s);
      swReg.showNotification('Notificaciones activadas',{body:'Te avisaremos aquí según tu perfil.\nPara: '+S.user.nombre,icon:'dpw/pwa/icon-192.png',tag:uid('n')}).catch(()=>{});
      toast('Notificaciones activadas en este equipo.');}
    else toast('No se dio permiso para notificaciones.',true);
    pintar();});
}
function pushDesactivar(){const s=pushSubs();delete s[S.user.u];pushSet(s);toast('Notificaciones desactivadas en este equipo.');pintar();}
function pushProbar(){if(pushOK())swReg.showNotification('Prueba · Facturas y Pagos a Proveedores',{body:'Así te llegarán los avisos.\nPara: '+S.user.nombre,icon:'dpw/pwa/icon-192.png',tag:uid('n')}).catch(()=>{});}

/* ════════ WHATSAPP · soluciones rápidas según el perfil ════════ */
const WA_CONTACTOS=[['cxp','Cuentas por pagar','facturas y estado de pago'],['compras','Compras','respaldos y aprobaciones por correo'],['aprob','Aprobación de pagos','autorizaciones urgentes'],['teso','Tesorería','ejecución de pagos'],['soporte','Soporte de la app','accesos y fallas']];
const WA_TEMAS={
  proveedor:[['Estado de una factura','cxp','Quisiera saber el estado de mi factura{fac}.'],['Programación de pago','teso','Quisiera confirmar la fecha programada de pago de mi factura{fac}.'],
    ['Enviar respaldo para aprobación','compras','Envié por correo un respaldo para aprobación y quisiera confirmar que lo recibieron.'],['No puedo subir mi factura','soporte','Tengo un problema para subir mi factura fiscal en el portal.']],
  coordinador:[['Pedir aprobación urgente','aprob','Necesito la aprobación de la factura{fac} para incluirla en la corrida de pagos.'],['Confirmar un pago con tesorería','teso','Quisiera confirmar la ejecución del pago{fac}.'],
    ['Consultar un respaldo con compras','compras','Necesito confirmar el respaldo aprobado por correo de la factura{fac}.'],['Ayuda con la app','soporte','Necesito ayuda con la app de Facturas y Pagos a Proveedores.']],
  aprobador:[['Duda sobre una factura','cxp','Tengo una duda sobre la factura{fac} antes de aprobarla.'],['Coordinar los pagos del día','teso','Quisiera coordinar los pagos autorizados de hoy.'],['Ayuda con la app','soporte','Necesito ayuda con la app de Facturas y Pagos a Proveedores.']]
};
WA_TEMAS.admin=WA_TEMAS.coordinador.concat(WA_TEMAS.aprobador.filter(t=>!WA_TEMAS.coordinador.some(x=>x[0]===t[0])));
// WhatsApp necesita el número completo con código de país: un número local de Panamá (8 dígitos) se completa con 507
const waIntl=v=>{let d=(v||'').replace(/\D/g,'');if(/^00/.test(d))d=d.slice(2);else if(!/^\s*\+/.test(v||'')&&d.length<=8&&d.length)d='507'+d;return d;};
const waFmt=d=>/^507\d{8}$/.test(d)?'+507 '+d.slice(3,7)+'-'+d.slice(7):'+'+d;
const waGrupo=v=>/^https:\/\/chat\.whatsapp\.com\/\w+/.test(v||'');
function waPintar(){const f=$('waFab');if(!f)return;f.hidden=!S.user;if(!S.user)waMenu(false);}
function waMenu(open){
  const m=$('waMenu'),b=document.querySelector('.wa-btn');if(!m)return;
  if(open&&S.user){
    const u=S.user,f=S.ctxFac&&fac(S.ctxFac);
    const ctx=f?' '+f.numero+' de '+prov(f.provId).nombre+' ('+money(f.total)+', vence el '+fecha(f.vence)+')':'';
    const yo='Hola, soy '+u.nombre+(esProv()?' de '+prov(miProv()).nombre:' ('+ROLES[u.rol]+' DP World)')+', te escribo desde la app de Facturas y Pagos a Proveedores. ';
    const movil=esIOS()||/Android/i.test(navigator.userAgent);
    m.innerHTML='<div class="wa-h">Soluciones rápidas<small>'+(f?'Con los datos de la factura '+esc(f.numero):'Elige el tema y se abre WhatsApp con el mensaje listo')+'</small></div>'+
      (WA_TEMAS[u.rol]||[]).map(([t,k,msg])=>{
        const ct=WA_CONTACTOS.find(c=>c[0]===k),n=S.db.wa[k]||'',txt=yo+msg.replace('{fac}',ctx),q=d=>'phone='+d+'&text='+encodeURIComponent(txt);
        const cab='<b>'+esc(t)+'</b><span>Para: '+esc(ct[1])+'</span>';
        if(waGrupo(n))return '<a class="wa-i" role="menuitem" href="'+esc(n)+'" target="_blank" rel="noopener" data-act="waGo">'+cab+'<small>Grupo de WhatsApp</small></a>';
        const d=waIntl(n);if(!d)return '<div class="wa-i off">'+cab+'<small>Sin número configurado'+(PUEDE.admin()?' · ponlo en Configuración':'')+'</small></div>';
        return movil?'<a class="wa-i" role="menuitem" href="whatsapp://send?'+q(d)+'" data-act="waGo">'+cab+'<small>'+waFmt(d)+'</small></a>':
          '<div class="wa-i">'+cab+'<small>'+waFmt(d)+'</small><div class="wa-acts"><a class="wa-a" role="menuitem" href="whatsapp://send?'+q(d)+'" data-act="waGo">App de escritorio</a><a class="wa-a" role="menuitem" href="https://web.whatsapp.com/send?'+q(d)+'" target="_blank" rel="noopener" data-act="waGo">WhatsApp Web</a></div></div>';
      }).join('')+(movil?'':'<div class="wa-note">WhatsApp Web pide escanear un código QR la primera vez en cada navegador: en tu teléfono, WhatsApp → Dispositivos vinculados.</div>');
  }
  m.hidden=!(open&&S.user);if(b)b.setAttribute('aria-expanded',String(!m.hidden));
}
document.addEventListener('click',e=>{const m=$('waMenu');if(m&&!m.hidden&&!e.target.closest('.wa-fab'))waMenu(false);});

/* ════════ TUTORIAL de arranque por perfil (como Control de Horas) ════════
   Se muestra la primera vez que cada usuario entra en este equipo; se vuelve a ver desde el menú, «Ver tutorial». */
const TUT_KEY=()=>'dpw_proveedores_tutorial_'+(S.user?S.user.u:'');
function tutorialPendiente(){try{return !!S.user&&!localStorage.getItem(TUT_KEY());}catch(e){return false;}}
function pasosTutorial(){
  const r=rol(),P=[],nombre=S.user.nombre.split(' ')[0];
  P.push({t:'Bienvenido, '+nombre,d:'Te mostramos en pocas tarjetas qué es cada parte de la app'+(r==='proveedor'?' para tu empresa':' según tu perfil de '+ROLES[r])+'. Puedes saltarlo y volver a verlo cuando quieras desde el menú, en «Ver tutorial».'});
  P.push({sel:'.dpw-burger',t:'Menú',d:'Aquí están todas las secciones y, en Ayuda, tus notificaciones y este tutorial.'});
  if(r==='proveedor'){
    P.push({nav:'resumen',sel:'.kpis',t:'Tu resumen',d:'Lo que DP World te debe, lo vencido, el próximo pago programado y tus días de crédito.'});
    P.push({nav:'facturas',sel:'.vhead [data-act="nuevaFac"]',t:'Subir factura fiscal',d:'Primero envías el respaldo por correo y DP World lo aprueba por correo. Después subes aquí la factura fiscal con su fecha, el archivo y los datos de ese correo. Vence en la fecha de la factura más tus días de crédito.'});
    P.push({nav:'facturas',sel:'#lista',t:'Mis facturas',d:'El estado de cada una: recibida, validada, aprobada para pago o pagada, y cuánto falta por pagar.'});
    P.push({nav:'pagos',sel:'#lista',t:'Mis pagos',d:'Pagos programados y realizados, con su referencia bancaria.'});
    P.push({nav:'mapa',sel:'#lista',t:'Mapa de pagos',d:'Tus facturas por mes: verde pagadas, rojo vencidas y ámbar por vencer.'});
    P.push({nav:'reclamos',sel:'.vhead [data-act="nuevoReclamo"]',t:'Reclamos',d:'Si una factura se vence sin pago, pide información o la programación de su pago. DP World te responde aquí y te llega una notificación.'});
  }else{
    P.push({nav:'resumen',sel:()=>document.querySelector('.tareas')||document.querySelector('.kpis'),t:'Lo que te toca',d:r==='aprobador'?'Facturas por aprobar, pagos por autorizar, proveedores por aprobar y reclamos.':'Facturas por validar, pagos por ejecutar y reclamos de proveedores por responder.'});
    if(r!=='aprobador'){
      P.push({nav:'proveedores',sel:'.vhead [data-act="nuevoProv"]',t:'Proveedores',d:'Registro con documentos, datos bancarios y días de crédito, que son la base del vencimiento de cada factura. Otra persona lo aprueba.'});
      P.push({nav:'facturas',sel:'#lista',t:'Facturas',d:'Las suben los proveedores desde su portal con el respaldo aprobado por correo. Las validas contra ese respaldo antes de pasarlas a aprobación.'});
      P.push({nav:'pagos',sel:'.vhead [data-act="nuevoPago"]',t:'Pagos',d:'Agrupa facturas aprobadas en una solicitud; otra persona la autoriza y tú registras la ejecución con su referencia.'});
    }else{
      P.push({nav:'facturas',sel:'#lista',t:'Facturas',d:'Apruebas para pago las facturas validadas. Nadie aprueba lo que registró.'});
      P.push({nav:'pagos',sel:'#lista',t:'Pagos',d:'Autorizas o rechazas cada solicitud de pago.'});
      P.push({nav:'proveedores',sel:'#lista',t:'Proveedores',d:'Apruebas los proveedores nuevos cuando tienen todos sus documentos.'});
    }
    P.push({nav:'mapa',sel:'#lista',t:'Mapa de pagos',d:'Proveedores en filas y meses en columnas: verde pagadas, rojo vencidas y ámbar por vencer. Toca una celda para ver sus facturas.'});
    P.push({nav:'reclamos',sel:'#lista',t:'Reclamos',d:'Los proveedores reclaman sus facturas vencidas. Respóndeles aquí y, si aplica, da la fecha programada de pago.'});
    P.push({nav:'bitacora',sel:'#lista',t:'Bitácora',d:'Cada acción con quién la hizo y cuándo.'});
    if(r==='admin')P.push({nav:'config',sel:'.vhead',t:'Configuración',d:'Usuarios (también los de cada proveedor), ITBMS y los contactos de WhatsApp.'});
  }
  P.push({nav:'avisos',sel:'#ntConfig',t:'Notificaciones',d:'Con interruptores eliges qué avisos te llegan y los activas en este equipo para recibirlos como notificación.'});
  P.push({sel:'.wa-btn',t:'WhatsApp',d:'Soluciones rápidas según tu perfil: abre WhatsApp con el mensaje listo para la persona correcta. Si tienes una factura abierta, el mensaje lleva sus datos.'});
  P.push({t:'Listo',d:'Eso es todo. Si necesitas repasarlo, está en el menú, en «Ver tutorial».'});
  return P;
}
let _tour=null;
function iniciarTutorial(){
  if(!S.user)return;cerrarModal();waMenu(false);
  _tour={pasos:pasosTutorial(),i:0,vista:S.vista};
  let el=$('tour');if(!el){el=document.createElement('div');el.id='tour';el.className='tour';el.innerHTML='<div class="tour-hole sin"></div><div class="tour-card" role="dialog" aria-modal="true" aria-live="polite"></div>';document.body.appendChild(el);}
  el.hidden=false;pintarTutorial();
}
function pintarTutorial(){
  const T=_tour,el=$('tour');if(!T||!el)return;const p=T.pasos[T.i];
  if(p.nav&&S.vista!==p.nav)ir(p.nav);
  let tgt=typeof p.sel==='function'?p.sel():p.sel?document.querySelector(p.sel):null;
  if(tgt&&!(tgt.offsetWidth||tgt.offsetHeight))tgt=null;
  const hole=el.querySelector('.tour-hole'),card=el.querySelector('.tour-card'),ult=T.i===T.pasos.length-1;
  card.innerHTML='<div class="tour-paso">Tutorial · '+(T.i+1)+' de '+T.pasos.length+'</div><h3>'+esc(p.t)+'</h3><p>'+esc(p.d)+'</p>'+
    '<div class="tour-puntos">'+T.pasos.map((_,k)=>'<i class="'+(k===T.i?'on':'')+'"></i>').join('')+'</div>'+
    '<div class="tour-nav"><button class="btn sm tour-saltar" data-act="tutSaltar">'+(ult?'Cerrar':'Saltar')+'</button>'+(T.i?'<button class="btn sm" data-act="tutAnt">Anterior</button>':'')+
    '<button class="btn sm ok" data-act="tutSig">'+(ult?'Terminar':'Siguiente')+'</button></div>';
  const ubicar=()=>{
    const cw=card.offsetWidth,ch=card.offsetHeight,W=innerWidth,H=innerHeight;
    if(!tgt){hole.className='tour-hole sin';card.style.left=Math.max(12,(W-cw)/2)+'px';card.style.top=Math.max(12,(H-ch)/2)+'px';return;}
    const r0=tgt.getBoundingClientRect(),pad=6,top=Math.max(r0.top,56),alto=Math.min(r0.bottom-top,H*.55),r={left:r0.left,width:r0.width,top};
    hole.className='tour-hole';Object.assign(hole.style,{left:(r.left-pad)+'px',top:(r.top-pad)+'px',width:(r.width+pad*2)+'px',height:(alto+pad*2)+'px'});
    const abajo=r.top+alto+pad+12,arriba=r.top-pad-12-ch;
    card.style.top=Math.min(Math.max(8,abajo+ch<=H-8?abajo:arriba>=8?arriba:H-ch-8),H-ch-8)+'px';
    card.style.left=Math.min(Math.max(12,r.left+r.width/2-cw/2),W-cw-12)+'px';
  };
  /* lo alto (listas) se muestra desde su inicio; lo demás, centrado */
  if(tgt){const r=tgt.getBoundingClientRect();if(r.height>innerHeight*.5){if(r.top<70||r.top>innerHeight*.4)scrollBy(0,r.top-80);}else if(r.top<70||r.bottom>innerHeight-40)tgt.scrollIntoView({block:'center'});}
  ubicar();setTimeout(ubicar,80);
  card.querySelector('[data-act="tutSig"]').focus();
}
function pasoTutorial(d){if(!_tour)return;_tour.i=Math.max(0,Math.min(_tour.pasos.length-1,_tour.i+d));pintarTutorial();}
function cerrarTutorial(silencio){
  const el=$('tour');if(el)el.hidden=true;
  if(!_tour)return;
  try{localStorage.setItem(TUT_KEY(),new Date().toISOString());}catch(e){}
  const v=_tour.vista;_tour=null;if(!silencio&&S.user)ir(v||'resumen');
}
document.addEventListener('keydown',e=>{if(!_tour)return;if(e.key==='Escape'){e.stopPropagation();cerrarTutorial();}else if(e.key==='ArrowRight')pasoTutorial(1);else if(e.key==='ArrowLeft')pasoTutorial(-1);},true);
window.addEventListener('resize',()=>{if(_tour)pintarTutorial();});

