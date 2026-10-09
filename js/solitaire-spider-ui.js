// ═══════════════════════════════════════════════════════════════
// Spider Solitaire UI — 只呼叫 js/solitaire-spider.js
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new Spider();
  var boardEl = document.getElementById("sp-board");
  var statusEl = document.getElementById("sp-status");
  var movesEl = document.getElementById("sp-moves");
  var doneEl = document.getElementById("sp-done");
  var stockEl = document.getElementById("sp-stock");
  var sel = null;

  function render() {
    boardEl.innerHTML = "";
    for (var c = 0; c < 10; c++) {
      (function (col) {
        var pile = document.createElement("div");
        pile.className = "sc-col sc-col--sp";
        var arr = g.tableau[col];
        if (!arr.length) pile.appendChild(CardsUI.slotEl());
        var offset = 0;
        for (var k = 0; k < arr.length; k++) {
          (function (idx) {
            var card = arr[idx];
            var el = CardsUI.cardEl(card, card.faceUp);
            el.style.top = offset + "px";
            offset += card.faceUp ? 20 : 8;
            if (sel && sel.col === col && idx >= sel.idx) el.classList.add("is-selected");
            el.addEventListener("click", function (e) {
              e.stopPropagation();
              clickColCard(col, idx);
            });
            pile.appendChild(el);
          })(k);
        }
        pile.addEventListener("click", function () {
          clickCol(col);
        });
        boardEl.appendChild(pile);
      })(c);
    }

    movesEl.textContent = String(g.moves);
    doneEl.textContent = g.completed + "/8";
    if (stockEl) {
      stockEl.innerHTML = "";
      if (g.stock.length) {
        var back = document.createElement("div");
        back.className = "sc-card sc-card--down";
        stockEl.appendChild(back);
        var cnt = document.createElement("span");
        cnt.className = "sp-stock__count";
        cnt.textContent = g.stock.length;
        stockEl.appendChild(cnt);
      } else {
        stockEl.appendChild(CardsUI.slotEl());
      }
    }
    statusEl.textContent = g.won
      ? "You cleared all eight runs! 🎉"
      : "Move a same-suit descending run onto a card one higher. Click the deck to deal.";
  }

  function clickColCard(col, idx) {
    if (sel) {
      if (g.moveRun(sel.col, sel.idx, col)) sel = null;
      else sel = null;
      render();
      return;
    }
    if (g.sameSuitRun(col, idx) > 0) {
      sel = { col: col, idx: idx };
      render();
    }
  }

  function clickCol(col) {
    if (sel && g.moveRun(sel.col, sel.idx, col)) sel = null;
    else sel = null;
    render();
  }

  if (stockEl) {
    stockEl.addEventListener("click", function () {
      if (g.dealStock()) {
        sel = null;
        render();
      }
    });
  }

  var nb = document.getElementById("btn-new");
  if (nb) {
    nb.addEventListener("click", function () {
      g.reset();
      sel = null;
      render();
    });
  }

  render();
})();
