// ============================================================
// Dino Neck — Vanilla Canvas 2D, sin dependencias.
// ============================================================

const track = (e, d) => { try { window.umami?.track(e, d); } catch (_) {} };

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const overlayButton = document.getElementById("overlay-button");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");

const DPR = Math.min(window.devicePixelRatio || 1, 2);
let W = 0;
let H = 0;

// ------------------------------------------------------------
// Constantes de juego
// ------------------------------------------------------------
const NECK_W = 22;
const FRAG_W = NECK_W;
const FRAG_H = 48;
const BODY_W = 120;
const BODY_H = 78;
const HEAD_R = 28;
const NECK_INIT = 70;
const FLOOR_OFFSET = 110;
const SCREEN_HEAD_TARGET = 0.28; // fracción de H donde "vive" la cabeza una vez que scrollea
const SCROLL_START_CATCH = 10; // a partir de esta racha, la cámara fija el tiempo de reacción

const C = {
  bg: "#cde4d2",
  floor: "#8fb59a",
  body: "#a8cdae",
  bodyStroke: "#5a8466",
  belly: "#cde4d2",
  hat: "#8aa8d4",
  eyeWhite: "#ffffff",
  pupil: "#1f2937",
  cheek: "#e6a3ad",
  frag: "#a8cdae",
  textDark: "#3a5c44",
  danger: "#d97373",
};

const STATE = { IDLE: "idle", PLAY: "play", OVER: "over" };

// ------------------------------------------------------------
// Estado
// ------------------------------------------------------------
let state = STATE.IDLE;
let dino = null;
let fragments = [];
let particles = [];
let popups = [];
let camera = { y: 0 };

let score = 0;
let streak = 0;
let bestStreak = 0;
let multiplier = 1;
let lastSpawnT = 0;
let spawnInterval = 1500;
let fragSpeed = 4;
let shake = 0;
let lastT = 0;
let inputMode = "keys";
let gameStartedAt = 0;

const input = {
  left: false,
  right: false,
  pointerX: null,
};

// ------------------------------------------------------------
// Canvas: tamaño y DPR
// ------------------------------------------------------------
function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (dino) {
    dino.y = H - FLOOR_OFFSET;
    dino.x = clamp(dino.x, 70, W - 70);
    dino.targetX = dino.x;
  }
}
window.addEventListener("resize", resize);

// ------------------------------------------------------------
// Inicialización / flujo
// ------------------------------------------------------------
function initDino() {
  dino = {
    x: W / 2,
    y: H - FLOOR_OFFSET,
    targetX: W / 2,
    neckLen: NECK_INIT,
  };
}

function startGame() {
  fragments = [];
  particles = [];
  popups = [];
  score = 0;
  streak = 0;
  multiplier = 1;
  lastSpawnT = performance.now();
  spawnInterval = 1900;
  fragSpeed = 3.2;
  shake = 0;
  camera.y = 0;
  initDino();
  state = STATE.PLAY;
  gameStartedAt = Date.now();
  hideOverlay();
  updateHUD();
  track("game_start");
}

function endGame() {
  state = STATE.OVER;
  shake = 18;
  bestStreak = Math.max(bestStreak, streak);
  track("game_complete", {
    score,
    streak,
    best_streak: bestStreak,
    duration_seconds: Math.round((Date.now() - gameStartedAt) / 1000),
  });
  showOverlay(
    "Game Over",
    `Puntaje: ${score} · Racha: ${streak} (mejor: ${bestStreak})`,
    "Otra vez"
  );
}

function showStart() {
  state = STATE.IDLE;
  showOverlay(
    "Dino Neck",
    "Atrapa los fragmentos. Un fallo y se acabó.",
    "Empezar"
  );
}

function showOverlay(title, text, button) {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayButton.textContent = button;
  overlay.classList.add("visible");
}

function hideOverlay() {
  overlay.classList.remove("visible");
}

function updateHUD() {
  scoreEl.textContent = score;
  if (multiplier > 1) {
    comboEl.textContent = `x${multiplier} · racha ${streak}`;
    comboEl.classList.add("hot");
  } else {
    comboEl.textContent = streak > 0 ? `racha ${streak}` : "";
    comboEl.classList.remove("hot");
  }
}

// ------------------------------------------------------------
// Input
// ------------------------------------------------------------
window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") {
    input.left = true;
    inputMode = "keys";
  }
  if (e.code === "ArrowRight" || e.code === "KeyD") {
    input.right = true;
    inputMode = "keys";
  }
  if (e.code === "Space" || e.code === "Enter") {
    if (state !== STATE.PLAY) startGame();
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft" || e.code === "KeyA") input.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") input.right = false;
});

window.addEventListener("pointermove", (e) => {
  input.pointerX = e.clientX;
  inputMode = "pointer";
});

