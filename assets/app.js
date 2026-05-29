/* ══════════════════════════════════════════════════════════════
   App principal — NO necesitas editar este archivo.
   Edita tus fotos y mensajes en  assets/config.js
══════════════════════════════════════════════════════════════ */
(function () {
"use strict";

/* —— comprobación de librerías —— */
if (typeof gsap === "undefined") {
  document.getElementById("fatal").style.display = "flex";
  return;
}

/* —— temas visuales para los sobres (se reparten en orden) —— */
const SOBRE_THEMES = [
  { grad: "linear-gradient(155deg,#ff7eb3,#ff9bb3 32%,#ffd6c0 62%,#f7b267)", glow: "#ff7eb3", em: "❤" },
  { grad: "linear-gradient(155deg,#7c5cff,#9d7bff 32%,#c7b3ff 62%,#e7d6ff)", glow: "#9d7bff", em: "💌" },
  { grad: "linear-gradient(155deg,#0ea5b5,#2dd4bf 35%,#7ee8d3 65%,#d6fff4)", glow: "#2dd4bf", em: "🌙" },
  { grad: "linear-gradient(155deg,#e7b66a,#f6d365 38%,#fda085 70%,#ffd6c0)", glow: "#f6c453", em: "✨" },
  { grad: "linear-gradient(155deg,#f5587b,#ff6e9c 35%,#ffb3c8 68%,#ffe0ea)", glow: "#ff6e9c", em: "🌹" },
  { grad: "linear-gradient(155deg,#3b6fe0,#5b9bff 35%,#a9cdff 68%,#e0efff)", glow: "#5b9bff", em: "🕊" },
];
/* —— construir cartas y sobres a partir del config —— */
const CARDS = TARJETAS.map((t, i) => ({
  idx: i,
  num: String(i + 1).padStart(2, "0"),
  foto: "assets/fotos/" + t.foto,
  titulo: t.titulo || ("Carta " + (i + 1)),
  mensaje: t.mensaje || "",
}));
const TOTAL = CARDS.length;
const PER = Math.max(1, CONFIG.CARTAS_POR_SOBRE || 4);
const NSOBRES = Math.ceil(TOTAL / PER);
// SOBRES se construye según State.order (que puede barajarse al reiniciar)
let SOBRES = [];
const PORTADAS = (typeof PORTADAS_SOBRES !== "undefined" && PORTADAS_SOBRES) || [];
function buildSobres() {
  SOBRES = [];
  for (let k = 0; k < NSOBRES; k++) {
    const ids = State.order.slice(k * PER, (k + 1) * PER);
    SOBRES.push({
      id: k,
      cards: ids.map(i => CARDS[i]).filter(Boolean),
      theme: SOBRE_THEMES[k % SOBRE_THEMES.length],
      foto: PORTADAS[k] ? "assets/fotos/" + PORTADAS[k] : null,
    });
  }
}

/* —— estado persistente —— */
const KEY = "album_vero_v4";
function seqOrder() { return Array.from({ length: TOTAL }, (_, i) => i); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
const State = {
  opened: [],
  placed: {},          // { "pagina_slot": indiceCarta }
  order: seqOrder(),   // qué cartas van en cada sobre (se baraja al reiniciar)
  hints: { swipe: false, tap: false, read: false },  // indicadores que solo salen la 1ª vez
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "{}");
      this.opened = Array.isArray(d.opened) ? d.opened : [];
      this.placed = d.placed && typeof d.placed === "object" ? d.placed : {};
      this.order = (Array.isArray(d.order) && d.order.length === TOTAL) ? d.order : seqOrder();
      this.hints = d.hints && typeof d.hints === "object" ? { swipe: !!d.hints.swipe, tap: !!d.hints.tap, read: !!d.hints.read } : { swipe: false, tap: false, read: false };
    } catch (e) { this.opened = []; this.placed = {}; this.order = seqOrder(); this.hints = { swipe: false, tap: false, read: false }; }
  },
  save() { localStorage.setItem(KEY, JSON.stringify({ opened: this.opened, placed: this.placed, order: this.order, hints: this.hints })); },
  isOpen(id) { return this.opened.includes(id); },
  open(id) { if (!this.opened.includes(id)) { this.opened.push(id); this.save(); } },
  openedCards() { let n = 0; SOBRES.forEach(s => { if (this.isOpen(s.id)) n += s.cards.length; }); return n; },
  collected() { let arr = []; SOBRES.forEach(s => { if (this.isOpen(s.id)) arr = arr.concat(s.cards); }); return arr; },
  placedCount() { return Object.keys(this.placed).length; },
  unplaced() {
    const used = new Set(Object.values(this.placed).map(Number));
    return this.collected().filter(c => !used.has(c.idx));
  },
  reset() { this.opened = []; this.placed = {}; this.order = shuffle(seqOrder()); this.hints = { swipe: false, tap: false, read: false }; this.save(); buildSobres(); },
};

