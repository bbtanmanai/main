/* snowflakes.js — 눈 결정체 파티클 (6방향 크리스탈) */
(function () {
  var canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  /* 이전 루프 취소 — 스크립트 재실행 시 중복 방지 */
  if (canvas._snowRaf) cancelAnimationFrame(canvas._snowRaf);

  var W, H, flakes, raf, lastTime = null;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function makeFlake() {
    return {
      x: Math.random() * W,
      y: Math.random() * H - H * 0.5,
      r: Math.random() * 6.8 + 1.2,
      speed: Math.random() * 2.8 + 1.4,
      drift: Math.random() * 0.6 - 0.3,
      alpha: Math.random() * 0.18 + 0.12,
      sway: Math.random() * Math.PI * 2,
      swayAmp: Math.random() * 0.6 + 0.2,
      swaySpeed: Math.random() * 0.018 + 0.006,
      angle: Math.random() * Math.PI,
      rotSpeed: (Math.random() * 0.012 + 0.003) * (Math.random() < 0.5 ? 1 : -1),
    };
  }

  function drawCrystal(x, y, r, alpha, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = "rgba(255,255,255," + alpha + ")";
    ctx.lineCap = "round";

    if (r < 2.5) {
      /* 작은 눈송이 — 단순 원형 유지 (결정 디테일 안 보임) */
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255," + alpha + ")";
      ctx.fill();
      ctx.restore();
      return;
    }

    ctx.lineWidth = Math.max(0.8, r * 0.13);

    for (var i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((Math.PI / 3) * i);

      /* 메인 팔 */
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, r);
      ctx.stroke();

      /* 가지 1 — 팔의 40% 지점 */
      var b1 = r * 0.40;
      var bl1 = r * 0.28;
      ctx.beginPath();
      ctx.moveTo(0, b1);
      ctx.lineTo( bl1, b1 + bl1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, b1);
      ctx.lineTo(-bl1, b1 + bl1);
      ctx.stroke();

      /* 가지 2 — 팔의 68% 지점 */
      var b2 = r * 0.68;
      var bl2 = r * 0.18;
      ctx.beginPath();
      ctx.moveTo(0, b2);
      ctx.lineTo( bl2, b2 + bl2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, b2);
      ctx.lineTo(-bl2, b2 + bl2);
      ctx.stroke();

      ctx.restore();
    }

    /* 중심 점 */
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(0.8, r * 0.12), 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255," + alpha + ")";
    ctx.fill();

    ctx.restore();
  }

  function init() {
    resize();
    var count = Math.max(112, Math.floor((W * H) / 5625));
    flakes = [];
    for (var i = 0; i < count; i++) {
      var f = makeFlake();
      f.y = Math.random() * H;
      flakes.push(f);
    }
  }

  function tick(timestamp) {
    /* delta time — 60fps 기준 정규화, 최대 3배 캡 (탭 복귀 시 점프 방지) */
    if (!lastTime) lastTime = timestamp;
    var dt = Math.min((timestamp - lastTime) / 16.667, 3);
    lastTime = timestamp;

    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      f.sway  += f.swaySpeed * dt;
      f.angle += f.rotSpeed  * dt;
      f.x     += (f.drift + Math.sin(f.sway) * f.swayAmp) * dt;
      f.y     += f.speed * dt;
      if (f.y > H + f.r * 2) {
        f.y = -f.r * 2;
        f.x = Math.random() * W;
      }
      if (f.x > W + 20) f.x = -20;
      if (f.x < -20) f.x = W + 20;
      drawCrystal(f.x, f.y, f.r, f.alpha, f.angle);
    }
    canvas._snowRaf = raf = requestAnimationFrame(tick);
  }

  function handleResize() {
    if (raf) cancelAnimationFrame(raf);
    lastTime = null;
    init();
    canvas._snowRaf = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", handleResize);
  init();
  canvas._snowRaf = requestAnimationFrame(tick);
})();
