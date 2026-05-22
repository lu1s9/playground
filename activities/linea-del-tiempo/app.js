// ============================================================
// Línea del Tiempo · México
// Mecánica:
//   - Se ancla el primer evento por año como referencia.
//   - Cada turno aparece una card pendiente arriba (sin año).
//   - El usuario toca un hueco entre las cards ya colocadas.
//   - Se evalúa: si el hueco coincide con la posición cronológica
//     real del evento → acierto. Si no → error.
//   - En ambos casos la card se inserta en su posición correcta
//     para que la línea final quede armada correctamente.
// ============================================================

const track = (e, d) => { try { window.umami?.track(e, d); } catch (_) {} };

// El avance al siguiente acontecimiento es manual (botón "Siguiente") para
// que el usuario tenga tiempo de leer el contexto histórico sin presión.

// ─── Iconos ─────────────────────────────────────────────────
// SVGs monoline en estilo "grabado", trazo grueso, sin relleno.
const ICONS = {
  bell: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M32 8 v6"/>
    <circle cx="32" cy="10" r="1.8" fill="currentColor" stroke="none"/>
    <path d="M16 50 C 16 30, 20 18, 32 18 C 44 18 48 30 48 50"/>
    <line x1="12" y1="50" x2="52" y2="50"/>
    <line x1="18" y1="54" x2="46" y2="54"/>
    <path d="M30 50 a3 3 0 0 0 4 0"/>
    <path d="M22 26 q-3 -2 -3 -6"/>
    <path d="M42 26 q3 -2 3 -6"/>
  </svg>`,

  flag: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="14" y1="6" x2="14" y2="58"/>
    <circle cx="14" cy="6" r="2.4" fill="currentColor" stroke="none"/>
    <path d="M14 12 L 50 12 L 44 22 L 50 32 L 14 32 Z"/>
    <line x1="26" y1="12" x2="26" y2="32"/>
    <line x1="38" y1="12" x2="38" y2="32"/>
    <line x1="14" y1="32" x2="14" y2="34"/>
  </svg>`,

  castle: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M8 26 v-6 h4 v6 h4 v-6 h4 v6 h4 v-6 h4 v6 h4 v-6 h4 v6 h4 v-6 h4 v6 h4 v-6 h4 v6 h4 v-6 h4 v6"/>
    <line x1="8" y1="26" x2="8" y2="56"/>
    <line x1="56" y1="26" x2="56" y2="56"/>
    <line x1="6" y1="56" x2="58" y2="56"/>
    <line x1="18" y1="36" x2="18" y2="56"/>
    <line x1="46" y1="36" x2="46" y2="56"/>
    <path d="M26 56 v-14 a6 6 0 0 1 12 0 v14"/>
    <line x1="32" y1="44" x2="32" y2="56"/>
  </svg>`,

  cannon: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="10" y="28" width="32" height="14" rx="2"/>
    <line x1="42" y1="35" x2="54" y2="35"/>
    <circle cx="42" cy="35" r="3.5"/>
    <circle cx="16" cy="48" r="6"/>
    <circle cx="36" cy="48" r="6"/>
    <line x1="16" y1="48" x2="16" y2="48.1" stroke-width="3"/>
    <line x1="36" y1="48" x2="36" y2="48.1" stroke-width="3"/>
    <path d="M50 26 q4 -3 7 0 q-3 2 -7 0"/>
    <path d="M52 20 q4 -2 6 1"/>
  </svg>`,

  locomotive: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="6" y="30" width="26" height="18"/>
    <circle cx="19" cy="39" r="3"/>
    <rect x="32" y="22" width="18" height="26"/>
    <line x1="32" y1="32" x2="50" y2="32"/>
    <rect x="13" y="22" width="8" height="8"/>
    <line x1="14" y1="22" x2="14" y2="18"/>
    <line x1="20" y1="22" x2="20" y2="18"/>
    <path d="M17 16 q-2 -4 0 -8"/>
    <path d="M17 12 q-4 -2 -6 1"/>
    <line x1="4" y1="48" x2="54" y2="48"/>
    <circle cx="14" cy="52" r="4"/>
    <circle cx="28" cy="52" r="4"/>
    <circle cx="42" cy="52" r="4"/>
    <line x1="50" y1="34" x2="56" y2="34"/>
    <line x1="50" y1="40" x2="56" y2="40"/>
  </svg>`,

  sombrero: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <ellipse cx="32" cy="44" rx="28" ry="6"/>
    <path d="M10 44 C 10 24, 20 16, 32 16 C 44 16 54 24 54 44"/>
    <ellipse cx="32" cy="28" rx="5" ry="2.4"/>
    <path d="M18 36 q14 -6 28 0"/>
    <path d="M20 40 q12 -4 24 0"/>
  </svg>`,

  document: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M14 8 L 46 8 L 46 56 L 14 56 Z"/>
    <line x1="20" y1="18" x2="40" y2="18"/>
    <line x1="20" y1="24" x2="40" y2="24"/>
    <line x1="20" y1="30" x2="40" y2="30"/>
    <line x1="20" y1="36" x2="34" y2="36"/>
    <circle cx="42" cy="48" r="7"/>
    <path d="M42 43 L 43.5 47 L 47.5 47 L 44.5 49.5 L 45.5 53 L 42 50.5 L 38.5 53 L 39.5 49.5 L 36.5 47 L 40.5 47 Z" fill="currentColor" stroke="none"/>
  </svg>`,

  derrick: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M18 56 L 28 16 L 36 16 L 46 56"/>
    <line x1="14" y1="56" x2="50" y2="56"/>
    <line x1="22" y1="44" x2="42" y2="44"/>
    <line x1="25" y1="34" x2="39" y2="34"/>
    <line x1="27" y1="24" x2="37" y2="24"/>
    <path d="M22 44 L 36 16"/>
    <path d="M42 44 L 28 16"/>
    <path d="M28 16 q-6 -8 -12 -6"/>
    <circle cx="12" cy="10" r="1.8" fill="currentColor" stroke="none"/>
    <circle cx="18" cy="5" r="1.5" fill="currentColor" stroke="none"/>
    <circle cx="25" cy="3" r="1.5" fill="currentColor" stroke="none"/>
  </svg>`,

  torch: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M32 6 C 22 14, 24 22, 32 30 C 40 22, 42 14, 32 6 Z"/>
    <path d="M30 14 Q 32 22 32 28"/>
    <path d="M26 18 Q 28 24 30 28"/>
    <path d="M38 18 Q 36 24 34 28"/>
    <path d="M20 34 L 26 30 L 38 30 L 44 34 Z"/>
    <line x1="22" y1="34" x2="42" y2="34"/>
    <rect x="28" y="34" width="8" height="22"/>
    <line x1="26" y1="56" x2="38" y2="56"/>
  </svg>`,

  building: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="14" y="6" width="36" height="50"/>
    <line x1="22" y1="14" x2="22" y2="56"/>
    <line x1="32" y1="14" x2="32" y2="56"/>
    <line x1="42" y1="14" x2="42" y2="56"/>
    <line x1="14" y1="22" x2="50" y2="22"/>
    <line x1="14" y1="30" x2="50" y2="30"/>
    <line x1="14" y1="38" x2="50" y2="38"/>
    <line x1="14" y1="46" x2="50" y2="46"/>
    <path d="M26 6 L 20 22 L 28 32 L 22 44 L 28 56" stroke-width="3.5" stroke="currentColor"/>
  </svg>`,
};

