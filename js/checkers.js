// ═══════════════════════════════════════════════════════════════
// Checkers Engine（西洋跳棋引擎，英美規則，與 UI 分離，架構比照 chess.js）
//
// 規則：8×8 棋盤，僅使用暗格；一般棋子（man）只能往前斜走一格，跳吃
// 對手棋子時可連續跳吃（同一顆棋子在同一回合內只要還有下一步可跳，就
// 必須繼續跳，直到升王或無路可跳為止）；只要盤面上「任何一顆」己方棋子
// 有跳吃機會，就必須跳吃，不能走一般步（強制吃子）。棋子走到對方底線
// 立刻升王（king），升王的那一步視為回合結束，即使升王後理論上還能
// 再跳，也不會繼續（標準規則）。King 可以往前後任一斜角走/跳。
// 勝負：對手棋子被吃光，或輪到對手時完全無路可走，即獲勝。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  const idx = (r, f) => r * 8 + f;
  const rankOf = (i) => Math.floor(i / 8);
  const fileOf = (i) => i % 8;
  const onBoard = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
  const isDark = (r, f) => (r + f) % 2 !== 0;

  const MAN_DIRS = { b: [[1, -1], [1, 1]], w: [[-1, -1], [-1, 1]] };
  const KING_DIRS = [[1, -1], [1, 1], [-1, -1], [-1, 1]];

  function dirsFor(piece) {
    return piece.type === "king" ? KING_DIRS : MAN_DIRS[piece.color];
  }

  /** 某顆棋子目前可跳吃的走法：[{ to, captured }] */
  function captureMovesFrom(board, sq) {
    const piece = board[sq];
    if (!piece) return [];
    const r = rankOf(sq);
    const f = fileOf(sq);
    const out = [];
    for (const [dr, df] of dirsFor(piece)) {
      const mr = r + dr;
      const mf = f + df;
      const tr = r + 2 * dr;
      const tf = f + 2 * df;
      if (!onBoard(tr, tf)) continue;
      const mid = board[idx(mr, mf)];
      if (mid && mid.color !== piece.color && !board[idx(tr, tf)]) {
        out.push({ to: idx(tr, tf), captured: idx(mr, mf) });
      }
    }
    return out;
  }

  /** 某顆棋子目前可走的一般步（不吃子）：目標格陣列 */
  function simpleMovesFrom(board, sq) {
    const piece = board[sq];
    if (!piece) return [];
    const r = rankOf(sq);
    const f = fileOf(sq);
    const out = [];
    for (const [dr, df] of dirsFor(piece)) {
      const tr = r + dr;
      const tf = f + df;
      if (onBoard(tr, tf) && !board[idx(tr, tf)]) out.push(idx(tr, tf));
    }
    return out;
  }

  function Checkers() {
    this.reset();
  }

  Checkers.prototype.reset = function () {
    this.board = new Array(64).fill(null);
    for (let r = 0; r < 3; r++) {
      for (let f = 0; f < 8; f++) {
        if (isDark(r, f)) this.board[idx(r, f)] = { type: "man", color: "b" };
      }
    }
    for (let r = 5; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        if (isDark(r, f)) this.board[idx(r, f)] = { type: "man", color: "w" };
      }
    }
    this.turn = "b";
    this.status = "active"; // active | over
    this.result = "";
    this.history = [];
    // 目前是否處於「連續跳吃」中：>=0 代表只能繼續移動這顆棋子
    this.forcedFrom = -1;
    this.lastFrom = -1;
    this.lastTo = -1;
  };

  Checkers.prototype.newGame = function () {
    this.reset();
  };

  Checkers.prototype.pieceAt = function (sq) {
    return this.board[sq] || null;
  };

  Checkers.prototype.anyCaptureAvailable = function (color) {
    for (let s = 0; s < 64; s++) {
      const p = this.board[s];
      if (p && p.color === color && captureMovesFrom(this.board, s).length > 0) return true;
    }
    return false;
  };

  /** 套用「強制連續跳吃」與「強制吃子」規則後，某顆棋子目前的合法目標格 */
  Checkers.prototype.legalMoves = function (from) {
    const piece = this.board[from];
    if (!piece || piece.color !== this.turn) return [];
    if (this.status === "over") return [];
    if (this.forcedFrom !== -1) {
      if (from !== this.forcedFrom) return [];
      return captureMovesFrom(this.board, from).map((m) => m.to);
    }
    if (this.anyCaptureAvailable(this.turn)) {
      return captureMovesFrom(this.board, from).map((m) => m.to);
    }
    return simpleMovesFrom(this.board, from);
  };

  Checkers.prototype.makeMove = function (from, to) {
    if (this.status === "over") return { ok: false, reason: "Game over" };
    const piece = this.board[from];
    if (!piece || piece.color !== this.turn) return { ok: false, reason: "Not your turn" };
    const legal = this.legalMoves(from);
    if (legal.indexOf(to) === -1) return { ok: false, reason: "Illegal move" };

    // 一整回合（含連續跳吃）只在回合開始時記一次悔棋快照
    if (this.forcedFrom === -1) {
      this.history.push({
        board: this.board.map((p) => (p ? { type: p.type, color: p.color } : null)),
        turn: this.turn,
        status: this.status,
        result: this.result,
      });
    }

    const captureMove = captureMovesFrom(this.board, from).find((m) => m.to === to);
    this.board[to] = piece;
    this.board[from] = null;
    if (captureMove) this.board[captureMove.captured] = null;
    this.lastFrom = from;
    this.lastTo = to;

    let crowned = false;
    if (piece.type === "man") {
      const r = rankOf(to);
      if ((piece.color === "b" && r === 7) || (piece.color === "w" && r === 0)) {
        piece.type = "king";
        crowned = true;
      }
    }

    if (captureMove && !crowned && captureMovesFrom(this.board, to).length > 0) {
      this.forcedFrom = to;
      this.status = "active";
      this.result = "";
      return { ok: true, status: this.status, result: this.result, mustContinue: true };
    }

    this.forcedFrom = -1;
    this.turn = this.turn === "b" ? "w" : "b";
    this.updateStatus();
    return { ok: true, status: this.status, result: this.result, mustContinue: false };
  };

  /** 換手後檢查新的一方是否還有棋子、還有路可走；沒有則遊戲結束 */
  Checkers.prototype.updateStatus = function () {
    let hasPiece = false;
    let hasMove = false;
    for (let s = 0; s < 64; s++) {
      const p = this.board[s];
      if (p && p.color === this.turn) {
        hasPiece = true;
        if (captureMovesFrom(this.board, s).length > 0 || simpleMovesFrom(this.board, s).length > 0) {
          hasMove = true;
          break;
        }
      }
    }
    if (!hasPiece || !hasMove) {
      this.status = "over";
      const winner = this.turn === "b" ? "White" : "Black";
      this.result = winner + " wins — opponent has " + (!hasPiece ? "no pieces left" : "no legal moves");
      return;
    }
    this.status = "active";
    this.result = "";
  };

  Checkers.prototype.undo = function () {
    const snap = this.history.pop();
    if (!snap) return false;
    this.board = snap.board;
    this.turn = snap.turn;
    this.status = snap.status;
    this.result = snap.result;
    this.forcedFrom = -1;
    this.lastFrom = -1;
    this.lastTo = -1;
    return true;
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = Checkers;
  }
  global.Checkers = Checkers;
})(typeof window !== "undefined" ? window : globalThis);
