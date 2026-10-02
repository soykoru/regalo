/* ══════════════════════════════════════════════════════════════
   Sonido — campanitas sintetizadas (sin archivos) y música.
   No necesitas editar este archivo.
══════════════════════════════════════════════════════════════ */
const Sonido = (() => {
"use strict";

let ctx = null, salida = null, silencio = false;
const musica = new Audio();
musica.loop = true;
musica.preload = "auto";
let quiereMusica = false;

function impulso(c, dur, caida) {
  const len = Math.floor(c.sampleRate * dur), b = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, caida);
  }
  return b;
}
function contexto() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      salida = ctx.createGain(); salida.gain.value = .5;
      const rev = ctx.createConvolver(); rev.buffer = impulso(ctx, 3.2, 2.4);
      const humedo = ctx.createGain(); humedo.gain.value = .5;
      salida.connect(ctx.destination); salida.connect(rev); rev.connect(humedo); humedo.connect(ctx.destination);
    } catch (e) { ctx = null; return null; }
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

const ESCALA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];   // pentatónica, dos octavas
const nota = i => 523.25 * Math.pow(2, ESCALA[i % ESCALA.length] / 12);

function campana(freq, cuando = 0, vol = .2, dur = 2.6) {
  const c = contexto();
  if (!c || silencio) return;
  const t0 = c.currentTime + cuando;
  [[1, "triangle"], [2.005, "sine"], [3.01, "sine"], [4.17, "sine"]].forEach(([h, tipo], k) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = tipo; o.frequency.value = freq * h;
    const v = vol / (1 + k * 2.4);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(v, t0 + .006);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + dur / (1 + k * .7));
    o.connect(g); g.connect(salida);
    o.start(t0); o.stop(t0 + dur + .05);
  });
}

function soplo(dur = 2.6) {
  const c = contexto();
  if (!c || silencio) return;
  const len = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = b;
  const f = c.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2;
  const g = c.createGain(), t0 = c.currentTime;
  f.frequency.setValueAtTime(180, t0);
  f.frequency.exponentialRampToValueAtTime(2400, t0 + dur * .45);
  f.frequency.exponentialRampToValueAtTime(220, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(.32, t0 + dur * .45);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  src.connect(f); f.connect(g); g.connect(salida);
  src.start(t0); src.stop(t0 + dur);
}

function fundirVolumen(a, dur) {
  try { gsap.to(musica, { volume: a, duration: dur, ease: "power1.inOut" }); } catch (e) { musica.volume = a; }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) { if (!musica.paused) musica.pause(); }
  else if (quiereMusica && !silencio) musica.play().catch(() => {});
});

return {
  desbloquear() { contexto(); },
  estrella(i) { campana(nota(i), 0, .2); campana(nota(i) * 1.5, .1, .06); },
  aparecer(i) { campana(nota(i) * 2, 0, .035, 1.4); },
  encender(i) { campana(nota(i), 0, .14); campana(nota(i) * 2, .14, .07); campana(nota(i) * 3, .3, .04); },
  deseo() { [0, 4, 7, 12, 16, 19, 24].forEach((s, k) => campana(1046.5 * Math.pow(2, s / 12), k * .07, .06, 1.8)); },
  final() {
    [[261.63, 0], [329.63, .12], [392, .24], [493.88, .36], [587.33, .5], [783.99, .7], [1046.5, .95]]
      .forEach(([f, d]) => campana(f, d, .12, 4.5));
  },
  soplo,
  abrir() { campana(392, 0, .06, 3); },
  cargarMusica(src) { musica.src = src; },
  iniciarMusica() {
    quiereMusica = true;
    if (silencio) return;
    musica.volume = 0;
    const p = musica.play();
    if (p && p.catch) p.catch(() => {});
    fundirVolumen(.75, 3);
  },
  bajarMusica(v) { if (!silencio) fundirVolumen(v, 1.2); },
  alternar() {
    silencio = !silencio;
    if (silencio) { musica.pause(); }
    else { contexto(); musica.volume = .75; quiereMusica = true; musica.play().catch(() => {}); }
    return !silencio;
  },
  get silenciado() { return silencio; },
};
})();
