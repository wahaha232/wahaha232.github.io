// Minesweeper 引擎自動測試（node scripts/test-minesweeper.cjs）
const Minesweeper = require("../js/minesweeper.js");
let pass = 0;
function assert(c, l) { if (!c) { console.error("FAIL: " + l); process.exit(1); } pass++; console.log("PASS: " + l); }

// 1) 初始狀態
{
  const g = new Minesweeper();
  assert(g.cells.length === 81, "9x9 = 81 cells");
  assert(g.state === "playing", "starts in playing state");
  assert(g.minesPlaced === false, "mines are not placed until the first reveal");
  assert(g.minesLeft() === 10, "10 mines to flag");
}

// 2) 首點安全 + 佈雷
{
  const g = new Minesweeper(9, 9, 10);
  g.reveal(4, 4);
  assert(g.minesPlaced === true, "mines placed after the first reveal");
  assert(g.cells[g.idx(4, 4)].mine === false, "the first click is always safe");
  assert(g.cells.filter((c) => c.mine).length === 10, "exactly 10 mines placed");
}

// 3) 插旗
{
  const g = new Minesweeper();
  g.toggleFlag(0, 0);
  assert(g.cells[0].flagged === true, "flag placed");
  assert(g.minesLeft() === 9, "mines-left decreases");
  g.toggleFlag(0, 0);
  assert(g.cells[0].flagged === false && g.minesLeft() === 10, "flag removed");
}

// 4) 翻開所有安全格 → 勝利
{
  const g = new Minesweeper(3, 3, 1);
  g.cells.forEach((c) => { c.mine = false; c.adj = 0; c.revealed = false; c.flagged = false; });
  g.cells[g.idx(0, 0)].mine = true;
  for (var i = 0; i < 9; i++) {
    var c = g.cells[i];
    if (c.mine) continue;
    var r = Math.floor(i / 3), cc = i % 3, cnt = 0;
    g.neighbors(r, cc).forEach(function (nb) { if (g.cells[g.idx(nb[0], nb[1])].mine) cnt++; });
    c.adj = cnt;
  }
  g.minesPlaced = true;
  [[1,1],[2,2],[0,1],[0,2],[1,0],[1,2],[2,0],[2,1]].forEach(function (rc) { g.reveal(rc[0], rc[1]); });
  assert(g.state === "won", "revealing every safe cell wins");
}

// 5) 踩到炸彈 → 失敗
{
  const g = new Minesweeper(3, 3, 1);
  g.cells.forEach((c) => { c.mine = false; c.adj = 0; c.revealed = false; });
  g.cells[g.idx(0, 0)].mine = true;
  g.minesPlaced = true;
  g.reveal(0, 0);
  assert(g.state === "lost", "revealing a mine loses");
}

console.log("\nALL MINESWEEPER TESTS PASSED (" + pass + ")");
