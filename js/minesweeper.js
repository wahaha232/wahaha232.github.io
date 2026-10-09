// ═══════════════════════════════════════════════════════════════
// Minesweeper — 遊戲引擎（純狀態/規則，與 DOM 分離）
// 首次翻開保證安全（炸彈在第一次點擊後才配置）。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  function Minesweeper(rows, cols, mines) {
    this.rows = rows || 9;
    this.cols = cols || 9;
    this.mines = mines || 10;
    this.reset();
  }

  Minesweeper.prototype.reset = function () {
    var n = this.rows * this.cols;
    this.cells = [];
    for (var i = 0; i < n; i++) this.cells.push({ mine: false, revealed: false, flagged: false, adj: 0 });
    this.state = "playing";
    this.revealedCount = 0;
    this.flags = 0;
    this.minesPlaced = false;
    this.lastRevealed = null;
  };

  Minesweeper.prototype.idx = function (r, c) {
    return r * this.cols + c;
  };

  Minesweeper.prototype.inBounds = function (r, c) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  };

  Minesweeper.prototype.neighbors = function (r, c) {
    var out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        if (this.inBounds(r + dr, c + dc)) out.push([r + dr, c + dc]);
      }
    }
    return out;
  };

  Minesweeper.prototype.placeMines = function (safeR, safeC) {
    var n = this.rows * this.cols,
      safe = {};
    safe[this.idx(safeR, safeC)] = true;
    var nb = this.neighbors(safeR, safeC);
    for (var i = 0; i < nb.length; i++) safe[this.idx(nb[i][0], nb[i][1])] = true;

    var pool = [];
    for (var j = 0; j < n; j++) if (!safe[j]) pool.push(j);
    for (var k = pool.length - 1; k > 0; k--) {
      var m = Math.floor(Math.random() * (k + 1));
      var t = pool[k];
      pool[k] = pool[m];
      pool[m] = t;
    }
    for (var x = 0; x < this.mines && x < pool.length; x++) this.cells[pool[x]].mine = true;

    for (var p = 0; p < n; p++) {
      if (this.cells[p].mine) continue;
      var r = Math.floor(p / this.cols),
        c = p % this.cols,
        cnt = 0,
        nbs = this.neighbors(r, c);
      for (var q = 0; q < nbs.length; q++) if (this.cells[this.idx(nbs[q][0], nbs[q][1])].mine) cnt++;
      this.cells[p].adj = cnt;
    }
    this.minesPlaced = true;
  };

  Minesweeper.prototype.reveal = function (r, c) {
    if (this.state !== "playing") return;
    var i = this.idx(r, c);
    if (this.cells[i].flagged || this.cells[i].revealed) return;
    if (!this.minesPlaced) this.placeMines(r, c);

    if (this.cells[i].mine) {
      this.cells[i].revealed = true;
      this.state = "lost";
      return;
    }

    var self = this,
      stack = [[r, c]];
    while (stack.length) {
      var cur = stack.pop();
      var p = self.idx(cur[0], cur[1]);
      if (self.cells[p].revealed || self.cells[p].flagged) continue;
      self.cells[p].revealed = true;
      self.revealedCount++;
      if (self.cells[p].adj === 0) {
        var nbs = self.neighbors(cur[0], cur[1]);
        for (var z = 0; z < nbs.length; z++) stack.push(nbs[z]);
      }
    }
    this.lastRevealed = [r, c];
    if (this.revealedCount === this.rows * this.cols - this.mines) this.state = "won";
  };

  Minesweeper.prototype.toggleFlag = function (r, c) {
    if (this.state !== "playing") return;
    var i = this.idx(r, c);
    if (this.cells[i].revealed) return;
    this.cells[i].flagged = !this.cells[i].flagged;
    this.flags += this.cells[i].flagged ? 1 : -1;
  };

  Minesweeper.prototype.minesLeft = function () {
    return this.mines - this.flags;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Minesweeper;
  global.Minesweeper = Minesweeper;
})(typeof window !== "undefined" ? window : globalThis);
