// 西洋跳棋引擎測試（node scripts/test-checkers.cjs）
const Checkers = require("../js/checkers.js");
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
  const c = new Checkers();
  c.board = new Array(64).fill(null);
  c.turn = "b";
  c.status = "active";
  c.result = "";
  c.history = [];
  c.forcedFrom = -1;
  c.lastFrom = -1;
  c.lastTo = -1;
  return c;
}

// ── 1) 初始局面：雙方各 12 顆，黑先手 ──
{
  const c = new Checkers();
  let b = 0;
  let w = 0;
  for (const p of c.board) {
    if (p && p.color === "b") b++;
    if (p && p.color === "w") w++;
  }
  assert(b === 12, "initial: 12 black pieces");
  assert(w === 12, "initial: 12 white pieces");
  assert(c.turn === "b", "black moves first");
}

// ── 2) 一般走法：黑子往前斜走一格 ──
{
  const c = emptyGame();
  c.board[idx(2, 2)] = { type: "man", color: "b" };
  const legal = c.legalMoves(idx(2, 2));
  assert(legal.indexOf(idx(3, 1)) !== -1 && legal.indexOf(idx(3, 3)) !== -1, "man has 2 forward-diagonal moves");
  const res = c.makeMove(idx(2, 2), idx(3, 1));
  assert(res.ok === true, "simple move accepted");
  assert(c.board[idx(3, 1)].color === "b", "piece moved to target square");
  assert(c.turn === "w", "turn passes after a simple move");
}

// ── 3) 強制吃子：盤面上任一顆子能跳吃時，其他子不能走一般步 ──
{
  const c = emptyGame();
  c.board[idx(2, 2)] = { type: "man", color: "b" }; // A：只有一般步可走
  c.board[idx(4, 4)] = { type: "man", color: "b" }; // B：可以跳吃
  c.board[idx(5, 5)] = { type: "man", color: "w" }; // 被 B 跳吃的對象
  assert(c.legalMoves(idx(2, 2)).length === 0, "non-capturing piece has no legal moves when a capture exists elsewhere");
  const res = c.makeMove(idx(2, 2), idx(3, 1));
  assert(res.ok === false, "attempting a simple move while a capture is mandatory is rejected");
}

// ── 4) 基本跳吃：吃掉中間棋子，落地格為空 ──
{
  const c = emptyGame();
  c.board[idx(4, 4)] = { type: "man", color: "b" };
  c.board[idx(5, 5)] = { type: "man", color: "w" };
  const res = c.makeMove(idx(4, 4), idx(6, 6));
  assert(res.ok === true, "capture move accepted");
  assert(c.board[idx(5, 5)] === null, "captured piece removed from board");
  assert(c.board[idx(6, 6)].color === "b", "capturing piece lands on target square");
  assert(res.mustContinue === false, "no further capture available, turn ends");
  assert(c.turn === "w", "turn passes after the capture");
}

// ── 5) 強制連續跳吃：同一顆子還能再跳時，回合不結束、只能繼續動它 ──
{
  const c = emptyGame();
  c.board[idx(2, 2)] = { type: "man", color: "b" }; // 主角：連續跳兩次
  c.board[idx(3, 3)] = { type: "man", color: "w" };
  c.board[idx(5, 5)] = { type: "man", color: "w" };
  c.board[idx(0, 1)] = { type: "man", color: "b" }; // 旁觀者：跳吃期間不能動它

  const first = c.makeMove(idx(2, 2), idx(4, 4));
  assert(first.ok === true, "first jump accepted");
  assert(first.mustContinue === true, "another capture is available, must continue same piece");
  assert(c.turn === "b", "turn does not pass mid-chain");
  assert(c.forcedFrom === idx(4, 4), "forced to continue moving the same piece");

  assert(c.legalMoves(idx(0, 1)).length === 0, "other pieces cannot move while a capture chain is forced");
  const blocked = c.makeMove(idx(0, 1), idx(1, 0));
  assert(blocked.ok === false, "moving a different piece mid-chain is rejected");

  const second = c.makeMove(idx(4, 4), idx(6, 6));
  assert(second.ok === true, "second jump in the chain accepted");
  assert(second.mustContinue === false, "no further capture, chain ends");
  assert(c.turn === "w", "turn passes once the whole chain is done");
  assert(c.board[idx(3, 3)] === null && c.board[idx(5, 5)] === null, "both jumped pieces were captured");
  assert(c.history.length === 1, "the whole multi-jump turn only pushed a single undo snapshot");
}

