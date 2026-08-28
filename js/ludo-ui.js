// ═══════════════════════════════════════════════════════════════
// Ludo UI（架構比照 chess-ui.js，2 人簡化版：Red vs Yellow）
// 規則邏輯全部在 js/ludo.js，這裡只呼叫公開方法。
// 棋盤簡化為環狀公共跑道（52 格）+ 每色一條朝圓心的終點跑道（6 格），
// 不是傳統十字棋盤的精確版型，但規則完全一致。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var COLORS = ["red", "yellow"];
  var game = new Ludo(COLORS);

  var boardWrap = document.getElementById("lu-board-wrap");
  var statusEl = document.getElementById("lu-status");
  var dieEl = document.getElementById("lu-die");
  var eventEl = document.getElementById("lu-event");
  var rollBtn = document.getElementById("lu-roll");
  var yardEls = { red: document.getElementById("lu-yard-red"), yellow: document.getElementById("lu-yard-yellow") };

  var currentLegal = [];
  var tokenEls = {}; // color -> [el0..el3]（在跑道/終點上時建立，跟 yard 分開處理）

  function angleFor(pos) {
    return (pos / 52) * 2 * Math.PI - Math.PI / 2;
  }

  function ringXY(pos, radius) {
    var a = angleFor(pos);
    return { x: 50 + radius * Math.cos(a), y: 50 + radius * Math.sin(a) };
  }

  function buildBoard() {
    for (var i = 0; i < 52; i++) {
      var xy = ringXY(i, 42);
      var cell = document.createElement("div");
      cell.className = "lu-cell" + (Ludo.SAFE_POSITIONS.indexOf(i) !== -1 ? " lu-cell--safe" : "");
      cell.style.left = xy.x + "%";
      cell.style.top = xy.y + "%";
      boardWrap.appendChild(cell);
    }

    COLORS.forEach(function (color) {
      var a = angleFor(Ludo.START_OFFSET[color]);
      for (var k = 0; k < 6; k++) {
        var r = 36 - k * 5.5;
        var x = 50 + r * Math.cos(a);
        var y = 50 + r * Math.sin(a);
        var cell = document.createElement("div");
        cell.className = "lu-home-cell lu-home-cell--" + color;
        cell.style.left = x + "%";
        cell.style.top = y + "%";
        boardWrap.appendChild(cell);
      }
    });

    var center = document.createElement("div");
    center.className = "lu-center";
    center.textContent = "🏁";
    boardWrap.appendChild(center);
  }

  function positionForToken(color, d) {
    if (d >= 1 && d <= 51) {
      return ringXY(Ludo.globalPos(color, d), 42);
    }
    if (d >= 52 && d <= 57) {
      var a = angleFor(Ludo.START_OFFSET[color]);
      var k = d - 52;
      var r = 36 - k * 5.5;
      return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
    }
    return null;
  }

  function render() {
    Object.values(tokenEls).forEach(function (list) {
      list.forEach(function (el) { if (el && el.parentNode) el.parentNode.removeChild(el); });
    });
    tokenEls = {};

    COLORS.forEach(function (color) {
      tokenEls[color] = [];
      var yardTokens = [];
      game.tokens[color].forEach(function (d, i) {
        var movable = game.turn === color && currentLegal.indexOf(i) !== -1;
        if (d === 0) {
          yardTokens.push({ i: i, movable: movable });
          return;
        }
        var pos = positionForToken(color, d);
        var el = document.createElement("button");
        el.type = "button";
        el.className = "lu-token lu-token--" + color + (movable ? " lu-token--movable" : "");
        el.style.left = pos.x + "%";
        el.style.top = pos.y + "%";
        el.setAttribute("aria-label", color + " token " + (i + 1) + (d === 57 ? " (home)" : ""));
        if (movable) el.addEventListener("click", function () { pickToken(i); });
        boardWrap.appendChild(el);
        tokenEls[color].push(el);
      });
      renderYard(color, yardTokens);
    });

    renderStatus();
    rollBtn.disabled = game.status === "over";
  }

  function renderYard(color, yardTokens) {
    var panel = yardEls[color];
    panel.innerHTML = "";
    yardTokens.forEach(function (t) {
      var el = document.createElement("button");
      el.type = "button";
      el.className = "lu-token lu-token--" + color + (t.movable ? " lu-token--movable" : "");
      el.setAttribute("aria-label", color + " token " + (t.i + 1) + " (in yard)");
      if (t.movable) el.addEventListener("click", function () { pickToken(t.i); });
      panel.appendChild(el);
    });
    if (yardTokens.length === 0) {
      var span = document.createElement("span");
      span.textContent = "—";
      panel.appendChild(span);
    }
  }

  function pickToken(index) {
    var res = game.moveToken(index, game.lastRoll);
    if (!res.ok) return;
    currentLegal = [];
    var evt = "";
    if (res.captured) evt = "Captured " + res.captured.color + "'s token!";
    else if (res.status === "over") evt = "";
    eventEl.textContent = evt;
    render();
  }

  function renderStatus() {
    var msg;
    if (game.status === "over") {
      msg = "Game over — " + game.result;
    } else if (currentLegal.length > 0) {
      msg = capitalize(game.turn) + ": choose a token to move (" + game.lastRoll + ")";
    } else {
      msg = capitalize(game.turn) + " to roll";
    }
    statusEl.textContent = msg;
    statusEl.className = "bg-status" + (game.status === "over" ? " is-over" : "");
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function wireControls() {
    var newBtn = document.getElementById("btn-new");
    var undoBtn = document.getElementById("btn-undo");
    if (rollBtn) {
      rollBtn.addEventListener("click", function () {
        var res = game.roll();
        dieEl.textContent = String(res.die);
        currentLegal = res.legal || [];
        if (res.forfeited) eventEl.textContent = "Rolled three 6s in a row — turn forfeited!";
        else if (res.noMoves) eventEl.textContent = "No legal moves — turn passes.";
        else eventEl.textContent = "";
        render();
      });
    }
    if (newBtn) {
      newBtn.addEventListener("click", function () {
        if (game.history.length > 0 && !window.confirm("Start a new game? Current game will be lost.")) {
          return;
        }
        game.newGame();
        currentLegal = [];
        render();
      });
    }
    if (undoBtn) {
      undoBtn.addEventListener("click", function () {
        game.undo();
        currentLegal = [];
        dieEl.textContent = game.lastRoll ? String(game.lastRoll) : "–";
        render();
      });
    }
  }

  function init() {
    if (!boardWrap) return;
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
