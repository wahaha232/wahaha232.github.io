// Space Invaders 引擎自動測試（node scripts/test-space-invaders.cjs）
const SpaceInvaders = require("../js/space-invaders.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

// 1) 初始狀態
{
  const g = new SpaceInvaders();
  assert(g.aliens.length === 32, "fleet has 8x4 = 32 aliens");
  assert(g.lives === 3, "3 lives");
  assert(g.score === 0, "score starts at 0");
  assert(g.over === false && g.won === false, "not over at start");
}

// 2) 玩家子彈限制一次一顆
{
  const g = new SpaceInvaders();
  assert(g.fire() === true, "first fire succeeds");
  assert(g.playerBullets.length === 1, "one bullet on screen");
  g.playerCooldown = 0;
  assert(g.fire() === false, "cannot fire while a bullet is live");
}

// 3) 外星人抵達邊緣時下移並反向
{
  const g = new SpaceInvaders();
  g.aliens.forEach((a) => (a.alive = false));
  g.aliens[0].alive = true;
  g.aliens[0].x = g.width - 40;
  g.aliens[0].y = 40;
  g.alienDir = 1;
  const y0 = g.aliens[0].y;
  g.stepAliens();
  assert(g.aliens[0].y === y0 + 16, "fleet drops a row at the edge");
  assert(g.alienDir === -1, "direction reverses at the edge");
}

// 4) 子彈擊中外星人
{
  const g = new SpaceInvaders();
  g.aliens.forEach((a) => (a.alive = false));
  g.aliens[0].alive = true;
  g.aliens[0].x = 100;
  g.aliens[0].y = 100;
  g.playerBullets.push({ x: 110, y: 105 });
  g.checkCollisions();
  assert(g.aliens[0].alive === false, "bullet destroys the alien");
  assert(g.score === 10, "score +10 per alien");
  assert(g.playerBullets.length === 0, "bullet is removed on hit");
}

// 5) 外星人子彈命中玩家扣命
{
  const g = new SpaceInvaders();
  g.alienBullets.push({ x: g.player.x + 2, y: g.player.y + 2 });
  g.checkCollisions();
  assert(g.lives === 2, "player loses a life when hit");
}

// 6) 全滅 → 勝利
{
  const g = new SpaceInvaders();
  g.aliens.forEach((a) => (a.alive = false));
  g.update(0.016);
  assert(g.won === true && g.over === true, "clearing the fleet wins the game");
}

console.log("\nALL SPACE INVADERS TESTS PASSED (" + pass + ")");
