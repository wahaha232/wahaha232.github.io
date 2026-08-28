// 磨坊棋（Nine Men's Morris）引擎測試（node scripts/test-morris.cjs）
const Morris = require("../js/morris.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

// ── 1) 棋盤結構：24 點、鄰接度數正確、16 條三連線 ──
{
  const deg = Morris.ADJACENCY.map((a) => a.length);
  const corners = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  const ringSpokes = [1, 3, 5, 7, 17, 19, 21, 23]; // 外/內圈的輻條端點
  const midSpokes = [9, 11, 13, 15]; // 中圈的輻條端點（連兩側）
  assert(Morris.POINTS.length === 24, "board has 24 points");
  assert(corners.every((i) => deg[i] === 2), "every ring corner has degree 2");
  assert(ringSpokes.every((i) => deg[i] === 3), "outer/inner ring spoke points have degree 3");
  assert(midSpokes.every((i) => deg[i] === 4), "middle ring spoke points have degree 4");
  assert(Morris.MILL_LINES.length === 16, "board has exactly 16 mill lines");
  assert(Morris.MILL_LINES.every((l) => l.length === 3), "every mill line has exactly 3 points");
}

// ── 2) 擺子輪流、扣減剩餘數量 ──
{
  const g = new Morris();
  const res = g.place(0);
  assert(res.ok === true, "first placement accepted");
  assert(g.board[0] === "b", "point 0 now holds a black piece");
  assert(g.toPlace.b === 8, "black's remaining pieces to place decreases");
  assert(g.turn === "w", "turn passes to white after placing");
}

// ── 3) 擺子湊成三連線 → 必須先移除對手一顆棋子才能換手 ──
{
  const g = new Morris();
  g.place(0); // b
  g.place(10); // w（不相關的點）
  g.place(1); // b
  g.place(11); // w
  const res = g.place(2); // b：0-1-2 是一條 mill line
  assert(res.ok === true, "third placement completing the mill is accepted");
  assert(res.mill === true, "completing 0-1-2 is reported as a mill");
  assert(g.pendingRemoval === true, "forming a mill requires a removal before continuing");
  assert(g.turn === "b", "turn does not pass while a removal is pending");

  const blocked = g.place(3);
  assert(blocked.ok === false, "further placement is rejected while a removal is pending");

  const rm = g.remove(11);
  assert(rm.ok === true, "removing an opponent piece is accepted");
  assert(g.board[11] === null, "removed piece is cleared from the board");
  assert(g.pendingRemoval === false, "removal clears the pending flag");
  assert(g.turn === "w", "turn passes once the removal is resolved");
}

// ── 4) 對手全部棋子都在 mill 裡時才能移除 mill 裡的棋子 ──
{
  const g = new Morris();
  g.board[8] = "w";
  g.board[9] = "w";
  g.board[10] = "w"; // 8-9-10 是白方的 mill，且是白方僅有的棋子
  assert(g.removablePieces("w").length === 3, "with no non-mill pieces, mill pieces become removable");

  g.board[20] = "w"; // 加一顆非 mill 的白子
  const removable = g.removablePieces("w");
  assert(removable.length === 1 && removable[0] === 20, "a non-mill piece exists, so only it is removable");
}

// ── 5) 擺子階段結束（雙方各放完 9 顆）自動進入移動階段 ──
{
  const g = new Morris();
  g.toPlace = { b: 1, w: 0 };
  g.phase = "placing";
  g.turn = "b";
  const res = g.place(5);
  assert(res.ok === true, "final placement of the placing phase accepted");
  assert(g.phase === "moving", "phase switches to moving once both sides have placed all 9 pieces");
}

// ── 6) 移動階段：只能滑到相鄰的空點 ──
{
  const g = new Morris();
  g.board = new Array(24).fill(null);
  g.board[0] = "b";
  g.phase = "moving";
  g.turn = "b";
  const legal = g.legalMoves(0);
  assert(legal.length === 2 && legal.indexOf(1) !== -1 && legal.indexOf(7) !== -1, "point 0 can slide to its two adjacent points (1 and 7)");
}

// ── 7) 只剩 3 顆棋子時進入飛子：可以飛到任何空點 ──
{
  const g = new Morris();
  g.board = new Array(24).fill(null);
  g.board[0] = "b";
  g.board[1] = "b";
  g.board[2] = "b"; // 剛好 3 顆
  g.phase = "moving";
  g.turn = "b";
  const legal = g.legalMoves(0);
  assert(legal.length === 21, "with exactly 3 pieces, a piece can fly to any of the 21 empty points");
  assert(legal.indexOf(16) !== -1, "flying allows landing on a non-adjacent point");
}

// ── 8) 對手剩 2 顆棋子 → 判負 ──
{
  const g = new Morris();
  g.board = new Array(24).fill(null);
  g.board[0] = "b";
  g.board[1] = "b";
  g.phase = "moving";
  g.turn = "b";
  g.updateStatus();
  assert(g.status === "over", "two remaining pieces ends the game");
  assert(g.result.indexOf("White wins") !== -1, "White wins when Black is down to 2 pieces");
}

// ── 9) 移動階段完全無路可走 → 判負（非飛子情況） ──
{
  const g = new Morris();
  g.board = new Array(24).fill(null);
  // 黑方 4 顆分散的角落棋子，鄰接點全部被白方佔滿，讓黑方完全無路可走
  g.board[0] = "b";
  g.board[4] = "b";
  g.board[8] = "b";
  g.board[12] = "b";
  [1, 7, 3, 5, 9, 15, 11, 13].forEach((i) => { g.board[i] = "w"; });
  g.phase = "moving";
  g.turn = "b";
  g.updateStatus();
  assert(g.status === "over", "a fully blocked side (not flying) ends the game");
  assert(g.result.indexOf("White wins") !== -1, "White wins when Black has no legal moves");
  assert(g.result.indexOf("no legal moves") !== -1, "result explains it was a block, not a wipeout");
}

// ── 10) Undo 還原上一步（擺子與移除都算） ──
{
  const g = new Morris();
  g.place(0);
  g.place(10);
  g.place(1);
  g.place(11);
  g.place(2); // 形成 mill，pendingRemoval
  g.remove(11);
  assert(g.turn === "w", "precondition: mill resolved, turn passed to white");

  const ok = g.undo();
  assert(ok === true, "undo (of the removal) reports success");
  assert(g.board[11] === "w", "undo restores the removed piece");
  assert(g.pendingRemoval === true, "undo restores the pending-removal state");
  assert(g.turn === "b", "undo restores the turn to before the removal");
}

console.log("\nALL NINE MEN'S MORRIS TESTS PASSED (" + pass + ")");
