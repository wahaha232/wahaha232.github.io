// ═══════════════════════════════════════════════════════════════
// Breakout — 遊戲引擎（純狀態/規則，固定邏輯畫布）
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  function Breakout() {
    this.width = 480;
    this.height = 360;
    this.reset();
  }

  Breakout.prototype.reset = function () {
    this.paddle = { x: this.width / 2 - 36, w: 72, h: 10, y: this.height - 24 };
    this.paddleDir = 0;
    this.ball = { x: this.width / 2, y: this.height - 40, r: 6, vx: 150, vy: -190, stuck: true };
    var cols = 8,
      rows = 5,
      pad = 40,
      bw = (this.width - 2 * pad) / cols,
      bh = 18,
      top = 50;
    this.bricks = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        this.bricks.push({ x: pad + c * bw, y: top + r * (bh + 6), w: bw - 6, h: bh, alive: true });
      }
    }
    this.score = 0;
    this.lives = 3;
    this.over = false;
    this.won = false;
  };

  Breakout.prototype.setPaddleDir = function (d) {
    this.paddleDir = d < 0 ? -1 : d > 0 ? 1 : 0;
  };

  Breakout.prototype.launch = function () {
    this.ball.stuck = false;
  };

  Breakout.prototype.update = function (dt) {
    if (this.over) return;
    if (dt > 0.05) dt = 0.05;

    this.paddle.x += this.paddleDir * 260 * dt;
    if (this.paddle.x < 0) this.paddle.x = 0;
    if (this.paddle.x > this.width - this.paddle.w) this.paddle.x = this.width - this.paddle.w;

    var b = this.ball;
    if (b.stuck) {
      b.x = this.paddle.x + this.paddle.w / 2;
      b.y = this.paddle.y - b.r - 1;
      return;
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx); }
    if (b.x + b.r > this.width) { b.x = this.width - b.r; b.vx = -Math.abs(b.vx); }
    if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }

    if (
      b.vy > 0 &&
      b.y + b.r >= this.paddle.y &&
      b.y - b.r <= this.paddle.y + this.paddle.h &&
      b.x >= this.paddle.x &&
      b.x <= this.paddle.x + this.paddle.w
    ) {
      b.y = this.paddle.y - b.r;
      b.vy = -Math.abs(b.vy);
      var hit = (b.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
      b.vx = hit * 220;
    }

    for (var i = 0; i < this.bricks.length; i++) {
      var k = this.bricks[i];
      if (!k.alive) continue;
      if (b.x + b.r > k.x && b.x - b.r < k.x + k.w && b.y + b.r > k.y && b.y - b.r < k.y + k.h) {
        k.alive = false;
        this.score += 10;
        b.vy = -b.vy;
        break;
      }
    }

    if (!this.bricks.some(function (brick) { return brick.alive; })) {
      this.won = true;
      this.over = true;
      return;
    }

    if (b.y - b.r > this.height) {
      this.lives--;
      if (this.lives <= 0) {
        this.over = true;
      } else {
        b.stuck = true;
        b.vx = 150;
        b.vy = -190;
      }
    }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Breakout;
  global.Breakout = Breakout;
})(typeof window !== "undefined" ? window : globalThis);
