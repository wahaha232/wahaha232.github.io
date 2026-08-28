// 蛇梯棋引擎測試（node scripts/test-snakes-ladders.cjs）
const SnakesAndLadders = require("../js/snakes-ladders.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

// ── 1) 初始狀態 ──
{
  const g = new SnakesAndLadders();
  assert(g.positions[0] === 0 && g.positions[1] === 0, "both players start off-board at 0");
  assert(g.turn === 1, "player 1 rolls first");
}

// ── 2) 一般移動：無梯子/蛇的格子 ──
{
  const g = new SnakesAndLadders();
  const res = g.roll(3);
  assert(res.ok === true, "roll accepted");
  assert(g.positions[0] === 3, "player 1 advances by the die value");
  assert(g.turn === 2, "non-six roll passes turn to player 2");
}

// ── 3) 踩到梯子往上跳 ──
{
  const g = new SnakesAndLadders();
  const res = g.roll(4); // 4 是梯子底部 -> 14
  assert(res.event === "ladder", "landing on a ladder base is reported");
  assert(g.positions[0] === 14, "player 1 climbs the ladder to square 14");
}

// ── 4) 踩到蛇頭往下滑 ──
{
  const g = new SnakesAndLadders();
  const res = g.roll(6); // 6 讓玩家1 boarding，先讓玩家1到6再操作蛇
  assert(g.turn === 1, "rolling a 6 grants an extra turn");
  const res2 = g.roll(11); // 6+11=17 是蛇頭 -> 7
  assert(res2.event === "snake", "landing on a snake head is reported");
  assert(g.positions[0] === 7, "player 1 slides down the snake to square 7");
}

// ── 5) 超過 100 的擲骰不移動，但仍換手 ──
{
  const g = new SnakesAndLadders();
  g.positions[0] = 98;
  g.turn = 1;
  const res = g.roll(5); // 98+5=103 超過 100
  assert(res.landed === 98, "overshooting 100 leaves the player in place");
  assert(g.positions[0] === 98, "position unchanged after an overshoot");
  assert(g.turn === 2, "turn still passes after a wasted overshoot roll");
}

// ── 6) 剛好走到 100 獲勝 ──
{
  const g = new SnakesAndLadders();
  g.positions[0] = 94;
  g.turn = 1;
  const res = g.roll(6);
  assert(res.landed === 100, "exact roll lands on 100");
  assert(g.status === "over", "game ends when a player reaches exactly 100");
  assert(g.result.indexOf("Player 1") !== -1, "result names the winning player");
}

// ── 7) Undo 還原上一次擲骰 ──
{
  const g = new SnakesAndLadders();
  g.roll(3);
  const ok = g.undo();
  assert(ok === true, "undo reports success");
  assert(g.positions[0] === 0, "undo restores the pre-roll position");
  assert(g.turn === 1, "undo restores the pre-roll turn");
}

console.log("\nALL SNAKES & LADDERS TESTS PASSED (" + pass + ")");
