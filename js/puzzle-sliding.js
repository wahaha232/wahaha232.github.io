// ═══════════════════════════════════════════════════════════════
// Sliding Puzzle（15-puzzle）— 遊戲引擎（純狀態/規則）
// 盤面為扁平陣列：1..N*N-1 為數字磚，0 為空格。
// 打亂以「隨機合法移動」方式進行，保證一定有解。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  function Sliding(size) {
    this.size = size || 4;
    this.reset();
  }

  Sliding.prototype.reset = function () {
    var n = this.size * this.size;
    this.board = [];
    for (var i = 1; i < n; i++) this.board.push(i);
    this.board.push(0); // 空格在右下角
    this.moves = 0;
    this.shuffle();
  };

  Sliding.prototype.blankIndex = function () {
    return this.board.indexOf(0);
  };

  Sliding.prototype.neighbors = function (idx) {
    var s = this.size,
      r = Math.floor(idx / s),
      c = idx % s,
      out = [];
    if (r > 0) out.push(idx - s);
    if (r < s - 1) out.push(idx + s);
    if (c > 0) out.push(idx - 1);
    if (c < s - 1) out.push(idx + 1);
    return out;
  };

  Sliding.prototype.shuffle = function () {
    var times = 40 * this.size * this.size;
    for (var k = 0; k < times; k++) {
      var nb = this.neighbors(this.blankIndex());
      this.swap(nb[Math.floor(Math.random() * nb.length)]);
    }
    this.moves = 0;
    if (this.isSolved()) this.shuffle();
  };

  Sliding.prototype.swap = function (idx) {
    var b = this.blankIndex();
    var t = this.board[idx];
    this.board[idx] = this.board[b];
    this.board[b] = t;
  };

  Sliding.prototype.moveIndex = function (idx) {
    if (this.neighbors(this.blankIndex()).indexOf(idx) === -1) return false;
    this.swap(idx);
    this.moves++;
    return true;
  };

  Sliding.prototype.moveDir = function (dir) {
    var s = this.size,
      b = this.blankIndex(),
      r = Math.floor(b / s),
      c = b % s,
      target = -1;
    if (dir === "up" && r < s - 1) target = b + s;
    else if (dir === "down" && r > 0) target = b - s;
    else if (dir === "left" && c < s - 1) target = b + 1;
    else if (dir === "right" && c > 0) target = b - 1;
    if (target < 0) return false;
    return this.moveIndex(target);
  };

  Sliding.prototype.isSolved = function () {
    var n = this.size * this.size;
    for (var i = 0; i < n - 1; i++) if (this.board[i] !== i + 1) return false;
    return this.board[n - 1] === 0;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Sliding;
  global.Sliding = Sliding;
})(typeof window !== "undefined" ? window : globalThis);
