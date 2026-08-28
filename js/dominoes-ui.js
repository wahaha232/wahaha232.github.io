// ═══════════════════════════════════════════════════════════════
// Dominoes UI（架構比照 chess-ui.js）
// 規則邏輯全部在 js/dominoes.js，這裡只呼叫公開方法。
// 每次只顯示「目前輪到的玩家」的手牌（其餘牌背面朝下計數），
// 模擬真實骨牌遊戲不能看到對方手牌的設計。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var game = new Dominoes();
  var statusEl = document.getElementById("dm-status");
  var lineEl = document.getElementById("dm-line");
  var handEl = document.getElementById("dm-hand");
  var handTitleEl = document.getElementById("dm-hand-title");
  var opponentCountEl = document.getElementById("dm-opponent-count");
  var dropzonesEl = document.getElementById("dm-dropzones");
  var boneyardCountEl = document.getElementById("dm-boneyard-count");
  var drawBtn = document.getElementById("dm-draw");

  var selectedTile = -1;

  function renderTile(tile, extraClass) {
    var el = document.createElement("span");
    el.className = "dm-tile" + (extraClass ? " " + extraClass : "");
    var a = document.createElement("span");
    a.className = "dm-tile__half";
    a.textContent = String(tile[0]);
    var b = document.createElement("span");
    b.className = "dm-tile__half";
    b.textContent = String(tile[1]);
    el.appendChild(a);
    el.appendChild(b);
    return el;
  }

  function render() {
    lineEl.innerHTML = "";
    if (game.line.length === 0) {
      var empty = document.createElement("span");
      empty.className = "dm-line__empty";
      empty.textContent = "No tiles played yet — play any tile to start.";
      lineEl.appendChild(empty);
    } else {
      game.line.forEach(function (tile) {
        lineEl.appendChild(renderTile(tile, null));
      });
    }

    var other = game.turn === 1 ? 2 : 1;
    handTitleEl.textContent = "Player " + game.turn + "'s hand";
    opponentCountEl.textContent = "Player " + other + " is holding " + game.hands[other].length + " tile(s)";
    boneyardCountEl.textContent = String(game.boneyard.length);

    var legal = game.status === "over" ? [] : game.legalPlays(game.turn);
    handEl.innerHTML = "";
    game.hands[game.turn].forEach(function (tile, i) {
      var ends = legal.filter(function (m) { return m.tileIndex === i; }).map(function (m) { return m.end; });
      var cls = ends.length === 0 ? "dm-tile--unplayable" : (i === selectedTile ? "dm-tile--selected" : null);
      var el = renderTile(tile, cls);
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", tile[0] + "-" + tile[1] + (ends.length === 0 ? " (not playable)" : ""));
      if (ends.length > 0) {
        el.addEventListener("click", function () { onTileClick(i, ends); });
        el.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTileClick(i, ends);
          }
        });
      }
      handEl.appendChild(el);
    });

    dropzonesEl.innerHTML = "";
    if (selectedTile !== -1) {
      var selEnds = legal.filter(function (m) { return m.tileIndex === selectedTile; }).map(function (m) { return m.end; });
      selEnds.forEach(function (end) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dm-dropzone";
        btn.textContent = end === "left" ? "◀ Play on left end" : "Play on right end ▶";
        btn.addEventListener("click", function () { playSelected(end); });
        dropzonesEl.appendChild(btn);
      });
    }

    renderStatus();
    drawBtn.disabled = game.status === "over" || legal.length > 0;
  }

  function onTileClick(index, ends) {
    if (ends.length === 1) {
      selectedTile = -1;
      game.playTile(index, ends[0]);
      render();
      return;
    }
    selectedTile = selectedTile === index ? -1 : index;
    render();
  }

  function playSelected(end) {
    if (selectedTile === -1) return;
    var idx = selectedTile;
    selectedTile = -1;
    game.playTile(idx, end);
    render();
  }

  function renderStatus() {
    var msg;
    if (game.status === "over") {
      msg = "Game over — " + game.result;
    } else {
      msg = "Player " + game.turn + " to play";
    }
    statusEl.textContent = msg;
    statusEl.className = "bg-status" + (game.status === "over" ? " is-over" : "");
  }

  function wireControls() {
    var newBtn = document.getElementById("btn-new");
    var undoBtn = document.getElementById("btn-undo");
    if (drawBtn) {
      drawBtn.addEventListener("click", function () {
        game.draw();
        selectedTile = -1;
        render();
      });
    }
    if (newBtn) {
      newBtn.addEventListener("click", function () {
        if (game.history.length > 0 && !window.confirm("Start a new game? Current game will be lost.")) {
          return;
        }
        game.newGame();
        selectedTile = -1;
        render();
      });
    }
    if (undoBtn) {
      undoBtn.addEventListener("click", function () {
        game.undo();
        selectedTile = -1;
        render();
      });
    }
  }

  function init() {
    if (!lineEl) return;
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
