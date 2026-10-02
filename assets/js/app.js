/* ══════════════════════════════════════════════════════════════
   App principal — NO necesitas editar este archivo.
   Edita fotos y mensajes en  assets/config.js
══════════════════════════════════════════════════════════════ */
(function () {
"use strict";

const $ = s => document.querySelector(s);
if (typeof gsap === "undefined" || typeof CONFIG === "undefined" || typeof RECUERDOS === "undefined" ||
    !Array.isArray(RECUERDOS) || !RECUERDOS.length || typeof Cielo === "undefined" || typeof Sonido === "undefined") {
  $("#fatal").style.display = "flex";
  return;
}

/* ─────────── datos ─────────── */
const RUTA = "assets/fotos/";
const REC = RECUERDOS.map((r, i) => ({ i, src: RUTA + r.foto, titulo: r.titulo || ("Recuerdo " + (i + 1)), mensaje: r.mensaje || "" }));
const N = REC.length;
const EXTRA = (typeof FOTOS_EXTRA !== "undefined" && Array.isArray(FOTOS_EXTRA) ? FOTOS_EXTRA : []).map(f => RUTA + f);
const LUNA = RUTA + (CONFIG.fotoLuna || RECUERDOS[0].foto);
const imgs = {};

const pad = n => String(n).padStart(2, "0");
const esperar = ms => new Promise(r => setTimeout(r, ms));
const vibrar = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* sin vibración */ } };
const animar = (obj, props) => new Promise(r => gsap.to(obj, Object.assign({}, props, { onComplete: r })));

/* ─────────── estado guardado ─────────── */
const KEY = "escrito-en-las-estrellas-v1";
const Estado = {
  encendidas: [], prologoVisto: false, finalVisto: false,
  cargar() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY) || "{}");
      this.encendidas = Array.isArray(d.encendidas) ? d.encendidas.filter(n => Number.isInteger(n) && n >= 0 && n < N) : [];
      this.encendidas = [...new Set(this.encendidas)];
      this.prologoVisto = !!d.prologoVisto;
      this.finalVisto = !!d.finalVisto && this.encendidas.length === N;
    } catch (e) { /* almacenamiento no disponible */ }
  },
  guardar() {
    try { localStorage.setItem(KEY, JSON.stringify({ encendidas: this.encendidas, prologoVisto: this.prologoVisto, finalVisto: this.finalVisto })); }
    catch (e) { /* almacenamiento no disponible */ }
  },
  encender(i) { if (this.encendidas.includes(i)) return false; this.encendidas.push(i); this.guardar(); return true; },
  esta(i) { return this.encendidas.includes(i); },
  get n() { return this.encendidas.length; },
  reiniciar() { this.encendidas = []; this.finalVisto = false; this.prologoVisto = false; this.guardar(); },
};

/* ─────────── pantallas ─────────── */
let actual = null;
function mostrar(id, dur = .9) {
  const el = document.getElementById(id);
  if (actual === el) return;
  const prev = actual;
  actual = el;
  if (prev) {
    gsap.killTweensOf(prev);
    gsap.to(prev, { opacity: 0, duration: dur * .55, ease: "power1.out", onComplete() { if (actual !== prev) prev.classList.remove("activa"); } });
  }
  el.classList.add("activa");
  gsap.killTweensOf(el);
  gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: dur, delay: prev ? dur * .35 : 0, ease: "power1.inOut" });
}

/* ─────────── texto animable ─────────── */
function partirLetras(el, texto) {
  el.textContent = "";
  const letras = [];
  texto.split(/(\s+)/).forEach(tok => {
    if (!tok) return;
    if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(" ")); return; }
    const w = document.createElement("span");
    w.className = "pal";
    for (const ch of tok) {
      const s = document.createElement("span");
      s.className = "le"; s.textContent = ch;
      w.appendChild(s); letras.push(s);
    }
    el.appendChild(w);
  });
  return letras;
}
function partirPalabras(el, texto) {
  el.textContent = "";
  const ps = [];
  const pals = texto.split(/\s+/).filter(Boolean);
  pals.forEach((w, k) => {
    const s = document.createElement("span");
    s.className = "pa"; s.textContent = w;
    el.appendChild(s); ps.push(s);
    if (k < pals.length - 1) el.appendChild(document.createTextNode(" "));
  });
  return ps;
}

