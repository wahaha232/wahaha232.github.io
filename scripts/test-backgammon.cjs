// 十五子棋（Backgammon）引擎測試（node scripts/test-backgammon.cjs）
const Backgammon = require("../js/backgammon.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

function emptyGame() {
  const g = new Backgammon();
  g.points = new Array(24).fill(null);
  g.bar = { w: 0, b: 0 };
  g.borneOff = { w: 0, b: 0 };
  g.turn = "w";
  g.dice = [];
  g.status = "active";
  g.result = "";
  g.history = [];
  return g;
}

function countAll(g, color) {
  let n = g.bar[color] + g.borneOff[color];
  for (const p of g.points) if (p && p.color === color) n += p.count;
  return n;
}

// ── 1) 初始佈局：雙方各 15 顆，起始點正確 ──
{
  const g = new Backgammon();
  assert(countAll(g, "w") === 15, "white starts with 15 checkers total");
  assert(countAll(g, "b") === 15, "black starts with 15 checkers total");
  assert(g.points[23].count === 2 && g.points[12].count === 5 && g.points[7].count === 3 && g.points[5].count === 5, "white's four starting points have the standard counts");
  assert(g.points[0].count === 2 && g.points[11].count === 5 && g.points[16].count === 3 && g.points[18].count === 5, "black's four starting points have the standard counts");
}

// ── 2) 擲骰：一般兩顆不同點數 vs 雙數給 4 步 ──
{
  const g = emptyGame();
  g.points[10] = { color: "w", count: 1 }; // 讓兩顆骰子都至少有棋子能動，避免自動判定「無棋可走」
  const res = g.rollDice([3, 5]);
  assert(res.ok === true && JSON.stringify(g.dice) === JSON.stringify([3, 5]), "non-double roll gives two distinct dice values");

  const g2 = emptyGame();
  g2.points[10] = { color: "w", count: 1 };
  const res2 = g2.rollDice([4, 4]);
  assert(JSON.stringify(g2.dice) === JSON.stringify([4, 4, 4, 4]), "rolling doubles gives four uses of that value");
}

// ── 3) 骰子還沒用完前不能再擲一次 ──
{
  const g = emptyGame();
  g.points[10] = { color: "w", count: 1 };
  g.rollDice([2, 3]);
  const res = g.rollDice([1, 1]);
  assert(res.ok === false, "cannot re-roll while dice from the current turn are still unused");
}

// ── 4) 一般移動：白方往 index 減少的方向走 ──
{
  const g = emptyGame();
  g.points[23] = { color: "w", count: 2 };
  g.dice = [2];
  const res = g.makeMove(23, 2);
  assert(res.ok === true, "basic move accepted");
  assert(g.points[23].count === 1, "source point count decrements");
  assert(g.points[21] && g.points[21].color === "w" && g.points[21].count === 1, "checker lands on the target point (23 - 2 = 21)");
}

// ── 5) 打掉對方單顆棋子（blot）送上 bar ──
{
  const g = emptyGame();
  g.points[10] = { color: "w", count: 1 };
  g.points[8] = { color: "b", count: 1 };
  g.dice = [2];
  const res = g.makeMove(10, 2); // 10-2=8，黑方單子在那
  assert(res.ok === true && res.hit === true, "landing on a lone opposing checker is reported as a hit");
  assert(g.bar.b === 1, "the hit checker is sent to the bar");
  assert(g.points[8].color === "w" && g.points[8].count === 1, "the mover now occupies that point");
}

// ── 6) 對方兩顆以上把守的點擋路，不能走過去 ──
{
  const g = emptyGame();
  g.points[10] = { color: "w", count: 1 };
  g.points[8] = { color: "b", count: 2 };
  g.dice = [2];
  const res = g.makeMove(10, 2);
  assert(res.ok === false, "a point held by 2+ opposing checkers blocks the move");
}

// ── 7) bar 上有棋子時，必須先進場，不能動別的棋子 ──
{
  const g = emptyGame();
  g.points[10] = { color: "w", count: 1 };
  g.bar.w = 1;
  g.dice = [3];
  const blocked = g.makeMove(10, 3);
  assert(blocked.ok === false, "other checkers cannot move while one is on the bar");
  const res = g.makeMove("bar", 3); // 白方從 bar 進場：24-3=21
  assert(res.ok === true, "entering from the bar is accepted");
  assert(g.bar.w === 0, "bar count decreases after entering");
  assert(g.points[21].color === "w", "checker enters at 24 - die");
}

// ── 8) 起子：骰數剛好對應距離 ──
{
  const g = emptyGame();
  g.points[3] = { color: "w", count: 1 }; // distance = 3+1 = 4
  g.dice = [4];
  const res = g.makeMove(3, 4);
  assert(res.ok === true, "bearing off with the exact distance is accepted");
  assert(g.borneOff.w === 1, "borne-off count increments");
}

// ── 9) 起子：骰數較大，但家門內沒有更遠的棋子擋著也可以用 ──
{
  const g = emptyGame();
  g.points[3] = { color: "w", count: 1 }; // distance 4，是家門內最遠的棋子
  g.dice = [6];
  const res = g.makeMove(3, 6);
  assert(res.ok === true, "an overage roll can bear off the piece when nothing sits further back");
}

// ── 10) 起子：骰數較大時，若家門內還有更遠的棋子，不能用這顆骰子起這顆子 ──
{
  const g = emptyGame();
  g.points[3] = { color: "w", count: 1 }; // distance 4
  g.points[5] = { color: "w", count: 1 }; // distance 6，比 3 號點的棋子更遠（更靠門外）
  g.dice = [6];
  const res = g.makeMove(3, 6);
  assert(res.ok === false, "a further-back checker in the home board blocks the overage bear-off");
}

// ── 11) 全部 15 顆起完 → 獲勝 ──
{
  const g = emptyGame();
  g.borneOff.w = 14;
  g.points[0] = { color: "w", count: 1 }; // distance = 1
  g.dice = [1];
  const res = g.makeMove(0, 1);
  assert(res.ok === true, "final bear-off accepted");
  assert(g.status === "over", "bearing off the 15th checker ends the game");
  assert(g.result.indexOf("White wins") !== -1, "result credits the winning color");
}

// ── 12) 骰子用完後自動換手 ──
{
  const g = emptyGame();
  g.points[10] = { color: "w", count: 1 };
  g.dice = [2];
  g.makeMove(10, 2);
  assert(g.turn === "b", "turn passes once the last die is used");
}

// ── 13) Undo 還原上一步（擲骰或走子都各自可悔） ──
{
  const g = emptyGame();
  g.points[10] = { color: "w", count: 1 };
  g.dice = [2];
  g.makeMove(10, 2);
  const ok = g.undo();
  assert(ok === true, "undo reports success");
  assert(g.points[10].count === 1, "undo restores the source point");
  assert(g.points[8] === null, "undo removes the checker from the target point");
  assert(g.turn === "w", "undo restores the previous turn");
}

console.log("\nALL BACKGAMMON TESTS PASSED (" + pass + ")");
