// ═══════════════════════════════════════════════════════════════
// TriPeaks Solitaire UI — 只呼叫 js/solitaire-tripeaks.js
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new TriPeaks();
  var boardEl = document.getElementById("tp-board");
  var wasteEl = document.getElementById("tp-waste");
  var stockEl = document.getElementById("tp-stock");
  var statusEl = document.getElementById("tp-status");
  var movesEl = document.getElementById("tp-moves");

  var ROW_START = [0, 3, 9, 18];
  var ROW_COUNT = [3, 6, 9, 10];

  function rowOf(idx) {
    for (var r = 3; r >= 0; r--) if (idx >= ROW_START[r]) return r;
    return 0;
  }

  function render() {
    boardEl.innerHTML = "";
    var w = 48,
      h = 66,
      total = 10;
    for (var i = 0; i < 28; i++) {
      (function (idx) {
        var el = CardsUI.cardEl(g.layout[idx].card, true);
        if (g.layout[idx].removed) el.classList.add("sc-card--removed");
        var r = rowOf(idx);
        var pos = idx - ROW_START[r];
        var offset = (total - ROW_COUNT[r]) / 2;
        el.style.position = "absolute";
        el.style.left = (offset + pos) * w + "px";
        el.style.top = r * (h * 0.6) + "px";
        if (g.exposed(idx)) el.classList.add("is-free");
        el.addEventListener("click", function () {
          if (g.play(idx)) render();
        });
        boardEl.appendChild(el);
      })(i);
    }
    boardEl.style.height = 4 * h * 0.6 + h + "px";
    boardEl.style.width = total * w + "px";

    wasteEl.innerHTML = "";
    var wtop = g.wasteTop();
    wasteEl.appendChild(wtop ? CardsUI.cardEl(wtop, true) : CardsUI.slotEl("", "Waste"));

    stockEl.innerHTML = "";
    if (g.stock.length) {
      stockEl.appendChild(CardsUI.cardEl({ suit: "s", rank: 1 }, false));
      var cnt = document.createElement("span");
      cnt.className = "tp-count";
      cnt.textContent = g.stock.length;
      stockEl.appendChild(cnt);
    } else {
      stockEl.appendChild(CardsUI.slotEl());
    }

    if (movesEl) movesEl.textContent = String(g.moves);
    statusEl.textContent = g.won
      ? "You cleared the peaks! 🎉"
      : "Play an exposed card that is one rank above or below the waste card (A↔K wrap).";
  }

  stockEl.addEventListener("click", function () {
    if (g.draw()) render();
  });

  var nb = document.getElementById("btn-new");
  if (nb) {
    nb.addEventListener("click", function () {
      g.reset();
      g.start();
      render();
    });
  }

  g.start();
  render();
})();
