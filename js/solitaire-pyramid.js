// ═══════════════════════════════════════════════════════════════
// Pyramid Solitaire — 遊戲引擎
// 28 張金字塔 + 24 張牌堆；兩張合計 13 可消，K 單張消。
// 只有「未被覆蓋」的牌可取用；牌堆僅能與金字塔最上層牌配對。
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

  function Pyramid() {
    this.rowStart = [0, 1, 3, 6, 10, 15, 21];
    this.reset();
  }

  Pyramid.prototype.reset = function () {
    var deck = shuffle(makeDeck());
    this.pyramid = []; // 28 張，row-major
    for (var i = 0; i < 28; i++) this.pyramid.push({ card: deck.pop(), removed: false });
    this.stock = deck; // 24 張
    this.waste = [];
    this.moves = 0;
    this.won = false;
  };

  Pyramid.prototype.rowOf = function (idx) {
    for (var r = 6; r >= 0; r--) if (idx >= this.rowStart[r]) return r;
    return 0;
  };

  Pyramid.prototype.isFree = function (idx) {
    var cell = this.pyramid[idx];
    if (!cell || cell.removed) return false;
    var r = this.rowOf(idx);
    if (r >= 6) return true;
    var pos = idx - this.rowStart[r];
    var cs = this.rowStart[r + 1];
    return this.pyramid[cs + pos].removed && this.pyramid[cs + pos + 1].removed;
  };

  Pyramid.prototype.wasteTop = function () {
    return this.waste.length ? this.waste[this.waste.length - 1] : null;
  };

  Pyramid.prototype.draw = function () {
    if (!this.stock.length) return false;
    this.waste.push(this.stock.pop());
    this.moves++;
    return true;
  };

  Pyramid.prototype.check = function () {
    this.won = this.pyramid.every(function (c) {
      return c.removed;
    });
  };

  Pyramid.prototype.removePair = function (aIdx, bIdx) {
    if (aIdx === bIdx) return false;
    if (!this.isFree(aIdx) || !this.isFree(bIdx)) return false;
    if (this.pyramid[aIdx].card.rank + this.pyramid[bIdx].card.rank !== 13) return false;
    this.pyramid[aIdx].removed = true;
    this.pyramid[bIdx].removed = true;
    this.moves++;
    this.check();
    return true;
  };

  Pyramid.prototype.removeKing = function (idx) {
    if (!this.isFree(idx) || this.pyramid[idx].card.rank !== 13) return false;
    this.pyramid[idx].removed = true;
    this.moves++;
    this.check();
    return true;
  };

  Pyramid.prototype.removeWithWaste = function (pIdx) {
    var w = this.wasteTop();
    if (!w || !this.isFree(pIdx)) return false;
    if (w.rank + this.pyramid[pIdx].card.rank !== 13) return false;
    this.pyramid[pIdx].removed = true;
    this.waste.pop();
    this.moves++;
    this.check();
    return true;
  };

  Pyramid.prototype.removeKingWaste = function () {
    var w = this.wasteTop();
    if (!w || w.rank !== 13) return false;
    this.waste.pop();
    this.moves++;
    this.check();
    return true;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Pyramid;
  global.Pyramid = Pyramid;
})(typeof window !== "undefined" ? window : globalThis);
