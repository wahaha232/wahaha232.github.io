// Sliding Puzzle 引擎自動測試（node scripts/test-sliding.cjs）
const Sliding = require("../js/puzzle-sliding.js");
let pass = 0;
function assert(c, l) { if (!c) { console.error("FAIL: " + l); process.exit(1); } pass++; console.log("PASS: " + l); }

// 1) 盤面
{
  const g = new Sliding(4);
  assert(g.board.length === 16, "4x4 = 16 cells");
  assert(g.board.filter((v) => v !== 0).length === 15, "15 numbered tiles");
  assert(g.board.indexOf(0) >= 0, "exactly one blank (0)");
  assert(g.isSolved() === false || g.moves === 0, "freshly shuffled board");
}

// 2) 完成判定
{
  const g = new Sliding(3);
  g.board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  assert(g.isSolved() === true, "ordered board is solved");
  g.board = [1, 2, 3, 4, 5, 6, 7, 0, 8];
  assert(g.isSolved() === false, "unordered board is not solved");
}

// 3) 只能移動相鄰磚
{
  const g = new Sliding(3);
  g.board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  assert(g.moveIndex(7) === true, "adjacent tile slides into the blank");
  assert(g.board[8] === 8 && g.board[7] === 0, "blank and tile swapped");
  g.board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  assert(g.moveIndex(0) === false, "non-adjacent tile cannot move");
}

// 4) 方向移動（空格於中央）
{
  const g = new Sliding(3);
  g.board = [1, 2, 3, 4, 0, 6, 7, 8, 5]; // blank at index 4
  assert(g.moveDir("up") === true, "blank can move up from the centre");
  assert(g.board[4] === 8 && g.board[7] === 0, "up swaps blank with the tile below");
}

console.log("\nALL SLIDING TESTS PASSED (" + pass + ")");