// ─── Estado ─────────────────────────────────────────────────
const state = {
  phase: "idle",
  placed: [],            // [{ event, isAnchor, wasCorrect }] — ordenado cronológicamente
  pool: [],              // eventos pendientes shuffled
  pendingIndex: -1,
  pending: null,
  totalRounds: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  history: [],
  startedAt: 0,
  freshCardIdx: -1,      // índice de la card recién colocada (para animar)
  busy: false,
};

const $ = (id) => document.getElementById(id);
const body = document.body;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setPhase(p) {
  state.phase = p;
  body.className = `phase-${p}`;
}

// ─── Render: cards ──────────────────────────────────────────
function renderCardHTML(ev, opts = {}) {
  const { showYear = true, pendingMode = false } = opts;
  const yearHtml = pendingMode
    ? `<div class="card-year">¿en qué año?</div>`
    : (showYear ? `<div class="card-year">${ev.year}</div>` : "");
  return `
    <div class="card-icon">${ICONS[ev.icon] || ""}</div>
    <div class="card-title">${ev.title}</div>
    ${yearHtml}
  `;
}

function renderPendingCard() {
  const c = $("pending-card");
  c.className = "card card-pending";
  c.style.cssText = "";
  c.innerHTML = renderCardHTML(state.pending, { pendingMode: true });
  setupPendingDrag(c);
}

