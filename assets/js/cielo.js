/* ══════════════════════════════════════════════════════════════
   Cielo — motor que dibuja el cielo nocturno en un <canvas>.
   No necesitas editar este archivo.
══════════════════════════════════════════════════════════════ */
const Cielo = (() => {
"use strict";

const TAU = Math.PI * 2;
const reducido = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

const COL = {
  blanco: [255, 255, 255], azul: [186, 208, 255], calido: [255, 228, 196],
  rosa: [255, 160, 205], oro: [255, 208, 138], lila: [198, 180, 255],
};

let cv, ctx, W = 0, H = 0, DPR = 1;
let t = 0, ultimo = 0, activo = true;
let N = 20;

const cam = { x: 0, y: 0, z: 1 };
const par = { x: 0, y: 0, mx: 0, my: 0 };
const fx = { mem: 0, warp: 0, final: 0, cometa: 0, flash: 0, brillo: 1 };

let interactivo = false, conFugaces = false, pista = -1, hoverIdx = -1;
let margen = { top: 100, bottom: 120 };
let capas = [], bokeh = [], fugaces = [], parts = [], anillos = [], warpP = [];
let mem = [], lineas = [];
let geo = null, nebula = null, polvo = null, gradBase = null;
let proxFugaz = 3;
const spr = {};
const oyentes = {};

/* ─────────── utilidades ─────────── */
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let r = Math.imul(a ^ (a >>> 15), 1 | a);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const suave = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
function lienzo(w, h) { const c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h); return c; }
function emitir(ev, ...a) { (oyentes[ev] || []).forEach(f => f(...a)); }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }

