/* Código de referencia de la app Facturas y Pagos a Proveedores
   (inspeccion_contenedores-dpworld/proveedores/index.html), donde está funcionando completo.
   No se carga tal cual: se copia la pieza que la app necesita y se adapta.
   Usa estas funciones de la app: $ (getElementById), esc, uid, ahora, hoy, fecha, money, toast,
   modal / cerrarModal, ir(vista), pintar(), S (estado: S.user, S.db, S.vista), api (guardar, _persistir) y DPW (kit). */
/* ════════ RECLAMOS ════════
   El proveedor reclama una factura vencida: pide información o la programación del pago. DP World responde en el hilo. */
const TIPO_RC={informacion:'Solicitud de información',programacion:'Solicitud de programación de pago'};
const ESTADO_RC={abierto:['Por responder','warn'],respondido:['Respondido','info'],cerrado:['Cerrado','ok']};
const ultima=r=>(r.hilo[r.hilo.length-1]||{}).t||r.creado;
function vReclamos(){
  const pv=esProv();
  return '<div class="vhead"><div><h1 class="vtitle">Reclamos</h1><p class="vsub">'+(pv?'Reclamos de tus facturas vencidas: pide información o la programación del pago.':'Reclamos de proveedores por facturas vencidas: responde y, si aplica, da la fecha programada de pago.')+'</p></div>'+
    (pv?'<button class="btn pri" data-act="nuevoReclamo">Nuevo reclamo</button>':'')+'</div>'+
    '<div class="filtros"><select class="sel" data-f="re"><option value="">Todos los estados</option>'+Object.entries(ESTADO_RC).map(([k,v])=>'<option value="'+k+'"'+(S.f.re===k?' selected':'')+'>'+v[0]+'</option>').join('')+'</select></div><div id="lista"></div>';
}
function listaReclamos(){
  const l=reclamosVisibles().filter(r=>!S.f.re||r.estado===S.f.re).sort((a,b)=>ultima(b).localeCompare(ultima(a)));
  $('lista').innerHTML=l.length?'<div class="tw"><table><thead><tr><th>Reclamo</th><th>Factura</th>'+(esProv()?'':'<th class="hide-sm">Proveedor</th>')+'<th class="hide-sm">Última actividad</th><th>Estado</th></tr></thead><tbody>'+
    l.map(r=>{const f=fac(r.facId),c=f?calc(f):null;return '<tr class="clic" data-act="verReclamo" data-id="'+r.id+'"><td><div class="b">'+esc(r.numero)+'</div><div class="mut">'+esc(TIPO_RC[r.tipo])+'</div></td>'+
      '<td><div class="b">'+esc(f?f.numero:'—')+'</div>'+(c&&c.saldo>0.004?'<div class="mut">'+money(c.saldo)+(c.vencida?' · vencida hace '+c.dias+' d':'')+'</div>':'<div class="mut">Pagada</div>')+'</td>'+
      (esProv()?'':'<td class="hide-sm">'+esc((prov(r.provId)||{}).nombre||'')+'</td>')+'<td class="hide-sm">'+esc(ultima(r).slice(0,10).split('-').reverse().join('/'))+' <span class="mut">'+esc(ultima(r).slice(11))+'</span></td><td>'+chip(r.estado,ESTADO_RC)+'</td></tr>';}).join('')+
    '</tbody></table></div>':'<div class="card vacio">'+(esProv()?'No tienes reclamos. Si una factura se vence sin pago, aquí puedes reclamarla.':'No hay reclamos con ese filtro.')+'</div>';
}
function nuevoReclamo(facId){
  if(!esProv())return;
  const ops=facturasVisibles().filter(f=>calc(f).vencida&&!S.db.reclamos.some(r=>r.facId===f.id&&r.estado!=='cerrado'));
  if(!ops.length)return toast('No tienes facturas vencidas sin un reclamo abierto.',true);
  modal('Nuevo reclamo','<div class="form">'+
    '<label class="f full"><span>Factura vencida</span><select class="sel" id="rcFac">'+ops.map(f=>{const c=calc(f);return '<option value="'+f.id+'"'+(f.id===facId?' selected':'')+'>'+esc(f.numero)+' · '+money(c.saldo)+' · vencida hace '+c.dias+' días</option>';}).join('')+'</select></label>'+
    '<label class="f full"><span>Qué necesitas</span><select class="sel" id="rcTipo">'+Object.entries(TIPO_RC).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join('')+'</select></label>'+
    '<label class="f full"><span>Mensaje para DP World</span><textarea class="in" id="rcMsg" rows="4" placeholder="Ej.: ¿Para qué fecha está programado el pago de esta factura?"></textarea></label>'+
    '</div><div class="err-msg" id="mErr"></div>',
    [{t:'Cancelar',on:cerrarModal},{t:'Enviar reclamo',cls:'pri',on:async()=>{
      const m=$('rcMsg').value.trim();if(m.length<10)return $('mErr').textContent='Escribe tu mensaje (mínimo 10 caracteres).';
      const f=fac($('rcFac').value),tipo=$('rcTipo').value,n=S.db.reclamos.reduce((x,r)=>Math.max(x,+r.numero.slice(3)||0),0)+1;
      const r={id:uid('r'),numero:'RC-'+String(n).padStart(4,'0'),provId:f.provId,facId:f.id,tipo,estado:'abierto',creado:ahora(),creadoPor:S.user.u,hilo:[{t:ahora(),u:firma(),lado:'proveedor',texto:m}],log:[]};
      await api.guardar('reclamos',r);
      f.log.push({t:ahora(),u:firma(),a:'Reclamo '+r.numero+': '+(tipo==='programacion'?'solicitó programación de pago':'solicitó información')});await api.guardar('facturas',f);
      notificar('reclamo_nuevo','Reclamo de proveedor',prov(f.provId).nombre+' · '+r.numero+' · '+TIPO_RC[tipo]+' de la factura '+f.numero+'.',{act:'verReclamo',id:r.id});
      toast('Reclamo '+r.numero+' enviado. Te avisamos cuando DP World responda.');pintar();verReclamo(r.id);
    }}]);
}
function verReclamo(id){
  const r=S.db.reclamos.find(x=>x.id===id);if(!r)return;
  const f=fac(r.facId),c=f?calc(f):null,pv=esProv(),acc=[{t:'Cerrar',on:cerrarModal}];
  if(pv&&r.provId!==miProv())return;
  if(r.estado!=='cerrado'){
    acc.unshift({t:'Cerrar reclamo',cls:'mal',on:async()=>{r.estado='cerrado';(r.log=r.log||[]).push({t:ahora(),u:firma(),a:'Cerró el reclamo'});await api.guardar('reclamos',r);toast('Reclamo cerrado.');pintar();verReclamo(id);}});
    acc.unshift({t:'Responder',cls:'pri',on:async()=>{
      const t=$('rcTxt').value.trim(),fp=$('rcFecha')?$('rcFecha').value:'';
      if(t.length<4)return $('mErr').textContent='Escribe la respuesta.';
      if(fp&&fp<hoy())return $('mErr').textContent='La fecha programada no puede ser pasada.';
      r.hilo.push(Object.assign({t:ahora(),u:firma(),lado:pv?'proveedor':'dpw',texto:t},fp?{fechaProg:fp}:{}));r.estado=pv?'abierto':'respondido';
      await api.guardar('reclamos',r);
      if(f){f.log.push({t:ahora(),u:firma(),a:(pv?'Escribió en el reclamo ':'Respondió el reclamo ')+r.numero+(fp?' · pago programado para el '+fecha(fp):'')});await api.guardar('facturas',f);}
      if(pv)notificar('reclamo_nuevo','Reclamo de proveedor',prov(r.provId).nombre+' escribió en '+r.numero+'.',{act:'verReclamo',id:r.id});
      else notificar('p_reclamo','Respuesta a tu reclamo','DP World respondió '+r.numero+(fp?' · pago programado para el '+fecha(fp):'')+'.',{act:'verReclamo',id:r.id},{provId:r.provId});
      toast('Respuesta enviada.');pintar();verReclamo(id);}});
  }
  modal('Reclamo '+r.numero,
    '<div style="margin-bottom:14px">'+chip(r.estado,ESTADO_RC)+' <span class="mut">'+esc(TIPO_RC[r.tipo])+(pv?'':' · '+esc(prov(r.provId).nombre))+'</span></div>'+
    (f?'<div class="kv">'+[['Factura',f.numero],['Total',money(f.total)],['Saldo',money(c.saldo)],['Venció',fecha(f.vence)],['Días vencida',c.vencida?String(c.dias):'—'],['Estado de la factura',ESTADO_FAC[c.est][0]]].map(([k,v])=>'<div><span>'+k+'</span><b>'+esc(v)+'</b></div>').join('')+'</div>'+
      '<div style="margin:-4px 0 14px"><button class="btn sm" data-act="verFac" data-id="'+f.id+'">Ver la factura →</button></div>':'')+
    '<div class="hilo">'+r.hilo.map(h=>'<div class="msg '+(h.lado==='dpw'?'dpw':'prov')+'"><small>'+esc(h.u)+' · '+esc(h.t.slice(0,10).split('-').reverse().join('/')+' '+h.t.slice(11))+'</small>'+esc(h.texto)+(h.fechaProg?'<div class="prog">Pago programado para el '+fecha(h.fechaProg)+'</div>':'')+'</div>').join('')+'</div>'+
    (r.estado!=='cerrado'?'<div class="form"><label class="f full"><span>'+(pv?'Escribe a DP World':'Respuesta al proveedor')+'</span><textarea class="in" id="rcTxt" rows="3"></textarea></label>'+
      (pv?'':'<label class="f"><span>Fecha programada de pago (opcional)</span><input class="in" type="date" id="rcFecha" min="'+hoy()+'"></label>')+'</div><div class="err-msg" id="mErr"></div>':''),acc);
}