function renderTimeline() {
  const wrap = $("timeline");
  const hasPending = !!state.pending;
  wrap.classList.toggle("is-active", hasPending);

  let html = "";
  for (let i = 0; i < state.placed.length; i++) {
    if (hasPending) {
      html += `<button class="slot" data-idx="${i}" aria-label="Colocar antes de ${state.placed[i].event.title}"></button>`;
    } else {
      html += `<div class="slot" aria-hidden="true"></div>`;
    }
    html += renderTimelineCard(state.placed[i], i);
  }
  if (hasPending) {
    html += `<button class="slot" data-idx="${state.placed.length}" aria-label="Colocar después del último acontecimiento"></button>`;
  } else {
    html += `<div class="slot" aria-hidden="true"></div>`;
  }
  wrap.innerHTML = html;

  if (hasPending) {
    wrap.querySelectorAll(".slot").forEach((btn) => {
      btn.addEventListener("click", () => onSlotClick(Number(btn.dataset.idx)));
    });
  }
}

function renderTimelineCard(entry, idx) {
  let cls = "timeline-card";
  if (entry.isAnchor) cls += " is-anchor";
  else if (entry.wasCorrect) cls += " is-correct";
  else cls += " is-wrong";
  if (idx === state.freshCardIdx) cls += " is-fresh";
  return `
    <div class="${cls}">
      <div class="card">${renderCardHTML(entry.event)}</div>
    </div>
  `;
}

// ─── Drag & drop ────────────────────────────────────────────
// La card NO sale del flujo (no usamos position: fixed). En su lugar
// movemos la card visualmente con transform: translate(dx, dy) y la
// elevamos con z-index. Así el layout no colapsa y el body no
// desborda horizontal.
// Listeners en `document` para no perder eventos al elevar la card
// (lección de conjuga-el-verbo).
let dragState = null;
const DRAG_THRESHOLD = 6;   // px antes de considerarlo arrastre
const DRAG_ROTATION = 2.5;  // grados — inclinación visual mientras se arrastra
const DRAG_SCALE = 0.6;     // escala durante el drag — más chica, más fácil apuntar

function setupPendingDrag(card) {
  card.addEventListener("pointerdown", onDragStart);
}

function transformFor(dx, dy, rot, scale = 1) {
  return `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`;
}

function onDragStart(e) {
  if (state.busy || !state.pending) return;
  if (e.button !== undefined && e.button !== 0) return;
  e.preventDefault();

  const card = e.currentTarget;

  dragState = {
    card,
    pointerId: e.pointerId,
    startX: e.clientX,
    startY: e.clientY,
    moved: false,
    currentSlot: null,
  };

  // Soltar la captura implícita que el browser asigna en touch
  try {
    if (card.hasPointerCapture && card.hasPointerCapture(e.pointerId)) {
      card.releasePointerCapture(e.pointerId);
    }
  } catch (_) {}

  document.addEventListener("pointermove", onDragMove);
  document.addEventListener("pointerup", onDragEnd);
  document.addEventListener("pointercancel", onDragEnd);
}

function activateDrag() {
  dragState.moved = true;
  const card = dragState.card;
  // No tocamos position/left/top/width. Solo elevamos y desactivamos
  // pointer-events para que elementFromPoint vea los slots por debajo.
  card.style.zIndex = "999";
  card.style.pointerEvents = "none";
  card.style.transition = "box-shadow 0.18s ease";
  card.classList.add("is-dragging");
}

function onDragMove(e) {
  if (!dragState) return;
  const dx = e.clientX - dragState.startX;
  const dy = e.clientY - dragState.startY;

  if (!dragState.moved) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    activateDrag();
  }

  dragState.card.style.transform = transformFor(dx, dy, DRAG_ROTATION, DRAG_SCALE);

  // Hit-test: qué slot está bajo el cursor
  const under = document.elementFromPoint(e.clientX, e.clientY);
  const slot = under ? under.closest(".slot") : null;
  const validSlot = (slot && slot.dataset.idx !== undefined) ? slot : null;

  if (validSlot !== dragState.currentSlot) {
    if (dragState.currentSlot) dragState.currentSlot.classList.remove("is-drop-target");
    if (validSlot) validSlot.classList.add("is-drop-target");
    dragState.currentSlot = validSlot;
  }
}

