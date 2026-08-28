// ═══════════════════════════════════════════════════════════════
// Snakes & Ladders Engine（架構比照 chess.js：規則與 UI 分離）
// 規則：1-100 直線棋盤，擲骰前進；踩到梯子底部往上跳，踩到蛇頭往下滑；
// 超過 100 的擲骰數視為無法移動（原地不動、換手）；擲出 6 可以再擲一次；
// 第一個「剛好」走到 100 的玩家獲勝。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  // fromSquare -> toSquare；數值比 fromSquare 大 = 梯子，比 fromSquare 小 = 蛇
  const CHUTES_LADDERS = {
    4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91,
    17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79,
  };

  function SnakesAndLadders() {
    this.reset();
  }

  SnakesAndLadders.prototype.reset = function () {
    this.positions = [0, 0]; // index 0 = player 1, index 1 = player 2
    this.turn = 1;
    this.status = "active";
    this.result = "";
    this.history = [];
    this.lastRoll = 0;
    this.lastEvent = null; // "ladder" | "snake" | null
  };

  SnakesAndLadders.prototype.newGame = function () {
    this.reset();
  };

  /** forcedDie 僅供測試用來固定骰子點數，正式遊戲不傳即為隨機 1-6 */
  SnakesAndLadders.prototype.roll = function (forcedDie) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    const die = forcedDie || 1 + Math.floor(Math.random() * 6);

    this.history.push({
      positions: this.positions.slice(),
      turn: this.turn,
      status: this.status,
      result: this.result,
      lastRoll: this.lastRoll,
      lastEvent: this.lastEvent,
    });

    const p = this.turn - 1;
    const from = this.positions[p];
    let landed = from + die;
    let event = null;

    if (landed > 100) {
      landed = from; // 超過 100，原地不動
    } else if (Object.prototype.hasOwnProperty.call(CHUTES_LADDERS, landed)) {
      const dest = CHUTES_LADDERS[landed];
      event = dest > landed ? "ladder" : "snake";
      landed = dest;
    }

    this.positions[p] = landed;
    this.lastRoll = die;
    this.lastEvent = event;

    if (landed === 100) {
      this.status = "over";
      this.result = "Player " + this.turn + " wins!";
      return { ok: true, die, from, landed, event, winner: this.turn };
    }

    const extraTurn = die === 6;
    if (!extraTurn) this.turn = this.turn === 1 ? 2 : 1;
    return { ok: true, die, from, landed, event, extraTurn };
  };

  SnakesAndLadders.prototype.undo = function () {
    const snap = this.history.pop();
    if (!snap) return false;
    this.positions = snap.positions;
    this.turn = snap.turn;
    this.status = snap.status;
    this.result = snap.result;
    this.lastRoll = snap.lastRoll;
    this.lastEvent = snap.lastEvent;
    return true;
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = SnakesAndLadders;
  }
  global.SnakesAndLadders = SnakesAndLadders;
})(typeof window !== "undefined" ? window : globalThis);
