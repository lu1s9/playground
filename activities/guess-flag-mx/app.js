// ============================================================
// Adivina el escudo — México
// Quiz con assets reales (32 escudos SVG desde Wikimedia).
// ============================================================

const track = (e, d) => { try { window.umami?.track(e, d); } catch (_) {} };

// ------------------------------------------------------------
// Datos de las 32 entidades + posiciones en el tile cartogram.
// Cartogram: grid 7 cols × 6 rows, geográficamente aproximado.
// ------------------------------------------------------------
const STATES = [
  { id: "agu", name: "Aguascalientes",     col: 2, row: 2, abbr: "AGS"  },
  { id: "bcn", name: "Baja California",    col: 0, row: 0, abbr: "BC"   },
  { id: "bcs", name: "Baja California Sur",col: 0, row: 1, abbr: "BCS"  },
  { id: "cam", name: "Campeche",           col: 6, row: 4, abbr: "CAM"  },
  { id: "chh", name: "Chihuahua",          col: 2, row: 0, abbr: "CHH"  },
  { id: "chp", name: "Chiapas",            col: 5, row: 5, abbr: "CHP"  },
  { id: "cmx", name: "Ciudad de México",   col: 4, row: 3, abbr: "CMX"  },
  { id: "coa", name: "Coahuila",           col: 3, row: 0, abbr: "COA"  },
  { id: "col", name: "Colima",             col: 0, row: 3, abbr: "COL"  },
  { id: "dur", name: "Durango",            col: 2, row: 1, abbr: "DGO"  },
  { id: "gro", name: "Guerrero",           col: 3, row: 4, abbr: "GRO"  },
  { id: "gua", name: "Guanajuato",         col: 3, row: 2, abbr: "GTO"  },
  { id: "hid", name: "Hidalgo",            col: 5, row: 2, abbr: "HGO"  },
  { id: "jal", name: "Jalisco",            col: 1, row: 3, abbr: "JAL"  },
  { id: "mex", name: "Estado de México",   col: 3, row: 3, abbr: "MEX"  },
  { id: "mic", name: "Michoacán",          col: 2, row: 3, abbr: "MIC"  },
  { id: "mor", name: "Morelos",            col: 4, row: 4, abbr: "MOR"  },
  { id: "nay", name: "Nayarit",            col: 1, row: 2, abbr: "NAY"  },
  { id: "nle", name: "Nuevo León",         col: 4, row: 0, abbr: "NL"   },
  { id: "oax", name: "Oaxaca",             col: 4, row: 5, abbr: "OAX"  },
  { id: "pue", name: "Puebla",             col: 5, row: 3, abbr: "PUE"  },
  { id: "que", name: "Querétaro",          col: 4, row: 2, abbr: "QRO"  },
  { id: "roo", name: "Quintana Roo",       col: 6, row: 1, abbr: "QR"   },
  { id: "sin", name: "Sinaloa",            col: 1, row: 1, abbr: "SIN"  },
  { id: "slp", name: "San Luis Potosí",    col: 4, row: 1, abbr: "SLP"  },
  { id: "son", name: "Sonora",             col: 1, row: 0, abbr: "SON"  },
  { id: "tab", name: "Tabasco",            col: 6, row: 5, abbr: "TAB"  },
  { id: "tam", name: "Tamaulipas",         col: 5, row: 0, abbr: "TAM"  },
  { id: "tla", name: "Tlaxcala",           col: 5, row: 4, abbr: "TLA"  },
  { id: "ver", name: "Veracruz",           col: 6, row: 3, abbr: "VER"  },
  { id: "yuc", name: "Yucatán",            col: 6, row: 2, abbr: "YUC"  },
  { id: "zac", name: "Zacatecas",          col: 3, row: 1, abbr: "ZAC"  },
];

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------
const QUESTIONS_PER_ROUND = 10;
const TIME_PER_QUESTION = 12; // seconds
const SPEED_BONUS_WINDOW = 3; // first N seconds get full bonus
const RING_CIRCUMFERENCE = 97.39; // 2π × 15.5

