// ============================================================
// Conjuga el verbo — drag-and-drop con Pointer Events
// Primera persona singular (yo), modo indicativo.
// ============================================================

const track = (e, d) => { try { window.umami?.track(e, d); } catch (_) {} };

// ─── Banco de verbos ─────────────────────────────────────
// Cada uno: infinitivo + las 3 conjugaciones de "yo" (pretérito / presente / futuro)
const VERBS = {
  regulares: [
    { inf: "caminar",  pasado: "caminé",   presente: "camino",   futuro: "caminaré"   },
    { inf: "bailar",   pasado: "bailé",    presente: "bailo",    futuro: "bailaré"    },
    { inf: "cantar",   pasado: "canté",    presente: "canto",    futuro: "cantaré"    },
    { inf: "saltar",   pasado: "salté",    presente: "salto",    futuro: "saltaré"    },
    { inf: "estudiar", pasado: "estudié",  presente: "estudio",  futuro: "estudiaré"  },
    { inf: "comer",    pasado: "comí",     presente: "como",     futuro: "comeré"     },
    { inf: "correr",   pasado: "corrí",    presente: "corro",    futuro: "correré"    },
    { inf: "vivir",    pasado: "viví",     presente: "vivo",     futuro: "viviré"     },
    { inf: "escribir", pasado: "escribí",  presente: "escribo",  futuro: "escribiré"  },
    { inf: "abrir",    pasado: "abrí",     presente: "abro",     futuro: "abriré"     },
    { inf: "aprender", pasado: "aprendí",  presente: "aprendo",  futuro: "aprenderé"  },
    { inf: "trabajar", pasado: "trabajé",  presente: "trabajo",  futuro: "trabajaré"  },
  ],
  irregulares: [
    { inf: "ser",    pasado: "fui",       presente: "soy",     futuro: "seré"    },
    { inf: "ir",     pasado: "fui",       presente: "voy",     futuro: "iré"     },
    { inf: "tener",  pasado: "tuve",      presente: "tengo",   futuro: "tendré"  },
    { inf: "estar",  pasado: "estuve",    presente: "estoy",   futuro: "estaré"  },
    { inf: "hacer",  pasado: "hice",      presente: "hago",    futuro: "haré"    },
    { inf: "poder",  pasado: "pude",      presente: "puedo",   futuro: "podré"   },
    { inf: "venir",  pasado: "vine",      presente: "vengo",   futuro: "vendré"  },
    { inf: "decir",  pasado: "dije",      presente: "digo",    futuro: "diré"    },
    { inf: "saber",  pasado: "supe",      presente: "sé",      futuro: "sabré"   },
    { inf: "poner",  pasado: "puse",      presente: "pongo",   futuro: "pondré"  },
    { inf: "querer", pasado: "quise",     presente: "quiero",  futuro: "querré"  },
    { inf: "dar",    pasado: "di",        presente: "doy",     futuro: "daré"    },
  ],
};

VERBS.mixto = [...VERBS.regulares, ...VERBS.irregulares];

const ROUNDS_PER_GAME = 8;
const TENSES = ["pasado", "presente", "futuro"];

// ─── Estado ───────────────────────────────────────────────
const state = {
  phase: "idle",
  level: "mixto",
  queue: [],
  current: -1,
  placedCount: 0,        // chips colocados correctamente esta ronda
  roundErrors: 0,        // errores cometidos esta ronda
  roundStartedAt: 0,     // ms timestamp del inicio de la ronda actual
  perfectRounds: 0,      // rondas sin errores
  totalCorrect: 0,
  totalErrors: 0,
  score: 0,
  startedAt: 0,
};

function getVerbKind(inf) {
  return VERBS.regulares.some((v) => v.inf === inf) ? "regular" : "irregular";
}

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

// ─── Picker de nivel ─────────────────────────────────────
document.querySelectorAll(".opt").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".opt").forEach((x) => x.classList.remove("active"));
    btn.classList.add("active");
    state.level = btn.dataset.level;
  });
});

// ─── Flujo del juego ─────────────────────────────────────
function startGame() {
  const pool = VERBS[state.level];
  state.queue = shuffle(pool).slice(0, ROUNDS_PER_GAME);
  state.current = -1;
  state.placedCount = 0;
  state.roundErrors = 0;
  state.perfectRounds = 0;
  state.totalCorrect = 0;
  state.totalErrors = 0;
  state.score = 0;
  state.startedAt = Date.now();

  $("r-total").textContent = String(ROUNDS_PER_GAME).padStart(2, "0");
  updateScore();

  track("game_start", { level: state.level });
  setPhase("quiz");
  nextRound();
}

