// ═══════════════════════════════════════════════════════════════
// Nine Men's Morris Engine（磨坊棋，架構比照 chess.js：規則與 UI 分離）
//
// 24 個交叉點分成外/中/內三圈，每圈 8 個點（角落 + 4 邊中點），中點另外
// 沿四個方向的「輻條」連到相鄰圈的中點。兩階段：
//   1. 擺子階段：雙方各 9 顆，輪流放在任一空點上。
//   2. 移動階段（雙方 18 顆都放完後）：只能把棋子滑到「相鄰」的空點；
//      若某方只剩 3 顆棋子，該方進入「飛子」，可以飛到任何空點。
// 不論哪個階段，只要湊成一條「三子連線」（mill），就必須立刻移除一顆
// 對方棋子（優先移除不在對方 mill 裡的棋子；若對方全部棋子都在 mill
// 裡，才能移除 mill 裡的）。對方剩 2 顆棋子，或輪到對方時完全無路可
// 走，即獲勝。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  // 24 個點的座標（0..6 網格，供 UI 畫線／定位用），index 即 point id
  const POINTS = [
    [0, 0], [3, 0], [6, 0], [6, 3], [6, 6], [3, 6], [0, 6], [0, 3], // 外圈 0-7
    [1, 1], [3, 1], [5, 1], [5, 3], [5, 5], [3, 5], [1, 5], [1, 3], // 中圈 8-15
    [2, 2], [3, 2], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [2, 3], // 內圈 16-23
  ];

  const RING_ADJ = (base) => [
    [base, base + 1], [base + 1, base + 2], [base + 2, base + 3], [base + 3, base + 4],
    [base + 4, base + 5], [base + 5, base + 6], [base + 6, base + 7], [base + 7, base],
  ];
  const SPOKES = [[1, 9], [9, 17], [3, 11], [11, 19], [5, 13], [13, 21], [7, 15], [15, 23]];
  const EDGES = [...RING_ADJ(0), ...RING_ADJ(8), ...RING_ADJ(16), ...SPOKES];

  const ADJACENCY = POINTS.map(() => []);
  EDGES.forEach(([a, b]) => {
    ADJACENCY[a].push(b);
    ADJACENCY[b].push(a);
  });

  const MILL_LINES = [
    [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
    [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
    [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
    [1, 9, 17], [3, 11, 19], [5, 13, 21], [7, 15, 23],
  ];

  function opponent(color) {
    return color === "b" ? "w" : "b";
  }

  function Morris() {
    this.reset();
  }

  Morris.prototype.reset = function () {
    this.board = new Array(24).fill(null);
    this.turn = "b";
    this.phase = "placing"; // placing | moving
    this.toPlace = { b: 9, w: 9 };
    this.pendingRemoval = false;
    this.status = "active";
    this.result = "";
    this.history = [];
    this.lastAction = null;
  };

  Morris.prototype.newGame = function () {
    this.reset();
  };

  Morris.prototype.countPieces = function (color) {
    let n = 0;
    for (const p of this.board) if (p === color) n++;
    return n;
  };

  Morris.prototype.formsMillAt = function (point, color) {
    return MILL_LINES.some(
      (line) => line.indexOf(point) !== -1 && line.every((p) => this.board[p] === color),
    );
  };

  Morris.prototype.removablePieces = function (color) {
    const pieces = [];
    for (let i = 0; i < 24; i++) if (this.board[i] === color) pieces.push(i);
    const nonMill = pieces.filter((i) => !this.formsMillAt(i, color));
    return nonMill.length > 0 ? nonMill : pieces;
  };

  Morris.prototype.legalPlacements = function () {
    if (this.phase !== "placing" || this.pendingRemoval || this.status === "over") return [];
    const out = [];
    for (let i = 0; i < 24; i++) if (!this.board[i]) out.push(i);
    return out;
  };

  Morris.prototype.legalMoves = function (from) {
    if (this.phase !== "moving" || this.pendingRemoval || this.status === "over") return [];
    const piece = this.board[from];
    if (!piece || piece !== this.turn) return [];
    const flying = this.countPieces(this.turn) === 3;
    if (flying) {
      const out = [];
      for (let i = 0; i < 24; i++) if (!this.board[i]) out.push(i);
      return out;
    }
    return ADJACENCY[from].filter((n) => !this.board[n]);
  };

  Morris.prototype.pushHistory = function () {
    this.history.push({
      board: this.board.slice(),
      turn: this.turn,
      phase: this.phase,
      toPlace: Object.assign({}, this.toPlace),
      pendingRemoval: this.pendingRemoval,
      status: this.status,
      result: this.result,
    });
  };

  Morris.prototype.finishTurn = function () {
    if (this.phase === "placing" && this.toPlace.b === 0 && this.toPlace.w === 0) {
      this.phase = "moving";
    }
    this.turn = opponent(this.turn);
    this.updateStatus();
  };

  Morris.prototype.place = function (point) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    if (this.pendingRemoval) return { ok: false, reason: "Must remove an opponent piece first" };
    if (this.phase !== "placing") return { ok: false, reason: "Not in the placing phase" };
    if (this.toPlace[this.turn] <= 0) return { ok: false, reason: "No pieces left to place" };
    if (this.board[point]) return { ok: false, reason: "Point is occupied" };

    this.pushHistory();
    this.board[point] = this.turn;
    this.toPlace[this.turn]--;
    this.lastAction = { type: "place", point, color: this.turn };

    const mill = this.formsMillAt(point, this.turn);
    if (mill && this.removablePieces(opponent(this.turn)).length > 0) {
      this.pendingRemoval = true;
      return { ok: true, mill: true, pendingRemoval: true };
    }
    this.finishTurn();
    return { ok: true, mill, pendingRemoval: false };
  };

  Morris.prototype.move = function (from, to) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    if (this.pendingRemoval) return { ok: false, reason: "Must remove an opponent piece first" };
    const legal = this.legalMoves(from);
    if (legal.indexOf(to) === -1) return { ok: false, reason: "Illegal move" };

    this.pushHistory();
    this.board[to] = this.turn;
    this.board[from] = null;
    this.lastAction = { type: "move", from, to, color: this.turn };

    const mill = this.formsMillAt(to, this.turn);
    if (mill && this.removablePieces(opponent(this.turn)).length > 0) {
      this.pendingRemoval = true;
      return { ok: true, mill: true, pendingRemoval: true };
    }
    this.finishTurn();
    return { ok: true, mill, pendingRemoval: false };
  };

  Morris.prototype.remove = function (point) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    if (!this.pendingRemoval) return { ok: false, reason: "No removal pending" };
    const opp = opponent(this.turn);
    if (this.board[point] !== opp) return { ok: false, reason: "Not an opponent piece" };
    const removable = this.removablePieces(opp);
    if (removable.indexOf(point) === -1) {
      return { ok: false, reason: "That piece is protected by a mill" };
    }
    this.pushHistory();
    this.board[point] = null;
    this.pendingRemoval = false;
    this.finishTurn();
    return { ok: true, status: this.status, result: this.result };
  };

  Morris.prototype.updateStatus = function () {
    if (this.phase === "moving") {
      const count = this.countPieces(this.turn);
      if (count <= 2) {
        this.status = "over";
        this.result = (this.turn === "b" ? "White" : "Black") + " wins — opponent has only 2 pieces left";
        return;
      }
      let hasMove = false;
      for (let i = 0; i < 24; i++) {
        if (this.board[i] === this.turn && this.legalMoves(i).length > 0) {
          hasMove = true;
          break;
        }
      }
      if (!hasMove) {
        this.status = "over";
        this.result = (this.turn === "b" ? "White" : "Black") + " wins — opponent has no legal moves";
        return;
      }
    }
    this.status = "active";
    this.result = "";
  };

  Morris.prototype.undo = function () {
    const snap = this.history.pop();
    if (!snap) return false;
    this.board = snap.board;
    this.turn = snap.turn;
    this.phase = snap.phase;
    this.toPlace = snap.toPlace;
    this.pendingRemoval = snap.pendingRemoval;
    this.status = snap.status;
    this.result = snap.result;
    return true;
  };

  Morris.POINTS = POINTS;
  Morris.ADJACENCY = ADJACENCY;
  Morris.MILL_LINES = MILL_LINES;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Morris;
  }
  global.Morris = Morris;
})(typeof window !== "undefined" ? window : globalThis);
