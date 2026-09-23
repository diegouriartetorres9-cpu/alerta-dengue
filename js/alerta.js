/* ===================================================================
   ALERTA TEMPRANA DE BROTES DE DENGUE — DESA (GERESA) LAMBAYEQUE
   Lógica del tablero
   Alcance: actividades "Control larvario", "Vigilancia", "Recuperación" y "Cerco"
   Índice aédico (MINSA/OPS): <1% bajo · 1-4% mediano · >4% alto
   =================================================================== */

/* ---- Clasificación oficial del índice aédico (MINSA/OPS) ---- */
function nivelIA(ia){ if(ia>=4) return 'alta'; if(ia>=1) return 'mid'; return 'low'; }
const NIVEL_TXT={alta:'Alto riesgo (≥4%)', mid:'Riesgo medio / Alerta (≥1% y <4%)', low:'Bajo riesgo (<1%)'};

/* Humedad: nivel del CSV ("Alto"/"Medio"/"Bajo") -> clase de color */
const HUM_CLASE={'Alto':'alta','Medio':'mid','Bajo':'low'};
const HUM_TXT={'Alto':'Alto (terreno más húmedo)','Medio':'Medio','Bajo':'Bajo (terreno más seco)'};

/* ---- Íconos de recipientes (SVG sólidos, estilo de la referencia; orden de RECIP.tipos) ---- */
const RECIP_SVG=[
  /* 0 Tanque alto (tanque sobre caballete) */
  '<rect x="11.1" y="2.4" width="1.8" height="1.6" rx=".4"/><rect x="6.8" y="3.9" width="10.4" height="6.6" rx="1.7"/><rect x="6.1" y="10.7" width="11.8" height="1.4" rx=".5"/><path d="M8.1 12.2 9.4 20M15.9 12.2 14.6 20M8.5 12.2 14.9 19.3M15.5 12.2 9.1 19.3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  /* 1 Tanque bajo (tanque bajo con dos boquillas) */
  '<circle cx="9.5" cy="6.2" r="1"/><circle cx="14.5" cy="6.2" r="1"/><path d="M9.5 7v1.3M14.5 7v1.3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M5.3 10.2c0-1.3 3-2.2 6.7-2.2s6.7.9 6.7 2.2v3.6c0 1.3-3 2.2-6.7 2.2s-6.7-.9-6.7-2.2v-3.6z"/><path d="M5.9 11.9h12.2M5.9 13.6h12.2" stroke="#fff" stroke-width="1" fill="none"/>',
  /* 2 Barril, cilindro, sansón (bidón con aros) */
  '<path d="M7 6v12.1c0 .95 2.24 1.7 5 1.7s5-.75 5-1.7V6z"/><ellipse cx="12" cy="6" rx="5" ry="1.9"/><path d="M7.3 10.4h9.4M7.3 14.1h9.4" stroke="#fff" stroke-width="1.2" fill="none"/>',
  /* 3 Bidón, balde (balde con asa) */
  '<path d="M8 8.1c0-3.2 8-3.2 8 0" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M6.7 8.6h10.6l-1.1 10a1.3 1.3 0 0 1-1.3 1.2H9.1a1.3 1.3 0 0 1-1.3-1.2l-1.1-10z"/><ellipse cx="12" cy="8.6" rx="5.3" ry="1.5" fill="#fff"/><ellipse cx="12" cy="8.6" rx="5.3" ry="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/>',
  /* 4 Bateas, tinajas, ollas (olla con tapa y asas) */
  '<path d="M5.6 10.6h12.8l-.9 6.9a2 2 0 0 1-2 1.7H8.5a2 2 0 0 1-2-1.7l-.9-6.9z"/><path d="M4.6 12.4c-1.3 0-1.3 2.2 0 2.2M19.4 12.4c1.3 0 1.3 2.2 0 2.2" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><rect x="5" y="8.9" width="14" height="1.9" rx=".95"/><rect x="10.4" y="7" width="3.2" height="2" rx="1"/>',
  /* 5 Llantas (rin) */
  '<circle cx="12" cy="12" r="8.3"/><circle cx="12" cy="12" r="4.9" fill="#fff"/><circle cx="12" cy="12" r="1.7"/><path d="M12 7.2v3M12 13.8v3M7.2 12h3M13.8 12h3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
  /* 6 Floreros, maceteros (macetero con planta) */
  '<path d="M12 10.2V6.4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M12 8.6c-2.4 0-3.7-1.5-3.7-3.4 2.4 0 3.7 1.5 3.7 3.4z"/><path d="M12 7.4c2 0 3.2-1.3 3.2-3-2 0-3.2 1.3-3.2 3z"/><path d="M7.1 11.4h9.8l-1 7.3a1.1 1.1 0 0 1-1.1 1H9.2a1.1 1.1 0 0 1-1.1-1l-1-7.3z"/><rect x="6.5" y="9.9" width="11" height="2" rx="1"/>',
  /* 7 Latas, botellas (botella) */
  '<path d="M10.1 3h3.8v2.5l1.2 2.2c.33.6.5 1.25.5 1.95V18.7a1.6 1.6 0 0 1-1.6 1.6H9.9a1.6 1.6 0 0 1-1.6-1.6V9.65c0-.7.17-1.35.5-1.95l1.2-2.2V3z"/><rect x="9.6" y="2.3" width="4.8" height="1.5" rx=".5"/><path d="M8.6 12h6.8" stroke="#fff" stroke-width="1.2" fill="none"/>',
  /* 8 Inservibles (bolsas de basura) */
  '<path d="M7.6 10.6c.5-1.1 3-1.1 3.5 0l.9 7.8c.1.9-.5 1.5-1.3 1.5H8c-.8 0-1.4-.6-1.3-1.5l.9-7.8z"/><path d="M7.4 10.7 8 8.9l1.1 1.1L10.2 8.5l1.1 1.5 1-1 .5 1.7" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/><path d="M13.2 12c.45-1 2.7-1 3.15 0l.8 6.5c.1.85-.45 1.4-1.2 1.4h-2.35c-.75 0-1.3-.55-1.2-1.4l.8-6.5z"/><path d="M13 12.1l.55-1.6 1 1 1-1.3 1 1.3 1-.95.5 1.55" stroke="currentColor" stroke-width="1.1" fill="none" stroke-linejoin="round"/>',
  /* 9 Otros (torre de agua) */
  '<path d="M12 2.8 15.2 6v1.6H8.8V6L12 2.8z"/><rect x="8.8" y="7.2" width="6.4" height="3.2" rx=".6"/><path d="M9.4 10.4 8 20M14.6 10.4 16 20M10.4 10.4 13.4 19M13.6 10.4 10.6 19" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M8.4 15.4h7.2" stroke="currentColor" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
];
function recipIcon(k){
  return '<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="none">'+(RECIP_SVG[k]||'')+'</svg>';
}

/* ---- Estado ---- */
const state={ red:'__all__', eess:'__all__', d1:null, d2:null };
let clima=null, iaChart=null;

/* ---- Utilidades ---- */
const $=id=>document.getElementById(id);
const fmt=n=>Number(n).toLocaleString('es-PE');
const inRange=d=>(!state.d1||d>=state.d1)&&(!state.d2||d<=state.d2);
const eessInScope=e=>(state.eess!=='__all__')?(e===state.eess):(state.red==='__all__'||META.e2r[e]===state.red);

/* Puntos filtrados (Control larvario, Vigilancia, Recuperación y Cerco) para KPI/mapa/evolución */
function fp(){ return PUNTOS.filter(p=> (state.red==='__all__'||p[6]===state.red) && (state.eess==='__all__'||p[4]===state.eess) && inRange(p[5]) ); }

/* Agregado de sectores segun filtro -> [{eess,red,dist,sector,insp,pos,ia,nivel}] */
function sectores(){
  const acc={};
  const conPoligono=Object.keys(SECTORES_POR_CENTRO);
  for(const eess in SEC){
    if(!eessInScope(eess)) continue;
    if(conPoligono.includes(eess)) continue;   // estos centros se ubican por polígono (abajo), no por el texto libre del sector
    for(const r of SEC[eess]){            // r = [sector,fecha,insp,pos]
      if(!inRange(r[1])) continue;
      const sec=r[0]; if(!sec) continue;
      const k=eess+'||'+sec;
      if(!acc[k]) acc[k]={eess,red:META.e2r[eess]||'',dist:META.e2d[eess]||'',sector:sec,insp:0,pos:0};
      acc[k].insp+=r[2]; acc[k].pos+=r[3];
    }
  }
  /* Centros con polígono dibujado (ver SECTORES_POR_CENTRO: Cerropón, José Olaya, La Victoria S.II, Nuevo Mocupe, Mocupe Tradicional, Túpac Amaru-Lagunas, Pueblo Libre, Lagunas, Salas): el sector se determina
     por ubicación (el punto cae dentro del polígono del sector), no por el texto que escribió el
     brigadista — así se evitan sectores mal tipeados o registrados como rango (p.ej. "I - V"). */
  conPoligono.forEach(eess=>{
    if(!eessInScope(eess)) return;
    const feats=SECTORES_POR_CENTRO[eess];
    const pts=PUNTOS.filter(p=>p[4]===eess && inRange(p[5]));
    if(!pts.length) return;
    const red=META.e2r[eess]||'', dist=META.e2d[eess]||'';
    const byName={};
    feats.forEach(f=>{ byName[f.properties.name]={eess,red,dist,sector:f.properties.name,insp:0,pos:0}; });
    pts.forEach(p=>{
      for(const f of feats){
        if(_pipRing(p[1],p[0],f.geometry.coordinates[0])){ byName[f.properties.name].insp+=p[2]; byName[f.properties.name].pos+=p[3]; break; }
      }
      // los puntos que no caen en ningún polígono del centro no se muestran como sector (quedan fuera de esta vista).
    });
    Object.values(byName).forEach(o=>{ acc[eess+'||'+o.sector]=o; });
  });
  const arr=Object.values(acc).filter(o=>o.insp>0);
  arr.forEach(o=>{ o.ia=o.pos/o.insp*100; o.nivel=nivelIA(o.ia); });
  arr.sort((a,b)=>b.ia-a.ia);
  return arr;
}

/* ================= POBLAR FILTROS ================= */
function initFilters(){
  const rs=$('fRed'); META.redes.forEach(r=>{const o=document.createElement('option');o.value=r;o.textContent='RED '+r;rs.appendChild(o);});
  fillCentros();
  // rango de fechas
  let mn='9999',mx='0000'; PUNTOS.forEach(p=>{if(p[5]<mn)mn=p[5];if(p[5]>mx)mx=p[5];});
  if(META.fechaMax)mx=META.fechaMax;
  state.d1=mn; state.d2=mx;
  const i1=$('fDesde'),i2=$('fHasta');
  i1.min=mn;i1.max=mx;i1.value=mn; i2.min=mn;i2.max=mx;i2.value=mx;
}
function fillCentros(){
  const cs=$('fEess'); cs.innerHTML='<option value="__all__">Todos los centros</option>';
  META.eess.filter(e=>state.red==='__all__'||META.e2r[e]===state.red).forEach(e=>{
    const o=document.createElement('option');o.value=e;o.textContent=e;cs.appendChild(o);
  });
}

/* ================= 2 · RESUMEN DE ALERTA ================= */
function renderHero(){
  const secs=sectores();
  const A=secs.filter(s=>s.nivel==='alta'), M=secs.filter(s=>s.nivel==='mid'), L=secs.filter(s=>s.nivel==='low');
  const sp=a=>a.reduce((t,s)=>t+s.pos,0);
  const nA=A.length,nM=M.length,nL=L.length,tot=nA+nM+nL;
  const amb = state.eess!=='__all__'?state.eess:(state.red!=='__all__'?'RED '+state.red:'las tres redes');
  const box=$('heroBox');
  const seg=(n,cls,lbl)=> n>0?'<div class="risseg '+cls+'" style="flex:'+n+'" title="'+lbl+': '+n+'">'+(n/tot>=0.06?n:'')+'</div>':'';
  if(!tot){ box.innerHTML='<div class="herotop"><span class="herobig">Sin sectores para este filtro</span><span class="herocap">'+amb+'</span></div>'; }
  else{
    box.innerHTML='<div class="herotop"><span class="herobig">'+fmt(tot)+' sectores evaluados</span>'+
      '<span class="herocap">distribución por nivel de riesgo · '+amb+' · '+state.d1+' a '+state.d2+'</span></div>'+
      '<div class="risbar">'+seg(nA,'alta','Alerta alta')+seg(nM,'mid','A vigilar')+seg(nL,'low','Controlados')+'</div>'+
      '<div class="risleg">'+
        '<div><span class="sw alta"></span><b>'+nA+'</b> alerta alta · '+fmt(sp(A))+' positivas</div>'+
        '<div><span class="sw mid"></span><b>'+nM+'</b> a vigilar · '+fmt(sp(M))+' positivas</div>'+
        '<div><span class="sw low"></span><b>'+nL+'</b> controlados · '+fmt(sp(L))+' positivas</div>'+
      '</div>';
  }
  const pill=$('statePill'), txt=$('stateTxt');
  if(nA>0){ pill.className='statuspill alta'; txt.textContent='Alerta roja'; }
  else if(nM>0){ pill.className='statuspill mid'; txt.textContent='Vigilancia'; }
  else { pill.className='statuspill low'; txt.textContent='Controlado'; }
}

function renderResumen(){
  const secs=sectores();
  const alta=secs.filter(s=>s.nivel==='alta'), mid=secs.filter(s=>s.nivel==='mid'), low=secs.filter(s=>s.nivel==='low');
  const sum=a=>a.reduce((t,s)=>t+s.pos,0);

  // KPI de puntos (base: viviendas visitadas)
  const pts=fp(); let insp=0,pos=0; pts.forEach(p=>{insp+=p[2];pos+=p[3];});
  const ia=insp?pos/insp*100:0;
  $('kPos').textContent=fmt(pos);
  $('kIa').textContent=ia.toFixed(2)+'%';

  // Banner
  const ambito = state.eess!=='__all__' ? state.eess : (state.red!=='__all__' ? 'RED '+state.red : 'las tres redes');
  const bn=$('banner');
  if(alta.length){
    bn.className='alertbanner alta';
    bn.innerHTML='<div class="ico">⚠️</div><div><div class="msg">En '+ambito+', '+alta.length+' sector(es) concentran los criaderos — priorizar ahí.</div>'+
      '<div class="sub">Suman '+fmt(sum(alta))+' viviendas positivas a larvas.</div></div>';
  }else{
    bn.className='alertbanner ok';
    bn.innerHTML='<div class="ico">✓</div><div><div class="msg">Sin sectores en alerta alta en '+ambito+'.</div>'+
      '<div class="sub">Ningún sector alcanza 4% de índice aédico en el periodo. Mantener la vigilancia rutinaria.</div></div>';
  }

}

