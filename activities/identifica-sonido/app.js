// ============================================================
// Identificá el sonido — Web Audio API
// Todos los sonidos están SINTETIZADOS en vivo (sin assets).
// Visualización: osciloscopio en tiempo real (time-domain).
// ============================================================

const track = (e, d) => { try { window.umami?.track(e, d); } catch (_) {} };

// ─── Web Audio context (lazy, requiere gesto del usuario) ──
let audioCtx = null;
let analyser = null;
let masterGain = null;

function ensureAudio() {
  if (audioCtx) {
    if (audioCtx.state === "suspended") audioCtx.resume();
    return;
  }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.6;
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(analyser);
  analyser.connect(audioCtx.destination);
}

// ─── Helpers ──────────────────────────────────────────────
function envelope(node, when, attack, sustainLevel, hold, release) {
  const gain = node.gain;
  gain.setValueAtTime(0.0001, when);
  gain.exponentialRampToValueAtTime(sustainLevel, when + attack);
  gain.setValueAtTime(sustainLevel, when + attack + hold);
  gain.exponentialRampToValueAtTime(0.0001, when + attack + hold + release);
}

function createNoise(ctx, type = "white", duration = 2) {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.ceil(sr * duration), sr);
  const data = buf.getChannelData(0);
  if (type === "white") {
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === "pink") {
    // Paul Kellet pink noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else if (type === "brown") {
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buf;
}

function noiseSource(ctx, type, dur) {
  const src = ctx.createBufferSource();
  src.buffer = createNoise(ctx, type, dur);
  return src;
}

// ============================================================
// CATÁLOGO DE SONIDOS — cada uno demuestra una técnica distinta
// ============================================================

function playPiano(ctx, out) {
  // Acorde C mayor (C4, E4, G4) — staggered + 5 parciales por nota
  const freqs = [261.63, 329.63, 392.0];
  const dur = 1.8;
  freqs.forEach((f, i) => {
    const start = ctx.currentTime + i * 0.05;
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0, start);
    noteGain.gain.linearRampToValueAtTime(0.22, start + 0.005);
    noteGain.gain.exponentialRampToValueAtTime(0.001, start + dur);
    noteGain.connect(out);

    [1, 2, 3, 4, 5].forEach((n, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? "triangle" : "sine";
      osc.frequency.value = f * n;
      const partialGain = ctx.createGain();
      partialGain.gain.value = [1, 0.45, 0.18, 0.08, 0.04][idx];
      osc.connect(partialGain).connect(noteGain);
      osc.start(start);
      osc.stop(start + dur);
    });
  });
  return dur;
}

function playFlute(ctx, out) {
  // Melodía corta de 4 notas: E5 G5 E5 D5
  // Sine puro + vibrato + lowpass suave
  const notes = [659.25, 783.99, 659.25, 587.33];
  const noteDur = 0.42;
  const total = noteDur * notes.length;

  notes.forEach((f, i) => {
    const t0 = ctx.currentTime + i * noteDur;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, t0);

    // Vibrato
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = f * 0.008;
    lfo.connect(lfoGain).connect(osc.frequency);

    // Soplo (ruido aireado)
    const noise = noiseSource(ctx, "white", noteDur);
    const noiseHP = ctx.createBiquadFilter();
    noiseHP.type = "highpass";
    noiseHP.frequency.value = 3000;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.02;
    noise.connect(noiseHP).connect(noiseGain).connect(out);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.18, t0 + 0.08);
    g.gain.setValueAtTime(0.18, t0 + noteDur - 0.08);
    g.gain.linearRampToValueAtTime(0.0001, t0 + noteDur);

    osc.connect(lp).connect(g).connect(out);
    osc.start(t0); osc.stop(t0 + noteDur);
    lfo.start(t0); lfo.stop(t0 + noteDur);
    noise.start(t0); noise.stop(t0 + noteDur);
  });

  return total;
}

function playDrum(ctx, out) {
  // Patrón: kick - snare - kick - kick-snare
  const t = ctx.currentTime;
  const pattern = [
    { type: "kick",  at: 0     },
    { type: "snare", at: 0.35  },
    { type: "kick",  at: 0.7   },
    { type: "kick",  at: 0.95  },
    { type: "snare", at: 1.15  },
  ];

  pattern.forEach((step) => {
    const when = t + step.at;
    if (step.type === "kick") {
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(140, when);
      osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.55, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.2);
      osc.connect(g).connect(out);
      osc.start(when); osc.stop(when + 0.22);
    } else {
      // Snare: ruido + ping
      const n = noiseSource(ctx, "white", 0.2);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      bp.Q.value = 0.8;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.35, when);
      ng.gain.exponentialRampToValueAtTime(0.001, when + 0.16);
      n.connect(bp).connect(ng).connect(out);
      n.start(when); n.stop(when + 0.2);

      const tone = ctx.createOscillator();
      tone.frequency.value = 200;
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0.18, when);
      tg.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
      tone.connect(tg).connect(out);
      tone.start(when); tone.stop(when + 0.1);
    }
  });

  return 1.4;
}

