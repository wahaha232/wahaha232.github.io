// ═══════════════════════════════════════════════════════════════
// Snakes & Ladders UI（架構比照 chess-ui.js）
// 規則邏輯全部在 js/snakes-ladders.js，這裡只呼叫公開方法。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var LADDER_BASES = [4, 9, 20, 28, 40, 51, 63, 71];
  var SNAKE_HEADS = [17, 54, 62, 64, 87, 93, 95, 98];

  var game = new SnakesAndLadders();
  var boardEl = document.getElementById("sl-board");
  var statusEl = document.getElementById("sl-status");
  var dieEl = document.getElementById("sl-die");
  var eventEl = document.getElementById("sl-event");
  var rollBtn = document.getElementById("sl-roll");

  var cells = []; // index 0..99 對應方格 1..100

  function squareForCell(gridRow, gridCol) {
    var r = 9 - gridRow;
    var leftToRight = r % 2 === 0;
    var col = leftToRight ? gridCol : 9 - gridCol;
    return r * 10 + col + 1;
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    cells = new Array(101);
    for (var row = 0; row < 10; row++) {
      for (var col = 0; col < 10; col++) {
        var square = squareForCell(row, col);
        var cell = document.createElement("div");
        cell.className = "sl-cell";
        if (LADDER_BASES.indexOf(square) !== -1) cell.classList.add("sl-cell--ladder");
        if (SNAKE_HEADS.indexOf(square) !== -1) cell.classList.add("sl-cell--snake");
        var num = document.createElement("span");
        num.className = "sl-cell__num";
        num.textContent = String(square);
        cell.appendChild(num);
        boardEl.appendChild(cell);
        cells[square] = cell;
      }
    }
  }

  function render() {
    for (var s = 1; s <= 100; s++) {
      var existing = cells[s].querySelectorAll(".sl-token");
      existing.forEach(function (t) { t.remove(); });
    }
    placeToken(1, "sl-token--p1");
    placeToken(2, "sl-token--p2");

    dieEl.textContent = game.lastRoll ? String(game.lastRoll) : "–";
    if (game.lastEvent === "ladder") eventEl.textContent = "Climbed a ladder!";
    else if (game.lastEvent === "snake") eventEl.textContent = "Slid down a snake!";
    else eventEl.textContent = "";

    renderStatus();
    rollBtn.disabled = game.status === "over";
  }

  function placeToken(player, cls) {
    var pos = game.positions[player - 1];
    if (pos <= 0) return;
    var token = document.createElement("span");
    token.className = "sl-token " + cls;
    token.setAttribute("aria-hidden", "true");
    cells[pos].appendChild(token);
  }

  function renderStatus() {
    var msg;
    if (game.status === "over") {
      msg = "Game over — " + game.result;
    } else {
      msg = "Player " + game.turn + " to roll";
    }
    statusEl.textContent = msg;
    statusEl.className = "bg-status" + (game.status === "over" ? " is-over" : "");
  }

  function wireControls() {
    var newBtn = document.getElementById("btn-new");
    var undoBtn = document.getElementById("btn-undo");
    if (rollBtn) {
      rollBtn.addEventListener("click", function () {
        game.roll();
        render();
      });
    }
    if (newBtn) {
      newBtn.addEventListener("click", function () {
        if (game.history.length > 0 && !window.confirm("Start a new game? Current game will be lost.")) {
          return;
        }
        game.newGame();
        render();
      });
    }
    if (undoBtn) {
      undoBtn.addEventListener("click", function () {
        game.undo();
        render();
      });
    }
  }

  function init() {
    if (!boardEl) return;
    buildBoard();
    wireControls();
    if (statusEl) {
      statusEl.setAttribute("role", "status");
      statusEl.setAttribute("aria-live", "polite");
      statusEl.setAttribute("aria-atomic", "true");
    }
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
