// TriPeaks 引擎自動測試（node scripts/test-tripeaks.cjs）
const TriPeaks = require("../js/solitaire-tripeaks.js");
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
  const g = new TriPeaks();
  assert(g.layout.length === 28, "28 layout cards");
  assert(g.stock.length === 24, "24 stock cards");
  assert(g.exposed(27) === true, "bottom-right base card is exposed");
  assert(g.exposed(0) === false, "peak-top card starts covered");
}

// 2) 相鄰關係（含 A-K 環繞）
{
  const g = new TriPeaks();
  assert(g.adjacent(1, 2) === true, "A and 2 are neighbours");
  assert(g.adjacent(1, 13) === true, "A and K wrap around");
  assert(g.adjacent(13, 12) === true, "K and Q are neighbours");
  assert(g.adjacent(5, 9) === false, "far ranks are not neighbours");
}

// 3) 出牌成功 / 失敗
{
  const g = new TriPeaks();
  g.waste = [{ suit: "s", rank: 5 }];
  g.layout[18] = { card: { suit: "h", rank: 6 }, removed: false };
  assert(g.play(18) === true, "a one-higher exposed card plays onto the waste");
  assert(g.layout[18].removed === true, "played card is removed");
}
{
  const g = new TriPeaks();
  g.waste = [{ suit: "s", rank: 5 }];
  g.layout[18] = { card: { suit: "h", rank: 9 }, removed: false };
  assert(g.play(18) === false, "a non-adjacent card is rejected");
}

// 4) 抽牌
{
  const g = new TriPeaks();
  const n = g.stock.length;
  g.draw();
  assert(g.waste.length === 1 && g.stock.length === n - 1, "draw moves one card to the waste");
}

// 5) 清空全部 = 勝利
{
  const g = new TriPeaks();
  g.layout.forEach((c) => (c.removed = true));
  g.layout[18] = { card: { suit: "h", rank: 6 }, removed: false };
  g.waste = [{ suit: "s", rank: 5 }];
  assert(g.play(18) === true, "final card plays");
  assert(g.won === true, "clearing every layout card wins");
}

console.log("\nALL TRIPEAKS TESTS PASSED (" + pass + ")");