/* ══════════════════════ AUDIO (suave, opcional) ══════════════════════ */
let _ac = null;
function actx() {
  if (!_ac) { try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (_ac && _ac.state === "suspended") _ac.resume();
  return _ac;
}
const SFX = {
  tear() { const c = actx(); if (!c) return; try {
    const len = c.sampleRate * .45, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.5) * .6;
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1200; f.Q.value = .8;
    const g = c.createGain(); g.gain.setValueAtTime(.9, c.currentTime); g.gain.linearRampToValueAtTime(0, c.currentTime + .45);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  } catch (e) {} },
  sparkle() { const c = actx(); if (!c) return; try {
    [880, 1320, 1760].forEach((fr, i) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = "sine";
      o.connect(g); g.connect(c.destination);
      o.frequency.setValueAtTime(fr, c.currentTime + i * .06);
      g.gain.setValueAtTime(.0001, c.currentTime + i * .06);
      g.gain.exponentialRampToValueAtTime(.12, c.currentTime + i * .06 + .02);
      g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + i * .06 + .4);
      o.start(c.currentTime + i * .06); o.stop(c.currentTime + i * .06 + .42);
    });
  } catch (e) {} },
  flip() { const c = actx(); if (!c) return; try {
    const o = c.createOscillator(), g = c.createGain(); o.type = "triangle";
    o.connect(g); g.connect(c.destination);
    o.frequency.setValueAtTime(620, c.currentTime); o.frequency.exponentialRampToValueAtTime(880, c.currentTime + .12);
    g.gain.setValueAtTime(.1, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .25);
    o.start(); o.stop(c.currentTime + .26);
  } catch (e) {} },
  page() { const c = actx(); if (!c) return; try {
    const len = c.sampleRate * .3, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len) * .12;
    const s = c.createBufferSource(); s.buffer = b;
    const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 3500;
    s.connect(f); f.connect(c.destination); s.start();
  } catch (e) {} },
  click() { const c = actx(); if (!c) return; try {
    const o = c.createOscillator(), g = c.createGain(); o.type = "sine";
    o.connect(g); g.connect(c.destination);
    o.frequency.setValueAtTime(240, c.currentTime); o.frequency.exponentialRampToValueAtTime(120, c.currentTime + .08);
    g.gain.setValueAtTime(.08, c.currentTime); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + .1);
    o.start(); o.stop(c.currentTime + .11);
  } catch (e) {} },
};

/* ══════════════════════ FONDO ANIMADO ══════════════════════ */
function initBackground() {
  const cv = document.getElementById("bg-canvas");
  const ctx = cv.getContext("2d");
  let W, H;
  function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; }
  resize(); addEventListener("resize", resize);

  const bokeh = Array.from({ length: 22 }, () => ({
    x: Math.random(), y: Math.random(), r: Math.random() * 80 + 30,
    a: Math.random() * .06 + .02, dy: (Math.random() * .0004 + .0002),
    c: Math.random() > .5 ? "255,155,179" : "231,182,106",
  }));
  const stars = Array.from({ length: 90 }, () => ({
    x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + .3,
    a: Math.random(), sp: (Math.random() * .01 + .004) * (Math.random() > .5 ? 1 : -1),
  }));
  const HEARTS = ["❤", "✦", "🌸", "❀", "♡"];
  const petals = Array.from({ length: 16 }, () => spawnPetal(true));
  function spawnPetal(init) {
    return {
      x: Math.random(), y: init ? Math.random() : -.08,
      s: Math.random() * 12 + 10, vy: Math.random() * .0012 + .0006,
      vx: (Math.random() - .5) * .0006, rot: Math.random() * 6.28,
      vr: (Math.random() - .5) * .02, a: Math.random() * .4 + .25,
      ch: HEARTS[(Math.random() * HEARTS.length) | 0],
      col: Math.random() > .5 ? "rgba(255,155,179," : "rgba(231,182,106,",
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1a1024"); g.addColorStop(.5, "#120b1c"); g.addColorStop(1, "#080510");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    bokeh.forEach(b => {
      b.y -= b.dy; if (b.y < -.1) { b.y = 1.1; b.x = Math.random(); }
      const rg = ctx.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, b.r);
      rg.addColorStop(0, "rgba(" + b.c + "," + b.a + ")"); rg.addColorStop(1, "rgba(" + b.c + ",0)");
      ctx.fillStyle = rg; ctx.fillRect(b.x * W - b.r, b.y * H - b.r, b.r * 2, b.r * 2);
    });
    stars.forEach(s => {
      s.a += s.sp; if (s.a > 1 || s.a < 0) s.sp *= -1;
      ctx.globalAlpha = Math.max(0, Math.min(.9, s.a));
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 6.29); ctx.fill();
    });
    ctx.globalAlpha = 1;
    petals.forEach((p, i) => {
      p.y += p.vy; p.x += p.vx; p.rot += p.vr;
      if (p.y > 1.1) petals[i] = spawnPetal(false);
      ctx.save();
      ctx.globalAlpha = p.a; ctx.translate(p.x * W, p.y * H); ctx.rotate(p.rot);
      ctx.font = p.s + "px serif"; ctx.fillStyle = p.col + p.a + ")";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(p.ch, 0, 0);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
}

/* ══════════════════════ PARTÍCULAS (confeti al abrir) ══════════════════════ */
function confetti(x, y, colors) {
  const cv = document.getElementById("bg-canvas");
  // dibujamos sobre un canvas temporal por encima usando el flash layer
  const layer = document.createElement("canvas");
  layer.style.cssText = "position:fixed;inset:0;z-index:997;pointer-events:none";
  layer.width = innerWidth; layer.height = innerHeight;
  document.body.appendChild(layer);
  const c = layer.getContext("2d");
  const ps = [];
  for (let i = 0; i < 90; i++) {
    ps.push({
      x, y, vx: (Math.random() - .5) * 22, vy: (Math.random() - .5) * 22 - 4,
      a: 1, sz: Math.random() * 6 + 3, g: .42,
      col: colors[(Math.random() * colors.length) | 0],
      star: Math.random() > .5,
    });
  }
  let frames = 0;
  (function run() {
    c.clearRect(0, 0, layer.width, layer.height);
    let alive = false;
    ps.forEach(p => {
      if (p.a <= 0) return; alive = true;
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= .98; p.a -= .016;
      c.save(); c.globalAlpha = Math.max(0, p.a); c.fillStyle = p.col;
      c.translate(p.x, p.y);
      if (p.star) {
        c.beginPath();
        for (let k = 0; k < 5; k++) {
          const ang = (k * 4 * Math.PI / 5) - Math.PI / 2, r = k % 2 ? p.sz * .45 : p.sz;
          k ? c.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) : c.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        }
        c.closePath(); c.fill();
      } else { c.beginPath(); c.arc(0, 0, p.sz, 0, 6.29); c.fill(); }
      c.restore();
    });
    frames++;
    if (alive && frames < 200) requestAnimationFrame(run);
    else layer.remove();
  })();
}

