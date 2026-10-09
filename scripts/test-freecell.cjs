// FreeCell 引擎自動測試（node scripts/test-freecell.cjs）
const FreeCell = require("../js/solitaire-freecell.js");
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
  const g = new FreeCell();
  assert(g.tableau.length === 8, "8 columns");
  assert(g.tableau.reduce((n, c) => n + c.length, 0) === 52, "52 cards dealt");
  assert(g.tableau[0].length === 7 && g.tableau[4].length === 6, "columns 7/6 split");
  assert(g.free.length === 4 && g.free.every((x) => x === null), "4 empty free cells");
  assert(g.tableau.every((c) => c.every((card) => card.faceUp)), "all cards face up");
}

// 2) 疊牌規則
{
  const g = new FreeCell();
  g.tableau[0] = [];
  assert(g.canStack({ suit: "h", rank: 6 }, 0) === true, "empty column accepts any card");
  g.tableau[1] = [{ suit: "s", rank: 7 }];
  assert(g.canStack({ suit: "h", rank: 6 }, 1) === true, "red 6 onto black 7");
  assert(g.canStack({ suit: "c", rank: 6 }, 1) === false, "same colour rejected");
  assert(g.canStack({ suit: "h", rank: 5 }, 1) === false, "wrong rank rejected");
}

// 3) 基礎堆
{
  const g = new FreeCell();
  assert(g.canFound({ suit: "s", rank: 1 }) === true, "Ace starts a foundation");
  g.foundations.s = [{ suit: "s", rank: 1 }];
  assert(g.canFound({ suit: "s", rank: 2 }) === true, "2 onto Ace");
  assert(g.canFound({ suit: "h", rank: 2 }) === false, "wrong suit rejected");
}

// 4) 移動整段序列
{
  const g = new FreeCell();
  g.tableau[0] = [
    { suit: "s", rank: 7 },
    { suit: "h", rank: 6 },
    { suit: "c", rank: 5 }
  ];
  g.tableau[1] = [];
  assert(g.sequenceLen(0, 0) === 3, "valid 3-card alternating run");
  assert(g.moveSeqToCol(0, 0, 1) === true, "move whole run to empty column");
  assert(g.tableau[1].length === 3 && g.tableau[0].length === 0, "run relocated");
}

// 5) 送基礎堆
{
  const g = new FreeCell();
  g.tableau[0] = [{ suit: "s", rank: 1 }];
  assert(g.colToFound(0) === true, "Ace to foundation");
  assert(g.foundations.s.length === 1, "foundation holds the Ace");
  assert(g.tableau[0].length === 0, "column emptied");
}

console.log("\nALL FREECELL TESTS PASSED (" + pass + ")");
