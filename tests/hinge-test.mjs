import fs from 'fs'; import earcut from 'earcut'; globalThis.earcut=earcut;
const C = await import('./core.mjs?h'+Date.now());
const base={mode:'outer',W:150,D:100,H:35,cols:4,rows:3,colFr:'',rowFr:'',divT:1.2,wall:1.6,floor:1.2,corner:4,lidType:'hinge',pin:1.75,knuckles:0,tol:0.25,plate:2,skirt:6,bed:256,nozzle:0.4};
let fail=0; const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m); if(!c) fail++;};
const inPoly=(pt,poly)=>{ let c=false; for(let i=0,j=poly.length-1;i<poly.length;j=i++){ const [xi,yi]=poly[i],[xj,yj]=poly[j]; if(((yi>pt[1])!==(yj>pt[1]))&&(pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi)) c=!c;} return c; };
const rect=(y0,z0,y1,z1)=>[[y0,z0],[y1,z0],[y1,z1],[y0,z1]];
const sample=(poly,step)=>{ const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]); const pts=[]; for(let y=Math.min(...xs);y<=Math.max(...xs);y+=step) for(let z=Math.min(...ys);z<=Math.max(...ys);z+=step) if(inPoly([y,z],poly)) pts.push([y,z]); return pts; };
// ¿penetran dos polígonos más de eps? muestreo de A dentro de B encogido (comprobación por distancia al borde)
const distEdge=(pt,poly)=>{ let d=1e9; for(let i=0;i<poly.length;i++){ const a=poly[i],b=poly[(i+1)%poly.length]; const dx=b[0]-a[0],dy=b[1]-a[1]; const t=Math.max(0,Math.min(1,((pt[0]-a[0])*dx+(pt[1]-a[1])*dy)/(dx*dx+dy*dy))); d=Math.min(d,Math.hypot(pt[0]-a[0]-t*dx,pt[1]-a[1]-t*dy)); } return d; };
function minClear(moving, statics, ang, ax){ // devuelve penetración máxima (>0 = choque)
  const c=Math.cos(-ang), s=Math.sin(-ang); let pen=0;
  const rot=p=>{ const y=p[0]-ax[0], z=p[1]-ax[1]; return [ax[0]+y*c-z*s, ax[1]+y*s+z*c]; };
  const mp=moving.map(rot);
  for(const pt of mp) for(const st of statics) if(inPoly(pt,st)) pen=Math.max(pen,distEdge(pt,st));
  return pen;
}
for (const [name,p] of Object.entries({normal:base, sharp:{...base,corner:0,W:80,D:60,H:20}, redondo:{...base,corner:12,W:100,H:14,pin:3,knuckles:3}, pin2:{...base,pin:2,plate:1.6}})) {
  const L=C.layout(p), G=C.hingeGeom(p,L); ok(G.ok,name+': bisagra viable, '+G.n+' nudillos de '+G.seg.toFixed(1)+' mm');
  const axis=[G.yc,G.zc];
  const boxProf=C.hingeBoxProfile(L,G);
  const wall=rect(L.OD-p.wall,0,L.OD,L.OH);
  // Rango de nudillos de la caja: plato recortado frente al perfil de la caja
  const plateBox = rect(-G.tab?0:0, L.OH, G.yRec, L.OH+p.plate); // en x de nudillo de caja (sin lengüeta)
  let worst=0; for(let a=0;a<=125;a+=1){ worst=Math.max(worst, minClear(sample(plateBox,0.15), [boxProf,wall], a*Math.PI/180, axis)); }
  ok(worst<0.02, name+': plato recortado vs nudillo de caja sin choque (penetración máx '+worst.toFixed(3)+' mm)');
  // Nudillo de la tapa (en sistema cama z=0 → subir OH) y plato continuo frente a la pared
  const lidProf=C.hingeLidProfile(p,L,G).map(q=>[q[0],q[1]+L.OH]);
  const plateFull=rect(0,L.OH,L.OD-G.ov,L.OH+p.plate);
  let w2=0; for(let a=0;a<=125;a+=1){ w2=Math.max(w2,minClear(sample(plateFull,0.15).concat(lidProf.filter((_,i)=>true)),[wall],a*Math.PI/180,axis)); }
  ok(w2<0.02, name+': tapa (plato + nudillo) vs pared sin choque (penetración máx '+w2.toFixed(3)+' mm)');
  // Cerrada: el plato recortado no toca el perfil de la caja
  ok(minClear(sample(plateBox,0.1),[boxProf],0,axis)===0, name+': cerrada, sin interferencia');
  // Holgura del taladro respecto al borde del perfil
  const hole=C.circlePoly(G.yc,G.zc,G.rh,28);
  ok(Math.min(...hole.map(h=>distEdge(h,boxProf)))>=1.55, name+': pared mínima alrededor del pasador ≥ 1,55 mm');
  // Voladizos del nudillo de la caja ≥45° (aristas de la parte inferior)
  let minAng=90; for(let i=0;i<boxProf.length;i++){ const a=boxProf[i],b=boxProf[(i+1)%boxProf.length]; const dy=b[1]-a[1], dx=b[0]-a[0]; if(dy<-1e-9 || (Math.abs(dy)<1e-9&&false)) {} /* borde descendente: cara inferior en CCW va con dx>0 */ if(dx>1e-9 && b[1] < G.zc+0.01 ){ const ang=Math.atan2(Math.abs(dy),dx)*180/Math.PI; minAng=Math.min(minAng,ang);} }
  console.log('     ángulo mínimo cara inferior (desde horizontal):',minAng.toFixed(1)); 
}
console.log(fail?'HAY FALLOS '+fail:'Cinemática OK'); process.exit(fail?1:0);