/* ══════════════════════ NAVEGACIÓN DE PANTALLAS ══════════════════════ */
let current = "cover";
function show(id) {
  const tgt = document.getElementById("s-" + id);
  if (!tgt) return;
  document.querySelectorAll(".screen.active").forEach(s => { if (s !== tgt) s.classList.remove("active"); });
  // reinicia las animaciones de entrada de la portada al volver a ella
  if (id === "cover") { tgt.classList.remove("active"); void tgt.offsetWidth; }
  tgt.classList.add("active");
  current = id;
}

/* ══════════════════════ PORTADA ══════════════════════ */
function initCover() {
  document.getElementById("cover-eyebrow").textContent = "";
  document.getElementById("cover-name").textContent = CONFIG.mensajeInicio || "Para ti, mi amor";
  document.getElementById("cover-sub").textContent = CONFIG.dedicatoria || "";
  document.getElementById("btn-start").addEventListener("click", () => {
    SFX.click(); actx(); startMusic(); goSobres();
  });
}

/* ── MÚSICA ── */
function startMusic() {
  const m = document.getElementById("music");
  if (!m.getAttribute("src")) m.setAttribute("src", "assets/fotos/" + (CONFIG.cancion || "cancion.mp3"));
  m.volume = 0;
  const p = m.play(); if (p && p.catch) p.catch(() => {});
  const btn = document.getElementById("music-btn");
  btn.classList.add("show"); btn.classList.remove("muted"); btn.textContent = "🔊";
  // volumen suave de fondo (se escucha pero no aturde)
  const TARGET = 0.16;
  let v = 0; const fade = setInterval(() => { v = Math.min(TARGET, v + .012); m.volume = v; if (v >= TARGET) clearInterval(fade); }, 90);
}
(function () {
  const btn = document.getElementById("music-btn");
  btn.addEventListener("click", () => {
    const m = document.getElementById("music");
    if (m.muted || m.paused) {
      m.muted = false; if (m.paused) { const p = m.play(); if (p && p.catch) p.catch(() => {}); }
      btn.classList.remove("muted"); btn.textContent = "🔊";
    } else { m.muted = true; btn.classList.add("muted"); btn.textContent = "🔇"; }
  });
})();

/* ══════════════════════ SOBRES ══════════════════════ */
let floatTl = [];
function renderSobres() {
  const grid = document.getElementById("sobres-grid");
  grid.innerHTML = "";
  floatTl.forEach(t => t.kill()); floatTl = [];
  SOBRES.forEach(s => {
    const opened = State.isOpen(s.id);
    const el = document.createElement("div");
    el.className = "sobre" + (opened ? " opened" : "");
    const face = s.foto
      ? '<div class="sobre-foil"><div class="sobre-photo" style="background-image:url(\'' + s.foto + '\')"></div>' +
          '<div class="sobre-veil" style="background:' + s.theme.grad + '"></div><div class="sobre-shine"></div></div>'
      : '<div class="sobre-foil" style="background:' + s.theme.grad + '"><div class="sobre-shine"></div></div>';
    el.innerHTML =
      '<div class="sobre-glow" style="background:' + s.theme.glow + '"></div>' +
      face +
      '<div class="sobre-frame"></div>' +
      '<div class="sobre-tag"><span class="em">' + s.theme.em + '</span></div>' +
      (opened ? '<div class="done">✓</div>' : '');
    if (!opened) el.addEventListener("click", () => startOpen(s.id));
    grid.appendChild(el);
  });
  // flotación suave
  grid.querySelectorAll(".sobre:not(.opened)").forEach((el, i) => {
    const tl = gsap.timeline({ repeat: -1, yoyo: true, delay: i * .3 })
      .to(el, { y: -10, rotation: 2, duration: 2.2, ease: "sine.inOut" })
      .to(el, { y: 4, rotation: -1.6, duration: 2.6, ease: "sine.inOut" });
    floatTl.push(tl);
  });
}
function goSobres() { renderSobres(); show("sobres"); }
document.getElementById("btn-to-album-1").addEventListener("click", () => { SFX.click(); goAlbum(); });

/* ══════════════════════ APERTURA (rasgar con el dedo) ══════════════════════ */
let openSobreId = null, tearProgress = 0, dragging = false, lastX = 0, travel = 0, finished = false;
const stage = document.getElementById("open-stage");
const pack = document.getElementById("pack");
const strip = document.getElementById("pack-strip");
const stripArt = strip.querySelector(".strip-art");
const tearGlow = document.getElementById("tear-glow");
const packSheen = document.getElementById("pack-sheen");
const openRays = document.getElementById("open-rays");
const openGlow = document.getElementById("open-glow");
const packLabel = document.getElementById("pack-label");
const handHint = document.getElementById("open-hand");
let handTl = null;