/* ─────────── sprites pre-renderizados ─────────── */
function spriteBrillo(col) {
  const S = 64, c = lienzo(S, S), g = c.getContext("2d");
  const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(.1, rgba(col, .92));
  gr.addColorStop(.28, rgba(col, .34));
  gr.addColorStop(.6, rgba(col, .07));
  gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return c;
}
function spriteDestello(col) {
  const S = 256, m = S / 2, c = lienzo(S, S), g = c.getContext("2d");
  g.globalCompositeOperation = "lighter";
  let gr = g.createRadialGradient(m, m, 0, m, m, m * .6);
  gr.addColorStop(0, rgba(col, .6)); gr.addColorStop(.22, rgba(col, .2)); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  const rayo = (ang, len, grosor, a) => {
    g.save(); g.translate(m, m); g.rotate(ang); g.scale(1, grosor / len);
    const r = g.createRadialGradient(0, 0, 0, 0, 0, len);
    r.addColorStop(0, rgba(COL.blanco, a)); r.addColorStop(.18, rgba(col, a * .65)); r.addColorStop(1, rgba(col, 0));
    g.fillStyle = r; g.beginPath(); g.arc(0, 0, len, 0, TAU); g.fill(); g.restore();
  };
  rayo(0, m, 5, .95); rayo(Math.PI / 2, m, 5, .95);
  rayo(Math.PI / 4, m * .4, 3.5, .45); rayo(-Math.PI / 4, m * .4, 3.5, .45);
  gr = g.createRadialGradient(m, m, 0, m, m, m * .17);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.35, "rgba(255,255,255,.85)"); gr.addColorStop(1, rgba(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return c;
}
function crearSprites() {
  for (const k in COL) spr[k] = spriteBrillo(COL[k]);
  spr.dOro = spriteDestello(COL.oro);
  spr.dLila = spriteDestello(COL.lila);
  spr.dBlanco = spriteDestello(COL.azul);
  spr.dRosa = spriteDestello(COL.rosa);
}
function sprite(img, x, y, s, a) {
  if (a <= .004 || s <= .2) return;
  ctx.globalAlpha = a > 1 ? 1 : a;
  ctx.drawImage(img, x - s / 2, y - s / 2, s, s);
}

/* ─────────── fondo: degradado, nebulosa y vía láctea ─────────── */
function crearFondo() {
  gradBase = ctx.createLinearGradient(0, 0, 0, H);
  gradBase.addColorStop(0, "#030209");
  gradBase.addColorStop(.45, "#080519");
  gradBase.addColorStop(.8, "#120a28");
  gradBase.addColorStop(1, "#1b0c2c");

  const r = mulberry(7);
  const fw = W * 1.4, fh = H * 1.4, D = Math.max(fw, fh);
  const bx = u => fw * u, by = u => fh * (.84 - .66 * u);   // eje de la banda

  /* nebulosa (media resolución, es difusa) */
  const q = .5;
  nebula = lienzo(Math.ceil(fw * q), Math.ceil(fh * q));
  const g = nebula.getContext("2d");
  g.scale(q, q);
  const mancha = (x, y, rad, col, a) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, rgba(col, a)); gr.addColorStop(.45, rgba(col, a * .42)); gr.addColorStop(1, rgba(col, 0));
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  g.globalCompositeOperation = "lighter";
  mancha(fw * .12, fh * .08, D * .5, [38, 28, 112], .26);
  mancha(fw * .92, fh * .96, D * .55, [112, 30, 92], .22);
  mancha(fw * .5, fh * .55, D * .32, [64, 38, 140], .12);
  const tonos = [[96, 52, 176], [156, 58, 140], [52, 84, 176], [36, 112, 156], [176, 80, 124], [120, 64, 190]];
  for (let k = 0; k < 26; k++) {
    const u = k / 25;
    mancha(bx(u) + (r() - .5) * D * .08, by(u) + (r() - .5) * D * .1, D * (.08 + r() * .15), tonos[k % tonos.length], .09 + r() * .1);
  }
  g.globalCompositeOperation = "source-over";
  for (let k = 0; k < 12; k++) {
    const u = r();
    mancha(bx(u) + (r() - .5) * D * .05, by(u) + (r() - .5) * D * .05, D * (.03 + r() * .06), [4, 2, 12], .22 + r() * .2);
  }

  /* polvo de estrellas a lo largo de la vía láctea */
  const qp = Math.min(DPR, 1.5);
  polvo = lienzo(Math.ceil(fw * qp), Math.ceil(fh * qp));
  const gp = polvo.getContext("2d");
  gp.scale(qp, qp);
  let dx = fw, dy = -fh * .66; const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
  const px = -dy, py = dx;
  const nd = Math.min(3200, (fw * fh) / 230);
  const tintes = ["255,255,255", "255,236,214", "214,226,255", "255,214,236"];
  for (let i = 0; i < nd; i++) {
    const u = r(), off = gauss(r) * D * .065;
    const x = bx(u) + px * off, y = by(u) + py * off;
    const s = .3 + r() * .95;
    const a = (.12 + r() * .55) * (1 - Math.min(1, Math.abs(off) / (D * .2)));
    gp.fillStyle = `rgba(${tintes[(r() * tintes.length) | 0]},${a.toFixed(3)})`;
    gp.beginPath(); gp.arc(x, y, s, 0, TAU); gp.fill();
  }
}
function capaImagen(img, d, a) {
  const zz = 1 + (cam.z - 1) * d;
  const fw = W * 1.4 * zz, fh = H * 1.4 * zz;
  ctx.globalAlpha = a;
  ctx.drawImage(img, W / 2 - fw / 2 - cam.x * d * zz + par.x * d, H / 2 - fh / 2 - cam.y * d * zz + par.y * d, fw, fh);
}

/* ─────────── capas de estrellas con paralaje ─────────── */
function crearCapas() {
  const r = mulberry(11);
  const FW = W * 1.4, FH = H * 1.4;
  const base = clamp(W * H / 1250, 300, 1250) * (reducido ? .6 : 1);
  const defs = [{ d: .18, f: .58, s: [.45, 1.05] }, { d: .38, f: .3, s: [.75, 1.6] }, { d: .62, f: .12, s: [1.15, 2.5] }];
  capas = defs.map(df => ({
    d: df.d,
    it: Array.from({ length: Math.round(base * df.f) }, () => {
      const c = r();
      return {
        x: r() * FW, y: r() * FH, s: df.s[0] + r() * (df.s[1] - df.s[0]),
        a: .35 + r() * .65, v: .4 + r() * 2.4, f: r() * TAU,
        c: c < .6 ? "blanco" : c < .79 ? "azul" : c < .93 ? "calido" : "rosa",
        fl: df.d > .6 && r() < .1,
      };
    }),
  }));
  bokeh = Array.from({ length: reducido ? 5 : 12 }, () => ({
    x: r() * FW, y: r() * FH, s: 50 + r() * 130, a: .025 + r() * .05,
    c: ["rosa", "lila", "oro", "azul"][(r() * 4) | 0], vx: (r() - .5) * 7, vy: (r() - .5) * 5,
  }));
}
function envolver(v, periodo, visible) {
  const m = (periodo - visible) / 2;
  return ((((v + m) % periodo) + periodo) % periodo) - m;
}
function dibujarCapas() {
  const FW = W * 1.4, FH = H * 1.4;
  for (const cp of capas) {
    const d = cp.d, zz = 1 + (cam.z - 1) * d;
    const ox = -cam.x * d * zz + par.x * d, oy = -cam.y * d * zz + par.y * d;
    const PW = FW * zz, PH = FH * zz, k = 1 + (zz - 1) * .5;
    for (const s of cp.it) {
      const x = envolver(W / 2 + (s.x - FW / 2) * zz + ox, PW, W);
      const y = envolver(H / 2 + (s.y - FH / 2) * zz + oy, PH, H);
      if (x < -12 || x > W + 12 || y < -12 || y > H + 12) continue;
      const a = s.a * (.5 + .5 * Math.sin(t * s.v + s.f)) * fx.brillo;
      const size = s.s * 7 * k;
      sprite(spr[s.c], x, y, size, a);
      if (s.fl) sprite(spr.dBlanco, x, y, size * 3.4, a * .4);
    }
  }
}
function dibujarBokeh(dt) {
  const FW = W * 1.4, FH = H * 1.4;
  for (const b of bokeh) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    const x = envolver(W / 2 + (b.x - FW / 2) - cam.x * 1.25 + par.x * 1.3, FW, W);
    const y = envolver(H / 2 + (b.y - FH / 2) - cam.y * 1.25 + par.y * 1.3, FH, H);
    sprite(spr[b.c], x, y, b.s * (1 + (cam.z - 1) * 1.2), b.a * (.7 + .3 * Math.sin(t * .4 + b.s)));
  }
}

