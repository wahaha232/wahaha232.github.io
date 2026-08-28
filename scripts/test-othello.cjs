// 黑白棋引擎測試（node scripts/test-othello.cjs）
const Othello = require("../js/othello.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

function idx(r, f) {
  return r * 8 + f;
}

function emptyGame() {
  const o = new Othello();
  o.board = new Array(64).fill(null);
  o.turn = "b";
  o.status = "active";
  o.result = "";
  o.history = [];
  o.lastMove = -1;
  o.passedLastTurn = false;
  return o;
}

// ── 1) 初始局面：標準開局黑方有 4 個合法走法 ──
{
  const o = new Othello();
  assert(o.board[idx(3, 3)] === "w", "initial: d4-equivalent is white");
  assert(o.board[idx(4, 4)] === "w", "initial: e5-equivalent is white");
  assert(o.board[idx(3, 4)] === "b", "initial: e4-equivalent is black");
  assert(o.turn === "b", "black moves first");
  assert(o.legalMoves("b").length === 4, "black has 4 legal opening moves");
}

// ── 2) 落子會正確翻面（手動構造一個簡單的三子夾擊）──
{
  const o = emptyGame();
  o.board[idx(3, 2)] = "b";
  o.board[idx(3, 3)] = "w";
  const res = o.makeMove(idx(3, 4));
  assert(res.ok === true, "bracketed move is accepted");
  assert(o.board[idx(3, 4)] === "b", "played square becomes black");
  assert(o.board[idx(3, 3)] === "b", "bracketed white disc flips to black");
  assert(o.turn === "w", "turn passes to white after a valid move");
}

// ── 3) 沒有夾擊任何一排的落子視為不合法 ──
{
  const o = emptyGame();
  o.board[idx(3, 2)] = "b";
  const res = o.makeMove(idx(5, 5)); // 孤立空格，四周無棋子可夾
  assert(res.ok === false, "move with no bracketed line is rejected");
}

// ── 4) 一方無合法走法時自動 pass，換對手繼續 ──
{
  const o = emptyGame();
  // row0: w b b [empty] ...；白方在 E 可夾兩顆黑子，黑方在 E 無合法走法
  // （E 唯一相鄰的非空格 idx(0,2) 是黑子本身顏色，其餘方向皆為空）
  o.board[idx(0, 0)] = "w";
  o.board[idx(0, 1)] = "b";
  o.board[idx(0, 2)] = "b";
  o.turn = "b";
  o.updateStatus();
  assert(o.turn === "w", "black has no legal move here, auto-passes to white");
  assert(o.passedLastTurn === true, "passedLastTurn flag set after an auto-pass");
  assert(o.status === "active", "game stays active after a single-side pass");
}

// ── 5) 雙方都無合法走法 → 遊戲結束，依棋子數判定勝負 ──
{
  const o = emptyGame();
  o.board[idx(0, 0)] = "b";
  o.board[idx(0, 1)] = "b";
  o.board[idx(0, 2)] = "b";
  o.turn = "b";
  o.updateStatus();
  assert(o.status === "over", "neither side can move anywhere = game over");
  assert(o.result === "Black wins", "3 black discs vs 0 white = Black wins");
}

// ── 6) Undo 還原到落子前的局面 ──
{
  const o = new Othello();
  const before = o.board.slice();
  const moves = o.legalMoves("b");
  const res = o.makeMove(moves[0]);
  assert(res.ok === true, "opening move accepted");
  const ok = o.undo();
  assert(ok === true, "undo reports success");
  assert(o.turn === "b", "undo restores black to move");
  assert(JSON.stringify(o.board) === JSON.stringify(before), "undo restores original board");
}

console.log("\nALL OTHELLO TESTS PASSED (" + pass + ")");