function startOpen(id) {
  openSobreId = id; tearProgress = 0; finished = false; travel = 0;
  const s = SOBRES[id], th = s.theme;
  SFX.click(); actx();

  const packArt = document.getElementById("pack-art");
  if (s.foto) {
    packArt.style.background = ""; stripArt.style.background = "";
    packArt.style.backgroundImage = stripArt.style.backgroundImage = "url('" + s.foto + "')";
    packArt.style.backgroundSize = stripArt.style.backgroundSize = "cover";
    packArt.style.backgroundPosition = stripArt.style.backgroundPosition = "center";
  } else {
    packArt.style.backgroundImage = stripArt.style.backgroundImage = "";
    packArt.style.background = stripArt.style.background = th.grad;
  }
  stripArt.style.height = stage.offsetHeight + "px";
  packLabel.querySelector(".em").textContent = th.em;
  openGlow.style.background = th.glow;

  gsap.killTweensOf([pack, strip, tearGlow, openGlow, handHint]);
  gsap.set(strip, { transformPerspective: 800, transformOrigin: "center bottom", rotationX: 0, y: 0, x: 0, rotation: 0, opacity: 1 });
  gsap.set(pack, { x: 0, scale: 1, opacity: 1 });
  gsap.set(tearGlow, { opacity: 0 });
  gsap.set(openGlow, { opacity: 0, scale: 1 });
  gsap.set(handHint, { opacity: 0, x: 0 });

  const showHints = !State.hints.swipe;   // el indicador solo sale la 1ª vez
  const hintEl = document.getElementById("open-hint");
  hintEl.innerHTML = '<span class="arw l">⟵</span> Desliza para abrir <span class="arw">⟶</span>';
  hintEl.style.visibility = showHints ? "visible" : "hidden";
  show("open");

  gsap.fromTo("#open-stage", { scale: .5, opacity: 0, y: 30 },
    { scale: 1, opacity: 1, y: 0, duration: .6, ease: "back.out(1.7)", onComplete() { if (showHints) showHand(); } });
  gsap.to(openGlow, { opacity: .3, scale: 1.25, duration: 1.6, ease: "sine.inOut", repeat: -1, yoyo: true });
}
function showHand() {
  gsap.set(handHint, { opacity: 1, x: -70 });
  handTl = gsap.timeline({ repeat: -1 })
    .to(handHint, { x: 70, duration: 1, ease: "sine.inOut" })
    .to(handHint, { x: -70, duration: 1, ease: "sine.inOut" });
}
function hideHand() { if (handTl) { handTl.kill(); handTl = null; } gsap.to(handHint, { opacity: 0, duration: .2 }); }

function setTear(p) {
  tearProgress = Math.max(0, Math.min(1, p));
  const pk = tearProgress;
  // la solapa se DESPEGA en 3D desde la línea de rotura (parece que se rasga)
  gsap.set(strip, { transformPerspective: 800, transformOrigin: "center bottom",
    rotationX: -pk * 105, y: -pk * 10, x: pk * 4 });
  gsap.set(tearGlow, { opacity: Math.min(1, pk * 1.5) });
  gsap.set(packSheen, { opacity: 1 - pk });
  gsap.set(openGlow, { opacity: .3 + pk * .45 });
}

function pdown(e) {
  if (finished) return;
  dragging = true; lastX = (e.touches ? e.touches[0].clientX : e.clientX); travel = 0;
  hideHand();
}
function pmove(e) {
  if (!dragging || finished) return;
  const x = (e.touches ? e.touches[0].clientX : e.clientX);
  travel += Math.abs(x - lastX); lastX = x;
  setTear(travel / (pack.offsetWidth * 1.1));
  if (tearProgress >= 1) finishTear();
  if (e.cancelable) e.preventDefault();
}
function pup() {
  if (!dragging || finished) return;
  dragging = false;
  if (tearProgress >= .55) finishTear();
  else gsap.to({ v: tearProgress }, { v: 0, duration: .4, ease: "power2.out", onUpdate() { setTear(this.targets()[0].v); }, onComplete: showHand });
}
pack.addEventListener("mousedown", pdown);
pack.addEventListener("touchstart", pdown, { passive: true });
addEventListener("mousemove", pmove);
pack.addEventListener("touchmove", pmove, { passive: false });
addEventListener("mouseup", pup);
addEventListener("touchend", pup);

function finishTear() {
  if (finished) return; finished = true; dragging = false; hideHand();
  document.getElementById("open-hint").style.visibility = "hidden";
  if (!State.hints.swipe) { State.hints.swipe = true; State.save(); }
  SFX.tear();
  const r = stage.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height * .25;
  gsap.killTweensOf(openGlow);

  const glow = SOBRES[openSobreId].theme.glow;
  gsap.set(openRays, { opacity: 0, scale: 1, rotation: 0 });
  gsap.to(packSheen, { opacity: 0, duration: .2 });
  gsap.timeline()
    .to(strip, { rotationX: -170, y: -34, opacity: 0, duration: .52, ease: "power2.in" })   // la solapa termina de despegarse
    .to(tearGlow, { opacity: 1, duration: .12 }, 0)
    .to(openGlow, { opacity: 1, scale: 1.7, duration: .34 }, 0)
    .to(openRays, { opacity: .9, scale: 26, rotation: 40, duration: .62, ease: "power2.out" }, .14)
    .to(openRays, { opacity: 0, duration: .35 }, .5)
    .add(() => {
      confetti(cx, cy, ["#ffd700", "#ff7eb3", "#ffffff", "#9d7bff", "#2dd4bf", glow]);
      confetti(cx, cy - 24, ["#ffffff", "#ffd700", glow]);
      SFX.sparkle();
    }, .24)
    .to("#flash", { opacity: .8, duration: .08 }, .32)
    .to("#flash", { opacity: 0, duration: .5 }, .42)
    .to(pack, { scale: .82, opacity: 0, duration: .4, ease: "power2.in" }, .38)
    .add(() => {
      State.open(openSobreId);
      startReveal(SOBRES[openSobreId].cards);
    }, .72);
}