// ------------------------------------------------------------
// Estado
// ------------------------------------------------------------
const state = {
  phase: "setup", // 'setup' | 'quiz' | 'result'
  queue: [],       // 10 states for this round
  current: -1,     // index in queue
  options: [],     // current question's 4 option states
  selected: null,
  score: 0,
  streak: 0,
  bestStreak: 0,
  correctCount: 0,
  wrongCount: 0,
  history: [],     // { stateId, name, correct, timeSpent }
  questionStart: 0,
  countdownInterval: null,
  remaining: 0,
  awaitingNext: false,
  startedAt: 0,
};

// ------------------------------------------------------------
// DOM refs
// ------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const body = document.body;
const mapEl = $("map");
const coatEl = $("coat");
const optionsEl = $("options");
const qCurrentEl = $("q-current");
const qTotalEl = $("q-total");
const countdownEl = $("countdown");
const countdownValueEl = $("countdown-value");
const countdownFillEl = $("countdown-fill");
const statScoreEl = $("stat-score");
const statStreakEl = $("stat-streak");
const historyEl = $("history");

const finalScoreEl = $("final-score");
const finalCorrectEl = $("final-correct");
const finalWrongEl = $("final-wrong");
const finalStreakEl = $("final-streak");
const resultTitleEl = $("result-title");

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setPhase(phase) {
  state.phase = phase;
  body.className = `phase-${phase}`;
}

// ------------------------------------------------------------
// Render mapa (tile cartogram)
// ------------------------------------------------------------
function renderMap() {
  const NS = "http://www.w3.org/2000/svg";
  mapEl.innerHTML = "";
  STATES.forEach((s) => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "tile");
    g.dataset.state = s.id;

    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("class", "tile-rect");
    rect.setAttribute("x", s.col * 60 + 3);
    rect.setAttribute("y", s.row * 60 + 3);
    rect.setAttribute("width", 54);
    rect.setAttribute("height", 54);
    rect.setAttribute("rx", 5);
    g.appendChild(rect);

    const text = document.createElementNS(NS, "text");
    text.setAttribute("class", "tile-text");
    text.setAttribute("x", s.col * 60 + 30);
    text.setAttribute("y", s.row * 60 + 30);
    text.textContent = s.abbr;
    g.appendChild(text);

    const title = document.createElementNS(NS, "title");
    title.textContent = s.name;
    g.appendChild(title);

    mapEl.appendChild(g);
  });
}

function setTileState(stateId, status) {
  const tile = mapEl.querySelector(`.tile[data-state="${stateId}"]`);
  if (!tile) return;
  tile.classList.remove("is-current", "is-correct", "is-wrong");
  if (status) tile.classList.add(status);
}

function resetMap() {
  mapEl
    .querySelectorAll(".tile")
    .forEach((t) =>
      t.classList.remove("is-current", "is-correct", "is-wrong")
    );
}

// ------------------------------------------------------------
// Render HUD
// ------------------------------------------------------------
function updateHUD() {
  statScoreEl.textContent = state.score;
  statStreakEl.textContent = state.streak;
}

function renderHistory() {
  if (state.history.length === 0) {
    historyEl.innerHTML =
      '<li class="history-empty">Sin respuestas todavía.</li>';
    return;
  }
  // Mostrar últimas 5, más recientes arriba
  const recent = state.history.slice(-5).reverse();
  historyEl.innerHTML = recent
    .map(
      (h) => `
    <li>
      <span class="history-icon ${h.correct ? "ok" : "no"}">${
        h.correct ? "✓" : "✗"
      }</span>
      <span class="history-name">${h.name}</span>
      <span class="history-time">${h.timeSpent}s</span>
    </li>
  `
    )
    .join("");
}