function playGuitar(ctx, out) {
  // Arpegio E A D (em chord style)
  const freqs = [164.81, 220.0, 293.66];
  const dur = 1.6;

  freqs.forEach((f, i) => {
    const start = ctx.currentTime + i * 0.18;
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.value = f;
    const osc2 = ctx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.value = f * 2.01;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.setValueAtTime(3500, start);
    lp.frequency.exponentialRampToValueAtTime(400, start + 1.0);
    lp.Q.value = 2.5;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.28, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, start + 1.0);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.value = 0.18;

    osc1.connect(lp);
    osc2.connect(osc2Gain).connect(lp);
    lp.connect(g).connect(out);

    osc1.start(start); osc1.stop(start + 1.1);
    osc2.start(start); osc2.stop(start + 1.1);
  });

  return dur;
}

function playViolin(ctx, out) {
  // Una nota larga: A4 (440Hz) con sawtooth + bandpass + vibrato fuerte
  const start = ctx.currentTime;
  const dur = 1.8;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 440;

  // Vibrato
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 6;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 8;
  lfo.connect(lfoGain).connect(osc.frequency);

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1200;
  bp.Q.value = 1.4;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 3500;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.18, start + 0.25);
  g.gain.setValueAtTime(0.18, start + dur - 0.3);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);

  osc.connect(bp).connect(lp).connect(g).connect(out);
  osc.start(start); osc.stop(start + dur);
  lfo.start(start); lfo.stop(start + dur);

  return dur;
}

function playTrumpet(ctx, out) {
  // Fanfarrita: C5 G5 C6 G5 sostenido
  const seq = [
    { f: 523.25, dur: 0.18 },
    { f: 783.99, dur: 0.18 },
    { f: 1046.5, dur: 0.18 },
    { f: 783.99, dur: 0.6  },
  ];

  let t = ctx.currentTime;
  let total = 0;
  seq.forEach((step) => {
    const start = t;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = step.f;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1600;
    bp.Q.value = 1.2;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 350;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(0.22, start + 0.02);
    g.gain.setValueAtTime(0.22, start + step.dur - 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, start + step.dur);

    osc.connect(hp).connect(bp).connect(g).connect(out);
    osc.start(start); osc.stop(start + step.dur);

    t += step.dur;
    total += step.dur;
  });

  return total;
}

function playRain(ctx, out) {
  const start = ctx.currentTime;
  const dur = 2.4;
  const noise = noiseSource(ctx, "white", dur);

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1800;

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 6000;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.32, start + 0.3);
  g.gain.setValueAtTime(0.32, start + dur - 0.4);
  g.gain.linearRampToValueAtTime(0.0001, start + dur);

  // Pequeña modulación AM para que no sea ruido plano
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 2.5;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain).connect(g.gain);

  noise.connect(hp).connect(lp).connect(g).connect(out);
  noise.start(start); noise.stop(start + dur);
  lfo.start(start); lfo.stop(start + dur);

  return dur;
}

function playWind(ctx, out) {
  const start = ctx.currentTime;
  const dur = 2.8;
  const noise = noiseSource(ctx, "pink", dur);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(400, start);
  lp.frequency.linearRampToValueAtTime(800, start + 1.2);
  lp.frequency.linearRampToValueAtTime(300, start + dur);
  lp.Q.value = 4;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.45, start + 0.5);
  g.gain.linearRampToValueAtTime(0.3, start + 1.6);
  g.gain.linearRampToValueAtTime(0.0001, start + dur);

  noise.connect(lp).connect(g).connect(out);
  noise.start(start); noise.stop(start + dur);

  return dur;
}

function playThunder(ctx, out) {
  const start = ctx.currentTime;
  const dur = 2.6;
  const noise = noiseSource(ctx, "brown", dur);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 200;

  const g = ctx.createGain();
  // Estallido: súbita subida + rumble largo
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.7, start + 0.08);
  g.gain.exponentialRampToValueAtTime(0.4, start + 0.4);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);

  // Sub-bass que cae
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(60, start);
  sub.frequency.exponentialRampToValueAtTime(28, start + 0.8);
  const subGain = ctx.createGain();
  subGain.gain.setValueAtTime(0.25, start);
  subGain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);
  sub.connect(subGain).connect(out);
  sub.start(start); sub.stop(start + 1.3);

  noise.connect(lp).connect(g).connect(out);
  noise.start(start); noise.stop(start + dur);

  return dur;
}

