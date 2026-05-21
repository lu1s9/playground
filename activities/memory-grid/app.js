// ============================================================
// Memo / Test — Memoria espacial, modo hardcore.
// 10 niveles, N celdas en cada uno (3 → 12). Un error = game over.
// ============================================================

const track = (e, d) => { try { window.umami?.track(e, d); } catch (_) {} };

const TOTAL_LEVELS = 10;
const GRID_SIZE = 16;

const RECORDS_KEY = "memo-grid-records";

// ------------------------------------------------------------
// Config por nivel
// ------------------------------------------------------------
function levelConfig(L) {
  const N = L + 2; // 3 a 12
  const memTime = Math.max(3, 5 - (L - 1) * 0.22); // 5s → 3s
  const recallTime = 8 + 2 * N; // 14s en L1 → 32s en L10
  return { N, memTime, recallTime };
}

function generateLevel(L) {
  const cfg = levelConfig(L);
  const indices = shuffle(
    Array.from({ length: GRID_SIZE }, (_, i) => i)
  ).slice(0, cfg.N);
  // Asignar números 1..N en el orden barajado
  const cells = indices.map((index, i) => ({ index, number: i + 1 }));
  return { ...cfg, cells, indices };
}

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
const state = {
  phase: "idle", // 'idle' | 'game' | 'result'
  level: 1,
  current: null,
  nextExpected: 1,
  score: 0,
  history: [],
  recallStartedAt: 0,
  timers: { memorize: null, recall: null },
  locked: true,
  startedAt: 0,
};

// ------------------------------------------------------------
// DOM refs
// ------------------------------------------------------------
const body = document.body;
const $ = (id) => document.getElementById(id);
const gridEl = $("grid");
const phaseLogEl = $("phase-log");
const fillEl = $("countdown-fill");
const phaseLabelEl = $("phase-label");
const statusEl = $("game-status");
const levelCurrentEl = $("level-current");
const scoreEl = $("score");

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

function pad2(n) {
  return String(n).padStart(2, "0");
}

function setPhase(p) {
  state.phase = p;
  body.className = `phase-${p}`;
}

// ------------------------------------------------------------
// LocalStorage records
// ------------------------------------------------------------
function loadRecords() {
  try {
    const r = JSON.parse(localStorage.getItem(RECORDS_KEY) || "{}");
    return {
      score: r.score || 0,
      level: r.level || 0,
      runs: r.runs || 0,
    };
  } catch {
    return { score: 0, level: 0, runs: 0 };
  }
}

function saveRecords(r) {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(r));
  } catch {}
}

// ------------------------------------------------------------
// Grid rendering
// ------------------------------------------------------------
function renderGridShell() {
  gridEl.innerHTML = "";
  for (let i = 0; i < GRID_SIZE; i++) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = String(i);
    cell.setAttribute("aria-label", `Celda ${i + 1}`);
    cell.addEventListener("click", () => onCellClick(i));
    gridEl.appendChild(cell);
  }
}

function getCell(index) {
  return gridEl.querySelector(`.cell[data-index="${index}"]`);
}

function clearGrid() {
  gridEl.querySelectorAll(".cell").forEach((c) => {
    c.className = "cell";
    c.innerHTML = "";
  });
  gridEl.classList.remove("is-shaking");
}

function showCellNumber(index, number) {
  const cell = getCell(index);
  cell.innerHTML = `<span class="num">${number}</span>`;
  cell.classList.add("is-revealing");
}

function hideAllNumbers() {
  gridEl.querySelectorAll(".cell.is-revealing").forEach((c) => {
    c.classList.remove("is-revealing");
    c.classList.add("is-active");
  });
}

// ------------------------------------------------------------
// Run log (sidebar izquierda)
// ------------------------------------------------------------
function renderRunLog() {
  phaseLogEl.innerHTML = "";
  for (let L = 1; L <= TOTAL_LEVELS; L++) {
    const li = document.createElement("li");
    li.dataset.level = String(L);
    li.innerHTML = `
      <span class="phase-log-num">${pad2(L)}</span>
      <div class="mini-grid">
        ${Array.from(
          { length: GRID_SIZE },
          (_, i) => `<span class="mini-cell" data-mini="${i}"></span>`
        ).join("")}
      </div>
    `;
    phaseLogEl.appendChild(li);
  }
}

function setLogLevel(L, status, indices) {
  const li = phaseLogEl.querySelector(`li[data-level="${L}"]`);
  if (!li) return;
  li.classList.remove("is-current", "is-passed", "is-failed");
  if (status) li.classList.add(status);
  if (indices) {
    li.querySelectorAll(".mini-cell").forEach((c, i) => {
      c.classList.toggle("is-marked", indices.includes(i));
    });
  }
}

