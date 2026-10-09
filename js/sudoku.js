// ═══════════════════════════════════════════════════════════════
// Sudoku — 遊戲引擎（純狀態/規則，與 DOM 分離）
// 以隨機回溯產生合法終盤，再依難度挖空。棋盤為 81 格扁平陣列（0 = 空）。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  function Sudoku(difficulty) {
    this.difficulty = difficulty || "easy";
    this.reset();
  }

  Sudoku.prototype.reset = function () {
    this.solution = this._generate();
    this.puzzle = this.solution.slice();
    this._dig();
    this.board = this.puzzle.slice();
    this.won = false;
  };

  Sudoku.prototype._perm = function (a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  };

  Sudoku.prototype._valid = function (board, idx, val) {
    var r = Math.floor(idx / 9),
      c = idx % 9,
      i;
    for (i = 0; i < 9; i++) {
      if (board[r * 9 + i] === val) return false;
      if (board[i * 9 + c] === val) return false;
    }
    var br = Math.floor(r / 3) * 3,
      bc = Math.floor(c / 3) * 3;
    for (var rr = 0; rr < 3; rr++) {
      for (var cc = 0; cc < 3; cc++) if (board[(br + rr) * 9 + (bc + cc)] === val) return false;
    }
    return true;
  };

  Sudoku.prototype._fill = function (board) {
    var idx = board.indexOf(0);
    if (idx === -1) return true;
    var nums = this._perm([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (var k = 0; k < 9; k++) {
      if (this._valid(board, idx, nums[k])) {
        board[idx] = nums[k];
        if (this._fill(board)) return true;
        board[idx] = 0;
      }
    }
    return false;
  };

  Sudoku.prototype._generate = function () {
    var b = new Array(81);
    for (var i = 0; i < 81; i++) b[i] = 0;
    this._fill(b);
    return b;
  };

  Sudoku.prototype._dig = function () {
    var counts = { easy: 38, medium: 46, hard: 54 };
    var remove = counts[this.difficulty] || 44;
    var order = [];
    for (var i = 0; i < 81; i++) order.push(i);
    this._perm(order);
    for (var k = 0; k < remove; k++) this.puzzle[order[k]] = 0;
  };

  Sudoku.prototype.isGiven = function (idx) {
    return this.puzzle[idx] !== 0;
  };

  Sudoku.prototype.set = function (idx, val) {
    if (this.isGiven(idx)) return false;
    this.board[idx] = val;
    this.won = this.isSolved();
    return true;
  };

  Sudoku.prototype.clear = function (idx) {
    if (this.isGiven(idx)) return false;
    this.board[idx] = 0;
    return true;
  };

  Sudoku.prototype.conflict = function (idx) {
    var v = this.board[idx];
    if (!v) return false;
    var tmp = this.board[idx];
    this.board[idx] = 0;
    var ok = this._valid(this.board, idx, v);
    this.board[idx] = tmp;
    return !ok;
  };

  Sudoku.prototype.isSolved = function () {
    for (var i = 0; i < 81; i++) {
      var v = this.board[i];
      if (!v) return false;
      var tmp = this.board[i];
      this.board[i] = 0;
      var ok = this._valid(this.board, i, v);
      this.board[i] = tmp;
      if (!ok) return false;
    }
    return true;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Sudoku;
  global.Sudoku = Sudoku;
})(typeof window !== "undefined" ? window : globalThis);
