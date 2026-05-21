// ============================================================
// Lectura entre líneas — comprensión lectora con audio TTS
// Audios pre-generados con Google Cloud TTS, cargados como <audio>
// ============================================================

const track = (e, d) => { try { window.umami?.track(e, d); } catch (_) {} };

const TEXTS_PER_ROUND = 5;

const state = {
  phase: "idle",
  queue: [],          // 5 textos elegidos para esta ronda
  current: -1,
  awaiting: false,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  audioCount: 0,      // veces que se usó el audio en la ronda
  startedAt: 0,
};

const $ = (id) => document.getElementById(id);
const body = document.body;
const audioEl = $("audio-el");

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

// ─── Flujo ────────────────────────────────────────────────
function startGame() {
  const pool = window.TEXTS || [];
  if (!pool.length) {
    console.error("No hay textos cargados.");
    return;
  }
  state.queue = shuffle(pool).slice(0, TEXTS_PER_ROUND);
  state.current = -1;
  state.score = 0;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.audioCount = 0;
  state.startedAt = Date.now();

  $("r-total").textContent = String(TEXTS_PER_ROUND).padStart(2, "0");
  updateScore();

  track("game_start");
  setPhase("reading");
  nextText();
}

function nextText() {
  state.current++;
  if (state.current >= TEXTS_PER_ROUND) {
    endGame();
    return;
  }

  const t = state.queue[state.current];
  state.awaiting = false;

  $("r-current").textContent = String(state.current + 1).padStart(2, "0");
  $("text-title").textContent = t.title;
  $("text-body").textContent = t.passage;

  // Reset audio
  resetAudio();
  audioEl.src = `assets/audio/${t.id}.mp3`;

  // Render question
  $("q-prompt").textContent = t.question.prompt;
  const optsWrap = $("q-options");
  optsWrap.innerHTML = "";
  const letters = ["A", "B", "C", "D"];
  t.question.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "q-option";
    btn.dataset.idx = idx;
    btn.innerHTML = `<span class="q-option-mark">${letters[idx]}</span><span>${opt}</span>`;
    btn.addEventListener("click", () => onAnswer(idx));
    optsWrap.appendChild(btn);
  });

  // Reset reveal
  const rv = $("reveal");
  rv.className = "reveal";
  $("reveal-glyph").textContent = "";
  $("reveal-text").textContent = "";

  // Scroll arriba del article para que comience la lectura desde el título
  document.querySelector(".article")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function onAnswer(idx) {
  if (state.awaiting) return;
  state.awaiting = true;

  const t = state.queue[state.current];
  const correctIdx = t.question.correct;
  const wasCorrect = idx === correctIdx;

  if (wasCorrect) {
    state.correctCount++;
    state.score += 10;
    popScore();
  } else {
    state.wrongCount++;
  }

  track("answer", {
    text_id: t.id,
    correct: wasCorrect,
    used_audio: audioEl.dataset.played === "1",
  });

  // Visual feedback en opciones
  const optsWrap = $("q-options");
  Array.from(optsWrap.children).forEach((btn) => {
    btn.disabled = true;
    const bIdx = Number(btn.dataset.idx);
    if (bIdx === correctIdx) {
      btn.classList.add(wasCorrect ? "is-correct" : "was-correct");
    } else if (bIdx === idx && !wasCorrect) {
      btn.classList.add("is-wrong");
    }
  });

  // Reveal mensaje
  const rv = $("reveal");
  $("reveal-glyph").textContent = wasCorrect ? "✓" : "✕";
  $("reveal-text").textContent = wasCorrect
    ? "Bien leído. Lo dice el texto."
    : "No era. Volvé a leer con calma.";
  rv.className = `reveal is-visible ${wasCorrect ? "is-success" : "is-error"}`;

  updateScore();

  // Pausar audio si está sonando
  if (!audioEl.paused) audioEl.pause();

  setTimeout(nextText, wasCorrect ? 1600 : 2400);
}

function endGame() {
  pauseAudio();
  const durationSec = Math.round((Date.now() - state.startedAt) / 1000);

  track("game_complete", {
    score: state.score,
    correct: state.correctCount,
    wrong: state.wrongCount,
    audio_uses: state.audioCount,
    duration_seconds: durationSec,
  });

  $("final-score").textContent = state.score;
  $("final-correct").textContent = state.correctCount;
  $("final-wrong").textContent = state.wrongCount;
  $("final-audio").textContent = state.audioCount;

  const title = $("result-title");
  if (state.correctCount === TEXTS_PER_ROUND) {
    title.textContent = "Lectura perfecta.";
  } else if (state.correctCount >= 4) {
    title.textContent = "Casi todo.";
  } else if (state.correctCount >= 2) {
    title.textContent = "Buen primer paso.";
  } else {
    title.textContent = "Hay que repasar.";
  }

  setPhase("result");
}

function quitToIdle() {
  pauseAudio();
  setPhase("idle");
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

// ─── Control de audio ─────────────────────────────────────
const audioBtn = $("audio-btn");
const audioGlyph = $("audio-glyph");
const audioLabel = $("audio-label");
const audioProgress = $("audio-progress");

function resetAudio() {
  pauseAudio();
  audioEl.currentTime = 0;
  audioEl.dataset.played = "0";
  audioProgress.setAttribute("stroke-dashoffset", "100");
  audioGlyph.textContent = "▶";
  audioLabel.textContent = "Escuchar el texto";
  audioBtn.disabled = false;
}

function pauseAudio() {
  if (!audioEl.paused) audioEl.pause();
  audioGlyph.textContent = "▶";
  audioLabel.textContent = audioEl.currentTime > 0 ? "Continuar audio" : "Escuchar el texto";
}

function playAudio() {
  audioEl.play().then(() => {
    audioGlyph.textContent = "❚❚";
    audioLabel.textContent = "Pausar";
    if (audioEl.dataset.played !== "1") {
      audioEl.dataset.played = "1";
      state.audioCount++;
      track("audio_played", { text_id: state.queue[state.current]?.id });
    }
  }).catch((err) => {
    // No se pudo cargar el audio (probablemente falta el archivo)
    audioBtn.disabled = true;
    audioLabel.textContent = "Audio no disponible";
    console.warn("Audio no disponible:", err.message);
  });
}

audioBtn.addEventListener("click", () => {
  if (audioEl.paused) playAudio();
  else pauseAudio();
});

audioEl.addEventListener("timeupdate", () => {
  if (audioEl.duration && isFinite(audioEl.duration)) {
    const pct = (audioEl.currentTime / audioEl.duration) * 100;
    audioProgress.setAttribute("stroke-dashoffset", String(100 - pct));
  }
});

audioEl.addEventListener("ended", () => {
  audioGlyph.textContent = "↻";
  audioLabel.textContent = "Escuchar otra vez";
  audioEl.currentTime = 0;
  audioProgress.setAttribute("stroke-dashoffset", "100");
});

audioEl.addEventListener("error", () => {
  audioBtn.disabled = true;
  audioLabel.textContent = "Audio no disponible";
});

// ─── Wiring ───────────────────────────────────────────────
$("start-btn").addEventListener("click", startGame);
$("restart-btn").addEventListener("click", startGame);
$("back-btn").addEventListener("click", quitToIdle);
$("quit-btn").addEventListener("click", quitToIdle);

window.addEventListener("pagehide", () => {
  if (state.phase === "reading") {
    track("game_abandon", {
      score: state.score,
      texts_read: state.current,
      duration_seconds: Math.round((Date.now() - state.startedAt) / 1000),
    });
  }
});

setPhase("idle");