function playWaves(ctx, out) {
  const start = ctx.currentTime;
  const dur = 3.0;
  const noise = noiseSource(ctx, "white", dur);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 900;

  const g = ctx.createGain();
  g.gain.value = 0;

  // 2 swells de ~1.5s cada uno
  const t1 = start;
  const t2 = start + 1.4;
  [t1, t2].forEach((t) => {
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.45, t + 0.55);
    g.gain.linearRampToValueAtTime(0.001, t + 1.2);
  });

  noise.connect(lp).connect(g).connect(out);
  noise.start(start); noise.stop(start + dur);

  return dur;
}

function playFire(ctx, out) {
  const start = ctx.currentTime;
  const dur = 2.6;

  // Base: pink noise filtrado bajo
  const bed = noiseSource(ctx, "pink", dur);
  const bedLP = ctx.createBiquadFilter();
  bedLP.type = "lowpass";
  bedLP.frequency.value = 1200;
  const bedG = ctx.createGain();
  bedG.gain.setValueAtTime(0, start);
  bedG.gain.linearRampToValueAtTime(0.22, start + 0.2);
  bedG.gain.setValueAtTime(0.22, start + dur - 0.3);
  bedG.gain.linearRampToValueAtTime(0.0001, start + dur);
  bed.connect(bedLP).connect(bedG).connect(out);
  bed.start(start); bed.stop(start + dur);

  // Chispas (crackles): pequeñas impulsos high-pass
  const NUM_CRACKLES = 14;
  for (let i = 0; i < NUM_CRACKLES; i++) {
    const at = start + 0.1 + Math.random() * (dur - 0.4);
    const cr = noiseSource(ctx, "white", 0.05);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3000 + Math.random() * 3000;
    const g = ctx.createGain();
    const amp = 0.15 + Math.random() * 0.25;
    g.gain.setValueAtTime(amp, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + 0.04);
    cr.connect(hp).connect(g).connect(out);
    cr.start(at); cr.stop(at + 0.06);
  }

  return dur;
}

function playBird(ctx, out) {
  // 4 chirps con FM rápida
  const start = ctx.currentTime;
  const chirps = [
    { at: 0.0, base: 2200, dur: 0.18 },
    { at: 0.28, base: 2600, dur: 0.14 },
    { at: 0.5, base: 2000, dur: 0.2 },
    { at: 0.82, base: 2400, dur: 0.22 },
  ];
  let total = 0;

  chirps.forEach((c) => {
    const t = start + c.at;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(c.base, t);
    osc.frequency.linearRampToValueAtTime(c.base + 800, t + c.dur * 0.4);
    osc.frequency.linearRampToValueAtTime(c.base - 300, t + c.dur);

    // FM rápida
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 22;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(osc.frequency);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + c.dur);

    osc.connect(g).connect(out);
    osc.start(t); osc.stop(t + c.dur);
    lfo.start(t); lfo.stop(t + c.dur);

    total = Math.max(total, c.at + c.dur);
  });

  return total + 0.1;
}

// ============================================================
// CATÁLOGO
// ============================================================
const SOUNDS = {
  piano:    { name: "Piano",    category: "Instrumento", color: "#d4a96b", play: playPiano },
  flauta:   { name: "Flauta",   category: "Instrumento", color: "#e8d97a", play: playFlute },
  tambor:   { name: "Tambor",   category: "Instrumento", color: "#d3635c", play: playDrum },
  guitarra: { name: "Guitarra", category: "Instrumento", color: "#c97044", play: playGuitar },
  violin:   { name: "Violín",   category: "Instrumento", color: "#d9844a", play: playViolin },
  trompeta: { name: "Trompeta", category: "Instrumento", color: "#e0b03a", play: playTrumpet },
  lluvia:   { name: "Lluvia",   category: "Naturaleza",  color: "#6ec3d4", play: playRain },
  viento:   { name: "Viento",   category: "Naturaleza",  color: "#8fb8b3", play: playWind },
  trueno:   { name: "Trueno",   category: "Naturaleza",  color: "#8b7fc4", play: playThunder },
  olas:     { name: "Olas",     category: "Naturaleza",  color: "#5b94b3", play: playWaves },
  fuego:    { name: "Fuego",    category: "Naturaleza",  color: "#e07b3a", play: playFire },
  pajaro:   { name: "Pájaro",   category: "Naturaleza",  color: "#8cc06b", play: playBird },
};

