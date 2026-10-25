const CONFIG = {
  target: 3,
  chances: 5,
  timeLimit: 15,
  speed: 220,
  speedUp: 40,
};

const $ = (id) => document.getElementById(id);
const intro = $("intro"),
  game = $("game"),
  stage = $("stage"),
  zone = $("zone");
const fly = $("fly"),
  net = $("net"),
  judge = $("judge"),
  timerEl = $("timer");
const targetText = $("targetText"),
  startBtn = $("startBtn"),
  tutorial = $("tutorial");
const catchBtn = $("catchBtn"),
  result = $("result"),
  resultText = $("resultText"),
  retryBtn = $("retryBtn");
const chanceItems = document.querySelectorAll("#chances li");

const state = {};
let lastTime = performance.now();

// 게임 상태 초기화
function resetState() {
  Object.assign(state, {
    phase: "ready",
    y: 0,
    dir: 1,
    speed: CONFIG.speed,
    success: 0,
    used: 0,
    timeLeft: CONFIG.timeLimit,
  });
  targetText.textContent = `${CONFIG.target}마리`;
  timerEl.textContent = CONFIG.timeLimit;
  chanceItems.forEach((li) => {
    li.className = "";
    li.removeAttribute("aria-label");
  });
  judge.textContent = "";
  net.classList.remove("is-swing");
  result.hidden = true;
  tutorial.hidden = false;
  catchBtn.disabled = true;
}

// 인트로 → 게임
startBtn.addEventListener("click", () => {
  intro.hidden = true;
  game.hidden = false;
  resetState();
});

// 튜토리얼 터치 → 시작
tutorial.addEventListener("click", () => {
  tutorial.hidden = true;
  catchBtn.disabled = false;
  state.phase = "playing";
});

// 캐치 → 판정
catchBtn.addEventListener("click", () => {
  if (state.phase !== "playing") return; // 연타 방지
  state.phase = "judging"; // 이 순간부터 원이 멈춤
  catchBtn.disabled = true;
  net.classList.add("is-swing");

  const hit = isInZone();
  const li = chanceItems[state.used];
  li.classList.add(hit ? "is-success" : "is-fail");
  li.setAttribute(
    "aria-label",
    `${state.used + 1}번째 기회 ${hit ? "성공" : "실패"}`,
  );
  state.used++;
  if (hit) state.success++;

  judge.textContent = hit ? "CATCH!" : "MISS";
  judge.className = "judge " + (hit ? "is-hit" : "is-miss");

  setTimeout(() => {
    if (state.phase === "end") return; // 판정 중 시간이 끝난 경우
    net.classList.remove("is-swing");
    judge.textContent = "";

    if (state.success >= CONFIG.target) return endGame(true);
    const left = CONFIG.chances - state.used;
    if (state.success + left < CONFIG.target) return endGame(false); // 남은 기회로 불가능

    state.speed += CONFIG.speedUp; // 점점 빠르게
    state.phase = "playing";
    catchBtn.disabled = false;
  }, 800);
});

// 원의 중심이 성공 영역 안에 있는지
function isInZone() {
  const f = fly.getBoundingClientRect();
  const z = zone.getBoundingClientRect();
  const center = f.top + f.height / 2;
  return center >= z.top && center <= z.bottom;
}

// 게임 종료
function endGame(win) {
  state.phase = "end";
  catchBtn.disabled = true;
  resultText.textContent = win
    ? `성공! ${state.success}마리를 잡았어요`
    : `아쉬워요! ${state.success}마리를 잡았어요`;
  result.hidden = false;
  retryBtn.focus();
}

retryBtn.addEventListener("click", resetState);

// 원 이동
function move(dt) {
  const min = stage.clientHeight * 0.1;
  const max = stage.clientHeight * 0.9 - fly.offsetHeight;
  state.y += state.dir * state.speed * dt;
  if (state.y >= max) {
    state.y = max;
    state.dir = -1;
  }
  if (state.y <= min) {
    state.y = min;
    state.dir = 1;
  }
  fly.style.transform = `translate(-50%, ${state.y}px)`;
}

// 타이머
function tick(dt) {
  state.timeLeft -= dt;
  timerEl.textContent = Math.max(0, Math.ceil(state.timeLeft));
  if (state.timeLeft <= 0) endGame(false);
}

// 매 프레임 반복
function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  if (state.phase === "playing") move(dt);
  if (state.phase === "playing" || state.phase === "judging") tick(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
