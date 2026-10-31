import fs from 'node:fs';

const file = process.argv[2];
const buf = fs.readFileSync(file);
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
const n = dv.getUint32(80, true);
console.log('archivo', file.split('/').pop());
console.log('bytes', buf.length, 'esperado', 84 + 50 * n, buf.length === 84 + 50 * n ? 'OK' : 'FAIL');
console.log('triángulos', n, '| cabecera:', buf.subarray(0, 28).toString('latin1'));

const key = (x, y, z) => x.toFixed(6) + ',' + y.toFixed(6) + ',' + z.toFixed(6);
const edges = new Map();
let vol = 0, degenerate = 0, badNormal = 0;
const bb = [Infinity, -Infinity, Infinity, -Infinity, Infinity, -Infinity];
for (let t = 0; t < n; t++) {
  const o = 84 + t * 50;
  const nrm = [dv.getFloat32(o, true), dv.getFloat32(o + 4, true), dv.getFloat32(o + 8, true)];
  const v = [];
  for (let k = 0; k < 3; k++) {
    const x = dv.getFloat32(o + 12 + k * 12, true), y = dv.getFloat32(o + 16 + k * 12, true), z = dv.getFloat32(o + 20 + k * 12, true);
    v.push([x, y, z]);
    bb[0] = Math.min(bb[0], x); bb[1] = Math.max(bb[1], x);
    bb[2] = Math.min(bb[2], y); bb[3] = Math.max(bb[3], y);
    bb[4] = Math.min(bb[4], z); bb[5] = Math.max(bb[5], z);
  }
  const [a, b, c] = v;
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
  const len = Math.hypot(cx, cy, cz);
  if (len < 1e-9) degenerate++;
  else if (cx * nrm[0] + cy * nrm[1] + cz * nrm[2] < 0.99 * len) badNormal++;
  vol += (a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0])) / 6;
  const ks = v.map(p => key(...p));
  for (let k = 0; k < 3; k++) { const e = ks[k] + '>' + ks[(k + 1) % 3]; edges.set(e, (edges.get(e) || 0) + 1); }
}
let dup = 0, unmatched = 0;
for (const [e, c] of edges) {
  if (c > 1) dup++;
  const [a, b] = e.split('>');
  if (edges.get(b + '>' + a) !== c) unmatched++;
}
console.log('aristas', edges.size, '| repetidas', dup, '| sin pareja', unmatched, '| triángulos degenerados', degenerate, '| normales que no coinciden con el giro', badNormal);
console.log('caja X', bb[0].toFixed(2), bb[1].toFixed(2), 'Y', bb[2].toFixed(2), bb[3].toFixed(2), 'Z', bb[4].toFixed(2), bb[5].toFixed(2));
console.log('volumen', vol.toFixed(1), 'mm³ ->', (vol / 1000).toFixed(1), 'cm³', vol > 0 ? 'OK (positivo)' : 'FAIL');
console.log(dup === 0 && unmatched === 0 && badNormal === 0 && buf.length === 84 + 50 * n && vol > 0 ? 'STL VÁLIDO: sólido cerrado' : 'STL CON PROBLEMAS');