function nextRound() {
  state.current++;
  if (state.current >= ROUNDS_PER_GAME) {
    endGame();
    return;
  }

  const verb = state.queue[state.current];
  state.placedCount = 0;
  state.roundErrors = 0;
  state.roundStartedAt = Date.now();

  $("r-current").textContent = String(state.current + 1).padStart(2, "0");

  // Cargar el verbo con un pequeño "swap"
  const verbEl = $("verb-word");
  verbEl.classList.remove("is-swapping");
  void verbEl.offsetWidth;
  verbEl.textContent = verb.inf;
  verbEl.classList.add("is-swapping");

  // Resetear zonas
  document.querySelectorAll(".zone-target").forEach((z) => {
    z.classList.remove("is-filled", "is-hovering");
    // mantener el placeholder pero quitar chips si quedaron
    z.querySelectorAll(".chip").forEach((c) => c.remove());
  });

  // Generar chips (orden aleatorio) y renderizar en la pila
  const pool = $("chip-pool");
  pool.innerHTML = "";
  const chips = shuffle(TENSES).map((tense) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.dataset.correct = tense;
    chip.dataset.verb = verb.inf;
    chip.textContent = verb[tense];
    attachDrag(chip);
    return chip;
  });
  chips.forEach((c) => pool.appendChild(c));

  setHint("Arrastra cada forma a su tiempo correcto.");
}

function setHint(text, kind = "") {
  const el = $("quiz-hint");
  el.className = "quiz-hint" + (kind ? ` is-${kind}` : "");
  el.textContent = text;
}

function updateScore() {
  $("score").textContent = state.score;
}

function popScore() {
  const el = $("score");
  el.classList.remove("is-popping");
  void el.offsetWidth;
  el.classList.add("is-popping");
}

function onPlaced() {
  state.placedCount++;
  state.totalCorrect++;
  // Score: base 10 + bonus si la ronda viene sin errores
  const bonus = state.roundErrors === 0 ? 5 : 0;
  state.score += 10 + bonus;
  updateScore();
  popScore();

  if (state.placedCount >= TENSES.length) {
    if (state.roundErrors === 0) state.perfectRounds++;

    const verbInf = state.queue[state.current].inf;
    track("round_complete", {
      verb: verbInf,
      verb_kind: getVerbKind(verbInf),
      errors_in_round: state.roundErrors,
      duration_ms: Date.now() - state.roundStartedAt,
    });

    setHint(state.roundErrors === 0 ? "Perfecto. Avanzamos." : "Bien. Avanzamos.", "success");
    setTimeout(nextRound, 1100);
  } else {
    setHint("Bien. Sigue.", "success");
  }
}

function onWrong(chip, correctTense, droppedAt) {
  state.roundErrors++;
  state.totalErrors++;
  setHint("Esa no era. Inténtalo de nuevo.", "error");
  track("placement", {
    verb: chip.dataset.verb,
    expected: correctTense,
    dropped_at: droppedAt,
    correct: false,
  });
}

function endGame() {
  const durationSec = Math.round((Date.now() - state.startedAt) / 1000);

  track("game_complete", {
    level: state.level,
    score: state.score,
    correct: state.totalCorrect,
    errors: state.totalErrors,
    perfect_rounds: state.perfectRounds,
    duration_seconds: durationSec,
  });

  $("final-score").textContent = state.score;
  $("final-correct").textContent = state.totalCorrect;
  $("final-errors").textContent = state.totalErrors;
  $("final-perfect").textContent = state.perfectRounds;

  const title = $("result-title");
  if (state.totalErrors === 0) {
    title.textContent = "Composición perfecta.";
  } else if (state.totalErrors <= 2) {
    title.textContent = "Casi sin tropiezos.";
  } else if (state.totalErrors <= 5) {
    title.textContent = "Vas avanzando.";
  } else {
    title.textContent = "Hay que repasar.";
  }

  setPhase("result");
}

function quitToIdle() {
  setPhase("idle");
}

// ─── DRAG con Pointer Events (mouse + touch unificado) ──
let activeChip = null;
let activeOrigin = null;   // { parent, nextSibling }
let activeOffset = { x: 0, y: 0 };

function attachDrag(chip) {
  chip.addEventListener("pointerdown", onPointerDown);
}

