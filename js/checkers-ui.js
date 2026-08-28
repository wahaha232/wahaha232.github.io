// ═══════════════════════════════════════════════════════════════
// Checkers UI（架構、鍵盤可及性模式比照 chess-ui.js）
// 規則邏輯全部在 js/checkers.js，這裡只呼叫公開方法。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var game = new Checkers();
  var boardEl = document.getElementById("checkers-board");
  var statusEl = document.getElementById("checkers-status");
  var scoreBEl = document.getElementById("checkers-score-b");
  var scoreWEl = document.getElementById("checkers-score-w");

  var squares = [];
  var selected = -1;
  var legal = [];

  var FILES = "abcdefgh";
  var rankOf = function (i) { return Math.floor(i / 8); };
  var fileOf = function (i) { return i % 8; };
  var squareName = function (i) { return FILES[fileOf(i)] + String(8 - rankOf(i)); };

  function isGameOver() {
    return game.status === "over";
  }

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
    for (var i = 0; i < 64; i++) {
      squares[i].classList.remove("selected", "legal", "capture", "last");
      squares[i].innerHTML = "";
      var p = game.pieceAt(i);
      if (p) {
        var el = document.createElement("span");
        el.className = "bg-checker piece-" + p.color;
        el.setAttribute("aria-hidden", "true");
        el.textContent = p.type === "king" ? "♕" : "";
        squares[i].appendChild(el);
      }
    }
    if (game.lastFrom >= 0) squares[game.lastFrom].classList.add("last");
    if (game.lastTo >= 0) squares[game.lastTo].classList.add("last");

    if (selected >= 0) {
      squares[selected].classList.add("selected");
      for (var m = 0; m < legal.length; m++) {
        if (game.pieceAt(legal[m])) squares[legal[m]].classList.add("capture");
        else squares[legal[m]].classList.add("legal");
      }
    }
    renderStatus();
    renderScore();
  }

  function renderStatus() {
    var msg;
    if (game.status === "over") {
      msg = "Game over — " + game.result;
    } else {
      var colorName = game.turn === "b" ? "Black" : "White";
      msg = game.forcedFrom !== -1
        ? colorName + " must continue jumping with the same piece"
        : colorName + " to move";
    }
    statusEl.textContent = msg;
    statusEl.className = "bg-status" + (game.status === "over" ? " is-over" : "");
  }

  function renderScore() {
    var b = 0;
    var w = 0;
    for (var i = 0; i < 64; i++) {
      var p = game.pieceAt(i);
      if (p && p.color === "b") b++;
      if (p && p.color === "w") w++;
    }
    scoreBEl.textContent = String(b);
    scoreWEl.textContent = String(w);
  }

  function selectSquare(i) {
    if (isGameOver()) {
      selected = -1;
      legal = [];
      render();
      return;
    }

    if (selected >= 0 && legal.indexOf(i) !== -1) {
      var res = game.makeMove(selected, i);
      if (res.ok && res.mustContinue) {
        selected = game.forcedFrom;
        legal = game.legalMoves(selected);
      } else {
        selected = -1;
        legal = [];
      }
      render();
      return;
    }

    // 連續跳吃中：只能繼續動被鎖定的那顆棋子，忽略其他格子的點擊
    if (game.forcedFrom !== -1) return;

    var piece = game.pieceAt(i);
    if (piece && piece.color === game.turn) {
      selected = i;
      legal = game.legalMoves(i);
    } else {
      selected = -1;
      legal = [];
    }
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
      selectSquare(i);
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
        selected = -1;
        legal = [];
        render();
      });
    }
    if (undoBtn) {
      undoBtn.addEventListener("click", function () {
        game.undo();
        selected = -1;
        legal = [];
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
      selectSquare(parseInt(sq.dataset.index, 10));
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