// ------------------------------------------------------------
// Game flow
// ------------------------------------------------------------
function startGame() {
  state.queue = shuffle(STATES).slice(0, QUESTIONS_PER_ROUND);
  state.current = -1;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.history = [];
  state.startedAt = Date.now();
  track("game_start");

  resetMap();
  qTotalEl.textContent = QUESTIONS_PER_ROUND;
  updateHUD();
  renderHistory();

  setPhase("quiz");
  nextQuestion();
}

function nextQuestion() {
  state.current++;
  if (state.current >= QUESTIONS_PER_ROUND) {
    endGame();
    return;
  }

  const correct = state.queue[state.current];

  // Quitar marca "current" del estado anterior si la había
  resetCurrentMark();
  setTileState(correct.id, "is-current");

  // Generar 3 distractores
  const distractors = shuffle(
    STATES.filter((s) => s.id !== correct.id)
  ).slice(0, 3);
  state.options = shuffle([correct, ...distractors]);
  state.selected = null;
  state.awaitingNext = false;

  // Render UI
  qCurrentEl.textContent = state.current + 1;
  coatEl.src = `assets/coats/${correct.id}.svg`;
  coatEl.alt = `Escudo a adivinar (pregunta ${state.current + 1})`;

  // Render botones de opciones
  optionsEl.innerHTML = "";
  state.options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.textContent = opt.name;
    btn.dataset.state = opt.id;
    btn.addEventListener("click", () => onAnswer(opt.id));
    optionsEl.appendChild(btn);
  });

  // Iniciar countdown
  startCountdown();
}

function resetCurrentMark() {
  const cur = mapEl.querySelector(".tile.is-current");
  if (cur) cur.classList.remove("is-current");
}

function startCountdown() {
  state.questionStart = Date.now();
  state.remaining = TIME_PER_QUESTION;
  countdownValueEl.textContent = TIME_PER_QUESTION;
  countdownEl.classList.remove("is-warning", "is-danger");

  // Reset ring (sin transición), luego animar drenaje
  countdownFillEl.style.transition = "none";
  countdownFillEl.style.strokeDashoffset = "0";
  // forzar reflow
  void countdownFillEl.getBoundingClientRect();
  countdownFillEl.style.transition = `stroke-dashoffset ${TIME_PER_QUESTION}s linear`;
  countdownFillEl.style.strokeDashoffset = String(RING_CIRCUMFERENCE);

  if (state.countdownInterval) clearInterval(state.countdownInterval);
  state.countdownInterval = setInterval(tickCountdown, 1000);
}

function tickCountdown() {
  state.remaining--;
  countdownValueEl.textContent = Math.max(0, state.remaining);

  if (state.remaining <= 4 && state.remaining > 2) {
    countdownEl.classList.add("is-warning");
    countdownEl.classList.remove("is-danger");
  }
  if (state.remaining <= 2 && state.remaining > 0) {
    countdownEl.classList.remove("is-warning");
    countdownEl.classList.add("is-danger");
  }

  if (state.remaining <= 0) {
    stopCountdown();
    if (!state.awaitingNext) {
      onTimeout();
    }
  }
}

function stopCountdown() {
  if (state.countdownInterval) {
    clearInterval(state.countdownInterval);
    state.countdownInterval = null;
  }
}

