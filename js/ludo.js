// ═══════════════════════════════════════════════════════════════
// Ludo Engine（架構比照 chess.js：規則與 UI 分離）
//
// 簡化為 2 人對戰（Red vs Yellow，棋盤上相對的兩個起點），共用 52 格
// 環狀公共跑道 + 每色 6 格終點跑道。規則：
//   - 棋子要擲出 6 才能從家出發，落在自己的起點格（起點格是安全格）。
//   - 在公共跑道上前進，剛好走完 51 格後轉進自己專屬的終點跑道（6 格），
//     必須「剛好」擲到能走進終點格的點數，否則這顆棋子這次不能動。
//   - 走到對手單獨一顆棋子所在的格子（非安全格）會把對方棋子吃回家。
//   - 擲出 6 可以再擲一次；連續三次擲到 6，直接失去這個回合。
//   - 若某次擲骰後手上沒有任何棋子能動，自動換手。
//   - 4 顆棋子都走到終點即獲勝。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  const START_OFFSET = { red: 0, blue: 13, yellow: 26, green: 39 };
  const SAFE_POSITIONS = Object.values(START_OFFSET);

  function globalPos(color, d) {
    return (START_OFFSET[color] + d - 1) % 52;
  }

  function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function Ludo(players) {
    this.reset(players);
  }

  Ludo.prototype.reset = function (players) {
    this.players = players && players.length >= 2 ? players.slice() : ["red", "yellow"];
    this.tokens = {};
    this.players.forEach((c) => {
      this.tokens[c] = [0, 0, 0, 0];
    });
    this.turn = this.players[0];
    this.status = "active";
    this.result = "";
    this.history = [];
    this.lastRoll = 0;
    this.sixStreak = 0;
    this.lastCapture = null;
  };

  Ludo.prototype.newGame = function () {
    this.reset(this.players);
  };

  Ludo.prototype.pushHistory = function () {
    const tokens = {};
    this.players.forEach((c) => {
      tokens[c] = this.tokens[c].slice();
    });
    this.history.push({
      tokens,
      turn: this.turn,
      status: this.status,
      result: this.result,
      lastRoll: this.lastRoll,
      sixStreak: this.sixStreak,
      lastCapture: this.lastCapture,
    });
  };

  Ludo.prototype.advanceTurn = function () {
    const idx = this.players.indexOf(this.turn);
    this.turn = this.players[(idx + 1) % this.players.length];
    this.sixStreak = 0;
  };

  Ludo.prototype.legalMoves = function (die) {
    if (this.status === "over") return [];
    const out = [];
    this.tokens[this.turn].forEach((d, i) => {
      if (d === 0) {
        if (die === 6) out.push(i);
        return;
      }
      if (d === 57) return;
      if (d + die <= 57) out.push(i);
    });
    return out;
  };

  /** forcedDie 僅供測試用來固定骰子點數 */
  Ludo.prototype.roll = function (forcedDie) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    const die = forcedDie || 1 + Math.floor(Math.random() * 6);
    this.pushHistory();
    this.lastRoll = die;
    this.lastCapture = null;

    if (die === 6) {
      this.sixStreak++;
      if (this.sixStreak >= 3) {
        this.advanceTurn();
        return { ok: true, die, forfeited: true };
      }
    } else {
      this.sixStreak = 0;
    }

    const legal = this.legalMoves(die);
    if (legal.length === 0) {
      this.advanceTurn();
      return { ok: true, die, noMoves: true };
    }
    return { ok: true, die, legal };
  };

  Ludo.prototype.moveToken = function (tokenIndex, die) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    const legal = this.legalMoves(die);
    if (legal.indexOf(tokenIndex) === -1) return { ok: false, reason: "Illegal move" };

    const color = this.turn;
    const cur = this.tokens[color][tokenIndex];
    const nd = cur === 0 ? 1 : cur + die;
    this.tokens[color][tokenIndex] = nd;

    let captured = null;
    if (nd >= 1 && nd <= 51) {
      const pos = globalPos(color, nd);
      if (SAFE_POSITIONS.indexOf(pos) === -1) {
        this.players.forEach((other) => {
          if (other === color) return;
          this.tokens[other].forEach((od, oi) => {
            if (od >= 1 && od <= 51 && globalPos(other, od) === pos) {
              this.tokens[other][oi] = 0;
              captured = { color: other, index: oi };
            }
          });
        });
      }
    }
    this.lastCapture = captured;

    const allHome = this.tokens[color].every((x) => x === 57);
    if (allHome) {
      this.status = "over";
      this.result = capitalize(color) + " wins — got all 4 tokens home!";
      return { ok: true, captured, status: this.status, result: this.result };
    }

    const extraTurn = die === 6;
    if (!extraTurn) this.advanceTurn();
    return { ok: true, captured, extraTurn, status: this.status, result: this.result };
  };

  Ludo.prototype.undo = function () {
    const snap = this.history.pop();
    if (!snap) return false;
    this.tokens = snap.tokens;
    this.turn = snap.turn;
    this.status = snap.status;
    this.result = snap.result;
    this.lastRoll = snap.lastRoll;
    this.sixStreak = snap.sixStreak;
    this.lastCapture = snap.lastCapture;
    return true;
  };

  Ludo.globalPos = globalPos;
  Ludo.SAFE_POSITIONS = SAFE_POSITIONS;
  Ludo.START_OFFSET = START_OFFSET;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Ludo;
  }
  global.Ludo = Ludo;
})(typeof window !== "undefined" ? window : globalThis);