/* ─────────── corazón (constelación) ─────────── */
function crearCorazon() {
  const M = 900, ps = [];
  for (let k = 0; k <= M; k++) {
    const a = Math.PI + (k / M) * TAU, s = Math.sin(a);
    ps.push({ x: 16 * s * s * s, y: -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) });
  }
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  ps.forEach(p => { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); });
  const availW = W * (W < 700 ? .8 : .78), availH = Math.max(160, H - margen.top - margen.bottom);
  const esc = Math.min(availW / (maxX - minX), (availH * (W >= 900 ? .86 : .92)) / (maxY - minY));
  const cx = W / 2 - esc * (minX + maxX) / 2;
  const cy = margen.top + availH / 2 - esc * (minY + maxY) / 2;
  const scr = ps.map(p => ({ x: cx + p.x * esc, y: cy + p.y * esc }));

  // puntos equidistantes (por longitud de arco), empezando en la punta inferior
  const cum = [0];
  for (let k = 1; k < scr.length; k++) cum.push(cum[k - 1] + Math.hypot(scr[k].x - scr[k - 1].x, scr[k].y - scr[k - 1].y));
  const L = cum[cum.length - 1], pts = [];
  let j = 0;
  for (let i = 0; i < N; i++) {
    const objetivo = (i / N) * L;
    while (j < cum.length - 2 && cum[j + 1] < objetivo) j++;
    const seg = cum[j + 1] - cum[j] || 1, f = (objetivo - cum[j]) / seg;
    pts.push({ x: lerp(scr[j].x, scr[j + 1].x, f), y: lerp(scr[j].y, scr[j + 1].y, f) });
  }

  // centroide del área (para la foto central)
  let A = 0, Cx = 0, Cy = 0;
  for (let k = 0; k < scr.length - 1; k++) {
    const p = scr[k], q2 = scr[k + 1], cr = p.x * q2.y - q2.x * p.y;
    A += cr; Cx += (p.x + q2.x) * cr; Cy += (p.y + q2.y) * cr;
  }
  A /= 2; Cx /= 6 * A; Cy /= 6 * A;

  const path = new Path2D();
  scr.forEach((p, k) => k ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y));
  path.closePath();

  geo = { pts, path, centro: { x: Cx, y: Cy }, esc, ancho: (maxX - minX) * esc, alto: (maxY - minY) * esc, paso: L / N };

  const r = mulberry(23);
  for (let i = 0; i < N; i++) {
    const m = mem[i] || (mem[i] = { on: false, lit: 0, ap: 0, pop: 0, hv: 0, ph: r() * TAU, tam: .86 + r() * .28, ang: r() * TAU, dist: .4 + r() * .6 });
    m.hx = pts[i].x; m.hy = pts[i].y;
    const dist = m.dist * Math.min(geo.ancho * .1, 60);
    m.sx = clamp(m.hx + Math.cos(m.ang) * dist, 26, W - 26);
    m.sy = clamp(m.hy + Math.sin(m.ang) * dist, margen.top * .75, H - margen.bottom * .75);
    if (lineas[i] === undefined) lineas[i] = { p: 0 };
  }
}
function posMem(m) { const k = suave(clamp(m.lit, 0, 1)); return { x: lerp(m.sx, m.hx, k), y: lerp(m.sy, m.hy, k) }; }
function pantallaMem(m) { const p = posMem(m); return proyectar(p.x, p.y); }
function proyectar(x, y) { return { x: (x - W / 2 - cam.x) * cam.z + W / 2, y: (y - H / 2 - cam.y) * cam.z + H / 2 }; }
function latido() {
  const p = (t % 1.15) / 1.15;
  return Math.exp(-Math.pow((p - .08) / .05, 2)) + .6 * Math.exp(-Math.pow((p - .28) / .06, 2));
}