function onDragEnd(e) {
  if (!dragState) return;

  document.removeEventListener("pointermove", onDragMove);
  document.removeEventListener("pointerup", onDragEnd);
  document.removeEventListener("pointercancel", onDragEnd);

  // Limpiar drop-targets (se reacomodan los slots con su transition)
  document.querySelectorAll(".slot.is-drop-target").forEach((s) => {
    s.classList.remove("is-drop-target");
  });

  // Tap sin movimiento sobre la card: no hacemos nada (el tap real va al slot)
  if (!dragState.moved) {
    dragState = null;
    return;
  }

  const slot = dragState.currentSlot;
  const card = dragState.card;

  if (slot && slot.dataset.idx !== undefined) {
    // Drop sobre hueco válido → evaluar.
    // La card se queda donde la soltaron y se desvanece con opacity.
    // Mantenemos is-dragging para que no se re-dispare pending-enter
    // mientras se desvanece — el siguiente round la limpia por completo.
    const slotIdx = Number(slot.dataset.idx);
    card.style.transition = "opacity 0.32s ease";
    card.style.opacity = "0";
    dragState = null;
    onSlotClick(slotIdx, { skipPendingExit: true });
  } else {
    // Drop afuera → vuelve a su origen y tamaño original con transición elástica.
    card.style.transition = "transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1)";
    card.style.transform = transformFor(0, 0, 0, 1);
    const captured = dragState;
    dragState = null;
    setTimeout(() => {
      if ($("pending-card") === captured.card && !captured.card.classList.contains("is-leaving")) {
        captured.card.style.cssText = "";
        captured.card.classList.remove("is-dragging");
      }
    }, 320);
  }
}

// ─── Flujo ──────────────────────────────────────────────────
function startGame() {
  const all = (window.EVENTS || []).slice();
  if (!all.length) {
    console.error("No hay eventos cargados.");
    return;
  }

  const chrono = all.slice().sort((a, b) => a.year - b.year);
  const anchor = chrono[0];

  state.placed = [{ event: anchor, isAnchor: true, wasCorrect: true }];
  state.pool = shuffle(all.filter((e) => e.id !== anchor.id));
  state.pendingIndex = -1;
  state.totalRounds = state.pool.length;
  state.score = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.history = [];
  state.startedAt = Date.now();
  state.freshCardIdx = -1;

  $("r-total").textContent = String(state.totalRounds).padStart(2, "0");
  $("final-total").textContent = state.totalRounds;
  updateScore();

  track("game_start", { total_rounds: state.totalRounds });
  setPhase("game");
  nextRound();
}

function nextRound() {
  state.pendingIndex++;
  state.freshCardIdx = -1;

  if (state.pendingIndex >= state.pool.length) {
    endGame();
    return;
  }

  state.pending = state.pool[state.pendingIndex];
  state.busy = false;

  $("r-current").textContent = String(state.pendingIndex + 1).padStart(2, "0");
  clearFeedback();
  renderPendingCard();
  renderTimeline();
}