/* ══════════════════════ REVELADO ══════════════════════ */
let revQueue = [], revIdx = 0, revFlipped = false;
const rcard = document.getElementById("rcard");
const revStage = document.getElementById("rev-stage");

function startReveal(cards) {
  revQueue = cards; revIdx = 0; revBusy = false;
  document.getElementById("rev-done").style.display = "none";
  document.getElementById("rev-hint").style.display = "";
  show("reveal");
  setTimeout(loadRevCard, 120);
}
function loadRevCard() {
  const card = revQueue[revIdx];
  revFlipped = false;
  document.getElementById("rev-count").innerHTML = "<b>" + (revIdx + 1) + "</b> / " + revQueue.length;
  const img = document.getElementById("rev-img"), fb = document.getElementById("rev-fb");
  img.style.display = "block"; fb.style.display = "none";
  img.onerror = () => { img.style.display = "none"; fb.style.display = "flex"; };
  img.src = card.foto;
  document.getElementById("rev-blur").style.backgroundImage = "url('" + card.foto + "')";
  document.getElementById("rev-name").style.opacity = 0;
  document.getElementById("rev-name").textContent = "";
  document.getElementById("rev-hint").textContent = "Toca la carta para girarla";
  document.getElementById("rev-holo").style.opacity = 0;
  document.getElementById("rev-hspot").style.opacity = 0;
  // indicador de "toca" solo en la 1ª carta y solo la 1ª vez
  document.getElementById("rev-tap").classList.toggle("show", revIdx === 0 && !State.hints.tap);
  gsap.set(rcard, { rotationY: 0, rotationX: 0, scale: .8, opacity: 0 });
  gsap.to(rcard, { scale: 1, opacity: 1, duration: .5, ease: "back.out(1.7)" });
}
let revBusy = false;
function flipReveal() {
  if (revBusy) return;                 // evita toques solapados durante la animación
  if (!revFlipped) {
    revBusy = true; revFlipped = true; SFX.flip();
    const idxAtFlip = revIdx;
    document.getElementById("rev-tap").classList.remove("show");
    if (!State.hints.tap) { State.hints.tap = true; State.save(); }
    gsap.timeline({ onComplete() {
      revBusy = false;
      const card = revQueue[idxAtFlip]; if (!card) return;
      SFX.sparkle();
      gsap.to("#rev-holo", { opacity: .6, duration: .45 });
      gsap.to("#rev-hspot", { opacity: 1, duration: .45 });
      const nm = document.getElementById("rev-name");
      nm.textContent = card.titulo;
      gsap.fromTo(nm, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .5 });
      document.getElementById("rev-hint").textContent =
        idxAtFlip < revQueue.length - 1 ? "Toca para la siguiente →" : "¡Toca para terminar!";
    } })
      .to(rcard, { scale: 1.07, y: -8, duration: .16, ease: "power2.out" })
      .to(rcard, { rotationY: 180, duration: .58, ease: "power3.inOut" }, "<")
      .to(rcard, { scale: 1, y: 0, duration: .3, ease: "back.out(2)" }, "-=.16");
  } else {
    nextReveal();
  }
}
function nextReveal() {
  if (revBusy) return;
  revIdx++;
  if (revIdx >= revQueue.length) {
    document.getElementById("rev-hint").style.display = "none";
    document.getElementById("rev-name").textContent = "✦ Sobre completo ✦";
    const btn = document.getElementById("rev-done");
    btn.style.display = "inline-block";
    gsap.fromTo(btn, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .45 });
    return;
  }
  revBusy = true;
  gsap.to(rcard, { scale: .82, opacity: 0, rotationY: 0, duration: .25, ease: "power2.in",
    onComplete() {
      document.getElementById("rev-holo").style.opacity = 0;
      document.getElementById("rev-hspot").style.opacity = 0;
      loadRevCard();
      revBusy = false;
    }});
}
revStage.addEventListener("click", flipReveal);
document.getElementById("rev-done").addEventListener("click", () => { SFX.click(); goAlbum(); });

