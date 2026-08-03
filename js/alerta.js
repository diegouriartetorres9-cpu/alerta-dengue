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
  for(const eess in SEC){
    if(!eessInScope(eess)) continue;
    for(const r of SEC[eess]){            // r = [sector,fecha,insp,pos]
      if(!inRange(r[1])) continue;
      const sec=r[0]; if(!sec) continue;
      const k=eess+'||'+sec;
      if(!acc[k]) acc[k]={eess,red:META.e2r[eess]||'',dist:META.e2d[eess]||'',sector:sec,insp:0,pos:0};
      acc[k].insp+=r[2]; acc[k].pos+=r[3];
    }
  }
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
  if(!tot){ box.innerHTML='<div class="herotop"><span class="herobig">Sin sectores con Control larvario ni Recuperación</span><span class="herocap">'+amb+'</span></div>'; }
  else{
    box.innerHTML='<div class="herotop"><span class="herobig">'+fmt(tot)+' sectores con Control larvario y Recuperación</span>'+
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
      '<div class="sub">Suman '+fmt(sum(alta))+' viviendas positivas a larvas (actividades: Control larvario y Recuperación).</div></div>';
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
function initMap(){
  map=L.map('map',{scrollWheelZoom:false}).setView([-6.77,-79.84],11);
  tileMapa=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'© OpenStreetMap, © CARTO',maxZoom:19});
  tileSat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'© Esri',maxZoom:19});
  tileMapa.addTo(map);
  map.on('zoomend',()=>{drawHeat();buildDots();});
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
  if(!secs.length){ box.innerHTML='<div class="empty">No hay datos de sectores para este filtro. Elige un centro de salud y un rango de fechas con registros de Control larvario o Recuperación.</div>'; return; }
  const CAP_CARDS=12, CAP_ROWS=30;
  let html='';
  // Alta -> tarjetas (tope CAP_CARDS, ya vienen ordenadas por IA desc)
  html+='<div class="zonelabel alta"><span class="zico">⚠️</span>Sectores a priorizar (mayor positividad)</div>';
  if(alta.length){
    const show=alta.slice(0,CAP_CARDS);
    html+='<div class="sectorcards">'+show.map(s=>
      '<div class="sector"><div class="snm">Sector '+s.sector+'</div><div class="sce">'+s.eess+' · '+s.red+'</div>'+
      '<div class="sia num">'+s.ia.toFixed(2)+'% <small>índice aédico</small></div>'+
      '<div class="sact">actividad: Control larvario / Recuperación</div>'+
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
  $('recipMeta').innerHTML='<b>'+ambito+'</b> · Control larvario y Recuperación · periodo elegido';
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
  $('foot').textContent='Vista de '+amb+' (actividades Control larvario y Recuperación, '+state.d1+' a '+state.d2+'). Los sectores se clasifican por su índice aédico según la norma MINSA/OPS: bajo <1%, medio/alerta ≥1% y <4%, alto ≥4%.';
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
