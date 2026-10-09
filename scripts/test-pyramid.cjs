// Pyramid 引擎自動測試（node scripts/test-pyramid.cjs）
const Pyramid = require("../js/solitaire-pyramid.js");
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
  const g = new Pyramid();
  assert(g.pyramid.length === 28, "28 pyramid cards");
  assert(g.stock.length === 24, "24 stock cards");
  assert(g.isFree(27) === true, "bottom-row card is free");
  assert(g.isFree(0) === false, "the peak card starts covered");
}

// 2) 覆蓋關係
{
  const g = new Pyramid();
  g.pyramid[1].removed = true;
  g.pyramid[2].removed = true;
  assert(g.isFree(0) === true, "peak card is free once its two covers are gone");
}

// 3) 兩張合計 13 可消
{
  const g = new Pyramid();
  g.pyramid[27] = { card: { suit: "s", rank: 1 }, removed: false };
  g.pyramid[26] = { card: { suit: "h", rank: 12 }, removed: false };
  assert(g.removePair(27, 26) === true, "A + Q = 13 removed");
  assert(g.pyramid[27].removed && g.pyramid[26].removed, "both cards removed");
}

// 4) 非 13 不可消
{
  const g = new Pyramid();
  g.pyramid[27] = { card: { suit: "s", rank: 5 }, removed: false };
  g.pyramid[26] = { card: { suit: "h", rank: 5 }, removed: false };
  assert(g.removePair(27, 26) === false, "5 + 5 is rejected");
}

// 5) K 單張可消
{
  const g = new Pyramid();
  g.pyramid[27] = { card: { suit: "s", rank: 13 }, removed: false };
  assert(g.removeKing(27) === true, "King removed on its own");
  assert(g.pyramid[27].removed === true, "King marked removed");
}

// 6) 抽牌
{
  const g = new Pyramid();
  const n = g.stock.length;
  assert(g.draw() === true, "draw works");
  assert(g.waste.length === 1 && g.stock.length === n - 1, "waste and stock updated");
}

// 7) 勝利判定
{
  const g = new Pyramid();
  g.pyramid.forEach((c) => (c.removed = true));
  g.check();
  assert(g.won === true, "all pyramid cards removed = win");
}

console.log("\nALL PYRAMID TESTS PASSED (" + pass + ")");
