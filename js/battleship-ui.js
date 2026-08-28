// ═══════════════════════════════════════════════════════════════
// Battleship UI（架構比照 chess-ui.js）
// 規則邏輯全部在 js/battleship.js，這裡只呼叫公開方法。
// 本機雙人對戰共用一個螢幕，換手前用過場畫面擋住棋盤，避免看到
// 對方的船艦佈署（跟真的海戰棋一樣，交出裝置前不能偷看）。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var game = new Battleship();
  var statusEl = document.getElementById("bs-status");
  var ownGridEl = document.getElementById("bs-own-grid");
  var enemyGridEl = document.getElementById("bs-enemy-grid");
  var ownTitleEl = document.getElementById("bs-own-title");
  var enemyTitleEl = document.getElementById("bs-enemy-title");
  var transitionEl = document.getElementById("bs-transition");
  var transitionText = document.getElementById("bs-transition-text");
  var transitionBtn = document.getElementById("bs-transition-ready");
  var gridsWrap = document.getElementById("bs-grids");

  var revealed = false; // 目前這位玩家是否已按下「準備好了」

  function buildGrid(el) {
    el.innerHTML = "";
    var cells = [];
    for (var i = 0; i < 100; i++) {
      var c = document.createElement("div");
      c.className = "bs-cell";
      c.dataset.index = i;
      el.appendChild(c);
      cells.push(c);
    }
    return cells;
  }

  var ownCells = buildGrid(ownGridEl);
  var enemyCells = buildGrid(enemyGridEl);

  function sunkCellsFor(player) {
    var set = {};
    game.boards[player].ships.forEach(function (ship) {
      if (ship.hits === ship.size) {
        ship.cells.forEach(function (idx) { set[idx] = true; });
      }
    });
    return set;
  }

  function renderOwnBoard() {
    var me = game.turn;
    var fleet = game.boards[me];
    var incoming = game.shots[me === 1 ? 2 : 1];
    var sunk = sunkCellsFor(me);
    for (var i = 0; i < 100; i++) {
      var cls = "bs-cell";
      if (fleet.board[i] !== null) cls += " bs-cell--ship";
      if (sunk[i]) cls += " bs-cell--sunk";
      else if (incoming[i] === "hit") cls += " bs-cell--hit";
      else if (incoming[i] === "miss") cls += " bs-cell--miss";
      ownCells[i].className = cls;
    }
  }

  function renderEnemyBoard() {
    var me = game.turn;
    var enemy = me === 1 ? 2 : 1;
    var myShots = game.shots[me];
    var sunk = sunkCellsFor(enemy);
    for (var i = 0; i < 100; i++) {
      var cls = "bs-cell";
      var already = myShots[i] !== null;
      if (game.status !== "over" && !already) cls += " bs-cell--targetable";
      if (sunk[i]) cls += " bs-cell--sunk";
      else if (myShots[i] === "hit") cls += " bs-cell--hit";
      else if (myShots[i] === "miss") cls += " bs-cell--miss";
      enemyCells[i].className = cls;
    }
  }

  function render() {
    ownTitleEl.textContent = "Your fleet (Player " + game.turn + ")";
    enemyTitleEl.textContent = "Enemy waters — click to fire";
    renderOwnBoard();
    renderEnemyBoard();
    renderStatus();
    showTransition();
  }

  function renderStatus() {
    var msg;
    if (game.status === "over") {
      msg = "Game over — " + game.result;
    } else {
      msg = "Player " + game.turn + " to fire";
    }
    statusEl.textContent = msg;
    statusEl.className = "bg-status" + (game.status === "over" ? " is-over" : "");
  }

  function showTransition() {
    if (game.status === "over") {
      transitionEl.classList.add("is-hidden");
      gridsWrap.setAttribute("aria-hidden", "false");
      return;
    }
    if (revealed) {
      transitionEl.classList.add("is-hidden");
      return;
    }
    transitionText.textContent = "Pass the device to Player " + game.turn + ", then tap Ready.";
    transitionEl.classList.remove("is-hidden");
  }

  function fireAt(index) {
    if (!revealed || game.status === "over") return;
    var enemy = game.turn === 1 ? 2 : 1;
    var res = game.fire(enemy, index);
    if (!res.ok) return;
    revealed = false;
    render();
  }

  function wireControls() {
    var newBtn = document.getElementById("btn-new");
    var undoBtn = document.getElementById("btn-undo");
    transitionBtn.addEventListener("click", function () {
      revealed = true;
      render();
    });
    enemyGridEl.addEventListener("click", function (event) {
      var cell = event.target.closest ? event.target.closest(".bs-cell") : null;
      if (!cell) return;
      fireAt(parseInt(cell.dataset.index, 10));
    });
    if (newBtn) {
      newBtn.addEventListener("click", function () {
        if (game.history.length > 0 && !window.confirm("Start a new game? Current game will be lost.")) {
          return;
        }
        game.newGame();
        revealed = false;
        render();
      });
    }
    if (undoBtn) {
      undoBtn.addEventListener("click", function () {
        game.undo();
        revealed = false;
        render();
      });
    }
  }

  function init() {
    if (!ownGridEl) return;
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
