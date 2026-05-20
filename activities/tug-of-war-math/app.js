// ============================================================
// Tug of War: Math — DOM + CSS + JS vanilla
// ============================================================

const WIN_THRESHOLD = 7;

const CPU_PARAMS = {
  easy: { min: 4000, max: 6000, error: 0.35 },
  medium: { min: 2500, max: 4000, error: 0.18 },
  hard: { min: 1500, max: 2500, error: 0.05 },
};

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
const state = {
  phase: "setup", // 'setup' | 'playing' | 'over'
  mode: "1p", // '1p' | '2p'
  difficulty: "medium", // 'easy' | 'medium' | 'hard'
  rope: 0, // negative = team 1 (azul) wins, positive = team 2 (rojo) wins
  questions: { 1: null, 2: null },
  inputs: { 1: "", 2: "" },
  cpuTimeout: null,
};

// ------------------------------------------------------------
// DOM refs
// ------------------------------------------------------------
const body = document.body;
const startBtn = document.getElementById("start-btn");
const quitBtn = document.getElementById("quit-btn");
const restartBtn = document.getElementById("restart-btn");
const backBtn = document.getElementById("back-btn");
const markerEl = document.getElementById("marker");
const q1El = document.getElementById("q-1");
const q2El = document.getElementById("q-2");
const i1El = document.getElementById("i-1");
const i2El = document.getElementById("i-2");
const winnerTitleEl = document.getElementById("winner-title");
const winnerTextEl = document.getElementById("winner-text");

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function setBodyPhase(phase) {
  state.phase = phase;
  body.className =
    `phase-${phase} mode-${state.mode} difficulty-${state.difficulty}` +
    (phase === "over" ? " phase-over phase-playing" : "");
}

// ------------------------------------------------------------
// Question generation
// ------------------------------------------------------------
function genQuestion() {
  const d = state.difficulty;

  if (d === "easy") {
    if (Math.random() < 0.5) {
      const a = randInt(1, 10);
      const b = randInt(1, 10);
      return { text: `${a} + ${b}`, answer: a + b };
    } else {
      const a = randInt(2, 10);
      const b = randInt(1, a);
      return { text: `${a} − ${b}`, answer: a - b };
    }
  }

  const r = Math.random();

  if (d === "medium") {
    if (r < 0.3) {
      const a = randInt(1, 20);
      const b = randInt(1, 20);
      return { text: `${a} + ${b}`, answer: a + b };
    } else if (r < 0.6) {
      const a = randInt(5, 20);
      const b = randInt(1, a);
      return { text: `${a} − ${b}`, answer: a - b };
    } else if (r < 0.85) {
      const a = randInt(2, 5);
      const b = randInt(2, 10);
      return { text: `${a} × ${b}`, answer: a * b };
    } else {
      const b = randInt(2, 5);
      const ans = randInt(2, 10);
      return { text: `${b * ans} ÷ ${b}`, answer: ans };
    }
  }

  // hard
  if (r < 0.3) {
    const a = randInt(10, 50);
    const b = randInt(10, 50);
    return { text: `${a} + ${b}`, answer: a + b };
  } else if (r < 0.55) {
    const a = randInt(20, 50);
    const b = randInt(1, a);
    return { text: `${a} − ${b}`, answer: a - b };
  } else if (r < 0.8) {
    const a = randInt(2, 10);
    const b = randInt(2, 10);
    return { text: `${a} × ${b}`, answer: a * b };
  } else {
    const b = randInt(2, 10);
    const ans = randInt(2, 10);
    return { text: `${b * ans} ÷ ${b}`, answer: ans };
  }
}

// ------------------------------------------------------------
// Game flow
// ------------------------------------------------------------
function startGame() {
  if (state.cpuTimeout) clearTimeout(state.cpuTimeout);
  state.rope = 0;
  state.inputs[1] = "";
  state.inputs[2] = "";
  state.questions[1] = genQuestion();
  state.questions[2] = genQuestion();

  setBodyPhase("playing");
  updateUI();

  if (state.mode === "1p") {
    scheduleCpu();
  }
}

function endGame(winnerTeam) {
  if (state.cpuTimeout) clearTimeout(state.cpuTimeout);
  state.cpuTimeout = null;

  winnerTitleEl.textContent = winnerTeam === 1 ? "¡Ganó Azul!" : "¡Ganó Rojo!";
  winnerTitleEl.className = winnerTeam === 1 ? "win-1" : "win-2";

  if (state.mode === "1p") {
    winnerTextEl.textContent =
      winnerTeam === 1
        ? "Le ganaste a la CPU. Bien jugado."
        : "La CPU te ganó esta vez. Es hora de la revancha.";
  } else {
    winnerTextEl.textContent = `El equipo ${
      winnerTeam === 1 ? "AZUL" : "ROJO"
    } ganó el tirón.`;
  }

  setBodyPhase("over");
}

function backToSetup() {
  if (state.cpuTimeout) clearTimeout(state.cpuTimeout);
  state.cpuTimeout = null;
  setBodyPhase("setup");
}