/* ================= 3 · CLIMA ================= */
function coordsActuales(){
  if(state.eess!=='__all__' && COORD_CENTROS[state.eess]) return {c:COORD_CENTROS[state.eess], nom:state.eess};
  // promedio de la red o global
  let la=0,lo=0,n=0;
  for(const e in COORD_CENTROS){ if(state.red==='__all__'||META.e2r[e]===state.red){la+=COORD_CENTROS[e][0];lo+=COORD_CENTROS[e][1];n++;} }
  const nom = state.red!=='__all__' ? 'RED '+state.red : 'ámbito DESA Lambayeque';
  return {c:[n?la/n:-6.77,n?lo/n:-79.84], nom};
}
async function cargarClima(){
  const {c,nom}=coordsActuales();
  $('climaCentro').textContent=nom;
  $('climaBox').innerHTML='<div class="climaerr">Cargando clima…</div>';
  try{
    const [lat,lon]=c;
    const url='https://api.open-meteo.com/v1/forecast?latitude='+lat.toFixed(4)+'&longitude='+lon.toFixed(4)+
      '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max'+
      '&hourly=relative_humidity_2m&timezone=America%2FLima&forecast_days=7';
    const r=await fetch(url); if(!r.ok) throw new Error('http '+r.status);
    const j=await r.json();
    // humedad media diaria a partir de la serie horaria
    const humByDay={};
    (j.hourly.time||[]).forEach((t,i)=>{const d=t.slice(0,10); (humByDay[d]=humByDay[d]||[]).push(j.hourly.relative_humidity_2m[i]);});
    const dias=j.daily.time.map((d,i)=>{
      const hs=humByDay[d]||[]; const hum=hs.length?Math.round(hs.reduce((a,b)=>a+b,0)/hs.length):null;
      return { fecha:d, tmax:Math.round(j.daily.temperature_2m_max[i]), tmin:Math.round(j.daily.temperature_2m_min[i]),
        lluvia:j.daily.precipitation_sum[i], prob:j.daily.precipitation_probability_max[i], hum };
    });
    clima={dias, hora:new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'})};
    renderClima();
  }catch(e){
    $('climaBox').innerHTML='<div class="climaerr">No se pudo cargar el clima (se necesita conexión a internet). '+
      '<button class="btn-mini" onclick="cargarClima()">Reintentar</button></div>';
  }
}
function riesgoClima(d){
  // Favorabilidad de criaderos de Aedes aegypti
  if(d.lluvia>=10 || (d.prob>=60 && d.hum>=80)) return 'alta';
  if((d.hum!=null&&d.hum>=70) || d.lluvia>=1 || (d.tmax>=24&&d.tmax<=32)) return 'mid';
  return 'low';
}
const DIAS_SEM=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
function renderClima(){
  if(!clima) return;
  $('climaHora').textContent='Actualizado '+clima.hora;
  const nAlta=clima.dias.filter(d=>riesgoClima(d)==='alta').length;
  const bnr=nAlta
    ? '<div class="climabanner alta">⚠️ '+nAlta+' día(s) con riesgo climático alto en la próxima semana.<div class="sub">Las condiciones favorecen la formación de criaderos. Intensificar el control larvario.</div></div>'
    : '<div class="climabanner ok">✓ Sin días de riesgo climático alto en la próxima semana.<div class="sub">Las condiciones no favorecen especialmente los criaderos. Mantén la vigilancia habitual.</div></div>';
  const cards=clima.dias.map(d=>{
    const dt=new Date(d.fecha+'T00:00:00'); const dn=DIAS_SEM[dt.getDay()]+' '+String(dt.getDate()).padStart(2,'0')+'/'+String(dt.getMonth()+1).padStart(2,'0');
    const nv=riesgoClima(d); const badge={alta:'Alto',mid:'Vigilar',low:'Bajo'}[nv];
    return '<div class="day"><div class="dn">'+dn+'</div>'+
      '<div class="tm num">'+d.tmax+'°<small> / '+d.tmin+'°</small></div>'+
      '<div class="met num">Humedad '+(d.hum!=null?d.hum+'%':'—')+'</div>'+
      '<div class="met2 num">Lluvia '+d.lluvia+' mm · '+(d.prob!=null?d.prob:0)+'%</div>'+
      '<span class="badge '+nv+'">'+badge+'</span></div>';
  }).join('');
  $('climaBox').innerHTML=bnr+'<div class="days">'+cards+'</div>';
}

/* ================= 4 · HUMEDAD ESTRUCTURAL ================= */
function centrosScope(){
  // centros que aplican al filtro actual (red/centro)
  return META.eess.filter(e=> (state.eess!=='__all__') ? e===state.eess
      : (state.red==='__all__'||META.e2r[e]===state.red));
}
function renderHumedad(){
  const box=$('humedad');
  const nota='<div class="humnota">Medido con satélite (Sentinel-2 · Landsat-8) sobre la huella de casas de cada centro. Los niveles son un <b>ranking relativo entre centros</b> (tercios), no un umbral oficial. Se actualiza cada quincena, aparte de la data diaria.</div>';

  if(state.eess!=='__all__'){
    const h=HUMEDAD[state.eess];
    if(!h){ box.innerHTML='<div class="empty">Este centro no tiene índice de humedad calculado (pocas casas o cobertura de nubes en el periodo satelital).</div>'; return; }
    const cls=HUM_CLASE[h.n];
    // IA del centro en el periodo actual (para la lectura combinada)
    const pts=fp(); let insp=0,pos=0; pts.forEach(p=>{insp+=p[2];pos+=p[3];});
    const ia=insp?pos/insp*100:0; const iaCls=nivelIA(ia);
    const combo = (cls==='alta'&&ia>=4) ? '<div class="humcombo alta">⚠️ Prioridad máxima: este centro tiene <b>humedad alta</b> y <b>índice aédico alto ('+ia.toFixed(2)+'%)</b> — condiciones y criaderos coinciden.</div>'
      : (cls==='alta') ? '<div class="humcombo mid">Humedad ambiental alta. Vigilar aunque el índice aédico esté controlado ('+ia.toFixed(2)+'%): el terreno favorece criaderos.</div>'
      : '';
    box.innerHTML='<div class="card"><div class="humcard '+cls+'">'+
      '<div class="humlvl"><span class="dot"></span><div><div class="humlvlt">Humedad '+h.n+'</div><div class="humlvls">'+HUM_TXT[h.n]+'</div></div></div>'+
      '<div class="humidx"><div><b class="num">'+h.w.toFixed(3)+'</b><span>NDWI (agua superficial)</span></div>'+
      '<div><b class="num">'+h.l.toFixed(3)+'</b><span>LSWI (humedad superficie)</span></div>'+
      '<div><b class="num">'+fmt(h.c)+'</b><span>casas medidas</span></div></div></div>'+
      combo+'<div style="padding:0 16px 14px">'+nota+'</div></div>';
    return;
  }

  // Sin centro: conteo por nivel + tabla de centros del ámbito ordenados por humedad
  const scope=centrosScope().filter(e=>HUMEDAD[e]).map(e=>({e, ...HUMEDAD[e], red:META.e2r[e]||''}));
  if(!scope.length){ box.innerHTML='<div class="empty">Sin índice de humedad para este ámbito.</div>'; return; }
  scope.sort((a,b)=>b.s-a.s);
  const cnt={Alto:0,Medio:0,Bajo:0}; scope.forEach(x=>cnt[x.n]++);
  // IA por centro en el periodo (para marcar prioridad combinada)
  const iaByC={}; fp().forEach(p=>{const o=iaByC[p[4]]=iaByC[p[4]]||{i:0,p:0}; o.i+=p[2];o.p+=p[3];});

  let html='<div class="bands" style="margin-bottom:14px">'+
    '<div class="band alta"><div class="bv num">'+cnt.Alto+'</div><div class="bl"><span class="dot"></span>Humedad alta</div><div class="bf">terreno más húmedo</div></div>'+
    '<div class="band mid"><div class="bv num">'+cnt.Medio+'</div><div class="bl"><span class="dot"></span>Humedad media</div><div class="bf">intermedio</div></div>'+
    '<div class="band low"><div class="bv num">'+cnt.Bajo+'</div><div class="bl"><span class="dot"></span>Humedad baja</div><div class="bf">terreno más seco</div></div></div>';

  const CAP=15;
  const show=scope.slice(0,CAP);
  html+='<table class="tbl"><thead><tr><th>Centro</th><th>Red</th><th class="r">NDWI</th><th class="r">LSWI</th><th class="r">Humedad</th><th class="r">Índice aédico (periodo)</th></tr></thead><tbody>'+
    show.map(x=>{
      const o=iaByC[x.e]; const ia=o&&o.i?o.p/o.i*100:0; const iaCls=nivelIA(ia);
      const prio=(x.n==='Alto'&&ia>=4)?' ⚠️':'';
      return '<tr><td>'+x.e+prio+'</td><td>'+x.red+'</td><td class="r num">'+x.w.toFixed(3)+'</td><td class="r num">'+x.l.toFixed(3)+'</td>'+
        '<td class="r"><span class="iaval '+HUM_CLASE[x.n]+'">'+x.n+'</span></td>'+
        '<td class="r num iaval '+iaCls+'">'+ia.toFixed(2)+'%</td></tr>';
    }).join('')+'</tbody></table>';
  if(scope.length>CAP) html+='<div class="empty">Mostrando los '+CAP+' de mayor humedad de '+scope.length+' centros. Elige un centro para ver su detalle. ⚠️ = humedad alta + índice aédico alto (prioridad combinada).</div>';
  else html+='<div class="humnota" style="margin-top:10px">⚠️ = humedad alta + índice aédico alto en el periodo (prioridad combinada). '+nota.replace(/^<div class="humnota">|<\/div>$/g,'')+'</div>';
  box.innerHTML=html;
}

/* ================= 5 · DINÁMICA TÉRMICA ================= */
const TERM_TXT={'Alto':'Alto (microclima cálido y estable)','Medio':'Medio','Bajo':'Bajo (microclima más fresco/oscilante)'};
function renderTermico(){
  const box=$('termico');
  const nota='<div class="humnota">Temperatura de superficie con satélite (MODIS, 1 km) sobre la huella de casas. Riesgo: día caliente (+), noche caliente (+) y <b>amplitud baja</b> (+, menos oscilación = más estable = más favorable). Ranking relativo entre centros (tercios), no umbral oficial. Se actualiza cada quincena.</div>';

  if(state.eess!=='__all__'){
    const t=TERMICO[state.eess];
    if(!t){ box.innerHTML='<div class="empty">Este centro no tiene índice térmico calculado.</div>'; return; }
    const cls=HUM_CLASE[t.n];
    const h=HUMEDAD[state.eess];
    const pts=fp(); let insp=0,pos=0; pts.forEach(p=>{insp+=p[2];pos+=p[3];});
    const ia=insp?pos/insp*100:0;
    let combo='';
    if(cls==='alta'&&h&&h.n==='Alto'&&ia>=4) combo='<div class="humcombo alta">⚠️ Prioridad máxima: microclima cálido, terreno húmedo e índice aédico alto ('+ia.toFixed(2)+'%) — las tres condiciones coinciden.</div>';
    else if(cls==='alta'&&h&&h.n==='Alto') combo='<div class="humcombo mid">Doble condición ambiental favorable: calor alto + humedad alta. Vigilar aunque el índice aédico esté en '+ia.toFixed(2)+'%.</div>';
    else if(cls==='alta') combo='<div class="humcombo mid">Microclima cálido y estable: favorece el desarrollo larvario y mantiene activo al mosquito.</div>';
    box.innerHTML='<div class="card"><div class="humcard '+cls+'">'+
      '<div class="humlvl"><span class="dot"></span><div><div class="humlvlt">Térmico '+t.n+'</div><div class="humlvls">'+TERM_TXT[t.n]+'</div></div></div>'+
      '<div class="humidx"><div><b class="num">'+t.d.toFixed(1)+'°C</b><span>LST diurna (calor de día)</span></div>'+
      '<div><b class="num">'+t.no.toFixed(1)+'°C</b><span>LST nocturna (retención)</span></div>'+
      '<div><b class="num">'+t.a.toFixed(1)+'°C</b><span>amplitud (día − noche)</span></div></div></div>'+
      combo+'<div style="padding:0 16px 14px">'+nota+'</div></div>';
    return;
  }

  const scope=centrosScope().filter(e=>TERMICO[e]).map(e=>({e, ...TERMICO[e], red:META.e2r[e]||''}));
  if(!scope.length){ box.innerHTML='<div class="empty">Sin índice térmico para este ámbito.</div>'; return; }
  scope.sort((a,b)=>b.s-a.s);
  const cnt={Alto:0,Medio:0,Bajo:0}; scope.forEach(x=>cnt[x.n]++);
  const iaByC={}; fp().forEach(p=>{const o=iaByC[p[4]]=iaByC[p[4]]||{i:0,p:0}; o.i+=p[2];o.p+=p[3];});

  let html='<div class="bands" style="margin-bottom:14px">'+
    '<div class="band alta"><div class="bv num">'+cnt.Alto+'</div><div class="bl"><span class="dot"></span>Térmico alto</div><div class="bf">cálido y estable</div></div>'+
    '<div class="band mid"><div class="bv num">'+cnt.Medio+'</div><div class="bl"><span class="dot"></span>Térmico medio</div><div class="bf">intermedio</div></div>'+
    '<div class="band low"><div class="bv num">'+cnt.Bajo+'</div><div class="bl"><span class="dot"></span>Térmico bajo</div><div class="bf">más fresco/oscilante</div></div></div>';
  const CAP=15, show=scope.slice(0,CAP);
  html+='<table class="tbl"><thead><tr><th>Centro</th><th>Red</th><th class="r">Día °C</th><th class="r">Noche °C</th><th class="r">Amplitud</th><th class="r">Térmico</th><th class="r">Índice aédico</th></tr></thead><tbody>'+
    show.map(x=>{
      const o=iaByC[x.e]; const ia=o&&o.i?o.p/o.i*100:0; const iaCls=nivelIA(ia);
      const hAlta=HUMEDAD[x.e]&&HUMEDAD[x.e].n==='Alto';
      const prio=(x.n==='Alto'&&(ia>=4||hAlta))?' ⚠️':'';
      return '<tr><td>'+x.e+prio+'</td><td>'+x.red+'</td><td class="r num">'+x.d.toFixed(1)+'</td><td class="r num">'+x.no.toFixed(1)+'</td><td class="r num">'+x.a.toFixed(1)+'</td>'+
        '<td class="r"><span class="iaval '+HUM_CLASE[x.n]+'">'+x.n+'</span></td>'+
        '<td class="r num iaval '+iaCls+'">'+ia.toFixed(2)+'%</td></tr>';
    }).join('')+'</tbody></table>';
  if(scope.length>CAP) html+='<div class="empty">Mostrando los '+CAP+' más térmicos de '+scope.length+' centros. Elige un centro para su detalle. ⚠️ = térmico alto + (índice aédico alto o humedad alta).</div>';
  else html+='<div class="humnota" style="margin-top:10px">⚠️ = térmico alto + (índice aédico alto o humedad alta). '+nota.replace(/^<div class="humnota">|<\/div>$/g,'')+'</div>';
  box.innerHTML=html;
}

/* ================= 6 · REFUGIO ECOLÓGICO ================= */
const REF_TXT={'Alto':'Alto (vegetación densa, más refugio)','Medio':'Medio','Bajo':'Bajo (poca vegetación, menos refugio)'};
function listar(a){ return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' y '+a[a.length-1]; }
function renderRefugio(){
  const box=$('refugio');
  const nota='<div class="humnota">Vegetación medida con satélite (Sentinel-2, 10 m) en el entorno de las casas de cada centro (NDVI y su cobertura FVC). Más vegetación = más sombra, humedad y reposo para el <b>mosquito adulto</b> = más refugio. Ranking relativo entre centros (tercios), no umbral oficial. Se actualiza cada quincena.</div>';

  if(state.eess!=='__all__'){
    const t=REFUGIO[state.eess];
    if(!t){ box.innerHTML='<div class="empty">Este centro no tiene índice de refugio calculado.</div>'; return; }
    const cls=HUM_CLASE[t.n];
    const h=HUMEDAD[state.eess], te=TERMICO[state.eess];
    const pts=fp(); let insp=0,pos=0; pts.forEach(p=>{insp+=p[2];pos+=p[3];});
    const ia=insp?pos/insp*100:0;
    // Lectura fusionada de las cuatro señales
    const sen=[];
    if(cls==='alta') sen.push('vegetación de refugio');
    if(h&&h.n==='Alto') sen.push('terreno húmedo');
    if(te&&te.n==='Alto') sen.push('microclima cálido');
    if(ia>=4) sen.push('índice aédico alto ('+ia.toFixed(2)+'%)');
    let combo='';
    if(cls==='alta'){
      const otras=sen.length-1;
      if(sen.length>=4) combo='<div class="humcombo alta">⚠️ Prioridad máxima: coinciden las cuatro señales — '+listar(sen)+'. Amerita intervención integral en este centro.</div>';
      else if(otras>=2) combo='<div class="humcombo alta">⚠️ Alta prioridad: '+sen.length+' condiciones coinciden — '+listar(sen)+'.</div>';
      else if(otras===1) combo='<div class="humcombo mid">Refugio alto junto con '+sen.filter(x=>x!=='vegetación de refugio')[0]+'. La vegetación densa favorece el reposo del mosquito adulto: vigilar.</div>';
      else combo='<div class="humcombo mid">Vegetación densa alrededor de las viviendas: ofrece sombra y reposo al mosquito adulto, aunque las demás señales estén controladas.</div>';
    }
    box.innerHTML='<div class="card"><div class="humcard '+cls+'">'+
      '<div class="humlvl"><span class="dot"></span><div><div class="humlvlt">Refugio '+t.n+'</div><div class="humlvls">'+REF_TXT[t.n]+'</div></div></div>'+
      '<div class="humidx"><div><b class="num">'+t.v.toFixed(3)+'</b><span>NDVI (vegetación)</span></div>'+
      '<div><b class="num">'+t.f.toFixed(3)+'</b><span>FVC (cobertura vegetal)</span></div>'+
      '<div><b class="num">'+fmt(t.c)+'</b><span>casas medidas</span></div></div></div>'+
      combo+'<div style="padding:0 16px 14px">'+nota+'</div></div>';
    return;
  }

  const scope=centrosScope().filter(e=>REFUGIO[e]).map(e=>({e, ...REFUGIO[e], red:META.e2r[e]||''}));
  if(!scope.length){ box.innerHTML='<div class="empty">Sin índice de refugio para este ámbito.</div>'; return; }
  scope.sort((a,b)=>b.s-a.s);
  const cnt={Alto:0,Medio:0,Bajo:0}; scope.forEach(x=>cnt[x.n]++);
  const iaByC={}; fp().forEach(p=>{const o=iaByC[p[4]]=iaByC[p[4]]||{i:0,p:0}; o.i+=p[2];o.p+=p[3];});

  let html='<div class="bands" style="margin-bottom:14px">'+
    '<div class="band alta"><div class="bv num">'+cnt.Alto+'</div><div class="bl"><span class="dot"></span>Refugio alto</div><div class="bf">vegetación densa</div></div>'+
    '<div class="band mid"><div class="bv num">'+cnt.Medio+'</div><div class="bl"><span class="dot"></span>Refugio medio</div><div class="bf">intermedio</div></div>'+
    '<div class="band low"><div class="bv num">'+cnt.Bajo+'</div><div class="bl"><span class="dot"></span>Refugio bajo</div><div class="bf">poca vegetación</div></div></div>';
  const CAP=15, show=scope.slice(0,CAP);
  html+='<table class="tbl"><thead><tr><th>Centro</th><th>Red</th><th class="r">NDVI</th><th class="r">FVC</th><th class="r">Refugio</th><th class="r">Índice aédico</th></tr></thead><tbody>'+
    show.map(x=>{
      const o=iaByC[x.e]; const ia=o&&o.i?o.p/o.i*100:0; const iaCls=nivelIA(ia);
      const hAlta=HUMEDAD[x.e]&&HUMEDAD[x.e].n==='Alto';
      const tAlta=TERMICO[x.e]&&TERMICO[x.e].n==='Alto';
      const prio=(x.n==='Alto'&&(ia>=4||hAlta||tAlta))?' ⚠️':'';
      return '<tr><td>'+x.e+prio+'</td><td>'+x.red+'</td><td class="r num">'+x.v.toFixed(3)+'</td><td class="r num">'+x.f.toFixed(3)+'</td>'+
        '<td class="r"><span class="iaval '+HUM_CLASE[x.n]+'">'+x.n+'</span></td>'+
        '<td class="r num iaval '+iaCls+'">'+ia.toFixed(2)+'%</td></tr>';
    }).join('')+'</tbody></table>';
  if(scope.length>CAP) html+='<div class="empty">Mostrando los '+CAP+' de mayor refugio de '+scope.length+' centros. Elige un centro para su detalle. ⚠️ = refugio alto + (índice aédico alto, humedad alta o térmico alto).</div>';
  else html+='<div class="humnota" style="margin-top:10px">⚠️ = refugio alto + (índice aédico alto, humedad alta o térmico alto). '+nota.replace(/^<div class="humnota">|<\/div>$/g,'')+'</div>';
  box.innerHTML=html;
}

/* ================= 7 · MAPA ================= */
let map=null, heat=null, tileMapa=null, tileSat=null;
let dotLayer=L.layerGroup(); const ZOOM_DOTS=13; let _dotData=[], _hd=[], _mx=1, _baseR=13;
/* ===== Límites de sector por centro (9 centros, ver SECTORES_POR_CENTRO): burbuja de lejos / calor de cerca ===== */
(function(){var st=document.createElement('style');st.textContent='.sect-burbuja{background:#1a56db;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;line-height:1}'+'.sect-burbuja .num{font-weight:800;font-size:19px}'+'.sect-burbuja .cnt{font-size:10px;opacity:.92;margin-top:2px}';document.head.appendChild(st);})();
const SECTORES_POR_CENTRO = {"C.S. CERROPON":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.864916,-6.773055],[-79.864738,-6.773372],[-79.864524,-6.773619],[-79.863156,-6.775914],[-79.86072,-6.779851],[-79.859778,-6.778156],[-79.859191,-6.773284],[-79.864364,-6.772649],[-79.864916,-6.773055]]]},"properties":{"name":"VI","viviendas":750}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.866079,-6.777838],[-79.862155,-6.783993],[-79.861676,-6.783746],[-79.861471,-6.78365],[-79.861396,-6.783545],[-79.861352,-6.783487],[-79.861338,-6.783251],[-79.8613,-6.783003],[-79.861406,-6.782651],[-79.861564,-6.782516],[-79.86179,-6.782463],[-79.861552,-6.782013],[-79.861268,-6.781613],[-79.861212,-6.781436],[-79.861095,-6.781262],[-79.861014,-6.781133],[-79.861005,-6.78102],[-79.861178,-6.780943],[-79.861162,-6.78083],[-79.86069,-6.779939],[-79.864958,-6.773069],[-79.866399,-6.773917],[-79.866737,-6.776778],[-79.866079,-6.777838]]]},"properties":{"name":"V","viviendas":2207}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.872587,-6.777596],[-79.872793,-6.779101],[-79.8728,-6.77946],[-79.872647,-6.77981],[-79.872042,-6.780745],[-79.871042,-6.782304],[-79.86814,-6.786889],[-79.862179,-6.784006],[-79.865882,-6.778201],[-79.866095,-6.777882],[-79.866327,-6.777503],[-79.866702,-6.776919],[-79.86671,-6.776864],[-79.86673,-6.776828],[-79.86677,-6.776783],[-79.866756,-6.776703],[-79.866743,-6.77663],[-79.866725,-6.776467],[-79.866677,-6.776131],[-79.866608,-6.775446],[-79.866533,-6.77491],[-79.866461,-6.77436],[-79.866447,-6.774249],[-79.866436,-6.774139],[-79.866419,-6.774043],[-79.866427,-6.774023],[-79.866436,-6.77394],[-79.867454,-6.774572],[-79.868536,-6.775272],[-79.86997,-6.776171],[-79.87138,-6.776946],[-79.872587,-6.777596]]]},"properties":{"name":"IV","viviendas":3389}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.862142,-6.784083],[-79.868107,-6.786927],[-79.867406,-6.788164],[-79.866604,-6.789495],[-79.865955,-6.790543],[-79.86566,-6.79108],[-79.865007,-6.792053],[-79.864286,-6.793182],[-79.864253,-6.793138],[-79.864225,-6.793099],[-79.864198,-6.793059],[-79.864176,-6.79303],[-79.864161,-6.793007],[-79.864118,-6.792939],[-79.864055,-6.792805],[-79.864009,-6.792619],[-79.863993,-6.79251],[-79.863942,-6.79229],[-79.863871,-6.792096],[-79.863644,-6.79213],[-79.863605,-6.792142],[-79.863586,-6.792146],[-79.863527,-6.792149],[-79.863431,-6.79215],[-79.863175,-6.792145],[-79.863042,-6.792128],[-79.862988,-6.792132],[-79.862941,-6.792111],[-79.862882,-6.79208],[-79.8627,-6.792057],[-79.862671,-6.79188],[-79.86266,-6.791595],[-79.862619,-6.791263],[-79.862574,-6.79097],[-79.862561,-6.790765],[-79.862571,-6.790457],[-79.862704,-6.790256],[-79.862645,-6.789879],[-79.862548,-6.789392],[-79.862422,-6.788899],[-79.862193,-6.788914],[-79.861943,-6.788899],[-79.861454,-6.788976],[-79.861278,-6.788993],[-79.861193,-6.788986],[-79.86115,-6.788803],[-79.86113,-6.788661],[-79.861109,-6.788569],[-79.860979,-6.788583],[-79.860822,-6.7886],[-79.860666,-6.788609],[-79.860517,-6.788619],[-79.86042,-6.788664],[-79.860335,-6.788731],[-79.860313,-6.788681],[-79.859952,-6.788672],[-79.859811,-6.788676],[-79.85962,-6.788679],[-79.859455,-6.788673],[-79.859496,-6.788531],[-79.859711,-6.788137],[-79.860197,-6.787318],[-79.861428,-6.78531],[-79.861843,-6.784626],[-79.86199,-6.784357],[-79.862142,-6.784083]]]},"properties":{"name":"III","viviendas":967}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.869189,-6.785425],[-79.86977,-6.78577],[-79.870342,-6.786094],[-79.871233,-6.786473],[-79.871919,-6.786775],[-79.872211,-6.786899],[-79.873712,-6.787514],[-79.873591,-6.7879],[-79.873337,-6.788539],[-79.873207,-6.788862],[-79.872719,-6.790422],[-79.87262,-6.790497],[-79.872525,-6.790492],[-79.872481,-6.790509],[-79.872378,-6.790553],[-79.872222,-6.790614],[-79.872046,-6.790676],[-79.871786,-6.790728],[-79.871301,-6.790827],[-79.870793,-6.790888],[-79.87044,-6.790923],[-79.870176,-6.790979],[-79.869934,-6.791047],[-79.869688,-6.791147],[-79.869496,-6.791218],[-79.869163,-6.791316],[-79.869019,-6.791315],[-79.868758,-6.791252],[-79.868377,-6.791262],[-79.868385,-6.791314],[-79.868407,-6.791549],[-79.868261,-6.791545],[-79.868039,-6.791574],[-79.867,-6.791555],[-79.866416,-6.79161],[-79.865816,-6.791658],[-79.86576,-6.791517],[-79.865646,-6.791168],[-79.865837,-6.790897],[-79.866275,-6.790168],[-79.867209,-6.788623],[-79.867847,-6.787534],[-79.868116,-6.787087],[-79.869189,-6.785425]]]},"properties":{"name":"II","viviendas":961}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.869196,-6.785417],[-79.869534,-6.784823],[-79.869771,-6.784448],[-79.870015,-6.784058],[-79.871293,-6.78206],[-79.872283,-6.78247],[-79.872833,-6.782645],[-79.873265,-6.782858],[-79.873406,-6.782954],[-79.873509,-6.783003],[-79.873627,-6.783137],[-79.87377,-6.783292],[-79.873871,-6.78351],[-79.873979,-6.7837],[-79.874099,-6.783625],[-79.87421,-6.783623],[-79.874417,-6.783709],[-79.874629,-6.783787],[-79.874729,-6.783852],[-79.874697,-6.783916],[-79.87465,-6.784009],[-79.874556,-6.78418],[-79.874624,-6.784196],[-79.874723,-6.784232],[-79.874824,-6.784263],[-79.874922,-6.784298],[-79.874852,-6.784482],[-79.874774,-6.784662],[-79.874642,-6.784924],[-79.874571,-6.785072],[-79.874747,-6.785171],[-79.874703,-6.785269],[-79.874554,-6.785601],[-79.874366,-6.786028],[-79.874302,-6.786272],[-79.874263,-6.786455],[-79.873832,-6.787393],[-79.873768,-6.787529],[-79.873539,-6.787435],[-79.87287,-6.787164],[-79.872272,-6.786916],[-79.871657,-6.786655],[-79.87138,-6.786531],[-79.871225,-6.786465],[-79.871055,-6.786393],[-79.870898,-6.786326],[-79.870723,-6.786251],[-79.870517,-6.786161],[-79.870346,-6.786089],[-79.869789,-6.785773],[-79.869657,-6.785688],[-79.86948,-6.785586],[-79.869312,-6.785488],[-79.869196,-6.785417]]]},"properties":{"name":"I","viviendas":1229}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.877045,-6.781375],[-79.877462,-6.781965],[-79.877635,-6.782209],[-79.877909,-6.782625],[-79.878264,-6.783145],[-79.878522,-6.783543],[-79.878672,-6.783914],[-79.878797,-6.784345],[-79.879147,-6.788068],[-79.879334,-6.78892],[-79.879519,-6.789427],[-79.87984,-6.790176],[-79.880137,-6.79055],[-79.880159,-6.791011],[-79.880348,-6.791696],[-79.880294,-6.79199],[-79.880159,-6.79218],[-79.879937,-6.7923],[-79.879644,-6.792326],[-79.879346,-6.792201],[-79.879089,-6.792097],[-79.878827,-6.791967],[-79.87859,-6.791865],[-79.878356,-6.791758],[-79.878144,-6.79165],[-79.877896,-6.791537],[-79.877663,-6.791424],[-79.877319,-6.791254],[-79.876894,-6.791044],[-79.876491,-6.790854],[-79.876007,-6.790624],[-79.87544,-6.790349],[-79.874906,-6.790094],[-79.874434,-6.789846],[-79.874022,-6.789656],[-79.873671,-6.789495],[-79.873401,-6.789355],[-79.873108,-6.789215],[-79.873139,-6.789124],[-79.87317,-6.789027],[-79.873206,-6.788912],[-79.873224,-6.788864],[-79.873239,-6.788813],[-79.873277,-6.788724],[-79.873457,-6.788276],[-79.873493,-6.788188],[-79.873526,-6.788094],[-79.873603,-6.787896],[-79.873723,-6.787524],[-79.873777,-6.787541],[-79.8738,-6.787523],[-79.874106,-6.786842],[-79.874268,-6.786481],[-79.874322,-6.786266],[-79.874393,-6.786009],[-79.87451,-6.785793],[-79.874658,-6.785418],[-79.874715,-6.785283],[-79.874743,-6.78521],[-79.874758,-6.785164],[-79.874709,-6.785134],[-79.874634,-6.785095],[-79.874588,-6.785066],[-79.874626,-6.784991],[-79.874679,-6.784881],[-79.874729,-6.784787],[-79.874853,-6.784513],[-79.87493,-6.784331],[-79.874933,-6.784284],[-79.874855,-6.784262],[-79.874723,-6.784208],[-79.874594,-6.78416],[-79.874672,-6.784001],[-79.874786,-6.783776],[-79.874606,-6.783648],[-79.874277,-6.783512],[-79.87403,-6.783521],[-79.873929,-6.783267],[-79.873601,-6.782941],[-79.873189,-6.782732],[-79.872807,-6.782572],[-79.872087,-6.782341],[-79.871362,-6.782054],[-79.872274,-6.780575],[-79.872854,-6.779674],[-79.872999,-6.779534],[-79.873178,-6.779425],[-79.873383,-6.779338],[-79.873604,-6.779251],[-79.873846,-6.779171],[-79.874108,-6.779087],[-79.874447,-6.778992],[-79.874647,-6.779022],[-79.874814,-6.779099],[-79.874895,-6.779129],[-79.875029,-6.779199],[-79.875201,-6.779331],[-79.87537,-6.779485],[-79.875566,-6.779671],[-79.875722,-6.779821],[-79.875868,-6.779948],[-79.876164,-6.780206],[-79.876292,-6.78036],[-79.876433,-6.780523],[-79.876538,-6.780663],[-79.876634,-6.780777],[-79.87673,-6.780926],[-79.876835,-6.781057],[-79.876935,-6.781212],[-79.877045,-6.781375]]]},"properties":{"name":"VII","viviendas":1740}}],"C.S. JOSE OLAYA":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.852282,-6.770545],[-79.852459,-6.770531],[-79.852633,-6.770508],[-79.852828,-6.770488],[-79.853166,-6.770462],[-79.85362,-6.770396],[-79.854868,-6.770271],[-79.857399,-6.769979],[-79.85883,-6.76978],[-79.859494,-6.77624],[-79.859322,-6.776259],[-79.859105,-6.776275],[-79.858048,-6.776378],[-79.856963,-6.776495],[-79.856286,-6.776564],[-79.855603,-6.776637],[-79.854256,-6.776759],[-79.853419,-6.776841],[-79.852897,-6.776878],[-79.852869,-6.776588],[-79.852854,-6.776417],[-79.852839,-6.776259],[-79.852748,-6.775299],[-79.852704,-6.774825],[-79.852684,-6.774593],[-79.852661,-6.774368],[-79.85264,-6.774125],[-79.852616,-6.773888],[-79.852591,-6.77364],[-79.852574,-6.773503],[-79.852563,-6.773389],[-79.852552,-6.773316],[-79.852544,-6.773224],[-79.852539,-6.773126],[-79.852523,-6.773004],[-79.852517,-6.772877],[-79.852499,-6.772738],[-79.852489,-6.772638],[-79.85248,-6.772553],[-79.852464,-6.772406],[-79.852446,-6.772237],[-79.852436,-6.772135],[-79.852425,-6.772026],[-79.852405,-6.771853],[-79.852389,-6.771726],[-79.852374,-6.771579],[-79.852365,-6.771425],[-79.852352,-6.771309],[-79.85234,-6.771179],[-79.852328,-6.771014],[-79.852308,-6.770803],[-79.852282,-6.770545]]]},"properties":{"name":"II","viviendas":1915}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.852904,-6.776969],[-79.859525,-6.776323],[-79.859552,-6.776561],[-79.859581,-6.77682],[-79.859628,-6.777295],[-79.85969,-6.777659],[-79.859837,-6.778176],[-79.860079,-6.778687],[-79.860422,-6.779304],[-79.860774,-6.779954],[-79.860691,-6.779978],[-79.860478,-6.780006],[-79.860196,-6.780028],[-79.859893,-6.780056],[-79.859836,-6.780089],[-79.859942,-6.781218],[-79.8593,-6.782528],[-79.858988,-6.782374],[-79.858346,-6.782063],[-79.857549,-6.781637],[-79.856912,-6.781311],[-79.856563,-6.781141],[-79.856225,-6.780914],[-79.85601,-6.78072],[-79.855759,-6.78057],[-79.85543,-6.780498],[-79.855127,-6.780435],[-79.853504,-6.779645],[-79.852497,-6.779083],[-79.852397,-6.779015],[-79.852218,-6.778876],[-79.852122,-6.778764],[-79.852079,-6.778688],[-79.852153,-6.778656],[-79.852222,-6.77864],[-79.852289,-6.778622],[-79.85238,-6.778595],[-79.852594,-6.778544],[-79.852826,-6.778476],[-79.853041,-6.778418],[-79.853037,-6.778338],[-79.852943,-6.777383],[-79.852904,-6.776969]]]},"properties":{"name":"I","viviendas":1354}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.845065,-6.771222],[-79.845126,-6.771661],[-79.845165,-6.772016],[-79.845213,-6.772318],[-79.845243,-6.772646],[-79.845304,-6.773019],[-79.845372,-6.773418],[-79.845433,-6.773848],[-79.845516,-6.774275],[-79.845579,-6.774748],[-79.845628,-6.77513],[-79.845663,-6.775395],[-79.845719,-6.775687],[-79.845775,-6.776028],[-79.845803,-6.776452],[-79.845719,-6.776689],[-79.845523,-6.776738],[-79.845246,-6.776672],[-79.844273,-6.776488],[-79.843516,-6.776318],[-79.842916,-6.776068],[-79.842407,-6.775849],[-79.841653,-6.775596],[-79.841136,-6.77542],[-79.840539,-6.775452],[-79.839669,-6.775532],[-79.838802,-6.775611],[-79.838073,-6.775692],[-79.837613,-6.775749],[-79.837156,-6.775802],[-79.836801,-6.775849],[-79.836245,-6.775924],[-79.835545,-6.776003],[-79.835632,-6.775484],[-79.835769,-6.775067],[-79.83578,-6.774676],[-79.835925,-6.774131],[-79.836023,-6.773762],[-79.836104,-6.773371],[-79.83612,-6.772802],[-79.836135,-6.772205],[-79.836809,-6.772116],[-79.837349,-6.772027],[-79.838096,-6.771955],[-79.838791,-6.77183],[-79.839389,-6.771812],[-79.840192,-6.771722],[-79.841014,-6.771632],[-79.841581,-6.771596],[-79.842269,-6.771524],[-79.842907,-6.771469],[-79.843719,-6.77136],[-79.844326,-6.771287],[-79.845065,-6.771222]]]},"properties":{"name":"IV","viviendas":1297}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.844202,-6.776552],[-79.844458,-6.779091],[-79.84437,-6.779119],[-79.844276,-6.779123],[-79.844208,-6.779112],[-79.844167,-6.779091],[-79.844064,-6.779017],[-79.843976,-6.778948],[-79.843849,-6.778901],[-79.843718,-6.77887],[-79.843572,-6.778882],[-79.843439,-6.778906],[-79.843259,-6.778995],[-79.842807,-6.779289],[-79.842587,-6.779402],[-79.842359,-6.779496],[-79.842044,-6.779597],[-79.841877,-6.779622],[-79.841722,-6.77965],[-79.841529,-6.779667],[-79.841287,-6.779662],[-79.840899,-6.779622],[-79.840577,-6.77953],[-79.840292,-6.779416],[-79.839872,-6.7792],[-79.839182,-6.778776],[-79.838822,-6.778553],[-79.838459,-6.778329],[-79.837986,-6.778035],[-79.837528,-6.777755],[-79.837075,-6.777476],[-79.836635,-6.777208],[-79.835765,-6.776701],[-79.835561,-6.776655],[-79.835439,-6.776566],[-79.835518,-6.776297],[-79.835556,-6.776067],[-79.836054,-6.776015],[-79.837078,-6.77587],[-79.837379,-6.775827],[-79.837716,-6.775799],[-79.838226,-6.775729],[-79.838745,-6.775679],[-79.839229,-6.775626],[-79.839813,-6.775573],[-79.84037,-6.775515],[-79.840823,-6.775497],[-79.841135,-6.775532],[-79.841575,-6.77565],[-79.842013,-6.775794],[-79.842459,-6.775962],[-79.842852,-6.776142],[-79.843288,-6.776359],[-79.843739,-6.776472],[-79.844202,-6.776552]]]},"properties":{"name":"V","viviendas":1108}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.844941,-6.781206],[-79.844259,-6.781382],[-79.843859,-6.781512],[-79.843655,-6.781571],[-79.843419,-6.781637],[-79.843182,-6.781718],[-79.843048,-6.781739],[-79.842927,-6.781731],[-79.842782,-6.781699],[-79.842674,-6.781704],[-79.842605,-6.78176],[-79.842559,-6.781838],[-79.842377,-6.781985],[-79.842155,-6.78206],[-79.841801,-6.782174],[-79.841563,-6.782245],[-79.841315,-6.782324],[-79.840611,-6.782562],[-79.840199,-6.782693],[-79.839733,-6.782848],[-79.838941,-6.783121],[-79.838562,-6.783248],[-79.838243,-6.783354],[-79.837889,-6.783477],[-79.837512,-6.783578],[-79.837212,-6.783668],[-79.836955,-6.7838],[-79.836752,-6.784003],[-79.836641,-6.784209],[-79.83649,-6.784622],[-79.836331,-6.785023],[-79.835744,-6.784817],[-79.835094,-6.784576],[-79.834604,-6.78447],[-79.834218,-6.784303],[-79.833607,-6.784103],[-79.833848,-6.782959],[-79.834055,-6.782067],[-79.834191,-6.781216],[-79.834396,-6.780306],[-79.834689,-6.779332],[-79.834922,-6.778641],[-79.83547,-6.776805],[-79.835911,-6.777055],[-79.836345,-6.777313],[-79.836683,-6.777507],[-79.837028,-6.777703],[-79.837686,-6.778101],[-79.838338,-6.778507],[-79.838549,-6.778638],[-79.838827,-6.778818],[-79.838905,-6.778853],[-79.838955,-6.778741],[-79.839003,-6.778692],[-79.839085,-6.778748],[-79.839218,-6.778827],[-79.839371,-6.778923],[-79.839715,-6.779136],[-79.840153,-6.779386],[-79.840349,-6.779473],[-79.840557,-6.779557],[-79.840696,-6.779602],[-79.840806,-6.779639],[-79.840934,-6.779649],[-79.841112,-6.779668],[-79.841282,-6.779686],[-79.84147,-6.779693],[-79.841657,-6.77968],[-79.84184,-6.779655],[-79.842032,-6.779623],[-79.842266,-6.779558],[-79.84245,-6.779489],[-79.842571,-6.779437],[-79.842649,-6.779394],[-79.842759,-6.77934],[-79.842887,-6.779264],[-79.842994,-6.779198],[-79.843065,-6.77915],[-79.843129,-6.779101],[-79.843213,-6.779048],[-79.843337,-6.778978],[-79.843442,-6.778927],[-79.843564,-6.778902],[-79.843701,-6.778895],[-79.843811,-6.778916],[-79.843909,-6.778948],[-79.844017,-6.779012],[-79.844098,-6.779071],[-79.844206,-6.779135],[-79.844311,-6.779148],[-79.84448,-6.779124],[-79.844515,-6.779287],[-79.844534,-6.779416],[-79.844728,-6.780303],[-79.844941,-6.781206]]]},"properties":{"name":"VI","viviendas":2299}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.85412,-6.783587],[-79.854006,-6.783942],[-79.853829,-6.784443],[-79.853628,-6.785014],[-79.853466,-6.785482],[-79.853178,-6.786259],[-79.853011,-6.786779],[-79.852915,-6.786819],[-79.852818,-6.786886],[-79.852825,-6.787018],[-79.852863,-6.787175],[-79.852684,-6.787733],[-79.852428,-6.788479],[-79.852201,-6.789129],[-79.851999,-6.789675],[-79.851868,-6.790052],[-79.851746,-6.790425],[-79.851565,-6.790411],[-79.851301,-6.790294],[-79.850952,-6.790199],[-79.850535,-6.790117],[-79.850448,-6.790013],[-79.850309,-6.789893],[-79.850076,-6.789835],[-79.849547,-6.789864],[-79.849247,-6.789886],[-79.848968,-6.789886],[-79.848807,-6.789879],[-79.848414,-6.789805],[-79.848176,-6.789715],[-79.847894,-6.789587],[-79.847603,-6.789457],[-79.847346,-6.789349],[-79.847168,-6.789254],[-79.847087,-6.789017],[-79.846936,-6.788423],[-79.846733,-6.787579],[-79.846445,-6.786495],[-79.846384,-6.7862],[-79.846245,-6.785643],[-79.846085,-6.784956],[-79.845931,-6.784375],[-79.846384,-6.784263],[-79.846693,-6.784184],[-79.84681,-6.784153],[-79.846914,-6.784133],[-79.847171,-6.784072],[-79.847447,-6.784017],[-79.847688,-6.783961],[-79.847944,-6.783899],[-79.848181,-6.783852],[-79.848283,-6.783839],[-79.848397,-6.783829],[-79.848707,-6.783841],[-79.848896,-6.783848],[-79.849093,-6.783855],[-79.849279,-6.783862],[-79.849373,-6.783855],[-79.849465,-6.783851],[-79.849779,-6.783815],[-79.850114,-6.783789],[-79.850633,-6.783751],[-79.850939,-6.783725],[-79.851366,-6.783694],[-79.851696,-6.783667],[-79.852241,-6.783639],[-79.852704,-6.783601],[-79.853342,-6.783551],[-79.853515,-6.783536],[-79.853673,-6.783535],[-79.853811,-6.783521],[-79.853949,-6.783526],[-79.85412,-6.783587]]]},"properties":{"name":"X","viviendas":1389}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.852057,-6.790022],[-79.85533,-6.78076],[-79.855874,-6.781008],[-79.856679,-6.781365],[-79.857976,-6.782032],[-79.862255,-6.784054],[-79.86188,-6.784653],[-79.861676,-6.785003],[-79.861116,-6.785907],[-79.860911,-6.786249],[-79.860727,-6.78657],[-79.860538,-6.786633],[-79.860477,-6.786745],[-79.860424,-6.786857],[-79.860242,-6.787321],[-79.859785,-6.788111],[-79.859378,-6.788778],[-79.859077,-6.789273],[-79.858796,-6.789697],[-79.858551,-6.790072],[-79.858288,-6.790456],[-79.858123,-6.790705],[-79.857958,-6.79096],[-79.857864,-6.791118],[-79.857762,-6.791274],[-79.857683,-6.791216],[-79.8575,-6.791089],[-79.857306,-6.790944],[-79.85721,-6.790869],[-79.857136,-6.790769],[-79.857027,-6.790899],[-79.856937,-6.791048],[-79.85663,-6.791469],[-79.856404,-6.791807],[-79.856213,-6.791988],[-79.856042,-6.791881],[-79.855872,-6.791788],[-79.855669,-6.791706],[-79.855515,-6.791673],[-79.855311,-6.791728],[-79.855068,-6.791771],[-79.854892,-6.791816],[-79.854686,-6.791846],[-79.854569,-6.791833],[-79.854441,-6.791789],[-79.854156,-6.791691],[-79.853713,-6.791555],[-79.853381,-6.79144],[-79.853056,-6.791335],[-79.852833,-6.791266],[-79.852622,-6.791202],[-79.852389,-6.791123],[-79.852245,-6.791069],[-79.852161,-6.791037],[-79.852076,-6.79099],[-79.851974,-6.790911],[-79.851896,-6.790793],[-79.851861,-6.79066],[-79.851871,-6.790536],[-79.851906,-6.790409],[-79.851969,-6.790235],[-79.852057,-6.790022]]]},"properties":{"name":"XI","viviendas":1734}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.846966,-6.789261],[-79.8466,-6.789059],[-79.846236,-6.788878],[-79.845916,-6.788761],[-79.845501,-6.78863],[-79.845178,-6.788509],[-79.844811,-6.788362],[-79.844424,-6.788163],[-79.843798,-6.787912],[-79.842961,-6.787644],[-79.842935,-6.787551],[-79.842945,-6.787495],[-79.842986,-6.787396],[-79.843005,-6.78732],[-79.842064,-6.786993],[-79.84113,-6.786676],[-79.836401,-6.78505],[-79.836523,-6.784719],[-79.836614,-6.784454],[-79.836698,-6.784231],[-79.836868,-6.783984],[-79.837153,-6.783816],[-79.837566,-6.783665],[-79.837984,-6.783533],[-79.838432,-6.783386],[-79.83939,-6.783072],[-79.841306,-6.782459],[-79.841904,-6.782262],[-79.842175,-6.78218],[-79.842435,-6.782092],[-79.842601,-6.782087],[-79.842803,-6.78212],[-79.842954,-6.781975],[-79.843079,-6.781872],[-79.843266,-6.781769],[-79.843475,-6.781707],[-79.843662,-6.781645],[-79.843891,-6.781588],[-79.844167,-6.781505],[-79.844406,-6.781433],[-79.844614,-6.781381],[-79.84481,-6.781334],[-79.844974,-6.781294],[-79.845035,-6.781526],[-79.845111,-6.781824],[-79.845199,-6.782181],[-79.845317,-6.782619],[-79.845393,-6.782963],[-79.845465,-6.783227],[-79.84557,-6.783656],[-79.845642,-6.783957],[-79.84572,-6.784272],[-79.845785,-6.784541],[-79.845854,-6.784805],[-79.845943,-6.785187],[-79.846005,-6.785435],[-79.846078,-6.785704],[-79.846142,-6.785947],[-79.84619,-6.786168],[-79.846338,-6.786696],[-79.846381,-6.786907],[-79.846497,-6.787357],[-79.846556,-6.787584],[-79.846652,-6.787947],[-79.846698,-6.788168],[-79.846808,-6.788552],[-79.846862,-6.7888],[-79.846937,-6.789085],[-79.846966,-6.789261]]]},"properties":{"name":"IX","viviendas":2321}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.852268,-6.770545],[-79.852292,-6.770809],[-79.852317,-6.771099],[-79.852365,-6.771668],[-79.85249,-6.772788],[-79.853015,-6.778393],[-79.852548,-6.778527],[-79.852327,-6.778586],[-79.852152,-6.778632],[-79.852045,-6.778661],[-79.851967,-6.778629],[-79.851894,-6.778612],[-79.851754,-6.778548],[-79.851608,-6.778468],[-79.851404,-6.778365],[-79.851098,-6.778206],[-79.850914,-6.778114],[-79.850722,-6.778004],[-79.85049,-6.77789],[-79.850213,-6.777765],[-79.849943,-6.77767],[-79.84958,-6.777563],[-79.849191,-6.777482],[-79.84855,-6.777343],[-79.847918,-6.7772],[-79.847489,-6.777107],[-79.847072,-6.777023],[-79.846703,-6.776984],[-79.845959,-6.776836],[-79.845895,-6.776191],[-79.845772,-6.775545],[-79.845586,-6.774245],[-79.845539,-6.773898],[-79.845432,-6.773268],[-79.845363,-6.7728],[-79.845327,-6.772472],[-79.845252,-6.77184],[-79.84522,-6.771584],[-79.845178,-6.771269],[-79.845265,-6.77126],[-79.845454,-6.771242],[-79.845646,-6.771226],[-79.846013,-6.771183],[-79.846231,-6.771163],[-79.846385,-6.771151],[-79.846905,-6.771097],[-79.847158,-6.77107],[-79.847611,-6.771026],[-79.847769,-6.77101],[-79.847977,-6.770987],[-79.848425,-6.770949],[-79.848608,-6.770927],[-79.848836,-6.770908],[-79.849243,-6.770861],[-79.849479,-6.770839],[-79.849586,-6.770827],[-79.849751,-6.770811],[-79.850133,-6.770769],[-79.850283,-6.770751],[-79.850506,-6.770724],[-79.850923,-6.770685],[-79.851095,-6.77067],[-79.851291,-6.770652],[-79.851539,-6.770623],[-79.851767,-6.770602],[-79.852015,-6.770578],[-79.852175,-6.770564],[-79.852268,-6.770545]]]},"properties":{"name":"III","viviendas":981}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.849344,-6.783831],[-79.849325,-6.78364],[-79.849296,-6.783442],[-79.849252,-6.783102],[-79.849231,-6.7829],[-79.849191,-6.782623],[-79.849117,-6.782164],[-79.849068,-6.781779],[-79.848963,-6.781016],[-79.848869,-6.780357],[-79.848829,-6.780029],[-79.848781,-6.779698],[-79.848878,-6.779656],[-79.849012,-6.779597],[-79.849156,-6.779545],[-79.849296,-6.779465],[-79.849489,-6.779401],[-79.850177,-6.779185],[-79.850552,-6.779059],[-79.850825,-6.778984],[-79.851141,-6.778939],[-79.851364,-6.778902],[-79.851688,-6.778832],[-79.85185,-6.778798],[-79.851893,-6.778841],[-79.851942,-6.778876],[-79.852113,-6.778965],[-79.852291,-6.779053],[-79.85264,-6.779292],[-79.852919,-6.779444],[-79.853396,-6.779677],[-79.853751,-6.77986],[-79.854056,-6.780017],[-79.854373,-6.780181],[-79.854703,-6.780333],[-79.854868,-6.780427],[-79.855014,-6.780534],[-79.855173,-6.78066],[-79.855,-6.781107],[-79.854573,-6.782312],[-79.85442,-6.782722],[-79.854306,-6.783049],[-79.854222,-6.783292],[-79.85414,-6.783491],[-79.854113,-6.783557],[-79.85405,-6.783546],[-79.853977,-6.783516],[-79.853897,-6.783505],[-79.853769,-6.783512],[-79.85361,-6.783521],[-79.853382,-6.783532],[-79.853127,-6.783546],[-79.852847,-6.783571],[-79.852301,-6.783611],[-79.851551,-6.783661],[-79.850925,-6.783711],[-79.85018,-6.783767],[-79.849877,-6.783792],[-79.849638,-6.783808],[-79.849428,-6.783828],[-79.849344,-6.783831]]]},"properties":{"name":"VII","viviendas":1071}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.851841,-6.778754],[-79.85184,-6.778783],[-79.851718,-6.77881],[-79.851557,-6.778846],[-79.851402,-6.77888],[-79.851255,-6.778908],[-79.851134,-6.778926],[-79.851032,-6.778939],[-79.850946,-6.778953],[-79.850843,-6.778969],[-79.850566,-6.779041],[-79.850364,-6.779109],[-79.850254,-6.779146],[-79.850128,-6.779188],[-79.84994,-6.779247],[-79.849778,-6.779299],[-79.849631,-6.779348],[-79.84947,-6.779396],[-79.849331,-6.779436],[-79.849168,-6.779507],[-79.848966,-6.779591],[-79.848744,-6.779677],[-79.848763,-6.779703],[-79.848772,-6.779753],[-79.848787,-6.779826],[-79.848817,-6.78004],[-79.848844,-6.780248],[-79.848959,-6.781099],[-79.848985,-6.781259],[-79.849008,-6.781437],[-79.84905,-6.781771],[-79.849065,-6.781855],[-79.849074,-6.781944],[-79.849101,-6.782137],[-79.849161,-6.78251],[-79.849192,-6.782712],[-79.849218,-6.782898],[-79.849243,-6.78313],[-79.849278,-6.783398],[-79.84933,-6.783835],[-79.849074,-6.783828],[-79.848815,-6.78382],[-79.848613,-6.783814],[-79.848397,-6.783809],[-79.848194,-6.783822],[-79.847909,-6.783885],[-79.847673,-6.78395],[-79.847447,-6.783997],[-79.847302,-6.784031],[-79.847118,-6.784072],[-79.846882,-6.784127],[-79.846758,-6.784157],[-79.846597,-6.784197],[-79.84642,-6.784242],[-79.84622,-6.784292],[-79.846017,-6.784345],[-79.845944,-6.784359],[-79.845932,-6.784332],[-79.845873,-6.784115],[-79.845771,-6.783729],[-79.845695,-6.783418],[-79.844955,-6.780628],[-79.844901,-6.780433],[-79.844805,-6.780056],[-79.844689,-6.779572],[-79.844663,-6.77945],[-79.84463,-6.779195],[-79.844619,-6.779107],[-79.844595,-6.778964],[-79.84456,-6.778673],[-79.844494,-6.778178],[-79.844458,-6.777882],[-79.84442,-6.777562],[-79.844406,-6.777428],[-79.844367,-6.777082],[-79.844353,-6.776848],[-79.844349,-6.776755],[-79.844326,-6.776656],[-79.844331,-6.776583],[-79.844449,-6.776606],[-79.844564,-6.776633],[-79.8447,-6.776656],[-79.844804,-6.776676],[-79.844976,-6.776711],[-79.845609,-6.776846],[-79.845705,-6.776867],[-79.845801,-6.776897],[-79.845889,-6.776898],[-79.84596,-6.776888],[-79.846128,-6.776936],[-79.846252,-6.776964],[-79.846434,-6.777],[-79.846677,-6.777055],[-79.846802,-6.77709],[-79.847195,-6.777169],[-79.847552,-6.777247],[-79.847741,-6.777292],[-79.848005,-6.777347],[-79.848118,-6.777372],[-79.848273,-6.777405],[-79.848591,-6.777478],[-79.848823,-6.777529],[-79.848933,-6.777551],[-79.849089,-6.777588],[-79.849397,-6.777651],[-79.849542,-6.77768],[-79.849781,-6.777756],[-79.849899,-6.777795],[-79.85019,-6.777892],[-79.85044,-6.777994],[-79.850745,-6.778144],[-79.850871,-6.778208],[-79.851186,-6.778364],[-79.851324,-6.778446],[-79.851517,-6.778541],[-79.851622,-6.778596],[-79.851712,-6.778649],[-79.851784,-6.778694],[-79.851841,-6.778754]]]},"properties":{"name":"VIII","viviendas":1531}}],"C.S. LA VICTORIA S.II":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.839167,-6.801202],[-79.838581,-6.801096],[-79.838109,-6.80101],[-79.837641,-6.800913],[-79.836952,-6.800799],[-79.836273,-6.800675],[-79.835619,-6.800568],[-79.835015,-6.800461],[-79.835117,-6.79997],[-79.835264,-6.799263],[-79.835501,-6.79817],[-79.835657,-6.797423],[-79.835765,-6.796901],[-79.835854,-6.796497],[-79.83623,-6.796575],[-79.836658,-6.796665],[-79.837277,-6.796799],[-79.837741,-6.796897],[-79.838234,-6.797003],[-79.83865,-6.797094],[-79.838833,-6.797133],[-79.839016,-6.797177],[-79.839185,-6.797216],[-79.839355,-6.797256],[-79.839708,-6.797335],[-79.839953,-6.797388],[-79.8399,-6.797665],[-79.839804,-6.798141],[-79.839714,-6.798544],[-79.839552,-6.799297],[-79.839463,-6.799779],[-79.83942,-6.799987],[-79.839374,-6.800208],[-79.839351,-6.800318],[-79.839324,-6.800445],[-79.839247,-6.800803],[-79.839167,-6.801202]]]},"properties":{"name":"I","viviendas":1077}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.839953,-6.797369],[-79.839346,-6.797232],[-79.839046,-6.797163],[-79.83874,-6.797094],[-79.83831,-6.797003],[-79.837878,-6.79691],[-79.837491,-6.796826],[-79.837116,-6.796744],[-79.836532,-6.796621],[-79.835859,-6.796474],[-79.836011,-6.795742],[-79.83612,-6.79522],[-79.836256,-6.794564],[-79.836409,-6.793901],[-79.836469,-6.793626],[-79.836528,-6.793355],[-79.836577,-6.793091],[-79.836622,-6.792854],[-79.837092,-6.792956],[-79.837756,-6.793094],[-79.838237,-6.793209],[-79.839067,-6.793392],[-79.839815,-6.793553],[-79.840332,-6.793663],[-79.840709,-6.793747],[-79.840643,-6.794053],[-79.840567,-6.794407],[-79.840453,-6.794931],[-79.840348,-6.795417],[-79.840246,-6.795905],[-79.840154,-6.796405],[-79.84007,-6.796807],[-79.839953,-6.797369]]]},"properties":{"name":"II","viviendas":1093}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.834982,-6.800475],[-79.834549,-6.800388],[-79.834113,-6.800295],[-79.833262,-6.800109],[-79.832463,-6.799929],[-79.832004,-6.799826],[-79.831554,-6.799717],[-79.830983,-6.799602],[-79.830836,-6.799568],[-79.830697,-6.799513],[-79.830627,-6.799456],[-79.830613,-6.799365],[-79.830639,-6.79915],[-79.830665,-6.798923],[-79.830729,-6.798358],[-79.830743,-6.798228],[-79.830765,-6.798089],[-79.830805,-6.797838],[-79.830848,-6.797588],[-79.83094,-6.797122],[-79.830976,-6.796951],[-79.831011,-6.796789],[-79.831074,-6.796466],[-79.831174,-6.795972],[-79.831271,-6.795533],[-79.831598,-6.795605],[-79.831959,-6.795679],[-79.832676,-6.795828],[-79.833394,-6.795974],[-79.833853,-6.796073],[-79.834339,-6.796175],[-79.834571,-6.796223],[-79.83481,-6.796271],[-79.835158,-6.796346],[-79.835824,-6.796485],[-79.835678,-6.797189],[-79.835513,-6.79796],[-79.835347,-6.79875],[-79.835224,-6.799324],[-79.835059,-6.800101],[-79.834982,-6.800475]]]},"properties":{"name":"III","viviendas":1050}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.836597,-6.792843],[-79.836504,-6.793315],[-79.836413,-6.793767],[-79.836204,-6.794678],[-79.835825,-6.796473],[-79.835379,-6.796374],[-79.834935,-6.79628],[-79.834265,-6.796141],[-79.833928,-6.79607],[-79.833593,-6.795998],[-79.833253,-6.795927],[-79.83292,-6.795862],[-79.832577,-6.795788],[-79.832241,-6.795719],[-79.831275,-6.795515],[-79.831336,-6.795229],[-79.831518,-6.794353],[-79.831702,-6.79347],[-79.831869,-6.792651],[-79.831962,-6.792222],[-79.832032,-6.791876],[-79.833003,-6.792073],[-79.834267,-6.792337],[-79.834932,-6.792487],[-79.835577,-6.792621],[-79.836139,-6.792747],[-79.836597,-6.792843]]]},"properties":{"name":"IV","viviendas":1008}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.834799,-6.792372],[-79.83413,-6.792221],[-79.833795,-6.792149],[-79.833467,-6.792076],[-79.832797,-6.791929],[-79.832451,-6.791852],[-79.832058,-6.791771],[-79.832262,-6.790746],[-79.832477,-6.789724],[-79.832608,-6.789119],[-79.832725,-6.78856],[-79.833362,-6.788681],[-79.833671,-6.788741],[-79.833997,-6.788804],[-79.834141,-6.788114],[-79.834466,-6.788177],[-79.834751,-6.788235],[-79.834693,-6.788529],[-79.835573,-6.788702],[-79.83548,-6.789177],[-79.835345,-6.789826],[-79.83523,-6.790376],[-79.835089,-6.791001],[-79.834957,-6.791583],[-79.834799,-6.792372]]]},"properties":{"name":"V","viviendas":618}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.835574,-6.788688],[-79.834719,-6.78851],[-79.834781,-6.78822],[-79.834452,-6.78815],[-79.834126,-6.788084],[-79.833981,-6.788775],[-79.833349,-6.788659],[-79.832737,-6.788539],[-79.833163,-6.786443],[-79.833593,-6.784405],[-79.834935,-6.784865],[-79.835626,-6.785108],[-79.835959,-6.78522],[-79.836276,-6.785327],[-79.836097,-6.786157],[-79.835938,-6.787006],[-79.83576,-6.787841],[-79.835668,-6.788264],[-79.835574,-6.788688]]]},"properties":{"name":"VI","viviendas":732}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.835492,-6.789223],[-79.835735,-6.78928],[-79.835981,-6.78934],[-79.836229,-6.789398],[-79.836468,-6.789455],[-79.836557,-6.789038],[-79.836642,-6.788639],[-79.836822,-6.788677],[-79.837026,-6.788724],[-79.837432,-6.78881],[-79.838242,-6.788982],[-79.838636,-6.789064],[-79.839039,-6.789146],[-79.839827,-6.789322],[-79.839829,-6.789389],[-79.839872,-6.789438],[-79.840221,-6.789509],[-79.840541,-6.789576],[-79.840861,-6.789639],[-79.841028,-6.789671],[-79.84118,-6.789703],[-79.841296,-6.789726],[-79.84154,-6.789787],[-79.841331,-6.790792],[-79.841218,-6.791264],[-79.841166,-6.791512],[-79.841159,-6.791746],[-79.84109,-6.791971],[-79.841039,-6.792242],[-79.840941,-6.792705],[-79.840742,-6.793657],[-79.839539,-6.793409],[-79.838323,-6.79314],[-79.838109,-6.793097],[-79.837887,-6.793049],[-79.837454,-6.79295],[-79.836577,-6.79276],[-79.834826,-6.792375],[-79.834988,-6.791552],[-79.835169,-6.790753],[-79.835492,-6.789223]]]},"properties":{"name":"VII","viviendas":206}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.841546,-6.789776],[-79.841402,-6.789744],[-79.841199,-6.789695],[-79.839879,-6.789421],[-79.839853,-6.789397],[-79.839846,-6.789366],[-79.839843,-6.789313],[-79.838837,-6.789089],[-79.838307,-6.788979],[-79.837771,-6.788866],[-79.837203,-6.788743],[-79.836634,-6.788615],[-79.836548,-6.789024],[-79.836461,-6.789435],[-79.835499,-6.789206],[-79.835587,-6.788781],[-79.835679,-6.788349],[-79.835859,-6.78749],[-79.83594,-6.787113],[-79.836014,-6.786727],[-79.836168,-6.785943],[-79.836303,-6.78535],[-79.838887,-6.78624],[-79.841468,-6.787131],[-79.842095,-6.787347],[-79.841795,-6.788685],[-79.841675,-6.789227],[-79.841546,-6.789776]]]},"properties":{"name":"VIII","viviendas":472}}],"P.S. NUEVO MOCUPE":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.65049,-6.97838],[-79.651995,-6.978252],[-79.652756,-6.978219],[-79.653512,-6.978188],[-79.653885,-6.978185],[-79.654242,-6.978169],[-79.654982,-6.978097],[-79.656469,-6.977954],[-79.662704,-6.977364],[-79.662713,-6.977522],[-79.662415,-6.977584],[-79.662422,-6.978007],[-79.661161,-6.978216],[-79.661217,-6.97877],[-79.661345,-6.980403],[-79.661426,-6.981165],[-79.661505,-6.982065],[-79.661568,-6.982873],[-79.661633,-6.983688],[-79.660528,-6.983862],[-79.659176,-6.984077],[-79.658989,-6.984342],[-79.659203,-6.984746],[-79.656347,-6.986417],[-79.655335,-6.987012],[-79.655135,-6.986805],[-79.654965,-6.986664],[-79.654614,-6.986424],[-79.653956,-6.985966],[-79.653156,-6.98541],[-79.652528,-6.984965],[-79.651836,-6.984468],[-79.651242,-6.984044],[-79.651298,-6.983904],[-79.651324,-6.983779],[-79.651393,-6.983362],[-79.651446,-6.983029],[-79.651447,-6.982781],[-79.651438,-6.982478],[-79.651417,-6.982088],[-79.651391,-6.981989],[-79.651345,-6.981743],[-79.65077,-6.981807],[-79.650734,-6.981347],[-79.650689,-6.980859],[-79.650638,-6.980246],[-79.650612,-6.979914],[-79.650606,-6.979719],[-79.650603,-6.979609],[-79.650582,-6.979459],[-79.650568,-6.979362],[-79.65054,-6.979111],[-79.650514,-6.978834],[-79.650492,-6.978415],[-79.65049,-6.97838]]]},"properties":{"name":"I","viviendas":658}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.650472,-6.978388],[-79.650481,-6.978511],[-79.650497,-6.978837],[-79.650521,-6.979118],[-79.650552,-6.979372],[-79.650586,-6.979627],[-79.650595,-6.979922],[-79.650623,-6.980258],[-79.650674,-6.980861],[-79.650719,-6.981355],[-79.650754,-6.981819],[-79.651076,-6.981784],[-79.651332,-6.98176],[-79.651402,-6.982095],[-79.651426,-6.98255],[-79.651431,-6.982775],[-79.651429,-6.983029],[-79.651392,-6.98324],[-79.651323,-6.983672],[-79.651286,-6.983888],[-79.651228,-6.984032],[-79.650751,-6.983686],[-79.650434,-6.983455],[-79.650103,-6.983216],[-79.649844,-6.983026],[-79.649567,-6.982829],[-79.64923,-6.982584],[-79.649006,-6.98242],[-79.648813,-6.982284],[-79.648721,-6.982215],[-79.648678,-6.982177],[-79.648642,-6.982136],[-79.648605,-6.982073],[-79.648578,-6.982005],[-79.648565,-6.981931],[-79.648557,-6.981843],[-79.648548,-6.981721],[-79.648532,-6.981514],[-79.648501,-6.981123],[-79.648474,-6.980731],[-79.64845,-6.980425],[-79.648431,-6.980114],[-79.64841,-6.979829],[-79.648374,-6.979261],[-79.64836,-6.978974],[-79.648335,-6.978593],[-79.648533,-6.978576],[-79.648815,-6.978547],[-79.649118,-6.978519],[-79.649446,-6.978484],[-79.649657,-6.978465],[-79.649844,-6.978452],[-79.650139,-6.978421],[-79.650352,-6.978398],[-79.650472,-6.978388]]]},"properties":{"name":"II","viviendas":249}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.648313,-6.978595],[-79.648341,-6.979215],[-79.648378,-6.979831],[-79.648472,-6.981117],[-79.648527,-6.981873],[-79.648534,-6.981946],[-79.648559,-6.98205],[-79.648584,-6.982109],[-79.648647,-6.982188],[-79.648741,-6.982272],[-79.648875,-6.982368],[-79.649009,-6.982465],[-79.649169,-6.98258],[-79.649318,-6.982693],[-79.649389,-6.98275],[-79.649493,-6.982927],[-79.649544,-6.98301],[-79.649448,-6.983077],[-79.649272,-6.983198],[-79.649085,-6.983329],[-79.648841,-6.983495],[-79.64871,-6.983582],[-79.647802,-6.983661],[-79.647354,-6.983655],[-79.647101,-6.983556],[-79.646996,-6.983328],[-79.646835,-6.983252],[-79.646681,-6.983176],[-79.646692,-6.983016],[-79.6467,-6.982863],[-79.646639,-6.982745],[-79.646581,-6.98265],[-79.646462,-6.982511],[-79.646424,-6.982695],[-79.646377,-6.982885],[-79.64632,-6.983089],[-79.646272,-6.983263],[-79.646249,-6.98333],[-79.646221,-6.983378],[-79.646201,-6.983417],[-79.646166,-6.983453],[-79.646144,-6.983491],[-79.6461,-6.98356],[-79.646066,-6.983651],[-79.646005,-6.983797],[-79.645938,-6.983964],[-79.645902,-6.984041],[-79.645867,-6.984104],[-79.645836,-6.984133],[-79.645804,-6.984146],[-79.645726,-6.984146],[-79.645602,-6.984144],[-79.64547,-6.984145],[-79.645248,-6.983882],[-79.645049,-6.983661],[-79.6449,-6.983482],[-79.644809,-6.983376],[-79.644731,-6.983209],[-79.644556,-6.983167],[-79.644394,-6.98305],[-79.644166,-6.982874],[-79.644033,-6.982749],[-79.643965,-6.982626],[-79.643935,-6.982548],[-79.643839,-6.982535],[-79.643826,-6.982509],[-79.643828,-6.982472],[-79.643836,-6.982443],[-79.64387,-6.982415],[-79.644275,-6.982204],[-79.64448,-6.982112],[-79.644676,-6.981994],[-79.644452,-6.981595],[-79.64427,-6.981268],[-79.644082,-6.980917],[-79.643906,-6.980593],[-79.643702,-6.980219],[-79.643518,-6.980289],[-79.643443,-6.980115],[-79.643338,-6.979873],[-79.643821,-6.979652],[-79.644326,-6.979418],[-79.644814,-6.979205],[-79.645005,-6.979126],[-79.645182,-6.97906],[-79.645329,-6.979013],[-79.645433,-6.978982],[-79.645545,-6.978947],[-79.645666,-6.978921],[-79.645814,-6.978883],[-79.645931,-6.978859],[-79.646056,-6.978838],[-79.646258,-6.978805],[-79.646606,-6.97876],[-79.646748,-6.978741],[-79.646908,-6.978726],[-79.647095,-6.978709],[-79.647381,-6.978685],[-79.64764,-6.978658],[-79.647842,-6.978641],[-79.648018,-6.978621],[-79.648175,-6.978606],[-79.648313,-6.978595]]]},"properties":{"name":"III","viviendas":549}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.649268,-6.978473],[-79.649233,-6.97809],[-79.649202,-6.977709],[-79.64917,-6.977402],[-79.649143,-6.977148],[-79.649119,-6.976934],[-79.649095,-6.976719],[-79.649071,-6.976516],[-79.649052,-6.976334],[-79.648991,-6.975676],[-79.648959,-6.975324],[-79.648934,-6.974993],[-79.649044,-6.974984],[-79.649103,-6.975583],[-79.649164,-6.976202],[-79.649389,-6.97619],[-79.649735,-6.97617],[-79.650022,-6.976155],[-79.650286,-6.976141],[-79.650696,-6.976122],[-79.6514,-6.976084],[-79.651491,-6.97682],[-79.651794,-6.976804],[-79.652249,-6.976801],[-79.652626,-6.976793],[-79.652783,-6.977277],[-79.653975,-6.977202],[-79.654384,-6.977185],[-79.654948,-6.977173],[-79.655038,-6.977557],[-79.655085,-6.977747],[-79.655076,-6.977876],[-79.654655,-6.977921],[-79.654212,-6.977963],[-79.653831,-6.978004],[-79.653725,-6.978013],[-79.653156,-6.978067],[-79.652796,-6.978103],[-79.65255,-6.978125],[-79.652413,-6.978145],[-79.651902,-6.978215],[-79.651646,-6.978252],[-79.651448,-6.978264],[-79.65047,-6.97836],[-79.649971,-6.978412],[-79.649556,-6.978449],[-79.649268,-6.978473]]]},"properties":{"name":"IV","viviendas":162}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.64891,-6.974917],[-79.649037,-6.976341],[-79.649081,-6.976729],[-79.649127,-6.977146],[-79.649186,-6.977704],[-79.649206,-6.977898],[-79.64922,-6.9781],[-79.649252,-6.978472],[-79.648487,-6.978556],[-79.64766,-6.978631],[-79.646951,-6.9787],[-79.646302,-6.978777],[-79.645773,-6.978854],[-79.645487,-6.978873],[-79.64523,-6.978895],[-79.645206,-6.978751],[-79.645172,-6.978529],[-79.64511,-6.978096],[-79.64504,-6.977644],[-79.644976,-6.977228],[-79.644937,-6.976983],[-79.644902,-6.976732],[-79.644491,-6.976761],[-79.64408,-6.976783],[-79.643971,-6.976685],[-79.643858,-6.976582],[-79.643795,-6.976531],[-79.643727,-6.976478],[-79.643589,-6.976357],[-79.644244,-6.976061],[-79.644527,-6.975935],[-79.644806,-6.975803],[-79.644758,-6.975327],[-79.645312,-6.975279],[-79.645878,-6.975225],[-79.646134,-6.975199],[-79.64661,-6.975141],[-79.646764,-6.975131],[-79.647137,-6.975107],[-79.647403,-6.975087],[-79.647524,-6.975078],[-79.64891,-6.974917]]]},"properties":{"name":"V","viviendas":348}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.645479,-6.978931],[-79.645267,-6.979005],[-79.645163,-6.979041],[-79.644997,-6.979097],[-79.644905,-6.979136],[-79.644816,-6.979169],[-79.644666,-6.979236],[-79.644454,-6.979331],[-79.644296,-6.979402],[-79.644102,-6.979489],[-79.643954,-6.979554],[-79.643556,-6.979739],[-79.643364,-6.979825],[-79.643074,-6.979957],[-79.642642,-6.980156],[-79.642122,-6.980377],[-79.641433,-6.979848],[-79.640764,-6.979363],[-79.639703,-6.978646],[-79.63966,-6.978505],[-79.639789,-6.97821],[-79.639927,-6.977899],[-79.640185,-6.9774],[-79.640139,-6.977249],[-79.640188,-6.977157],[-79.640564,-6.976946],[-79.64094,-6.976731],[-79.64167,-6.976314],[-79.641502,-6.976008],[-79.641142,-6.975353],[-79.640377,-6.973965],[-79.640235,-6.973702],[-79.640126,-6.973508],[-79.640069,-6.973495],[-79.640017,-6.973467],[-79.639849,-6.973306],[-79.639982,-6.973219],[-79.639738,-6.972775],[-79.640317,-6.972531],[-79.640474,-6.972836],[-79.640874,-6.972641],[-79.641042,-6.972866],[-79.64082,-6.973162],[-79.641301,-6.973952],[-79.643536,-6.972546],[-79.643794,-6.972892],[-79.644429,-6.972554],[-79.644606,-6.972857],[-79.644835,-6.973257],[-79.644384,-6.973552],[-79.643921,-6.973856],[-79.643457,-6.974162],[-79.643007,-6.974456],[-79.64334,-6.97502],[-79.643326,-6.975256],[-79.643307,-6.975471],[-79.643722,-6.975432],[-79.644337,-6.975367],[-79.644739,-6.97533],[-79.644789,-6.975797],[-79.644039,-6.976141],[-79.643569,-6.976352],[-79.643828,-6.97657],[-79.643954,-6.976683],[-79.64407,-6.976793],[-79.644891,-6.976742],[-79.645097,-6.978106],[-79.645139,-6.978399],[-79.645203,-6.978823],[-79.645215,-6.978915],[-79.645455,-6.978901],[-79.645526,-6.978904],[-79.645479,-6.978931]]]},"properties":{"name":"VI","viviendas":487}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.640111,-6.973521],[-79.640193,-6.973672],[-79.640514,-6.974266],[-79.640911,-6.974988],[-79.64127,-6.975644],[-79.641643,-6.976319],[-79.640535,-6.976947],[-79.640181,-6.977146],[-79.640124,-6.977098],[-79.640024,-6.976998],[-79.639274,-6.976266],[-79.638478,-6.975486],[-79.639504,-6.974704],[-79.639278,-6.974457],[-79.639893,-6.973985],[-79.63969,-6.973753],[-79.639658,-6.973714],[-79.639581,-6.973592],[-79.639537,-6.973513],[-79.639603,-6.973464],[-79.63965,-6.973436],[-79.639724,-6.973392],[-79.639832,-6.973316],[-79.639875,-6.973358],[-79.639923,-6.973405],[-79.639991,-6.973465],[-79.640052,-6.973504],[-79.640111,-6.973521]]]},"properties":{"name":"VII","viviendas":131}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.642253,-6.980374],[-79.643568,-6.982865],[-79.643813,-6.983292],[-79.643035,-6.983654],[-79.643914,-6.984215],[-79.644428,-6.984716],[-79.645932,-6.984488],[-79.64599,-6.98454],[-79.646086,-6.984563],[-79.64618,-6.984581],[-79.646376,-6.984614],[-79.646469,-6.984637],[-79.646562,-6.984667],[-79.646727,-6.984702],[-79.646835,-6.984699],[-79.646946,-6.984706],[-79.647076,-6.984715],[-79.647216,-6.984754],[-79.647456,-6.984871],[-79.647886,-6.985082],[-79.648104,-6.985205],[-79.648311,-6.98531],[-79.648495,-6.985367],[-79.648681,-6.985421],[-79.648766,-6.985449],[-79.648839,-6.985497],[-79.64905,-6.985597],[-79.649443,-6.985779],[-79.649875,-6.985986],[-79.650295,-6.986191],[-79.650392,-6.986295],[-79.650428,-6.986384],[-79.650446,-6.986476],[-79.650451,-6.986609],[-79.650428,-6.986764],[-79.650395,-6.986891],[-79.650359,-6.986996],[-79.650241,-6.987347],[-79.650172,-6.987461],[-79.649946,-6.987929],[-79.649775,-6.988267],[-79.64963,-6.988503],[-79.649514,-6.988572],[-79.649399,-6.988597],[-79.649352,-6.988641],[-79.649339,-6.988694],[-79.649312,-6.988745],[-79.649184,-6.988737],[-79.649059,-6.988722],[-79.649012,-6.98875],[-79.64898,-6.988785],[-79.64894,-6.989001],[-79.648892,-6.989268],[-79.648833,-6.989361],[-79.648753,-6.989843],[-79.648885,-6.989872],[-79.649025,-6.989918],[-79.648587,-6.991001],[-79.64815,-6.990816],[-79.647752,-6.990804],[-79.646925,-6.990866],[-79.64631,-6.990937],[-79.646098,-6.990999],[-79.645682,-6.991132],[-79.645453,-6.99114],[-79.644995,-6.991158],[-79.644754,-6.991205],[-79.644353,-6.991335],[-79.643582,-6.991674],[-79.643094,-6.991857],[-79.642895,-6.991902],[-79.64244,-6.991889],[-79.642401,-6.991993],[-79.64223,-6.992108],[-79.642034,-6.992193],[-79.641452,-6.992502],[-79.641366,-6.992605],[-79.641069,-6.992638],[-79.64055,-6.99257],[-79.640479,-6.992665],[-79.640151,-6.992436],[-79.639862,-6.992095],[-79.639693,-6.991909],[-79.639514,-6.991723],[-79.639209,-6.99141],[-79.639204,-6.991351],[-79.639197,-6.991243],[-79.639237,-6.991124],[-79.638994,-6.990949],[-79.63844,-6.990553],[-79.638322,-6.990462],[-79.6382,-6.990391],[-79.637822,-6.990263],[-79.637466,-6.990138],[-79.636985,-6.990083],[-79.636785,-6.990114],[-79.636446,-6.990068],[-79.635626,-6.989611],[-79.634995,-6.989122],[-79.634514,-6.988743],[-79.634269,-6.988482],[-79.634466,-6.988196],[-79.634142,-6.987905],[-79.633988,-6.988116],[-79.633657,-6.987905],[-79.633543,-6.987992],[-79.633459,-6.987956],[-79.632966,-6.987789],[-79.632639,-6.987621],[-79.632378,-6.987453],[-79.632184,-6.987296],[-79.631876,-6.986986],[-79.631788,-6.986763],[-79.631674,-6.986508],[-79.631586,-6.986378],[-79.631457,-6.986229],[-79.631263,-6.986017],[-79.63111,-6.985636],[-79.631041,-6.985331],[-79.631431,-6.985179],[-79.632619,-6.984712],[-79.634937,-6.983683],[-79.637297,-6.982636],[-79.640142,-6.981337],[-79.641299,-6.98081],[-79.641958,-6.980511],[-79.642253,-6.980374]]]},"properties":{"name":"IX","viviendas":227}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.635649,-6.974092],[-79.636017,-6.974449],[-79.637372,-6.975773],[-79.637915,-6.976134],[-79.638078,-6.976312],[-79.637971,-6.976397],[-79.638241,-6.976716],[-79.637984,-6.97687],[-79.637928,-6.976951],[-79.63827,-6.977656],[-79.637825,-6.978028],[-79.638311,-6.978871],[-79.638528,-6.978828],[-79.638688,-6.97865],[-79.638894,-6.978369],[-79.639564,-6.978619],[-79.640041,-6.978905],[-79.640989,-6.979543],[-79.642113,-6.980387],[-79.641397,-6.980726],[-79.640661,-6.981053],[-79.640179,-6.981272],[-79.639706,-6.981491],[-79.639229,-6.981704],[-79.638273,-6.982139],[-79.636345,-6.982998],[-79.632511,-6.984709],[-79.631977,-6.984924],[-79.63157,-6.98509],[-79.63126,-6.985017],[-79.631174,-6.984925],[-79.631128,-6.984774],[-79.631062,-6.984458],[-79.630903,-6.984189],[-79.63085,-6.983212],[-79.630949,-6.983107],[-79.630949,-6.982194],[-79.630895,-6.981193],[-79.631131,-6.980836],[-79.631315,-6.980425],[-79.631304,-6.980309],[-79.631335,-6.980122],[-79.631442,-6.979408],[-79.631461,-6.978607],[-79.631473,-6.978023],[-79.631367,-6.977775],[-79.631388,-6.977601],[-79.631249,-6.977216],[-79.63112,-6.976712],[-79.630963,-6.976363],[-79.630926,-6.976006],[-79.630889,-6.975199],[-79.630852,-6.974393],[-79.630809,-6.973807],[-79.630511,-6.973604],[-79.630221,-6.973156],[-79.629979,-6.972847],[-79.629902,-6.972416],[-79.629765,-6.971679],[-79.629578,-6.971095],[-79.629322,-6.970731],[-79.62881,-6.969917],[-79.628469,-6.969384],[-79.628234,-6.969121],[-79.627944,-6.968859],[-79.627646,-6.968495],[-79.6271,-6.967683],[-79.628149,-6.967319],[-79.628334,-6.967627],[-79.628521,-6.967949],[-79.628726,-6.968381],[-79.629007,-6.969058],[-79.629115,-6.969454],[-79.629325,-6.969882],[-79.62947,-6.97024],[-79.629655,-6.970548],[-79.629846,-6.970786],[-79.630053,-6.9711],[-79.630146,-6.971529],[-79.630244,-6.971977],[-79.63056,-6.972415],[-79.63082,-6.972783],[-79.630971,-6.973045],[-79.631157,-6.973317],[-79.631285,-6.973103],[-79.631521,-6.972945],[-79.631962,-6.97294],[-79.632203,-6.973108],[-79.632449,-6.973495],[-79.632739,-6.973898],[-79.633101,-6.974281],[-79.633296,-6.974812],[-79.634213,-6.974596],[-79.634393,-6.974845],[-79.635117,-6.974401],[-79.635551,-6.974006],[-79.635649,-6.974092]]]},"properties":{"name":"VIII","viviendas":253}}],"C.S. MOCUPE TRADICIONAL":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.624517,-6.9901],[-79.624216,-6.990172],[-79.623908,-6.990267],[-79.623302,-6.990438],[-79.621755,-6.990886],[-79.6215,-6.990072],[-79.621249,-6.989281],[-79.621154,-6.988962],[-79.621107,-6.988774],[-79.621061,-6.988613],[-79.621118,-6.988597],[-79.621274,-6.989201],[-79.621605,-6.989093],[-79.621492,-6.988787],[-79.621602,-6.988744],[-79.621575,-6.988488],[-79.62183,-6.98838],[-79.621224,-6.987453],[-79.62167,-6.98712],[-79.622276,-6.988155],[-79.622479,-6.988122],[-79.622756,-6.988554],[-79.622853,-6.988522],[-79.623511,-6.987927],[-79.623853,-6.987851],[-79.623871,-6.9879],[-79.624024,-6.988416],[-79.624081,-6.98856],[-79.624262,-6.988842],[-79.624407,-6.989107],[-79.624436,-6.989209],[-79.624439,-6.989649],[-79.624438,-6.98985],[-79.624486,-6.99],[-79.624517,-6.9901]]]},"properties":{"name":"I","viviendas":458}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.619911,-6.990549],[-79.619259,-6.990759],[-79.618524,-6.990991],[-79.618437,-6.991059],[-79.618335,-6.99123],[-79.618266,-6.991362],[-79.618049,-6.991492],[-79.617986,-6.991404],[-79.618161,-6.991282],[-79.617939,-6.990829],[-79.617836,-6.990659],[-79.617642,-6.990381],[-79.617179,-6.990603],[-79.616682,-6.989562],[-79.617399,-6.988732],[-79.61851,-6.988016],[-79.618386,-6.987745],[-79.61879,-6.987519],[-79.618991,-6.988192],[-79.6194,-6.989209],[-79.61953,-6.989451],[-79.619674,-6.989803],[-79.619775,-6.990115],[-79.619911,-6.990549]]]},"properties":{"name":"III","viviendas":329}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.621737,-6.99089],[-79.621315,-6.991],[-79.620962,-6.991095],[-79.620629,-6.991196],[-79.620488,-6.99127],[-79.620243,-6.991463],[-79.620169,-6.991555],[-79.620106,-6.991631],[-79.620021,-6.991762],[-79.619928,-6.991942],[-79.619824,-6.992162],[-79.619757,-6.992313],[-79.619446,-6.993012],[-79.619321,-6.99281],[-79.619148,-6.992646],[-79.618996,-6.992503],[-79.618873,-6.99233],[-79.618777,-6.992179],[-79.618699,-6.992032],[-79.618523,-6.991688],[-79.618328,-6.991289],[-79.618445,-6.991078],[-79.61848,-6.99104],[-79.618527,-6.991005],[-79.61993,-6.990561],[-79.619695,-6.989806],[-79.619536,-6.989428],[-79.619407,-6.989188],[-79.618998,-6.988175],[-79.618809,-6.987527],[-79.618896,-6.987483],[-79.619435,-6.988889],[-79.620141,-6.988699],[-79.621011,-6.98847],[-79.621208,-6.989184],[-79.621251,-6.989324],[-79.621344,-6.989632],[-79.621479,-6.990066],[-79.621612,-6.990479],[-79.621737,-6.99089]]]},"properties":{"name":"II","viviendas":272}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.62433,-6.990186],[-79.624411,-6.990469],[-79.624479,-6.990711],[-79.624559,-6.990944],[-79.624589,-6.99113],[-79.624624,-6.991339],[-79.624646,-6.991581],[-79.624665,-6.991768],[-79.624696,-6.991893],[-79.624726,-6.991971],[-79.624971,-6.992633],[-79.622529,-6.993377],[-79.622256,-6.992495],[-79.621989,-6.991639],[-79.621763,-6.990919],[-79.623398,-6.990445],[-79.62433,-6.990186]]]},"properties":{"name":"IV","viviendas":391}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.621745,-6.990917],[-79.621799,-6.991086],[-79.62198,-6.991666],[-79.622245,-6.992507],[-79.622515,-6.993374],[-79.621763,-6.993605],[-79.620097,-6.994095],[-79.619705,-6.993641],[-79.619583,-6.993819],[-79.619233,-6.99349],[-79.619814,-6.992271],[-79.619969,-6.991934],[-79.620115,-6.991667],[-79.620253,-6.991502],[-79.620507,-6.991298],[-79.620623,-6.991235],[-79.620994,-6.991117],[-79.621745,-6.990917]]]},"properties":{"name":"V","viviendas":381}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.624886,-6.992676],[-79.625081,-6.993256],[-79.625159,-6.993471],[-79.625723,-6.995083],[-79.624323,-6.995629],[-79.623358,-6.996034],[-79.623154,-6.995575],[-79.622787,-6.995709],[-79.62272,-6.995876],[-79.622574,-6.99597],[-79.622666,-6.996254],[-79.622795,-6.996196],[-79.622916,-6.996624],[-79.622248,-6.996842],[-79.62172,-6.996957],[-79.621477,-6.996005],[-79.621423,-6.995596],[-79.621071,-6.995797],[-79.620808,-6.995293],[-79.620374,-6.99545],[-79.620064,-6.995152],[-79.620537,-6.99456],[-79.620126,-6.994114],[-79.620949,-6.993862],[-79.621771,-6.993615],[-79.622534,-6.993386],[-79.623264,-6.993166],[-79.624143,-6.992896],[-79.624886,-6.992676]]]},"properties":{"name":"VI","viviendas":321}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.630606,-6.986457],[-79.630748,-6.986739],[-79.630956,-6.9868],[-79.631095,-6.98704],[-79.631298,-6.987542],[-79.631681,-6.987841],[-79.631923,-6.988103],[-79.632084,-6.988322],[-79.632313,-6.98853],[-79.632594,-6.988175],[-79.632875,-6.988187],[-79.63356,-6.988638],[-79.633544,-6.988856],[-79.633468,-6.989014],[-79.633534,-6.98918],[-79.633874,-6.989286],[-79.634772,-6.990085],[-79.634107,-6.990333],[-79.633422,-6.990505],[-79.633226,-6.99057],[-79.632982,-6.99027],[-79.632778,-6.989963],[-79.632525,-6.990044],[-79.632338,-6.98968],[-79.632036,-6.989599],[-79.631908,-6.989243],[-79.631471,-6.989454],[-79.631337,-6.989362],[-79.631235,-6.989213],[-79.630811,-6.989464],[-79.629961,-6.990218],[-79.62935,-6.989109],[-79.629256,-6.988929],[-79.629129,-6.988725],[-79.629076,-6.988624],[-79.628904,-6.988349],[-79.628534,-6.987745],[-79.629366,-6.987221],[-79.629967,-6.986855],[-79.630451,-6.986554],[-79.630606,-6.986457]]]},"properties":{"name":"X","viviendas":261}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.606624,-7.012678],[-79.60681,-7.012914],[-79.606985,-7.013123],[-79.607447,-7.01351],[-79.608241,-7.014147],[-79.607406,-7.015118],[-79.606495,-7.016128],[-79.605743,-7.017064],[-79.60495,-7.017995],[-79.604078,-7.018977],[-79.603463,-7.019625],[-79.603144,-7.019956],[-79.602947,-7.020175],[-79.602749,-7.019983],[-79.601934,-7.01915],[-79.60223,-7.0189],[-79.601574,-7.018152],[-79.602364,-7.017335],[-79.603139,-7.016437],[-79.603554,-7.015952],[-79.603627,-7.015419],[-79.604605,-7.014505],[-79.604826,-7.0147],[-79.605392,-7.013992],[-79.605753,-7.013583],[-79.606213,-7.013017],[-79.606433,-7.012787],[-79.606624,-7.012678]]]},"properties":{"name":"XI","viviendas":436}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.629337,-6.989122],[-79.629287,-6.98919],[-79.629216,-6.989078],[-79.628825,-6.989205],[-79.628754,-6.989076],[-79.628242,-6.989257],[-79.627788,-6.989584],[-79.627686,-6.989666],[-79.627597,-6.989752],[-79.627498,-6.989791],[-79.627402,-6.98983],[-79.627579,-6.990193],[-79.627096,-6.990512],[-79.626989,-6.990669],[-79.62681,-6.990631],[-79.626639,-6.990674],[-79.626479,-6.990454],[-79.626433,-6.990402],[-79.626325,-6.99018],[-79.62641,-6.990101],[-79.626408,-6.989936],[-79.625985,-6.989494],[-79.625982,-6.989292],[-79.626849,-6.988254],[-79.627025,-6.988026],[-79.627409,-6.987548],[-79.627667,-6.987245],[-79.627813,-6.987059],[-79.627962,-6.986883],[-79.628018,-6.986869],[-79.629062,-6.986183],[-79.629429,-6.985904],[-79.629783,-6.985766],[-79.629813,-6.985806],[-79.63011,-6.985704],[-79.630474,-6.985576],[-79.630507,-6.985731],[-79.630439,-6.985971],[-79.630533,-6.986156],[-79.63055,-6.986195],[-79.630539,-6.986343],[-79.630592,-6.986443],[-79.628507,-6.987736],[-79.628937,-6.98843],[-79.629337,-6.989122]]]},"properties":{"name":"IX","viviendas":317}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.627638,-6.987218],[-79.627389,-6.986827],[-79.626959,-6.986104],[-79.62693,-6.986124],[-79.626848,-6.985994],[-79.626406,-6.985279],[-79.626319,-6.985115],[-79.626228,-6.984954],[-79.626134,-6.984766],[-79.62597,-6.984569],[-79.625906,-6.984314],[-79.625858,-6.983788],[-79.625786,-6.982991],[-79.625715,-6.981961],[-79.625822,-6.982059],[-79.6259,-6.982199],[-79.626048,-6.982478],[-79.626341,-6.983011],[-79.62662,-6.983424],[-79.62674,-6.983591],[-79.626825,-6.983721],[-79.626968,-6.98385],[-79.627175,-6.984023],[-79.627352,-6.98417],[-79.627494,-6.984314],[-79.627699,-6.984447],[-79.627824,-6.984531],[-79.628157,-6.984402],[-79.628258,-6.98437],[-79.628368,-6.984356],[-79.62857,-6.984384],[-79.62892,-6.984421],[-79.629044,-6.984432],[-79.629147,-6.984414],[-79.629406,-6.984344],[-79.629481,-6.984544],[-79.629561,-6.984791],[-79.630038,-6.984594],[-79.630433,-6.985352],[-79.630458,-6.985503],[-79.62978,-6.985734],[-79.62948,-6.985844],[-79.629213,-6.985972],[-79.62882,-6.986173],[-79.628226,-6.986602],[-79.62796,-6.986853],[-79.627638,-6.987218]]]},"properties":{"name":"VIII","viviendas":300}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.627626,-6.987233],[-79.627393,-6.987536],[-79.627087,-6.987913],[-79.626617,-6.988494],[-79.626119,-6.989103],[-79.626005,-6.989223],[-79.625996,-6.989138],[-79.625414,-6.988654],[-79.625126,-6.988249],[-79.625036,-6.987899],[-79.624702,-6.987933],[-79.624704,-6.987757],[-79.624874,-6.987688],[-79.624788,-6.987474],[-79.624806,-6.987216],[-79.624865,-6.986941],[-79.62495,-6.986504],[-79.625059,-6.98599],[-79.625165,-6.985465],[-79.625186,-6.985408],[-79.625259,-6.985342],[-79.625412,-6.985184],[-79.625586,-6.985028],[-79.625774,-6.98485],[-79.62606,-6.984669],[-79.626288,-6.985097],[-79.62644,-6.985361],[-79.626602,-6.985636],[-79.626926,-6.986151],[-79.626954,-6.986136],[-79.627284,-6.986688],[-79.627626,-6.987233]]]},"properties":{"name":"VII","viviendas":386}}],"P.S. TUPAC AMARU - LAGUNAS":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.692734,-7.034755],[-79.69315,-7.035971],[-79.693515,-7.036209],[-79.693544,-7.036513],[-79.693218,-7.03678],[-79.692805,-7.036837],[-79.692796,-7.037218],[-79.692882,-7.037608],[-79.692671,-7.038008],[-79.692728,-7.038722],[-79.692517,-7.038817],[-79.692518,-7.039084],[-79.692086,-7.039284],[-79.691971,-7.039503],[-79.691597,-7.039827],[-79.691501,-7.039979],[-79.691309,-7.039931],[-79.691252,-7.039731],[-79.690887,-7.039789],[-79.690705,-7.039617],[-79.690206,-7.039655],[-79.690254,-7.039969],[-79.690139,-7.040122],[-79.690206,-7.040626],[-79.689957,-7.040798],[-79.689439,-7.040712],[-79.689221,-7.040396],[-79.689517,-7.040095],[-79.689832,-7.039856],[-79.689957,-7.039741],[-79.689573,-7.039722],[-79.688815,-7.040055],[-79.688547,-7.040093],[-79.688336,-7.040255],[-79.688105,-7.040303],[-79.687683,-7.039512],[-79.687837,-7.039303],[-79.687837,-7.039008],[-79.688086,-7.038589],[-79.688177,-7.03783],[-79.68859,-7.037801],[-79.688654,-7.037458],[-79.688302,-7.036161],[-79.688836,-7.036092],[-79.689074,-7.036868],[-79.689275,-7.036831],[-79.688742,-7.034843],[-79.690355,-7.03445],[-79.691276,-7.034374],[-79.691391,-7.03466],[-79.691966,-7.034926],[-79.692734,-7.034755]]]},"properties":{"name":"I","viviendas":582}}],"P.S. PUEBLO LIBRE":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.666373,-6.996648],[-79.6651,-6.995822],[-79.664262,-6.995241],[-79.663551,-6.994709],[-79.663263,-6.994477],[-79.66248,-6.994008],[-79.661619,-6.993478],[-79.661034,-6.993107],[-79.660265,-6.99252],[-79.659686,-6.99212],[-79.659145,-6.991721],[-79.658705,-6.991409],[-79.658315,-6.991172],[-79.658051,-6.990735],[-79.657825,-6.990285],[-79.65951,-6.989911],[-79.660076,-6.990972],[-79.66029,-6.991421],[-79.661745,-6.990925],[-79.662495,-6.990681],[-79.665508,-6.989802],[-79.665845,-6.990981],[-79.665397,-6.991946],[-79.666441,-6.992857],[-79.666552,-6.993113],[-79.666686,-6.993386],[-79.666707,-6.993645],[-79.666637,-6.993862],[-79.66658,-6.994505],[-79.666468,-6.994897],[-79.666559,-6.995387],[-79.666446,-6.996121],[-79.666373,-6.996648]]]},"properties":{"name":"I","viviendas":179}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.666181,-6.99656],[-79.665657,-6.996337],[-79.664942,-6.996086],[-79.664578,-6.996783],[-79.664101,-6.996886],[-79.663718,-6.996779],[-79.663601,-6.996578],[-79.662949,-6.996587],[-79.662269,-6.995961],[-79.662314,-6.994715],[-79.661919,-6.994024],[-79.661633,-6.993543],[-79.661767,-6.993595],[-79.662178,-6.993846],[-79.662848,-6.994246],[-79.663234,-6.994477],[-79.66335,-6.994582],[-79.663759,-6.994885],[-79.664241,-6.995238],[-79.664333,-6.995304],[-79.66462,-6.9955],[-79.665187,-6.995892],[-79.665541,-6.996126],[-79.666181,-6.99656]]]},"properties":{"name":"II","viviendas":155}}],"P.S. LAGUNAS":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.74263,-7.054318],[-79.743024,-7.054492],[-79.741679,-7.056205],[-79.740044,-7.057545],[-79.740118,-7.058075],[-79.740138,-7.05872],[-79.739788,-7.05933],[-79.739263,-7.059979],[-79.738688,-7.060556],[-79.736845,-7.059698],[-79.737449,-7.058305],[-79.737689,-7.057488],[-79.735991,-7.057794],[-79.735167,-7.058016],[-79.734035,-7.057846],[-79.734619,-7.056803],[-79.736325,-7.05454],[-79.737021,-7.053943],[-79.737141,-7.053279],[-79.737776,-7.052581],[-79.739645,-7.053194],[-79.740863,-7.053722],[-79.74263,-7.054318]]]},"properties":{"name":"I","viviendas":309}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.716686,-7.052892],[-79.715789,-7.053565],[-79.715377,-7.05389],[-79.715256,-7.054816],[-79.715207,-7.055033],[-79.714795,-7.05496],[-79.714274,-7.054648],[-79.714153,-7.054491],[-79.713935,-7.05466],[-79.713729,-7.054768],[-79.713462,-7.054768],[-79.713232,-7.054792],[-79.712771,-7.054828],[-79.71391,-7.054359],[-79.713814,-7.053325],[-79.713753,-7.052723],[-79.713123,-7.052808],[-79.712541,-7.052784],[-79.711863,-7.052675],[-79.711487,-7.052663],[-79.711208,-7.053036],[-79.710602,-7.053132],[-79.710142,-7.052687],[-79.710166,-7.05193],[-79.710214,-7.051052],[-79.711244,-7.051184],[-79.711802,-7.051232],[-79.711911,-7.051894],[-79.712505,-7.051966],[-79.712856,-7.052363],[-79.713426,-7.052327],[-79.713923,-7.05205],[-79.714262,-7.051653],[-79.71465,-7.051641],[-79.716819,-7.051677],[-79.716686,-7.052892]]]},"properties":{"name":"II","viviendas":110}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.703375,-7.055408],[-79.704118,-7.057585],[-79.703039,-7.058219],[-79.701529,-7.059578],[-79.700113,-7.060073],[-79.699962,-7.060108],[-79.699382,-7.060177],[-79.698395,-7.057643],[-79.698221,-7.057055],[-79.698813,-7.056882],[-79.6998,-7.056548],[-79.699719,-7.056375],[-79.699626,-7.056122],[-79.699463,-7.055454],[-79.699335,-7.055004],[-79.699591,-7.05497],[-79.699765,-7.055465],[-79.699904,-7.055995],[-79.700044,-7.056329],[-79.70038,-7.056295],[-79.700752,-7.056203],[-79.701228,-7.05603],[-79.701994,-7.055845],[-79.702725,-7.055627],[-79.703375,-7.055408]]]},"properties":{"name":"III","viviendas":68}}],"C.S. SALAS":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.614223,-6.276741],[-79.613884,-6.277747],[-79.613465,-6.278406],[-79.612733,-6.279146],[-79.611772,-6.279752],[-79.610296,-6.279954],[-79.608657,-6.279779],[-79.605611,-6.279039],[-79.604951,-6.278872],[-79.604572,-6.278832],[-79.60422,-6.278764],[-79.603814,-6.278643],[-79.603313,-6.278522],[-79.602947,-6.278495],[-79.602785,-6.278522],[-79.602166,-6.278589],[-79.601367,-6.278428],[-79.600474,-6.278213],[-79.599201,-6.277674],[-79.597968,-6.276651],[-79.596723,-6.275332],[-79.596823,-6.275292],[-79.596939,-6.275189],[-79.597054,-6.275061],[-79.597136,-6.274972],[-79.59732,-6.274825],[-79.597493,-6.274697],[-79.597666,-6.274646],[-79.597775,-6.274622],[-79.599022,-6.274509],[-79.599765,-6.274558],[-79.600677,-6.274553],[-79.601839,-6.274503],[-79.602361,-6.274512],[-79.603404,-6.27459],[-79.6044,-6.274683],[-79.605337,-6.274784],[-79.608041,-6.274974],[-79.609268,-6.275086],[-79.609728,-6.275151],[-79.60999,-6.27522],[-79.610264,-6.275305],[-79.61209,-6.275968],[-79.614223,-6.276741]]]},"properties":{"name":"I","viviendas":644}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.61423,-6.276729],[-79.613445,-6.27645],[-79.612596,-6.276139],[-79.611532,-6.275753],[-79.610909,-6.275528],[-79.610302,-6.275308],[-79.610005,-6.275213],[-79.609725,-6.275137],[-79.609145,-6.275056],[-79.608042,-6.274961],[-79.60743,-6.27492],[-79.606944,-6.274885],[-79.60648,-6.274855],[-79.605338,-6.274771],[-79.6044,-6.27467],[-79.603395,-6.274576],[-79.602355,-6.274493],[-79.601824,-6.274489],[-79.600942,-6.27453],[-79.599749,-6.274545],[-79.59901,-6.274494],[-79.59777,-6.274604],[-79.597482,-6.274686],[-79.597126,-6.27497],[-79.596942,-6.275167],[-79.596816,-6.275282],[-79.596715,-6.275325],[-79.596685,-6.27462],[-79.596746,-6.273678],[-79.600017,-6.273792],[-79.600839,-6.273825],[-79.601627,-6.27387],[-79.60187,-6.273913],[-79.602002,-6.273942],[-79.602358,-6.273987],[-79.602922,-6.274058],[-79.603168,-6.27409],[-79.603466,-6.274145],[-79.604416,-6.274288],[-79.605389,-6.274418],[-79.60596,-6.274506],[-79.606046,-6.274521],[-79.606279,-6.274527],[-79.606496,-6.274537],[-79.606571,-6.274545],[-79.606975,-6.274569],[-79.607448,-6.274602],[-79.607729,-6.27461],[-79.607996,-6.274623],[-79.608206,-6.274644],[-79.608557,-6.274658],[-79.608952,-6.274663],[-79.612655,-6.274754],[-79.61348,-6.274927],[-79.614279,-6.275551],[-79.614365,-6.276525],[-79.61423,-6.276729]]]},"properties":{"name":"II","viviendas":347}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.609445,-6.274661],[-79.608858,-6.274651],[-79.608542,-6.274648],[-79.608211,-6.274633],[-79.608131,-6.274625],[-79.608029,-6.274614],[-79.607474,-6.274591],[-79.606522,-6.274528],[-79.606037,-6.274508],[-79.605402,-6.274408],[-79.605575,-6.272897],[-79.605674,-6.271892],[-79.605785,-6.270829],[-79.605753,-6.270619],[-79.605753,-6.27047],[-79.605798,-6.270286],[-79.605837,-6.270114],[-79.605859,-6.270027],[-79.60588,-6.269997],[-79.609488,-6.273542],[-79.609445,-6.274661]]]},"properties":{"name":"III","viviendas":319}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.605389,-6.274405],[-79.604431,-6.274279],[-79.60349,-6.274138],[-79.603437,-6.274129],[-79.603149,-6.274079],[-79.602772,-6.274031],[-79.60235,-6.273977],[-79.601997,-6.273934],[-79.601627,-6.273863],[-79.601402,-6.273852],[-79.601371,-6.273848],[-79.60147,-6.273475],[-79.601736,-6.273447],[-79.601899,-6.273447],[-79.602396,-6.27348],[-79.602424,-6.272953],[-79.602971,-6.272942],[-79.603515,-6.272923],[-79.60557,-6.272869],[-79.605479,-6.27364],[-79.605389,-6.274405]]]},"properties":{"name":"IV","viviendas":209}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.605866,-6.269974],[-79.605746,-6.270472],[-79.605747,-6.270603],[-79.605761,-6.270719],[-79.605777,-6.270819],[-79.605718,-6.271413],[-79.605571,-6.272859],[-79.603499,-6.272918],[-79.60312,-6.272932],[-79.602736,-6.272939],[-79.602418,-6.272946],[-79.602387,-6.27347],[-79.601908,-6.273441],[-79.60171,-6.273441],[-79.601466,-6.27347],[-79.601359,-6.273846],[-79.600548,-6.273805],[-79.600042,-6.273785],[-79.598443,-6.27373],[-79.599389,-6.271576],[-79.599019,-6.271392],[-79.598272,-6.271191],[-79.598483,-6.270518],[-79.598703,-6.269863],[-79.59916,-6.269741],[-79.599696,-6.269943],[-79.600768,-6.270371],[-79.600821,-6.269733],[-79.600865,-6.269514],[-79.600953,-6.269357],[-79.601506,-6.269532],[-79.602113,-6.269698],[-79.602579,-6.269908],[-79.603124,-6.270135],[-79.603282,-6.269305],[-79.604002,-6.269471],[-79.605866,-6.269974]]]},"properties":{"name":"V","viviendas":819}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.613523,-6.274848],[-79.612652,-6.274675],[-79.609495,-6.274623],[-79.609498,-6.273524],[-79.605865,-6.269958],[-79.606014,-6.269352],[-79.606133,-6.268755],[-79.606543,-6.268669],[-79.606769,-6.268574],[-79.60702,-6.268396],[-79.607248,-6.268252],[-79.607506,-6.268122],[-79.609637,-6.268727],[-79.610139,-6.268897],[-79.61069,-6.269047],[-79.611469,-6.269288],[-79.611858,-6.269514],[-79.612874,-6.269968],[-79.615183,-6.271157],[-79.613523,-6.274848]]]},"properties":{"name":"VI","viviendas":293}}]};
const SECT_UMBRAL = 17;               // zoom desde el que se ve el calor; por debajo, burbujas por sector
let _sectOutline=null; let _sectBubbles=L.layerGroup();
function _pipRing(lon,lat,ring){var inside=false,n=ring.length,j=n-1;for(var i=0;i<n;i++){var xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];if(((yi>lat)!=(yj>lat))&&(lon<(xj-xi)*(lat-yi)/(yj-yi)+xi))inside=!inside;j=i;}return inside;}
function _centro(ring){var p=(ring[0][0]===ring[ring.length-1][0]&&ring[0][1]===ring[ring.length-1][1])?ring.slice(0,-1):ring;var la=0,lo=0;p.forEach(function(c){lo+=c[0];la+=c[1];});return [la/p.length, lo/p.length];}
function updateSectorMapa(){
  var e=state.eess, feats=SECTORES_POR_CENTRO[e];
  if(_sectOutline){map.removeLayer(_sectOutline);_sectOutline=null;}
  _sectBubbles.clearLayers(); if(map.hasLayer(_sectBubbles))map.removeLayer(_sectBubbles);
  if(!feats){return;}   // centro sin límites dibujados -> mapa normal
  _sectOutline=L.geoJSON({type:'FeatureCollection',features:feats},{style:{color:'#f1c40f',weight:2,fillColor:'#f1c40f',fillOpacity:0.05}}).addTo(map);
  var z=map.getZoom();
  if(z < SECT_UMBRAL){
    if(heat&&map.hasLayer(heat))map.removeLayer(heat);
    if(map.hasLayer(dotLayer))map.removeLayer(dotLayer);
    var pts=fp();
    // Las burbujas cuentan con PUNTOS (agrupado), la misma fuente que la tabla de sectores,
    // para que el número de la burbuja y el de la tabla siempre coincidan.
    feats.forEach(function(f){
      var ring=f.geometry.coordinates[0], val=0;
      pts.forEach(function(p){if(_pipRing(p[1],p[0],ring)){val+=p[3];}});
      var c=_centro(ring), size=54;
      var icon=L.divIcon({className:'',iconSize:[size,size],iconAnchor:[size/2,size/2],
        html:'<div class="sect-burbuja" style="width:'+size+'px;height:'+size+'px"><span class="num">'+(f.properties.name||'')+'</span><span class="cnt">'+val.toLocaleString('es-PE')+'</span></div>'});
      L.marker([c[0],c[1]],{icon}).addTo(_sectBubbles);
    });
    _sectBubbles.addTo(map);
  }else{
    if(heat&&!map.hasLayer(heat))heat.addTo(map);
  }
}
/* ===== Leyenda de viviendas por sector (solo los centros de CENTROS_CON_CONTEO,
   que tienen conteo de viviendas actualizado por sector) ===== */