/* ════════ MAPA DE PAGOS ════════
   Filas: proveedores. Columnas: meses. Verde: todo pagado · rojo: hay facturas vencidas sin pagar · ámbar: por vencer. */
const MESES=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function vMapa(){
  const base=S.f.mb||'vence',n=S.f.mm||'6';
  return '<div class="vhead"><div><h1 class="vtitle">Mapa de pagos</h1><p class="vsub">'+(esProv()?'Tus facturas por mes':'Proveedores por mes')+': pagadas en verde, vencidas en rojo, por vencer en ámbar. Toca una celda para ver sus facturas.</p></div></div>'+
    '<div class="filtros"><select class="sel" data-f="mb"><option value="vence"'+(base==='vence'?' selected':'')+'>Por mes de vencimiento</option><option value="fecha"'+(base==='fecha'?' selected':'')+'>Por mes de la factura</option></select>'+
    '<select class="sel" data-f="mm">'+['6','12'].map(x=>'<option value="'+x+'"'+(n===x?' selected':'')+'>Últimos '+x+' meses</option>').join('')+'</select></div>'+
    '<div class="ley"><span><i style="background:#00C389"></i>Pagadas</span><span><i style="background:#E8003D"></i>Vencidas sin pagar</span><span><i style="background:#f5a20b"></i>Por vencer o pago parcial al día</span></div><div id="lista"></div>';
}
function mesesMapa(){
  const n=+(S.f.mm||6),[y,m]=hoy().split('-').map(Number),out=[];
  for(let i=n-2;i>=-1;i--){const d=new Date(y,m-1-i,1);out.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}
  return out;
}
function celdasMapa(){
  const base=S.f.mb||'vence',meses=mesesMapa(),cel={};
  facturasVisibles().filter(f=>f.estado!=='rechazada').forEach(f=>{
    const k=(base==='fecha'?f.fecha:f.vence).slice(0,7);if(!meses.includes(k))return;
    const c=calc(f),x=cel[f.provId+'|'+k]=cel[f.provId+'|'+k]||{pag:0,venc:0,pend:0,mPag:0,mVenc:0,mPend:0,total:0,ids:[]};
    x.ids.push(f.id);x.total+=f.total;
    if(c.est==='pagada'){x.pag++;x.mPag+=f.total;}else if(c.vencida){x.venc++;x.mVenc+=c.saldo;x.mPag+=c.pagado;}else{x.pend++;x.mPend+=c.saldo;x.mPag+=c.pagado;}
  });
  return {meses,cel};
}
function pintarMapa(){
  const {meses,cel}=celdasMapa();
  const provs=(esProv()?[prov(miProv())]:S.db.proveedores).filter(p=>meses.some(m=>cel[p.id+'|'+m])).sort((a,b)=>a.nombre.localeCompare(b.nombre));
  if(!provs.length){$('lista').innerHTML='<div class="card vacio">No hay facturas en estos meses.</div>';return;}
  const tot=meses.map(m=>provs.reduce((t,p)=>{const x=cel[p.id+'|'+m];if(x){t.p+=x.mPag;t.v+=x.mVenc;t.e+=x.mPend;}return t;},{p:0,v:0,e:0}));
  const mesLbl=k=>MESES[+k.slice(5)-1]+' '+k.slice(2,4);
  $('lista').innerHTML='<div class="tw mapa"><table><thead><tr><th>Proveedor</th>'+meses.map(m=>'<th class="mes'+(m===hoy().slice(0,7)?'" style="color:var(--ind-t)':'')+'">'+mesLbl(m)+'</th>').join('')+'</tr></thead><tbody>'+
    provs.map(p=>'<tr><td class="pv b">'+esc(p.nombre)+'<div class="mut">'+p.plazo+' días de crédito</div></td>'+meses.map(m=>{const x=cel[p.id+'|'+m];
      if(!x)return '<td class="cel"><span class="c vac">—</span></td>';
      const cls=x.venc?'rojo':x.pend?'ambar':'verde',det=[x.pag?x.pag+' pagada'+(x.pag>1?'s':''):'',x.venc?x.venc+' vencida'+(x.venc>1?'s':''):'',x.pend?x.pend+' por vencer':''].filter(Boolean).join(' · ');
      return '<td class="cel"><button type="button" class="c '+cls+'" data-act="verCelda" data-id="'+p.id+'|'+m+'" title="'+esc(p.nombre+' · '+mesLbl(m)+' · '+det)+'"><b>'+money(x.total)+'</b><small>'+det+'</small></button></td>';}).join('')+'</tr>').join('')+
    '<tr><td class="pv b">Total del mes</td>'+tot.map(t=>'<td class="cel" style="font-size:12px;line-height:1.5">'+([t.p?'<span style="color:var(--ok);font-weight:700">'+money(t.p)+'</span>':'',t.v?'<span style="color:var(--err);font-weight:700">'+money(t.v)+'</span>':'',t.e?'<span style="color:var(--warn)">'+money(t.e)+'</span>':''].filter(Boolean).join('<br>')||'<span class="mut">—</span>')+'</td>').join('')+'</tr>'+
    '</tbody></table></div><p class="mut" style="margin-top:8px">En la fila de totales: pagado en verde, vencido sin pagar en rojo y por vencer en ámbar.</p>';
  const tw=$('lista').querySelector('.tw');tw.scrollLeft=tw.scrollWidth;   // en el celular abre en los meses recientes
}
function verCelda(key){
  const [pid,m]=key.split('|'),{cel}=celdasMapa(),x=cel[key];if(!x)return;
  modal(prov(pid).nombre+' · '+MESES[+m.slice(5)-1]+' '+m.slice(0,4),'<div class="tw"><table><thead><tr><th>Factura</th><th>Vence</th><th class="num">Total</th><th class="num">Saldo</th><th>Estado</th></tr></thead><tbody>'+
    x.ids.map(fac).sort((a,b)=>a.vence.localeCompare(b.vence)).map(f=>{const c=calc(f);return '<tr class="clic" data-act="verFac" data-id="'+f.id+'"><td class="b">'+esc(f.numero)+'</td><td>'+fecha(f.vence)+(c.vencida?'<div style="color:var(--err);font-size:12px;font-weight:700">Vencida hace '+c.dias+' d</div>':'')+'</td><td class="num">'+money(f.total)+'</td><td class="num b">'+money(c.saldo)+'</td><td>'+chip(c.est,ESTADO_FAC)+'</td></tr>';}).join('')+
    '</tbody></table></div>',[{t:'Cerrar',on:cerrarModal}]);
}