// ------------------------------------------------------------
// Respuestas
// ------------------------------------------------------------
function onAnswer(answerId) {
  if (state.awaitingNext) return;
  state.selected = answerId;
  state.awaitingNext = true;
  stopCountdown();

  const correct = state.queue[state.current];
  const elapsed = (Date.now() - state.questionStart) / 1000;
  const wasCorrect = answerId === correct.id;

  // Scoring
  if (wasCorrect) {
    const speedBonus = Math.max(
      0,
      Math.round(5 * (1 - elapsed / SPEED_BONUS_WINDOW))
    );
    const base = 10 + speedBonus;
    state.streak++;
    state.bestStreak = Math.max(state.bestStreak, state.streak);

    let mult = 1;
    if (state.streak >= 8) mult = 3;
    else if (state.streak >= 5) mult = 2;

    state.score += base * mult;
    state.correctCount++;
    setTileState(correct.id, "is-correct");
  } else {
    state.streak = 0;
    state.wrongCount++;
    setTileState(correct.id, "is-wrong");
  }

  // Historia
  state.history.push({
    stateId: correct.id,
    name: correct.name,
    correct: wasCorrect,
    timeSpent: Math.min(TIME_PER_QUESTION, Math.round(elapsed)),
  });

  track("answer", {
    state_id: correct.id,
    state_name: correct.name,
    correct: wasCorrect,
    elapsed_seconds: Math.min(TIME_PER_QUESTION, Math.round(elapsed)),
  });

  // Marcar visualmente la opción correcta y, si erró, la elegida
  optionsEl.querySelectorAll(".option").forEach((btn) => {
    btn.setAttribute("disabled", "true");
    const id = btn.dataset.state;
    if (id === correct.id) {
      btn.classList.add(wasCorrect ? "is-correct" : "was-correct");
    } else if (id === answerId && !wasCorrect) {
      btn.classList.add("is-wrong");
    }
  });

  updateHUD();
  renderHistory();

  setTimeout(nextQuestion, wasCorrect ? 1100 : 1800);
}

function onTimeout() {
  if (state.awaitingNext) return;
  state.awaitingNext = true;
  stopCountdown();

  const correct = state.queue[state.current];
  state.streak = 0;
  state.wrongCount++;
  setTileState(correct.id, "is-wrong");

  state.history.push({
    stateId: correct.id,
    name: correct.name,
    correct: false,
    timeSpent: TIME_PER_QUESTION,
  });

  track("answer", {
    state_id: correct.id,
    state_name: correct.name,
    correct: false,
    timed_out: true,
    elapsed_seconds: TIME_PER_QUESTION,
  });

  // Mostrar cuál era la correcta
  optionsEl.querySelectorAll(".option").forEach((btn) => {
    btn.setAttribute("disabled", "true");
    if (btn.dataset.state === correct.id) {
      btn.classList.add("was-correct");
    }
  });

  updateHUD();
  renderHistory();

  setTimeout(nextQuestion, 2000);
}

function endGame() {
  stopCountdown();
  resetCurrentMark();

  track("game_complete", {
    score: state.score,
    correct_count: state.correctCount,
    wrong_count: state.wrongCount,
    best_streak: state.bestStreak,
    duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
  });

  finalScoreEl.textContent = state.score;
  finalCorrectEl.textContent = state.correctCount;
  finalWrongEl.textContent = state.wrongCount;
  finalStreakEl.textContent = state.bestStreak;

  // Título contextual
  if (state.correctCount === QUESTIONS_PER_ROUND) {
    resultTitleEl.textContent = "¡Perfecto!";
  } else if (state.correctCount >= 8) {
    resultTitleEl.textContent = "Muy bien.";
  } else if (state.correctCount >= 5) {
    resultTitleEl.textContent = "Buen intento.";
  } else {
    resultTitleEl.textContent = "Hay que repasar.";
  }

  setPhase("result");
}

// ------------------------------------------------------------
// Preload — caché de los SVG en background
// ------------------------------------------------------------
function preloadCoats() {
  STATES.forEach((s) => {
    const img = new Image();
    img.src = `assets/coats/${s.id}.svg`;
  });
}

// ------------------------------------------------------------
// Wiring
// ------------------------------------------------------------
$("start-btn").addEventListener("click", startGame);
$("restart-btn").addEventListener("click", startGame);
$("quit-btn").addEventListener("click", () => {
  resetMap();
  setPhase("setup");
});

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

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
renderMap();
preloadCoats();
setPhase("setup");
