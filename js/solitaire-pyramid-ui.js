// ═══════════════════════════════════════════════════════════════
// Pyramid Solitaire UI — 只呼叫 js/solitaire-pyramid.js
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new Pyramid();
  var boardEl = document.getElementById("py-board");
  var wasteEl = document.getElementById("py-waste");
  var stockEl = document.getElementById("py-stock");
  var statusEl = document.getElementById("py-status");
  var movesEl = document.getElementById("py-moves");
  var sel = null;

  function render() {
    boardEl.innerHTML = "";
    var w = 52,
      h = 72,
      total = 7;
    for (var i = 0; i < 28; i++) {
      (function (idx) {
        var cell = g.pyramid[idx];
        var el = CardsUI.cardEl(cell.card, true);
        if (cell.removed) el.classList.add("sc-card--removed");
        var r = g.rowOf(idx);
        var pos = idx - g.rowStart[r];
        var offset = (total - (r + 1)) / 2;
        el.style.position = "absolute";
        el.style.left = (offset + pos) * w + "px";
        el.style.top = r * (h * 0.62) + "px";
        if (g.isFree(idx)) el.classList.add("is-free");
        if (sel === idx) el.classList.add("is-selected");
        el.addEventListener("click", function () {
          clickCard(idx);
        });
        boardEl.appendChild(el);
      })(i);
    }
    boardEl.style.height = 7 * h * 0.62 + h + "px";
    boardEl.style.width = total * w + "px";

    wasteEl.innerHTML = "";
    var wtop = g.wasteTop();
    wasteEl.appendChild(wtop ? CardsUI.cardEl(wtop, true) : CardsUI.slotEl("", "Waste"));

    stockEl.innerHTML = "";
    if (g.stock.length) {
      stockEl.appendChild(CardsUI.cardEl({ suit: "s", rank: 1 }, false));
      var cnt = document.createElement("span");
      cnt.className = "py-count";
      cnt.textContent = g.stock.length;
      stockEl.appendChild(cnt);
    } else {
      stockEl.appendChild(CardsUI.slotEl());
    }

    if (movesEl) movesEl.textContent = String(g.moves);
    statusEl.textContent = g.won
      ? "Cleared the pyramid! 🎉"
      : "Pair two exposed cards that add up to 13. Kings are removed on their own.";
  }

  function clickCard(idx) {
    if (g.pyramid[idx].removed) return;

    if (g.pyramid[idx].card.rank === 13 && g.removeKing(idx)) {
      sel = null;
      render();
      return;
    }
    if (sel !== null && sel !== idx && g.removePair(sel, idx)) {
      sel = null;
      render();
      return;
    }
    if (!g.isFree(idx)) {
      sel = null;
      render();
      return;
    }
    sel = sel === idx ? null : idx;
    render();
  }

  wasteEl.addEventListener("click", function () {
    if (sel !== null && g.removeWithWaste(sel)) {
      sel = null;
      render();
      return;
    }
    if (g.removeKingWaste()) {
      sel = null;
      render();
      return;
    }
    render();
  });

  stockEl.addEventListener("click", function () {
    if (g.draw()) {
      sel = null;
      render();
    }
  });

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