/* ════════ BITÁCORA ════════
   Junta el historial de cada proveedor, factura y pago, más las acciones de configuración.
   Las entradas no se editan ni se borran desde la app. */
function bitacora(){
  const e=[];
  S.db.proveedores.forEach(p=>(p.log||[]).forEach(l=>e.push({t:l.t,u:l.u,a:l.a,tipo:'Proveedor',doc:p.codigo,prov:p.nombre,act:'verProv',id:p.id,txt:p.ruc})));
  S.db.facturas.forEach(f=>{const p=prov(f.provId);(f.log||[]).forEach(l=>e.push({t:l.t,u:l.u,a:l.a,tipo:'Factura',doc:'Factura '+f.numero,prov:p?p.nombre:'',act:'verFac',id:f.id,txt:f.oc}));});
  S.db.pagos.forEach(g=>{const p=prov(g.provId),nums=g.items.map(i=>{const f=fac(i.facId);return f?f.numero:'';}).join(' ');(g.log||[]).forEach(l=>e.push({t:l.t,u:l.u,a:l.a,tipo:'Pago',doc:'Pago '+g.numero,prov:p?p.nombre:'',act:'verPago',id:g.id,txt:nums+' '+g.referencia}));});
  S.db.reclamos.forEach(r=>{const p=prov(r.provId),f=fac(r.facId);r.hilo.forEach((h,i)=>e.push({t:h.t,u:h.u,a:(i===0?'Abrió el reclamo · '+TIPO_RC[r.tipo]+': ':h.lado==='dpw'?'Respondió'+(h.fechaProg?' · pago programado para el '+fecha(h.fechaProg):'')+': ':'Escribió: ')+h.texto,tipo:'Reclamo',doc:r.numero+' · '+(f?f.numero:''),prov:p?p.nombre:'',act:'verReclamo',id:r.id,txt:''}));
    (r.log||[]).forEach(l=>e.push({t:l.t,u:l.u,a:l.a,tipo:'Reclamo',doc:r.numero,prov:p?p.nombre:'',act:'verReclamo',id:r.id,txt:''}));});
  (S.db.bitacora||[]).forEach(l=>e.push({t:l.t,u:l.u,a:l.a,tipo:'Configuración',doc:l.doc,prov:'',act:'',id:'',txt:''}));
  return e.sort((a,b)=>b.t.localeCompare(a.t));
}
function filtrarBitacora(){
  const q=S.f.bq.toLowerCase(),F=S.f;
  return bitacora().filter(x=>(!F.bt||x.tipo===F.bt)&&(!F.bu||x.u===F.bu)&&(!F.bd||x.t.slice(0,10)>=F.bd)&&(!F.bh||x.t.slice(0,10)<=F.bh)&&
    (!q||(x.a+' '+x.doc+' '+x.prov+' '+x.u+' '+x.txt).toLowerCase().includes(q)));
}
function vBitacora(){
  const usuarios=[...new Set(bitacora().map(x=>x.u))].sort();
  return '<div class="vhead"><div><h1 class="vtitle">Bitácora</h1><p class="vsub">Cada acción con quién la hizo y cuándo: registros, archivos, validaciones, aprobaciones, pagos y cambios de configuración.</p></div>'+
    '<div class="noprint" style="display:flex;gap:8px"><button class="btn" data-act="csvBitacora">Exportar CSV</button><button class="btn" data-act="imprimir">Imprimir</button></div></div>'+
    '<div class="filtros"><input class="in" placeholder="Buscar por factura, pago, proveedor, acción o referencia" data-f="bq" value="'+esc(S.f.bq)+'">'+
    '<select class="sel" data-f="bt"><option value="">Todo</option>'+['Proveedor','Factura','Pago','Reclamo','Configuración'].map(t=>'<option'+(S.f.bt===t?' selected':'')+'>'+t+'</option>').join('')+'</select>'+
    '<select class="sel" data-f="bu"><option value="">Todos los usuarios</option>'+usuarios.map(u=>'<option'+(S.f.bu===u?' selected':'')+'>'+esc(u)+'</option>').join('')+'</select>'+
    '<label class="f" style="flex:0 1 160px"><span>Desde</span><input class="in" type="date" data-f="bd" value="'+esc(S.f.bd)+'"></label>'+
    '<label class="f" style="flex:0 1 160px"><span>Hasta</span><input class="in" type="date" data-f="bh" value="'+esc(S.f.bh)+'"></label></div>'+
    '<div id="lista"></div>';
}
const TIPO_CHIP={Proveedor:'ind',Factura:'info',Pago:'ok',Reclamo:'warn','Configuración':''};
function listaBitacora(){
  const l=filtrarBitacora(),ver=l.slice(0,S.bVer);
  $('lista').innerHTML=l.length?'<div class="tw"><table><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th class="hide-sm">Documento</th><th class="hide-sm">Proveedor</th></tr></thead><tbody>'+
    ver.map(x=>'<tr'+(x.act?' class="clic" data-act="'+x.act+'" data-id="'+x.id+'"':'')+'><td style="white-space:nowrap">'+esc(x.t.slice(0,10).split('-').reverse().join('/'))+' <span class="mut">'+esc(x.t.slice(11))+'</span></td><td class="b">'+esc(x.u)+'</td>'+
      '<td>'+esc(x.a)+'<div class="mut show-sm">'+esc(x.doc)+(x.prov?' · '+esc(x.prov):'')+'</div></td><td class="hide-sm"><span class="chip '+TIPO_CHIP[x.tipo]+'">'+esc(x.tipo)+'</span> <span class="b">'+esc(x.doc)+'</span></td><td class="hide-sm mut">'+esc(x.prov)+'</td></tr>').join('')+
    '</tbody></table></div><div class="tot"><span class="mut">'+(l.length>ver.length?'Mostrando '+ver.length+' de ':'')+l.length+(l.length===1?' acción':' acciones')+'</span>'+(l.length>ver.length?'<button class="btn sm" data-act="masBitacora">Mostrar más</button>':'')+'</div>'
    :'<div class="card vacio">No hay acciones con ese filtro.</div>';
}
function csvBitacora(){
  const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const rows=[['Fecha','Hora','Usuario','Tipo','Documento','Proveedor','Acción']].concat(filtrarBitacora().map(x=>[x.t.slice(0,10).split('-').reverse().join('/'),x.t.slice(11),x.u,x.tipo,x.doc,x.prov,x.a]));
  const b=new Blob(['\ufeff'+rows.map(r=>r.map(q).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='bitacora-proveedores-'+hoy()+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}

