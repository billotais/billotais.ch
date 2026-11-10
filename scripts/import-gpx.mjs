// Turns the GPX files in src/data/activities/ into src/data/routes.json: one small,
// simplified SVG path per race. Files are matched to races by date, not by filename.
// Usage: npm run import-gpx
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/data/activities');
const races = JSON.parse(readFileSync(join(root, 'src/data/races.json'), 'utf8'));

const VIEW = 100; // routes are scaled to fit a VIEW x VIEW box
const TOLERANCE_M = 8; // Douglas-Peucker tolerance

const localDate = (iso) =>
  new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Zurich' });

function parseGpx(xml) {
  const pts = [];
  for (const m of xml.matchAll(/<trkpt lat="([-\d.]+)" lon="([-\d.]+)">([\s\S]*?)<\/trkpt>/g)) {
    pts.push({
      lat: +m[1],
      lon: +m[2],
      ele: +(m[3].match(/<ele>([-\d.]+)<\/ele>/)?.[1] ?? NaN),
      time: m[3].match(/<time>([^<]+)<\/time>/)?.[1],
    });
  }
  return pts;
}

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
function haversine(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Douglas-Peucker on metric (x, y) points
function simplify(pts, tol) {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    const { x: x1, y: y1 } = pts[s], { x: x2, y: y2 } = pts[e];
    const len = Math.hypot(x2 - x1, y2 - y1);
    let max = 0, idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = len === 0
        ? Math.hypot(pts[i].x - x1, pts[i].y - y1)
        : Math.abs((x2 - x1) * (y1 - pts[i].y) - (x1 - pts[i].x) * (y2 - y1)) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol && idx > -1) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// Elevation profile: [km, metres, lat, lon] every PROFILE_STEP_KM, with the GPS
// elevation smoothed over a ±SMOOTH-point window so the chart isn't jagged.
const PROFILE_STEP_KM = 0.1;
const SMOOTH = 6;
function profile(pts) {
  const ele = pts.map((_, i) => {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - SMOOTH); j <= Math.min(pts.length - 1, i + SMOOTH); j++) {
      if (!isNaN(pts[j].ele)) { s += pts[j].ele; n++; }
    }
    return n ? s / n : NaN;
  });
  const out = [];
  let dist = 0, next = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i) dist += haversine(pts[i - 1], pts[i]) / 1000;
    if ((dist >= next || i === pts.length - 1) && !isNaN(ele[i])) {
      out.push([+dist.toFixed(2), Math.round(ele[i]), +pts[i].lat.toFixed(5), +pts[i].lon.toFixed(5)]);
      next = dist + PROFILE_STEP_KM;
    }
  }
  return out;
}

const byDate = new Map(races.filter((r) => !r.upcoming).map((r) => [r.date, r]));
const routes = {};
const matchedSlugs = new Set();
const rows = [];

for (const file of readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.gpx')).sort()) {
  const pts = parseGpx(readFileSync(join(dir, file), 'utf8'));
  if (pts.length < 2) { rows.push([file, 'no track points', '', '']); continue; }

  let km = 0;
  for (let i = 1; i < pts.length; i++) km += haversine(pts[i - 1], pts[i]) / 1000;

  const date = localDate(pts[0].time);
  let race = byDate.get(date);
  let note = '';
  if (!race) {
    // Fall back to a race within a day whose distance is within 5% of the track
    const day = 86400000;
    race = [...byDate.values()].find((r) =>
      !matchedSlugs.has(r.slug) &&
      Math.abs(+new Date(r.date) - +new Date(date)) <= day &&
      Math.abs(r.distance - km) / r.distance < 0.05);
    if (!race) { rows.push([file, `no race on ${date}`, '', '']); continue; }
    note = ` ⚠ GPX is ${date}, race is ${race.date}`;
  }
  matchedSlugs.add(race.slug);

  // Equirectangular projection to metres
  const lat0 = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const proj = pts.map((p) => ({ x: rad(p.lon) * R * Math.cos(rad(lat0)), y: -rad(p.lat) * R, lat: p.lat, lon: p.lon }));
  const simple = simplify(proj, TOLERANCE_M);

  const xs = simple.map((p) => p.x), ys = simple.map((p) => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const w = Math.max(...xs) - minX, h = Math.max(...ys) - minY;
  const scale = VIEW / Math.max(w, h);
  const f = (n) => +n.toFixed(1);
  const d = simple
    .map((p, i) => `${i ? 'L' : 'M'}${f((p.x - minX) * scale)} ${f((p.y - minY) * scale)}`)
    .join('');

  // Real coordinates for the map (same simplified points as the SVG)
  const ll = simple.map((p) => [+(p.lat).toFixed(5), +(p.lon).toFixed(5)]);

  // Climb/descent from the smoothed profile: summing raw GPS elevation counts its noise as climbing
  const prof = profile(pts);
  let up = 0, down = 0;
  for (let i = 1; i < prof.length; i++) {
    const dEle = prof[i][1] - prof[i - 1][1];
    if (dEle > 0) up += dEle; else down -= dEle;
  }

  routes[race.slug] = { w: f(w * scale), h: f(h * scale), d, km: +km.toFixed(2), gain: up, loss: down, ll, prof };
  rows.push([file, race.slug + note, `${km.toFixed(1)} km (race: ${race.distance})`, `${simple.length} pts`]);
}

const matched = new Set(Object.keys(routes));
for (const r of races.filter((r) => !r.upcoming && !matched.has(r.slug))) {
  rows.push(['—', `${r.slug}: no GPX`, '', '']);
}

writeFileSync(join(root, 'src/data/routes.json'), JSON.stringify(routes));
console.table(rows.map(([file, race, dist, pts]) => ({ file, race, track: dist, simplified: pts })));
