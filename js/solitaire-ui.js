// ═══════════════════════════════════════════════════════════════
// Solitaire Online — UI 層
// 負責：繪製牌桌（庫存/廢牌堆/基礎堆/桌面）、點擊與雙擊操作、
//       選取/移動、提示、勝負顯示、New Game / Undo。
// 規則邏輯全部在 js/solitaire.js（Solitaire engine）。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var game = new Solitaire();
  var tableEl = document.getElementById("sol-table");
  var stockEl = document.getElementById("sol-stock");
  var wasteEl = document.getElementById("sol-waste");
  var foundationsEl = document.getElementById("sol-foundations");
  var tableauEl = document.getElementById("sol-tableau");
  var movesEl = document.getElementById("sol-moves");
  var scoreEl = document.getElementById("sol-score");
  var statusEl = document.getElementById("sol-status-text");
  var winEl = document.getElementById("sol-win");

  var selected = null; // { src: "waste" } | { src: "tableau", pile, pos } | { src: "foundation", foundation }

  function cardEl(card, isTop) {
    var el = document.createElement("div");
    if (card.faceUp) {
      el.className = "card card-up " + (game.isRed(card) ? "red" : "black");
      el.innerHTML =
        '<span class="card-rank">' + card.rank + "</span>" +
        '<span class="card-suit">' + Solitaire.glyph(card.suit) + "</span>";
      el.style.marginTop = isTop ? "0" : "-74px";
    } else {
      el.className = "card card-down";
      el.style.marginTop = isTop ? "0" : "-90px";
    }
    return el;
  }

  function render() {
    // 庫存
    stockEl.innerHTML = "";
    if (game.stock.length > 0) {
      stockEl.innerHTML = '<div class="card card-down" aria-hidden="true"></div>';
    }
    stockEl.classList.toggle("sol-slot--empty", game.stock.length === 0);

    // 廢牌堆
    wasteEl.innerHTML = "";
    if (game.waste.length > 0) {
      wasteEl.appendChild(cardEl(game.waste[game.waste.length - 1], true));
    }
    wasteEl.classList.toggle("sol-slot--empty", game.waste.length === 0);

    // 基礎堆
    foundationsEl.innerHTML = "";
    for (var i = 0; i < 4; i++) {
      var slot = document.createElement("div");
      slot.className = "sol-foundation";
      slot.dataset.foundation = i;
      var f = game.foundations[i];
      if (f.length > 0) {
        slot.appendChild(cardEl(f[f.length - 1], true));
      } else {
        slot.innerHTML = '<span class="sol-slot-empty" aria-hidden="true">♠</span>';
      }
      foundationsEl.appendChild(slot);
    }

    // 桌面 7 疊
    tableauEl.innerHTML = "";
    for (var p = 0; p < 7; p++) {
      var pileEl = document.createElement("div");
      pileEl.className = "sol-pile";
      pileEl.dataset.pile = p;
      var pile = game.tableau[p];
      if (pile.length === 0) {
        pileEl.innerHTML = '<span class="sol-slot-empty" aria-hidden="true"></span>';
      } else {
        for (var c = 0; c < pile.length; c++) {
          var card = pileEl.appendChild(cardEl(pile[c], c === 0));
          card.dataset.pile = p;
          card.dataset.pos = c;
          card.classList.toggle("is-top", c === pile.length - 1);
        }
      }
      tableauEl.appendChild(pileEl);
    }

    // 選取高亮
    if (selected) {
      if (selected.src === "waste" && game.waste.length > 0) {
        var w = wasteEl.querySelector(".card");
        if (w) w.classList.add("is-selected");
      } else if (selected.src === "tableau") {
        var pileCards = tableauEl.querySelectorAll(".sol-pile[data-pile='" + selected.pile + "'] .card");
        pileCards.forEach(function (el, i) {
          var pos = parseInt(el.dataset.pos, 10);
          if (pos >= selected.pos && el.dataset.pile === String(selected.pile)) {
            el.classList.add("is-selected");
          }
        });
      } else if (selected.src === "foundation") {
        var fs = foundationsEl.querySelectorAll(".sol-foundation")[selected.foundation];
        var fc = fs ? fs.querySelector(".card") : null;
        if (fc) fc.classList.add("is-selected");
      }
    }

    movesEl.textContent = game.moves;
    scoreEl.textContent = game.score;
    statusEl.textContent = game.won ? "You won!" : "Solitaire — click a card, then click a destination. Double-click to auto-move.";
    winEl.classList.toggle("is-hidden", !game.won);
  }

  // ── 移動操作包裝 ──────────────────────────────────────────
  function tryMove(handler) {
    if (game.won) return;
    if (handler()) {
      selected = null;
      render();
    }
  }

  function handlePileClick(pileIndex, pos) {
    var pile = game.tableau[pileIndex];
    // 點到空疊：嘗試把選取的牌移到這裡
    if (pos === -1) {
      if (!selected) return;
      if (selected.src === "waste") tryMove(function () { return game.moveWasteToTableau(pileIndex).ok; });
      else if (selected.src === "tableau") tryMove(function () { return game.moveTableauToTableau(selected.pile, selected.pos, pileIndex).ok; });
      else if (selected.src === "foundation") tryMove(function () { return game.moveFoundationToTableau(selected.foundation, pileIndex).ok; });
      return;
    }
    var card = pile[pos];
    if (!card.faceUp) return; // 蓋牌不可點

    // 已選取 → 嘗試移動到這一疊
    if (selected) {
      if (selected.src === "waste") tryMove(function () { return game.moveWasteToTableau(pileIndex).ok; });
      else if (selected.src === "tableau") {
        if (selected.pile === pileIndex) { selected = null; render(); return; }
        tryMove(function () { return game.moveTableauToTableau(selected.pile, selected.pos, pileIndex).ok; });
      } else if (selected.src === "foundation") tryMove(function () { return game.moveFoundationToTableau(selected.foundation, pileIndex).ok; });
      return;
    }
    // 未選取 → 選取這張（含上方序列）
    selected = { src: "tableau", pile: pileIndex, pos: pos };
    render();
  }

  function handleFoundationClick(index) {
    if (selected) {
      if (selected.src === "waste") tryMove(function () { return game.moveWasteToFoundation().ok; });
      else if (selected.src === "tableau") tryMove(function () { return game.moveTableauToFoundation(selected.pile).ok; });
      else if (selected.src === "foundation") { selected = null; render(); }
      return;
    }
    if (game.foundations[index].length > 0) {
      selected = { src: "foundation", foundation: index };
      render();
    }
  }

  function handleWasteClick() {
    if (selected) {
      if (selected.src === "waste") { selected = null; render(); }
      else { selected = null; render(); }
      return;
    }
    if (game.waste.length > 0) {
      selected = { src: "waste" };
      render();
    }
  }

  // ── 事件委派 ──────────────────────────────────────────────
  function init() {
    stockEl.addEventListener("click", function () {
      tryMove(function () { return game.drawStock().ok; });
    });

    wasteEl.addEventListener("click", handleWasteClick);

    // 雙擊廢牌堆頂端 → 自動上基礎堆
    wasteEl.addEventListener("dblclick", function () {
      tryMove(function () { return game.autoMoveToFoundation(-1).ok; });
    });

    tableauEl.addEventListener("click", function (event) {
      var card = event.target.closest(".card");
      var pileEl = event.target.closest(".sol-pile");
      if (!pileEl) return;
      var pileIndex = parseInt(pileEl.dataset.pile, 10);
      var pos = card ? parseInt(card.dataset.pos, 10) : -1;
      handlePileClick(pileIndex, pos);
    });

    // 雙擊桌面翻開牌 → 自動上基礎堆
    tableauEl.addEventListener("dblclick", function (event) {
      var card = event.target.closest(".card");
      if (!card) return;
      var pileIndex = parseInt(card.dataset.pile, 10);
      tryMove(function () { return game.moveTableauToFoundation(pileIndex).ok; });
    });

    foundationsEl.addEventListener("click", function (event) {
      var slot = event.target.closest(".sol-foundation");
      if (!slot) return;
      handleFoundationClick(parseInt(slot.dataset.foundation, 10));
    });

    // 按鈕
    var newBtn = document.getElementById("btn-new");
    var undoBtn = document.getElementById("btn-undo");
    if (newBtn) newBtn.addEventListener("click", function () { game.newGame(); selected = null; render(); });
    if (undoBtn) undoBtn.addEventListener("click", function () { game.undo(); selected = null; render(); });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