// ------------------------------------------------------------
// Countdown bar
// ------------------------------------------------------------
function startCountdown(durationSec) {
  fillEl.classList.remove("is-danger");
  fillEl.style.transition = "none";
  fillEl.style.transform = "scaleX(1)";
  // forzar reflow para que el transition reset surta efecto
  void fillEl.getBoundingClientRect();
  fillEl.style.transition = `transform ${durationSec}s linear`;
  fillEl.style.transform = "scaleX(0)";

  // Cambiar a rojo en el último 20% del tiempo
  setTimeout(() => {
    if (state.phase === "game") fillEl.classList.add("is-danger");
  }, durationSec * 800);
}

function stopCountdown() {
  // congelar en el valor actual
  const cs = getComputedStyle(fillEl).transform;
  fillEl.style.transition = "none";
  fillEl.style.transform = cs;
}

// ------------------------------------------------------------
// Game flow
// ------------------------------------------------------------
function startGame() {
  state.level = 1;
  state.score = 0;
  state.history = [];
  state.locked = true;
  state.startedAt = Date.now();
  track("game_start");

  renderGridShell();
  renderRunLog();
  $("level-total").textContent = pad2(TOTAL_LEVELS);
  updateHUD();
  setPhase("game");
  startLevel();
}

function startLevel() {
  state.current = generateLevel(state.level);
  state.nextExpected = 1;
  state.locked = true;

  levelCurrentEl.textContent = pad2(state.level);
  setLogLevel(state.level, "is-current", state.current.indices);

  startMemorize();
}

function startMemorize() {
  clearGrid();

  // stagger reveal de los números
  const STAGGER = 50;
  state.current.cells.forEach((c, i) => {
    setTimeout(() => {
      if (state.phase !== "game") return;
      showCellNumber(c.index, c.number);
    }, i * STAGGER);
  });

  phaseLabelEl.textContent = "Memoriza";
  statusEl.textContent = "Memoriza la posición de los números.";
  statusEl.className = "game-status";

  const totalMem = state.current.memTime + (state.current.cells.length * STAGGER) / 1000;
  startCountdown(totalMem);

  clearTimeout(state.timers.memorize);
  state.timers.memorize = setTimeout(startRecall, totalMem * 1000);
}

function startRecall() {
  if (state.phase !== "game") return;

  hideAllNumbers();
  state.locked = false;
  state.recallStartedAt = Date.now();

  phaseLabelEl.textContent = "Click";
  statusEl.textContent = "Click en orden: 1 → 2 → 3 → …";
  statusEl.className = "game-status is-warning";

  startCountdown(state.current.recallTime);

  clearTimeout(state.timers.recall);
  state.timers.recall = setTimeout(onTimeout, state.current.recallTime * 1000);
}

function onCellClick(index) {
  if (state.locked || state.phase !== "game") return;
  const cell = getCell(index);
  if (!cell.classList.contains("is-active")) return;

  const cellData = state.current.cells.find((c) => c.index === index);
  if (!cellData) return;

  if (cellData.number === state.nextExpected) {
    // Acierto
    cell.classList.remove("is-active");
    cell.classList.add("is-cleared");
    cell.innerHTML = `<span class="num">${cellData.number}</span>`;
    state.nextExpected++;
    state.score += 10;
    updateHUD(true);

    if (state.nextExpected > state.current.cells.length) {
      completeLevel();
    }
  } else {
    // Error
    cell.classList.add("is-wrong");
    cell.innerHTML = `<span class="num">${cellData.number}</span>`;

    // Mostrar cuál era la correcta
    const expected = state.current.cells.find(
      (c) => c.number === state.nextExpected
    );
    if (expected) {
      const expCell = getCell(expected.index);
      expCell.classList.add("is-revealed-error");
      expCell.innerHTML = `<span class="num">${expected.number}</span>`;
    }

    gameOver(false);
  }
}

function onTimeout() {
  if (state.locked || state.phase !== "game") return;
  const expected = state.current.cells.find(
    (c) => c.number === state.nextExpected
  );
  if (expected) {
    const cell = getCell(expected.index);
    cell.classList.add("is-revealed-error");
    cell.innerHTML = `<span class="num">${expected.number}</span>`;
  }
  gameOver(true);
}