function dibujarCorazonRelleno() {
  if (fx.final < .01 || !geo) return;
  const b = latido();
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-W / 2 - cam.x, -H / 2 - cam.y);
  const c = geo.centro, R = geo.ancho * .62;
  ctx.translate(c.x, c.y); ctx.scale(1 + b * .018, 1 + b * .018); ctx.translate(-c.x, -c.y);
  const gr = ctx.createRadialGradient(c.x, c.y - geo.alto * .1, 0, c.x, c.y, R);
  const a = fx.final * (.8 + .2 * b);
  gr.addColorStop(0, `rgba(255,150,195,${.08 * a})`);
  gr.addColorStop(.55, `rgba(255,110,170,${.2 * a})`);
  gr.addColorStop(1, `rgba(255,80,150,${.05 * a})`);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 1;
  ctx.fillStyle = gr; ctx.fill(geo.path);
  ctx.lineJoin = "round";
  ctx.strokeStyle = `rgba(255,120,175,${.07 * a})`; ctx.lineWidth = 22; ctx.stroke(geo.path);
  ctx.strokeStyle = `rgba(255,170,205,${.1 * a})`; ctx.lineWidth = 6; ctx.stroke(geo.path);
  ctx.restore();
}

function dibujarLineas() {
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  const b = fx.final * latido();
  for (let k = 0; k < N; k++) {
    const p = lineas[k].p;
    if (p <= .001) continue;
    const A = pantallaMem(mem[k]), B0 = pantallaMem(mem[(k + 1) % N]);
    const Bx = lerp(A.x, B0.x, p), By = lerp(A.y, B0.y, p);
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(Bx, By);
    ctx.strokeStyle = `rgba(255,190,150,${.09 + .14 * fx.final + .1 * b})`; ctx.lineWidth = 7 * Math.sqrt(cam.z); ctx.stroke();
    ctx.strokeStyle = `rgba(255,236,210,${.5 + .4 * fx.final})`; ctx.lineWidth = 1.15 * Math.sqrt(cam.z); ctx.stroke();
    if (p < 1) sprite(spr.oro, Bx, By, 26, .9);
  }
}

function puntoEnLazo(u) {
  const P = mem.map(m => pantallaMem(m));
  const len = [];
  let L = 0;
  for (let k = 0; k < N; k++) { const a = P[k], b = P[(k + 1) % N]; const l = Math.hypot(b.x - a.x, b.y - a.y); len.push(l); L += l; }
  let d = (((u % 1) + 1) % 1) * L;
  for (let k = 0; k < N; k++) {
    if (d <= len[k]) { const a = P[k], b = P[(k + 1) % N], f = len[k] ? d / len[k] : 0; return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) }; }
    d -= len[k];
  }
  return P[0];
}
function dibujarCometa() {
  if (fx.cometa < .01) return;
  ctx.globalCompositeOperation = "lighter";
  const u = t * .085;
  for (let k = 14; k >= 0; k--) {
    const p = puntoEnLazo(u - k * .0045);
    const a = fx.cometa * (1 - k / 15);
    sprite(k ? spr.rosa : spr.blanco, p.x, p.y, (k ? 22 : 46) * (1 - k / 22), a * (k ? .55 : 1));
  }
  const p = puntoEnLazo(u - .5);
  sprite(spr.oro, p.x, p.y, 34, fx.cometa * .7);
}