/* ─────────── avisos ─────────── */
let toAviso = null;
function aviso(txt, ms = 3800) {
  const el = $("#aviso");
  el.textContent = txt;
  gsap.killTweensOf(el);
  gsap.fromTo(el, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: .7, ease: "power3.out" });
  clearTimeout(toAviso);
  toAviso = setTimeout(() => gsap.to(el, { opacity: 0, y: -8, duration: .7 }), ms);
}
let deseoIdx = 0, toDeseo = null;
Cielo.on("deseo", () => {
  const d = CONFIG.deseos || [];
  if (!d.length) return;
  $("#deseo-texto").textContent = d[deseoIdx++ % d.length];
  Sonido.deseo(); vibrar([10, 40, 10]);
  gsap.killTweensOf("#aviso"); gsap.set("#aviso", { opacity: 0 });
  gsap.killTweensOf("#deseo");
  gsap.fromTo("#deseo", { opacity: 0, y: -14, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .7, ease: "power3.out" });
  clearTimeout(toDeseo);
  toDeseo = setTimeout(() => gsap.to("#deseo", { opacity: 0, y: -10, duration: .7 }), 5400);
});

/* ─────────── carga ─────────── */
function progreso(p) {
  $("#carga-arco").style.strokeDashoffset = String(339.3 * (1 - p));
  $("#carga-pct").textContent = Math.round(p * 100) + "%";
}
function precargar(lista) {
  let n = 0;
  const unicos = [...new Set(lista)];
  return Promise.all(unicos.map(src => new Promise(res => {
    const im = new Image();
    let hecho = false;
    const fin = () => { if (hecho) return; hecho = true; imgs[src] = im; progreso(++n / unicos.length * .97); res(); };
    im.onload = fin; im.onerror = fin;
    setTimeout(fin, 15000);
    im.src = src;
  })));
}

function rellenarTextos() {
  $("#luna-img").src = LUNA;
  $("#inicio-para").textContent = CONFIG.paraQuien || "";
  $("#inicio-titulo").textContent = CONFIG.titulo || "Escrito en las estrellas";
  $("#inicio-sub").textContent = CONFIG.subtitulo || "";
  const base = (CONFIG.textoAnillo || "✦ para ti ").trim() + " ";
  const veces = Math.max(1, Math.round(74 / base.length));
  const tp = $("#luna-texto");
  tp.textContent = base.repeat(veces);
  tp.setAttribute("textLength", "826");
  tp.setAttribute("lengthAdjust", "spacing");
  $("#hud-t").textContent = N;
  document.title = (CONFIG.titulo || "Escrito en las estrellas") + " ✦";
}

/* ─────────── portada ─────────── */
const SEL_PORTADA = "#s-inicio .luna-marco, #inicio-para, #inicio-titulo, #inicio-sub, #btn-empezar, #s-inicio .inicio-nota";
function entrarPortada() {
  mostrar("s-inicio", 1.2);
  gsap.fromTo(SEL_PORTADA, { opacity: 0, y: 28, filter: "blur(12px)" },
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4, stagger: .15, ease: "power3.out", delay: .35, clearProps: "filter" });
  gsap.fromTo("#s-inicio .luna-marco", { scale: .82 }, { scale: 1, duration: 2.4, ease: "expo.out", delay: .35 });
}

let empezado = false;
$("#btn-empezar").addEventListener("click", async () => {
  if (empezado) return;
  empezado = true;
  Sonido.desbloquear();
  Sonido.iniciarMusica();
  Sonido.soplo(3.2);
  const bm = $("#btn-musica");
  bm.classList.remove("oculto");
  gsap.fromTo(bm, { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .8, delay: 2.4, ease: "back.out(2)" });
  gsap.to(SEL_PORTADA, { opacity: 0, y: -26, filter: "blur(14px)", duration: .75, stagger: .05, ease: "power2.in" });
  await esperar(450);
  await Cielo.warp();
  if (Estado.n === 0 && !Estado.prologoVisto) prologo();
  else entrarCielo(true);
});

