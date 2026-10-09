// ═══════════════════════════════════════════════════════════════
// FreeCell UI — 只呼叫 js/solitaire-freecell.js
// 點選一張牌（或一整段序列）→ 點目標牌疊完成移動；雙擊送基礎堆。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var g = new FreeCell();
  var topEl = document.getElementById("fc-top");
  var boardEl = document.getElementById("fc-board");
  var statusEl = document.getElementById("fc-status");
  var movesEl = document.getElementById("fc-moves");
  var sel = null;

  function render() {
    topEl.innerHTML = "";
    ["s", "h", "d", "c"].forEach(function (suit) {
      var f = g.foundations[suit];
      var wrap = document.createElement("div");
      wrap.className = "sc-pile sc-pile--found";
      wrap.appendChild(f.length ? CardsUI.cardEl(f[f.length - 1], true) : CardsUI.slotEl("", "Foundation " + CardsUI.SUIT[suit]));
      wrap.addEventListener("click", clickFound);
      topEl.appendChild(wrap);
    });
    var sp = document.createElement("div");
    sp.className = "fc-spacer";
    topEl.appendChild(sp);
    for (var i = 0; i < 4; i++) {
      (function (slot) {
        var wrap = document.createElement("div");
        wrap.className = "sc-pile sc-pile--free";
        if (g.free[slot]) wrap.appendChild(CardsUI.cardEl(g.free[slot], true));
        else wrap.appendChild(CardsUI.slotEl("", "Free cell"));
        if (sel && sel.kind === "free" && sel.slot === slot) wrap.firstChild.classList.add("is-selected");
        wrap.addEventListener("click", function () {
          clickFree(slot);
        });
        topEl.appendChild(wrap);
      })(i);
    }

    boardEl.innerHTML = "";
    for (var c = 0; c < 8; c++) {
      (function (col) {
        var pile = document.createElement("div");
        pile.className = "sc-col";
        var arr = g.tableau[col];
        if (!arr.length) {
          var sl = CardsUI.slotEl();
          pile.appendChild(sl);
        }
        for (var k = 0; k < arr.length; k++) {
          (function (idx) {
            var el = CardsUI.cardEl(arr[idx], true);
            el.style.top = idx * 22 + "px";
            if (sel && sel.kind === "col" && sel.col === col && idx >= sel.idx) el.classList.add("is-selected");
            el.addEventListener("click", function (e) {
              e.stopPropagation();
              clickColCard(col, idx);
            });
            el.addEventListener("dblclick", function (e) {
              e.stopPropagation();
              if (g.colToFound(col)) {
                sel = null;
                render();
              }
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
    statusEl.textContent = g.won
      ? "Solved! 🎉"
      : "Select a card or sequence, then click a destination. Double-click to send to a foundation.";
  }

  function clickColCard(col, idx) {
    if (sel && sel.kind === "col") {
      if (sel.col !== col && g.moveSeqToCol(sel.col, sel.idx, col)) {
        sel = null;
        render();
        return;
      }
      sel = null;
      render();
      return;
    }
    if (sel && sel.kind === "free") {
      g.freeToCol(sel.slot, col);
      sel = null;
      render();
      return;
    }
    if (g.sequenceLen(col, idx) > 0) {
      sel = { kind: "col", col: col, idx: idx };
      render();
    }
  }

  function clickCol(col) {
    if (sel && sel.kind === "col" && g.moveSeqToCol(sel.col, sel.idx, col)) sel = null;
    else if (sel && sel.kind === "free" && g.freeToCol(sel.slot, col)) sel = null;
    else sel = null;
    render();
  }

  function clickFree(slot) {
    if (sel && sel.kind === "col" && g.sequenceLen(sel.col, sel.idx) === 1 && g.cardToFree(sel.col)) {
      sel = null;
      render();
      return;
    }
    if (sel && sel.kind === "free") {
      sel = null;
      render();
      return;
    }
    if (g.free[slot]) {
      sel = { kind: "free", slot: slot };
      render();
      return;
    }
    sel = null;
    render();
  }

  function clickFound() {
    if (sel && sel.kind === "col" && g.colToFound(sel.col)) sel = null;
    else if (sel && sel.kind === "free" && g.freeToFound(sel.slot)) sel = null;
    else sel = null;
    render();
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
