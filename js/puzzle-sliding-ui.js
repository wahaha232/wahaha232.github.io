// ═══════════════════════════════════════════════════════════════
// Sliding Puzzle UI — 只呼叫 js/puzzle-sliding.js
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new Sliding(4);
  var boardEl = document.getElementById("sl-board");
  var movesEl = document.getElementById("sl-moves");
  var statusEl = document.getElementById("sl-status");
  var cells = [];
  var N = 16;

  function build() {
    boardEl.innerHTML = "";
    cells = [];
    for (var i = 0; i < N; i++) {
      (function (idx) {
        var t = document.createElement("div");
        t.className = "sl-tile";
        t.setAttribute("role", "gridcell");
        t.addEventListener("click", function () {
          if (g.moveIndex(idx)) render();
        });
        boardEl.appendChild(t);
        cells.push(t);
      })(i);
    }
  }

  function render() {
    for (var i = 0; i < N; i++) {
      var v = g.board[i];
      var t = cells[i];
      t.textContent = v ? String(v) : "";
      t.className = "sl-tile" + (v ? "" : " sl-tile--blank");
    }
    movesEl.textContent = String(g.moves);
    statusEl.textContent = g.isSolved() ? "Solved! 🎉" : "Slide the tiles into order (1–15), with the blank at the bottom-right.";
  }

  var KEYS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  document.addEventListener("keydown", function (e) {
    var dir = KEYS[e.key];
    if (!dir) return;
    e.preventDefault();
    if (g.moveDir(dir)) render();
  });

  var nb = document.getElementById("btn-new");
  if (nb) nb.addEventListener("click", function () { g.reset(); render(); });
  var sh = document.getElementById("btn-shuffle");
  if (sh) sh.addEventListener("click", function () { g.shuffle(); render(); });

  build();
  render();
})();