/* holo tilt en revelado */
function revTilt(nx, ny) {
  if (!revFlipped) return;
  document.getElementById("rev-holo").style.setProperty("--ha", (110 + nx * 80 - 40) + "deg");
  document.getElementById("rev-hspot").style.setProperty("--sx", (nx * 100) + "%");
  document.getElementById("rev-hspot").style.setProperty("--sy", (ny * 100) + "%");
  gsap.to(rcard, { rotationY: 180 + (nx - .5) * 26, rotationX: (ny - .5) * -22, duration: .3, ease: "power2.out" });
}
revStage.addEventListener("mousemove", e => {
  const r = rcard.getBoundingClientRect();
  revTilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
});
revStage.addEventListener("mouseleave", () => {
  if (revFlipped) gsap.to(rcard, { rotationY: 180, rotationX: 0, duration: .5, ease: "power2.out" });
});
revStage.addEventListener("touchmove", e => {
  const t = e.touches[0], r = rcard.getBoundingClientRect();
  revTilt((t.clientX - r.left) / r.width, (t.clientY - r.top) / r.height);
  if (e.cancelable) e.preventDefault();
}, { passive: false });
if (typeof DeviceOrientationEvent !== "undefined") {
  addEventListener("deviceorientation", e => {
    if (current !== "reveal" || !revFlipped) return;
    revTilt(Math.max(0, Math.min(1, ((e.gamma || 0) + 30) / 60)),
            Math.max(0, Math.min(1, ((e.beta || 30) - 10) / 40)));
  });
}

/* ══════════════════════ ÁLBUM DE CROMOS (propio) ══════════════════════ */
// Páginas: 0=portada, 1..N=sobres (5 cuadritos), última=contraportada
const PAGES = [{ type: "cover" }]
  .concat(Array.from({ length: NSOBRES }, (_, k) => ({ type: "slots", sobre: k })))
  .concat([{ type: "back" }]);
const LAST = PAGES.length - 1;
let alPage = 0, flipping = false;

const ROT = [-3, 2.4, -1.8, 3, -2.2];  // inclinaciones bonitas para las cartas pegadas

function cardInner(card) {
  return '<div class="ph-blur" style="background-image:url(\'' + card.foto + '\')"></div>' +
    '<img src="' + card.foto + '" alt="" draggable="false" decoding="async" ' +
    'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
    '<div class="sfb"><span class="e">❤</span></div><div class="g"></div>';
}

function buildPageEl(idx) {
  const page = PAGES[idx];
  const el = document.createElement("div");
  el.className = "apage";
  if (page.type === "cover") {
    el.classList.add("cover");
    el.innerHTML =
      '<div class="cover-photo" style="background-image:url(\'assets/fotos/' + (CONFIG.fotoPortada || "21.jpg") + '\')"></div>' +
      '<div class="cover-veil"></div>' +
      '<div class="cv">' +
        '<div class="ch">❤</div>' +
        '<h3>' + (CONFIG.tituloAlbum || "Nuestro álbum") + '</h3>' +
        '<div class="cd">' + (CONFIG.fechaAlbum || "") + '</div></div>';
    return el;
  }
  if (page.type === "back") {
    el.classList.add("cover");
    el.innerHTML = '<div class="cv">' +
      '<div class="ch">❤</div>' +
      '<h3 style="font-size:30px">Te amo</h3>' +
      '<div class="cs">' + (CONFIG.subtituloPortada || "") + '</div></div>';
    return el;
  }
  // página de cuadritos
  const sobre = SOBRES[page.sobre];
  const slots = [];
  let addReadHint = !State.hints.read;   // indicador "toca para leer" en la 1ª carta pegada
  for (let i = 0; i < sobre.cards.length; i++) {
    const key = page.sobre + "_" + i;
    const cardIdx = State.placed[key];
    if (cardIdx != null && CARDS[cardIdx]) {
      const hint = addReadHint ? '<div class="slot-tap"><span class="f">👆</span><b>toca para leer</b></div>' : '';
      if (addReadHint) addReadHint = false;
      slots.push('<div class="slot filled" data-key="' + key + '" data-card="' + cardIdx + '">' +
        '<div class="scard" style="--rot:' + ROT[i % ROT.length] + 'deg">' + cardInner(CARDS[cardIdx]) + '</div>' + hint + '</div>');
    } else {
      slots.push('<div class="slot" data-key="' + key + '"><span class="splus">＋</span></div>');
    }
  }
  // repartir en filas de 3 (para 5 cartas: 3 arriba + 2 abajo) → siempre caben completos
  let rows = "";
  for (let r = 0; r < slots.length; r += 3) rows += '<div class="ap-row">' + slots.slice(r, r + 3).join("") + '</div>';
  el.innerHTML = '<div class="ap-grid">' + rows + '</div>';
  // tocar una carta pegada -> verla en grande
  el.querySelectorAll(".slot.filled").forEach(slot => {
    slot.addEventListener("click", () => openModal(parseInt(slot.dataset.card, 10)));
  });
  return el;
}

function setCurrent(idx) {
  const paper = document.getElementById("album-paper");
  paper.innerHTML = "";
  paper.appendChild(buildPageEl(idx));
}

function updateAlbumFoot() {
  const page = PAGES[alPage];
  let label = page.type === "cover" ? "Portada"
    : page.type === "back" ? "Fin ❤"
    : "Página " + (page.sobre + 1) + " de " + SOBRES.length;
  document.getElementById("album-pg").textContent = label;
  document.getElementById("fb-prev").disabled = alPage <= 0;
  document.getElementById("fb-next").disabled = alPage >= LAST;
  document.getElementById("album-sub").textContent =
    State.placedCount() + " de " + TOTAL + " cartas pegadas";
  renderTray();
}

