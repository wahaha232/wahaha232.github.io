// ═══════════════════════════════════════════════════════════════
// Pong — 遊戲引擎（純狀態/規則，固定邏輯畫布，對戰簡單 AI）
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  function Pong() {
    this.width = 480;
    this.height = 320;
    this.winningScore = 5;
    this.reset();
  }

  Pong.prototype.reset = function () {
    this.player = { x: 12, y: this.height / 2 - 30, w: 10, h: 60 };
    this.playerDir = 0;
    this.ai = { x: this.width - 22, y: this.height / 2 - 30, w: 10, h: 60 };
    this.ball = { x: this.width / 2, y: this.height / 2, vx: 180, vy: 90, r: 6 };
    this.playerScore = 0;
    this.aiScore = 0;
    this.over = false;
    this.winner = null;
  };

  Pong.prototype.setPlayerDir = function (d) {
    this.playerDir = d < 0 ? -1 : d > 0 ? 1 : 0;
  };

  Pong.prototype.serve = function (dir) {
    this.ball.x = this.width / 2;
    this.ball.y = this.height / 2;
    this.ball.vx = dir * 180;
    this.ball.vy = Math.random() * 120 - 60;
  };

  Pong.prototype.update = function (dt) {
    if (this.over) return;
    if (dt > 0.05) dt = 0.05;

    this.player.y += this.playerDir * 300 * dt;
    if (this.player.y < 0) this.player.y = 0;
    if (this.player.y > this.height - this.player.h) this.player.y = this.height - this.player.h;

    var target = this.ball.y - this.ai.h / 2,
      aiSpeed = 210;
    if (this.ai.y < target) this.ai.y = Math.min(this.ai.y + aiSpeed * dt, target);
    else this.ai.y = Math.max(this.ai.y - aiSpeed * dt, target);
    if (this.ai.y < 0) this.ai.y = 0;
    if (this.ai.y > this.height - this.ai.h) this.ai.y = this.height - this.ai.h;

    var b = this.ball;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy); }
    if (b.y + b.r > this.height) { b.y = this.height - b.r; b.vy = -Math.abs(b.vy); }

    if (
      b.vx < 0 &&
      b.x - b.r <= this.player.x + this.player.w &&
      b.x + b.r >= this.player.x &&
      b.y >= this.player.y &&
      b.y <= this.player.y + this.player.h
    ) {
      b.x = this.player.x + this.player.w + b.r;
      b.vx = Math.abs(b.vx);
      b.vy += (b.y - (this.player.y + this.player.h / 2)) * 2.2;
      b.vy = Math.max(-260, Math.min(260, b.vy));
    }

    if (
      b.vx > 0 &&
      b.x + b.r >= this.ai.x &&
      b.x - b.r <= this.ai.x + this.ai.w &&
      b.y >= this.ai.y &&
      b.y <= this.ai.y + this.ai.h
    ) {
      b.x = this.ai.x - b.r;
      b.vx = -Math.abs(b.vx);
      b.vy += (b.y - (this.ai.y + this.ai.h / 2)) * 2.2;
      b.vy = Math.max(-260, Math.min(260, b.vy));
    }

    if (b.x < -10) {
      this.aiScore++;
      this.serve(-1);
    } else if (b.x > this.width + 10) {
      this.playerScore++;
      this.serve(1);
    }

    if (this.playerScore >= this.winningScore) {
      this.over = true;
      this.winner = "player";
    } else if (this.aiScore >= this.winningScore) {
      this.over = true;
      this.winner = "ai";
    }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Pong;
  global.Pong = Pong;
})(typeof window !== "undefined" ? window : globalThis);