// ============================================================
// VISUALIZACIÓN — osciloscopio time-domain
// ============================================================
const canvas = document.getElementById("scope");
const ctx2d = canvas.getContext("2d");
let dataArray = null;
let drawAccent = "#c9a26d";
let isPlaying = false;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resizeCanvas);

function drawScope() {
  const rect = canvas.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;

  // Clear con leve trail
  ctx2d.fillStyle = "rgba(10, 9, 8, 0.4)";
  ctx2d.fillRect(0, 0, W, H);

  // Línea central
  ctx2d.strokeStyle = "rgba(236, 230, 216, 0.06)";
  ctx2d.lineWidth = 1;
  ctx2d.beginPath();
  ctx2d.moveTo(0, H / 2);
  ctx2d.lineTo(W, H / 2);
  ctx2d.stroke();

  if (!analyser || !dataArray) {
    // Idle visual: línea quieta con micro variaciones
    ctx2d.strokeStyle = drawAccent + "55";
    ctx2d.lineWidth = 1.4;
    ctx2d.beginPath();
    for (let x = 0; x < W; x += 4) {
      const y = H / 2 + Math.sin(x * 0.04 + Date.now() * 0.001) * 4;
      if (x === 0) ctx2d.moveTo(x, y);
      else ctx2d.lineTo(x, y);
    }
    ctx2d.stroke();
    return;
  }

  analyser.getFloatTimeDomainData(dataArray);

  // Glow halo cuando suena
  if (isPlaying) {
    ctx2d.shadowBlur = 18;
    ctx2d.shadowColor = drawAccent;
  } else {
    ctx2d.shadowBlur = 0;
  }

  ctx2d.strokeStyle = drawAccent;
  ctx2d.lineWidth = 1.8;
  ctx2d.lineJoin = "round";
  ctx2d.lineCap = "round";
  ctx2d.beginPath();

  const step = Math.max(1, Math.floor(dataArray.length / W));
  for (let x = 0; x < W; x++) {
    const idx = Math.min(dataArray.length - 1, x * step);
    const v = dataArray[idx];
    const y = H / 2 + v * (H * 0.42);
    if (x === 0) ctx2d.moveTo(x, y);
    else ctx2d.lineTo(x, y);
  }
  ctx2d.stroke();
  ctx2d.shadowBlur = 0;
}

function animateScope() {
  drawScope();
  requestAnimationFrame(animateScope);
}

// ============================================================
// JUEGO
// ============================================================
const QUESTIONS_PER_ROUND = 10;
const OPTIONS_PER_QUESTION = 4;

const state = {
  phase: "idle",
  queue: [],
  current: -1,
  options: [],
  awaiting: false,
  score: 0,
  streak: 0,
  bestStreak: 0,
  correctCount: 0,
  wrongCount: 0,
  attempts: 0,
  startedAt: 0,
  playTimer: null,
};

const $ = (id) => document.getElementById(id);
const body = document.body;

function setPhase(p) {
  state.phase = p;
  body.className = `phase-${p}`;
}

function setAccent(color) {
  drawAccent = color;
  document.documentElement.style.setProperty("--accent", color);
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Flujo ────────────────────────────────────────────────
function startGame() {
  ensureAudio();
  if (!dataArray) dataArray = new Float32Array(analyser.fftSize);

  state.queue = shuffle(Object.keys(SOUNDS)).slice(0, QUESTIONS_PER_ROUND);
  state.current = -1;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.attempts = 0;
  state.startedAt = Date.now();

  $("q-total").textContent = String(QUESTIONS_PER_ROUND).padStart(2, "0");
  updateHUD();

  track("game_start");
  setPhase("quiz");
  nextQuestion();
}

function nextQuestion() {
  state.current++;
  if (state.current >= QUESTIONS_PER_ROUND) {
    endGame();
    return;
  }

  const correctId = state.queue[state.current];
  const correctSound = SOUNDS[correctId];

  // 3 distractores random
  const distractors = shuffle(
    Object.keys(SOUNDS).filter((k) => k !== correctId)
  ).slice(0, OPTIONS_PER_QUESTION - 1);

  state.options = shuffle([correctId, ...distractors]);
  state.awaiting = false;
  state.attempts = 0;

  // UI reset
  $("q-current").textContent = String(state.current + 1).padStart(2, "0");
  $("reveal").classList.remove("is-visible");
  $("play-hint").textContent = "Toca para escuchar de nuevo";

  setAccent(correctSound.color);
  renderOptions();

  // Reproducir el sonido tras un beat
  setTimeout(() => playCurrent(), 350);
}

function renderOptions() {
  const wrap = $("options");
  wrap.innerHTML = "";
  state.options.forEach((id) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.id = id;
    btn.textContent = SOUNDS[id].name;
    btn.addEventListener("click", () => onAnswer(id));
    wrap.appendChild(btn);
  });
}