function turn(dir) {
  const np = alPage + dir;
  if (flipping || np < 0 || np > LAST) return;
  flipping = true; SFX.page();
  const paper = document.getElementById("album-paper");
  const book = document.getElementById("album-book");
  // debajo se ve: al avanzar, la página nueva; al retroceder, la actual
  setCurrent(dir > 0 ? np : alPage);
  // hoja que gira
  const flip = document.createElement("div"); flip.className = "flipper";
  const ff = document.createElement("div"); ff.className = "ff";
  const fb = document.createElement("div"); fb.className = "fb";
  const sh = document.createElement("div"); sh.className = "sh";
  ff.appendChild(buildPageEl(dir > 0 ? alPage : np));
  flip.appendChild(ff); flip.appendChild(fb); flip.appendChild(sh);
  book.querySelectorAll(".flipper").forEach(f => f.remove());
  book.appendChild(flip);
  gsap.set(flip, { rotationY: dir > 0 ? 0 : -178 });
  gsap.set(sh, { opacity: dir > 0 ? 0 : .5 });
  gsap.to(flip, { rotationY: dir > 0 ? -178 : 0, duration: .85, ease: "power2.inOut",
    onComplete() { flip.remove(); alPage = np; setCurrent(np); flipping = false; updateAlbumFoot(); } });
  gsap.to(sh, { opacity: dir > 0 ? .5 : 0, duration: .85, ease: "power1.in" });
}

function sizeBook() {
  const stage = document.getElementById("album-stage");
  const book = document.getElementById("album-book");
  const sw = (stage.clientWidth || innerWidth) - 26;
  const sh = (stage.clientHeight || innerHeight * .6) - 14;
  const ratio = 43 / 60;
  let w = Math.min(sw, sh * ratio, 400);
  if (w < 120) w = 120;
  book.style.width = Math.round(w) + "px";
  book.style.height = Math.round(w / ratio) + "px";
}
function goAlbum() {
  document.getElementById("album-title").textContent = CONFIG.tituloAlbum || "Nuestro álbum";
  if (alPage > LAST) alPage = LAST;
  show("album");
  // tras activar la pantalla (para tener tamaño real) dimensionamos y pintamos
  requestAnimationFrame(() => {
    sizeBook(); setCurrent(alPage); updateAlbumFoot(); renderTray();
  });
}
let albumRsTimer = null;
addEventListener("resize", () => {
  if (current !== "album") return;
  clearTimeout(albumRsTimer);
  albumRsTimer = setTimeout(() => { sizeBook(); setCurrent(alPage); }, 200);
});
document.getElementById("fb-prev").addEventListener("click", () => turn(-1));
document.getElementById("fb-next").addEventListener("click", () => turn(1));
document.getElementById("fb-back").addEventListener("click", () => { SFX.click(); goSobres(); });

// deslizar para pasar de página
(function () {
  const stage = document.getElementById("album-stage");
  let sx = 0, sy = 0, tracking = false;
  stage.addEventListener("touchstart", e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; tracking = true; }, { passive: true });
  stage.addEventListener("touchend", e => {
    if (!tracking) return; tracking = false;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) turn(dx < 0 ? 1 : -1);
  }, { passive: true });
})();

/* ══════════════════════ BANDEJA + ARRASTRAR PARA PEGAR ══════════════════════ */
function renderTray() {
  const cont = document.getElementById("tray-cards");
  const hint = document.getElementById("tray-hint");
  const page = PAGES[alPage];
  cont.innerHTML = "";
  if (!page || page.type !== "slots") { hint.textContent = ""; return; }
  const unp = State.unplaced();
  if (!unp.length) {
    hint.textContent = State.collected().length ? "No te quedan cartas por pegar ✨" : "Abre un sobre para conseguir cartas";
    return;
  }
  unp.forEach(c => {
    const el = document.createElement("div");
    el.className = "tray-card";
    el.innerHTML = '<div class="scard" style="--rot:0deg">' + cardInner(c) + '</div>';
    el.addEventListener("pointerdown", ev => startTrayDrag(ev, c, el));
    cont.appendChild(el);
  });
  hint.textContent = "Arrastra una carta a su lugar ☝";
}

let drag = null;
function makeGhost(card, w, h) {
  const g = document.createElement("div");
  g.className = "drag-ghost";
  g.style.width = w + "px"; g.style.height = h + "px";
  g.innerHTML = '<div class="scard" style="--rot:-4deg">' + cardInner(card) + '</div>';
  document.body.appendChild(g);
  return g;
}
function moveGhost(x, y) { if (!drag) return; drag.ghost.style.left = (x - drag.w / 2) + "px"; drag.ghost.style.top = (y - drag.h / 2) + "px"; }

