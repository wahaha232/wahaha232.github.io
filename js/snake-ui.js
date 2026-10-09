// ═══════════════════════════════════════════════════════════════
// Snake UI — canvas 繪製 + 鍵盤/方向鍵輸入。規則在 js/snake.js
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new Snake(20, 20);
  var canvas = document.getElementById("snake-canvas");
  var ctx = canvas.getContext("2d");
  var scoreEl = document.getElementById("snake-score");
  var statusEl = document.getElementById("snake-status");
  var CELL = 20;
  canvas.width = g.cols * CELL;
  canvas.height = g.rows * CELL;

  function draw() {
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    for (var i = 0; i <= g.cols; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
    }
    for (var j = 0; j <= g.rows; j++) {
      ctx.beginPath(); ctx.moveTo(0, j * CELL); ctx.lineTo(canvas.width, j * CELL); ctx.stroke();
    }
    if (g.food) {
      ctx.fillStyle = "#ff5b5b";
      ctx.fillRect(g.food.x * CELL + 2, g.food.y * CELL + 2, CELL - 4, CELL - 4);
    }
    g.snake.forEach(function (s, i) {
      ctx.fillStyle = i === 0 ? "#8ff0b0" : "#28a62d";
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(g.score);
    if (!statusEl) return;
    statusEl.textContent = g.won
      ? "You filled the board! 🎉"
      : g.over
        ? "Game over — press New Game."
        : "Arrow keys / WASD (or the on-screen pad) to steer.";
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
    var k = e.key;
    if (k === "ArrowUp" || k === "w" || k === "W") { g.setDir(0, -1); e.preventDefault(); }
    else if (k === "ArrowDown" || k === "s" || k === "S") { g.setDir(0, 1); e.preventDefault(); }
    else if (k === "ArrowLeft" || k === "a" || k === "A") { g.setDir(-1, 0); e.preventDefault(); }
    else if (k === "ArrowRight" || k === "d" || k === "D") { g.setDir(1, 0); e.preventDefault(); }
  });

  function dpad(id, dx, dy) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("click", function () { g.setDir(dx, dy); });
  }
  dpad("snake-up", 0, -1);
  dpad("snake-down", 0, 1);
  dpad("snake-left", -1, 0);
  dpad("snake-right", 1, 0);

  var nb = document.getElementById("btn-new");
  if (nb) nb.addEventListener("click", function () { g.reset(); last = 0; });

  window.requestAnimationFrame(frame);
})();
