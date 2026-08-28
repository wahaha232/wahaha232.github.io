// ═══════════════════════════════════════════════════════════════
// Solitaire Online — 遊戲引擎（Klondike）
// 與 UI 完全分離：此檔只處理牌堆狀態與規則邏輯。
// 支援：發牌、抽牌/回收、廢牌堆、桌面疊牌、四個基礎堆、
//       合法移動驗證、自動翻牌、計分、悔棋、勝利偵測。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  const SUITS = ["s", "h", "d", "c"]; // ♠ ♥ ♦ ♣
  const SUIT_SYMBOL = { s: "♠", h: "♥", d: "♦", c: "♣" };
  const SUIT_RED = { s: false, h: true, d: true, c: false };
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const RANK_VALUE = { A: 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, J: 11, Q: 12, K: 13 };

  Solitaire.glyph = function (suit) {
    return SUIT_SYMBOL[suit] || "";
  };

  function makeDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit: suit, rank: rank, faceUp: false });
      }
    }
    return deck;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function Solitaire() {
    this.reset();
  }

  Solitaire.prototype.reset = function () {
    const deck = shuffle(makeDeck());
    this.tableau = []; // 7 疊：每疊由下到上的卡陣列
    for (let i = 0; i < 7; i++) {
      const pile = [];
      for (let j = 0; j <= i; j++) {
        const card = deck.pop();
        card.faceUp = j === i;
        pile.push(card);
      }
      this.tableau.push(pile);
    }
    this.stock = deck; // 剩餘牌（蓋著）
    this.waste = []; // 廢牌堆（翻開），最後一張是頂端
    this.foundations = [[], [], [], []];
    this.history = [];
    this.moves = 0;
    this.score = 0;
    this.won = false;
  };

  Solitaire.prototype.newGame = function () {
    this.reset();
  };

  // ── 基本規則判定 ────────────────────────────────────────
  Solitaire.prototype.isRed = function (card) {
    return SUIT_RED[card.suit];
  };

  Solitaire.prototype.canPlaceOnTableau = function (card, pile) {
    if (pile.length === 0) return card.rank === "K";
    const top = pile[pile.length - 1];
    if (!top.faceUp) return false;
    return RANK_VALUE[top.rank] === RANK_VALUE[card.rank] + 1 && this.isRed(top) !== this.isRed(card);
  };

  Solitaire.prototype.canPlaceOnFoundation = function (card, foundation) {
    if (foundation.length === 0) return card.rank === "A";
    const top = foundation[foundation.length - 1];
    return top.suit === card.suit && RANK_VALUE[card.rank] === RANK_VALUE[top.rank] + 1;
  };

  // 檢查桌面某疊由 pos 到頂端的牌是否為合法「可移動序列」（由下到上：遞減、紅黑交替）
  Solitaire.prototype.isValidSequence = function (pile, pos) {
    for (let k = pos + 1; k < pile.length; k++) {
      const below = pile[k - 1];
      const above = pile[k];
      if (!above.faceUp) return false;
      if (RANK_VALUE[above.rank] !== RANK_VALUE[below.rank] - 1) return false;
      if (this.isRed(above) === this.isRed(below)) return false;
    }
    return true;
  };

  Solitaire.prototype.faceUpCount = function (pileIndex) {
    const pile = this.tableau[pileIndex];
    let count = 0;
    for (let i = pile.length - 1; i >= 0; i--) {
      if (pile[i].faceUp) count++;
      else break;
    }
    return count;
  };

  // ── 快照（悔棋用） ────────────────────────────────────────
  Solitaire.prototype.snapshot = function () {
    const copy = function (list) {
      return list.map(function (c) {
        return { suit: c.suit, rank: c.rank, faceUp: c.faceUp };
      });
    };
    return {
      tableau: this.tableau.map(copy),
      stock: copy(this.stock),
      waste: copy(this.waste),
      foundations: this.foundations.map(copy),
      moves: this.moves,
      score: this.score,
      won: this.won
    };
  };

  Solitaire.prototype.restore = function (snap) {
    const copy = function (list) {
      return list.map(function (c) {
        return { suit: c.suit, rank: c.rank, faceUp: c.faceUp };
      });
    };
    this.tableau = snap.tableau.map(copy);
    this.stock = copy(snap.stock);
    this.waste = copy(snap.waste);
    this.foundations = snap.foundations.map(copy);
    this.moves = snap.moves;
    this.score = snap.score;
    this.won = snap.won;
  };

  Solitaire.prototype.undo = function () {
    const snap = this.history.pop();
    if (!snap) return false;
    this.restore(snap);
    return true;
  };

  Solitaire.prototype.record = function () {
    this.history.push(this.snapshot());
    if (this.history.length > 200) this.history.shift();
  };

  Solitaire.prototype.flipTop = function (pileIndex) {
    const pile = this.tableau[pileIndex];
    if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
      pile[pile.length - 1].faceUp = true;
      this.score += 5;
    }
  };

  // ── 抽牌 / 回收 ───────────────────────────────────────────
  Solitaire.prototype.drawStock = function () {
    if (this.won) return { ok: false, reason: "won" };
    this.record();
    if (this.stock.length === 0) {
      // 回收廢牌堆回庫存
      if (this.waste.length === 0) return { ok: false, reason: "empty" };
      while (this.waste.length > 0) {
        const card = this.waste.pop();
        card.faceUp = false;
        this.stock.push(card);
      }
      this.moves++;
      return { ok: true, recycled: true };
    }
    const card = this.stock.pop();
    card.faceUp = true;
    this.waste.push(card);
    this.moves++;
    return { ok: true, recycled: false };
  };

  // ── 移動操作 ──────────────────────────────────────────────
  Solitaire.prototype.moveWasteToFoundation = function () {
    if (this.won || this.waste.length === 0) return { ok: false };
    const card = this.waste[this.waste.length - 1];
    for (let i = 0; i < 4; i++) {
      if (this.canPlaceOnFoundation(card, this.foundations[i])) {
        this.record();
        this.waste.pop();
        this.foundations[i].push(card);
        this.moves++;
        this.score += 10;
        this.checkWin();
        return { ok: true, foundation: i };
      }
    }
    return { ok: false };
  };

  Solitaire.prototype.moveWasteToTableau = function (toPile) {
    if (this.won || this.waste.length === 0) return { ok: false };
    const card = this.waste[this.waste.length - 1];
    if (!this.canPlaceOnTableau(card, this.tableau[toPile])) return { ok: false };
    this.record();
    this.waste.pop();
    this.tableau[toPile].push(card);
    this.moves++;
    this.score += 5;
    this.checkWin();
    return { ok: true };
  };

  Solitaire.prototype.moveTableauToFoundation = function (fromPile) {
    if (this.won) return { ok: false };
    const pile = this.tableau[fromPile];
    if (pile.length === 0) return { ok: false };
    const card = pile[pile.length - 1];
    if (!card.faceUp) return { ok: false };
    for (let i = 0; i < 4; i++) {
      if (this.canPlaceOnFoundation(card, this.foundations[i])) {
        this.record();
        pile.pop();
        this.flipTop(fromPile);
        this.foundations[i].push(card);
        this.moves++;
        this.score += 10;
        this.checkWin();
        return { ok: true, foundation: i };
      }
    }
    return { ok: false };
  };

  // 從桌面一疊的 pos（含）開始，把上方整段序列移到另一疊
  Solitaire.prototype.moveTableauToTableau = function (fromPile, pos, toPile) {
    if (this.won || fromPile === toPile) return { ok: false };
    const pile = this.tableau[fromPile];
    if (pos < 0 || pos >= pile.length) return { ok: false };
    if (!pile[pos].faceUp) return { ok: false };
    if (!this.isValidSequence(pile, pos)) return { ok: false };
    const first = pile[pos];
    if (!this.canPlaceOnTableau(first, this.tableau[toPile])) return { ok: false };

    this.record();
    const moving = pile.splice(pos);
    this.tableau[toPile] = this.tableau[toPile].concat(moving);
    this.flipTop(fromPile);
    this.moves++;
    this.score += 1;
    this.checkWin();
    return { ok: true };
  };

  Solitaire.prototype.moveFoundationToTableau = function (fromFoundation, toPile) {
    if (this.won) return { ok: false };
    const f = this.foundations[fromFoundation];
    if (f.length === 0) return { ok: false };
    const card = f[f.length - 1];
    if (!this.canPlaceOnTableau(card, this.tableau[toPile])) return { ok: false };
    this.record();
    f.pop();
    this.tableau[toPile].push(card);
    this.moves++;
    this.score -= 15;
    this.checkWin();
    return { ok: true };
  };

  // 自動把可放上基礎堆的牌放上去（雙擊 / 提示用）
  Solitaire.prototype.autoMoveToFoundation = function (fromPile) {
    if (this.won) return { ok: false };
    if (this.waste.length > 0) {
      const wasteCard = this.waste[this.waste.length - 1];
      for (let i = 0; i < 4; i++) {
        if (this.canPlaceOnFoundation(wasteCard, this.foundations[i])) {
          return this.moveWasteToFoundation();
        }
      }
    }
    const pile = this.tableau[fromPile];
    if (pile.length > 0 && pile[pile.length - 1].faceUp) {
      const card = pile[pile.length - 1];
      for (let i = 0; i < 4; i++) {
        if (this.canPlaceOnFoundation(card, this.foundations[i])) {
          return this.moveTableauToFoundation(fromPile);
        }
      }
    }
    return { ok: false };
  };

  Solitaire.prototype.checkWin = function () {
    if (this.won) return;
    for (let i = 0; i < 4; i++) {
      if (this.foundations[i].length !== 13) return;
    }
    this.won = true;
  };

  // 支援 Node（測試用）與瀏覽器
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Solitaire;
  }
  global.Solitaire = Solitaire;
})(typeof window !== "undefined" ? window : globalThis);
