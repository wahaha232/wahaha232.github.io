// ═══════════════════════════════════════════════════════════════
// Puzzle Games UI（2048 介面）— 只呼叫 js/puzzle.js 公開方法
// 操作：方向鍵 / WASD、滑動手勢、New Game。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var game = new Puzzle(4);
  var boardEl = document.getElementById("puzzle-board");
  var scoreEl = document.getElementById("puzzle-score");
  var statusEl = document.getElementById("puzzle-status");
  var cells = [];

  function build() {
    boardEl.innerHTML = "";
    cells = [];
    for (var i = 0; i < 16; i++) {
      var cell = document.createElement("div");
      cell.className = "pz-cell";
      cell.setAttribute("role", "gridcell");
      var tile = document.createElement("div");
      tile.className = "pz-tile";
      cell.appendChild(tile);
      boardEl.appendChild(cell);
      cells.push(tile);
    }
  }

  function render() {
    for (var i = 0; i < 16; i++) {
      var v = game.board[i];
      var tile = cells[i];
      tile.textContent = v ? String(v) : "";
      tile.setAttribute("data-val", v ? String(v) : "");
      if (v >= 8) tile.setAttribute("data-big", "");
      else tile.removeAttribute("data-big");
    }
    scoreEl.textContent = String(game.score);
    if (game.won) statusEl.textContent = "You reached 2048! 🎉 Keep going or start a new game.";
    else if (game.over) statusEl.textContent = "No more moves — game over. Press New Game.";
    else statusEl.textContent = "Join the tiles to reach 2048!";
  }

  function step(dir) {
    if (game.move(dir).moved) render();
  }

  var KEYMAP = {
    ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
    a: "left", d: "right", w: "up", s: "down", A: "left", D: "right", W: "up", S: "down"
  };

  document.addEventListener("keydown", function (e) {
    var dir = KEYMAP[e.key];
    if (!dir) return;
    e.preventDefault();
    step(dir);
  });

  var startX = 0, startY = 0;
  boardEl.addEventListener("touchstart", function (e) {
    var t = e.changedTouches[0];
    startX = t.clientX;
    startY = t.clientY;
  }, { passive: true });

  boardEl.addEventListener("touchend", function (e) {
    var t = e.changedTouches[0];
    var dx = t.clientX - startX;
    var dy = t.clientY - startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    step(dir);
  }, { passive: true });

  var newBtn = document.getElementById("btn-new");
  if (newBtn) {
    newBtn.addEventListener("click", function () {
      game.reset();
      render();
    });
  }

  build();
  render();
})();
