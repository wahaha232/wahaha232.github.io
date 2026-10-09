// ═══════════════════════════════════════════════════════════════
// Puzzle Games — 數值滑動拼圖（2048 玩法）遊戲引擎
// 與 UI 完全分離：此檔只處理盤面狀態與規則邏輯。
// 支援：盤面/分數、四方向移動與合併、隨機產生新方塊、
//       盤面可動判斷、勝利(2048)/結束判定。原創實作。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  var DIRS = ["left", "right", "up", "down"];

  function Puzzle(size) {
    this.size = size || 4;
    this.reset();
  }

  Puzzle.prototype.reset = function () {
    this.board = [];
    var n = this.size * this.size;
    for (var i = 0; i < n; i++) this.board.push(0);
    this.score = 0;
    this.won = false;
    this.over = false;
    this.addRandomTile();
    this.addRandomTile();
    this.updateStatus();
  };

  Puzzle.prototype.empty = function () {
    var out = [];
    for (var i = 0; i < this.board.length; i++) if (this.board[i] === 0) out.push(i);
    return out;
  };

  Puzzle.prototype.addRandomTile = function () {
    var e = this.empty();
    if (!e.length) return -1;
    var i = e[Math.floor(Math.random() * e.length)];
    this.board[i] = Math.random() < 0.9 ? 2 : 4;
    return i;
  };

  Puzzle.prototype.canMove = function () {
    if (this.empty().length) return true;
    var s = this.size,
      b = this.board;
    for (var r = 0; r < s; r++) {
      for (var c = 0; c < s; c++) {
        var v = b[r * s + c];
        if (c + 1 < s && b[r * s + c + 1] === v) return true;
        if (r + 1 < s && b[(r + 1) * s + c] === v) return true;
      }
    }
    return false;
  };

  Puzzle.prototype.updateStatus = function () {
    this.over = !this.canMove();
  };

  Puzzle.prototype.move = function (dir) {
    if (DIRS.indexOf(dir) === -1) return { moved: false, gained: 0 };
    var s = this.size,
      self = this,
      gained = 0,
      changed = false;

    function cell(k, i) {
      if (dir === "left") return { r: k, c: i };
      if (dir === "right") return { r: k, c: s - 1 - i };
      if (dir === "up") return { r: i, c: k };
      return { r: s - 1 - i, c: k }; // down
    }

    for (var k = 0; k < s; k++) {
      var line = [];
      for (var i = 0; i < s; i++) {
        var p = cell(k, i);
        line.push(self.board[p.r * s + p.c]);
      }

      var arr = [];
      for (var j = 0; j < line.length; j++) if (line[j] !== 0) arr.push(line[j]);

      var out = [];
      for (var m = 0; m < arr.length; m++) {
        if (m + 1 < arr.length && arr[m] === arr[m + 1]) {
          var merged = arr[m] * 2;
          out.push(merged);
          gained += merged;
          if (merged === 2048) self.won = true;
          m++;
        } else {
          out.push(arr[m]);
        }
      }
      while (out.length < s) out.push(0);

      for (var q = 0; q < s; q++) {
        if (line[q] !== out[q]) changed = true;
        var cp = cell(k, q);
        self.board[cp.r * s + cp.c] = out[q];
      }
    }

    if (changed) {
      this.score += gained;
      this.addRandomTile();
      this.updateStatus();
    }
    return { moved: changed, gained: gained };
  };

  // 支援 Node（測試用）與瀏覽器
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Puzzle;
  }
  global.Puzzle = Puzzle;
})(typeof window !== "undefined" ? window : globalThis);