function dibujarEstrellasMem(dt) {
  if (fx.mem < .005) return;
  ctx.globalCompositeOperation = "lighter";
  const zs = 1 + (cam.z - 1) * .45;
  const b = fx.final * latido();
  for (let i = 0; i < N; i++) {
    const m = mem[i];
    const ap = m.ap * fx.mem;
    if (ap < .005) continue;
    m.hv += ((i === hoverIdx ? 1 : 0) - m.hv) * Math.min(1, dt * 10);
    const p = pantallaMem(m);
    const pul = .5 + .5 * Math.sin(t * 2.1 + m.ph);
    const esPista = i === pista && !m.on;
    const k = m.tam * zs * (1 + m.hv * .3) * (esPista ? 1.18 : 1);
    if (m.lit < 1) {
      const a = (1 - m.lit) * (.42 + .38 * pul) * ap * (esPista ? 1.35 : 1);
      sprite(spr.lila, p.x, p.y, (46 + 14 * pul) * k, a * .5);
      sprite(spr.dLila, p.x, p.y, (38 + 10 * pul) * k, a);
      sprite(spr.blanco, p.x, p.y, 9 * k, a);
    }
    if (m.lit > 0) {
      const a = m.lit * ap * (.84 + .16 * Math.sin(t * 1.4 + m.ph)) * (1 + b * .35);
      const s = (50 + 7 * Math.sin(t * 1.7 + m.ph)) * k * (1 + m.pop * 1.6) * (1 + b * .12);
      sprite(spr.rosa, p.x, p.y, s * 1.7, a * .22);
      sprite(spr.dOro, p.x, p.y, s, a);
      sprite(spr.blanco, p.x, p.y, 12 * k, a);
    }
    if (esPista && ap > .5) {
      for (let r = 0; r < 2; r++) {
        const f = ((t * .55 + r * .5) % 1);
        ctx.globalAlpha = (1 - f) * .55 * ap;
        ctx.strokeStyle = "rgba(255,233,200,1)"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(p.x, p.y, (10 + f * 30) * k, 0, TAU); ctx.stroke();
      }
    }
  }
}

/* ─────────── partículas, anillos y estrellas fugaces ─────────── */
function explosion(x, y, o = {}) {
  const n = Math.round((o.n || 54) * (reducido ? .35 : 1));
  const cols = o.cols || ["oro", "rosa", "blanco", "calido", "oro"];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, v = (o.v || 1) * (40 + Math.random() * 210);
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0, max: .7 + Math.random() * 1.2,
      s: (o.s || 1) * (5 + Math.random() * 12), c: cols[(Math.random() * cols.length) | 0], g: o.g || 0 });
  }
  if (o.anillo !== 0) anillos.push({ x, y, max: o.anillo || 95, vida: 0, dur: 1.15 });
  if (parts.length > 1100) parts.splice(0, parts.length - 1100);
}
function actualizarParticulas(dt) {
  const k = Math.exp(-dt * 2.3);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.vida += dt;
    if (p.vida >= p.max) { parts.splice(i, 1); continue; }
    p.vx *= k; p.vy = p.vy * k + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
  }
  for (let i = anillos.length - 1; i >= 0; i--) { anillos[i].vida += dt; if (anillos[i].vida >= anillos[i].dur) anillos.splice(i, 1); }

  // partículas que suben del corazón en el final
  if (fx.final > .05 && geo && !reducido) {
    const n = Math.random() < fx.final * 1.6 * Math.min(1, dt * 60) ? 2 : 0;
    for (let i = 0; i < n; i++) {
      const p = puntoEnLazo(Math.random());
      const dx = p.x - geo.centro.x, dy = p.y - geo.centro.y, d = Math.hypot(dx, dy) || 1;
      parts.push({ x: p.x, y: p.y, vx: dx / d * (8 + Math.random() * 22), vy: dy / d * 12 - 14 - Math.random() * 20,
        vida: 0, max: 1.6 + Math.random() * 1.8, s: 4 + Math.random() * 9, c: Math.random() < .6 ? "rosa" : "oro", g: -6 });
    }
  }
}
function dibujarParticulas() {
  ctx.globalCompositeOperation = "lighter";
  for (const p of parts) {
    const a = 1 - p.vida / p.max;
    sprite(spr[p.c], p.x, p.y, p.s * (.55 + .45 * a), a * a);
  }
  for (const r of anillos) {
    const f = r.vida / r.dur, e = 1 - Math.pow(1 - f, 3);
    ctx.globalAlpha = (1 - f) * .7;
    ctx.strokeStyle = "rgba(255,226,180,1)"; ctx.lineWidth = 1.6 * (1 - f) + .3;
    ctx.beginPath(); ctx.arc(r.x, r.y, 6 + e * r.max, 0, TAU); ctx.stroke();
  }
}

