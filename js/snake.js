// ═══════════════════════════════════════════════════════════════
// Snake — 遊戲引擎（純狀態/規則，格狀邏輯，與 DOM 分離）
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  function Snake(cols, rows) {
    this.cols = cols || 20;
    this.rows = rows || 20;
    this.reset();
  }

  Snake.prototype.reset = function () {
    this.snake = [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = this.spawnFood();
    this.score = 0;
    this.over = false;
    this.won = false;
    this.tick = 0;
    this.stepEvery = 0.14;
  };

  Snake.prototype.occupied = function (x, y) {
    return this.snake.some(function (s) {
      return s.x === x && s.y === y;
    });
  };

  Snake.prototype.spawnFood = function () {
    var empty = [];
    for (var y = 0; y < this.rows; y++) {
      for (var x = 0; x < this.cols; x++) if (!this.occupied(x, y)) empty.push({ x: x, y: y });
    }
    if (!empty.length) return null;
    return empty[Math.floor(Math.random() * empty.length)];
  };

  Snake.prototype.setDir = function (dx, dy) {
    if (dx === -this.dir.x && dy === -this.dir.y) return; // no instant reverse
    if (dx !== 0 && dy !== 0) return; // orthogonal only
    this.nextDir = { x: dx, y: dy };
  };

  Snake.prototype.step = function () {
    this.dir = this.nextDir;
    var head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };

    if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
      this.over = true;
      return;
    }

    var willGrow = this.food && head.x === this.food.x && head.y === this.food.y;
    var body = willGrow ? this.snake : this.snake.slice(0, this.snake.length - 1);
    for (var i = 0; i < body.length; i++) {
      if (body[i].x === head.x && body[i].y === head.y) {
        this.over = true;
        return;
      }
    }

    this.snake.unshift(head);
    if (willGrow) {
      this.score++;
      this.food = this.spawnFood();
      if (!this.food) {
        this.won = true;
        this.over = true;
      }
    } else {
      this.snake.pop();
    }
  };

  Snake.prototype.update = function (dt) {
    if (this.over) return;
    this.tick += dt;
    while (this.tick >= this.stepEvery) {
      this.tick -= this.stepEvery;
      this.step();
      if (this.over) return;
    }
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Snake;
  global.Snake = Snake;
})(typeof window !== "undefined" ? window : globalThis);
