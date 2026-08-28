// ═══════════════════════════════════════════════════════════════
// Backgammon UI（架構比照 chess-ui.js）
// 規則邏輯全部在 js/backgammon.js，這裡只呼叫公開方法。
// 簡化棋盤：上排 23→12、下排 0→11，中間是 bar；起子用獨立按鈕代表。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var TOP_ROW = [23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12];
  var BOTTOM_ROW = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  var game = new Backgammon();
  var statusEl = document.getElementById("bg-status");
  var topRowEl = document.getElementById("bg-row-top");
  var bottomRowEl = document.getElementById("bg-row-bottom");
  var barWEl = document.getElementById("bg-bar-w");
  var barBEl = document.getElementById("bg-bar-b");
  var offBtn = document.getElementById("bg-off");
  var offWEl = document.getElementById("bg-off-w");
  var offBEl = document.getElementById("bg-off-b");
  var diceEl = document.getElementById("bg-dice");
  var rollBtn = document.getElementById("bg-roll");
  var eventEl = document.getElementById("bg-event");

  var pointEls = {};
  var selected = -1; // point index、"bar"，或 -1 = 未選
  var legalTargets = {}; // target(point index 或 "off") -> die

  function buildBoard() {
    TOP_ROW.forEach(function (i) {
      var el = document.createElement("div");
      el.className = "bg-gm-point";
      el.addEventListener("click", function () { onPointClick(i); });
      topRowEl.appendChild(el);
      pointEls[i] = el;
    });
    BOTTOM_ROW.forEach(function (i) {
      var el = document.createElement("div");
      el.className = "bg-gm-point";
      el.addEventListener("click", function () { onPointClick(i); });
      bottomRowEl.appendChild(el);
      pointEls[i] = el;
    });
  }

  function computeLegalTargets() {
    legalTargets = {};
    if (selected === -1 || game.status === "over") return;
    var color = game.turn;
    var uniqueDice = Array.from(new Set(game.dice));
    uniqueDice.forEach(function (die) {
      if (!game.canMove(color, selected, die)) return;
      var t = game.targetFor(color, selected, die);
      if (!(t in legalTargets)) legalTargets[t] = die;
    });
  }

  function canSelect(from) {
    var color = game.turn;
    if (game.status === "over") return false;
    if (game.bar[color] > 0) return from === "bar";
    if (from === "bar") return false;
    var pt = game.points[from];
    if (!pt || pt.color !== color) return false;
    return Array.from(new Set(game.dice)).some(function (d) { return game.canMove(color, from, d); });
  }

  function render() {
    for (var i = 0; i < 24; i++) {
      var pt = game.points[i];
      var el = pointEls[i];
      el.innerHTML = "";
      var cls = "bg-gm-point";
      if (i === selected) cls += " bg-gm-point--selected";
      if (i in legalTargets) cls += " bg-gm-point--legal";
      el.className = cls;
      if (pt) {
        var shown = Math.min(pt.count, 5);
        for (var k = 0; k < shown; k++) {
          var c = document.createElement("span");
          c.className = "bg-gm-checker bg-gm-checker--" + pt.color;
          el.appendChild(c);
        }
        if (pt.count > 5) {
          var label = document.createElement("span");
          label.className = "bg-gm-point__count";
          label.textContent = "+" + (pt.count - 5);
          el.appendChild(label);
        }
      }
    }

    barWEl.textContent = "Bar (white): " + game.bar.w;
    barBEl.textContent = "Bar (black): " + game.bar.b;
    barWEl.className = "bg-gm-mid-item" + barHighlight("w");
    barBEl.className = "bg-gm-mid-item" + barHighlight("b");
    offWEl.textContent = "White home: " + game.borneOff.w;
    offBEl.textContent = "Black home: " + game.borneOff.b;
    offBtn.className = "bg-gm-mid-item" + ("off" in legalTargets ? " bg-gm-point--legal" : "");

    diceEl.innerHTML = "";
    game.dice.forEach(function (d) {
      var el = document.createElement("span");
      el.className = "bg-gm-die";
      el.textContent = String(d);
      diceEl.appendChild(el);
    });

    renderStatus();
    rollBtn.disabled = game.status === "over" || game.dice.length > 0;
  }

  function barHighlight(color) {
    if (selected === "bar" && game.turn === color) return " bg-gm-point--selected";
    if (game.turn === color && canSelect("bar")) return " bg-gm-point--legal";
    return "";
  }

  function onPointClick(i) {
    if (game.status === "over") return;
    if (i in legalTargets) {
      var die = legalTargets[i];
      game.makeMove(selected, die);
      selected = -1;
      computeLegalTargets();
      render();
      return;
    }
    if (canSelect(i)) {
      selected = selected === i ? -1 : i;
      computeLegalTargets();
      render();
      return;
    }
    selected = -1;
    computeLegalTargets();
    render();
  }

  function onBarClick() {
    if (game.status === "over" || !canSelect("bar")) return;
    selected = selected === "bar" ? -1 : "bar";
    computeLegalTargets();
    render();
  }

  function onOffClick() {
    if (game.status === "over") return;
    if ("off" in legalTargets) {
      var die = legalTargets.off;
      game.makeMove(selected, die);
      selected = -1;
      computeLegalTargets();
      render();
    }
  }

  function renderStatus() {
    var msg;
    if (game.status === "over") {
      msg = "Game over — " + game.result;
    } else if (game.dice.length === 0) {
      msg = (game.turn === "w" ? "White" : "Black") + " to roll";
    } else {
      msg = (game.turn === "w" ? "White" : "Black") + " to move (dice: " + game.dice.join(", ") + ")";
    }
    statusEl.textContent = msg;
    statusEl.className = "bg-status" + (game.status === "over" ? " is-over" : "");
  }

  function wireControls() {
    var newBtn = document.getElementById("btn-new");
    var undoBtn = document.getElementById("btn-undo");
    rollBtn.addEventListener("click", function () {
      var res = game.rollDice();
      eventEl.textContent = res.noMoves ? "No legal moves with that roll — turn passes." : "";
      selected = -1;
      computeLegalTargets();
      render();
    });
    barWEl.addEventListener("click", onBarClick);
    barBEl.addEventListener("click", onBarClick);
    offBtn.addEventListener("click", onOffClick);
    if (newBtn) {
      newBtn.addEventListener("click", function () {
        if (game.history.length > 0 && !window.confirm("Start a new game? Current game will be lost.")) {
          return;
        }
        game.newGame();
        selected = -1;
        legalTargets = {};
        render();
      });
    }
    if (undoBtn) {
      undoBtn.addEventListener("click", function () {
        game.undo();
        selected = -1;
        computeLegalTargets();
        render();
      });
    }
  }

  function init() {
    if (!topRowEl) return;
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
