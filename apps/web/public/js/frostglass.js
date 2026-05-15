/* frostglass.js — 유리창 성에 결정 (Canvas 2D, 정적) */
(function () {
  var canvas = document.getElementById("frost-canvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var W, H;

  /* 재귀 성에 가지 */
  function branch(x, y, angle, len, depth, alpha, lw) {
    if (depth <= 0 || len < 1.2) return;

    var ex = x + Math.cos(angle) * len;
    var ey = y + Math.sin(angle) * len;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = "rgba(210,235,255," + alpha + ")";
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.stroke();

    var nl  = len  * (0.52 + Math.random() * 0.18);
    var sp  = Math.PI / 3.2 + Math.random() * (Math.PI / 10);
    var na  = alpha * 0.87;
    var nlw = lw * 0.68;

    /* 가지 3방향: 직진 + 좌/우 */
    branch(ex, ey, angle + (Math.random() - 0.5) * 0.28, nl,        depth - 1, na,       nlw);
    branch(ex, ey, angle - sp,                             nl * 0.72, depth - 1, na * 0.85, nlw);
    branch(ex, ey, angle + sp,                             nl * 0.72, depth - 1, na * 0.85, nlw);

    /* 가끔 추가 분기 */
    if (Math.random() < 0.32) {
      branch(ex, ey, angle + (Math.random() - 0.5) * Math.PI, nl * 0.42, depth - 2, na * 0.55, nlw * 0.6);
    }
  }

  function render() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, W, H);

    /* ── 상단 엣지 산발 ── */
    var PI = Math.PI;
    var topN = Math.max(6, Math.floor(W / 110));
    for (var i = 0; i < topN; i++) {
      var x = (i + 0.25 + Math.random() * 0.5) * (W / topN);
      branch(x, 0, PI * 0.5 + (Math.random() - 0.5) * 0.5, 22 + Math.random() * 38, 4, 0.32, 0.7);
    }

    /* ── 좌/우 엣지 ── */
    var sideN = Math.max(4, Math.floor(H / 140));
    for (var i = 0; i < sideN; i++) {
      var y = (i + 0.25 + Math.random() * 0.5) * (H / sideN);
      branch(0, y, (Math.random() - 0.5) * 0.5,        18 + Math.random() * 28, 3, 0.26, 0.6);
      branch(W, y, PI + (Math.random() - 0.5) * 0.5,   18 + Math.random() * 28, 3, 0.26, 0.6);
    }

    /* ── 하단 엣지 ── */
    var botN = Math.max(5, Math.floor(W / 140));
    for (var i = 0; i < botN; i++) {
      var x = (i + 0.25 + Math.random() * 0.5) * (W / botN);
      branch(x, H, -PI * 0.5 + (Math.random() - 0.5) * 0.45, 18 + Math.random() * 28, 3, 0.22, 0.6);
    }

    /* ── 결로 방울 (작은 얼음 방울) ── */
    var dropN = Math.floor((W * H) / 35000);
    for (var i = 0; i < dropN; i++) {
      /* 엣지 근처에 집중 */
      var ex = Math.random() < 0.5
        ? Math.random() * W * 0.18
        : W - Math.random() * W * 0.18;
      var ey = Math.random() * H;
      var er = 1 + Math.random() * 2.5;
      var ea = 0.15 + Math.random() * 0.30;
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220,240,255," + ea + ")";
      ctx.fill();
    }
  }

  render();
  window.addEventListener("resize", render);
})();