/* ─────────── prólogo ─────────── */
let alTocar = null, saltado = false;
function esperaOToque(ms) {
  return new Promise(res => {
    const to = setTimeout(fin, ms);
    function fin() { clearTimeout(to); alTocar = null; res(); }
    alTocar = fin;
  });
}
$("#s-prologo").addEventListener("click", e => { if (e.target.closest("#btn-saltar")) return; if (alTocar) alTocar(); });
$("#btn-saltar").addEventListener("click", e => { e.stopPropagation(); saltado = true; if (alTocar) alTocar(); });

async function prologo() {
  mostrar("s-prologo", .8);
  gsap.fromTo("#s-prologo .prologo-toca, #btn-saltar", { opacity: 0 }, { opacity: 1, duration: 1, delay: 1.5 });
  await esperar(650);
  const el = $("#prologo-linea");
  for (const linea of (CONFIG.prologo || [])) {
    if (saltado) break;
    const letras = partirLetras(el, linea);
    gsap.set(el, { opacity: 1, y: 0, filter: "none" });
    const st = Math.min(.034, 1.7 / Math.max(1, letras.length));
    const tw = gsap.fromTo(letras, { opacity: 0, y: 10, filter: "blur(8px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: .9, stagger: st, ease: "power2.out" });
    await esperaOToque((.9 + st * letras.length) * 1000);
    tw.progress(1);
    if (saltado) break;
    await esperaOToque(Math.max(1800, linea.length * 44));
    if (saltado) break;
    await animar(el, { opacity: 0, y: -10, filter: "blur(8px)", duration: .6, ease: "power2.in" });
  }
  Estado.prologoVisto = true;
  Estado.guardar();
  gsap.to(el, { opacity: 0, duration: .4 });
  entrarCielo(false);
}

/* ─────────── cielo ─────────── */
let ultimaAbierta = -1, estrellasVisibles = false;
function siguiente(desde) {
  for (let k = 1; k <= N; k++) {
    const j = (((desde + k) % N) + N) % N;
    if (!Estado.esta(j)) return j;
  }
  return -1;
}
function actualizarHUD(anim) {
  $("#hud-n").textContent = Estado.n;
  $("#hud-barra").style.width = (Estado.n / N * 100) + "%";
  $("#hud-label").textContent = Estado.n === N ? "nuestro cielo completo" : (Estado.n === 1 ? "estrella encendida" : "estrellas encendidas");
  if (anim) gsap.fromTo("#hud-n", { scale: 1.7 }, { scale: 1, duration: .9, ease: "elastic.out(1,.45)" });
}
function ponerPista(txt) {
  const el = $("#hud-pista");
  if (el.textContent === txt) { gsap.to(el, { opacity: 1, duration: .4 }); return; }
  gsap.killTweensOf(el);
  gsap.to(el, { opacity: 0, duration: .3, onComplete() { el.textContent = txt; gsap.to(el, { opacity: 1, duration: .7 }); } });
}
function actualizarPista() {
  const completo = Estado.n === N;
  Cielo.setPista(completo ? -1 : siguiente(ultimaAbierta));
  if (Estado.n === 0) ponerPista("Toca la estrella que late para encenderla ✦");
  else if (completo) ponerPista("Nuestro cielo está completo. Toca cualquier estrella para volver a leerla.");
  else ponerPista("Sigue encendiendo estrellas… ¿qué irán dibujando?");
  const bf = $("#btn-ver-final");
  if (completo && bf.classList.contains("oculto")) {
    bf.classList.remove("oculto");
    gsap.fromTo(bf, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .8, ease: "power3.out" });
  } else if (!completo) bf.classList.add("oculto");
}
function avisoProgreso() {
  const n = Estado.n, mitad = Math.ceil(N / 2);
  const mapa = {};
  mapa[1] = "Tu primera estrella ya brilla ✦";
  if (N > 6) mapa[3] = "Si ves pasar una estrella fugaz, tócala y pide un deseo ☄";
  if (N > 10) mapa[5] = "Algo empieza a dibujarse en el cielo…";
  if (N > 4) mapa[mitad] = "Ya vas por la mitad de nuestro cielo";
  if (N > 12) mapa[N - 5] = "¿Ya ves lo que estamos dibujando?";
  if (N > 2) mapa[N - 1] = "Solo falta una estrella…";
  if (mapa[n]) aviso(mapa[n]);
}

async function entrarCielo(volviendo) {
  mostrar("s-cielo", 1);
  Cielo.setEncendidas(Estado.encendidas);
  actualizarHUD(false);
  gsap.set("#hud, #s-cielo .hud-abajo", { opacity: 1 });
  gsap.fromTo("#hud", { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 1, delay: .7, ease: "power3.out" });
  if (Estado.n === N) Cielo.setFinal(.4, 2.5);
  if (!estrellasVisibles) { estrellasVisibles = true; await Cielo.mostrarEstrellas(i => Sonido.aparecer(i)); }
  if (Estado.n === N && !Estado.finalVisto) { lanzarFinal(); return; }
  Cielo.setInteractivo(true);
  Cielo.setFugaces(true);
  actualizarPista();
  if (volviendo && Estado.n > 0 && Estado.n < N) aviso("Tu cielo te estaba esperando ✦");
}

Cielo.on("estrella", i => {
  if (bloqueado || modalAbierto || !actual || actual.id !== "s-cielo") return;
  abrirRecuerdo(i, { foco: true });
});

/* ─────────── recuerdo ─────────── */
let modalAbierto = false, bloqueado = false, actualRec = -1, modoRevisita = false, desdeFinal = false, tlRecuerdo = null;
const ESCRITORIO = "(min-width:900px) and (min-aspect-ratio:1/1)";

function tamFoto(im) {
  const desk = window.matchMedia(ESCRITORIO).matches;
  let bw, bh;
  if (desk) {
    bw = Math.min(1080, innerWidth * .94) - 40 - 32 - 390;
    bh = Math.min(innerHeight * .88, 860) - 40;
  } else {
    bw = Math.min(470, innerWidth - 24) - 24;
    bh = Math.max(200, innerHeight * .5);
  }
  const r = im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : 1;
  let w = bw, h = w / r;
  if (h > bh) { h = bh; w = h * r; }
  w = Math.max(w, bw * (desk ? .5 : .62));
  return { w: Math.round(w), h: Math.round(h) };
}
function ajustarFoto() {
  if (!modalAbierto || actualRec < 0) return;
  const { w, h } = tamFoto(imgs[REC[actualRec].src]);
  const f = $("#rc-foto");
  f.style.width = w + "px"; f.style.height = h + "px";
}
function rellenarRecuerdo(i) {
  const r = REC[i];
  $("#rc-img").src = r.src; $("#rc-bg").src = r.src; $("#rc-img").alt = r.titulo;
  $("#rc-num").textContent = "Estrella " + pad(i + 1) + " · de " + pad(N);
  $("#rc-titulo").textContent = r.titulo;
  const pals = partirPalabras($("#rc-msg"), r.mensaje);
  const quedan = REC.some((_, j) => j !== i && !Estado.esta(j));
  const sig = $("#rc-sig span"), ico = $("#rc-sig i");
  if (modoRevisita || desdeFinal) { sig.textContent = "Siguiente recuerdo"; ico.textContent = "›"; }
  else if (quedan) { sig.textContent = "Encender la siguiente"; ico.textContent = "✦"; }
  else { sig.textContent = "Ver lo que dibujamos"; ico.textContent = "♥"; }
  $("#rc-volver").textContent = desdeFinal ? "Volver" : "Volver al cielo";
  return pals;
}
async function abrirRecuerdo(i, o = {}) {
  if (bloqueado || modalAbierto || i < 0 || i >= N) return;
  bloqueado = true; modalAbierto = true; actualRec = i;
  desdeFinal = !!o.desdeFinal;
  modoRevisita = Estado.finalVisto;
  Estado.encender(i);
  Cielo.setInteractivo(false);
  Cielo.setPista(-1);
  Sonido.estrella(i); vibrar(12);
  gsap.to("#hud-pista", { opacity: 0, duration: .4 });
  const conFoco = o.foco !== false;
  if (conFoco) Cielo.enfocar(i);
  Sonido.bajarMusica(.45);
  const pals = rellenarRecuerdo(i);
  await esperar(conFoco ? 480 : 60);

  const m = $("#recuerdo");
  m.hidden = false;
  document.body.classList.add("modal-abierto");
  ajustarFoto();
  $("#rc-tarjeta").scrollTop = 0; $("#rc-cuerpo").scrollTop = 0;
  const st = Math.min(.024, 1.5 / Math.max(1, pals.length));
  tlRecuerdo = gsap.timeline({ defaults: { ease: "power3.out" } })
    .fromTo("#rc-fondo", { opacity: 0 }, { opacity: 1, duration: .6, ease: "power1.out" }, 0)
    .fromTo("#rc-cerrar", { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: .5 }, .3)
    .fromTo("#rc-tarjeta", { opacity: 0, y: 46, scale: .94, filter: "blur(14px)" },
      { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1, ease: "expo.out", clearProps: "filter" }, .05)
    .fromTo("#rc-foto", { clipPath: "inset(0% 0% 100% 0% round 20px)" },
      { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1.2, ease: "expo.inOut" }, .15)
    .fromTo("#rc-brillo", { xPercent: -110 }, { xPercent: 110, duration: 1.3, ease: "power2.inOut" }, .95)
    .fromTo("#rc-num, #rc-titulo", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .8, stagger: .1 }, .55)
    .fromTo("#rc-sep", { opacity: 0, scaleX: .3 }, { opacity: 1, scaleX: 1, duration: .8 }, .75)
    .fromTo(pals, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .6, stagger: st }, .85)
    .fromTo("#rc-acciones", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .6 }, .85 + st * pals.length * .5);
  bloqueado = false;
  try { $("#rc-sig").focus({ preventScroll: true }); } catch (e) { /* sin foco */ }
}
async function cerrarRecuerdo(accion) {
  if (!modalAbierto || bloqueado) return;
  bloqueado = true;
  const i = actualRec;
  if (tlRecuerdo) { tlRecuerdo.kill(); tlRecuerdo = null; }
  await new Promise(r => gsap.timeline({ onComplete: r })
    .to("#rc-tarjeta", { opacity: 0, y: 26, scale: .96, duration: .45, ease: "power2.in" }, 0)
    .to("#rc-cerrar", { opacity: 0, duration: .3 }, 0)
    .to("#rc-fondo", { opacity: 0, duration: .55, ease: "power1.in" }, .1));
  $("#recuerdo").hidden = true;
  document.body.classList.remove("modal-abierto");
  modalAbierto = false;
  Sonido.bajarMusica(.75);

  if (desdeFinal) {
    bloqueado = false;
    if (accion === "siguiente") abrirRecuerdo((i + 1) % N, { foco: false, desdeFinal: true });
    return;
  }

  Cielo.desenfocar();
  const nueva = !Cielo.encendida(i);
  ultimaAbierta = i;
  if (nueva) {
    await esperar(420);
    Cielo.encender(i);
    Sonido.encender(i);
    vibrar([8, 30, 14]);
    actualizarHUD(true);
  }
  if (Estado.n === N && !Estado.finalVisto) {
    bloqueado = false;
    await esperar(nueva ? 2300 : 600);
    lanzarFinal();
    return;
  }
  if (nueva) avisoProgreso();
  if (accion === "siguiente") {
    const j = modoRevisita ? (i + 1) % N : siguiente(i);
    if (j >= 0) {
      await esperar(nueva ? 1500 : 450);
      bloqueado = false;
      abrirRecuerdo(j, { foco: true });
      return;
    }
  }
  bloqueado = false;
  Cielo.setInteractivo(true);
  actualizarPista();
}
$("#rc-volver").addEventListener("click", () => cerrarRecuerdo("volver"));
$("#rc-cerrar").addEventListener("click", () => cerrarRecuerdo("volver"));
$("#rc-fondo").addEventListener("click", () => cerrarRecuerdo("volver"));
$("#rc-sig").addEventListener("click", () => cerrarRecuerdo("siguiente"));
$("#rc-tarjeta").addEventListener("click", e => {
  if (e.target.closest("button")) return;
  if (tlRecuerdo && tlRecuerdo.isActive()) tlRecuerdo.progress(1);
});