function crearFugaz() {
  const dir = Math.random() < .5 ? -1 : 1;
  const ang = (18 + Math.random() * 22) * Math.PI / 180;
  const v = 420 + Math.random() * 300;
  const x = dir > 0 ? Math.random() * W * .55 : W * .45 + Math.random() * W * .55;
  const y = Math.random() * H * .42;
  fugaces.push({ x, y, vx: Math.cos(ang) * v * dir, vy: Math.sin(ang) * v, vida: 0, max: 1.5 + Math.random() * .6, largo: 130 + Math.random() * 110, tocada: false });
}
function actualizarFugaces(dt) {
  proxFugaz -= dt;
  if (proxFugaz <= 0) {
    if (!reducido && fx.warp < .05) crearFugaz();
    proxFugaz = conFugaces ? 4.5 + Math.random() * 6 : 7 + Math.random() * 8;
  }
  for (let i = fugaces.length - 1; i >= 0; i--) {
    const f = fugaces[i];
    f.vida += dt; f.x += f.vx * dt; f.y += f.vy * dt;
    if (f.vida >= f.max) fugaces.splice(i, 1);
  }
}
function colaFugaz(f) {
  const v = Math.hypot(f.vx, f.vy), env = Math.sin(Math.PI * f.vida / f.max);
  return { a: env, tx: f.x - f.vx / v * f.largo * (.4 + .6 * env), ty: f.y - f.vy / v * f.largo * (.4 + .6 * env) };
}
function dibujarFugaces() {
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const f of fugaces) {
    if (f.tocada) continue;
    const c = colaFugaz(f);
    const gr = ctx.createLinearGradient(f.x, f.y, c.tx, c.ty);
    gr.addColorStop(0, `rgba(255,255,255,${.95 * c.a})`);
    gr.addColorStop(.25, `rgba(255,214,236,${.5 * c.a})`);
    gr.addColorStop(1, "rgba(200,180,255,0)");
    ctx.globalAlpha = 1; ctx.strokeStyle = gr; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(c.tx, c.ty); ctx.stroke();
    sprite(spr.blanco, f.x, f.y, 30, c.a);
  }
}

/* ─────────── viaje (efecto salto al espacio) ─────────── */
function crearWarp() {
  warpP = Array.from({ length: reducido ? 110 : 360 }, () => ({ x: (Math.random() - .5) * 2.6, y: (Math.random() - .5) * 2.6, z: Math.random() }));
}
function dibujarWarp(dt) {
  if (fx.warp < .004) return;
  ctx.globalCompositeOperation = "lighter";
  const f = Math.min(W, H) * .55, vel = .12 + fx.warp * 2.4;
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .6);
  g.addColorStop(0, `rgba(190,170,255,${.22 * fx.warp})`); g.addColorStop(1, "rgba(80,40,160,0)");
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.lineCap = "round";
  for (const p of warpP) {
    p.z -= dt * vel;
    if (p.z <= .02) { p.z = 1; p.x = (Math.random() - .5) * 2.6; p.y = (Math.random() - .5) * 2.6; continue; }
    const sx = W / 2 + p.x / p.z * f, sy = H / 2 + p.y / p.z * f;
    const z1 = Math.min(1, p.z + .015 + fx.warp * .16);
    const tx = W / 2 + p.x / z1 * f, ty = H / 2 + p.y / z1 * f;
    const a = fx.warp * (1 - p.z);
    ctx.globalAlpha = a > 1 ? 1 : a;
    ctx.strokeStyle = p.x > 0 ? "rgb(214,224,255)" : "rgb(255,220,240)";
    ctx.lineWidth = (1 - p.z) * 2.6 + .3;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sx, sy); ctx.stroke();
  }
}

/* ─────────── bucle principal ─────────── */
function frame(ahora) {
  requestAnimationFrame(frame);
  if (!activo) return;
  const dt = Math.min(.05, Math.max(0, (ahora - ultimo) / 1000));
  ultimo = ahora; t += dt;

  // paralaje: deriva lenta + puntero
  const tx = Math.sin(t * .05) * 22 + par.mx * 36, ty = Math.cos(t * .043) * 15 + par.my * 26;
  par.x += (tx - par.x) * Math.min(1, dt * 2); par.y += (ty - par.y) * Math.min(1, dt * 2);

  actualizarParticulas(dt);
  actualizarFugaces(dt);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  ctx.fillStyle = gradBase; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  capaImagen(nebula, .08, (.85 + .15 * Math.sin(t * .18)) * fx.brillo);
  capaImagen(polvo, .14, .9 * fx.brillo);
  dibujarCapas();
  dibujarCorazonRelleno();
  dibujarLineas();
  dibujarCometa();
  dibujarEstrellasMem(dt);
  dibujarFugaces();
  dibujarParticulas();
  dibujarWarp(dt);
  ctx.globalCompositeOperation = "lighter";
  dibujarBokeh(dt);
  if (fx.flash > .005) {
    const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * .7);
    g.addColorStop(0, `rgba(255,236,220,${.75 * fx.flash})`); g.addColorStop(1, `rgba(255,170,210,${.15 * fx.flash})`);
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
}