function onPointerDown(e) {
  // Solo botón principal (o touch)
  if (e.button !== undefined && e.button !== 0) return;
  const chip = e.currentTarget;

  // Ya colocado → no se puede mover
  if (chip.classList.contains("is-placed")) return;

  e.preventDefault();

  const rect = chip.getBoundingClientRect();
  activeChip = chip;
  activeOrigin = { parent: chip.parentNode, nextSibling: chip.nextSibling };
  activeOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };

  // Fijar tamaño actual antes de detachar (evita salto visual)
  chip.style.width = rect.width + "px";
  chip.style.height = rect.height + "px";
  chip.style.left = rect.left + "px";
  chip.style.top = rect.top + "px";

  chip.classList.add("is-dragging");
  document.body.appendChild(chip); // sacar del flujo para que pueda viajar a cualquier zona

  // Escuchamos en document (no en el chip): moverlo en el DOM rompería un pointer capture sobre él.
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("pointercancel", onPointerUp);
}

function onPointerMove(e) {
  if (!activeChip) return;
  activeChip.style.left = (e.clientX - activeOffset.x) + "px";
  activeChip.style.top  = (e.clientY - activeOffset.y) + "px";

  // Hover state en zonas
  const targets = document.querySelectorAll(".zone-target");
  let hoveredTarget = null;
  targets.forEach((z) => z.classList.remove("is-hovering"));

  // .chip.is-dragging tiene pointer-events: none → elementFromPoint devuelve lo que está DEBAJO
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (el) {
    const zone = el.closest(".zone-target");
    if (zone && !zone.classList.contains("is-filled")) {
      zone.classList.add("is-hovering");
      hoveredTarget = zone;
    }
  }
  activeChip._hoveredTarget = hoveredTarget;
}

function onPointerUp(e) {
  if (!activeChip) return;
  const chip = activeChip;
  const target = chip._hoveredTarget;

  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", onPointerUp);
  document.removeEventListener("pointercancel", onPointerUp);

  document.querySelectorAll(".zone-target").forEach((z) => z.classList.remove("is-hovering"));

  if (target && !target.classList.contains("is-filled")) {
    const expected = chip.dataset.correct;
    const droppedAt = target.dataset.target;

    if (expected === droppedAt) {
      // Correcto: el chip se queda en la zona
      placeInZone(chip, target);
      track("placement", {
        verb: chip.dataset.verb,
        expected,
        dropped_at: droppedAt,
        correct: true,
      });
      onPlaced();
    } else {
      // Incorrecto: shake + volver a la pila
      onWrong(chip, expected, droppedAt);
      returnChipToPool(chip, true);
    }
  } else {
    // Soltado fuera de cualquier zona → volver a la pila sin penalidad
    returnChipToPool(chip, false);
  }

  activeChip = null;
  activeOrigin = null;
}

function placeInZone(chip, zone) {
  // Limpiar estilos inline de drag
  chip.style.left = "";
  chip.style.top = "";
  chip.style.width = "";
  chip.style.height = "";
  chip.classList.remove("is-dragging");
  chip.classList.add("is-placed");

  zone.appendChild(chip);
  zone.classList.add("is-filled");
}

function returnChipToPool(chip, shake) {
  chip.style.left = "";
  chip.style.top = "";
  chip.style.width = "";
  chip.style.height = "";
  chip.classList.remove("is-dragging");

  // Restaurar al lugar original en la pila
  if (activeOrigin && activeOrigin.parent) {
    if (activeOrigin.nextSibling) {
      activeOrigin.parent.insertBefore(chip, activeOrigin.nextSibling);
    } else {
      activeOrigin.parent.appendChild(chip);
    }
  } else {
    $("chip-pool").appendChild(chip);
  }

  if (shake) {
    chip.classList.remove("is-wrong");
    void chip.offsetWidth;
    chip.classList.add("is-wrong");
    setTimeout(() => chip.classList.remove("is-wrong"), 450);
  }
}

// ─── Wiring + boot ───────────────────────────────────────
$("start-btn").addEventListener("click", startGame);
$("restart-btn").addEventListener("click", startGame);
$("back-btn").addEventListener("click", quitToIdle);
$("quit-btn").addEventListener("click", quitToIdle);

// Abandon en pagehide
window.addEventListener("pagehide", () => {
  if (state.phase === "quiz") {
    track("game_abandon", {
      level: state.level,
      score: state.score,
      rounds_played: state.current,
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
    });
  }
});

setPhase("idle");
