// ═══════════════════════════════════════════════════════════════
// Pong UI — canvas 繪製 + 輸入。規則在 js/pong.js
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new Pong();
  var canvas = document.getElementById("pg-canvas");
  var ctx = canvas.getContext("2d");
  var pEl = document.getElementById("pg-player");
  var aEl = document.getElementById("pg-ai");
  var statusEl = document.getElementById("pg-status");
  canvas.width = g.width;
  canvas.height = g.height;

  function draw() {
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, g.width, g.height);

    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(g.width / 2, 0);
    ctx.lineTo(g.width / 2, g.height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#3ea6ff";
    ctx.fillRect(g.player.x, g.player.y, g.player.w, g.player.h);
    ctx.fillStyle = "#ff7b7b";
    ctx.fillRect(g.ai.x, g.ai.y, g.ai.w, g.ai.h);

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(g.ball.x, g.ball.y, g.ball.r, 0, Math.PI * 2);
    ctx.fill();
  }

  function hud() {
    if (pEl) pEl.textContent = String(g.playerScore);
    if (aEl) aEl.textContent = String(g.aiScore);
    if (!statusEl) return;
    statusEl.textContent = g.over
      ? (g.winner === "player" ? "You win! 🎉 Press New Game." : "CPU wins — press New Game.")
      : "Move with ↑ ↓ or W/S. First to " + g.winningScore + " wins.";
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
    if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") { g.setPlayerDir(-1); e.preventDefault(); }
    else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") { g.setPlayerDir(1); e.preventDefault(); }
  });
  document.addEventListener("keyup", function (e) {
    if (["ArrowUp", "ArrowDown", "w", "W", "s", "S"].indexOf(e.key) !== -1) g.setPlayerDir(0);
  });

  function hold(id, on, off) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("pointerdown", function (e) { e.preventDefault(); on(); });
    el.addEventListener("pointerup", function (e) { e.preventDefault(); off(); });
    el.addEventListener("pointerleave", off);
  }
  hold("pg-up", function () { g.setPlayerDir(-1); }, function () { g.setPlayerDir(0); });
  hold("pg-down", function () { g.setPlayerDir(1); }, function () { g.setPlayerDir(0); });

  var nb = document.getElementById("btn-new");
  if (nb) nb.addEventListener("click", function () { g.reset(); last = 0; });

  window.requestAnimationFrame(frame);
})();