const CENTROS_CON_CONTEO = ["C.S. CERROPON","C.S. JOSE OLAYA","C.S. LA VICTORIA S.II","P.S. NUEVO MOCUPE","C.S. MOCUPE TRADICIONAL","P.S. TUPAC AMARU - LAGUNAS","P.S. PUEBLO LIBRE","P.S. LAGUNAS","C.S. SALAS"];
function romanKey(s){const M={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};if(!/^[IVXLCDM]+$/.test(s))return null;let v=0;for(let i=0;i<s.length;i++){const c=M[s[i]],n=M[s[i+1]]||0;v+=c<n?-c:c;}return v;}
function updateSectorLegend(){
  const box=$('sectorLegend');
  if(!box)return;
  const e=state.eess, feats=SECTORES_POR_CENTRO[e];
  const show=CENTROS_CON_CONTEO.includes(e)&&feats;
  const wasShown=box.classList.contains('show');
  if(!show){
    box.classList.remove('show');box.innerHTML='';
    if(wasShown)setTimeout(()=>map.invalidateSize(),60);
    return;
  }
  let total=0;
  let html='<h4>Viviendas por sector</h4>';
  feats.slice().sort((a,b)=>(romanKey(a.properties.name)||0)-(romanKey(b.properties.name)||0)).forEach(f=>{
    const v=f.properties.viviendas||0;total+=v;
    html+='<div class="srow"><span>Sector '+f.properties.name+'</span><b class="num">'+fmt(v)+'</b></div>';
  });
  html+='<div class="stot"><span>Total</span><span class="num">'+fmt(total)+'</span></div>';
  box.innerHTML=html;
  box.classList.add('show');
  if(!wasShown)setTimeout(()=>map.invalidateSize(),60);
}

