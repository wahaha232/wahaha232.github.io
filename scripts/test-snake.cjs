// Snake 引擎自動測試（node scripts/test-snake.cjs）
const Snake = require("../js/snake.js");
let pass = 0;
function assert(c, l) { if (!c) { console.error("FAIL: " + l); process.exit(1); } pass++; console.log("PASS: " + l); }

// 1) 初始狀態
{
  const g = new Snake(20, 20);
  assert(g.snake.length === 3, "snake starts length 3");
  assert(g.food !== null, "food is on the board");
  assert(g.over === false, "game not over");
  assert(g.score === 0, "score starts at 0");
}

// 2) 前進
{
  const g = new Snake(20, 20);
  g.food = null;
  const hx = g.snake[0].x;
  g.update(0.2);
  assert(g.snake[0].x === hx + 1, "head advances one cell");
  assert(g.snake.length === 3, "length unchanged without food");
}

// 3) 吃到食物 → 變長 + 加分
{
  const g = new Snake(20, 20);
  g.snake = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
  g.dir = { x: 1, y: 0 };
  g.nextDir = { x: 1, y: 0 };
  g.food = { x: 6, y: 5 };
  g.update(0.2);
  assert(g.snake.length === 4, "snake grows after eating");
  assert(g.score === 1, "score increments after eating");
}

// 4) 撞牆結束
{
  const g = new Snake(20, 20);
  g.snake = [{ x: 19, y: 5 }, { x: 18, y: 5 }, { x: 17, y: 5 }];
  g.dir = { x: 1, y: 0 };
  g.nextDir = { x: 1, y: 0 };
  g.food = null;
  g.update(0.2);
  assert(g.over === true, "hitting the wall ends the game");
}

// 5) 不能瞬間反向
{
  const g = new Snake(20, 20);
  g.dir = { x: 1, y: 0 };
  g.nextDir = { x: 1, y: 0 };
  g.setDir(-1, 0);
  assert(g.nextDir.x === 1, "instant reverse is ignored");
}

console.log("\nALL SNAKE TESTS PASSED (" + pass + ")");