function onSlotClick(slotIdx, opts = {}) {
  if (!state.pending || state.busy) return;
  state.busy = true;

  // Calcular el slot correcto: el evento se inserta entre las cards
  // cuyos años lo bracketean.
  const placedYears = state.placed.map((p) => p.event.year);
  let correctIdx = 0;
  for (let i = 0; i < placedYears.length; i++) {
    if (state.pending.year > placedYears[i]) correctIdx = i + 1;
  }

  const wasCorrect = slotIdx === correctIdx;
  const ev = state.pending;

  if (wasCorrect) {
    state.correctCount++;
    state.score += 10;
  } else {
    state.wrongCount++;
  }
  updateScore();

  state.history.push({
    eventId: ev.id,
    year: ev.year,
    slotChosen: slotIdx,
    slotCorrect: correctIdx,
    wasCorrect,
  });

  track("placement", {
    event_id: ev.id,
    year: ev.year,
    correct: wasCorrect,
    round: state.pendingIndex + 1,
  });

  // Insertar en la posición correcta (mantiene la línea correcta visualmente)
  state.placed.splice(correctIdx, 0, {
    event: ev,
    isAnchor: false,
    wasCorrect,
  });

  // Animar salida de la card pendiente (solo si no viene del drag,
  // que ya manejó su propia animación de desvanecimiento)
  if (!opts.skipPendingExit) {
    const pendingEl = $("pending-card");
    pendingEl.classList.add("is-leaving");
  }

  // Mostrar feedback y sello
  showFeedback(wasCorrect, ev);
  showStamp(wasCorrect);

  // Re-renderizar timeline con la nueva card marcada como fresh
  state.freshCardIdx = correctIdx;
  state.pending = null;
  renderTimeline();
  scrollFreshIntoView(correctIdx);

  // Asegurar que el botón "Siguiente" sea visible (sobre todo en móvil)
  requestAnimationFrame(() => {
    $("feedback").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

function endGame() {
  const durationSec = Math.round((Date.now() - state.startedAt) / 1000);
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;

  track("game_complete", {
    correct: state.correctCount,
    wrong: state.wrongCount,
    score: state.score,
    duration_seconds: durationSec,
    total_rounds: state.totalRounds,
  });

  $("final-correct").textContent = state.correctCount;
  $("final-total").textContent = state.totalRounds;
  $("final-time").textContent = `${mins}:${String(secs).padStart(2, "0")}`;

  const title = $("result-title");
  const summary = $("result-summary");
  const ratio = state.correctCount / state.totalRounds;

  if (ratio === 1) {
    title.textContent = "Historia perfecta.";
    summary.textContent = "Colocaste cada acontecimiento exactamente donde le corresponde. Una lectura impecable de la línea del tiempo.";
  } else if (ratio >= 0.78) {
    title.textContent = "Buena lectura.";
    summary.textContent = "Tu sentido del orden histórico está bien afinado. Vale la pena repasar los que se te complicaron.";
  } else if (ratio >= 0.45) {
    title.textContent = "Avanzas en la línea.";
    summary.textContent = "Algunos hitos ya los ubicas con claridad; otros se cruzan entre sí. Conviene volver a leerlos con calma.";
  } else {
    title.textContent = "Vale la pena un repaso.";
    summary.textContent = "La línea quedó armada al final, pero hay varios momentos que conviene revisar antes de volver a jugar.";
  }

  // Render línea final
  const rt = $("result-timeline");
  rt.innerHTML = state.placed.map((p, i) => {
    let cls = "timeline-card";
    if (p.isAnchor) cls += " is-anchor";
    else if (p.wasCorrect) cls += " is-correct";
    else cls += " is-wrong";
    return `
      <div class="${cls}">
        <div class="card">${renderCardHTML(p.event)}</div>
      </div>
    `;
  }).join("");

  setPhase("result");
}

function quitGame() {
  if (state.phase === "game") {
    track("game_abandon", {
      placed: state.pendingIndex,
      correct: state.correctCount,
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
    });
  }
  setPhase("idle");
}

// ─── Feedback ───────────────────────────────────────────────
const CORRECT_PREFIXES = [
  "Exactamente.",
  "Así fue.",
  "Bien colocado.",
  "Correcto.",
  "Justo ahí.",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function showFeedback(wasCorrect, ev) {
  const fb = $("feedback");
  fb.classList.remove("is-correct", "is-wrong");

  const isLastRound = state.pendingIndex + 1 >= state.pool.length;
  const btnLabel = isLastRound ? "Ver resultados →" : "Siguiente →";

  let inner;
  if (wasCorrect) {
    inner = `${pickRandom(CORRECT_PREFIXES)} <strong>${ev.title} · ${ev.year}</strong>${ev.hint}`;
    fb.classList.add("is-correct");
  } else {
    inner = `No fue ahí. <strong>${ev.title} ocurrió en ${ev.year}</strong>${ev.hint}`;
    fb.classList.add("is-wrong");
  }

  fb.innerHTML = `
    <div class="feedback-message">${inner}</div>
    <button class="feedback-next" id="feedback-next" type="button">${btnLabel}</button>
  `;
  $("feedback-next").addEventListener("click", () => nextRound());
}

function clearFeedback() {
  const fb = $("feedback");
  fb.classList.remove("is-correct", "is-wrong");
  fb.innerHTML = "";
}

function updateScore() {
  $("score").textContent = state.score;
}

// ─── Sello (stamp) ──────────────────────────────────────────
function showStamp(wasCorrect) {
  const existing = document.querySelector(".stamp-overlay");
  if (existing) existing.remove();
  const stamp = document.createElement("div");
  stamp.className = `stamp-overlay show ${wasCorrect ? "is-success" : ""}`;
  stamp.textContent = wasCorrect ? "Correcto" : "Erróneo";
  document.body.appendChild(stamp);
  setTimeout(() => stamp.remove(), 1100);
}

function scrollFreshIntoView(idx) {
  // El timeline-wrap es scrollable horizontal.
  // Buscar la N-ésima timeline-card y traerla al centro.
  requestAnimationFrame(() => {
    const wrap = $("timeline-wrap");
    const cards = wrap.querySelectorAll(".timeline-card");
    const target = cards[idx];
    if (!target) return;
    const wrapRect = wrap.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = (targetRect.left + targetRect.width / 2) - (wrapRect.left + wrapRect.width / 2);
    wrap.scrollBy({ left: offset, behavior: "smooth" });
  });
}

// ─── Wiring ─────────────────────────────────────────────────
$("start-btn").addEventListener("click", startGame);
$("restart-btn").addEventListener("click", startGame);
$("quit-btn").addEventListener("click", quitGame);

window.addEventListener("pagehide", () => {
  if (state.phase === "game") {
    track("game_abandon", {
      placed: state.pendingIndex,
      correct: state.correctCount,
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
    });
  }
});

setPhase("idle");
