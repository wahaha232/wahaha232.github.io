// ═══════════════════════════════════════════════════════════════
// Chess UI（西洋棋介面層）
// 負責：繪製棋盤、滑鼠/觸控操作、合法走法提示、升變選單、
//       狀態列、棋譜、New Game / Undo。
// 規則邏輯全部在 js/chess.js（Chess engine），這裡只呼叫公開方法。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var chess = new Chess();
  var boardEl = document.getElementById("chess-board");
  var statusEl = document.getElementById("chess-status");
  var historyEl = document.getElementById("chess-history");
  var promoModal = document.getElementById("promo-modal");
  var promoBox = document.getElementById("promo-pieces");

  var squares = [];
  var selected = -1;
  var legal = [];
  var lastFrom = -1;
  var lastTo = -1;
  var pendingPromotion = null; // { from, to }
  var promoLastFocus = null; // 開啟升變選單前的焦點（通常是觸發升變的兵格子）

  var FILES = "abcdefgh";
  var rankOf = function (i) { return Math.floor(i / 8); };
  var fileOf = function (i) { return i % 8; };
  var squareName = function (i) { return FILES[fileOf(i)] + String(8 - rankOf(i)); };

  function findKing(color) {
    for (var i = 0; i < 64; i++) {
      var p = chess.pieceAt(i);
      if (p && p.type === "k" && p.color === color) return i;
    }
    return -1;
  }

  function isGameOver() {
    return chess.status === "checkmate" || chess.status === "stalemate" || chess.status === "draw";
  }

  // ── 繪製棋盤 ──────────────────────────────────────────────
  function buildBoard() {
    boardEl.innerHTML = "";
    for (var i = 0; i < 64; i++) {
      var sq = document.createElement("div");
      sq.className = "square " + ((rankOf(i) + fileOf(i)) % 2 === 0 ? "light" : "dark");
      sq.dataset.index = i;
      // 可及性：每個格子都是可聚焦的 gridcell，支援鍵盤操作
      sq.setAttribute("role", "gridcell");
      sq.setAttribute("tabindex", "0");
      sq.setAttribute("aria-label", squareName(i));
      boardEl.appendChild(sq);
    }
    squares = Array.prototype.slice.call(boardEl.children);
  }

  function render() {
    // 清除標記
    for (var i = 0; i < 64; i++) {
      squares[i].classList.remove("selected", "legal", "capture", "last", "check");
      squares[i].innerHTML = "";
    }

    // 棋子
    for (var j = 0; j < 64; j++) {
      var p = chess.pieceAt(j);
      if (p) {
        squares[j].innerHTML =
          '<span class="piece piece-' + p.color + '" aria-hidden="true">' +
          Chess.glyph(p.type) + "&#xFE0E;</span>";
      }
    }

    // 座標：底列檔案字母、左欄數字
    for (var k = 0; k < 64; k++) {
      if (rankOf(k) === 7) {
        squares[k].innerHTML += '<span class="coord coord-file">' + FILES[fileOf(k)] + "</span>";
      }
      if (fileOf(k) === 0) {
        squares[k].innerHTML += '<span class="coord coord-rank">' + (8 - rankOf(k)) + "</span>";
      }
    }

    // 上一步高亮
    if (lastFrom >= 0) squares[lastFrom].classList.add("last");
    if (lastTo >= 0) squares[lastTo].classList.add("last");

    // 選取與合法走法提示
    if (selected >= 0) {
      squares[selected].classList.add("selected");
      for (var m = 0; m < legal.length; m++) {
        if (chess.pieceAt(legal[m])) squares[legal[m]].classList.add("capture");
        else squares[legal[m]].classList.add("legal");
      }
    }

    // 被將軍/將殺的王
    if (chess.status === "check" || chess.status === "checkmate") {
      var king = findKing(chess.turn);
      if (king >= 0) squares[king].classList.add("check");
    }

    renderStatus();
    renderHistory();
  }

  function renderStatus() {
    var colorName = chess.turn === "w" ? "White" : "Black";
    var msg;
    if (chess.status === "checkmate") {
      msg = "Checkmate — " + (chess.turn === "w" ? "Black" : "White") + " wins!";
    } else if (chess.status === "stalemate") {
      msg = "Stalemate — Draw";
    } else if (chess.status === "draw") {
      msg = "Draw — " + chess.result;
    } else if (chess.status === "check") {
      msg = colorName + " is in check!";
    } else {
      msg = colorName + " to move";
    }
    statusEl.textContent = msg;
    statusEl.className =
      "chess-status" +
      (chess.status === "checkmate" ? " is-over" : "") +
      (chess.status === "check" ? " is-check" : "");
  }

  function renderHistory() {
    var moves = chess.getMoveHistory();
    if (moves.length === 0) {
      historyEl.innerHTML = '<p class="chess-history__empty">No moves yet.</p>';
      return;
    }
    var html = "";
    for (var i = 0; i < moves.length; i += 2) {
      var num = i / 2 + 1;
      html += '<div class="chess-history__row"><span class="chess-history__num">' + num + ".</span>";
      html += '<span class="chess-history__move">' + moves[i].notation + "</span>";
      if (moves[i + 1]) html += '<span class="chess-history__move">' + moves[i + 1].notation + "</span>";
      html += "</div>";
    }
    historyEl.innerHTML = html;
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  // ── 操作 ──────────────────────────────────────────────────
  function doMove(from, to, promotion) {
    var res = chess.makeMove(from, to, promotion);
    if (res.ok) {
      lastFrom = from;
      lastTo = to;
    }
    selected = -1;
    legal = [];
    pendingPromotion = null;
    hidePromotion();
    render();
  }

  function onSquareClick(i) {
    if (isGameOver()) {
      selected = -1;
      legal = [];
      render();
      return;
    }
    var piece = chess.pieceAt(i);

    // 已選棋子且點擊的是合法目標 → 移動（先檢查升變）
    if (selected >= 0 && legal.indexOf(i) !== -1) {
      var from = selected;
      var moving = chess.pieceAt(from);
      var isPromo = moving && moving.type === "p" && (rankOf(i) === 0 || rankOf(i) === 7);
      if (isPromo) {
        pendingPromotion = { from: from, to: i };
        showPromotion(chess.turn);
        return;
      }
      doMove(from, i);
      return;
    }

    // 選取自己的棋子
    if (piece && piece.color === chess.turn) {
      selected = i;
      legal = chess.legalMoves(i);
    } else {
      selected = -1;
      legal = [];
    }
    render();
  }

  // ── 鍵盤操作（可及性）──────────────────────────────────────
  // 依畫面方向移動焦點：↑↓= 前一列/後一列，←→ = 前一格/後一格
  function moveFocus(i, dr, df) {
    var r = rankOf(i) + dr;
    var f = fileOf(i) + df;
    if (r < 0 || r > 7 || f < 0 || f > 7) return;
    var target = squares[r * 8 + f];
    if (target) target.focus();
  }

  function onBoardKeydown(event) {
    var sq = event.target.closest ? event.target.closest(".square") : null;
    if (!sq) return;
    // 升變選單開啟時，鍵盤事件由 #promo-modal 自己的 handler 處理
    //（Escape 關閉、Tab 焦點鎖定），這裡忽略棋盤操作。
    if (promoModal && !promoModal.classList.contains("is-hidden")) return;
    var key = event.key;
    var i = parseInt(sq.dataset.index, 10);
    var handled = true;
    if (key === "Enter" || key === " " || key === "Spacebar") {
      onSquareClick(i);
    } else if (key === "ArrowUp") {
      moveFocus(i, -1, 0);
    } else if (key === "ArrowDown") {
      moveFocus(i, 1, 0);
    } else if (key === "ArrowLeft") {
      moveFocus(i, 0, -1);
    } else if (key === "ArrowRight") {
      moveFocus(i, 0, 1);
    } else {
      handled = false;
    }
    if (handled) event.preventDefault();
  }

  // ── 升變選單 ──────────────────────────────────────────────
  // 升變選單的鍵盤處理：Escape 關閉、Tab/Shift+Tab 焦點鎖定在選單內
  function onPromotionKeydown(event) {
    if (!promoModal || promoModal.classList.contains("is-hidden")) return;
    var key = event.key;
    if (key === "Escape") {
      event.preventDefault();
      hidePromotion();
      return;
    }
    if (key !== "Tab") return;
    // focus trap：只允許在選單的互動元素（× 與 4 顆升變按鈕）之間移動焦點
    var focusables = promoModal.querySelectorAll("button");
    if (focusables.length === 0) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var active = document.activeElement;
    // 焦點已不在選單內（或位於首/末元素）時，繞回另一端，確保焦點不會跑出選單
    if (event.shiftKey) {
      if (active === first || !promoModal.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !promoModal.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function showPromotion(color) {
    if (!promoModal || !promoBox) return;
    // 記住開啟前所在的格子，關閉時把焦點還給它（方便鍵盤使用者繼續操作棋盤）
    promoLastFocus =
      document.activeElement && document.activeElement.classList &&
      document.activeElement.classList.contains("square")
        ? document.activeElement
        : null;
    promoBox.innerHTML = "";
    var types = ["q", "r", "b", "n"];
    for (var i = 0; i < types.length; i++) {
      (function (type) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "promo-btn";
        btn.innerHTML =
          '<span class="piece piece-' + color + '">' + Chess.glyph(type) + "&#xFE0E;</span>" +
          '<span class="promo-btn__label">' + type.toUpperCase() + "</span>";
        btn.addEventListener("click", function () {
          if (pendingPromotion) {
            doMove(pendingPromotion.from, pendingPromotion.to, type);
          }
        });
        promoBox.appendChild(btn);
      })(types[i]);
    }
    promoModal.classList.remove("is-hidden");
    // 鍵盤使用者：開啟選單後直接聚焦第一個升變按鈕
    var firstBtn = promoBox.querySelector("button");
    if (firstBtn) firstBtn.focus();
  }

  function hidePromotion() {
    var wasOpen = promoModal && !promoModal.classList.contains("is-hidden");
    if (promoModal) promoModal.classList.add("is-hidden");
    pendingPromotion = null; // 關閉選單時一併清除，避免殘留狀態
    // 一併清除畫面選取狀態（含合法走法標示），避免關閉升變選單後殘留高亮
    selected = -1;
    legal = [];
    render();
    // 把焦點還給開啟選單前的格子（若選單原本是開啟狀態）
    if (wasOpen && promoLastFocus && typeof promoLastFocus.focus === "function") {
      promoLastFocus.focus();
    }
    promoLastFocus = null;
  }

  // ── 按鈕事件 ──────────────────────────────────────────────
  function wireControls() {
    var newBtn = document.getElementById("btn-new");
    var undoBtn = document.getElementById("btn-undo");
    var promoClose = document.getElementById("promo-close");

    if (newBtn) {
      newBtn.addEventListener("click", function () {
        if (chess.historyLength() > 0 && !window.confirm("Start a new game? Current game will be lost.")) {
          return;
        }
        chess.newGame();
        selected = -1;
        legal = [];
        lastFrom = -1;
        lastTo = -1;
        pendingPromotion = null;
        hidePromotion();
        render();
      });
    }

    if (undoBtn) {
      undoBtn.addEventListener("click", function () {
        chess.undo();
        selected = -1;
        legal = [];
        lastFrom = -1;
        lastTo = -1;
        pendingPromotion = null;
        hidePromotion();
        render();
      });
    }

    if (promoClose) promoClose.addEventListener("click", hidePromotion);
  }

  // ── 初始化 ────────────────────────────────────────────────
  function init() {
    if (!boardEl) return;
    buildBoard();
    wireControls();
    // 可及性：狀態列加入 aria-live（禮貌性），螢幕報讀器使用者能自動聽到
    // 將軍/將殺/和棋等狀態變化。即使 HTML 忘了帶屬性，這裡也能兜底。
    if (statusEl) {
      statusEl.setAttribute("role", "status");
      statusEl.setAttribute("aria-live", "polite");
      statusEl.setAttribute("aria-atomic", "true");
    }
    boardEl.addEventListener("click", function (event) {
      var sq = event.target.closest ? event.target.closest(".square") : null;
      if (!sq) return;
      onSquareClick(parseInt(sq.dataset.index, 10));
    });
    boardEl.addEventListener("keydown", onBoardKeydown);
    // 升變選單的鍵盤處理（Escape 關閉 + Tab 焦點鎖定）由選單自身接收，
    // 因為焦點會在開啟後移到選單內的按鈕上（不在棋盤內）。
    if (promoModal) promoModal.addEventListener("keydown", onPromotionKeydown);
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
