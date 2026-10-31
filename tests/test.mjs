import fs from 'fs'; import earcut from 'earcut'; import {execSync} from 'child_process';
globalThis.earcut = earcut;
const html = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const core = html.split('// ==CORE-START==')[1].split('// ==CORE-END==')[0];
const names='designOf designApply designCode designParse roundedRect polyArea Soup layout lidDims validate buildBox buildLid soupVolume soupToStl makeZip crc32 parseFractions hingeGeom hingeBoxProfile hingeLidProfile circlePoly convexHull latchOf snapGeom magnetGeom clipGeom traceMask nestLoops labelGeom sideLabels'.split(' ');
fs.writeFileSync('core.mjs', core + '\nexport {'+names.join(',')+'};');
const C = await import('./core.mjs?'+Date.now());
let fail=0; const ok=(c,m)=>{console.log((c?'OK   ':'FAIL ')+m); if(!c) fail++;};
const base={mode:'outer',W:150,D:100,H:35,cols:4,rows:3,colFr:'',rowFr:'',divT:1.2,wall:1.6,floor:1.2,corner:4,lidType:'skirt',pin:1.75,knuckles:0,tol:0.25,plate:2,skirt:6,bed:256,nozzle:0.4};
const cfgs={
 tornillos:base,
 sinradio:{...base,corner:0},
 grande:{...base,corner:20,cols:1,rows:1},
 fr:{...base,cols:3,rows:2,colFr:'1,2,1',rowFr:'2,1',corner:10},
 inner:{...base,mode:'inner',W:60,D:40,H:20,cols:2,rows:2},
 uno:{...base,cols:1,rows:1,corner:3,wall:2,floor:2},
 hinge:{...base,lidType:'hinge'},
 hingeSharp:{...base,lidType:'hinge',corner:0,W:80,D:60,H:20,cols:2,rows:2},
 hinge3:{...base,lidType:'hinge',pin:3,knuckles:3,W:100,corner:12,H:14,cols:1,rows:1},
 hinge7:{...base,lidType:'hinge',W:220,D:140,cols:3,rows:2,knuckles:7},
 grid12:{...base,W:240,D:240,cols:12,rows:12,divT:0.8,corner:6},
 clic:{...base,latch:'snap',snapB:0.3},
 clicSinRadio:{...base,latch:'snap',snapB:0.4,corner:0,cols:1,rows:1},
 imanes:{...base,latch:'magnet',magD:6,magH:2},
 imanesUno:{...base,latch:'magnet',magD:8,magH:3,cols:1,rows:1,corner:15,H:40},
 imanesSinRadio:{...base,latch:'magnet',magD:5,magH:1,corner:0,plate:3},
 imanesBisagra:{...base,lidType:'hinge',latch:'magnet',magD:6,magH:2},
 imanesBisagraFila:{...base,lidType:'hinge',latch:'magnet',magD:6,magH:2,cols:3,rows:1,corner:0},
 pestillo:{...base,lidType:'hinge',latch:'clip'},
 pestilloRedondo:{...base,lidType:'hinge',latch:'clip',corner:12,W:90,D:60,H:20,cols:2,rows:1},
};
fs.mkdirSync('out',{recursive:true});
for (const [k,p] of Object.entries(cfgs)){
  const v=C.validate(p); ok(v.errors.length===0, k+': sin errores ('+v.warns.length+' avisos)');
  const box=C.buildBox(p), lid=C.buildLid(p);
  fs.writeFileSync(`out/${k}.stl`, C.soupToStl(box,k)); fs.writeFileSync(`out/${k}_tapa.stl`, C.soupToStl(lid,k));
  // volumen analítico con los mismos polígonos discretizados
  const L=C.layout(p); const R=Math.min(p.corner,L.OW/2,L.OD/2); const A=C.polyArea(C.roundedRect(0,0,L.OW,L.OD,R));
  const rp=Math.max(0,R-p.wall); let Ap=0; for(const [y0,y1] of L.ys) for(const [x0,x1] of L.xs){const rr=Math.min(rp,(x1-x0)/2*.95,(y1-y0)/2*.95); Ap+=C.polyArea(C.roundedRect(x0,y0,x1,y1,rr));}
  const exp=A*L.OH-Ap*(L.OH-p.floor); const got=C.soupVolume(box);
  const lt=C.latchOf(p);
  if(lt!=='none'){ ok(got>0, k+': volumen caja '+got.toFixed(1)+' (cierre '+lt+')'); ok(C.soupVolume(lid)>0, k+': volumen tapa '+C.soupVolume(lid).toFixed(1)); }
  else if(p.lidType==='hinge') ok(got>exp, k+': volumen caja con nudillos '+got.toFixed(1)+' > '+exp.toFixed(1)); else ok(Math.abs(got-exp)<1e-3*exp, k+': volumen caja '+got.toFixed(1)+' ≈ '+exp.toFixed(1));
  if(lt!=='none'){} else if(p.lidType==='hinge'){ ok(C.soupVolume(lid)>0,k+': volumen tapa bisagra '+C.soupVolume(lid).toFixed(1)); } else {
  const d=C.lidDims(p,L); const Ro=R+d.e, Ri=R+p.tol;
  const expL=C.polyArea(C.roundedRect(0,0,d.LW,d.LD,Ro))*d.LH-C.polyArea(C.roundedRect(p.wall,p.wall,d.LW-p.wall,d.LD-p.wall,Ri))*(d.LH-p.plate);
  ok(Math.abs(C.soupVolume(lid)-expL)<1e-3*expL, k+': volumen tapa'); }
  for (const f of [`out/${k}.stl`,`out/${k}_tapa.stl`]){
    const o=execSync(`node check-stl.mjs ${f}`).toString(); ok(/STL VÁLIDO/.test(o), f+' sólido cerrado\n'+o.split('\n').filter(l=>/aristas/.test(l)).join(''));
  }
}
// holgura lid: la cavidad de la tapa contiene la caja con tol
{const p=base; const L=C.layout(p); const d=C.lidDims(p,L); ok(Math.abs((d.LW-2*p.wall)-(L.OW+2*p.tol))<1e-9,'cavidad de tapa = caja + 2·holgura');}
// errores
ok(C.validate({...base,wall:60}).errors.length>0,'pared enorme -> error');
ok(C.validate({...base,cols:12,W:30}).errors.length>0,'huecos minúsculos -> error');
ok(C.validate({...base,W:300}).warns.some(w=>/cama/.test(w)),'aviso de cama');
ok(C.validate({...base,colFr:'1,2'}).warns.some(w=>/reparto/.test(w)),'aviso reparto incoherente');
// cierres: volúmenes relativos al mismo modelo sin cierre
{const vb=p=>C.soupVolume(C.buildBox(p)), vl=p=>C.soupVolume(C.buildLid(p));
 const s={...base,latch:'snap',snapB:0.3}; ok(vb(s)>vb(base)&&vl(s)>vl(base),'clic: la caja y la tapa ganan su cordón');
 const g=C.snapGeom(s); ok(g.lid[0]-g.box[1]>=0.2-1e-9&&g.lid[1]<=s.skirt-0.6+1e-9,'clic: el cordón de la tapa queda por debajo del de la caja y dentro del borde');
 for(const [R,d] of [[0,6],[4,6],[15,8],[30,10]]){ const q={...base,latch:'magnet',magD:d,magH:2,corner:R,cols:1,rows:1,W:200,D:150}; const L=C.layout(q), M=C.magnetGeom(q,L);
   const far=R>M.c?Math.SQRT2*(R-M.c)+M.rHole:0; ok(M.c-M.rHole>=1-1e-9&&(far===0||far<=R-1+1e-9),'imanes: el hueco queda dentro de la pared con esquina de '+R+' mm (c='+M.c.toFixed(2)+')'); }
 const m={...base,latch:'magnet',magD:6,magH:2}; ok(vb(m)>vb(base),'imanes: las columnas añaden más material del que quitan los huecos');
 const M=C.magnetGeom(m,C.layout(m)); ok(M.pts.length===4&&Math.abs(M.Db-(2+0.2+0.6))<1e-9,'imanes: 4 esquinas, hueco de caja 2,8 mm (el imán de la tapa sobresale 0,6)');
 const mh={...base,lidType:'hinge',latch:'magnet',magD:6,magH:2}; ok(C.magnetGeom(mh,C.layout(mh)).pts.length===2,'imanes con bisagra: solo las 2 esquinas delanteras');
 const c={...base,lidType:'hinge',latch:'clip'}, h={...base,lidType:'hinge'}; ok(vb(c)>vb(h)&&vl(c)<vl(h),'pestillo: lengüeta en la caja y la tapa pierde la pestaña');
 ok(C.latchOf({...base,latch:'clip'})==='none'&&C.latchOf({...base,lidType:'none',latch:'magnet'})==='none'&&C.latchOf({...h,latch:'snap'})==='none','cierres incompatibles con la tapa se ignoran');
 ok(C.validate({...base,latch:'snap',snapB:0.3,skirt:2}).errors.length>0,'clic con borde muy bajo -> error');
 ok(C.validate({...base,latch:'magnet',magD:6,magH:2,cols:12,W:120}).errors.length>0,'imanes en compartimentos estrechos -> error');
 ok(C.validate({...h,latch:'clip',H:10}).errors.length>0,'pestillo en caja baja -> error');
}
// texto: máscara sintética con un anillo (agujero), un punto dentro del agujero, una barra y dos píxeles en diagonal
{const w=120,h=60,m=new Uint8Array(w*h),set=(x,y)=>{m[y*w+x]=1;};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const r=Math.hypot(x-30,y-30); if(r<26&&r>16) set(x,y); if(r<6) set(x,y); if(x>70&&x<110&&y>20&&y<40) set(x,y);}
 set(64,5); set(65,6); set(66,5); set(64,7); // cruces en diagonal
 const T=C.traceMask(m,w,h); const nodes=C.nestLoops(T.loops); const depths=nodes.map(n=>n.depth).sort();
 ok(T.loops.length>=5&&depths.includes(2)&&depths.includes(1),'texto: contornos trazados '+T.loops.length+', profundidades '+depths.join(','));
 const label={loops:T.loops,bbox:T.bbox,unit:1/60};
 const tcfg={
  textoEncajada:{...base,label,labelSize:30,labelDepth:0.6},
  textoEncajadaImanes:{...base,label,labelSize:30,labelDepth:0.8,latch:'magnet',magD:6,magH:2},
  textoBisagraRelieve:{...base,lidType:'hinge',label,labelSize:30,labelMode:'emboss',labelDepth:0.8},
  textoBisagraGrabado:{...base,lidType:'hinge',label,labelSize:30,labelMode:'engrave',labelDepth:1,latch:'clip'},
  textoGrande:{...base,lidType:'hinge',label,labelSize:400,labelMode:'emboss',labelDepth:0.6},
 };
 for(const [k,p] of Object.entries(tcfg)){
  const v=C.validate(p); ok(v.errors.length===0,k+': sin errores ('+v.warns.join(' | ')+')');
  const lid=C.buildLid(p), plain=C.buildLid({...p,label:null}); fs.writeFileSync(`out/${k}_tapa.stl`,C.soupToStl(lid,k));
  const o=execSync(`node check-stl.mjs out/${k}_tapa.stl`).toString(); ok(/STL VÁLIDO/.test(o),k+' sólido cerrado '+o.split('\n').filter(l=>/aristas|caja X/.test(l)).join(' '));
  const g=C.labelGeom(p,C.layout(p)); const dv=C.soupVolume(lid)-C.soupVolume(plain);
  ok(g.mode==='emboss'?dv>0:dv<0, k+': '+(g.mode==='emboss'?'relieve suma':'grabado quita')+' '+dv.toFixed(1)+' mm³, ajuste '+g.fit.toFixed(2));
 }
 const all={lid:false,front:true,back:true,left:true,right:true};
 const scfg={
  ladosRelieve:{...base,label,labelSize:14,labelMode:'emboss',labelDepth:0.6,labelOn:all},
  ladosGrabado:{...base,label,labelSize:14,labelMode:'engrave',labelDepth:0.6,labelOn:all,wall:2},
  ladosClic:{...base,label,labelSize:14,labelMode:'emboss',labelDepth:0.6,labelOn:all,latch:'snap',snapB:0.3},
  ladosSinRadio:{...base,label,labelSize:14,labelMode:'emboss',labelDepth:0.8,labelOn:all,corner:0,lidType:'none'},
  ladosImanes:{...base,label,labelSize:14,labelMode:'emboss',labelDepth:0.6,labelOn:{...all,lid:true},latch:'magnet',magD:6,magH:2},
  ladosBisagraPestillo:{...base,label,labelSize:14,labelMode:'emboss',labelDepth:0.6,labelOn:all,lidType:'hinge',latch:'clip'},
 };
 for(const [k,p] of Object.entries(scfg)){
  const v=C.validate(p); ok(v.errors.length===0,k+': sin errores ('+v.warns.join(' | ')+')');
  const box=C.buildBox(p), plain=C.buildBox({...p,label:null}); fs.writeFileSync(`out/${k}.stl`,C.soupToStl(box,k));
  const o=execSync(`node check-stl.mjs out/${k}.stl`).toString(); ok(/STL VÁLIDO/.test(o),k+' sólido cerrado '+o.split('\n').filter(l=>/aristas/.test(l)).join(' '));
  const L=C.layout(p), sl=C.sideLabels(p,L,C.roundedRect(0,0,L.OW,L.OD,Math.max(0,Math.min(p.corner,L.OW/2,L.OD/2)))); const dv=C.soupVolume(box)-C.soupVolume(plain);
  ok(sl.length===(p.lidType==='hinge'?2:4)-(p.latch==='clip'?0:0)&&(p.labelMode==='emboss'?dv>0:dv<0), k+': '+sl.map(s=>s.side).join(',')+', Δvolumen '+dv.toFixed(1));
 }
 ok(C.validate({...scfg.ladosGrabado,wall:1.2}).errors.some(e=>/laterales/.test(e)),'grabado lateral más hondo que la pared -> error');
 ok(C.validate({...scfg.ladosRelieve,H:9}).errors.some(e=>/lateral/.test(e)),'caja baja con tapa encajada -> sin sitio en el lateral');
 ok(C.validate(tcfg.textoGrande).warns.some(w=>/reducido/.test(w)),'texto enorme -> se reduce y avisa');
 ok(C.validate({...tcfg.textoEncajada,labelDepth:1.8}).errors.length>0,'grabado más hondo que el plato -> error');
 ok(C.labelGeom({...base,lidType:'none',label},C.layout(base))===null,'sin tapa no hay texto');
 globalThis.labelCfgs={...tcfg,...scfg};
}
// zip
const z=C.makeZip([{name:'a.stl',data:new Uint8Array([1,2,3,4,5])},{name:'b_tapa.stl',data:C.soupToStl(C.buildLid(base),'x')}]);
fs.writeFileSync('out/t.zip',z); const u=execSync('unzip -t out/t.zip 2>&1').toString(); ok(/No errors detected/.test(u),'zip válido\n'+u);
// mensajes en inglés: todo lo que sale en castellano tiene traducción y no quedan {huecos}
{
 const all={...cfgs,
  frMal:{...base,cols:3,colFr:'1,2'}, paredFina:{...base,wall:0.6}, paredRara:{...base,wall:1.5}, sepFino:{...base,divT:0.5},
  holgura:{...base,tol:0.05}, holgura2:{...base,tol:0.7}, bordeAlto:{...base,skirt:50},
  bisagraBaja:{...base,lidType:'hinge',H:6}, bisagraEstrecha:{...base,lidType:'hinge',W:20,cols:1,rows:1}, platoFino:{...base,lidType:'hinge',plate:1},
  clicSuave:{...base,latch:'snap',snapB:0.1,tol:0.1}, clicDuro:{...base,latch:'snap',snapB:0.6,tol:0.1}, clicBajo:{...base,latch:'snap',skirt:2},
  imanBajo:{...base,latch:'magnet',H:4}, imanPlato:{...base,latch:'magnet',plate:1}, imanChico:{...base,latch:'magnet',cols:12,rows:12,W:100,D:100},
  pestilloBajo:{...base,lidType:'hinge',latch:'clip',H:10}, cama:{...base,W:400}, vacio:{...base,wall:60},
  ...globalThis.labelCfgs};
 let n=0, miss=new Set();
 for(const [k,c] of Object.entries(all)){
  const es=C.validate({...c,lang:'es'}), en=C.validate({...c,lang:'en'});
  for(const f of ['errors','warns','oks']) en[f].forEach((m,i)=>{ n++; if(m===es[f][i]||/[{}]|[áéíóúñ¿¡]/.test(m)) miss.add(k+': '+m); });
 }
 ok(miss.size===0,'mensajes en inglés traducidos ('+n+' revisados)'+(miss.size?'\n  '+[...miss].join('\n  '):''));
}
// diseños guardados
{
 const defs={...base,latch:'none',snapB:0.3,magD:6,magH:2,text:'',font:'sans',labelSize:12,labelMode:'emboss',labelDepth:0.6,color:'#d3d0c6',useCells:false,useText:false,usePrinter:false,useLid:false};
 const S={...defs,W:123.5,lidType:'hinge',latch:'magnet',text:'TORNILLOS 🔩\nM3',font:'serif',labelOn:{lid:false,front:true},color:'#2f6fb0',useCells:true,useText:true,usePrinter:false,useLid:true,show:'both',open:40};
 const d=C.designOf(S), back=C.designApply(C.designParse(C.designCode(d)),defs);
 const same=Object.keys(back).every(k=>JSON.stringify(back[k])===JSON.stringify(S[k]));
 ok(same && !('show' in back) && !('open' in back),'diseño: código -> mismos parámetros (con emojis y saltos de línea)');
 ok(JSON.stringify(C.designApply(C.designParse('https://x.test/caja.html#d='+C.designCode(d)),defs))===JSON.stringify(back),'diseño: se lee desde un enlace');
 ok(JSON.stringify(C.designApply(C.designParse(JSON.stringify(d,null,2)),defs))===JSON.stringify(back),'diseño: se lee desde el JSON exportado');
 const old=C.designApply({app:'cajas-a-medida',v:1,W:80,lidType:'tapa rara',cols:'3',color:'red',futuro:1},defs);
 ok(old.W===80&&old.lidType==='skirt'&&old.cols===defs.cols&&old.color==='#d3d0c6'&&old.text===''&&!('futuro' in old),'diseño: campos que faltan o inválidos -> valores por defecto');
 const v0=C.designApply({app:'cajas-a-medida',v:1,cols:3,rows:1,text:' ',nozzle:0.6},defs), v1=C.designApply({app:'cajas-a-medida',v:1,cols:3,useCells:false,text:'A'},defs);
 ok(v0.useCells&&!v0.useText&&v0.usePrinter&&!v1.useCells&&v1.useText,'diseño viejo: se activan los apartados que usaba');
 const l0=C.designApply({app:'cajas-a-medida',v:1,lidType:'none'},defs), l1=C.designApply({app:'cajas-a-medida',v:1,lidType:'hinge'},defs);
 ok(!l0.useLid&&l0.lidType==='skirt'&&l1.useLid&&l1.lidType==='hinge','diseño viejo: «sin tapa» pasa a tapa apagada');
 let bad=0; for(const x of [{v:1},null,'hola',{app:'cajas-a-medida'}]) try{C.designApply(x,defs)}catch(e){bad++}
 ok(bad===4,'diseño: lo que no es un diseño se rechaza');
 let badc=0; for(const x of ['no es código!','https://x.test/#d=@@']) try{C.designParse(x)}catch(e){badc++}
 ok(badc===2,'diseño: códigos inválidos se rechazan');
 ok(!C.validate({...C.designApply(d,defs),pin:1.75,knuckles:0,tol:0.25,plate:2,skirt:6,bed:256,nozzle:0.4}).errors.length,'diseño abierto se valida sin errores');
}
console.log(fail?'HAY FALLOS '+fail:'Todas las pruebas pasan'); process.exit(fail?1:0);