/* ─────────── interacción ─────────── */
function estrellaEn(x, y) {
  if (!interactivo || fx.mem < .5) return -1;
  const R = clamp((geo ? geo.paso : 50) * .5, 22, 44) * Math.max(1, cam.z * .8);
  let mejor = -1, md = R;
  for (let i = 0; i < N; i++) {
    if (mem[i].ap < .5) continue;
    const p = pantallaMem(mem[i]);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < md) { md = d; mejor = i; }
  }
  return mejor;
}
function fugazEn(x, y) {
  for (const f of fugaces) {
    if (f.tocada || !conFugaces) continue;
    const c = colaFugaz(f);
    const vx = c.tx - f.x, vy = c.ty - f.y, l2 = vx * vx + vy * vy || 1;
    const k = clamp(((x - f.x) * vx + (y - f.y) * vy) / l2, 0, 1);
    if (Math.hypot(x - (f.x + vx * k), y - (f.y + vy * k)) < 42) return f;
  }
  return null;
}
function enlazarEventos() {
  let ini = null;
  cv.addEventListener("pointerdown", e => { ini = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  cv.addEventListener("pointermove", e => {
    par.mx = (e.clientX / W - .5); par.my = (e.clientY / H - .5);
    if (e.pointerType === "mouse") {
      hoverIdx = estrellaEn(e.clientX, e.clientY);
      cv.style.cursor = hoverIdx >= 0 || fugazEn(e.clientX, e.clientY) ? "pointer" : "default";
    }
    if ((ini || e.pointerType === "mouse") && Math.random() < (reducido ? .1 : .35) && fx.warp < .05) {
      parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - .5) * 30, vy: (Math.random() - .5) * 30 - 10, vida: 0, max: .6 + Math.random() * .6, s: 4 + Math.random() * 7, c: Math.random() < .5 ? "oro" : "lila", g: 0 });
    }
  });
  cv.addEventListener("pointerleave", () => { hoverIdx = -1; });
  cv.addEventListener("pointercancel", () => { ini = null; });
  cv.addEventListener("pointerup", e => {
    if (!ini) return;
    const mov = Math.hypot(e.clientX - ini.x, e.clientY - ini.y), dur = performance.now() - ini.t;
    ini = null;
    if (mov > 14 || dur > 900) return;
    const f = fugazEn(e.clientX, e.clientY);
    if (f) {
      f.tocada = true;
      explosion(f.x, f.y, { n: 70, cols: ["blanco", "rosa", "lila", "oro"], anillo: 120 });
      emitir("deseo");
      return;
    }
    const i = estrellaEn(e.clientX, e.clientY);
    if (i >= 0) { emitir("estrella", i); return; }
    explosion(e.clientX, e.clientY, { n: 12, s: .7, v: .5, anillo: 30 });
  });
  document.addEventListener("visibilitychange", () => { activo = !document.hidden; ultimo = performance.now(); });
}

function medirSeguro() {
  const d = document.createElement("div");
  d.style.cssText = "position:fixed;top:0;left:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)";
  document.body.appendChild(d);
  const cs = getComputedStyle(d), r = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  d.remove();
  return r;
}
function redimensionar() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const s = medirSeguro();
  const ancho = W >= 900;
  margen = { top: (H < 560 ? 70 : ancho ? 150 : 104) + s.top, bottom: (H < 560 ? 84 : ancho ? 130 : 120) + s.bottom };
  crearFondo(); crearCapas(); crearCorazon();
  emitir("resize");
}

/* ─────────── API pública ─────────── */
function tween(obj, props) { return new Promise(res => gsap.to(obj, Object.assign({}, props, { onComplete: res }))); }

