// ═══════════════════════════════════════════════════════════════
// Chess Game Engine（西洋棋引擎，與 UI 完全分離）
//
// 功能：
//   - 8×8 棋盤、合法走法產生、吃子、回合管理
//   - 王車易位（Castling）、吃過路兵（En Passant）、兵升變（Promotion）
//   - 將軍（Check）、將殺（Checkmate）、逼和（Stalemate）
//   - 和棋判定：不足子力、50 手無吃子/無兵動（halfmoveClock）、三次重複局面
//   - 悔棋（Undo，快照式）、棋譜（Move History）
//
// 未來若要加入 AI：另外建立 js/chess-ai.js，只呼叫本引擎公開方法即可。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  const FILES = "abcdefgh";
  const PIECE_GLYPH = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚" };

  const idx = (r, f) => r * 8 + f;
  const rankOf = (i) => i >> 3;
  const fileOf = (i) => i & 7;
  const onBoard = (r, f) => r >= 0 && r < 8 && f >= 0 && f < 8;
  const squareName = (i) => FILES[fileOf(i)] + String(8 - rankOf(i));

  function Chess() {
    this.reset();
  }

  // 取得棋子文字（黑色外型的 Unicode 棋子，UI 再用顏色區分黑白）
  Chess.glyph = function (type) {
    return PIECE_GLYPH[type] || "";
  };

  // ── 初始棋盤 ─────────────────────────────────────────────
  Chess.prototype.reset = function () {
    this.board = new Array(64).fill(null); // 每個元素：{ type, color } 或 null
    this.turn = "w"; // w = 白先手
    this.history = [];
    this.status = "active"; // active | check | checkmate | stalemate | draw
    this.result = "";
    this.enPassantTarget = -1; // 可供吃過路兵的格子
    this.castlingRights = { K: true, Q: true, k: true, q: true };
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
    this.positionHistory = []; // 每步棋後記錄局面指紋，用於三次重複和棋判定

    const start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
    const rows = start.split("/");
    for (let r = 0; r < 8; r++) {
      let f = 0;
      for (const ch of rows[r]) {
        if (ch >= "0" && ch <= "9") {
          f += parseInt(ch, 10);
        } else {
          const color = ch === ch.toUpperCase() ? "w" : "b";
          this.board[idx(r, f)] = { type: ch.toLowerCase(), color };
          f++;
        }
      }
    }
  };

  Chess.prototype.newGame = function () {
    this.reset();
  };

  Chess.prototype.pieceAt = function (square) {
    return this.board[square] || null;
  };

  // 產生當前局面的標準指紋（棋盤 + 輪到誰 + 易位權 + 過路兵目標）。
  // 三次重複和棋判定依賴此指紋：FIDE 規則下，雙方保有之易位權與
  // 過路兵狀態皆屬局面的組成部分，因此一併納入識別。
  Chess.prototype.positionKey = function () {
    let key = "";
    for (let r = 7; r >= 0; r--) {
      let empty = 0;
      for (let f = 0; f < 8; f++) {
        const p = this.board[idx(r, f)];
        if (!p) {
          empty++;
        } else {
          if (empty) {
            key += empty;
            empty = 0;
          }
          key += p.color === "w" ? p.type.toUpperCase() : p.type;
        }
      }
      if (empty) key += empty;
      if (r > 0) key += "/";
    }
    key += " " + this.turn;
    key += " " + (["K", "Q", "k", "q"].filter((c) => this.castlingRights[c]).join("") || "-");
    key += this.enPassantTarget >= 0 ? " " + squareName(this.enPassantTarget) : " -";
    return key;
  };

  // ── 走法產生（pseudo-legal）───────────────────────────────
  Chess.prototype.pseudoTargets = function (from, opts) {
    const piece = this.board[from];
    if (!piece) return [];
    opts = opts || {};
    const r = rankOf(from);
    const f = fileOf(from);
    const targets = [];

    switch (piece.type) {
      case "p": {
        const dir = piece.color === "w" ? -1 : 1;
        const startRank = piece.color === "w" ? 6 : 1;
        const one = idx(r + dir, f);
        if (onBoard(r + dir, f) && !this.board[one]) {
          targets.push(one);
          if (r === startRank) {
            const two = idx(r + 2 * dir, f);
            if (!this.board[two]) targets.push(two);
          }
        }
        for (const df of [-1, 1]) {
          const tr = r + dir;
          const tf = f + df;
          if (onBoard(tr, tf)) {
            const to = idx(tr, tf);
            const target = this.board[to];
            if (target && target.color !== piece.color) targets.push(to);
            else if (to === this.enPassantTarget) targets.push(to);
            else if (opts.forAttack) targets.push(to);
          }
        }
        break;
      }
      case "n": {
        const offs = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
        for (const [dr, df] of offs) {
          const tr = r + dr;
          const tf = f + df;
          if (onBoard(tr, tf)) {
            const to = idx(tr, tf);
            const t = this.board[to];
            if (!t || t.color !== piece.color) targets.push(to);
          }
        }
        break;
      }
      case "b":
        this.slide(from, r, f, targets, [[1, 1], [1, -1], [-1, 1], [-1, -1]]);
        break;
      case "r":
        this.slide(from, r, f, targets, [[1, 0], [-1, 0], [0, 1], [0, -1]]);
        break;
      case "q":
        this.slide(from, r, f, targets, [[1, 1], [1, -1], [-1, 1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]]);
        break;
      case "k": {
        const offs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (const [dr, df] of offs) {
          const tr = r + dr;
          const tf = f + df;
          if (onBoard(tr, tf)) {
            const to = idx(tr, tf);
            const t = this.board[to];
            if (!t || t.color !== piece.color) targets.push(to);
          }
        }
        break;
      }
    }
    return targets;
  };

  Chess.prototype.slide = function (from, r, f, targets, dirs) {
    const piece = this.board[from];
    for (const [dr, df] of dirs) {
      let tr = r + dr;
      let tf = f + df;
      while (onBoard(tr, tf)) {
        const to = idx(tr, tf);
        const t = this.board[to];
        if (!t) {
          targets.push(to);
        } else {
          if (t.color !== piece.color) targets.push(to);
          break;
        }
        tr += dr;
        tf += df;
      }
    }
  };

  // ── 王的安危 / 合法走法篩選 ───────────────────────────────
  Chess.prototype.findKing = function (color) {
    for (let i = 0; i < 64; i++) {
      const p = this.board[i];
      if (p && p.type === "k" && p.color === color) return i;
    }
    return -1;
  };

  Chess.prototype.attacked = function (square, byColor) {
    for (let i = 0; i < 64; i++) {
      const p = this.board[i];
      if (p && p.color === byColor) {
        const targets = this.pseudoTargets(i, { forAttack: true });
        if (targets.indexOf(square) !== -1) return true;
      }
    }
    return false;
  };

  Chess.prototype.kingInCheck = function (color) {
    const k = this.findKing(color);
    if (k === -1) return false;
    return this.attacked(k, color === "w" ? "b" : "w");
  };

  // 在棋盤上直接套用一步（用於合法走法驗證）。
  // 注意：王車易位不會經過這裡——易位目標格由 legalMoves() 用 canCastle() 驗證後
  // 直接加入合法走法清單，搬車動作則在 makeMove() 中執行，故此處無需處理易位。
  Chess.prototype.applyMoveOnBoard = function (from, to) {
    const piece = this.board[from];
    const isEnPassant = piece.type === "p" && to === this.enPassantTarget && fileOf(to) !== fileOf(from);
    this.board[to] = piece;
    this.board[from] = null;
    if (isEnPassant) {
      this.board[idx(rankOf(from), fileOf(to))] = null;
    }
  };

  Chess.prototype.isMoveLegal = function (from, to) {
    const piece = this.board[from];
    if (!piece) return false;
    const savedBoard = this.board;
    const savedEp = this.enPassantTarget;
    this.board = this.board.slice();
    this.applyMoveOnBoard(from, to);
    // 防護：若移動後己方王消失（例如嘗試吃掉敵王的不合法局面），視為不合法
    const kingSq = this.findKing(piece.color);
    const legal = kingSq !== -1 && !this.attacked(kingSq, piece.color === "w" ? "b" : "w");
    this.board = savedBoard;
    this.enPassantTarget = savedEp;
    return legal;
  };

  // 王的易位條件檢查
  Chess.prototype.canCastle = function (color, side) {
    const r = color === "w" ? 7 : 0;
    const flag = side === "k" ? (color === "w" ? "K" : "k") : (color === "w" ? "Q" : "q");
    if (!this.castlingRights[flag]) return false;
    if (this.kingInCheck(color)) return false;
    const attacker = color === "w" ? "b" : "w";

    if (side === "k") {
      if (this.board[idx(r, 5)] || this.board[idx(r, 6)]) return false;
      const rook = this.board[idx(r, 7)];
      if (!rook || rook.type !== "r" || rook.color !== color) return false;
      if (this.attacked(idx(r, 5), attacker)) return false;
      if (this.attacked(idx(r, 6), attacker)) return false;
      return true;
    }
    // 后翼易位
    if (this.board[idx(r, 3)] || this.board[idx(r, 2)] || this.board[idx(r, 1)]) return false;
    const rook = this.board[idx(r, 0)];
    if (!rook || rook.type !== "r" || rook.color !== color) return false;
    if (this.attacked(idx(r, 3), attacker)) return false;
    if (this.attacked(idx(r, 2), attacker)) return false;
    return true;
  };

  // 指定棋子的合法目標格子（含易位）
  Chess.prototype.legalMoves = function (from) {
    const piece = this.board[from];
    if (!piece || piece.color !== this.turn) return [];
    if (this.status === "checkmate" || this.status === "stalemate" || this.status === "draw") return [];

    const pseudo = this.pseudoTargets(from, {});
    const legal = [];
    for (const to of pseudo) {
      if (this.isMoveLegal(from, to)) legal.push(to);
    }
    if (piece.type === "k") {
      const r = rankOf(from);
      const homeRank = piece.color === "w" ? 7 : 0;
      if (r === homeRank) {
        if (this.canCastle(piece.color, "k")) legal.push(idx(homeRank, 6));
        if (this.canCastle(piece.color, "q")) legal.push(idx(homeRank, 2));
      }
    }
    return legal;
  };

  // 某一方所有合法走法
  Chess.prototype.allLegalMoves = function (color) {
    const moves = [];
    for (let i = 0; i < 64; i++) {
      const p = this.board[i];
      if (p && p.color === color) {
        const list = this.legalMoves(i);
        for (const to of list) moves.push({ from: i, to });
      }
    }
    return moves;
  };

  // 產生棋譜文字（長代數記譜）
  Chess.prototype.buildNotation = function (piece, from, to, captured, promote, isCastle, status) {
    const suffix = status === "checkmate" ? "#" : status === "check" ? "+" : "";
    if (isCastle) return (fileOf(to) === 6 ? "O-O" : "O-O-O") + suffix;
    let str;
    if (piece.type === "p") {
      str = captured ? FILES[fileOf(from)] + "x" + squareName(to) : squareName(from) + "-" + squareName(to);
    } else {
      str = piece.type.toUpperCase() + squareName(from) + (captured ? "x" : "-") + squareName(to);
    }
    if (promote) str += "=" + promote.toUpperCase();
    return str + suffix;
  };

  // ── 執行一步棋 ────────────────────────────────────────────
  Chess.prototype.makeMove = function (from, to, promotion) {
    if (this.status === "checkmate" || this.status === "stalemate" || this.status === "draw") {
      return { ok: false, reason: "Game over" };
    }
    const piece = this.board[from];
    if (!piece || piece.color !== this.turn) return { ok: false, reason: "Not your turn" };
    const legal = this.legalMoves(from);
    if (legal.indexOf(to) === -1) return { ok: false, reason: "Illegal move" };

    const captured = this.board[to];
    const isCastle = piece.type === "k" && Math.abs(fileOf(to) - fileOf(from)) === 2;
    const isEnPassant = piece.type === "p" && to === this.enPassantTarget && fileOf(to) !== fileOf(from);
    const promote =
      piece.type === "p" && (rankOf(to) === 0 || rankOf(to) === 7) ? promotion || "q" : null;

    // 悔棋用的快照
    const snapshot = {
      board: this.board.slice(),
      turn: this.turn,
      enPassantTarget: this.enPassantTarget,
      castlingRights: Object.assign({}, this.castlingRights),
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber,
      status: this.status,
      result: this.result
    };

    // 更新王車易位權
    if (piece.type === "k") {
      if (piece.color === "w") {
        this.castlingRights.K = false;
        this.castlingRights.Q = false;
      } else {
        this.castlingRights.k = false;
        this.castlingRights.q = false;
      }
    }
    const rookFlags = { h1: ["K"], a1: ["Q"], h8: ["k"], a8: ["q"] };
    const clearBySquare = (sq) => {
      const flags = rookFlags[sq];
      if (!flags) return;
      for (const flag of flags) this.castlingRights[flag] = false;
    };
    clearBySquare(squareName(from));
    clearBySquare(squareName(to));

    // 更新吃過路兵目標
    this.enPassantTarget = -1;
    if (piece.type === "p" && Math.abs(rankOf(to) - rankOf(from)) === 2) {
      this.enPassantTarget = idx((rankOf(from) + rankOf(to)) / 2, fileOf(from));
    }

    // 執行移動
    this.board[to] = promote ? { type: promote, color: piece.color } : piece;
    this.board[from] = null;
    if (isEnPassant) {
      this.board[idx(rankOf(from), fileOf(to))] = null;
    }
    if (isCastle) {
      const r = rankOf(from);
      if (fileOf(to) === 6) {
        this.board[idx(r, 5)] = this.board[idx(r, 7)];
        this.board[idx(r, 7)] = null;
      } else {
        this.board[idx(r, 3)] = this.board[idx(r, 0)];
        this.board[idx(r, 0)] = null;
      }
    }

    // 半回合計數
    if (piece.type === "p" || captured) this.halfmoveClock = 0;
    else this.halfmoveClock++;
    if (piece.color === "b") this.fullmoveNumber++;

    // 紀錄棋步
    this.history.push({
      from: from,
      to: to,
      pieceType: piece.type,
      color: piece.color,
      captured: captured ? captured.type : null,
      promote: promote,
      isCastle: isCastle,
      isEnPassant: isEnPassant,
      notation: "",
      snapshot: snapshot
    });

    // 換手並更新狀態（check / checkmate / stalemate / draw）
    this.turn = this.turn === "w" ? "b" : "w";
    // 記錄移動後產生之新局面，供三次重複判定（含輪到誰、易位權、過路兵狀態）
    this.positionHistory.push(this.positionKey());
    this.updateStatus();

    // 補上棋譜的 + / # 符號
    const last = this.history[this.history.length - 1];
    last.notation = this.buildNotation(piece, from, to, captured, promote, isCastle, this.status);

    return { ok: true, status: this.status, result: this.result };
  };

  // ── 棋局狀態判定 ──────────────────────────────────────────
  Chess.prototype.updateStatus = function () {
    const moves = this.allLegalMoves(this.turn);
    const inCheck = this.kingInCheck(this.turn);

    if (moves.length === 0) {
      if (inCheck) {
        this.status = "checkmate";
        this.result = this.turn === "w" ? "Black wins by checkmate" : "White wins by checkmate";
      } else {
        this.status = "stalemate";
        this.result = "Draw by stalemate";
      }
    } else if (this.halfmoveClock >= 100) {
      this.status = "draw";
      this.result = "Draw by fifty-move rule";
    } else if (this.isThreefoldRepetition()) {
      this.status = "draw";
      this.result = "Draw by threefold repetition";
    } else if (this.isInsufficientMaterial()) {
      this.status = "draw";
      this.result = "Draw by insufficient material";
    } else {
      this.status = inCheck ? "check" : "active";
      this.result = "";
    }
  };

  // 三次重複局面：當前局面（含輪到誰、易位權、過路兵目標）已出現至少 3 次
  Chess.prototype.isThreefoldRepetition = function () {
    const key = this.positionKey();
    let count = 0;
    for (let i = 0; i < this.positionHistory.length; i++) {
      if (this.positionHistory[i] === key) count++;
      if (count >= 3) return true;
    }
    return false;
  };

  Chess.prototype.isInsufficientMaterial = function () {
    const pieces = [];
    for (let i = 0; i < 64; i++) {
      const p = this.board[i];
      if (p) pieces.push({ type: p.type, color: p.color, square: i });
    }
    // 只要有兵、車或后，就一定有強迫將死的可能，不是不足子力
    if (pieces.some((x) => x.type === "p" || x.type === "r" || x.type === "q")) {
      return false;
    }
    const minors = pieces.filter((x) => x.type === "b" || x.type === "n");
    const bishops = pieces.filter((x) => x.type === "b");

    // K vs K
    if (pieces.length === 2) return true;
    // K+N vs K 或 K+B vs K（孤王 vs 單一輕子）
    if (pieces.length === 3 && minors.length === 1) return true;
    // 兩個輕子 vs 孤王
    if (pieces.length === 4 && minors.length === 2) {
      // 只要任一是騎士（K+N vs K+N、K+N vs K+B），即可強迫將死，不判和
      if (bishops.length !== 2) return false;
      const squareColor = (sq) => (rankOf(sq) + fileOf(sq)) % 2;
      if (bishops[0].color === bishops[1].color) {
        // 兩象同屬一方（K+B+B vs K）：只有兩象同在「同色格」時才是和棋，
        // 異色格仍可強制將死。
        return squareColor(bishops[0].square) === squareColor(bishops[1].square);
      }
      // 兩象分屬雙方（K+B vs K+B）：單象無法強迫將死孤王，必然是死局和棋，
      // 與兩象落在同色或異色格無關。
      return true;
    }
    return false;
  };

  // ── 悔棋（快照回復）──────────────────────────────────────
  Chess.prototype.undo = function () {
    const entry = this.history.pop();
    if (!entry) return false;
    const snap = entry.snapshot;
    // 每走成功的一步棋都會在 positionHistory 推入一個局面，
    // 悔棋時一併移除最後記錄的局面，維持三次重複計數一致。
    if (this.positionHistory.length > 0) this.positionHistory.pop();
    this.board = snap.board.slice();
    this.turn = snap.turn;
    this.enPassantTarget = snap.enPassantTarget;
    this.castlingRights = Object.assign({}, snap.castlingRights);
    this.halfmoveClock = snap.halfmoveClock;
    this.fullmoveNumber = snap.fullmoveNumber;
    this.status = snap.status;
    this.result = snap.result;
    return true;
  };

  Chess.prototype.getMoveHistory = function () {
    return this.history.map(function (entry) {
      return { notation: entry.notation, color: entry.color };
    });
  };

  Chess.prototype.historyLength = function () {
    return this.history.length;
  };

  // 支援 Node（測試用）與瀏覽器兩種環境
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Chess;
  }
  global.Chess = Chess;
})(typeof window !== "undefined" ? window : globalThis);