const ZOOM_MAX_MAPA=19, ZOOM_MAX_SAT=19; // fondo "Mapa" = OpenStreetMap (igual que el panel), con teselas reales hasta z19.
// El fondo "Satélite" (Esri World Imagery) también llega a z19.
function initMap(){
  map=L.map('map',{scrollWheelZoom:false,maxZoom:ZOOM_MAX_MAPA}).setView([-6.77,-79.84],11);
  tileMapa=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',maxZoom:ZOOM_MAX_MAPA});
  tileSat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'© Esri',maxZoom:ZOOM_MAX_SAT});
  tileMapa.addTo(map);
  map.on('zoomend',()=>{drawHeat();buildDots();updateSectorMapa();});
  addFullscreenControl();
  renderMapa();
}
function drawHeat(){
  if(heat){map.removeLayer(heat);heat=null;}
  if(!_hd.length)return;
  const z=(map.getZoom?map.getZoom():11);
  const r=Math.max(9,Math.min(55,_baseR*Math.pow(1.35,z-9)));
  heat=L.heatLayer(_hd,{radius:r,blur:r*0.7,max:_mx,minOpacity:.45,maxZoom:18,gradient:{0.2:'#2E9E8F',0.5:'#E8B04B',0.8:'#D1495B',1:'#A02B3C'}}).addTo(map);
}
/* ===== Puntos individuales (una vivienda positiva = un punto, sin agrupar por coordenada) =====
   Carga perezosa de js/puntos_individuales.js (mismo patrón que el panel), solo cuando hay un
   centro de salud elegido. Con todos los centros (__all__) se sigue usando el punto agrupado
   de PUNTOS. El archivo del Alerta trae SOLO viviendas positivas: [lat,lon,1,fecha,actividad]. */
