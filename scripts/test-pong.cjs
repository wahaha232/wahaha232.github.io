// Pong 引擎自動測試（node scripts/test-pong.cjs）
const Pong = require("../js/pong.js");
let pass = 0;
function assert(c, l) { if (!c) { console.error("FAIL: " + l); process.exit(1); } pass++; console.log("PASS: " + l); }

// 1) 初始狀態
{
  const g = new Pong();
  assert(g.playerScore === 0 && g.aiScore === 0, "starts 0-0");
  assert(g.winningScore === 5, "first to 5 wins");
  assert(g.over === false, "not over");
}

// 2) 玩家擋板不會超出上邊界
{
  const g = new Pong();
  g.setPlayerDir(-1);
  g.update(1);
  assert(g.player.y >= 0, "player paddle clamped to the top");
}

// 3) 球撞上牆反彈
{
  const g = new Pong();
  g.ball.x = 240;
  g.ball.y = 2;
  g.ball.vx = 0;
  g.ball.vy = -100;
  g.update(0.02);
  assert(g.ball.vy > 0, "ball bounces off the top wall");
}

// 4) 球越過右側 → 玩家得分
{
  const g = new Pong();
  g.ball.x = g.width + 20;
  g.ball.y = 100;
  g.ball.vx = 200;
  g.ball.vy = 0;
  g.update(0.001);
  assert(g.playerScore === 1, "player scores when the ball passes the right edge");
}

// 5) 先得 5 分勝出
{
  const g = new Pong();
  g.playerScore = 4;
  g.ball.x = g.width + 20;
  g.ball.vx = 200;
  g.ball.vy = 0;
  g.update(0.001);
  assert(g.playerScore === 5 && g.over === true && g.winner === "player", "reaching 5 wins the match");
}

console.log("\nALL PONG TESTS PASSED (" + pass + ")");