/* ─────────── final ─────────── */
let finalEnCurso = false, mosaicoListo = false;
async function lanzarFinal() {
  if (finalEnCurso) return;
  finalEnCurso = true;
  Estado.finalVisto = true;
  Estado.guardar();
  Cielo.setInteractivo(false); Cielo.setFugaces(false); Cielo.setPista(-1);
  gsap.to("#hud, #s-cielo .hud-abajo", { opacity: 0, duration: .8 });
  Sonido.final();
  vibrar([20, 70, 20, 70, 40]);
  await Cielo.final();
  await verFinal(true);
  finalEnCurso = false;
}
async function verFinal(primeraVez) {
  Cielo.setInteractivo(false); Cielo.setFugaces(false); Cielo.setPista(-1);
  Cielo.setFinal(1, 1.4);
  Cielo.desenfocar();
  $("#velo").classList.remove("on");
  $("#btn-carta").classList.add("oculto");
  mostrar("s-final", 1);
  const letras = partirLetras($("#final-frase"), CONFIG.fraseFinal || "");
  gsap.fromTo(letras, { opacity: 0, y: 12, filter: "blur(8px)" },
    { opacity: 1, y: 0, filter: "blur(0px)", duration: 1, stagger: Math.min(.04, 2 / Math.max(1, letras.length)), ease: "power2.out", delay: .5 });
  await esperar(primeraVez ? 1500 : 700);
  await construirMosaico(true);
  const b = $("#btn-carta");
  b.classList.remove("oculto");
  gsap.fromTo(b, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .9, ease: "power3.out" });
}

