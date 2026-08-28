// ═══════════════════════════════════════════════════════════════
// Othello / Reversi Engine（黑白棋引擎，與 UI 分離，架構比照 chess.js）
//
// 規則：8×8 棋盤，落子需在某個方向「夾住」至少一整排對手棋子（中間全是
// 對手棋子，兩端各是己方棋子），夾住的對手棋子全部翻面。若當前玩家無
// 合法走法則自動跳過（pass）；雙方都無合法走法時遊戲結束，棋子多者獲勝。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  const DIRS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];

  const idx = (r, f) => r * 8 + f;
  const onBoard = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;

  function Othello() {
    this.reset();
  }

  Othello.prototype.reset = function () {
    this.board = new Array(64).fill(null);
    this.board[idx(3, 3)] = "w";
    this.board[idx(3, 4)] = "b";
    this.board[idx(4, 3)] = "b";
    this.board[idx(4, 4)] = "w";
    this.turn = "b";
    this.status = "active"; // active | over
    this.result = "";
    this.history = [];
    this.lastMove = -1;
    this.passedLastTurn = false;
    this.updateStatus();
  };

  Othello.prototype.newGame = function () {
    this.reset();
  };

  /** 落子在 square（尚未真的落子）會翻掉哪些對手棋子；回傳空陣列代表不合法 */
  function flipsForMove(board, square, color) {
    if (board[square]) return [];
    const r0 = Math.floor(square / 8);
    const f0 = square % 8;
    const opponent = color === "b" ? "w" : "b";
    const flips = [];
    for (const [dr, df] of DIRS) {
      let r = r0 + dr;
      let f = f0 + df;
      const line = [];
      while (onBoard(r, f) && board[idx(r, f)] === opponent) {
        line.push(idx(r, f));
        r += dr;
        f += df;
      }
      if (line.length > 0 && onBoard(r, f) && board[idx(r, f)] === color) {
        flips.push(...line);
      }
    }
    return flips;
  }

  Othello.prototype.legalMoves = function (color) {
    const moves = [];
    for (let s = 0; s < 64; s++) {
      if (this.board[s]) continue;
      if (flipsForMove(this.board, s, color).length > 0) moves.push(s);
    }
    return moves;
  };

  Othello.prototype.makeMove = function (square) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    const flips = flipsForMove(this.board, square, this.turn);
    if (flips.length === 0) return { ok: false, reason: "Illegal move" };

    this.history.push({
      board: this.board.slice(),
      turn: this.turn,
      status: this.status,
      result: this.result,
      lastMove: this.lastMove,
      passedLastTurn: this.passedLastTurn,
    });

    this.board[square] = this.turn;
    for (const f of flips) this.board[f] = this.turn;
    this.lastMove = square;
    this.passedLastTurn = false;
    this.turn = this.turn === "b" ? "w" : "b";
    this.updateStatus();
    return { ok: true, status: this.status, result: this.result };
  };

  /**
   * 換手後檢查目前輪到的一方是否有合法走法：
   * 沒有 → 換另一方（pass）；若兩邊都沒有合法走法 → 遊戲結束，比子數。
   */
  Othello.prototype.updateStatus = function () {
    const moves = this.legalMoves(this.turn);
    if (moves.length === 0) {
      const other = this.turn === "b" ? "w" : "b";
      const otherMoves = this.legalMoves(other);
      if (otherMoves.length === 0) {
        this.status = "over";
        this.result = this.decideResult();
        return;
      }
      this.turn = other;
      this.passedLastTurn = true;
      this.status = "active";
      this.result = "";
      return;
    }
    this.status = "active";
    this.result = "";
  };

  Othello.prototype.counts = function () {
    let b = 0;
    let w = 0;
    for (const p of this.board) {
      if (p === "b") b++;
      else if (p === "w") w++;
    }
    return { b, w };
  };

  Othello.prototype.decideResult = function () {
    const { b, w } = this.counts();
    if (b > w) return "Black wins";
    if (w > b) return "White wins";
    return "Draw";
  };

  Othello.prototype.undo = function () {
    const snap = this.history.pop();
    if (!snap) return false;
    this.board = snap.board;
    this.turn = snap.turn;
    this.status = snap.status;
    this.result = snap.result;
    this.lastMove = snap.lastMove;
    this.passedLastTurn = snap.passedLastTurn;
    return true;
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Othello;
  }
  global.Othello = Othello;
})(typeof window !== "undefined" ? window : globalThis);