let PIST={loaded:false,loading:false}, _dotUsingInd=false;
function _piLoadScript(cb){
  if(PIST.loaded){cb();return;}
  if(PIST.loading){document.addEventListener('puntosind:loaded',cb,{once:true});return;}
  PIST.loading=true;
  const s=document.createElement('script');s.src='js/puntos_individuales.js';
  s.onload=()=>{PIST.loaded=true;PIST.loading=false;document.dispatchEvent(new Event('puntosind:loaded'));cb();};
  s.onerror=()=>{PIST.loading=false;};
  document.head.appendChild(s);
}
function _piFor(eess){ // null si aún no cargó el archivo
  if(typeof PUNTOS_IND==='undefined')return null;
  const rows=PUNTOS_IND[eess]; if(!rows)return [];
  if(state.red!=='__all__'&&META.e2r[eess]!==state.red)return [];
  return rows.filter(r=>r[2]>0&&inRange(r[3]));
}
function _refreshInd(){ // al terminar de cargar: redibuja puntos y burbujas sin mover el mapa
  if(!map||state.eess==='__all__')return;
  const pi=_piFor(state.eess);
  if(pi!==null){_dotData=pi;_dotUsingInd=true;}
  buildDots(); updateSectorMapa();
}
function buildDots(){
  dotLayer.clearLayers();
  if(map.getZoom()<ZOOM_DOTS){ if(map.hasLayer(dotLayer))map.removeLayer(dotLayer); return; }
  if(_dotUsingInd){
    _dotData.forEach(p=>{
      const mk=L.circleMarker([p[0],p[1]],{radius:4,color:'#fff',weight:1,fillColor:'#E53935',fillOpacity:.9});
      mk.bindPopup('<b style=\'color:#C0392B\'>Vivienda positiva</b><br>'+(p[4]||'')+'<br><span style=\'color:#6b7d79\'>'+(p[3]||'')+'</span>');
      dotLayer.addLayer(mk);
    });
    if(!map.hasLayer(dotLayer))map.addLayer(dotLayer);
    return;
  }
  _dotData.forEach(p=>{const n=p[3];
    const mk=L.circleMarker([p[0],p[1]],{radius:4,color:'#fff',weight:1,fillColor:'#E53935',fillOpacity:.9});
    mk.bindPopup('<b style=\'color:#C0392B\'>'+n+' vivienda'+(n>1?'s':'')+' positiva'+(n>1?'s':'')+'</b><br>'+(p[4]||'')+'<br><span style=\'color:#6b7d79\'>'+(p[5]||'')+'</span>');
    dotLayer.addLayer(mk);
  });
  if(!map.hasLayer(dotLayer))map.addLayer(dotLayer);
}
function renderMapa(){
  const pts=fp().filter(p=>p[3]>0);
  _hd=pts.map(p=>[p[0],p[1],p[3]]);
  _mx=pts.reduce((m,p)=>Math.max(m,p[3]),1);
  _baseR = state.eess!=='__all__'?22:(state.red!=='__all__'?16:13);
  _dotData=pts; _dotUsingInd=false;
  if(state.eess!=='__all__'){
    const pi=_piFor(state.eess);
    if(pi===null) _piLoadScript(_refreshInd);        // mientras carga, se usa el punto agrupado
    else { _dotData=pi; _dotUsingInd=true; }
  }
  drawHeat();
  buildDots();
  if(_hd.length){const b=L.latLngBounds(_hd.map(p=>[p[0],p[1]]));map.fitBounds(b.pad(0.25));}
  updateSectorMapa();
  updateSectorLegend();
}
function addFullscreenControl(){
  const Ctl=L.Control.extend({options:{position:"topright"},
    onAdd:function(){
      const el=L.DomUtil.create("a","leaflet-fs-btn");
      el.href="#"; el.title="Pantalla completa"; el.innerHTML="\u2922";
      el.style.fontSize="18px"; el.style.color="#12302C"; el.style.fontWeight="700";
      L.DomEvent.on(el,"click",L.DomEvent.stop);
      L.DomEvent.on(el,"click",toggleFull);
      return el;
    }});
  map.addControl(new Ctl());
}
function toggleFull(){
  const el=document.getElementById("map");
  const on=el.classList.toggle("map-fullscreen");
  document.querySelectorAll(".leaflet-fs-btn").forEach(b=>{ b.innerHTML=on?"\u2921":"\u2922"; });
  setTimeout(()=>{ map.invalidateSize(); drawHeat(); buildDots();
    if(_hd&&_hd.length){ map.fitBounds(L.latLngBounds(_hd.map(p=>[p[0],p[1]])).pad(0.15)); } },120);
}
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ const el=document.getElementById("map"); if(el&&el.classList.contains("map-fullscreen")) toggleFull(); }});