function tamTeja() { const g = Cielo.geometria(); return Math.round(Math.max(42, Math.min(124, g.paso * 1.04))); }
function tamCentro() { const g = Cielo.geometria(); return Math.round(Math.max(84, Math.min(260, g.ancho * .3))); }
function construirMosaico(anim) {
  const cont = $("#mosaico");
  cont.innerHTML = "";
  const s = tamTeja();
  const tejas = REC.map((r, i) => {
    const t = document.createElement("button");
    t.type = "button";
    t.className = "teja";
    t.setAttribute("aria-label", r.titulo);
    t.style.setProperty("--s", s + "px");
    t.style.setProperty("--r", (((i * 37) % 17) - 8) + "deg");
    t.style.setProperty("--d", (-((i * .61) % 5)).toFixed(2) + "s");
    t.innerHTML = '<div class="teja-in"><img alt="" src="' + r.src + '"></div>';
    t.addEventListener("click", () => abrirRecuerdo(i, { foco: false, desdeFinal: true }));
    const p = Cielo.posPantalla(i);
    gsap.set(t, { x: p.x, y: p.y });
    cont.appendChild(t);
    return t;
  });
  const c = document.createElement("div");
  c.className = "teja-centro";
  const sc = tamCentro();
  c.style.setProperty("--s", sc + "px");
  c.innerHTML = '<div class="luna-halo"></div><div class="luna"><img alt="" src="' + LUNA + '"></div>';
  const g = Cielo.geometria();
  gsap.set(c, { x: g.centro.x, y: g.centro.y + g.alto * .04 });
  cont.appendChild(c);
  mosaicoListo = true;
  if (!anim) return Promise.resolve();
  return new Promise(res => {
    gsap.fromTo(tejas, { scale: 0, opacity: 0, rotation: -30 }, {
      scale: 1, opacity: 1, rotation: 0, duration: .9, ease: "back.out(1.7)", stagger: .075,
      onStart() { /* noop */ },
    });
    tejas.forEach((t, i) => setTimeout(() => {
      const p = Cielo.posPantalla(i);
      Cielo.chispa(p.x, p.y, { n: 14, s: .7, v: .6, anillo: 40 });
      Sonido.aparecer(i);
    }, i * 75));
    gsap.fromTo(c, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: "expo.out", delay: N * .075 + .2,
      onStart() { Cielo.chispa(g.centro.x, g.centro.y, { n: 80, anillo: 160 }); Sonido.encender(0); } });
    setTimeout(res, N * 75 + 1400);
  });
}
function reubicarMosaico() {
  if (!mosaicoListo) return;
  const s = tamTeja();
  document.querySelectorAll("#mosaico .teja").forEach((t, i) => {
    t.style.setProperty("--s", s + "px");
    const p = Cielo.posPantalla(i);
    gsap.set(t, { x: p.x, y: p.y });
  });
  const c = document.querySelector("#mosaico .teja-centro");
  if (c) { const g = Cielo.geometria(); c.style.setProperty("--s", tamCentro() + "px"); gsap.set(c, { x: g.centro.x, y: g.centro.y + g.alto * .04 }); }
}
Cielo.on("resize", () => { reubicarMosaico(); ajustarFoto(); });

