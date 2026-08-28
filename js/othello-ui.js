// ═══════════════════════════════════════════════════════════════
// Othello / Reversi UI（架構、鍵盤可及性模式比照 chess-ui.js）
// 規則邏輯全部在 js/othello.js，這裡只呼叫公開方法。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var game = new Othello();
  var boardEl = document.getElementById("othello-board");
  var statusEl = document.getElementById("othello-status");
  var scoreBEl = document.getElementById("othello-score-b");
  var scoreWEl = document.getElementById("othello-score-w");

  var squares = [];
  var FILES = "abcdefgh";
  var rankOf = function (i) { return Math.floor(i / 8); };
  var fileOf = function (i) { return i % 8; };
  var squareName = function (i) { return FILES[fileOf(i)] + String(8 - rankOf(i)); };

  function buildBoard() {
    boardEl.innerHTML = "";
    for (var i = 0; i < 64; i++) {
      var sq = document.createElement("div");
      sq.className = "bg-square " + ((rankOf(i) + fileOf(i)) % 2 === 0 ? "light" : "dark");
      sq.dataset.index = i;
      sq.setAttribute("role", "gridcell");
      sq.setAttribute("tabindex", "0");
      sq.setAttribute("aria-label", squareName(i));
      boardEl.appendChild(sq);
    }
    squares = Array.prototype.slice.call(boardEl.children);
  }

  function render() {
    var legal = game.status === "over" ? [] : game.legalMoves(game.turn);
    for (var i = 0; i < 64; i++) {
      squares[i].classList.remove("legal", "last");
      squares[i].innerHTML = "";
      var p = game.board[i];
      if (p) {
        var disc = document.createElement("span");
        disc.className = "bg-disc disc-" + p;
        disc.setAttribute("aria-hidden", "true");
        squares[i].appendChild(disc);
      } else if (legal.indexOf(i) !== -1) {
        squares[i].classList.add("legal");
      }
    }
    if (game.lastMove >= 0) squares[game.lastMove].classList.add("last");
    renderStatus();
    renderScore();
  }

  function renderStatus() {
    var msg;
    if (game.status === "over") {
      msg = "Game over — " + game.result;
    } else {
      var colorName = game.turn === "b" ? "Black" : "White";
      msg = game.passedLastTurn
        ? colorName + " to move (opponent had no legal move and passed)"
        : colorName + " to move";
    }
    statusEl.textContent = msg;
    statusEl.className = "bg-status" + (game.status === "over" ? " is-over" : "");
  }

  function renderScore() {
    var c = game.counts();
    scoreBEl.textContent = String(c.b);
    scoreWEl.textContent = String(c.w);
  }

  function play(i) {
    game.makeMove(i);
    render();
  }

  function moveFocus(i, dr, df) {
    var r = rankOf(i) + dr;
    var f = fileOf(i) + df;
    if (r < 0 || r > 7 || f < 0 || f > 7) return;
    var target = squares[r * 8 + f];
    if (target) target.focus();
  }

  function onBoardKeydown(event) {
    var sq = event.target.closest ? event.target.closest(".bg-square") : null;
    if (!sq) return;
    var key = event.key;
    var i = parseInt(sq.dataset.index, 10);
    var handled = true;
    if (key === "Enter" || key === " " || key === "Spacebar") {
      play(i);
    } else if (key === "ArrowUp") {
      moveFocus(i, -1, 0);
    } else if (key === "ArrowDown") {
      moveFocus(i, 1, 0);
    } else if (key === "ArrowLeft") {
      moveFocus(i, 0, -1);
    } else if (key === "ArrowRight") {
      moveFocus(i, 0, 1);
    } else {
      handled = false;
    }
    if (handled) event.preventDefault();
  }

  function wireControls() {
    var newBtn = document.getElementById("btn-new");
    var undoBtn = document.getElementById("btn-undo");
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
    boardEl.addEventListener("click", function (event) {
      var sq = event.target.closest ? event.target.closest(".bg-square") : null;
      if (!sq) return;
      play(parseInt(sq.dataset.index, 10));
    });
    boardEl.addEventListener("keydown", onBoardKeydown);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