function setFondo(t){
  $('fMapa').classList.toggle('on',t==='mapa'); $('fSat').classList.toggle('on',t==='sat');
  if(t==='mapa'){map.removeLayer(tileSat);tileMapa.addTo(map);map.setMaxZoom(ZOOM_MAX_MAPA);}
  else {map.removeLayer(tileMapa);tileSat.addTo(map);map.setMaxZoom(ZOOM_MAX_SAT);}
  if(heat&&typeof heat.bringToFront==='function')heat.bringToFront();
}

/* ================= 8 · ZONAS POR NIVEL ================= */
function renderZonas(){
  const secs=sectores();
  const alta=secs.filter(s=>s.nivel==='alta'), mid=secs.filter(s=>s.nivel==='mid'), low=secs.filter(s=>s.nivel==='low');
  const box=$('zonas');
  if(!secs.length){ box.innerHTML='<div class="empty">No hay datos de sectores para este filtro. Elige un centro de salud y un rango de fechas con registros.</div>'; return; }
  const CAP_CARDS=12, CAP_ROWS=30;
  let html='';
  // Alta -> tarjetas (tope CAP_CARDS, ya vienen ordenadas por IA desc)
  html+='<div class="zonelabel alta"><span class="zico">⚠️</span>Sectores a priorizar (mayor positividad)</div>';
  if(alta.length){
    const show=alta.slice(0,CAP_CARDS);
    html+='<div class="sectorcards">'+show.map(s=>
      '<div class="sector"><div class="snm">Sector '+s.sector+'</div><div class="sce">'+s.eess+' · '+s.red+'</div>'+
      '<div class="sia num">'+s.ia.toFixed(2)+'% <small>índice aédico</small></div>'+
      '<div class="sfoot"><div class="kp"><b class="num">'+fmt(s.pos)+'</b><span class="kk">viviendas positivas</span></div>'+
      '<div><b class="num">'+fmt(s.insp)+'</b><span class="kk">inspeccionadas</span></div></div></div>').join('')+'</div>';
    if(alta.length>CAP_CARDS) html+='<div class="empty">Mostrando los '+CAP_CARDS+' de mayor índice aédico. Hay '+alta.length+' sectores en alerta alta en total — elige un centro de salud para verlos por separado, o descarga el Excel para la lista completa.</div>';
  }else{ html+='<div class="empty">Ningún sector alcanza 4% de índice aédico (alto riesgo) en el periodo.</div>'; }
  // Mid -> tabla
  html+='<div class="zonelabel mid"><span class="zico">🟡</span>Sectores a vigilar</div>';
  html+=tablaZona(mid,'mid',CAP_ROWS);
  // Low -> tabla
  html+='<div class="zonelabel low"><span class="zico">🟢</span>Sectores controlados</div>';
  html+=tablaZona(low,'low',CAP_ROWS);
  box.innerHTML=html;
}
function tablaZona(arr,cls,cap){
  if(!arr.length) return '<div class="empty">Sin sectores en este nivel.</div>';
  const multi = state.eess==='__all__';
  const show = cap? arr.slice(0,cap) : arr;
  let t='<table class="tbl"><thead><tr><th>Sector</th>'+(multi?'<th>Centro</th>':'')+
    '<th class="r">Positivas</th><th class="r">Inspeccionadas</th><th class="r">Índice aédico</th></tr></thead><tbody>'+
    show.map(s=>'<tr><td>'+s.sector+'</td>'+(multi?'<td>'+s.eess+'</td>':'')+
      '<td class="r num">'+fmt(s.pos)+'</td><td class="r num">'+fmt(s.insp)+'</td>'+
      '<td class="r num iaval '+cls+'">'+s.ia.toFixed(2)+'%</td></tr>').join('')+'</tbody></table>';
  if(cap&&arr.length>cap) t+='<div class="empty">Mostrando '+cap+' de '+arr.length+'. Elige un centro o descarga el Excel para la lista completa.</div>';
  return t;
}

