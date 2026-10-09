// ═══════════════════════════════════════════════════════════════
// Shared playing-card DOM helpers for the Solitaire family
// (Klondike/FreeCell/Spider/Pyramid/TriPeaks). No game rules here.
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  var SUIT = { s: "♠", h: "♥", d: "♦", c: "♣" };
  var RANK = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  var CardsUI = {
    SUIT: SUIT,
    RANK: RANK,
    isRed: function (suit) {
      return suit === "h" || suit === "d";
    },
    label: function (card) {
      return RANK[card.rank] + SUIT[card.suit];
    },
    // 產生一張牌的 DOM 元素
    cardEl: function (card, faceUp) {
      var el = document.createElement("div");
      el.className =
        "sc-card" +
        (faceUp ? "" : " sc-card--down") +
        (faceUp && this.isRed(card.suit) ? " sc-card--red" : "");
      if (faceUp) {
        el.innerHTML =
          '<span class="sc-card__rank">' + RANK[card.rank] + "</span>" +
          '<span class="sc-card__suit">' + SUIT[card.suit] + "</span>";
      } else {
        el.innerHTML = '<span class="sc-card__back" aria-hidden="true"></span>';
      }
      return el;
    },
    // 空的牌位元素
    slotEl: function (extraClass, label) {
      var el = document.createElement("div");
      el.className = "sc-slot" + (extraClass ? " " + extraClass : "");
      if (label) el.setAttribute("aria-label", label);
      return el;
    }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = CardsUI;
  global.CardsUI = CardsUI;
})(typeof window !== "undefined" ? window : globalThis);
