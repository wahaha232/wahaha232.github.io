// ═══════════════════════════════════════════════════════════════
// Nine Men's Morris UI（架構比照 chess-ui.js）
// 規則邏輯全部在 js/morris.js，這裡只呼叫公開方法。
// 棋盤不是規則網格，改用座標定位（Morris.POINTS）+ SVG 畫連線。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var game = new Morris();
  var boardWrap = document.getElementById("mo-board-wrap");
  var svgEl = document.getElementById("mo-lines");
  var statusEl = document.getElementById("mo-status");
  var pileBEl = document.getElementById("mo-pile-b");
  var pileWEl = document.getElementById("mo-pile-w");

  var points = []; // DOM buttons, index 0..23
  var selected = -1;

  function pct(v) {
    return (v / 6) * 100;
  }

  function buildBoard() {
    var lines = "";
    Morris.MILL_LINES.forEach(function (line) {
      var a = Morris.POINTS[line[0]];
      var c = Morris.POINTS[line[2]];
      lines += '<line x1="' + pct(a[0]) + '%" y1="' + pct(a[1]) + '%" x2="' + pct(c[0]) + '%" y2="' + pct(c[1]) +
        '%" stroke="#252525" stroke-width="2" />';
    });
    svgEl.innerHTML = lines;

    Morris.POINTS.forEach(function (p, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mo-point";
      btn.style.left = pct(p[0]) + "%";
      btn.style.top = pct(p[1]) + "%";
      btn.setAttribute("aria-label", "Point " + (i + 1));
      btn.addEventListener("click", function () { onPointClick(i); });
      boardWrap.appendChild(btn);
      points[i] = btn;
    });
  }

  function render() {
    var legalTargets = [];
    var removableTargets = [];
    if (game.pendingRemoval) {
      removableTargets = game.removablePieces(game.turn === "b" ? "w" : "b");
    } else if (game.phase === "placing") {
      legalTargets = selected === -1 ? game.legalPlacements() : [];
    } else if (selected !== -1) {
      legalTargets = game.legalMoves(selected);
    }

    for (var i = 0; i < 24; i++) {
      var cls = "mo-point";
      var piece = game.board[i];
      if (piece) cls += " mo-point--piece-" + piece;
      if (i === selected) cls += " mo-point--selected";
      if (legalTargets.indexOf(i) !== -1) cls += " mo-point--legal";
      if (removableTargets.indexOf(i) !== -1) cls += " mo-point--removable";
      points[i].className = cls;
    }

    pileBEl.textContent = "Black to place: " + game.toPlace.b;
    pileWEl.textContent = "White to place: " + game.toPlace.w;
    renderStatus();
  }

  function renderStatus() {
    var msg;
    if (game.status === "over") {
      msg = "Game over — " + game.result;
    } else {
      var colorName = game.turn === "b" ? "Black" : "White";
      if (game.pendingRemoval) {
        msg = colorName + " formed a mill — remove one opponent piece (highlighted)";
      } else if (game.phase === "placing") {
        msg = colorName + " to place a piece";
      } else {
        msg = colorName + " to move" + (game.countPieces(game.turn) === 3 ? " (flying)" : "");
      }
    }
    statusEl.textContent = msg;
    statusEl.className = "bg-status" + (game.status === "over" ? " is-over" : "");
  }

  function onPointClick(i) {
    if (game.status === "over") return;

    if (game.pendingRemoval) {
      game.remove(i);
      selected = -1;
      render();
      return;
    }

    if (game.phase === "placing") {
      game.place(i);
      render();
      return;
    }

    // 移動階段：先選自己的棋子，再點目標點
    if (selected !== -1) {
      if (game.legalMoves(selected).indexOf(i) !== -1) {
        game.move(selected, i);
        selected = -1;
        render();
        return;
      }
    }
    if (game.board[i] === game.turn) {
      selected = selected === i ? -1 : i;
      render();
    } else {
      selected = -1;
      render();
    }
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
        render();
      });
    }
    if (undoBtn) {
      undoBtn.addEventListener("click", function () {
        game.undo();
        selected = -1;
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