function playCurrent() {
  if (state.phase !== "quiz") return;
  const id = state.queue[state.current];
  if (!id) return;
  const sound = SOUNDS[id];

  state.attempts++;

  // Cancelar timer previo si quedó alguno
  if (state.playTimer) clearTimeout(state.playTimer);

  isPlaying = true;
  body.classList.add("is-playing");

  const dur = sound.play(audioCtx, masterGain);
  state.playTimer = setTimeout(() => {
    isPlaying = false;
    body.classList.remove("is-playing");
  }, dur * 1000 + 50);
}

function onAnswer(id) {
  if (state.awaiting) return;
  state.awaiting = true;

  const correctId = state.queue[state.current];
  const correctSound = SOUNDS[correctId];
  const wasCorrect = id === correctId;

  if (wasCorrect) {
    state.correctCount++;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    // Base 10 + bonus por racha + bonus por acertar a la primera
    const base = 10;
    const streakBonus = state.streak >= 5 ? 5 : state.streak >= 3 ? 3 : 0;
    const firstTryBonus = state.attempts === 1 ? 5 : 0;
    state.score += base + streakBonus + firstTryBonus;
    popScore();
  } else {
    state.wrongCount++;
    state.streak = 0;
  }

  track("answer", {
    sound_id: correctId,
    sound_name: correctSound.name,
    category: correctSound.category,
    correct: wasCorrect,
    attempts: state.attempts,
  });

  // Marcar opciones
  document.querySelectorAll(".option").forEach((btn) => {
    btn.disabled = true;
    const bid = btn.dataset.id;
    if (bid === correctId) {
      btn.classList.add(wasCorrect ? "is-correct" : "was-correct");
    } else if (bid === id && !wasCorrect) {
      btn.classList.add("is-wrong");
    }
  });

  // Reveal
  $("reveal-label").textContent = correctSound.category;
  $("reveal-name").textContent = correctSound.name;
  $("reveal").classList.add("is-visible");

  updateHUD();

  setTimeout(nextQuestion, wasCorrect ? 1600 : 2400);
}

function endGame() {
  isPlaying = false;
  body.classList.remove("is-playing");
  if (state.playTimer) clearTimeout(state.playTimer);

  const durationSec = Math.round((Date.now() - state.startedAt) / 1000);

  track("game_complete", {
    score: state.score,
    correct_count: state.correctCount,
    wrong_count: state.wrongCount,
    best_streak: state.bestStreak,
    duration_seconds: durationSec,
  });

  $("final-score").textContent = state.score;
  $("final-correct").textContent = state.correctCount;
  $("final-wrong").textContent = state.wrongCount;
  $("final-streak").textContent = state.bestStreak;

  const title = $("result-title");
  if (state.correctCount === QUESTIONS_PER_ROUND) {
    title.textContent = "Oído perfecto.";
  } else if (state.correctCount >= 8) {
    title.textContent = "Casi todo.";
  } else if (state.correctCount >= 5) {
    title.textContent = "Buen oído.";
  } else {
    title.textContent = "Hay que escuchar más.";
  }

  setAccent("#c9a26d");
  setPhase("result");
}

function quitToIdle() {
  if (state.playTimer) clearTimeout(state.playTimer);
  isPlaying = false;
  body.classList.remove("is-playing");
  setAccent("#c9a26d");
  setPhase("idle");
}

function updateHUD() {
  $("score").textContent = state.score;
}

function popScore() {
  const el = $("score");
  el.classList.remove("is-popping");
  void el.offsetWidth;
  el.classList.add("is-popping");
}

// ─── Wiring ───────────────────────────────────────────────
$("start-btn").addEventListener("click", startGame);
$("restart-btn").addEventListener("click", startGame);
$("quit-btn").addEventListener("click", quitToIdle);
$("play-btn").addEventListener("click", () => {
  if (state.phase === "quiz" && !state.awaiting) playCurrent();
});

// Pagehide → abandon
window.addEventListener("pagehide", () => {
  if (state.phase === "quiz") {
    track("game_abandon", {
      score: state.score,
      questions_answered: state.current,
      correct_count: state.correctCount,
      wrong_count: state.wrongCount,
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
    });
  }
});

// Boot
resizeCanvas();
animateScope();
setPhase("idle");
