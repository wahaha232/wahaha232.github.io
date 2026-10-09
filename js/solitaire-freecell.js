// ═══════════════════════════════════════════════════════════════
// FreeCell — 遊戲引擎（純狀態/規則，與 DOM 分離）
// 8 疊牌桌、4 個自由格、4 個基礎堆；全牌可見。
// 可搬移「遞減且紅黑交錯」的序列，長度受自由格/空疊數限制。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  var SUITS = ["s", "h", "d", "c"];

  function makeDeck() {
    var d = [];
    for (var i = 0; i < 4; i++) {
      for (var r = 1; r <= 13; r++) d.push({ suit: SUITS[i], rank: r, faceUp: true });
    }
    return d;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }
  function isRed(c) {
    return c.suit === "h" || c.suit === "d";
  }

  function FreeCell() {
    this.reset();
  }

  FreeCell.prototype.reset = function () {
    var deck = shuffle(makeDeck());
    this.tableau = [[], [], [], [], [], [], [], []];
    var self = this;
    deck.forEach(function (c, i) {
      self.tableau[i % 8].push(c);
    });
    this.free = [null, null, null, null];
    this.foundations = { s: [], h: [], d: [], c: [] };
    this.moves = 0;
    this.won = false;
  };

  FreeCell.prototype.sequenceLen = function (col, idx) {
    var pile = this.tableau[col];
    if (idx < 0 || idx >= pile.length) return 0;
    for (var i = idx; i < pile.length - 1; i++) {
      if (pile[i].rank !== pile[i + 1].rank + 1) return 0;
      if (isRed(pile[i]) === isRed(pile[i + 1])) return 0;
    }
    return pile.length - idx;
  };

  FreeCell.prototype.maxMove = function () {
    var free = 0;
    for (var i = 0; i < 4; i++) if (!this.free[i]) free++;
    var empty = 0;
    for (var c = 0; c < 8; c++) if (this.tableau[c].length === 0) empty++;
    return (free + 1) * Math.pow(2, empty);
  };

  FreeCell.prototype.canStack = function (card, toCol) {
    var pile = this.tableau[toCol];
    if (!pile.length) return true;
    var top = pile[pile.length - 1];
    return top.rank === card.rank + 1 && isRed(top) !== isRed(card);
  };

  FreeCell.prototype.canFound = function (card) {
    var f = this.foundations[card.suit];
    if (!f.length) return card.rank === 1;
    return f[f.length - 1].rank === card.rank - 1;
  };

  FreeCell.prototype.checkWin = function () {
    var t = 0;
    for (var s in this.foundations) t += this.foundations[s].length;
    this.won = t === 52;
  };

  FreeCell.prototype.moveSeqToCol = function (fromCol, idx, toCol) {
    if (fromCol === toCol) return false;
    var len = this.sequenceLen(fromCol, idx);
    if (!len || len > this.maxMove()) return false;
    if (!this.canStack(this.tableau[fromCol][idx], toCol)) return false;
    var moved = this.tableau[fromCol].splice(idx, len);
    this.tableau[toCol] = this.tableau[toCol].concat(moved);
    this.moves++;
    return true;
  };

  FreeCell.prototype.cardToFree = function (fromCol) {
    var pile = this.tableau[fromCol];
    if (!pile.length) return false;
    var slot = this.free.indexOf(null);
    if (slot < 0) return false;
    this.free[slot] = pile.pop();
    this.moves++;
    return true;
  };

  FreeCell.prototype.freeToCol = function (slot, toCol) {
    var card = this.free[slot];
    if (!card || !this.canStack(card, toCol)) return false;
    this.free[slot] = null;
    this.tableau[toCol].push(card);
    this.moves++;
    return true;
  };

  FreeCell.prototype.freeToFound = function (slot) {
    var card = this.free[slot];
    if (!card || !this.canFound(card)) return false;
    this.foundations[card.suit].push(card);
    this.free[slot] = null;
    this.moves++;
    this.checkWin();
    return true;
  };

  FreeCell.prototype.colToFound = function (col) {
    var pile = this.tableau[col];
    if (!pile.length) return false;
    var card = pile[pile.length - 1];
    if (!this.canFound(card)) return false;
    pile.pop();
    this.foundations[card.suit].push(card);
    this.moves++;
    this.checkWin();
    return true;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = FreeCell;
  global.FreeCell = FreeCell;
})(typeof window !== "undefined" ? window : globalThis);