/* ================= 9 · EVOLUCIÓN DEL ÍNDICE AÉDICO ================= */
function renderEvolucion(){
  const pts=fp(); const mm={};
  pts.forEach(p=>{const m=p[5].slice(0,7); if(!mm[m])mm[m]={i:0,p:0}; mm[m].i+=p[2];mm[m].p+=p[3];});
  const labels=META.meses.slice(); const data=labels.map(m=>{const o=mm[m]; return o&&o.i?+(o.p/o.i*100).toFixed(2):0;});
  const nice=labels.map(m=>{const [y,mo]=m.split('-'); return ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][+mo-1];});
  if(iaChart) iaChart.destroy();
  iaChart=new Chart($('iaChart'),{type:'line',data:{labels:nice,datasets:[{label:'Índice aédico',data,borderColor:'#D1495B',backgroundColor:'rgba(209,73,91,.10)',fill:true,tension:.35,pointBackgroundColor:'#D1495B',pointRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},
      scales:{y:{beginAtZero:true,ticks:{callback:v=>v+'%'},title:{display:true,text:'Índice aédico'}}}}});
}

/* ================= 10 · RECIPIENTES ================= */
function renderRecip(){
  const NT=RECIP.tipos.length; const ins=Array(NT).fill(0), pos=Array(NT).fill(0);
  RECIP.data.forEach(r=>{ // r=[eess,red,fecha, I..NT, P..NT]
    if(state.red!=='__all__'&&r[1]!==state.red) return;
    if(state.eess!=='__all__'&&r[0]!==state.eess) return;
    if(!inRange(r[2])) return;
    for(let k=0;k<NT;k++){ins[k]+=r[3+k];pos[k]+=r[3+NT+k];}
  });
  const ambito = state.eess!=='__all__' ? state.eess : (state.red!=='__all__'?'RED '+state.red:'las tres redes');
  $('recipMeta').innerHTML='<b>'+ambito+'</b> · periodo elegido';
  // Orden: de mayor a menor número de recipientes positivos (empate: mayor % de positividad)
  const orden=RECIP.tipos.map((_,k)=>k).sort((a,b)=>(pos[b]-pos[a])||((ins[b]?pos[b]/ins[b]:0)-(ins[a]?pos[a]/ins[a]:0))||(a-b));
  const cards=orden.map(k=>{
    const t=RECIP.tipos[k], p=pos[k], i=ins[k], pct=i?(p/i*100):0;
    const cls=pct>=2?'alta':pct>=1?'mid':'low';
    const bg=cls==='alta'?'var(--high)':cls==='mid'?'var(--mid)':'var(--low)';
    return '<div class="rec"><div class="ic">'+recipIcon(k)+'</div>'+
      '<div class="rt">'+t+'</div><div class="rp pos num">'+fmt(p)+'</div><div class="rl">positivos a larvas</div>'+
      '<span class="pct num" style="background:'+bg+'">'+pct.toFixed(1)+'%</span></div>';
  }).join('');
  $('recipGrid').innerHTML=cards;
  const ti=ins.reduce((a,b)=>a+b,0), tp=pos.reduce((a,b)=>a+b,0);
  $('recipTotal').innerHTML='<span>TOTAL recipientes</span><span><b class="num">'+fmt(tp)+' positivos</b> · '+(ti?(tp/ti*100).toFixed(1):0)+'% positividad</span>';
}

