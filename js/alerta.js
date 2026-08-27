/* ===================================================================
   ALERTA TEMPRANA DE BROTES DE DENGUE — DESA (GERESA) LAMBAYEQUE
   Lógica del tablero
   Alcance: actividades "Control larvario" y "Recuperación"
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

/* Puntos filtrados (Control larvario + Recuperación) para KPI/mapa/evolución */
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
  /* Centros con polígono dibujado (Cerropón, José Olaya, La Victoria S.II): el sector se determina
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
/* ===== Límites de sector por centro (JOSE OLAYA, CERROPON): burbuja de lejos / calor de cerca ===== */
(function(){var st=document.createElement('style');st.textContent='.sect-burbuja{background:#1a56db;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4);color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;line-height:1}'+'.sect-burbuja .num{font-weight:800;font-size:19px}'+'.sect-burbuja .cnt{font-size:10px;opacity:.92;margin-top:2px}';document.head.appendChild(st);})();
const SECTORES_POR_CENTRO = {"C.S. CERROPON":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.864916,-6.773055],[-79.864738,-6.773372],[-79.864524,-6.773619],[-79.863156,-6.775914],[-79.86072,-6.779851],[-79.859778,-6.778156],[-79.859191,-6.773284],[-79.864364,-6.772649],[-79.864916,-6.773055]]]},"properties":{"name":"VI","viviendas":750}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.866079,-6.777838],[-79.862155,-6.783993],[-79.861676,-6.783746],[-79.861471,-6.78365],[-79.861396,-6.783545],[-79.861352,-6.783487],[-79.861338,-6.783251],[-79.8613,-6.783003],[-79.861406,-6.782651],[-79.861564,-6.782516],[-79.86179,-6.782463],[-79.861552,-6.782013],[-79.861268,-6.781613],[-79.861212,-6.781436],[-79.861095,-6.781262],[-79.861014,-6.781133],[-79.861005,-6.78102],[-79.861178,-6.780943],[-79.861162,-6.78083],[-79.86069,-6.779939],[-79.864958,-6.773069],[-79.866399,-6.773917],[-79.866737,-6.776778],[-79.866079,-6.777838]]]},"properties":{"name":"V","viviendas":2207}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.872587,-6.777596],[-79.872793,-6.779101],[-79.8728,-6.77946],[-79.872647,-6.77981],[-79.872042,-6.780745],[-79.871042,-6.782304],[-79.86814,-6.786889],[-79.862179,-6.784006],[-79.865882,-6.778201],[-79.866095,-6.777882],[-79.866327,-6.777503],[-79.866702,-6.776919],[-79.86671,-6.776864],[-79.86673,-6.776828],[-79.86677,-6.776783],[-79.866756,-6.776703],[-79.866743,-6.77663],[-79.866725,-6.776467],[-79.866677,-6.776131],[-79.866608,-6.775446],[-79.866533,-6.77491],[-79.866461,-6.77436],[-79.866447,-6.774249],[-79.866436,-6.774139],[-79.866419,-6.774043],[-79.866427,-6.774023],[-79.866436,-6.77394],[-79.867454,-6.774572],[-79.868536,-6.775272],[-79.86997,-6.776171],[-79.87138,-6.776946],[-79.872587,-6.777596]]]},"properties":{"name":"IV","viviendas":3389}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.862142,-6.784083],[-79.868107,-6.786927],[-79.867406,-6.788164],[-79.866604,-6.789495],[-79.865955,-6.790543],[-79.86566,-6.79108],[-79.865007,-6.792053],[-79.864286,-6.793182],[-79.864253,-6.793138],[-79.864225,-6.793099],[-79.864198,-6.793059],[-79.864176,-6.79303],[-79.864161,-6.793007],[-79.864118,-6.792939],[-79.864055,-6.792805],[-79.864009,-6.792619],[-79.863993,-6.79251],[-79.863942,-6.79229],[-79.863871,-6.792096],[-79.863644,-6.79213],[-79.863605,-6.792142],[-79.863586,-6.792146],[-79.863527,-6.792149],[-79.863431,-6.79215],[-79.863175,-6.792145],[-79.863042,-6.792128],[-79.862988,-6.792132],[-79.862941,-6.792111],[-79.862882,-6.79208],[-79.8627,-6.792057],[-79.862671,-6.79188],[-79.86266,-6.791595],[-79.862619,-6.791263],[-79.862574,-6.79097],[-79.862561,-6.790765],[-79.862571,-6.790457],[-79.862704,-6.790256],[-79.862645,-6.789879],[-79.862548,-6.789392],[-79.862422,-6.788899],[-79.862193,-6.788914],[-79.861943,-6.788899],[-79.861454,-6.788976],[-79.861278,-6.788993],[-79.861193,-6.788986],[-79.86115,-6.788803],[-79.86113,-6.788661],[-79.861109,-6.788569],[-79.860979,-6.788583],[-79.860822,-6.7886],[-79.860666,-6.788609],[-79.860517,-6.788619],[-79.86042,-6.788664],[-79.860335,-6.788731],[-79.860313,-6.788681],[-79.859952,-6.788672],[-79.859811,-6.788676],[-79.85962,-6.788679],[-79.859455,-6.788673],[-79.859496,-6.788531],[-79.859711,-6.788137],[-79.860197,-6.787318],[-79.861428,-6.78531],[-79.861843,-6.784626],[-79.86199,-6.784357],[-79.862142,-6.784083]]]},"properties":{"name":"III","viviendas":967}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.869189,-6.785425],[-79.86977,-6.78577],[-79.870342,-6.786094],[-79.871233,-6.786473],[-79.871919,-6.786775],[-79.872211,-6.786899],[-79.873712,-6.787514],[-79.873591,-6.7879],[-79.873337,-6.788539],[-79.873207,-6.788862],[-79.872719,-6.790422],[-79.87262,-6.790497],[-79.872525,-6.790492],[-79.872481,-6.790509],[-79.872378,-6.790553],[-79.872222,-6.790614],[-79.872046,-6.790676],[-79.871786,-6.790728],[-79.871301,-6.790827],[-79.870793,-6.790888],[-79.87044,-6.790923],[-79.870176,-6.790979],[-79.869934,-6.791047],[-79.869688,-6.791147],[-79.869496,-6.791218],[-79.869163,-6.791316],[-79.869019,-6.791315],[-79.868758,-6.791252],[-79.868377,-6.791262],[-79.868385,-6.791314],[-79.868407,-6.791549],[-79.868261,-6.791545],[-79.868039,-6.791574],[-79.867,-6.791555],[-79.866416,-6.79161],[-79.865816,-6.791658],[-79.86576,-6.791517],[-79.865646,-6.791168],[-79.865837,-6.790897],[-79.866275,-6.790168],[-79.867209,-6.788623],[-79.867847,-6.787534],[-79.868116,-6.787087],[-79.869189,-6.785425]]]},"properties":{"name":"II","viviendas":961}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.869196,-6.785417],[-79.869534,-6.784823],[-79.869771,-6.784448],[-79.870015,-6.784058],[-79.871293,-6.78206],[-79.872283,-6.78247],[-79.872833,-6.782645],[-79.873265,-6.782858],[-79.873406,-6.782954],[-79.873509,-6.783003],[-79.873627,-6.783137],[-79.87377,-6.783292],[-79.873871,-6.78351],[-79.873979,-6.7837],[-79.874099,-6.783625],[-79.87421,-6.783623],[-79.874417,-6.783709],[-79.874629,-6.783787],[-79.874729,-6.783852],[-79.874697,-6.783916],[-79.87465,-6.784009],[-79.874556,-6.78418],[-79.874624,-6.784196],[-79.874723,-6.784232],[-79.874824,-6.784263],[-79.874922,-6.784298],[-79.874852,-6.784482],[-79.874774,-6.784662],[-79.874642,-6.784924],[-79.874571,-6.785072],[-79.874747,-6.785171],[-79.874703,-6.785269],[-79.874554,-6.785601],[-79.874366,-6.786028],[-79.874302,-6.786272],[-79.874263,-6.786455],[-79.873832,-6.787393],[-79.873768,-6.787529],[-79.873539,-6.787435],[-79.87287,-6.787164],[-79.872272,-6.786916],[-79.871657,-6.786655],[-79.87138,-6.786531],[-79.871225,-6.786465],[-79.871055,-6.786393],[-79.870898,-6.786326],[-79.870723,-6.786251],[-79.870517,-6.786161],[-79.870346,-6.786089],[-79.869789,-6.785773],[-79.869657,-6.785688],[-79.86948,-6.785586],[-79.869312,-6.785488],[-79.869196,-6.785417]]]},"properties":{"name":"I","viviendas":1229}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.877045,-6.781375],[-79.877462,-6.781965],[-79.877635,-6.782209],[-79.877909,-6.782625],[-79.878264,-6.783145],[-79.878522,-6.783543],[-79.878672,-6.783914],[-79.878797,-6.784345],[-79.879147,-6.788068],[-79.879334,-6.78892],[-79.879519,-6.789427],[-79.87984,-6.790176],[-79.880137,-6.79055],[-79.880159,-6.791011],[-79.880348,-6.791696],[-79.880294,-6.79199],[-79.880159,-6.79218],[-79.879937,-6.7923],[-79.879644,-6.792326],[-79.879346,-6.792201],[-79.879089,-6.792097],[-79.878827,-6.791967],[-79.87859,-6.791865],[-79.878356,-6.791758],[-79.878144,-6.79165],[-79.877896,-6.791537],[-79.877663,-6.791424],[-79.877319,-6.791254],[-79.876894,-6.791044],[-79.876491,-6.790854],[-79.876007,-6.790624],[-79.87544,-6.790349],[-79.874906,-6.790094],[-79.874434,-6.789846],[-79.874022,-6.789656],[-79.873671,-6.789495],[-79.873401,-6.789355],[-79.873108,-6.789215],[-79.873139,-6.789124],[-79.87317,-6.789027],[-79.873206,-6.788912],[-79.873224,-6.788864],[-79.873239,-6.788813],[-79.873277,-6.788724],[-79.873457,-6.788276],[-79.873493,-6.788188],[-79.873526,-6.788094],[-79.873603,-6.787896],[-79.873723,-6.787524],[-79.873777,-6.787541],[-79.8738,-6.787523],[-79.874106,-6.786842],[-79.874268,-6.786481],[-79.874322,-6.786266],[-79.874393,-6.786009],[-79.87451,-6.785793],[-79.874658,-6.785418],[-79.874715,-6.785283],[-79.874743,-6.78521],[-79.874758,-6.785164],[-79.874709,-6.785134],[-79.874634,-6.785095],[-79.874588,-6.785066],[-79.874626,-6.784991],[-79.874679,-6.784881],[-79.874729,-6.784787],[-79.874853,-6.784513],[-79.87493,-6.784331],[-79.874933,-6.784284],[-79.874855,-6.784262],[-79.874723,-6.784208],[-79.874594,-6.78416],[-79.874672,-6.784001],[-79.874786,-6.783776],[-79.874606,-6.783648],[-79.874277,-6.783512],[-79.87403,-6.783521],[-79.873929,-6.783267],[-79.873601,-6.782941],[-79.873189,-6.782732],[-79.872807,-6.782572],[-79.872087,-6.782341],[-79.871362,-6.782054],[-79.872274,-6.780575],[-79.872854,-6.779674],[-79.872999,-6.779534],[-79.873178,-6.779425],[-79.873383,-6.779338],[-79.873604,-6.779251],[-79.873846,-6.779171],[-79.874108,-6.779087],[-79.874447,-6.778992],[-79.874647,-6.779022],[-79.874814,-6.779099],[-79.874895,-6.779129],[-79.875029,-6.779199],[-79.875201,-6.779331],[-79.87537,-6.779485],[-79.875566,-6.779671],[-79.875722,-6.779821],[-79.875868,-6.779948],[-79.876164,-6.780206],[-79.876292,-6.78036],[-79.876433,-6.780523],[-79.876538,-6.780663],[-79.876634,-6.780777],[-79.87673,-6.780926],[-79.876835,-6.781057],[-79.876935,-6.781212],[-79.877045,-6.781375]]]},"properties":{"name":"VII","viviendas":1740}}],"C.S. JOSE OLAYA":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.852282,-6.770545],[-79.852459,-6.770531],[-79.852633,-6.770508],[-79.852828,-6.770488],[-79.853166,-6.770462],[-79.85362,-6.770396],[-79.854868,-6.770271],[-79.857399,-6.769979],[-79.85883,-6.76978],[-79.859494,-6.77624],[-79.859322,-6.776259],[-79.859105,-6.776275],[-79.858048,-6.776378],[-79.856963,-6.776495],[-79.856286,-6.776564],[-79.855603,-6.776637],[-79.854256,-6.776759],[-79.853419,-6.776841],[-79.852897,-6.776878],[-79.852869,-6.776588],[-79.852854,-6.776417],[-79.852839,-6.776259],[-79.852748,-6.775299],[-79.852704,-6.774825],[-79.852684,-6.774593],[-79.852661,-6.774368],[-79.85264,-6.774125],[-79.852616,-6.773888],[-79.852591,-6.77364],[-79.852574,-6.773503],[-79.852563,-6.773389],[-79.852552,-6.773316],[-79.852544,-6.773224],[-79.852539,-6.773126],[-79.852523,-6.773004],[-79.852517,-6.772877],[-79.852499,-6.772738],[-79.852489,-6.772638],[-79.85248,-6.772553],[-79.852464,-6.772406],[-79.852446,-6.772237],[-79.852436,-6.772135],[-79.852425,-6.772026],[-79.852405,-6.771853],[-79.852389,-6.771726],[-79.852374,-6.771579],[-79.852365,-6.771425],[-79.852352,-6.771309],[-79.85234,-6.771179],[-79.852328,-6.771014],[-79.852308,-6.770803],[-79.852282,-6.770545]]]},"properties":{"name":"II","viviendas":1915}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.852904,-6.776969],[-79.859525,-6.776323],[-79.859552,-6.776561],[-79.859581,-6.77682],[-79.859628,-6.777295],[-79.85969,-6.777659],[-79.859837,-6.778176],[-79.860079,-6.778687],[-79.860422,-6.779304],[-79.860774,-6.779954],[-79.860691,-6.779978],[-79.860478,-6.780006],[-79.860196,-6.780028],[-79.859893,-6.780056],[-79.859836,-6.780089],[-79.859942,-6.781218],[-79.8593,-6.782528],[-79.858988,-6.782374],[-79.858346,-6.782063],[-79.857549,-6.781637],[-79.856912,-6.781311],[-79.856563,-6.781141],[-79.856225,-6.780914],[-79.85601,-6.78072],[-79.855759,-6.78057],[-79.85543,-6.780498],[-79.855127,-6.780435],[-79.853504,-6.779645],[-79.852497,-6.779083],[-79.852397,-6.779015],[-79.852218,-6.778876],[-79.852122,-6.778764],[-79.852079,-6.778688],[-79.852153,-6.778656],[-79.852222,-6.77864],[-79.852289,-6.778622],[-79.85238,-6.778595],[-79.852594,-6.778544],[-79.852826,-6.778476],[-79.853041,-6.778418],[-79.853037,-6.778338],[-79.852943,-6.777383],[-79.852904,-6.776969]]]},"properties":{"name":"I","viviendas":1354}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.845065,-6.771222],[-79.845126,-6.771661],[-79.845165,-6.772016],[-79.845213,-6.772318],[-79.845243,-6.772646],[-79.845304,-6.773019],[-79.845372,-6.773418],[-79.845433,-6.773848],[-79.845516,-6.774275],[-79.845579,-6.774748],[-79.845628,-6.77513],[-79.845663,-6.775395],[-79.845719,-6.775687],[-79.845775,-6.776028],[-79.845803,-6.776452],[-79.845719,-6.776689],[-79.845523,-6.776738],[-79.845246,-6.776672],[-79.844273,-6.776488],[-79.843516,-6.776318],[-79.842916,-6.776068],[-79.842407,-6.775849],[-79.841653,-6.775596],[-79.841136,-6.77542],[-79.840539,-6.775452],[-79.839669,-6.775532],[-79.838802,-6.775611],[-79.838073,-6.775692],[-79.837613,-6.775749],[-79.837156,-6.775802],[-79.836801,-6.775849],[-79.836245,-6.775924],[-79.835545,-6.776003],[-79.835632,-6.775484],[-79.835769,-6.775067],[-79.83578,-6.774676],[-79.835925,-6.774131],[-79.836023,-6.773762],[-79.836104,-6.773371],[-79.83612,-6.772802],[-79.836135,-6.772205],[-79.836809,-6.772116],[-79.837349,-6.772027],[-79.838096,-6.771955],[-79.838791,-6.77183],[-79.839389,-6.771812],[-79.840192,-6.771722],[-79.841014,-6.771632],[-79.841581,-6.771596],[-79.842269,-6.771524],[-79.842907,-6.771469],[-79.843719,-6.77136],[-79.844326,-6.771287],[-79.845065,-6.771222]]]},"properties":{"name":"IV","viviendas":1297}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.844202,-6.776552],[-79.844458,-6.779091],[-79.84437,-6.779119],[-79.844276,-6.779123],[-79.844208,-6.779112],[-79.844167,-6.779091],[-79.844064,-6.779017],[-79.843976,-6.778948],[-79.843849,-6.778901],[-79.843718,-6.77887],[-79.843572,-6.778882],[-79.843439,-6.778906],[-79.843259,-6.778995],[-79.842807,-6.779289],[-79.842587,-6.779402],[-79.842359,-6.779496],[-79.842044,-6.779597],[-79.841877,-6.779622],[-79.841722,-6.77965],[-79.841529,-6.779667],[-79.841287,-6.779662],[-79.840899,-6.779622],[-79.840577,-6.77953],[-79.840292,-6.779416],[-79.839872,-6.7792],[-79.839182,-6.778776],[-79.838822,-6.778553],[-79.838459,-6.778329],[-79.837986,-6.778035],[-79.837528,-6.777755],[-79.837075,-6.777476],[-79.836635,-6.777208],[-79.835765,-6.776701],[-79.835561,-6.776655],[-79.835439,-6.776566],[-79.835518,-6.776297],[-79.835556,-6.776067],[-79.836054,-6.776015],[-79.837078,-6.77587],[-79.837379,-6.775827],[-79.837716,-6.775799],[-79.838226,-6.775729],[-79.838745,-6.775679],[-79.839229,-6.775626],[-79.839813,-6.775573],[-79.84037,-6.775515],[-79.840823,-6.775497],[-79.841135,-6.775532],[-79.841575,-6.77565],[-79.842013,-6.775794],[-79.842459,-6.775962],[-79.842852,-6.776142],[-79.843288,-6.776359],[-79.843739,-6.776472],[-79.844202,-6.776552]]]},"properties":{"name":"V","viviendas":1108}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.844941,-6.781206],[-79.844259,-6.781382],[-79.843859,-6.781512],[-79.843655,-6.781571],[-79.843419,-6.781637],[-79.843182,-6.781718],[-79.843048,-6.781739],[-79.842927,-6.781731],[-79.842782,-6.781699],[-79.842674,-6.781704],[-79.842605,-6.78176],[-79.842559,-6.781838],[-79.842377,-6.781985],[-79.842155,-6.78206],[-79.841801,-6.782174],[-79.841563,-6.782245],[-79.841315,-6.782324],[-79.840611,-6.782562],[-79.840199,-6.782693],[-79.839733,-6.782848],[-79.838941,-6.783121],[-79.838562,-6.783248],[-79.838243,-6.783354],[-79.837889,-6.783477],[-79.837512,-6.783578],[-79.837212,-6.783668],[-79.836955,-6.7838],[-79.836752,-6.784003],[-79.836641,-6.784209],[-79.83649,-6.784622],[-79.836331,-6.785023],[-79.835744,-6.784817],[-79.835094,-6.784576],[-79.834604,-6.78447],[-79.834218,-6.784303],[-79.833607,-6.784103],[-79.833848,-6.782959],[-79.834055,-6.782067],[-79.834191,-6.781216],[-79.834396,-6.780306],[-79.834689,-6.779332],[-79.834922,-6.778641],[-79.83547,-6.776805],[-79.835911,-6.777055],[-79.836345,-6.777313],[-79.836683,-6.777507],[-79.837028,-6.777703],[-79.837686,-6.778101],[-79.838338,-6.778507],[-79.838549,-6.778638],[-79.838827,-6.778818],[-79.838905,-6.778853],[-79.838955,-6.778741],[-79.839003,-6.778692],[-79.839085,-6.778748],[-79.839218,-6.778827],[-79.839371,-6.778923],[-79.839715,-6.779136],[-79.840153,-6.779386],[-79.840349,-6.779473],[-79.840557,-6.779557],[-79.840696,-6.779602],[-79.840806,-6.779639],[-79.840934,-6.779649],[-79.841112,-6.779668],[-79.841282,-6.779686],[-79.84147,-6.779693],[-79.841657,-6.77968],[-79.84184,-6.779655],[-79.842032,-6.779623],[-79.842266,-6.779558],[-79.84245,-6.779489],[-79.842571,-6.779437],[-79.842649,-6.779394],[-79.842759,-6.77934],[-79.842887,-6.779264],[-79.842994,-6.779198],[-79.843065,-6.77915],[-79.843129,-6.779101],[-79.843213,-6.779048],[-79.843337,-6.778978],[-79.843442,-6.778927],[-79.843564,-6.778902],[-79.843701,-6.778895],[-79.843811,-6.778916],[-79.843909,-6.778948],[-79.844017,-6.779012],[-79.844098,-6.779071],[-79.844206,-6.779135],[-79.844311,-6.779148],[-79.84448,-6.779124],[-79.844515,-6.779287],[-79.844534,-6.779416],[-79.844728,-6.780303],[-79.844941,-6.781206]]]},"properties":{"name":"VI","viviendas":2299}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.85412,-6.783587],[-79.854006,-6.783942],[-79.853829,-6.784443],[-79.853628,-6.785014],[-79.853466,-6.785482],[-79.853178,-6.786259],[-79.853011,-6.786779],[-79.852915,-6.786819],[-79.852818,-6.786886],[-79.852825,-6.787018],[-79.852863,-6.787175],[-79.852684,-6.787733],[-79.852428,-6.788479],[-79.852201,-6.789129],[-79.851999,-6.789675],[-79.851868,-6.790052],[-79.851746,-6.790425],[-79.851565,-6.790411],[-79.851301,-6.790294],[-79.850952,-6.790199],[-79.850535,-6.790117],[-79.850448,-6.790013],[-79.850309,-6.789893],[-79.850076,-6.789835],[-79.849547,-6.789864],[-79.849247,-6.789886],[-79.848968,-6.789886],[-79.848807,-6.789879],[-79.848414,-6.789805],[-79.848176,-6.789715],[-79.847894,-6.789587],[-79.847603,-6.789457],[-79.847346,-6.789349],[-79.847168,-6.789254],[-79.847087,-6.789017],[-79.846936,-6.788423],[-79.846733,-6.787579],[-79.846445,-6.786495],[-79.846384,-6.7862],[-79.846245,-6.785643],[-79.846085,-6.784956],[-79.845931,-6.784375],[-79.846384,-6.784263],[-79.846693,-6.784184],[-79.84681,-6.784153],[-79.846914,-6.784133],[-79.847171,-6.784072],[-79.847447,-6.784017],[-79.847688,-6.783961],[-79.847944,-6.783899],[-79.848181,-6.783852],[-79.848283,-6.783839],[-79.848397,-6.783829],[-79.848707,-6.783841],[-79.848896,-6.783848],[-79.849093,-6.783855],[-79.849279,-6.783862],[-79.849373,-6.783855],[-79.849465,-6.783851],[-79.849779,-6.783815],[-79.850114,-6.783789],[-79.850633,-6.783751],[-79.850939,-6.783725],[-79.851366,-6.783694],[-79.851696,-6.783667],[-79.852241,-6.783639],[-79.852704,-6.783601],[-79.853342,-6.783551],[-79.853515,-6.783536],[-79.853673,-6.783535],[-79.853811,-6.783521],[-79.853949,-6.783526],[-79.85412,-6.783587]]]},"properties":{"name":"X","viviendas":1389}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.852057,-6.790022],[-79.85533,-6.78076],[-79.855874,-6.781008],[-79.856679,-6.781365],[-79.857976,-6.782032],[-79.862255,-6.784054],[-79.86188,-6.784653],[-79.861676,-6.785003],[-79.861116,-6.785907],[-79.860911,-6.786249],[-79.860727,-6.78657],[-79.860538,-6.786633],[-79.860477,-6.786745],[-79.860424,-6.786857],[-79.860242,-6.787321],[-79.859785,-6.788111],[-79.859378,-6.788778],[-79.859077,-6.789273],[-79.858796,-6.789697],[-79.858551,-6.790072],[-79.858288,-6.790456],[-79.858123,-6.790705],[-79.857958,-6.79096],[-79.857864,-6.791118],[-79.857762,-6.791274],[-79.857683,-6.791216],[-79.8575,-6.791089],[-79.857306,-6.790944],[-79.85721,-6.790869],[-79.857136,-6.790769],[-79.857027,-6.790899],[-79.856937,-6.791048],[-79.85663,-6.791469],[-79.856404,-6.791807],[-79.856213,-6.791988],[-79.856042,-6.791881],[-79.855872,-6.791788],[-79.855669,-6.791706],[-79.855515,-6.791673],[-79.855311,-6.791728],[-79.855068,-6.791771],[-79.854892,-6.791816],[-79.854686,-6.791846],[-79.854569,-6.791833],[-79.854441,-6.791789],[-79.854156,-6.791691],[-79.853713,-6.791555],[-79.853381,-6.79144],[-79.853056,-6.791335],[-79.852833,-6.791266],[-79.852622,-6.791202],[-79.852389,-6.791123],[-79.852245,-6.791069],[-79.852161,-6.791037],[-79.852076,-6.79099],[-79.851974,-6.790911],[-79.851896,-6.790793],[-79.851861,-6.79066],[-79.851871,-6.790536],[-79.851906,-6.790409],[-79.851969,-6.790235],[-79.852057,-6.790022]]]},"properties":{"name":"XI","viviendas":1734}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.846966,-6.789261],[-79.8466,-6.789059],[-79.846236,-6.788878],[-79.845916,-6.788761],[-79.845501,-6.78863],[-79.845178,-6.788509],[-79.844811,-6.788362],[-79.844424,-6.788163],[-79.843798,-6.787912],[-79.842961,-6.787644],[-79.842935,-6.787551],[-79.842945,-6.787495],[-79.842986,-6.787396],[-79.843005,-6.78732],[-79.842064,-6.786993],[-79.84113,-6.786676],[-79.836401,-6.78505],[-79.836523,-6.784719],[-79.836614,-6.784454],[-79.836698,-6.784231],[-79.836868,-6.783984],[-79.837153,-6.783816],[-79.837566,-6.783665],[-79.837984,-6.783533],[-79.838432,-6.783386],[-79.83939,-6.783072],[-79.841306,-6.782459],[-79.841904,-6.782262],[-79.842175,-6.78218],[-79.842435,-6.782092],[-79.842601,-6.782087],[-79.842803,-6.78212],[-79.842954,-6.781975],[-79.843079,-6.781872],[-79.843266,-6.781769],[-79.843475,-6.781707],[-79.843662,-6.781645],[-79.843891,-6.781588],[-79.844167,-6.781505],[-79.844406,-6.781433],[-79.844614,-6.781381],[-79.84481,-6.781334],[-79.844974,-6.781294],[-79.845035,-6.781526],[-79.845111,-6.781824],[-79.845199,-6.782181],[-79.845317,-6.782619],[-79.845393,-6.782963],[-79.845465,-6.783227],[-79.84557,-6.783656],[-79.845642,-6.783957],[-79.84572,-6.784272],[-79.845785,-6.784541],[-79.845854,-6.784805],[-79.845943,-6.785187],[-79.846005,-6.785435],[-79.846078,-6.785704],[-79.846142,-6.785947],[-79.84619,-6.786168],[-79.846338,-6.786696],[-79.846381,-6.786907],[-79.846497,-6.787357],[-79.846556,-6.787584],[-79.846652,-6.787947],[-79.846698,-6.788168],[-79.846808,-6.788552],[-79.846862,-6.7888],[-79.846937,-6.789085],[-79.846966,-6.789261]]]},"properties":{"name":"IX","viviendas":2321}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.852268,-6.770545],[-79.852292,-6.770809],[-79.852317,-6.771099],[-79.852365,-6.771668],[-79.85249,-6.772788],[-79.853015,-6.778393],[-79.852548,-6.778527],[-79.852327,-6.778586],[-79.852152,-6.778632],[-79.852045,-6.778661],[-79.851967,-6.778629],[-79.851894,-6.778612],[-79.851754,-6.778548],[-79.851608,-6.778468],[-79.851404,-6.778365],[-79.851098,-6.778206],[-79.850914,-6.778114],[-79.850722,-6.778004],[-79.85049,-6.77789],[-79.850213,-6.777765],[-79.849943,-6.77767],[-79.84958,-6.777563],[-79.849191,-6.777482],[-79.84855,-6.777343],[-79.847918,-6.7772],[-79.847489,-6.777107],[-79.847072,-6.777023],[-79.846703,-6.776984],[-79.845959,-6.776836],[-79.845895,-6.776191],[-79.845772,-6.775545],[-79.845586,-6.774245],[-79.845539,-6.773898],[-79.845432,-6.773268],[-79.845363,-6.7728],[-79.845327,-6.772472],[-79.845252,-6.77184],[-79.84522,-6.771584],[-79.845178,-6.771269],[-79.845265,-6.77126],[-79.845454,-6.771242],[-79.845646,-6.771226],[-79.846013,-6.771183],[-79.846231,-6.771163],[-79.846385,-6.771151],[-79.846905,-6.771097],[-79.847158,-6.77107],[-79.847611,-6.771026],[-79.847769,-6.77101],[-79.847977,-6.770987],[-79.848425,-6.770949],[-79.848608,-6.770927],[-79.848836,-6.770908],[-79.849243,-6.770861],[-79.849479,-6.770839],[-79.849586,-6.770827],[-79.849751,-6.770811],[-79.850133,-6.770769],[-79.850283,-6.770751],[-79.850506,-6.770724],[-79.850923,-6.770685],[-79.851095,-6.77067],[-79.851291,-6.770652],[-79.851539,-6.770623],[-79.851767,-6.770602],[-79.852015,-6.770578],[-79.852175,-6.770564],[-79.852268,-6.770545]]]},"properties":{"name":"III","viviendas":981}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.849344,-6.783831],[-79.849325,-6.78364],[-79.849296,-6.783442],[-79.849252,-6.783102],[-79.849231,-6.7829],[-79.849191,-6.782623],[-79.849117,-6.782164],[-79.849068,-6.781779],[-79.848963,-6.781016],[-79.848869,-6.780357],[-79.848829,-6.780029],[-79.848781,-6.779698],[-79.848878,-6.779656],[-79.849012,-6.779597],[-79.849156,-6.779545],[-79.849296,-6.779465],[-79.849489,-6.779401],[-79.850177,-6.779185],[-79.850552,-6.779059],[-79.850825,-6.778984],[-79.851141,-6.778939],[-79.851364,-6.778902],[-79.851688,-6.778832],[-79.85185,-6.778798],[-79.851893,-6.778841],[-79.851942,-6.778876],[-79.852113,-6.778965],[-79.852291,-6.779053],[-79.85264,-6.779292],[-79.852919,-6.779444],[-79.853396,-6.779677],[-79.853751,-6.77986],[-79.854056,-6.780017],[-79.854373,-6.780181],[-79.854703,-6.780333],[-79.854868,-6.780427],[-79.855014,-6.780534],[-79.855173,-6.78066],[-79.855,-6.781107],[-79.854573,-6.782312],[-79.85442,-6.782722],[-79.854306,-6.783049],[-79.854222,-6.783292],[-79.85414,-6.783491],[-79.854113,-6.783557],[-79.85405,-6.783546],[-79.853977,-6.783516],[-79.853897,-6.783505],[-79.853769,-6.783512],[-79.85361,-6.783521],[-79.853382,-6.783532],[-79.853127,-6.783546],[-79.852847,-6.783571],[-79.852301,-6.783611],[-79.851551,-6.783661],[-79.850925,-6.783711],[-79.85018,-6.783767],[-79.849877,-6.783792],[-79.849638,-6.783808],[-79.849428,-6.783828],[-79.849344,-6.783831]]]},"properties":{"name":"VII","viviendas":1071}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.851841,-6.778754],[-79.85184,-6.778783],[-79.851718,-6.77881],[-79.851557,-6.778846],[-79.851402,-6.77888],[-79.851255,-6.778908],[-79.851134,-6.778926],[-79.851032,-6.778939],[-79.850946,-6.778953],[-79.850843,-6.778969],[-79.850566,-6.779041],[-79.850364,-6.779109],[-79.850254,-6.779146],[-79.850128,-6.779188],[-79.84994,-6.779247],[-79.849778,-6.779299],[-79.849631,-6.779348],[-79.84947,-6.779396],[-79.849331,-6.779436],[-79.849168,-6.779507],[-79.848966,-6.779591],[-79.848744,-6.779677],[-79.848763,-6.779703],[-79.848772,-6.779753],[-79.848787,-6.779826],[-79.848817,-6.78004],[-79.848844,-6.780248],[-79.848959,-6.781099],[-79.848985,-6.781259],[-79.849008,-6.781437],[-79.84905,-6.781771],[-79.849065,-6.781855],[-79.849074,-6.781944],[-79.849101,-6.782137],[-79.849161,-6.78251],[-79.849192,-6.782712],[-79.849218,-6.782898],[-79.849243,-6.78313],[-79.849278,-6.783398],[-79.84933,-6.783835],[-79.849074,-6.783828],[-79.848815,-6.78382],[-79.848613,-6.783814],[-79.848397,-6.783809],[-79.848194,-6.783822],[-79.847909,-6.783885],[-79.847673,-6.78395],[-79.847447,-6.783997],[-79.847302,-6.784031],[-79.847118,-6.784072],[-79.846882,-6.784127],[-79.846758,-6.784157],[-79.846597,-6.784197],[-79.84642,-6.784242],[-79.84622,-6.784292],[-79.846017,-6.784345],[-79.845944,-6.784359],[-79.845932,-6.784332],[-79.845873,-6.784115],[-79.845771,-6.783729],[-79.845695,-6.783418],[-79.844955,-6.780628],[-79.844901,-6.780433],[-79.844805,-6.780056],[-79.844689,-6.779572],[-79.844663,-6.77945],[-79.84463,-6.779195],[-79.844619,-6.779107],[-79.844595,-6.778964],[-79.84456,-6.778673],[-79.844494,-6.778178],[-79.844458,-6.777882],[-79.84442,-6.777562],[-79.844406,-6.777428],[-79.844367,-6.777082],[-79.844353,-6.776848],[-79.844349,-6.776755],[-79.844326,-6.776656],[-79.844331,-6.776583],[-79.844449,-6.776606],[-79.844564,-6.776633],[-79.8447,-6.776656],[-79.844804,-6.776676],[-79.844976,-6.776711],[-79.845609,-6.776846],[-79.845705,-6.776867],[-79.845801,-6.776897],[-79.845889,-6.776898],[-79.84596,-6.776888],[-79.846128,-6.776936],[-79.846252,-6.776964],[-79.846434,-6.777],[-79.846677,-6.777055],[-79.846802,-6.77709],[-79.847195,-6.777169],[-79.847552,-6.777247],[-79.847741,-6.777292],[-79.848005,-6.777347],[-79.848118,-6.777372],[-79.848273,-6.777405],[-79.848591,-6.777478],[-79.848823,-6.777529],[-79.848933,-6.777551],[-79.849089,-6.777588],[-79.849397,-6.777651],[-79.849542,-6.77768],[-79.849781,-6.777756],[-79.849899,-6.777795],[-79.85019,-6.777892],[-79.85044,-6.777994],[-79.850745,-6.778144],[-79.850871,-6.778208],[-79.851186,-6.778364],[-79.851324,-6.778446],[-79.851517,-6.778541],[-79.851622,-6.778596],[-79.851712,-6.778649],[-79.851784,-6.778694],[-79.851841,-6.778754]]]},"properties":{"name":"VIII","viviendas":1531}}],"C.S. LA VICTORIA S.II":[{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.839167,-6.801202],[-79.838581,-6.801096],[-79.838109,-6.80101],[-79.837641,-6.800913],[-79.836952,-6.800799],[-79.836273,-6.800675],[-79.835619,-6.800568],[-79.835015,-6.800461],[-79.835117,-6.79997],[-79.835264,-6.799263],[-79.835501,-6.79817],[-79.835657,-6.797423],[-79.835765,-6.796901],[-79.835854,-6.796497],[-79.83623,-6.796575],[-79.836658,-6.796665],[-79.837277,-6.796799],[-79.837741,-6.796897],[-79.838234,-6.797003],[-79.83865,-6.797094],[-79.838833,-6.797133],[-79.839016,-6.797177],[-79.839185,-6.797216],[-79.839355,-6.797256],[-79.839708,-6.797335],[-79.839953,-6.797388],[-79.8399,-6.797665],[-79.839804,-6.798141],[-79.839714,-6.798544],[-79.839552,-6.799297],[-79.839463,-6.799779],[-79.83942,-6.799987],[-79.839374,-6.800208],[-79.839351,-6.800318],[-79.839324,-6.800445],[-79.839247,-6.800803],[-79.839167,-6.801202]]]},"properties":{"name":"I","viviendas":1077}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.839953,-6.797369],[-79.839346,-6.797232],[-79.839046,-6.797163],[-79.83874,-6.797094],[-79.83831,-6.797003],[-79.837878,-6.79691],[-79.837491,-6.796826],[-79.837116,-6.796744],[-79.836532,-6.796621],[-79.835859,-6.796474],[-79.836011,-6.795742],[-79.83612,-6.79522],[-79.836256,-6.794564],[-79.836409,-6.793901],[-79.836469,-6.793626],[-79.836528,-6.793355],[-79.836577,-6.793091],[-79.836622,-6.792854],[-79.837092,-6.792956],[-79.837756,-6.793094],[-79.838237,-6.793209],[-79.839067,-6.793392],[-79.839815,-6.793553],[-79.840332,-6.793663],[-79.840709,-6.793747],[-79.840643,-6.794053],[-79.840567,-6.794407],[-79.840453,-6.794931],[-79.840348,-6.795417],[-79.840246,-6.795905],[-79.840154,-6.796405],[-79.84007,-6.796807],[-79.839953,-6.797369]]]},"properties":{"name":"II","viviendas":1093}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.834982,-6.800475],[-79.834549,-6.800388],[-79.834113,-6.800295],[-79.833262,-6.800109],[-79.832463,-6.799929],[-79.832004,-6.799826],[-79.831554,-6.799717],[-79.830983,-6.799602],[-79.830836,-6.799568],[-79.830697,-6.799513],[-79.830627,-6.799456],[-79.830613,-6.799365],[-79.830639,-6.79915],[-79.830665,-6.798923],[-79.830729,-6.798358],[-79.830743,-6.798228],[-79.830765,-6.798089],[-79.830805,-6.797838],[-79.830848,-6.797588],[-79.83094,-6.797122],[-79.830976,-6.796951],[-79.831011,-6.796789],[-79.831074,-6.796466],[-79.831174,-6.795972],[-79.831271,-6.795533],[-79.831598,-6.795605],[-79.831959,-6.795679],[-79.832676,-6.795828],[-79.833394,-6.795974],[-79.833853,-6.796073],[-79.834339,-6.796175],[-79.834571,-6.796223],[-79.83481,-6.796271],[-79.835158,-6.796346],[-79.835824,-6.796485],[-79.835678,-6.797189],[-79.835513,-6.79796],[-79.835347,-6.79875],[-79.835224,-6.799324],[-79.835059,-6.800101],[-79.834982,-6.800475]]]},"properties":{"name":"III","viviendas":1050}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.836597,-6.792843],[-79.836504,-6.793315],[-79.836413,-6.793767],[-79.836204,-6.794678],[-79.835825,-6.796473],[-79.835379,-6.796374],[-79.834935,-6.79628],[-79.834265,-6.796141],[-79.833928,-6.79607],[-79.833593,-6.795998],[-79.833253,-6.795927],[-79.83292,-6.795862],[-79.832577,-6.795788],[-79.832241,-6.795719],[-79.831275,-6.795515],[-79.831336,-6.795229],[-79.831518,-6.794353],[-79.831702,-6.79347],[-79.831869,-6.792651],[-79.831962,-6.792222],[-79.832032,-6.791876],[-79.833003,-6.792073],[-79.834267,-6.792337],[-79.834932,-6.792487],[-79.835577,-6.792621],[-79.836139,-6.792747],[-79.836597,-6.792843]]]},"properties":{"name":"IV","viviendas":1008}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.834799,-6.792372],[-79.83413,-6.792221],[-79.833795,-6.792149],[-79.833467,-6.792076],[-79.832797,-6.791929],[-79.832451,-6.791852],[-79.832058,-6.791771],[-79.832262,-6.790746],[-79.832477,-6.789724],[-79.832608,-6.789119],[-79.832725,-6.78856],[-79.833362,-6.788681],[-79.833671,-6.788741],[-79.833997,-6.788804],[-79.834141,-6.788114],[-79.834466,-6.788177],[-79.834751,-6.788235],[-79.834693,-6.788529],[-79.835573,-6.788702],[-79.83548,-6.789177],[-79.835345,-6.789826],[-79.83523,-6.790376],[-79.835089,-6.791001],[-79.834957,-6.791583],[-79.834799,-6.792372]]]},"properties":{"name":"V","viviendas":618}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.835574,-6.788688],[-79.834719,-6.78851],[-79.834781,-6.78822],[-79.834452,-6.78815],[-79.834126,-6.788084],[-79.833981,-6.788775],[-79.833349,-6.788659],[-79.832737,-6.788539],[-79.833163,-6.786443],[-79.833593,-6.784405],[-79.834935,-6.784865],[-79.835626,-6.785108],[-79.835959,-6.78522],[-79.836276,-6.785327],[-79.836097,-6.786157],[-79.835938,-6.787006],[-79.83576,-6.787841],[-79.835668,-6.788264],[-79.835574,-6.788688]]]},"properties":{"name":"VI","viviendas":732}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.835492,-6.789223],[-79.835735,-6.78928],[-79.835981,-6.78934],[-79.836229,-6.789398],[-79.836468,-6.789455],[-79.836557,-6.789038],[-79.836642,-6.788639],[-79.836822,-6.788677],[-79.837026,-6.788724],[-79.837432,-6.78881],[-79.838242,-6.788982],[-79.838636,-6.789064],[-79.839039,-6.789146],[-79.839827,-6.789322],[-79.839829,-6.789389],[-79.839872,-6.789438],[-79.840221,-6.789509],[-79.840541,-6.789576],[-79.840861,-6.789639],[-79.841028,-6.789671],[-79.84118,-6.789703],[-79.841296,-6.789726],[-79.84154,-6.789787],[-79.841331,-6.790792],[-79.841218,-6.791264],[-79.841166,-6.791512],[-79.841159,-6.791746],[-79.84109,-6.791971],[-79.841039,-6.792242],[-79.840941,-6.792705],[-79.840742,-6.793657],[-79.839539,-6.793409],[-79.838323,-6.79314],[-79.838109,-6.793097],[-79.837887,-6.793049],[-79.837454,-6.79295],[-79.836577,-6.79276],[-79.834826,-6.792375],[-79.834988,-6.791552],[-79.835169,-6.790753],[-79.835492,-6.789223]]]},"properties":{"name":"VII","viviendas":206}},{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[[-79.841546,-6.789776],[-79.841402,-6.789744],[-79.841199,-6.789695],[-79.839879,-6.789421],[-79.839853,-6.789397],[-79.839846,-6.789366],[-79.839843,-6.789313],[-79.838837,-6.789089],[-79.838307,-6.788979],[-79.837771,-6.788866],[-79.837203,-6.788743],[-79.836634,-6.788615],[-79.836548,-6.789024],[-79.836461,-6.789435],[-79.835499,-6.789206],[-79.835587,-6.788781],[-79.835679,-6.788349],[-79.835859,-6.78749],[-79.83594,-6.787113],[-79.836014,-6.786727],[-79.836168,-6.785943],[-79.836303,-6.78535],[-79.838887,-6.78624],[-79.841468,-6.787131],[-79.842095,-6.787347],[-79.841795,-6.788685],[-79.841675,-6.789227],[-79.841546,-6.789776]]]},"properties":{"name":"VIII","viviendas":472}}]};
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
/* ===== Leyenda de viviendas por sector (solo Cerropón, José Olaya y La Victoria S.II,
   que tienen conteo de viviendas actualizado por sector) ===== */
const CENTROS_CON_CONTEO = ["C.S. CERROPON","C.S. JOSE OLAYA","C.S. LA VICTORIA S.II"];
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

function initMap(){
  map=L.map('map',{scrollWheelZoom:false}).setView([-6.77,-79.84],11);
  tileMapa=L.layerGroup([
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{attribution:'© Esri',maxZoom:19}),
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',{attribution:'© Esri',maxZoom:19})
  ]);
  tileSat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'© Esri',maxZoom:19});
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
function buildDots(){
  dotLayer.clearLayers();
  if(map.getZoom()<ZOOM_DOTS){ if(map.hasLayer(dotLayer))map.removeLayer(dotLayer); return; }
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
  _dotData=pts;
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
  if(t==='mapa'){map.removeLayer(tileSat);tileMapa.addTo(map);} else {map.removeLayer(tileMapa);tileSat.addTo(map);}
  if(heat)heat.bringToFront();
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
    show.map(s=>'<tr><td>Sector '+s.sector+'</td>'+(multi?'<td>'+s.eess+'</td>':'')+
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
  const cards=RECIP.tipos.map((t,k)=>{
    const p=pos[k], i=ins[k], pct=i?(p/i*100):0;
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
