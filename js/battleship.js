// ═══════════════════════════════════════════════════════════════
// Battleship Engine（架構比照 chess.js：規則與 UI 分離）
//
// 10×10 棋盤，雙方各有 5 艘船（長度 5/4/3/3/2），開局時自動隨機佈署
// （避免另外做一套手動放船的介面）。輪流對「對方」棋盤上尚未打過的
// 格子開火，命中/落空會記錄下來；一艘船的所有格子都被打中即擊沉；
// 對方所有船都被擊沉即獲勝。同一輪本機雙人對戰時，UI 層會在換手前
// 用一個「交給下一位玩家」的過場畫面擋住棋盤，避免看到對方佈署。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  const SHIP_SIZES = [5, 4, 3, 3, 2];

  function randomFleet() {
    const board = new Array(100).fill(null);
    const ships = [];
    SHIP_SIZES.forEach((size, shipIndex) => {
      let placed = false;
      while (!placed) {
        const horizontal = Math.random() < 0.5;
        const row = Math.floor(Math.random() * 10);
        const col = Math.floor(Math.random() * 10);
        const cells = [];
        let ok = true;
        for (let k = 0; k < size; k++) {
          const r = horizontal ? row : row + k;
          const c = horizontal ? col + k : col;
          if (r > 9 || c > 9) {
            ok = false;
            break;
          }
          const idx = r * 10 + c;
          if (board[idx] !== null) {
            ok = false;
            break;
          }
          cells.push(idx);
        }
        if (ok) {
          cells.forEach((idx) => {
            board[idx] = shipIndex;
          });
          ships.push({ size, cells, hits: 0 });
          placed = true;
        }
      }
    });
    return { board, ships };
  }

  function Battleship() {
    this.reset();
  }

  Battleship.prototype.reset = function () {
    this.boards = { 1: randomFleet(), 2: randomFleet() };
    this.shots = { 1: new Array(100).fill(null), 2: new Array(100).fill(null) };
    this.turn = 1;
    this.status = "active";
    this.result = "";
    this.history = [];
    this.lastShot = null;
  };

  Battleship.prototype.newGame = function () {
    this.reset();
  };

  Battleship.prototype.pushHistory = function () {
    this.history.push({
      shots: { 1: this.shots[1].slice(), 2: this.shots[2].slice() },
      ships: {
        1: this.boards[1].ships.map((s) => ({ size: s.size, cells: s.cells.slice(), hits: s.hits })),
        2: this.boards[2].ships.map((s) => ({ size: s.size, cells: s.cells.slice(), hits: s.hits })),
      },
      turn: this.turn,
      status: this.status,
      result: this.result,
      lastShot: this.lastShot,
    });
  };

  Battleship.prototype.fire = function (targetPlayer, index) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    if (targetPlayer === this.turn) return { ok: false, reason: "Cannot fire at your own board" };
    if (this.shots[this.turn][index] !== null) return { ok: false, reason: "Already fired there" };

    this.pushHistory();
    const fleet = this.boards[targetPlayer];
    const shipIndex = fleet.board[index];
    let sunk = null;
    if (shipIndex !== null) {
      this.shots[this.turn][index] = "hit";
      const ship = fleet.ships[shipIndex];
      ship.hits++;
      if (ship.hits === ship.size) sunk = shipIndex;
    } else {
      this.shots[this.turn][index] = "miss";
    }
    this.lastShot = { by: this.turn, at: index, hit: shipIndex !== null, sunk };

    const allSunk = fleet.ships.every((s) => s.hits === s.size);
    if (allSunk) {
      this.status = "over";
      this.result = "Player " + this.turn + " wins — sank the entire enemy fleet!";
      return { ok: true, hit: shipIndex !== null, sunk, status: this.status, result: this.result };
    }
    this.turn = this.turn === 1 ? 2 : 1;
    return { ok: true, hit: shipIndex !== null, sunk, status: this.status, result: this.result };
  };

  Battleship.prototype.undo = function () {
    const snap = this.history.pop();
    if (!snap) return false;
    this.shots = snap.shots;
    this.boards[1].ships = snap.ships[1];
    this.boards[2].ships = snap.ships[2];
    this.turn = snap.turn;
    this.status = snap.status;
    this.result = snap.result;
    this.lastShot = snap.lastShot;
    return true;
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Battleship;
  }
  global.Battleship = Battleship;
})(typeof window !== "undefined" ? window : globalThis);