// ------------------------------------------------------------
// Input handling
// ------------------------------------------------------------
function pressKey(team, key) {
  if (state.phase !== "playing") return;
  // En modo 1p el team 2 es la CPU — el humano no puede tocar su panel.
  if (state.mode === "1p" && team === 2) return;

  if (key === "clear") {
    // Backspace: borra solo el último dígito (más útil que clear-all).
    state.inputs[team] = state.inputs[team].slice(0, -1);
  } else if (key === "submit") {
    submitAnswer(team);
    return;
  } else {
    if (state.inputs[team].length < 4) {
      state.inputs[team] += key;
    }
  }
  updateUI();
}

function submitAnswer(team) {
  if (state.inputs[team] === "") return;
  const userAns = parseInt(state.inputs[team], 10);
  const correct = userAns === state.questions[team].answer;
  applyResult(team, correct);
}

function applyResult(team, correct) {
  // team 1 (azul) tira hacia rope NEGATIVO, team 2 (rojo) hacia POSITIVO.
  const teamDir = team === 1 ? -1 : 1;

  if (correct) {
    state.rope += teamDir * 1.0;
    flashInput(team, "correct");
  } else {
    // Castigo asimétrico: 0.5 al otro lado.
    state.rope += teamDir * -0.5;
    flashInput(team, "wrong");
  }

  state.rope = Math.max(-WIN_THRESHOLD, Math.min(WIN_THRESHOLD, state.rope));
  state.inputs[team] = "";
  state.questions[team] = genQuestion();

  pulseMarker();
  updateUI();

  if (state.rope <= -WIN_THRESHOLD) {
    endGame(1);
  } else if (state.rope >= WIN_THRESHOLD) {
    endGame(2);
  }
}

function flashInput(team, kind) {
  const el = team === 1 ? i1El : i2El;
  el.classList.remove("flash-correct", "flash-wrong");
  // forzar reflow para reiniciar la animación
  void el.offsetWidth;
  el.classList.add(`flash-${kind}`);
}

function pulseMarker() {
  markerEl.classList.remove("tug");
  void markerEl.offsetWidth;
  markerEl.classList.add("tug");
}

// ------------------------------------------------------------
// UI rendering
// ------------------------------------------------------------
function updateUI() {
  if (state.questions[1]) q1El.textContent = `${state.questions[1].text} = ?`;
  if (state.questions[2]) q2El.textContent = `${state.questions[2].text} = ?`;
  i1El.textContent = state.inputs[1] === "" ? "0" : state.inputs[1];
  i2El.textContent = state.inputs[2] === "" ? "0" : state.inputs[2];

  // ratio: -1 (todo izquierda/arriba/azul) → +1 (todo derecha/abajo/rojo)
  const ratio = state.rope / WIN_THRESHOLD;
  // 50% = centro; ±45% acerca a los bordes sin pegar el círculo al borde.
  const pos = 50 + ratio * 45;
  markerEl.style.setProperty("--pos", `${pos}%`);
}

// ------------------------------------------------------------
// CPU AI (modo 1p)
// ------------------------------------------------------------
function scheduleCpu() {
  if (state.phase !== "playing" || state.mode !== "1p") return;
  const p = CPU_PARAMS[state.difficulty];
  const delay = randInt(p.min, p.max);

  state.cpuTimeout = setTimeout(() => {
    if (state.phase !== "playing") return;
    const correct = Math.random() > p.error;

    // "Teclear" la respuesta en el input por un momento, para que se sienta humano.
    const intended = state.questions[2].answer;
    const shown = correct ? intended : intended + (randInt(0, 1) === 0 ? -1 : 1);
    state.inputs[2] = String(shown);
    updateUI();

    setTimeout(() => {
      if (state.phase !== "playing") return;
      applyResult(2, correct);
      scheduleCpu();
    }, 350);
  }, delay);
}

// ------------------------------------------------------------
// Wiring
// ------------------------------------------------------------
// Pickers
document.querySelectorAll(".opts-mode .opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".opts-mode .opt")
      .forEach((x) => x.classList.remove("active"));
    btn.classList.add("active");
    state.mode = btn.dataset.mode;
  });
});

document.querySelectorAll(".opts-difficulty .opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".opts-difficulty .opt")
      .forEach((x) => x.classList.remove("active"));
    btn.classList.add("active");
    state.difficulty = btn.dataset.difficulty;
  });
});

// Keypads
document.querySelectorAll(".team").forEach((teamEl) => {
  const team = parseInt(teamEl.dataset.team, 10);
  teamEl.querySelectorAll(".keypad button").forEach((btn) => {
    btn.addEventListener("click", () => pressKey(team, btn.dataset.key));
  });
});

// Buttons
startBtn.addEventListener("click", startGame);
quitBtn.addEventListener("click", backToSetup);
restartBtn.addEventListener("click", () => startGame());
backBtn.addEventListener("click", backToSetup);

// Keyboard (solo en modo 1p, para el jugador humano = team 1)
window.addEventListener("keydown", (e) => {
  if (state.phase !== "playing" || state.mode !== "1p") return;

  if (e.key >= "0" && e.key <= "9") {
    pressKey(1, e.key);
  } else if (e.key === "Enter") {
    pressKey(1, "submit");
  } else if (
    e.key === "Backspace" ||
    e.key === "Escape" ||
    e.key === "Delete"
  ) {
    pressKey(1, "clear");
  }
});

// Boot: dejar la pantalla de setup arrancando.
setBodyPhase("setup");
