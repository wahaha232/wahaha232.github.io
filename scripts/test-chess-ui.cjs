// ═══════════════════════════════════════════════════════════════
// Chess UI 層自動化測試（jsdom）
// 執行：npm test 或 node scripts/test-chess-ui.cjs
// 涵蓋：初始渲染、點擊選取/移動、鍵盤導覽（方向鍵 + Enter）、
//       升變選單 focus trap / Escape 關閉、New Game / Undo、
//       狀態列 aria-live 可及性。
// ═══════════════════════════════════════════════════════════════
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

let pass = 0;
function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

// ── 建立一個含完整棋盤 DOM、並載入真實引擎 + UI 的 jsdom 環境 ──
function makeApp() {
  const root = path.join(__dirname, "..");
  const html =
    '<!DOCTYPE html><html lang="en"><body>' +
    '<div class="chess-status" id="chess-status"></div>' +
    '<div class="chess-board" id="chess-board"></div>' +
    '<div class="chess-history" id="chess-history"></div>' +
    '<div class="promo-modal is-hidden" id="promo-modal">' +
    '<button class="promo-close" id="promo-close" type="button">×</button>' +
    '<div class="promo-pieces" id="promo-pieces"></div>' +
    "</div>" +
    '<button type="button" id="btn-new">New Game</button>' +
    '<button type="button" id="btn-undo">Undo</button>' +
    "</body></html>";
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
  const w = dom.window;
  w.eval(fs.readFileSync(path.join(root, "js", "chess.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(root, "js", "chess-ui.js"), "utf8"));
  // jsdom 不實作 window.confirm；New Game 需要它。這裡預設「確定」。
  w.confirm = function () {
    return true;
  };
  // jsdom 的 readyState 是 "loading"，UI 會把 init 訂在 DOMContentLoaded；
  // 這裡手動觸發，模擬瀏覽器解析完成後的事件。
  w.document.dispatchEvent(new w.Event("DOMContentLoaded", { bubbles: true }));
  return { win: w, doc: w.document };
}

function square(doc, i) {
  return doc.querySelector('.square[data-index="' + i + '"]');
}

function clickSquare(app, i) {
  square(app.doc, i).dispatchEvent(
    new app.win.MouseEvent("click", { bubbles: true, cancelable: true })
  );
}

function keyOn(el, win, key, shift) {
  el.dispatchEvent(
    new win.KeyboardEvent("keydown", {
      key: key,
      bubbles: true,
      cancelable: true,
      shiftKey: !!shift
    })
  );
}

// ── 1) 初始渲染 + 狀態列 aria-live 可及性 ──
{
  const app = makeApp();
  const d = app.doc;
  assert(d.querySelectorAll(".square").length === 64, "board renders 64 squares");
  const statusEl = d.getElementById("chess-status");
  assert(statusEl.textContent === "White to move", 'initial status = "White to move"');
  assert(statusEl.getAttribute("aria-live") === "polite", "status has aria-live=polite");
  assert(statusEl.getAttribute("aria-atomic") === "true", "status has aria-atomic=true");
  assert(parseInt(square(d, 0).getAttribute("tabindex"), 10) === 0, "squares are focusable (tabindex=0)");
  assert(square(d, 0).getAttribute("aria-label") === "a8", "squares have aria-label (a8)");
}

// ── 2) 點擊選取棋子，合法走法會高亮 ──
{
  const app = makeApp();
  const d = app.doc;
  clickSquare(app, 52); // e2 白兵
  assert(square(d, 52).classList.contains("selected"), "e2 pawn becomes selected on click");
  assert(square(d, 36).classList.contains("legal"), "e4 highlighted as legal target");
  assert(square(d, 44).classList.contains("legal"), "e3 highlighted as legal target");
  clickSquare(app, 24); // a5（空格）→ 取消選取
  assert(!square(d, 52).classList.contains("selected"), "clicking elsewhere deselects pawn");
}

// ── 3) 點擊移動：選 e2 → 點 e4，狀態翻轉、棋譜推進 ──
{
  const app = makeApp();
  const d = app.doc;
  clickSquare(app, 52);
  clickSquare(app, 36);
  assert(!square(d, 52).querySelector(".piece"), "e2 empty after pawn moved away");
  assert(square(d, 36).querySelector(".piece.piece-w"), "e4 now holds the white pawn");
  assert(d.getElementById("chess-status").textContent === "Black to move", 'status flips to "Black to move"');
  const rows = d.querySelectorAll("#chess-history .chess-history__row");
  assert(rows.length === 1, "history shows one move row");
  assert(rows[0].querySelector(".chess-history__move").textContent === "e2-e4", "history notation e2-e4");
}


// ── 4) 鍵盤：方向鍵移動焦點、Enter 選取/移動 ──
{
  const app = makeApp();
  const d = app.doc;
  keyOn(square(d, 52), app.win, "ArrowLeft"); // e2 -> d2
  assert(d.activeElement === square(d, 51), "ArrowLeft moves focus e2 -> d2");
  keyOn(square(d, 51), app.win, "ArrowUp");   // d2 -> d3
  assert(d.activeElement === square(d, 43), "ArrowUp moves focus d2 -> d3");
  keyOn(square(d, 43), app.win, "ArrowRight"); // d3 -> e3
  keyOn(square(d, 44), app.win, "ArrowDown");  // e3 -> e2
  assert(d.activeElement === square(d, 52), "arrow navigation returns to e2");
  keyOn(square(d, 52), app.win, "Enter");
  assert(square(d, 52).classList.contains("selected"), "Enter selects pawn on focused square");
  keyOn(square(d, 36), app.win, "Enter");
  assert(square(d, 36).querySelector(".piece.piece-w"), "Enter moves pawn to e4");
  assert(d.getElementById("chess-status").textContent === "Black to move", "keyboard move flips status");
}

// ── 5) New Game 按鈕 ──
{
  const app = makeApp();
  const d = app.doc;
  clickSquare(app, 52);
  clickSquare(app, 36);
  assert(d.getElementById("chess-status").textContent === "Black to move", "precondition: one move made");
  d.getElementById("btn-new").dispatchEvent(new app.win.MouseEvent("click", { bubbles: true }));
  assert(d.getElementById("chess-status").textContent === "White to move", 'New Game resets status to "White to move"');
  assert(square(d, 52).querySelector(".piece.piece-w"), "New Game restores initial board (e2 pawn back)");
}

// ── 6) Undo 按鈕 ──
{
  const app = makeApp();
  const d = app.doc;
  clickSquare(app, 52);
  clickSquare(app, 36);
  assert(!square(d, 52).querySelector(".piece"), "precondition: pawn moved off e2");
  d.getElementById("btn-undo").dispatchEvent(new app.win.MouseEvent("click", { bubbles: true }));
  assert(square(d, 52).querySelector(".piece.piece-w"), "Undo restores pawn to e2");
}


// ── 7) 升變：玩到升變格，選單開啟後 focus trap / Escape ──
{
  const app = makeApp();
  const d = app.doc;
  // 引擎驗證過的合法升變序列（白 a 兵一路推進並吃子升變）：
  // 1.a4 g6  2.a5 c5  3.a6 e6  4.axb7 a5  5.bxa8（落到升變格 a8）
  const moves = [
    [48, 32], [14, 22], // a2a4, g7g6
    [32, 24], [10, 26], // a4a5, c7c5
    [24, 16], [12, 20], // a5a6, e7e6
    [16, 9],  [8, 24],  // a6xb7, a7a5
    [9, 0]              // b7xa8 → 吃黑車並落到升變格 a8
  ];
  for (const [from, to] of moves) {
    clickSquare(app, from);
    clickSquare(app, to);
  }
  const modal = d.getElementById("promo-modal");
  assert(!modal.classList.contains("is-hidden"), "promotion modal opens when pawn reaches last rank");

  const buttons = Array.prototype.slice.call(modal.querySelectorAll("button"));
  assert(buttons.length === 5, "modal has close button + 4 promotion buttons");
  const closeBtn = buttons[0];
  const firstPromo = buttons[1];
  const lastPromo = buttons[4];
  assert(d.activeElement === firstPromo, "focus lands on first promotion button after opening");

  // focus trap（選單內所有 button：×、Q、R、B、N 之間循環）：
  // 在最後一顆升變按鈕（N）按 Tab → 繞回最前面的 ×
  lastPromo.focus();
  assert(d.activeElement === lastPromo, "last promotion button can be focused");
  keyOn(lastPromo, app.win, "Tab");
  assert(d.activeElement === closeBtn, "Tab from last button wraps to close button (focus trap)");

  // 在最前面的 × 按 Shift+Tab → 繞回最後一顆（選單不會被 Tab 逃出）
  closeBtn.focus();
  keyOn(closeBtn, app.win, "Tab", true);
  assert(d.activeElement === lastPromo, "Shift+Tab from close button wraps to last (focus trap)");

  // Escape 關閉選單
  keyOn(modal, app.win, "Escape");
  assert(modal.classList.contains("is-hidden"), "Escape closes promotion modal");

  // 再次開啟選單，直接點一顆升變按鈕完成升變
  clickSquare(app, 9); // 選 b7 白兵
  clickSquare(app, 0); // 點 a8 → 再次開啟升變選單
  assert(!modal.classList.contains("is-hidden"), "promotion modal reopens");
  const promoBtns2 = modal.querySelectorAll(".promo-btn");
  assert(promoBtns2.length === 4, "modal offers 4 promotion choices");
  promoBtns2[0].dispatchEvent(new app.win.MouseEvent("click", { bubbles: true })); // 選皇后
  assert(modal.classList.contains("is-hidden"), "picking a promotion piece closes modal");
  const promoted = square(d, 0).querySelector(".piece");
  assert(promoted && /Q|♛/.test(promoted.textContent) && promoted.classList.contains("piece-w"),
    "a8 holds a promoted white queen");
}

console.log("\nALL CHESS UI TESTS PASSED (" + pass + ")");

