/* DP World Panamá · escena "libro" del login de Facturas y Pagos a Proveedores.
   Libro de cuentas: tres facturas caen en la bandeja (la barra de saldo por pagar sube), luego cada una
   recibe el sello PAGADA y pasa al archivo mientras la barra baja. Ciclo de 15 s.
   Va aparte del kit mientras no esté en HubApp: al subirla al kit, se mueve como función a dpw-escenas.js
   y se agrega su fila a la tabla del SKILL.md (Facturas y Pagos a Proveedores · libro · "Cada factura, pagada a tiempo."). */
(function(){
'use strict';
const DPW=window.DPW=window.DPW||{};DPW.ESCENAS=DPW.ESCENAS||{};
const V='#2a2770',V2='#3E3C90',L='#8a88e0',G='#00C389',A='#f5a20b',N='#0b0924';
const D=15,DUR=D+'s';
const k=a=>a.map(t=>(t/D).toFixed(4)).join(';');
const lbl=(x,y,t,o)=>'<text x="'+x+'" y="'+y+'" fill="rgba(255,255,255,'+((o&&o.op)||.5)+')" font-size="'+((o&&o.fs)||10)+'" font-weight="700" letter-spacing="1.2"'+(o&&o.anchor?' text-anchor="'+o.anchor+'"':'')+'>'+t+'</text>';

/* hoja de factura: 112×140, esquina superior izquierda en 0,0 */
function hoja(prov,monto,num){
  return '<rect width="112" height="140" rx="4" fill="#f4f4fb"/>'+
    '<rect width="112" height="24" rx="4" fill="'+V2+'"/><rect y="18" width="112" height="6" fill="'+V2+'"/>'+
    '<text x="10" y="16" fill="#fff" font-size="10" font-weight="800" letter-spacing="1.4">FACTURA</text>'+
    '<text x="102" y="16" fill="rgba(255,255,255,.7)" font-size="9" font-weight="700" text-anchor="end">'+num+'</text>'+
    '<text x="10" y="42" fill="#1A1060" font-size="9" font-weight="800" letter-spacing=".8">'+prov+'</text>'+
    '<path d="M10 54h92M10 66h70M10 78h84M10 90h60" stroke="#cfd0e6" stroke-width="3" stroke-linecap="round"/>'+
    '<path d="M10 104h92" stroke="#1A1060" stroke-width="1" opacity=".3"/>'+
    '<text x="10" y="124" fill="#64748B" font-size="8" font-weight="700" letter-spacing="1">TOTAL</text>'+
    '<text x="102" y="125" fill="#1A1060" font-size="13" font-weight="800" text-anchor="end">'+monto+'</text>';
}
const sello=on=>'<g transform="translate(56 70) rotate(-14)" opacity="0">'+
  '<rect x="-46" y="-15" width="92" height="30" rx="4" fill="rgba(0,195,137,.12)" stroke="'+G+'" stroke-width="3"/>'+
  '<text y="6" fill="'+G+'" font-size="15" font-weight="800" letter-spacing="2" text-anchor="middle">PAGADA</text>'+on+'</g>';

DPW.ESCENAS.libro=function(svg,gr){
  const p=svg.parentElement;if(p)p.classList.add('dpw-fit');
  /* fondo: hoja de libro rayada */
  let libro='<rect x="300" y="34" width="470" height="276" rx="6" fill="'+V+'" opacity=".55"/>';
  for(let y=70;y<300;y+=22)libro+='<path d="M312 '+y+'H758" stroke="rgba(255,255,255,.06)"/>';
  libro+='<path d="M372 40V304M690 40V304" stroke="rgba(245,162,11,.25)"/>';

  /* bandeja (por pagar) y archivo (pagadas) */
  const bandeja=(x,t)=>'<path d="M'+(x-8)+' 238h148l-10 22H'+(x+2)+'z" fill="'+V2+'" stroke="'+L+'" stroke-width="2"/>'+lbl(x+66,280,t,{anchor:'middle',fs:11,op:.7});
  const BX=410,AX=590;

  const F=[['TRANSPORTES','$1,240.00','F-0418'],['MONTACARGAS','$860.50','F-0977'],['MANTENIMIENTO','$3,415.00','F-1205']];
  let hojas='';
  F.forEach((f,i)=>{
    const ta=1+i*.9,kpag=2-i,ts=4.2+kpag*2.6,tm=ts+.9;
    const sy=96-i*8,ay=96-kpag*8;
    const ini=BX+' '+(sy-160);
    const pos=[ini,ini,BX+' '+sy,BX+' '+sy,AX+' '+ay,AX+' '+ay].join(';');
    const tp=k([0,ta-.6,ta,tm,tm+.8,D]);
    hojas+='<g opacity="0"><animateTransform attributeName="transform" type="translate" values="'+pos+'" keyTimes="'+tp+'" dur="'+DUR+'" repeatCount="indefinite"/>'+
      '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="'+k([0,ta-.6,ta-.3,13.4,14.3,D])+'" dur="'+DUR+'" repeatCount="indefinite"/>'+
      hoja(f[0],f[1],f[2])+
      sello('<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="'+k([0,ts,ts+.25,13.4,14.3,D])+'" dur="'+DUR+'" repeatCount="indefinite"/>')+
      '</g>';
  });

  /* barra de saldo por pagar: sube con cada factura y baja con cada pago */
  const BY=250,BH=170,sube=[1,1.9,2.8],baja=[4.2,6.8,9.4];
  const t=[0],h=[0];let n=0;
  sube.forEach(x=>{t.push(x-.01,x+.3);h.push(n,n+1);n++;});
  baja.forEach(x=>{t.push(x-.01,x+.5);h.push(n,n-1);n--;});
  t.push(D);h.push(0);
  const alto=h.map(v=>(v*BH/3).toFixed(1)),ys=h.map(v=>(BY-v*BH/3).toFixed(1));
  const barra='<rect x="318" y="'+(BY-BH)+'" width="34" height="'+BH+'" rx="3" fill="'+N+'" stroke="'+L+'" stroke-opacity=".5"/>'+
    '<rect x="321" width="28" rx="2" fill="'+A+'" y="'+BY+'" height="0">'+
      '<animate attributeName="height" values="'+alto.join(';')+'" keyTimes="'+k(t)+'" dur="'+DUR+'" repeatCount="indefinite"/>'+
      '<animate attributeName="y" values="'+ys.join(';')+'" keyTimes="'+k(t)+'" dur="'+DUR+'" repeatCount="indefinite"/></rect>'+
    lbl(335,BY+22,'SALDO',{anchor:'middle',fs:10,op:.6})+lbl(335,BY+34,'POR PAGAR',{anchor:'middle',fs:9,op:.45});

  svg.setAttribute('viewBox','0 0 1000 380');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  svg.innerHTML=libro+barra+bandeja(BX,'POR PAGAR')+bandeja(AX,'PAGADAS')+hojas+
    '<path d="M560 170h18" stroke="'+G+'" stroke-width="3" opacity=".6"/><path d="M572 164l8 6-8 6" fill="none" stroke="'+G+'" stroke-width="3" opacity=".6"/>'+
    lbl(535,340,'RECIBIDA  →  APROBADA  →  PAGADA',{anchor:'middle',fs:12,op:.55});
  if(gr&&DPW.ESCENAS.terminal){gr.setAttribute('viewBox','0 0 1400 150');gr.setAttribute('preserveAspectRatio','xMidYMax slice');gr.innerHTML=DPW.ESCENAS.terminal();}
};
})();
