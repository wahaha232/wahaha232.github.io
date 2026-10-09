// ═══════════════════════════════════════════════════════════════
// Space Invaders — 遊戲引擎（純狀態/規則，與 DOM 完全分離）
// 座標系：固定邏輯畫布 width×height，UI 負責縮放繪製。
// 支援：玩家左右移動、發射、外星人整隊左右移動+下移、
//       外星人隨機射擊、碰撞偵測、分數、生命、勝負判定。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  function SpaceInvaders() {
    this.width = 480;
    this.height = 360;
    this.reset();
  }

  SpaceInvaders.prototype.reset = function () {
    var w = this.width,
      h = this.height;

    this.player = { x: w / 2 - 16, y: h - 30, w: 32, h: 14 };
    this.playerDir = 0;
    this.playerBullets = [];
    this.alienBullets = [];
    this.aliens = [];

    var cols = 8,
      rows = 4,
      aw = 26,
      ah = 18,
      gapx = 12,
      gapy = 12,
      startX = 48,
      startY = 44;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        this.aliens.push({
          x: startX + c * (aw + gapx),
          y: startY + r * (ah + gapy),
          w: aw,
          h: ah,
          alive: true
        });
      }
    }
    this.totalAliens = this.aliens.length;
    this.alienDir = 1;
    this.alienStepEvery = 0.6; // 秒：每步間隔（隨剩餘數量加快）
    this.alienTick = 0;
    this.alienFireTimer = 1.2;
    this.alienBulletSpeed = 150;
    this.bulletSpeed = 300;
    this.playerSpeed = 220;
    this.playerCooldown = 0;
    this.score = 0;
    this.lives = 3;
    this.over = false;
    this.won = false;
  };

  SpaceInvaders.prototype.setPlayerDir = function (dir) {
    this.playerDir = dir < 0 ? -1 : dir > 0 ? 1 : 0;
  };

  SpaceInvaders.prototype.aliveAliens = function () {
    return this.aliens.filter(function (a) {
      return a.alive;
    });
  };

  SpaceInvaders.prototype.fire = function () {
    if (this.over || this.playerCooldown > 0 || this.playerBullets.length >= 1) return false;
    this.playerBullets.push({ x: this.player.x + this.player.w / 2, y: this.player.y });
    this.playerCooldown = 0.25;
    return true;
  };

  SpaceInvaders.prototype.stepAliens = function () {
    var alive = this.aliveAliens();
    if (!alive.length) return;

    var step = 12,
      minX = Infinity,
      maxX = -Infinity;
    alive.forEach(function (a) {
      if (a.x < minX) minX = a.x;
      if (a.x + a.w > maxX) maxX = a.x + a.w;
    });

    var nx = this.alienDir * step;
    if (minX + nx < 6 || maxX + nx > this.width - 6) {
      this.alienDir *= -1;
      alive.forEach(function (a) {
        a.y += 16;
      });
    } else {
      alive.forEach(function (a) {
        a.x += nx;
      });
    }

    var playerY = this.player.y;
    if (alive.some(function (a) { return a.y + a.h >= playerY; })) {
      this.lives = 0;
      this.over = true;
      return;
    }

    this.alienStepEvery = Math.max(0.12, 0.6 * (alive.length / this.totalAliens));
  };

  SpaceInvaders.prototype.checkCollisions = function () {
    var self = this;

    // 玩家子彈 vs 外星人（點對矩形）
    this.playerBullets.forEach(function (b) {
      self.aliens.forEach(function (a) {
        if (a.alive && b.x >= a.x && b.x <= a.x + a.w && b.y <= a.y + a.h && b.y >= a.y - 4) {
          a.alive = false;
          self.score += 10;
          b.dead = true;
        }
      });
    });
    this.playerBullets = this.playerBullets.filter(function (b) {
      return !b.dead;
    });

    // 外星人子彈 vs 玩家
    this.alienBullets.forEach(function (b) {
      if (
        b.x >= self.player.x &&
        b.x <= self.player.x + self.player.w &&
        b.y >= self.player.y &&
        b.y <= self.player.y + self.player.h
      ) {
        b.dead = true;
        self.hitPlayer();
      }
    });
    this.alienBullets = this.alienBullets.filter(function (b) {
      return !b.dead;
    });
  };

  SpaceInvaders.prototype.hitPlayer = function () {
    this.lives -= 1;
    if (this.lives <= 0) {
      this.lives = 0;
      this.over = true;
    } else {
      this.player.x = this.width / 2 - this.player.w / 2;
    }
  };

  SpaceInvaders.prototype.update = function (dt) {
    if (this.over) return;
    var self = this;
    if (dt > 0.05) dt = 0.05;

    if (this.playerCooldown > 0) this.playerCooldown -= dt;

    // 玩家移動
    this.player.x += this.playerDir * this.playerSpeed * dt;
    if (this.player.x < 0) this.player.x = 0;
    if (this.player.x > this.width - this.player.w) this.player.x = this.width - this.player.w;

    // 玩家子彈
    this.playerBullets.forEach(function (b) {
      b.y -= self.bulletSpeed * dt;
    });
    this.playerBullets = this.playerBullets.filter(function (b) {
      return b.y > -6;
    });

    // 外星人整隊移動
    this.alienTick += dt;
    if (this.alienTick >= this.alienStepEvery) {
      this.alienTick -= this.alienStepEvery;
      this.stepAliens();
      if (this.over) return;
    }

    // 外星人子彈
    this.alienBullets.forEach(function (b) {
      b.y += self.alienBulletSpeed * dt;
    });
    this.alienBullets = this.alienBullets.filter(function (b) {
      return b.y < self.height + 6;
    });

    // 外星人射擊
    this.alienFireTimer -= dt;
    if (this.alienFireTimer <= 0) {
      this.alienFireTimer = 0.9 + Math.random() * 1.1;
      var alive = this.aliveAliens();
      if (alive.length) {
        var shooter = alive[Math.floor(Math.random() * alive.length)];
        this.alienBullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h });
      }
    }

    this.checkCollisions();

    if (!this.aliveAliens().length) {
      this.won = true;
      this.over = true;
    }
  };

  // 支援 Node（測試用）與瀏覽器
  if (typeof module !== "undefined" && module.exports) {
    module.exports = SpaceInvaders;
  }
  global.SpaceInvaders = SpaceInvaders;
})(typeof window !== "undefined" ? window : globalThis);
