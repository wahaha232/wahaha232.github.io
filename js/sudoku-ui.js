// ═══════════════════════════════════════════════════════════════
// Sudoku UI — 只呼叫 js/sudoku.js
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new Sudoku("easy");
  var boardEl = document.getElementById("su-board");
  var statusEl = document.getElementById("su-status");
  var padEl = document.getElementById("su-pad");
  var sel = -1;
  var cells = [];

  function build() {
    boardEl.innerHTML = "";
    cells = [];
    for (var i = 0; i < 81; i++) {
      (function (idx) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "su-cell";
        b.setAttribute("aria-label", "Cell " + (idx + 1));
        b.addEventListener("click", function () {
          sel = idx;
          render();
        });
        boardEl.appendChild(b);
        cells.push(b);
      })(i);
    }

    padEl.innerHTML = "";
    for (var n = 1; n <= 9; n++) {
      (function (num) {
        var pb = document.createElement("button");
        pb.type = "button";
        pb.className = "su-key";
        pb.textContent = String(num);
        pb.addEventListener("click", function () {
          place(num);
        });
        padEl.appendChild(pb);
      })(n);
    }
    var eb = document.createElement("button");
    eb.type = "button";
    eb.className = "su-key su-key--erase";
    eb.textContent = "⌫";
    eb.setAttribute("aria-label", "Erase");
    eb.addEventListener("click", function () {
      place(0);
    });
    padEl.appendChild(eb);
  }

  function place(v) {
    if (sel < 0) return;
    if (v === 0) g.clear(sel);
    else g.set(sel, v);
    render();
  }

  function render() {
    for (var i = 0; i < 81; i++) {
      var val = g.board[i];
      var b = cells[i];
      b.textContent = val ? String(val) : "";
      var cls = "su-cell";
      if (g.isGiven(i)) cls += " su-cell--given";
      if (sel === i) cls += " su-cell--sel";
      if (val && g.conflict(i)) cls += " su-cell--bad";
      var r = Math.floor(i / 9),
        c = i % 9;
      if (c % 3 === 2 && c !== 8) cls += " su-cell--br";
      if (r % 3 === 2 && r !== 8) cls += " su-cell--bb";
      b.className = cls;
    }
    statusEl.textContent = g.won
      ? "Solved! 🎉"
      : "Select a square, then tap a number (or type 1–9). Conflicts show in red.";
  }

  document.addEventListener("keydown", function (e) {
    if (e.key >= "1" && e.key <= "9") place(parseInt(e.key, 10));
    else if (e.key === "Backspace" || e.key === "Delete") place(0);
  });

  var nb = document.getElementById("btn-new");
  if (nb) {
    nb.addEventListener("click", function () {
      var d = document.getElementById("su-diff");
      g = new Sudoku(d ? d.value : "easy");
      sel = -1;
      build();
      render();
    });
  }

  build();
  render();
})();