function startTrayDrag(ev, card, cardEl) {
  if (flipping || drag) return;
  ev.preventDefault();
  const r = cardEl.getBoundingClientRect();
  const w = r.width * 1.15, h = r.height * 1.15;
  const ghost = makeGhost(card, w, h);
  cardEl.style.opacity = "0";
  drag = { card, cardEl, ghost, w, h, slot: null };
  moveGhost(ev.clientX, ev.clientY);
  SFX.click();
  window.addEventListener("pointermove", trayMove, { passive: false });
  window.addEventListener("pointerup", trayUp);
  window.addEventListener("pointercancel", trayUp);
}
function trayMove(e) {
  if (!drag) return;
  if (e.cancelable) e.preventDefault();
  moveGhost(e.clientX, e.clientY);
  drag.ghost.style.visibility = "hidden";
  const el = document.elementFromPoint(e.clientX, e.clientY);
  drag.ghost.style.visibility = "";
  const slot = el && el.closest ? el.closest(".slot:not(.filled)") : null;
  if (slot !== drag.slot) {
    if (drag.slot) drag.slot.classList.remove("drop-hover");
    drag.slot = slot || null;
    if (drag.slot) drag.slot.classList.add("drop-hover");
  }
}
function trayUp() {
  if (!drag) return;
  window.removeEventListener("pointermove", trayMove);
  window.removeEventListener("pointerup", trayUp);
  window.removeEventListener("pointercancel", trayUp);
  const d = drag; drag = null;
  if (d.slot) {
    const key = d.slot.dataset.key;
    d.slot.classList.remove("drop-hover");
    const r = d.slot.getBoundingClientRect();
    gsap.to(d.ghost, { left: r.left + r.width / 2 - d.w / 2, top: r.top + r.height / 2 - d.h / 2,
      scale: .9, duration: .18, ease: "power2.out",
      onComplete() { d.ghost.remove(); place(d.card.idx, key); } });
  } else {
    const r = d.cardEl.getBoundingClientRect();
    gsap.to(d.ghost, { left: r.left, top: r.top, scale: .55, opacity: 0, duration: .26, ease: "power2.in",
      onComplete() { d.ghost.remove(); d.cardEl.style.opacity = ""; } });
  }
}
function place(cardIdx, key) {
  State.placed[key] = cardIdx; State.save();
  setCurrent(alPage); updateAlbumFoot(); SFX.sparkle();
  const sc = document.querySelector('.slot[data-key="' + key + '"] .scard');
  if (sc) gsap.fromTo(sc, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: .45, ease: "back.out(2)" });
}

/* ══════════════════════ CARTA EN GRANDE (modal) ══════════════════════ */
let modalCard = null;
function openModal(cardIdx) {
  const c = CARDS[cardIdx]; if (!c) return;
  modalCard = c;
  // al abrir la primera carta, marcar el indicador como visto y quitarlo
  if (!State.hints.read) { State.hints.read = true; State.save(); if (current === "album") setCurrent(alPage); }
  const img = document.getElementById("modal-img"), fb = document.getElementById("modal-fb");
  img.style.display = "block"; fb.style.display = "none";
  img.onerror = () => { img.style.display = "none"; fb.style.display = "flex"; };
  img.src = c.foto;
  document.getElementById("modal-blur").style.backgroundImage = "url('" + c.foto + "')";
  document.getElementById("modal-title").textContent = c.titulo;
  document.getElementById("modal-msg").textContent = c.mensaje;
  document.getElementById("modal-holo").style.opacity = .5;
  document.getElementById("modal-hspot").style.opacity = .8;
  document.getElementById("modal").classList.add("show");
  const mc = document.getElementById("modal-card-in");
  document.getElementById("modal-card").addEventListener("mousemove", modalTilt);
  document.getElementById("modal-card").addEventListener("touchmove", modalTouch, { passive: false });
  gsap.set(mc, { rotationX: 0, rotationY: 0 });
}
function closeModal() {
  modalCard = null;
  document.getElementById("modal").classList.remove("show");
  document.getElementById("modal-card").removeEventListener("mousemove", modalTilt);
  document.getElementById("modal-card").removeEventListener("touchmove", modalTouch);
}
function mTilt(nx, ny) {
  document.getElementById("modal-holo").style.setProperty("--ha", (110 + nx * 80 - 40) + "deg");
  document.getElementById("modal-hspot").style.setProperty("--sx", (nx * 100) + "%");
  document.getElementById("modal-hspot").style.setProperty("--sy", (ny * 100) + "%");
  gsap.to("#modal-card-in", { rotationY: (nx - .5) * 26, rotationX: (ny - .5) * -22, duration: .3, ease: "power2.out" });
}
function modalTilt(e) { const r = e.currentTarget.getBoundingClientRect(); mTilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); }
function modalTouch(e) { const t = e.touches[0], r = e.currentTarget.getBoundingClientRect(); mTilt((t.clientX - r.left) / r.width, (t.clientY - r.top) / r.height); if (e.cancelable) e.preventDefault(); }
document.getElementById("modal-close").addEventListener("click", () => { SFX.click(); closeModal(); });
document.getElementById("modal-bd").addEventListener("click", closeModal);
if (typeof DeviceOrientationEvent !== "undefined") {
  addEventListener("deviceorientation", e => {
    if (!modalCard) return;
    mTilt(Math.max(0, Math.min(1, ((e.gamma || 0) + 30) / 60)),
          Math.max(0, Math.min(1, ((e.beta || 30) - 10) / 40)));
  });
}

/* ══════════════════════ REINICIAR (botón) ══════════════════════ */
document.getElementById("btn-reset").addEventListener("click", () => {
  if (confirm("¿Reiniciar todo?\n\nLas cartas volverán a guardarse en los sobres (en orden ALEATORIO) y el álbum quedará vacío.")) {
    State.reset();          // baraja el orden y limpia todo
    alPage = 0;
    goSobres();
    SFX.click();
  }
});

/* ══════════════════════ INIT ══════════════════════ */
function init() {
  State.load();
  buildSobres();
  document.body.classList.add(CONFIG.AJUSTE_FOTO === "cubrir" ? "fit-cubrir" : "fit-completa");
  initBackground();
  initCover();
  // pedir permiso de giroscopio en iOS al primer toque
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    addEventListener("click", () => DeviceOrientationEvent.requestPermission().catch(() => {}), { once: true });
  }
  // mostrar portada (la entrada escalonada la hace el CSS)
  document.getElementById("s-cover").classList.add("active");
}
if (document.readyState === "loading") addEventListener("DOMContentLoaded", init);
else init();

})();
