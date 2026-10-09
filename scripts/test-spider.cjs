// Spider 引擎自動測試（node scripts/test-spider.cjs）
const Spider = require("../js/solitaire-spider.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

// 1) 發牌
{
  const g = new Spider();
  assert(g.tableau.length === 10, "10 columns");
  assert(g.tableau[0].length === 6 && g.tableau[4].length === 5, "columns 6/5 split");
  const total = g.tableau.reduce((n, c) => n + c.length, 0) + g.stock.length;
  assert(total === 104, "104 cards total");
  assert(g.stock.length === 50, "50 cards in the stock");
  assert(g.tableau.every((c) => c[c.length - 1].faceUp), "top card face up in every column");
}

// 2) 放置規則（不分花色）
{
  const g = new Spider();
  g.tableau[0] = [{ suit: "s", rank: 8, faceUp: true }];
  assert(g.canPlace({ suit: "h", rank: 7 }, 0) === true, "any suit one lower is allowed");
  assert(g.canPlace({ suit: "h", rank: 6 }, 0) === false, "wrong rank rejected");
  g.tableau[1] = [];
  assert(g.canPlace({ suit: "h", rank: 1 }, 1) === true, "empty column accepts any card");
}

// 3) 同花連續序列
{
  const g = new Spider();
  g.tableau[0] = [
    { suit: "s", rank: 3, faceUp: true },
    { suit: "s", rank: 2, faceUp: true },
    { suit: "s", rank: 1, faceUp: true }
  ];
  assert(g.sameSuitRun(0, 0) === 3, "same-suit run of 3 is movable");
  g.tableau[1] = [
    { suit: "s", rank: 3, faceUp: true },
    { suit: "h", rank: 2, faceUp: true }
  ];
  assert(g.sameSuitRun(1, 0) === 0, "mixed-suit run is not movable");
  assert(g.sameSuitRun(1, 1) === 1, "single top card movable");
}

// 4) 發牌（補 10 張）
{
  const g = new Spider();
  g.stock = g.stock.slice(0, 20);
  const before = g.tableau.reduce((n, c) => n + c.length, 0);
  assert(g.dealStock() === true, "deal succeeds");
  assert(g.tableau.reduce((n, c) => n + c.length, 0) === before + 10, "10 cards dealt");
}

// 5) 完成同花 K→A 自動收走
{
  const g = new Spider();
  g.tableau[0] = [];
  for (let r = 13; r >= 1; r--) g.tableau[0].push({ suit: "s", rank: r, faceUp: true });
  g.removeCompleted();
  assert(g.completed === 1, "a King-to-Ace run is completed");
  assert(g.tableau[0].length === 0, "completed run removed from the tableau");
}

console.log("\nALL SPIDER TESTS PASSED (" + pass + ")");
