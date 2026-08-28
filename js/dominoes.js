// ═══════════════════════════════════════════════════════════════
// Dominoes Engine（骨牌接龍，架構比照 chess.js：規則與 UI 分離）
//
// 標準 double-six 骨牌 28 張，兩人各發 7 張，其餘 14 張為牌堆。輪流把手上
// 一張骨牌接到牌列的左端或右端（其中一個數字要跟該端的數字相同），接不
// 上就從牌堆摸牌，摸到能出的牌為止；牌堆空了還是出不了牌就 pass。
// 先出完手牌的人獲勝；若雙方連續兩次都 pass（卡關），比剩餘骨牌點數
// 總和，點數少的獲勝，點數相同則平手。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function Dominoes() {
    this.reset();
  }

  Dominoes.prototype.reset = function () {
    const all = [];
    for (let a = 0; a <= 6; a++) {
      for (let b = a; b <= 6; b++) all.push([a, b]);
    }
    shuffle(all);
    this.hands = { 1: all.slice(0, 7), 2: all.slice(7, 14) };
    this.boneyard = all.slice(14);
    this.line = []; // 已擺出的骨牌序列，每張已依接龍方向決定 [靠左值, 靠右值]
    this.leftEnd = null;
    this.rightEnd = null;
    this.turn = 1;
    this.passCount = 0;
    this.status = "active";
    this.result = "";
    this.history = [];
  };

  Dominoes.prototype.newGame = function () {
    this.reset();
  };

  Dominoes.prototype.canPlay = function (tile, end) {
    if (this.line.length === 0) return true;
    const value = end === "left" ? this.leftEnd : this.rightEnd;
    return tile[0] === value || tile[1] === value;
  };

  Dominoes.prototype.legalPlays = function (player) {
    const hand = this.hands[player];
    const out = [];
    hand.forEach((tile, i) => {
      if (this.line.length === 0) {
        out.push({ tileIndex: i, end: "left" });
        return;
      }
      if (this.canPlay(tile, "left")) out.push({ tileIndex: i, end: "left" });
      if (this.canPlay(tile, "right")) out.push({ tileIndex: i, end: "right" });
    });
    return out;
  };

  Dominoes.prototype.pushHistory = function () {
    this.history.push({
      hands: { 1: this.hands[1].map((t) => t.slice()), 2: this.hands[2].map((t) => t.slice()) },
      boneyard: this.boneyard.map((t) => t.slice()),
      line: this.line.map((t) => t.slice()),
      leftEnd: this.leftEnd,
      rightEnd: this.rightEnd,
      turn: this.turn,
      passCount: this.passCount,
      status: this.status,
      result: this.result,
    });
  };

  Dominoes.prototype.playTile = function (tileIndex, end) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    const hand = this.hands[this.turn];
    const tile = hand[tileIndex];
    if (!tile) return { ok: false, reason: "No such tile" };
    if (!this.canPlay(tile, this.line.length === 0 ? "left" : end)) {
      return { ok: false, reason: "Illegal play" };
    }

    this.pushHistory();
    hand.splice(tileIndex, 1);

    if (this.line.length === 0) {
      this.line.push(tile);
      this.leftEnd = tile[0];
      this.rightEnd = tile[1];
    } else if (end === "left") {
      const oriented = tile[1] === this.leftEnd ? tile : [tile[1], tile[0]];
      this.line.unshift(oriented);
      this.leftEnd = oriented[0];
    } else {
      const oriented = tile[0] === this.rightEnd ? tile : [tile[1], tile[0]];
      this.line.push(oriented);
      this.rightEnd = oriented[1];
    }

    this.passCount = 0;
    if (hand.length === 0) {
      this.status = "over";
      this.result = "Player " + this.turn + " wins — played all their tiles";
      return { ok: true, status: this.status, result: this.result };
    }
    this.turn = this.turn === 1 ? 2 : 1;
    return { ok: true, status: this.status, result: this.result };
  };

  Dominoes.prototype.pipTotal = function (player) {
    return this.hands[player].reduce((sum, t) => sum + t[0] + t[1], 0);
  };

  Dominoes.prototype.endByBlock = function () {
    this.status = "over";
    const p1 = this.pipTotal(1);
    const p2 = this.pipTotal(2);
    if (p1 < p2) this.result = "Player 1 wins — fewest pips remaining (" + p1 + " vs " + p2 + ")";
    else if (p2 < p1) this.result = "Player 2 wins — fewest pips remaining (" + p2 + " vs " + p1 + ")";
    else this.result = "Draw — tied on remaining pips (" + p1 + ")";
  };

  Dominoes.prototype.draw = function () {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    if (this.legalPlays(this.turn).length > 0) {
      return { ok: false, reason: "You have a legal play, cannot draw" };
    }
    if (this.boneyard.length === 0) {
      this.passCount++;
      if (this.passCount >= 2) {
        this.endByBlock();
        return { ok: true, blocked: true, status: this.status, result: this.result };
      }
      this.turn = this.turn === 1 ? 2 : 1;
      return { ok: true, passed: true };
    }
    this.pushHistory();
    const tile = this.boneyard.pop();
    this.hands[this.turn].push(tile);
    return { ok: true, drew: tile };
  };

  Dominoes.prototype.undo = function () {
    const snap = this.history.pop();
    if (!snap) return false;
    this.hands = snap.hands;
    this.boneyard = snap.boneyard;
    this.line = snap.line;
    this.leftEnd = snap.leftEnd;
    this.rightEnd = snap.rightEnd;
    this.turn = snap.turn;
    this.passCount = snap.passCount;
    this.status = snap.status;
    this.result = snap.result;
    return true;
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Dominoes;
  }
  global.Dominoes = Dominoes;
})(typeof window !== "undefined" ? window : globalThis);