window.addEventListener("pointerdown", (e) => {
  if (e.target === canvas) {
    input.pointerX = e.clientX;
    inputMode = "pointer";
  }
});

overlayButton.addEventListener("click", () => startGame());

// ------------------------------------------------------------
// Spawn
// ------------------------------------------------------------
function spawnFragment() {
  const margin = 60;
  const x = margin + Math.random() * (W - margin * 2);
  // En world-coords: spawn justo arriba de lo visible (camera.y = world Y del tope visible).
  fragments.push({ x, y: camera.y - FRAG_H, vy: fragSpeed });
}

// ------------------------------------------------------------
// Update
// ------------------------------------------------------------
function updateDino() {
  const speed = 14;
  if (inputMode === "keys") {
    if (input.left) dino.targetX -= speed;
    if (input.right) dino.targetX += speed;
    dino.targetX = clamp(dino.targetX, 70, W - 70);
    dino.x = dino.targetX;
  } else if (input.pointerX !== null) {
    dino.targetX = clamp(input.pointerX, 70, W - 70);
    dino.x += (dino.targetX - dino.x) * 0.22;
  }
}

function headCoords() {
  return { x: dino.x, y: dino.y - BODY_H / 2 - dino.neckLen };
}

function updateFragments() {
  const head = headCoords();
  const tolerance = (NECK_W + FRAG_W) / 2;

  for (let i = fragments.length - 1; i >= 0; i--) {
    const f = fragments[i];
    f.y += f.vy;
    const fragBottom = f.y + FRAG_H;
    const fragCenterX = f.x + FRAG_W / 2;

    if (fragBottom >= head.y) {
      const dx = Math.abs(fragCenterX - head.x);
      if (dx <= tolerance) {
        catchFragment(head.x, head.y);
        fragments.splice(i, 1);
        continue;
      }
    }

    if (f.y > head.y + HEAD_R + 4) {
      missFragment(f);
      fragments.splice(i, 1);
      if (state === STATE.PLAY) {
        endGame();
        return;
      }
    }
  }
}

function catchFragment(hx, hy) {
  streak++;

  let mult = 1;
  if (streak >= 50) mult = 5;
  else if (streak >= 25) mult = 3;
  else if (streak >= 10) mult = 2;

  const prevMult = multiplier;
  multiplier = mult;
  score += mult;

  // Crecer cuello — ilimitado, la cámara hace scroll cuando hace falta.
  dino.neckLen += FRAG_H * 0.7;

  // Acelerar dificultad (rampa suave: el primer tramo se siente jugable).
  fragSpeed = Math.min(fragSpeed + 0.13, 12);
  spawnInterval = Math.max(spawnInterval - 25, 520);

  // Juice.
  spawnParticles(hx, hy, 12, C.bodyStroke);
  const isMilestone = mult > 1 && mult !== prevMult;
  popups.push({
    text: isMilestone ? `¡x${mult}!` : "Perfect!",
    x: hx,
    y: hy - 24,
    life: isMilestone ? 80 : 55,
    vy: -1.3,
    big: isMilestone,
  });
  updateHUD();
}

function missFragment(f) {
  spawnParticles(f.x + FRAG_W / 2, f.y + FRAG_H / 2, 16, C.danger);
}