// ── 6) 升王讓回合立刻結束，即使升王後理論上還能再跳 ──
{
  const c = emptyGame();
  c.board[idx(5, 3)] = { type: "man", color: "b" };
  c.board[idx(6, 4)] = { type: "man", color: "w" }; // 被跳吃
  c.board[idx(6, 6)] = { type: "man", color: "w" }; // 升王後理論上可再跳吃的對象
  const res = c.makeMove(idx(5, 3), idx(7, 5));
  assert(res.ok === true, "capture into the back row accepted");
  assert(c.board[idx(7, 5)].type === "king", "piece is crowned upon reaching the back row");
  assert(res.mustContinue === false, "crowning ends the turn even if another capture would exist");
  assert(c.turn === "w", "turn passes immediately after crowning");
  assert(c.board[idx(6, 6)] && c.board[idx(6, 6)].color === "w", "the still-available second capture target is untouched");
}

// ── 7) King 可以往前後任一斜角走 ──
{
  const c = emptyGame();
  c.board[idx(4, 4)] = { type: "king", color: "b" };
  const legal = c.legalMoves(idx(4, 4));
  assert(legal.indexOf(idx(5, 3)) !== -1 && legal.indexOf(idx(5, 5)) !== -1, "king can move forward");
  assert(legal.indexOf(idx(3, 3)) !== -1 && legal.indexOf(idx(3, 5)) !== -1, "king can also move backward");
}

// ── 8) 有子但完全無路可走 → 判負 ──
{
  const c = emptyGame();
  c.board[idx(7, 0)] = { type: "man", color: "b" }; // 黑子在底線，前進方向出界，無路可走
  c.turn = "b";
  c.updateStatus();
  assert(c.status === "over", "a black piece with zero legal moves ends the game");
  assert(c.result.indexOf("White wins") !== -1, "White wins when Black is blocked");
  assert(c.result.indexOf("no legal moves") !== -1, "result explains it was a block, not a wipeout");
}

// ── 9) 棋子被吃光 → 判負 ──
{
  const c = emptyGame();
  c.board[idx(5, 5)] = { type: "man", color: "w" };
  c.turn = "b"; // 黑方無任何棋子
  c.updateStatus();
  assert(c.status === "over", "a side with zero pieces ends the game");
  assert(c.result.indexOf("White wins") !== -1, "White wins when Black has no pieces left");
  assert(c.result.indexOf("no pieces left") !== -1, "result explains it was a wipeout, not a block");
}

// ── 10) Undo 一次還原整個連續跳吃回合 ──
{
  const c = emptyGame();
  c.board[idx(2, 2)] = { type: "man", color: "b" };
  c.board[idx(3, 3)] = { type: "man", color: "w" };
  c.board[idx(5, 5)] = { type: "man", color: "w" };
  const before = c.board.map((p) => (p ? { type: p.type, color: p.color } : null));

  c.makeMove(idx(2, 2), idx(4, 4));
  c.makeMove(idx(4, 4), idx(6, 6));
  assert(c.turn === "w", "precondition: chain finished, turn passed");

  const ok = c.undo();
  assert(ok === true, "undo reports success");
  assert(c.turn === "b", "undo restores black to move");
  assert(c.forcedFrom === -1, "undo clears any forced-continue state");
  assert(JSON.stringify(c.board) === JSON.stringify(before), "undo restores the board from before the whole chain");
  assert(c.history.length === 0, "undo pops the single snapshot for the whole turn");
}

console.log("\nALL CHECKERS TESTS PASSED (" + pass + ")");