/* ================= 11 · DESCARGA EXCEL ================= */
function descargar(){
  const secs=sectores();
  const rows=secs.map(s=>({'Red':s.red,'Centro de salud':s.eess,'Distrito':s.dist,'Sector':'Sector '+s.sector,
    'Inspeccionadas':s.insp,'Viviendas positivas':s.pos,'Índice aédico (%)':+s.ia.toFixed(2),'Nivel de alerta':NIVEL_TXT[s.nivel]}));
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.json_to_sheet(rows);
  ws['!cols']=[{wch:13},{wch:26},{wch:16},{wch:12},{wch:14},{wch:16},{wch:16},{wch:22}];
  // color por nivel en la columna nivel
  const range=XLSX.utils.decode_range(ws['!ref']);
  for(let R=1;R<=range.e.r;R++){
    const s=secs[R-1]; if(!s) continue;
    const col=7; const cell=XLSX.utils.encode_cell({r:R,c:col});
    const color=s.nivel==='alta'?'D1495B':s.nivel==='mid'?'C98A1E':'2E9E8F';
    if(ws[cell]) ws[cell].s={font:{color:{rgb:'FFFFFF'},bold:true},fill:{fgColor:{rgb:color}}};
    const iaCell=XLSX.utils.encode_cell({r:R,c:6}); if(ws[iaCell]) ws[iaCell].s={font:{color:{rgb:color},bold:true}};
  }
  // encabezado
  for(let C=range.s.c;C<=range.e.c;C++){const h=XLSX.utils.encode_cell({r:0,c:C}); if(ws[h])ws[h].s={font:{bold:true,color:{rgb:'FFFFFF'}},fill:{fgColor:{rgb:'14312E'}}};}
  XLSX.utils.book_append_sheet(wb,ws,'Sectores');
  const amb = state.eess!=='__all__'?state.eess.replace(/[^\w]+/g,'_'):(state.red!=='__all__'?state.red:'DESA_Lambayeque');
  XLSX.writeFile(wb,'Alerta_Dengue_'+amb+'_'+state.d1+'_'+state.d2+'.xlsx');
}

/* ================= REFRESH GLOBAL ================= */
function refresh(){
  renderResumen();
  renderHero();
  renderHumedad();
  renderTermico();
  renderRefugio();
  if(map) renderMapa();
  renderZonas();
  renderEvolucion();
  renderRecip();
  // footer contextual
  const amb = state.eess!=='__all__'?state.eess:(state.red!=='__all__'?'RED '+state.red:'las tres redes');
  $('foot').textContent='Vista de '+amb+' ('+state.d1+' a '+state.d2+'). Los sectores se clasifican por su índice aédico según la norma MINSA/OPS: bajo <1%, medio/alerta ≥1% y <4%, alto ≥4%.';
}

/* ================= ARRANQUE ================= */
window.addEventListener('DOMContentLoaded',()=>{
  initFilters();
  initMap();
  refresh();
  cargarClima();

  $('fRed').addEventListener('change',e=>{state.red=e.target.value;state.eess='__all__';fillCentros();refresh();cargarClima();});
  $('fEess').addEventListener('change',e=>{state.eess=e.target.value;refresh();cargarClima();});
  $('fDesde').addEventListener('change',e=>{state.d1=e.target.value;refresh();});
  $('fHasta').addEventListener('change',e=>{state.d2=e.target.value;refresh();});
  $('fReset').addEventListener('click',()=>{
    state.red='__all__';state.eess='__all__';
    let mn='9999',mx='0000';PUNTOS.forEach(p=>{if(p[5]<mn)mn=p[5];if(p[5]>mx)mx=p[5];});
    if(META.fechaMax)mx=META.fechaMax;
    state.d1=mn;state.d2=mx;
    $('fRed').value='__all__';fillCentros();$('fEess').value='__all__';$('fDesde').value=mn;$('fHasta').value=mx;
    refresh();cargarClima();
  });
  $('fMapa').addEventListener('click',()=>setFondo('mapa'));
  $('fSat').addEventListener('click',()=>setFondo('sat'));
  $('btnDL').addEventListener('click',descargar);
  $('btnClima').addEventListener('click',cargarClima);
});
