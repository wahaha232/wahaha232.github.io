// ═══════════════════════════════════════════════════════════════
// Backgammon Engine（架構比照 chess.js：規則與 UI 分離，不含加倍骰）
//
// 24 個點用 index 0-23 表示。白方（w）從 23 往 0 前進，家門在 0-5；
// 黑方（b）從 0 往 23 前進，家門在 18-23。被打的單顆棋子（blot）會被
// 送上 bar，該方必須先讓 bar 上的棋子重新進場才能動其他棋子。所有棋
// 子都進到自己家門後才能起子（bear off）：骰數剛好對應距離即可起子；
// 骰數更大時，只要家門裡沒有距離更遠的棋子擋著，也可以用來起子。
// 雙數（例如擲出兩個 5）可以用同一個點數走 4 步。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  const DIR = { w: -1, b: 1 };
  const HOME_RANGE = { w: [0, 5], b: [18, 23] };

  function distanceToOff(color, p) {
    return color === "w" ? p + 1 : 24 - p;
  }

  function Backgammon() {
    this.reset();
  }

  Backgammon.prototype.reset = function () {
    this.points = new Array(24).fill(null);
    this.points[23] = { color: "w", count: 2 };
    this.points[12] = { color: "w", count: 5 };
    this.points[7] = { color: "w", count: 3 };
    this.points[5] = { color: "w", count: 5 };
    this.points[0] = { color: "b", count: 2 };
    this.points[11] = { color: "b", count: 5 };
    this.points[16] = { color: "b", count: 3 };
    this.points[18] = { color: "b", count: 5 };
    this.bar = { w: 0, b: 0 };
    this.borneOff = { w: 0, b: 0 };
    this.turn = "w";
    this.dice = [];
    this.status = "active"; // active | over
    this.result = "";
    this.history = [];
  };

  Backgammon.prototype.newGame = function () {
    this.reset();
  };

  Backgammon.prototype.targetFor = function (color, from, die) {
    if (from === "bar") {
      return color === "w" ? 24 - die : die - 1;
    }
    const t = from + DIR[color] * die;
    if (t < 0 || t > 23) return "off";
    return t;
  };

  Backgammon.prototype.canBearOff = function (color) {
    const [lo, hi] = HOME_RANGE[color];
    if (this.bar[color] > 0) return false;
    for (let i = 0; i < 24; i++) {
      const pt = this.points[i];
      if (pt && pt.color === color && (i < lo || i > hi)) return false;
    }
    return true;
  };

  Backgammon.prototype.canBearOffFrom = function (color, p, die) {
    if (!this.canBearOff(color)) return false;
    const dist = distanceToOff(color, p);
    if (die === dist) return true;
    if (die > dist) {
      for (let i = 0; i < 24; i++) {
        const pt = this.points[i];
        if (pt && pt.color === color && distanceToOff(color, i) > dist) return false;
      }
      return true;
    }
    return false;
  };

  Backgammon.prototype.canMove = function (color, from, die) {
    if (this.status === "over") return false;
    if (this.bar[color] > 0 && from !== "bar") return false;
    if (from !== "bar") {
      const pt = this.points[from];
      if (!pt || pt.color !== color || pt.count <= 0) return false;
    }
    const target = this.targetFor(color, from, die);
    if (target === "off") {
      if (from === "bar") return false;
      return this.canBearOffFrom(color, from, die);
    }
    const destPt = this.points[target];
    if (destPt && destPt.color !== color && destPt.count >= 2) return false;
    return true;
  };

  Backgammon.prototype.anyMoveAvailable = function () {
    const color = this.turn;
    const uniqueDice = Array.from(new Set(this.dice));
    if (uniqueDice.length === 0) return false;
    if (this.bar[color] > 0) {
      return uniqueDice.some((d) => this.canMove(color, "bar", d));
    }
    for (let i = 0; i < 24; i++) {
      const pt = this.points[i];
      if (pt && pt.color === color && uniqueDice.some((d) => this.canMove(color, i, d))) return true;
    }
    return false;
  };

  Backgammon.prototype.pushHistory = function () {
    this.history.push({
      points: this.points.map((p) => (p ? { color: p.color, count: p.count } : null)),
      bar: Object.assign({}, this.bar),
      borneOff: Object.assign({}, this.borneOff),
      turn: this.turn,
      dice: this.dice.slice(),
      status: this.status,
      result: this.result,
    });
  };

  Backgammon.prototype.endTurn = function () {
    this.dice = [];
    this.turn = this.turn === "w" ? "b" : "w";
  };

  /** forced: [d1,d2] 僅供測試用來固定骰子點數 */
  Backgammon.prototype.rollDice = function (forced) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    if (this.dice.length > 0) return { ok: false, reason: "Finish using the current dice first" };
    const d1 = forced ? forced[0] : 1 + Math.floor(Math.random() * 6);
    const d2 = forced ? forced[1] : 1 + Math.floor(Math.random() * 6);
    this.pushHistory();
    this.dice = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
    if (!this.anyMoveAvailable()) {
      const rolled = this.dice.slice();
      this.endTurn();
      return { ok: true, dice: rolled, noMoves: true };
    }
    return { ok: true, dice: this.dice.slice() };
  };

  Backgammon.prototype.makeMove = function (from, die) {
    const color = this.turn;
    if (this.status === "over") return { ok: false, reason: "Game over" };
    if (this.dice.indexOf(die) === -1) return { ok: false, reason: "That die value is not available" };
    if (!this.canMove(color, from, die)) return { ok: false, reason: "Illegal move" };

    this.pushHistory();

    if (from === "bar") this.bar[color]--;
    else {
      this.points[from].count--;
      if (this.points[from].count === 0) this.points[from] = null;
    }

    const target = this.targetFor(color, from, die);
    let hit = false;
    if (target === "off") {
      this.borneOff[color]++;
    } else {
      const destPt = this.points[target];
      if (destPt && destPt.color !== color) {
        this.bar[destPt.color]++;
        this.points[target] = { color, count: 1 };
        hit = true;
      } else if (destPt) {
        destPt.count++;
      } else {
        this.points[target] = { color, count: 1 };
      }
    }

    this.dice.splice(this.dice.indexOf(die), 1);

    if (this.borneOff[color] === 15) {
      this.status = "over";
      this.result = (color === "w" ? "White" : "Black") + " wins — all checkers borne off!";
    }

    if (this.status !== "over" && (this.dice.length === 0 || !this.anyMoveAvailable())) {
      this.endTurn();
    }

    return { ok: true, hit, target, status: this.status, result: this.result };
  };

  Backgammon.prototype.undo = function () {
    const snap = this.history.pop();
    if (!snap) return false;
    this.points = snap.points;
    this.bar = snap.bar;
    this.borneOff = snap.borneOff;
    this.turn = snap.turn;
    this.dice = snap.dice;
    this.status = snap.status;
    this.result = snap.result;
    return true;
  };

  Backgammon.HOME_RANGE = HOME_RANGE;
  Backgammon.DIR = DIR;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Backgammon;
  }
  global.Backgammon = Backgammon;
})(typeof window !== "undefined" ? window : globalThis);
