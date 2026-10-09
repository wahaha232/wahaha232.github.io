// ═══════════════════════════════════════════════════════════════
// TriPeaks Solitaire — 遊戲引擎
// 28 張排成三個山峰（列 3/6/9/10，底列相鄰峰共用）+ 24 張牌堆。
// 點與廢牌堆頂點數相差 1（A 與 K 相通）的可取用牌即可消去。
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

  function TriPeaks() {
    // 每張牌被哪些「下方」牌覆蓋（全部覆蓋者都被消去才可取用）
    this.coveredBy = [
      [3, 4], [5, 6], [7, 8],
      [9, 10], [10, 11], [12, 13], [13, 14], [15, 16], [16, 17],
      [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 24], [24, 25], [25, 26], [26, 27],
      [], [], [], [], [], [], [], [], [], []
    ];
    this.reset();
  }

  TriPeaks.prototype.reset = function () {
    var deck = shuffle(makeDeck());
    this.layout = [];
    for (var i = 0; i < 28; i++) this.layout.push({ card: deck.pop(), removed: false });
    this.stock = deck; // 24
    this.waste = [];
    this.moves = 0;
    this.won = false;
  };

  TriPeaks.prototype.exposed = function (idx) {
    if (!this.layout[idx] || this.layout[idx].removed) return false;
    var cov = this.coveredBy[idx];
    for (var i = 0; i < cov.length; i++) if (!this.layout[cov[i]].removed) return false;
    return true;
  };

  TriPeaks.prototype.adjacent = function (a, b) {
    var d = Math.abs(a - b);
    return d === 1 || d === 12; // A(1) 與 K(13) 相通
  };

  TriPeaks.prototype.wasteTop = function () {
    return this.waste.length ? this.waste[this.waste.length - 1] : null;
  };

  TriPeaks.prototype.start = function () {
    if (!this.waste.length) this.draw();
  };

  TriPeaks.prototype.draw = function () {
    if (!this.stock.length) return false;
    this.waste.push(this.stock.pop());
    this.moves++;
    return true;
  };

  TriPeaks.prototype.play = function (idx) {
    var w = this.wasteTop();
    if (!w || !this.exposed(idx)) return false;
    if (!this.adjacent(w.rank, this.layout[idx].card.rank)) return false;
    this.layout[idx].removed = true;
    this.waste.push(this.layout[idx].card);
    this.moves++;
    this.won = this.layout.every(function (c) {
      return c.removed;
    });
    return true;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = TriPeaks;
  global.TriPeaks = TriPeaks;
})(typeof window !== "undefined" ? window : globalThis);
