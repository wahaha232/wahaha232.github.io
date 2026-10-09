// ═══════════════════════════════════════════════════════════════
// Spider Solitaire — 遊戲引擎（雙牌組 104 張、10 疊）
// 可搬移同花連續遞減的序列；湊成同花 K→A 13 張即自動收走。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  var SUITS = ["s", "h", "d", "c"];

  function makeDeck() {
    var d = [];
    for (var k = 0; k < 2; k++) {
      for (var i = 0; i < 4; i++) {
        for (var r = 1; r <= 13; r++) d.push({ suit: SUITS[i], rank: r, faceUp: false });
      }
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

  function Spider() {
    this.reset();
  }

  Spider.prototype.reset = function () {
    var deck = shuffle(makeDeck());
    this.tableau = [];
    for (var c = 0; c < 10; c++) {
      var n = c < 4 ? 6 : 5;
      var col = [];
      for (var i = 0; i < n; i++) col.push(deck.pop());
      col[col.length - 1].faceUp = true;
      this.tableau.push(col);
    }
    this.stock = deck; // 50 張（5 次發牌）
    this.completed = 0;
    this.moves = 0;
    this.won = false;
  };

  Spider.prototype.sameSuitRun = function (col, idx) {
    var pile = this.tableau[col];
    if (idx < 0 || idx >= pile.length || !pile[idx].faceUp) return 0;
    for (var i = idx; i < pile.length - 1; i++) {
      if (!pile[i].faceUp || !pile[i + 1].faceUp) return 0;
      if (pile[i].suit !== pile[i + 1].suit) return 0;
      if (pile[i].rank !== pile[i + 1].rank + 1) return 0;
    }
    return pile.length - idx;
  };

  Spider.prototype.canPlace = function (card, toCol) {
    var pile = this.tableau[toCol];
    if (!pile.length) return true;
    return pile[pile.length - 1].rank === card.rank + 1;
  };

  Spider.prototype.flipTop = function (col) {
    var pile = this.tableau[col];
    if (pile.length && !pile[pile.length - 1].faceUp) pile[pile.length - 1].faceUp = true;
  };

  Spider.prototype.removeCompleted = function () {
    for (var c = 0; c < 10; c++) {
      var pile = this.tableau[c];
      if (pile.length < 13) continue;
      var suit = pile[pile.length - 1].suit;
      var ok = true;
      for (var j = 0; j < 13; j++) {
        var card = pile[pile.length - 13 + j];
        if (!card.faceUp || card.suit !== suit || card.rank !== 13 - j) {
          ok = false;
          break;
        }
      }
      if (ok) {
        pile.splice(pile.length - 13, 13);
        this.completed++;
        this.flipTop(c);
      }
    }
    if (this.completed >= 8) this.won = true;
  };

  Spider.prototype.moveRun = function (from, idx, to) {
    if (from === to) return false;
    var len = this.sameSuitRun(from, idx);
    if (!len) return false;
    if (!this.canPlace(this.tableau[from][idx], to)) return false;
    var moved = this.tableau[from].splice(idx, len);
    this.tableau[to] = this.tableau[to].concat(moved);
    this.flipTop(from);
    this.moves++;
    this.removeCompleted();
    return true;
  };

  Spider.prototype.dealStock = function () {
    if (this.stock.length < 10) return false;
    for (var c = 0; c < 10; c++) {
      var card = this.stock.pop();
      card.faceUp = true;
      this.tableau[c].push(card);
    }
    this.moves++;
    this.removeCompleted();
    return true;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Spider;
  global.Spider = Spider;
})(typeof window !== "undefined" ? window : globalThis);
