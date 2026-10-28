/* DP World Panamá · escenas animadas del login (una por app).
   Cada escena dibuja el fondo grande (svg[data-dpw-art], viewBox 1000×380) y la franja del piso
   (svg[data-dpw-ground], viewBox 1400×150). SVG + SMIL; dpw-shell.js las pausa cuando el login no está a la vista.
   Paleta: índigo #2a2770 / #3E3C90, trazo #8a88e0, acentos #00C389 (verde), #f5a20b (ámbar), #0099e6 (azul).
   Escena nueva = nueva función aquí y su fila en la tabla del SKILL.md. Siempre se le pregunta al usuario cuál va. */
(function(){
'use strict';
const DPW=window.DPW=window.DPW||{};DPW.ESCENAS=DPW.ESCENAS||{};
const V='#2a2770',V2='#3E3C90',L='#8a88e0',G='#00C389',A='#f5a20b',B='#0099e6',W='#fff',N='#0b0924';
const lbl=(x,y,t,o)=>'<text x="'+x+'" y="'+y+'" fill="rgba(255,255,255,'+((o&&o.op)||.5)+')" font-size="'+((o&&o.fs)||10)+'" font-weight="700" letter-spacing="1.2"'+(o&&o.anchor?' text-anchor="'+o.anchor+'"':'')+'>'+t+'</text>';
const rep=(attr,values,dur,extra)=>'<animate attributeName="'+attr+'" values="'+values+'" dur="'+dur+'" repeatCount="indefinite"'+(extra||'')+'/>';
const mov=(values,dur,extra)=>'<animateTransform attributeName="transform" type="translate" values="'+values+'" dur="'+dur+'" repeatCount="indefinite"'+(extra||'')+'/>';
const art=(svg,html)=>{svg.setAttribute('viewBox','0 0 1000 380');svg.setAttribute('preserveAspectRatio','xMidYMid meet');svg.innerHTML=html;};
const ground=(svg,html)=>{if(!svg)return;svg.setAttribute('viewBox','0 0 1400 150');svg.setAttribute('preserveAspectRatio','xMidYMax slice');svg.innerHTML=html;};
const fit=svg=>{const p=svg.parentElement;if(p)p.classList.add('dpw-fit');};
const piso='<rect y="118" width="1400" height="32" fill="'+N+'"/><rect y="117" width="1400" height="2" fill="'+G+'" opacity=".6"/><path d="M0 134h1400" stroke="rgba(255,255,255,.18)" stroke-dasharray="18 14"/>';

/* camión con contenedor (mira a la derecha, base en y=0) */
const camion=(col)=>'<rect x="0" y="-58" width="96" height="26" rx="2" fill="'+col+'"/><path d="M14 -58v26M28 -58v26M42 -58v26M56 -58v26M70 -58v26M84 -58v26" stroke="rgba(0,0,0,.25)"/>'+
  '<path d="M100 -52h22l10 10v12h-32z" fill="'+W+'"/><rect x="104" y="-49" width="14" height="8" fill="#1A1060"/><rect x="-4" y="-32" width="104" height="4" fill="'+V2+'"/>'+
  '<g fill="'+N+'" stroke="'+L+'" stroke-width="2"><circle cx="18" cy="-28" r="7"/><circle cx="36" cy="-28" r="7"/><circle cx="84" cy="-28" r="7"/><circle cx="118" cy="-28" r="7"/></g>';
/* montacargas (mira a la derecha, base en y=0); la horquilla con su pallet va en un grupo aparte que sube y baja */
const montacargas=(lift)=>'<path d="M0 -12V-34h18l8-22h14v44z" fill="'+V2+'" stroke="'+L+'" stroke-width="1.5"/><rect x="-6" y="-30" width="8" height="20" fill="'+V+'"/>'+
  '<path d="M44 -66V-6M50 -66V-6" stroke="'+L+'" stroke-width="3"/>'+
  '<g fill="'+N+'" stroke="'+L+'" stroke-width="2"><circle cx="10" cy="-7" r="7"/><circle cx="36" cy="-7" r="7"/></g>'+
  '<g><rect x="50" y="-6" width="30" height="3" fill="'+L+'"/><rect x="51" y="-11" width="28" height="5" fill="#6b5a3a"/><rect x="53" y="-31" width="24" height="20" fill="'+A+'" opacity=".85"/><path d="M53 -21h24M65 -31v20" stroke="rgba(0,0,0,.2)"/>'+(lift||'')+'</g>';

/* ── Franjas del piso ── */
const terminal=()=>piso+
  '<g fill="'+V+'"><rect x="60" y="74" width="54" height="22"/><rect x="60" y="96" width="54" height="22"/><rect x="116" y="96" width="54" height="22" fill="'+V2+'"/><rect x="116" y="74" width="54" height="22" fill="'+G+'" opacity=".75"/><rect x="172" y="96" width="54" height="22" fill="'+A+'" opacity=".75"/></g>'+
  '<path d="M290 118V24M350 118V24M270 26h150M400 26v22" stroke="'+L+'" stroke-width="5" fill="none"/>'+
  '<rect x="388" y="48" width="26" height="12" fill="'+G+'">'+rep('y','48;80;48','5s')+'</rect>'+
  '<g><path d="M1040 104h300l-24 20h-256z" fill="'+V+'"/><g fill="'+V2+'"><rect x="1080" y="86" width="40" height="18"/><rect x="1122" y="86" width="40" height="18" fill="'+G+'" opacity=".8"/><rect x="1164" y="86" width="40" height="18"/><rect x="1206" y="86" width="40" height="18" fill="'+A+'" opacity=".8"/><rect x="1122" y="68" width="40" height="18"/><rect x="1164" y="68" width="40" height="18" fill="'+B+'" opacity=".8"/></g><rect x="1270" y="70" width="22" height="34" fill="'+W+'" opacity=".85"/>'+mov('0 0;60 0;0 0','14s')+'</g>'+
  '<g><g transform="translate(0 150)">'+camion(G)+'</g>'+mov('-160 0;1500 0','11s')+'</g>';

/* línea de producción: banda continua con cajas; opcional montacargas y arco de control */
function linea(o){
  o=o||{};let cajas='';
  for(let x=-140;x<1540;x+=140)cajas+='<rect x="'+x+'" y="74" width="34" height="22" fill="'+V2+'" stroke="rgba(255,255,255,.15)"/><path d="M'+(x+17)+' 74v22" stroke="rgba(0,0,0,.25)"/>';
  let rod='';for(let x=142;x<1400;x+=24)rod+='<circle cx="'+x+'" cy="100" r="3.5"/>';
  let s=piso+
    '<g fill="'+V+'"><rect x="20" y="70" width="44" height="48"/><rect x="66" y="88" width="44" height="30" fill="'+V2+'"/><rect x="20" y="52" width="44" height="18" fill="'+A+'" opacity=".7"/></g>'+
    '<rect x="130" y="96" width="1270" height="8" fill="#252368" stroke="'+L+'" stroke-width="1"/><g fill="'+N+'" stroke="'+L+'" stroke-width="1">'+rod+'</g>'+
    '<path d="M160 104v14M460 104v14M760 104v14M1060 104v14M1360 104v14" stroke="'+L+'" stroke-width="3"/>'+
    '<svg x="130" y="0" width="1270" height="150" overflow="hidden"><g transform="translate(-130 0)"><g>'+cajas+mov('-140 0;0 0','3.6s')+'</g></g></svg>';
  if(o.arco)s+='<path d="M880 118V40M960 118V40M872 40h96" stroke="'+L+'" stroke-width="4" fill="none"/><rect x="900" y="30" width="40" height="8" rx="2" fill="'+G+'">'+rep('fill',G+';'+G+';'+A+';'+G,'3.6s')+'</rect>'+
    '<path d="M890 46h60" stroke="'+G+'" stroke-width="2" opacity=".7">'+rep('opacity','.2;.9;.2','1.8s')+'</path>'+lbl(920,24,'CONTROL',{anchor:'middle',fs:11});
  if(o.montacargas)s+='<g><g transform="translate(0 143) scale(-1 1)">'+montacargas()+'</g>'+mov('1500 0;-120 0','16s')+'</g>';
  return s;
}

/* ── Control de Horas: bodega con racks, montacargas y línea de producción ── */
DPW.ESCENAS.bodega=function(svg,gr){
  fit(svg);
  const racks=(x0,ancho,nombre,semilla)=>{
    let r='',bays=3,w=ancho/bays,niv=[150,210,270],cols=[V,V2,V,G,V2,A,V,V2,B];
    for(let i=0;i<=bays;i++)r+='<path d="M'+(x0+i*w)+' 96V332" stroke="'+L+'" stroke-width="3"/>';
    niv.concat([96]).forEach(y=>r+='<path d="M'+x0+' '+y+'h'+ancho+'" stroke="'+A+'" stroke-width="3" opacity=".7"/>');
    niv.forEach((y,li)=>{for(let b=0;b<bays;b++){const k=(b*3+li+semilla)%cols.length;if((b+li+semilla)%4===3)continue;
      const px=x0+b*w+8,pw=w-16;r+='<rect x="'+px+'" y="'+(y-6)+'" width="'+pw+'" height="5" fill="#6b5a3a"/><rect x="'+(px+3)+'" y="'+(y-40)+'" width="'+(pw-6)+'" height="34" fill="'+cols[k]+'" opacity="'+(cols[k]===V||cols[k]===V2?1:.75)+'" stroke="rgba(255,255,255,.12)"/><path d="M'+(px+pw/2)+' '+(y-40)+'v34" stroke="rgba(0,0,0,.22)"/>';}});
    [...Array(bays)].forEach((_,b)=>{if((b+semilla)%2)return;const px=x0+b*w+8,pw=w-16;r+='<rect x="'+px+'" y="326" width="'+pw+'" height="5" fill="#6b5a3a"/><rect x="'+(px+3)+'" y="292" width="'+(pw-6)+'" height="34" fill="'+V+'" stroke="rgba(255,255,255,.12)"/>';});
    return r+lbl(x0,86,nombre);
  };
  let cajas='';for(let i=0;i<4;i++)cajas+='<g><rect x="0" y="0" width="28" height="22" fill="'+(i===2?G:V2)+'" stroke="rgba(255,255,255,.18)"/><path d="M14 0v22" stroke="rgba(0,0,0,.25)"/>'+
    '<animateTransform attributeName="transform" type="translate" values="372 238;632 238" dur="8s" begin="-'+(i*2)+'s" repeatCount="indefinite"/>'+rep('opacity','0;1;1;0','8s',' keyTimes="0;.06;.94;1" begin="-'+(i*2)+'s"')+'</g>';
  let rod='';for(let x=372;x<=660;x+=18)rod+='<circle cx="'+x+'" cy="265" r="3.5"/>';
  art(svg,
    '<defs><linearGradient id="dpwLuz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>'+
    '<path d="M20 30h960" stroke="rgba(255,255,255,.12)" stroke-width="2"/>'+
    [200,500,800].map(x=>'<path d="M'+(x-30)+' 36h60l70 300h-200z" fill="url(#dpwLuz)"/><rect x="'+(x-30)+'" y="32" width="60" height="5" rx="2" fill="#fff" opacity=".6"/>').join('')+
    racks(50,300,'RACK A',0)+racks(650,300,'RACK B',2)+
    lbl(500,64,'TURNO A · 06:00 — 14:00',{anchor:'middle',fs:12,op:.7})+
    '<rect x="420" y="74" width="160" height="4" rx="2" fill="rgba(255,255,255,.12)"/><rect x="420" y="74" width="0" height="4" rx="2" fill="'+G+'">'+rep('width','0;160','14s')+'</rect>'+
    lbl(380,196,'LÍNEA 1')+
    '<path d="M470 258V200M530 258V200M462 200h76" stroke="'+L+'" stroke-width="3" fill="none"/><rect x="486" y="192" width="28" height="7" rx="2" fill="'+G+'">'+rep('opacity','1;.25;1','2s')+'</rect>'+
    '<rect x="364" y="258" width="304" height="10" fill="#252368" stroke="'+L+'"/><g fill="'+N+'" stroke="'+L+'">'+rod+'</g><path d="M380 268v64M650 268v64M515 268v64" stroke="'+L+'" stroke-width="3"/>'+cajas+
    '<path d="M0 332h1000" stroke="rgba(255,255,255,.22)" stroke-width="2"/><path d="M0 352h1000" stroke="rgba(255,255,255,.12)" stroke-dasharray="22 16"/>'+
    '<g><g transform="translate(0 344)">'+montacargas('<animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -44;0 -44;0 0;0 0" keyTimes="0;.42;.5;.6;.66;1" dur="14s" repeatCount="indefinite"/>')+'</g>'+
      '<animateTransform attributeName="transform" type="translate" values="150 0;150 0;560 0;560 0;150 0" keyTimes="0;.08;.42;.66;1" dur="14s" repeatCount="indefinite" calcMode="spline" keySplines=".4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1"/></g>');
  ground(gr,linea({montacargas:true}));
};

/* ── Inspección de Contenedores: patio con pilas, grúa de patio y camión que entra ── */
DPW.ESCENAS.patio=function(svg,gr){
  fit(svg);
  const cols=[V2,V,G,V2,A,V,B,V2,V,V2,G,V];
  const pila=(x0,filas,alto,nombre,s)=>{let r='';for(let c=0;c<filas;c++){const h=alto[c%alto.length];for(let n=0;n<h;n++){const k=(c*2+n+s)%cols.length,y=332-(n+1)*30;
      r+='<rect x="'+(x0+c*64)+'" y="'+y+'" width="62" height="28" rx="1" fill="'+cols[k]+'" opacity="'+(cols[k]===V||cols[k]===V2?1:.8)+'"/><path d="M'+(x0+c*64+10)+' '+y+'v28M'+(x0+c*64+20)+' '+y+'v28M'+(x0+c*64+30)+' '+y+'v28M'+(x0+c*64+40)+' '+y+'v28M'+(x0+c*64+50)+' '+y+'v28" stroke="rgba(0,0,0,.22)"/>';}}
    return r+lbl(x0,332-Math.max(...alto)*30-12,nombre);};
  const T='22s',KT=' keyTimes="0;.12;.22;.34;.5;.62;.72;.84;1"';
  art(svg,
    '<path d="M20 332h960" stroke="rgba(255,255,255,.22)" stroke-width="2"/><path d="M0 356h1000" stroke="rgba(255,255,255,.12)" stroke-dasharray="22 16"/>'+
    [90,910].map(x=>'<path d="M'+x+' 332V60M'+(x-14)+' 60h28" stroke="'+L+'" stroke-width="3"/><rect x="'+(x-12)+'" y="54" width="24" height="6" fill="#fff" opacity=".6"/>').join('')+
    pila(120,3,[4,3,2],'BLOQUE A',0)+pila(690,3,[2,4,3],'BLOQUE B',3)+
    /* grúa de patio (RTG) sobre el bloque central */
    pila(400,3,[3,1,2],'',5)+
    '<path d="M380 340V110M620 340V110" stroke="'+L+'" stroke-width="6"/><path d="M372 110h256M372 122h256" stroke="'+L+'" stroke-width="4"/><path d="M380 110l20 12M620 110l-20 12" stroke="'+L+'" stroke-width="2"/>'+
    '<rect x="364" y="336" width="32" height="10" rx="3" fill="'+V2+'"/><rect x="604" y="336" width="32" height="10" rx="3" fill="'+V2+'"/>'+
    lbl(500,98,'INSPECCIÓN · PATIO',{anchor:'middle',fs:12,op:.7})+
    '<g><rect x="-16" y="104" width="32" height="12" fill="'+W+'" opacity=".85"/>'+
      '<line x1="0" y1="116" x2="0" y2="150" stroke="'+L+'" stroke-width="1.5">'+rep('y2','150;150;214;214;150;150;214;214;150','22s',KT)+'</line>'+
      '<g><rect x="-31" y="150" width="62" height="28" rx="1" fill="'+G+'"/><path d="M-21 150v28M-11 150v28M-1 150v28M9 150v28M19 150v28" stroke="rgba(0,0,0,.22)"/><rect x="-33" y="146" width="66" height="4" fill="'+L+'"/>'+
        mov('0 0;0 0;0 64;0 64;0 0;0 0;0 64;0 64;0 0',T,KT)+'</g>'+
      mov('436 0;436 0;436 0;436 0;564 0;564 0;564 0;564 0;436 0',T,KT+' calcMode="spline" keySplines="'+Array(8).fill('.4 0 .2 1').join(';')+'"')+'</g>'+
    /* camión que entra al patio y sale */
    '<g><g transform="translate(0 362)">'+camion(A)+'</g>'+mov('-180 0;250 0;250 0;1100 0','16s',' keyTimes="0;.35;.6;1" calcMode="spline" keySplines=".2 .6 .3 1;0 0 1 1;.6 0 .8 .4"')+'</g>');
  ground(gr,terminal());
};

/* ── Cotizador 3PL: flujo de servicios que se cotizan ── */
DPW.ESCENAS.flujo=function(svg,gr){
  fit(svg);
  const ST=[{x:350,t:'CONTENEDOR',s:'por contenedor'},{x:480,t:'DESCARGUE',s:'por bulto'},{x:610,t:'ALMACÉN',s:'por CBM al mes'},{x:740,t:'DESPACHO',s:'por pedido'}];
  const Y=200,D='16s',ruta='M350 '+Y+'H740';
  const dib=[
    /* contenedor */ '<rect x="-46" y="-26" width="92" height="44" rx="2" fill="'+V2+'"/><path d="M-30 -26v44M-15 -26v44M0 -26v44M15 -26v44M30 -26v44" stroke="rgba(0,0,0,.25)"/><path d="M46 -24v40" stroke="'+G+'" stroke-width="3"/>',
    /* descargue: cajas saliendo */ '<rect x="-40" y="-6" width="26" height="24" fill="'+V2+'" stroke="rgba(255,255,255,.15)"/><rect x="-12" y="-6" width="26" height="24" fill="'+V+'" stroke="rgba(255,255,255,.15)"/><rect x="-26" y="-32" width="26" height="24" fill="'+V2+'" stroke="rgba(255,255,255,.15)"/><rect x="16" y="-6" width="26" height="24" fill="'+G+'" opacity=".8"><animate attributeName="y" values="-6;-14;-6" dur="2s" repeatCount="indefinite"/></rect>',
    /* almacén: rack */ '<path d="M-44 18V-40M0 18V-40M44 18V-40" stroke="'+L+'" stroke-width="3"/><path d="M-44 -40h88M-44 -12h88M-44 18h88" stroke="'+A+'" stroke-width="3" opacity=".7"/><rect x="-40" y="-36" width="36" height="22" fill="'+V2+'"/><rect x="4" y="-36" width="36" height="22" fill="'+B+'" opacity=".75"/><rect x="-40" y="-8" width="36" height="24" fill="'+V+'"/><rect x="4" y="-8" width="36" height="24" fill="'+V2+'"/>',
    /* despacho: camión pequeño */ '<rect x="-46" y="-22" width="62" height="32" rx="2" fill="'+V2+'"/><path d="M20 -16h16l10 10v16h-26z" fill="'+W+'" opacity=".9"/><g fill="'+N+'" stroke="'+L+'" stroke-width="2"><circle cx="-30" cy="14" r="7"/><circle cx="-4" cy="14" r="7"/><circle cx="34" cy="14" r="7"/></g>'
  ];
  /* el paquete se detiene en cada estación: 0 · .33 · .66 · 1 del recorrido */
  const kp='0;0;.333;.333;.667;.667;1;1',kt='0;.1;.3;.4;.6;.7;.9;1';
  let est='';
  ST.forEach((s,i)=>{
    const on=['0;.1;.3','.3;.4;.6','.6;.7;.9','.9;.95;1'][i];
    est+='<g transform="translate('+s.x+' '+(Y-86)+')">'+dib[i]+'</g>'+
      '<circle cx="'+s.x+'" cy="'+Y+'" r="20" fill="#16143d" stroke="'+L+'" stroke-width="2"/>'+
      '<circle cx="'+s.x+'" cy="'+Y+'" r="20" fill="none" stroke="'+G+'" stroke-width="3" opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;'+on.split(';')[0]+';'+on.split(';')[0]+';'+on.split(';')[1]+';'+on.split(';')[2]+';1" dur="'+D+'" repeatCount="indefinite"/></circle>'+
      '<text x="'+s.x+'" y="'+(Y+5)+'" text-anchor="middle" fill="#fff" font-size="14" font-weight="800">'+(i+1)+'</text>'+
      lbl(s.x,Y+46,s.t,{anchor:'middle',fs:14,op:.85})+lbl(s.x,Y+64,s.s.toUpperCase(),{anchor:'middle',fs:10,op:.45});
  });
  art(svg,
    '<path d="'+ruta+'" stroke="rgba(255,255,255,.18)" stroke-width="3"/><path d="'+ruta+'" stroke="'+G+'" stroke-width="3" stroke-dasharray="390" stroke-dashoffset="390" opacity=".8">'+
      '<animate attributeName="stroke-dashoffset" values="390;390;260;260;130;130;0;0" keyTimes="'+kt+'" dur="'+D+'" repeatCount="indefinite"/></path>'+
    est+
    '<g><rect x="-11" y="-11" width="22" height="22" rx="3" fill="'+A+'"/><path d="M-11 0h22M0 -11v22" stroke="rgba(0,0,0,.25)"/>'+
      '<animateMotion path="'+ruta+'" keyPoints="'+kp+'" keyTimes="'+kt+'" calcMode="linear" dur="'+D+'" repeatCount="indefinite"/></g>'+
    lbl(500,330,'TARIFA = SERVICIO × UNIDAD × VOLUMEN',{anchor:'middle',fs:12,op:.55})+
    '<g font-size="12" font-weight="800" letter-spacing="1" fill="'+G+'">'+['USD / CBM','USD / PALLET','USD / MES','USD / BULTO'].map((t,i)=>'<text x="'+(360+i*120)+'" y="370" opacity="0">'+t+
      '<animate attributeName="y" values="370;346;330" dur="6s" begin="'+(i*1.5)+'s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;.8;0" dur="6s" begin="'+(i*1.5)+'s" repeatCount="indefinite"/></text>').join('')+'</g>');
  ground(gr,terminal());
};

/* ── Alertas de Calidad: radar sobre el plano de la bodega; un punto cambia a ámbar ── */
DPW.ESCENAS.radar=function(svg,gr){
  fit(svg);
  let plano='';
  for(let r=0;r<6;r++)for(let c=0;c<2;c++)plano+='<rect x="'+(250+c*300+(c?30:0))+'" y="'+(70+r*42)+'" width="'+(c?220:250)+'" height="18" rx="2" fill="'+V+'" stroke="rgba(255,255,255,.08)"/>';
  let puntos='';
  const P=[[300,79],[420,163],[700,121],[780,247],[350,289],[640,205]];
  P.forEach((p,i)=>{
    puntos+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="'+G+'"/>';
    [0,1].forEach(k=>puntos+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="4" fill="none" stroke="'+G+'" stroke-width="1.4">'+rep('r','4;26','3s',' begin="'+(i*.5+k*1.5)+'s"')+rep('opacity','.8;0','3s',' begin="'+(i*.5+k*1.5)+'s"')+'</circle>');
  });
  /* alerta: un punto que pasa a ámbar con pulso más grande y su etiqueta */
  const ax=560,ay=163,T='8s';
  const alerta='<circle cx="'+ax+'" cy="'+ay+'" r="5" fill="'+G+'">'+rep('fill',G+';'+G+';'+A+';'+A+';'+G,T,' keyTimes="0;.35;.4;.9;1"')+'</circle>'+
    '<circle cx="'+ax+'" cy="'+ay+'" r="5" fill="none" stroke="'+A+'" stroke-width="2" opacity="0">'+rep('r','5;5;60;5;60;5;60;5',T,' keyTimes="0;.4;.56;.56;.72;.72;.88;1"')+rep('opacity','0;.9;0;.9;0;.9;0;0',T,' keyTimes="0;.4;.56;.56;.72;.72;.88;1"')+'</circle>'+
    '<g opacity="0">'+rep('opacity','0;0;1;1;0',T,' keyTimes="0;.4;.45;.88;.92"')+
      '<path d="M'+ax+' '+ay+'l18 -26h70" stroke="'+A+'" stroke-width="1.5" fill="none"/>'+
      '<rect x="'+(ax+20)+'" y="'+(ay-52)+'" width="128" height="22" rx="3" fill="#16143d" stroke="'+A+'"/>'+
      '<text x="'+(ax+28)+'" y="'+(ay-37)+'" fill="'+A+'" font-size="11" font-weight="800" letter-spacing="1">ALERTA · LOTE 0418</text></g>';
  art(svg,
    '<defs><linearGradient id="dpwBarrido" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="'+G+'" stop-opacity="0"/><stop offset="1" stop-color="'+G+'" stop-opacity=".22"/></linearGradient></defs>'+
    '<rect x="220" y="44" width="560" height="290" rx="6" fill="none" stroke="'+L+'" stroke-width="2"/><path d="M220 334h120M440 334h340" stroke="'+L+'" stroke-width="5"/>'+
    lbl(220,34,'BODEGA DAL · PLANO DE CONTROL')+lbl(390,354,'MUELLE',{anchor:'middle',fs:10})+
    plano+
    '<g opacity=".9"><path d="M500 189L780 189A280 280 0 0 0 698 -9z" fill="url(#dpwBarrido)" transform="rotate(0 500 189)">'+
      '<animateTransform attributeName="transform" type="rotate" from="0 500 189" to="360 500 189" dur="6s" repeatCount="indefinite"/></path></g>'+
    [60,120,180].map(r=>'<circle cx="500" cy="189" r="'+r+'" fill="none" stroke="rgba(255,255,255,.07)"/>').join('')+
    puntos+alerta);
  ground(gr,linea({arco:true}));
};

/* ── Hub y Last Mile: franja de terminal (la escena grande es el mapa de dpw-mapa.js) ── */
DPW.ESCENAS.terminal=terminal;
})();
