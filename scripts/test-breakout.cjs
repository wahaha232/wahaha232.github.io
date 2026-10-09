// Breakout 引擎自動測試（node scripts/test-breakout.cjs）
const Breakout = require("../js/breakout.js");
let pass = 0;
function assert(c, l) { if (!c) { console.error("FAIL: " + l); process.exit(1); } pass++; console.log("PASS: " + l); }

// 1) 初始狀態
{
  const g = new Breakout();
  assert(g.bricks.length === 40, "8 x 5 = 40 bricks");
  assert(g.bricks.every((b) => b.alive), "all bricks alive");
  assert(g.lives === 3, "3 lives");
  assert(g.ball.stuck === true, "ball starts on the paddle");
}

// 2) 擋板不會超出邊界
{
  const g = new Breakout();
  g.setPaddleDir(-1);
  g.update(1);
  assert(g.paddle.x >= 0, "paddle clamped to the left edge");
  g.setPaddleDir(1);
  for (var i = 0; i < 100; i++) g.update(0.05);
  assert(g.paddle.x <= g.width - g.paddle.w, "paddle clamped to the right edge");
}

// 3) 發射
{
  const g = new Breakout();
  g.launch();
  assert(g.ball.stuck === false, "ball launches from the paddle");
}

// 4) 擊中磚塊
{
  const g = new Breakout();
  g.launch();
  const k = g.bricks[0];
  g.ball.x = k.x + 2;
  g.ball.y = k.y + 2;
  g.ball.vx = 0;
  g.ball.vy = 0;
  g.update(0.001);
  assert(g.bricks[0].alive === false, "brick is destroyed on overlap");
  assert(g.score === 10, "score increases by 10");
}

// 5) 清空全部 → 勝利
{
  const g = new Breakout();
  g.launch();
  g.bricks.forEach((b) => (b.alive = false));
  g.update(0.001);
  assert(g.won === true && g.over === true, "clearing every brick wins");
}

console.log("\nALL BREAKOUT TESTS PASSED (" + pass + ")");
