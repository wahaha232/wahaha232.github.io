// Puzzle (2048) 引擎自動測試（node scripts/test-puzzle.cjs）
const Puzzle = require("../js/puzzle.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

// 1) 初始盤面
{
  const g = new Puzzle(4);
  assert(g.board.length === 16, "board has 16 cells");
  assert(g.board.filter((v) => v !== 0).length === 2, "two starting tiles");
  assert(g.board.every((v) => v === 0 || v === 2 || v === 4), "tiles are 0/2/4");
  assert(g.score === 0 && g.over === false && g.won === false, "clean initial state");
}

// 2) 向左合併
{
  const g = new Puzzle(4);
  g.board = [2, 2, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  g.score = 0;
  const r = g.move("left");
  assert(r.moved, "left move changes the board");
  assert(g.board[0] === 4 && g.board[1] === 8, "2,2,4,4 -> 4,8 at the left");
  assert(r.gained === 12, "gained 12 from the two merges");
  assert(g.board.filter((v) => v !== 0).length === 3, "one new tile added after a move");
}

// 3) 向下合併
{
  const g = new Puzzle(4);
  g.board = [2, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0];
  const r = g.move("down");
  assert(r.moved, "down move changes the board");
  assert(g.board[12] === 8 && g.board[8] === 4, "column merges toward the bottom");
}

// 4) 已靠邊且無法合併時不動
{
  const g = new Puzzle(4);
  g.board = [2, 4, 8, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const r = g.move("left");
  assert(r.moved === false, "no change when already packed with distinct tiles");
  assert(g.board[0] === 2 && g.board[3] === 16, "board unchanged");
}

// 5) 盤面無路可走 → over
{
  const g = new Puzzle(4);
  g.board = [2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2];
  g.updateStatus();
  assert(g.over === true, "full board with no merges is game over");
}

// 6) 達成 2048 標記勝利
{
  const g = new Puzzle(4);
  g.board = [1024, 1024, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  g.move("left");
  assert(g.board[0] === 2048, "1024+1024 -> 2048");
  assert(g.won === true, "reaching 2048 flags a win");
}

console.log("\nALL PUZZLE TESTS PASSED (" + pass + ")");
