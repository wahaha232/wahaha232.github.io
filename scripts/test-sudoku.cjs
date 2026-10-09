// Sudoku 引擎自動測試（node scripts/test-sudoku.cjs）
const Sudoku = require("../js/sudoku.js");
let pass = 0;
function assert(c, l) { if (!c) { console.error("FAIL: " + l); process.exit(1); } pass++; console.log("PASS: " + l); }

// 1) 產生終盤
{
  const g = new Sudoku("easy");
  assert(g.solution.length === 81, "solution has 81 cells");
  assert(g.solution.indexOf(0) === -1, "solution is fully filled");
  assert(g.board.length === 81, "board has 81 cells");
  assert(g.puzzle.some((v) => v === 0), "puzzle has empty squares");
}

// 2) 題目線索固定
{
  const g = new Sudoku("easy");
  const given = g.puzzle.findIndex((v) => v !== 0);
  assert(given >= 0, "there is at least one given clue");
  assert(g.isGiven(given) === true, "clue is treated as given");
  assert(g.set(given, (g.board[given] % 9) + 1) === false, "cannot change a given clue");
}

// 3) 解答合法
{
  const g = new Sudoku("medium");
  g.board = g.solution.slice();
  assert(g.isSolved() === true, "the generated solution satisfies all rules");
}

// 4) 衝突偵測
{
  const g = new Sudoku("easy");
  g.puzzle = new Array(81); for (var i = 0; i < 81; i++) g.puzzle[i] = 0;
  g.board = new Array(81); for (var j = 0; j < 81; j++) g.board[j] = 0;
  g.board[0] = 5;
  g.board[1] = 5;
  assert(g.conflict(0) === true, "duplicate in a row is a conflict");
  g.board[1] = 0;
  assert(g.conflict(0) === false, "no conflict once unique");
}

// 5) 編輯與清除
{
  const g = new Sudoku("easy");
  g.puzzle = new Array(81); for (var i = 0; i < 81; i++) g.puzzle[i] = 0;
  g.board = new Array(81); for (var j = 0; j < 81; j++) g.board[j] = 0;
  assert(g.set(40, 7) === true, "set an empty cell");
  assert(g.board[40] === 7, "value stored");
  assert(g.clear(40) === true, "clear an editable cell");
  assert(g.board[40] === 0, "value cleared");
}

console.log("\nALL SUDOKU TESTS PASSED (" + pass + ")");