function spawnParticles(x, y, n, color) {
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const sp = 1 + Math.random() * 3.2;
    particles.push({
      x,
      y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp - 1.2,
      life: 28 + Math.random() * 22,
      r: 2 + Math.random() * 3,
      color,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function updatePopups() {
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) popups.splice(i, 1);
  }
}

function updateCamera() {
  if (!dino) return;
  // Antes de SCROLL_START_CATCH: cámara fija en 0 (dino en la base).
  // Después: la cámara fija la cabeza a SCREEN_HEAD_TARGET en pantalla,
  // así el tiempo de reacción se vuelve constante sin importar el tamaño del viewport.
  let targetY = 0;
  if (streak >= SCROLL_START_CATCH) {
    const head = headCoords();
    targetY = head.y - H * SCREEN_HEAD_TARGET;
  }
  camera.y += (targetY - camera.y) * 0.12;
}

// ------------------------------------------------------------
// Render
// ------------------------------------------------------------
function drawBackground() {
  // Se dibuja en screen-space (sin camera translate) para cubrir siempre todo.
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
}

function drawFloor() {
  // En world-space: queda atado al suelo original y scrollea con la cámara.
  ctx.strokeStyle = C.floor;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 10]);
  ctx.beginPath();
  const floorY = H - FLOOR_OFFSET + BODY_H / 2 + 4;
  ctx.moveTo(0, floorY);
  ctx.lineTo(W, floorY);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDino() {
  const bx = dino.x;
  const by = dino.y;
  const head = headCoords();

  ctx.lineWidth = 3;
  ctx.strokeStyle = C.bodyStroke;

  // Cuello.
  ctx.fillStyle = C.body;
  roundRect(bx - NECK_W / 2, head.y, NECK_W, by - BODY_H / 2 - head.y + 6, 6);
  ctx.fill();
  ctx.stroke();

  // Cola (curva trasera).
  ctx.beginPath();
  ctx.moveTo(bx + BODY_W / 2 - 14, by - 2);
  ctx.quadraticCurveTo(bx + BODY_W / 2 + 36, by - 24, bx + BODY_W / 2 + 24, by - 46);
  ctx.quadraticCurveTo(bx + BODY_W / 2 + 6, by - 30, bx + BODY_W / 2 - 18, by + 6);
  ctx.closePath();
  ctx.fillStyle = C.body;
  ctx.fill();
  ctx.stroke();

  // Patas.
  ctx.fillStyle = C.body;
  roundRect(bx - 36, by + BODY_H / 2 - 6, 20, 26, 7);
  ctx.fill();
  ctx.stroke();
  roundRect(bx + 16, by + BODY_H / 2 - 6, 20, 26, 7);
  ctx.fill();
  ctx.stroke();

  // Cuerpo (óvalo).
  ctx.fillStyle = C.body;
  ctx.beginPath();
  ctx.ellipse(bx, by, BODY_W / 2, BODY_H / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Panza más clara.
  ctx.fillStyle = C.belly;
  ctx.beginPath();
  ctx.ellipse(bx, by + 8, BODY_W / 2 - 22, BODY_H / 2 - 18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cabeza.
  ctx.fillStyle = C.body;
  ctx.beginPath();
  ctx.arc(head.x, head.y, HEAD_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Gorrito de fiesta.
  ctx.fillStyle = C.hat;
  ctx.beginPath();
  ctx.moveTo(head.x - 14, head.y - HEAD_R + 4);
  ctx.lineTo(head.x + 8, head.y - HEAD_R - 22);
  ctx.lineTo(head.x + 14, head.y - HEAD_R + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Pompón.
  ctx.beginPath();
  ctx.arc(head.x + 8, head.y - HEAD_R - 22, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.stroke();

  // Ojo.
  ctx.fillStyle = C.eyeWhite;
  ctx.beginPath();
  ctx.arc(head.x + 6, head.y - 4, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = C.pupil;
  ctx.beginPath();
  ctx.arc(head.x + 9, head.y - 3, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Cachete.
  ctx.fillStyle = C.cheek;
  ctx.beginPath();
  ctx.arc(head.x + 16, head.y + 9, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawFragments() {
  ctx.lineWidth = 3;
  ctx.strokeStyle = C.bodyStroke;
  ctx.fillStyle = C.frag;
  for (const f of fragments) {
    roundRect(f.x, f.y, FRAG_W, FRAG_H, 6);
    ctx.fill();
    ctx.stroke();
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.min(1, p.life / 30);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPopups() {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const p of popups) {
    ctx.globalAlpha = Math.min(1, p.life / 30);
    if (p.big) {
      ctx.fillStyle = C.danger;
      ctx.font = "900 44px system-ui, sans-serif";
    } else {
      ctx.fillStyle = C.textDark;
      ctx.font = "italic 700 26px Georgia, serif";
    }
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

// ------------------------------------------------------------
// Loop principal
// ------------------------------------------------------------
function loop(t) {
  const dt = Math.min(40, t - lastT);
  lastT = t;

  if (state === STATE.PLAY) {
    if (t - lastSpawnT > spawnInterval) {
      spawnFragment();
      lastSpawnT = t;
    }
    updateDino(dt);
    updateFragments();
  }
  updateCamera();
  updateParticles();
  updatePopups();

  ctx.save();
  if (shake > 0) {
    const sx = (Math.random() - 0.5) * shake;
    const sy = (Math.random() - 0.5) * shake;
    ctx.translate(sx, sy);
    shake *= 0.86;
    if (shake < 0.3) shake = 0;
  }

  drawBackground();

  // A partir de acá todo está en world-coords: aplicamos el offset de cámara.
  ctx.translate(0, -camera.y);
  drawFloor();
  if (dino) drawDino();
  drawFragments();
  drawParticles();
  drawPopups();

  ctx.restore();

  requestAnimationFrame(loop);
}

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
window.addEventListener("pagehide", () => {
  if (state === STATE.PLAY) {
    track("game_abandon", {
      score,
      streak,
      duration_seconds: Math.round((Date.now() - gameStartedAt) / 1000),
    });
  }
});

resize();
initDino();
showStart();
requestAnimationFrame(loop);
