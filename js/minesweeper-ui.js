// ═══════════════════════════════════════════════════════════════
// Minesweeper UI — 只呼叫 js/minesweeper.js
// 左鍵翻開、右鍵（或長按）插旗。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new Minesweeper(9, 9, 10);
  var boardEl = document.getElementById("ms-board");
  var statusEl = document.getElementById("ms-status");
  var leftEl = document.getElementById("ms-left");
  var faceEl = document.getElementById("ms-face");
  var cells = [];

  function build() {
    boardEl.style.gridTemplateColumns = "repeat(" + g.cols + ", 1fr)";
    boardEl.innerHTML = "";
    cells = [];
    for (var r = 0; r < g.rows; r++) {
      for (var c = 0; c < g.cols; c++) {
        (function (r, c) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "ms-cell";
          b.setAttribute("aria-label", "Row " + (r + 1) + ", column " + (c + 1));
          b.addEventListener("click", function () {
            g.reveal(r, c);
            render();
          });
          b.addEventListener("contextmenu", function (e) {
            e.preventDefault();
            g.toggleFlag(r, c);
            render();
          });
          var timer = 0;
          b.addEventListener(
            "touchstart",
            function () {
              timer = window.setTimeout(function () {
                g.toggleFlag(r, c);
                render();
              }, 450);
            },
            { passive: true }
          );
          b.addEventListener("touchend", function () {
            window.clearTimeout(timer);
          });
          boardEl.appendChild(b);
          cells.push(b);
        })(r, c);
      }
    }
  }

  function render() {
    var lost = g.state === "lost";
    for (var r = 0; r < g.rows; r++) {
      for (var c = 0; c < g.cols; c++) {
        var i = g.idx(r, c);
        var cell = g.cells[i];
        var b = cells[i];
        b.className = "ms-cell";
        b.textContent = "";
        if (cell.revealed) {
          b.classList.add("ms-cell--open");
          if (cell.mine) {
            b.classList.add("ms-cell--mine");
            b.textContent = "💣";
          } else if (cell.adj > 0) {
            b.textContent = String(cell.adj);
            b.classList.add("ms-n" + cell.adj);
          }
        } else if (cell.flagged) {
          b.textContent = "🚩";
        } else if (lost && cell.mine) {
          b.classList.add("ms-cell--open", "ms-cell--mine");
          b.textContent = "💣";
        }
        b.disabled = cell.revealed || g.state !== "playing";
      }
    }
    leftEl.textContent = String(g.minesLeft());
    if (faceEl) faceEl.textContent = g.state === "won" ? "😎" : lost ? "😵" : "🙂";
    statusEl.textContent =
      g.state === "won"
        ? "You cleared the board! 🎉"
        : lost
          ? "Boom! Click the face to play again."
          : "Left-click to reveal · right-click (or long-press) to flag.";
  }

  function restart() {
    g.reset();
    build();
    render();
  }

  if (faceEl) faceEl.addEventListener("click", restart);
  var nb = document.getElementById("btn-new");
  if (nb) nb.addEventListener("click", restart);

  build();
  render();
})();
