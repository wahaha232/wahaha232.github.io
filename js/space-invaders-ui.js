// ═══════════════════════════════════════════════════════════════
// Space Invaders UI — canvas 繪製 + 鍵盤/觸控輸入
// 規則邏輯全部在 js/space-invaders.js。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var canvas = document.getElementById("si-canvas");
  var ctx = canvas.getContext("2d");
  var statusEl = document.getElementById("si-status");
  var scoreEl = document.getElementById("si-score");
  var livesEl = document.getElementById("si-lives");

  var game = new SpaceInvaders();
  var W = game.width;
  var H = game.height;
  canvas.width = W;
  canvas.height = H;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 玩家
    ctx.fillStyle = "#3ea6ff";
    ctx.fillRect(game.player.x, game.player.y, game.player.w, game.player.h);

    // 外星人
    ctx.fillStyle = "#28a62d";
    game.aliens.forEach(function (a) {
      if (a.alive) ctx.fillRect(a.x, a.y, a.w, a.h);
    });

    // 玩家子彈
    ctx.fillStyle = "#ffd76a";
    game.playerBullets.forEach(function (b) {
      ctx.fillRect(b.x - 1, b.y - 8, 2, 8);
    });

    // 外星人子彈
    ctx.fillStyle = "#ff5b5b";
    game.alienBullets.forEach(function (b) {
      ctx.fillRect(b.x - 1, b.y, 2, 8);
    });
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(game.score);
    if (livesEl) livesEl.textContent = String(game.lives);
    if (!statusEl) return;
    if (game.won) statusEl.textContent = "You cleared the invaders! 🎉";
    else if (game.over) statusEl.textContent = "Game over — press New Game.";
    else statusEl.textContent = "← → move · Space to fire";
  }

  var last = 0;
  function frame(t) {
    if (!last) last = t;
    var dt = (t - last) / 1000;
    last = t;
    if (!game.over) game.update(dt);
    draw();
    hud();
    window.requestAnimationFrame(frame);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      game.setPlayerDir(-1);
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      game.setPlayerDir(1);
      e.preventDefault();
    } else if (e.key === " " || e.key === "Spacebar") {
      game.fire();
      e.preventDefault();
    }
  });

  document.addEventListener("keyup", function (e) {
    if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].indexOf(e.key) !== -1) {
      game.setPlayerDir(0);
    }
  });

  function hold(el, on, off) {
    if (!el) return;
    el.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      on();
    });
    el.addEventListener("pointerup", function (e) {
      e.preventDefault();
      off();
    });
    el.addEventListener("pointerleave", off);
    el.addEventListener("pointercancel", off);
  }

  hold(document.getElementById("si-left"), function () { game.setPlayerDir(-1); }, function () { game.setPlayerDir(0); });
  hold(document.getElementById("si-right"), function () { game.setPlayerDir(1); }, function () { game.setPlayerDir(0); });

  var fireBtn = document.getElementById("si-fire");
  if (fireBtn) {
    fireBtn.addEventListener("click", function () {
      game.fire();
    });
  }

  var newBtn = document.getElementById("btn-new");
  if (newBtn) {
    newBtn.addEventListener("click", function () {
      game.reset();
      last = 0;
    });
  }

  window.requestAnimationFrame(frame);
})();