function completeLevel() {
  state.locked = true;

  const N = state.current.cells.length;
  const elapsedRecall = (Date.now() - state.recallStartedAt) / 1000;
  const speedBonus = elapsedRecall < state.current.recallTime / 2 ? 5 * N : 0;
  const levelBonus = 20 * N + speedBonus;
  state.score += levelBonus;
  updateHUD(true);

  setLogLevel(state.level, "is-passed", state.current.indices);
  state.history.push({
    level: state.level,
    indices: state.current.indices,
    passed: true,
  });

  track("level_complete", {
    level: state.level,
    n_cells: N,
    recall_seconds: Math.round(elapsedRecall),
    score: state.score,
  });

  clearTimeout(state.timers.recall);
  stopCountdown();

  phaseLabelEl.textContent = "OK";
  statusEl.textContent = `Nivel ${state.level} OK — +${levelBonus} pts`;
  statusEl.className = "game-status";

  if (state.level >= TOTAL_LEVELS) {
    setTimeout(() => endGame(true), 1300);
  } else {
    setTimeout(() => {
      state.level++;
      startLevel();
    }, 1300);
  }
}

function gameOver(timedOut) {
  state.locked = true;

  setLogLevel(state.level, "is-failed", state.current.indices);
  state.history.push({
    level: state.level,
    indices: state.current.indices,
    passed: false,
  });

  gridEl.classList.add("is-shaking");

  clearTimeout(state.timers.memorize);
  clearTimeout(state.timers.recall);
  stopCountdown();
  fillEl.classList.add("is-danger");

  phaseLabelEl.textContent = "X";
  statusEl.textContent = timedOut ? "Se acabó el tiempo." : "Click incorrecto.";
  statusEl.className = "game-status is-danger";

  setTimeout(() => endGame(false), 1600);
}

function endGame(won) {
  const records = loadRecords();
  const levelsPassed = state.history.filter((h) => h.passed).length;
  const reached = won ? TOTAL_LEVELS : levelsPassed;
  const isNewRecord = state.score > records.score;

  track("game_complete", {
    won,
    level_reached: reached,
    score: state.score,
    new_record: isNewRecord,
    duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
  });

  records.score = Math.max(records.score, state.score);
  records.level = Math.max(records.level, reached);
  records.runs = records.runs + 1;
  saveRecords(records);

  $("final-score").textContent = state.score;
  $("final-level").textContent = pad2(reached);
  $("final-record").textContent = records.score;

  const eyebrow = $("result-eyebrow");
  const title = $("result-title");
  const sub = $("result-sub");
  const stats = document.querySelector(".result-stats");

  if (won) {
    eyebrow.textContent = "Test completado";
    eyebrow.classList.add("is-win");
    title.textContent = "Run perfecto";
    title.classList.add("is-win");
    stats.classList.add("is-win");
    sub.textContent = isNewRecord
      ? `Completaste los 10 niveles. Nuevo record: ${state.score}.`
      : `Completaste los 10 niveles.`;
  } else {
    eyebrow.textContent = "Run terminado";
    eyebrow.classList.remove("is-win");
    title.textContent = "Game over";
    title.classList.remove("is-win");
    stats.classList.remove("is-win");
    sub.textContent = isNewRecord
      ? `Llegaste hasta el nivel ${reached}. Nuevo record: ${state.score}.`
      : `Llegaste hasta el nivel ${reached} de ${TOTAL_LEVELS}.`;
  }

  // Reset de la animación del título
  title.style.animation = "none";
  void title.offsetWidth;
  title.style.animation = "";

  setPhase("result");
  updateSidebarStats();
}

function quitToIdle() {
  clearTimeout(state.timers.memorize);
  clearTimeout(state.timers.recall);
  stopCountdown();
  state.locked = true;
  setPhase("idle");
  updateSidebarStats();
}

// ------------------------------------------------------------
// UI updates
// ------------------------------------------------------------
function updateHUD(animate) {
  scoreEl.textContent = state.score;
  if (animate) {
    scoreEl.classList.remove("is-popping");
    void scoreEl.offsetWidth;
    scoreEl.classList.add("is-popping");
  }
}

function updateSidebarStats() {
  const r = loadRecords();
  $("record-score").textContent = r.score;
  $("record-level").textContent = r.level > 0 ? pad2(r.level) : "—";
  $("record-runs").textContent = r.runs;
  $("stat-record").textContent = r.score;
  $("stat-runs").textContent = r.runs;
  $("stat-avg").textContent =
    r.runs > 0 ? String(Math.round(r.score / r.runs)) : "—";
}

// ------------------------------------------------------------
// Wiring + boot
// ------------------------------------------------------------
$("start-btn").addEventListener("click", startGame);
$("restart-btn").addEventListener("click", startGame);
$("quit-btn").addEventListener("click", quitToIdle);

window.addEventListener("pagehide", () => {
  if (state.phase === "game") {
    const levelsPassed = state.history.filter((h) => h.passed).length;
    track("game_abandon", {
      level_reached: levelsPassed,
      score: state.score,
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
    });
  }
});

renderRunLog();
updateSidebarStats();
setPhase("idle");