return {
  init(canvas, n) {
    cv = canvas; ctx = cv.getContext("2d"); N = n;
    crearSprites(); crearWarp(); redimensionar(); enlazarEventos();
    let to;
    window.addEventListener("resize", () => { clearTimeout(to); to = setTimeout(redimensionar, 140); });
    ultimo = performance.now();
    requestAnimationFrame(frame);
  },
  on(ev, fn) { (oyentes[ev] = oyentes[ev] || []).push(fn); },
  setInteractivo(v) { interactivo = v; if (!v) { hoverIdx = -1; cv.style.cursor = "default"; } },
  setFugaces(v) { conFugaces = v; if (v) proxFugaz = Math.min(proxFugaz, 3); },
  setPista(i) { pista = i; },
  encendida(i) { return !!mem[i] && mem[i].on; },

  setEncendidas(lista) {
    mem.forEach((m, i) => { m.on = lista.includes(i); m.lit = m.on ? 1 : 0; m.pop = 0; });
    for (let k = 0; k < N; k++) lineas[k].p = mem[k].on && mem[(k + 1) % N].on ? 1 : 0;
  },
  mostrarEstrellas(alSonar) {
    fx.mem = 1;
    const orden = mem.map((_, i) => i);
    return new Promise(res => {
      orden.forEach((i, k) => {
        gsap.to(mem[i], { ap: 1, duration: .9, delay: k * .075, ease: "power2.out",
          onStart() { if (alSonar) alSonar(i); const p = pantallaMem(mem[i]); explosion(p.x, p.y, { n: 8, s: .6, v: .35, anillo: 26 }); } });
      });
      setTimeout(res, orden.length * 75 + 900);
    });
  },
  encender(i) {
    const m = mem[i];
    if (!m || m.on) return;
    m.on = true;
    const p0 = pantallaMem(m);
    explosion(p0.x, p0.y, { n: 64, anillo: 110 });
    m.pop = 1;
    gsap.to(m, { pop: 0, duration: 1.6, ease: "power2.out" });
    gsap.to(m, { lit: 1, duration: 1.5, ease: "power2.inOut" });
    const vecinos = [[(i - 1 + N) % N, (i - 1 + N) % N], [(i + 1) % N, i]];
    vecinos.forEach(([otra, seg]) => {
      if (mem[otra].on) gsap.to(lineas[seg], { p: 1, duration: .9, delay: 1.25, ease: "power2.inOut" });
    });
  },
  enfocar(i) {
    const p = posMem(mem[i]);
    return tween(cam, { x: p.x - W / 2, y: p.y - H / 2, z: 2.3, duration: 1.05, ease: "power3.inOut" });
  },
  desenfocar() { return tween(cam, { x: 0, y: 0, z: 1, duration: 1.15, ease: "power3.inOut" }); },
  warp() {
    return new Promise(res => {
      gsap.timeline({ onComplete: res })
        .to(fx, { warp: 1, duration: reducido ? .4 : 1.2, ease: "power2.in" })
        .to(cam, { z: 1.3, duration: reducido ? .4 : 1.2, ease: "power2.in" }, 0)
        .to(fx, { warp: 0, duration: reducido ? .4 : 1.3, ease: "power2.out" }, reducido ? "+=.1" : "+=.55")
        .to(cam, { z: 1, duration: reducido ? .4 : 1.3, ease: "power2.out" }, "<");
    });
  },
  final() {
    return new Promise(res => {
      gsap.timeline({ onComplete: res })
        .to(cam, { x: 0, y: 0, z: 1, duration: 1, ease: "power2.inOut" }, 0)
        .call(() => mem.forEach((m, i) => setTimeout(() => {
          const p = pantallaMem(m);
          explosion(p.x, p.y, { n: 26, anillo: 0, s: .9 });
        }, i * 55)), null, .3)
        .to(fx, { final: 1, duration: 2.6, ease: "power2.inOut" }, .4)
        .to(fx, { flash: 1, duration: .18, ease: "power1.in" }, 1.75)
        .to(fx, { flash: 0, duration: 1.4, ease: "power2.out" }, 1.93)
        .to(fx, { cometa: 1, duration: 1.2 }, 1.9);
    });
  },
  setFinal(v, dur = 1.2) { gsap.to(fx, { final: v, cometa: v > .5 ? 1 : v * 1.4, duration: dur, ease: "power2.inOut" }); },
  setBrillo(v, dur = 1.2) { gsap.to(fx, { brillo: v, duration: dur }); },
  chispa(x, y, o) { explosion(x, y, o || { n: 22, s: .8, anillo: 50 }); },
  posPantalla(i) { return pantallaMem(mem[i]); },
  geometria() { return geo; },
  margen() { return margen; },
};
})();
