// ═══════════════════════════════════════════════════════════════
// Breakout UI — canvas 繪製 + 輸入。規則在 js/breakout.js
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new Breakout();
  var canvas = document.getElementById("bo-canvas");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("bo-score");
  var livesEl = document.getElementById("bo-lives");
  var statusEl = document.getElementById("bo-status");
  canvas.width = g.width;
  canvas.height = g.height;

  function draw() {
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, g.width, g.height);

    var colors = ["#ff7b7b", "#ffb36b", "#ffe06b", "#8ff0b0", "#7bb8ff"];
    g.bricks.forEach(function (k, i) {
      if (!k.alive) return;
      ctx.fillStyle = colors[Math.floor(i / 8) % colors.length];
      ctx.fillRect(k.x, k.y, k.w, k.h);
    });

    ctx.fillStyle = "#3ea6ff";
    ctx.fillRect(g.paddle.x, g.paddle.y, g.paddle.w, g.paddle.h);

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(g.ball.x, g.ball.y, g.ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(g.score);
    if (livesEl) livesEl.textContent = String(g.lives);
    if (!statusEl) return;
    statusEl.textContent = g.won
      ? "You cleared every brick! 🎉"
      : g.over
        ? "Game over — press New Game."
        : g.ball.stuck
          ? "Press Space (or Launch) to send the ball up."
          : "Move with ← → or A/D.";
  }

  var last = 0;
  function frame(t) {
    if (!last) last = t;
    var dt = (t - last) / 1000;
    last = t;
    if (!g.over) g.update(dt);
    draw();
    hud();
    window.requestAnimationFrame(frame);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { g.setPaddleDir(-1); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { g.setPaddleDir(1); e.preventDefault(); }
    else if (e.key === " " || e.key === "Spacebar") { g.launch(); e.preventDefault(); }
  });
  document.addEventListener("keyup", function (e) {
    if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].indexOf(e.key) !== -1) g.setPaddleDir(0);
  });

  function hold(id, on, off) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("pointerdown", function (e) { e.preventDefault(); on(); });
    el.addEventListener("pointerup", function (e) { e.preventDefault(); off(); });
    el.addEventListener("pointerleave", off);
  }
  hold("bo-left", function () { g.setPaddleDir(-1); }, function () { g.setPaddleDir(0); });
  hold("bo-right", function () { g.setPaddleDir(1); }, function () { g.setPaddleDir(0); });

  var launch = document.getElementById("bo-launch");
  if (launch) launch.addEventListener("click", function () { g.launch(); });

  var nb = document.getElementById("btn-new");
  if (nb) nb.addEventListener("click", function () { g.reset(); last = 0; });

  window.requestAnimationFrame(frame);
})();