/* ─────────── carta ─────────── */
let cartaLista = false, intervalo = null;
function prepararCarta() {
  if (cartaLista) return;
  cartaLista = true;
  const cf = CONFIG.cartaFinal || {};
  $("#carta-titulo").textContent = cf.titulo || "";
  const tx = $("#carta-texto");
  (cf.parrafos || []).forEach(p => { const el = document.createElement("p"); el.textContent = p; tx.appendChild(el); });
  $("#carta-firma").textContent = cf.firma || "";
  const fotos = (EXTRA.length ? EXTRA : REC.map(r => r.src)).slice(0, 4);
  const fc = $("#carta-fotos");
  fotos.forEach(src => {
    const d = document.createElement("div");
    d.className = "polaroid";
    d.innerHTML = '<img alt="" src="' + src + '">';
    fc.appendChild(d);
  });
}
function iniciarContador() {
  const f = CONFIG.fechaInicio;
  if (!f) return;
  const d = new Date(f + "T00:00:00");
  if (isNaN(d.getTime()) || d > new Date()) return;
  $("#contador").classList.remove("oculto");
  const tick = () => {
    let s = Math.floor((Date.now() - d.getTime()) / 1000);
    const dd = Math.floor(s / 86400); s %= 86400;
    const hh = Math.floor(s / 3600); s %= 3600;
    const mm = Math.floor(s / 60); s %= 60;
    $("#c-dias").textContent = dd.toLocaleString("es");
    $("#c-horas").textContent = pad(hh); $("#c-min").textContent = pad(mm); $("#c-seg").textContent = pad(s);
  };
  tick();
  clearInterval(intervalo);
  intervalo = setInterval(tick, 1000);
}
function abrirCarta() {
  prepararCarta();
  iniciarContador();
  $("#velo").classList.add("on");
  Cielo.setFinal(.55, 1.5);
  mostrar("s-carta", 1);
  $("#carta").scrollTop = 0;
  const pols = document.querySelectorAll("#carta-fotos .polaroid");
  const w = pols[0] ? pols[0].offsetWidth : 90;
  const n = pols.length;
  gsap.fromTo("#carta", { opacity: 0, y: 34, scale: .97, filter: "blur(12px)" },
    { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 1.2, ease: "expo.out", delay: .3, clearProps: "filter" });
  pols.forEach((p, k) => {
    const off = k - (n - 1) / 2;
    gsap.fromTo(p, { x: 0, y: 30, rotation: 0, opacity: 0 },
      { x: off * w * .66, y: Math.abs(off) * 8, rotation: off * 9, opacity: 1, duration: 1.1, ease: "back.out(1.5)", delay: .7 + k * .12 });
  });
  gsap.fromTo("#carta-titulo", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, delay: 1 });
  gsap.fromTo("#carta-texto p", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.1, stagger: .45, delay: 1.25, ease: "power2.out" });
  const fin = 1.25 + document.querySelectorAll("#carta-texto p").length * .45;
  gsap.fromTo("#contador", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 1, delay: fin });
  gsap.fromTo("#carta-firma", { clipPath: "inset(0% 100% 0% 0%)", opacity: 1 }, { clipPath: "inset(0% 0% 0% 0%)", duration: 2, ease: "power2.inOut", delay: fin + .3 });
  gsap.fromTo(".carta-acciones", { opacity: 0 }, { opacity: 1, duration: 1, delay: fin + 1.4 });
}
$("#btn-carta").addEventListener("click", abrirCarta);

$("#btn-volver-cielo").addEventListener("click", () => {
  $("#velo").classList.remove("on");
  clearInterval(intervalo);
  Cielo.setFinal(.4, 1.5);
  mostrar("s-cielo", 1);
  gsap.to("#hud, #s-cielo .hud-abajo", { opacity: 1, duration: .9, delay: .4 });
  actualizarHUD(false);
  Cielo.setInteractivo(true);
  Cielo.setFugaces(true);
  actualizarPista();
});
$("#btn-ver-final").addEventListener("click", () => {
  if (modalAbierto || bloqueado) return;
  gsap.to("#hud, #s-cielo .hud-abajo", { opacity: 0, duration: .6 });
  verFinal(false);
});

let confirmar = false, toConf = null;
$("#btn-reiniciar").addEventListener("click", () => {
  const b = $("#btn-reiniciar");
  if (!confirmar) {
    confirmar = true;
    b.textContent = "¿De verdad? Toca otra vez";
    toConf = setTimeout(() => { confirmar = false; b.textContent = "Empezar de nuevo"; }, 3500);
    return;
  }
  clearTimeout(toConf);
  Estado.reiniciar();
  location.reload();
});

/* ─────────── música y teclado ─────────── */
$("#btn-musica").addEventListener("click", () => {
  const on = Sonido.alternar();
  const b = $("#btn-musica");
  b.classList.toggle("pausado", !on);
  b.setAttribute("aria-label", on ? "Pausar música" : "Reanudar música");
});
document.addEventListener("keydown", e => {
  if (modalAbierto) {
    if (e.key === "Escape") cerrarRecuerdo("volver");
    else if (e.key === "ArrowRight") cerrarRecuerdo("siguiente");
    return;
  }
  if (actual && actual.id === "s-prologo" && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); if (alTocar) alTocar(); return; }
  if (actual && actual.id === "s-cielo" && (e.key === "Enter" || e.key === " ") && document.activeElement === document.body) {
    e.preventDefault();
    const j = Estado.n === N ? 0 : siguiente(ultimaAbierta);
    if (j >= 0) abrirRecuerdo(j, { foco: true });
  }
});

/* ─────────── arranque ─────────── */
async function iniciar() {
  Estado.cargar();
  Cielo.init($("#cielo"), N);
  Sonido.cargarMusica(RUTA + (CONFIG.cancion || "cancion.mp3"));
  rellenarTextos();
  mostrar("s-carga", .6);
  const t0 = performance.now();
  const fuentes = document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, esperar(3000)]) : Promise.resolve();
  await Promise.all([precargar([LUNA, ...REC.map(r => r.src), ...EXTRA]), fuentes]);
  progreso(1);
  const resto = 1500 - (performance.now() - t0);
  if (resto > 0) await esperar(resto);
  await esperar(300);
  entrarPortada();
}
iniciar();

// acceso para pruebas desde la consola
window.__regalo = { Estado, abrirRecuerdo, cerrarRecuerdo, lanzarFinal, abrirCarta, get actual() { return actual && actual.id; } };
})();
