// 海戰棋引擎測試（node scripts/test-battleship.cjs）
const Battleship = require("../js/battleship.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

function fleetWithSingleShip(cells) {
  const board = new Array(100).fill(null);
  cells.forEach((idx) => { board[idx] = 0; });
  return { board, ships: [{ size: cells.length, cells: cells.slice(), hits: 0 }] };
}

function emptyGame() {
  const g = new Battleship();
  g.shots = { 1: new Array(100).fill(null), 2: new Array(100).fill(null) };
  g.turn = 1;
  g.status = "active";
  g.result = "";
  g.history = [];
  g.lastShot = null;
  return g;
}

// ── 1) 初始佈署：雙方各 5 艘船，總格數 17，彼此不重疊 ──
{
  const g = new Battleship();
  for (const p of [1, 2]) {
    const ships = g.boards[p].ships;
    assert(ships.length === 5, "player " + p + " has 5 ships");
    const totalCells = ships.reduce((s, sh) => s + sh.cells.length, 0);
    assert(totalCells === 17, "player " + p + " ship cells total 17 (5+4+3+3+2)");
    const allCells = ships.flatMap((sh) => sh.cells);
    assert(new Set(allCells).size === allCells.length, "player " + p + "'s ships do not overlap");
  }
}

// ── 2) 打空格：miss，換手 ──
{
  const g = emptyGame();
  g.boards[2] = fleetWithSingleShip([50]);
  const res = g.fire(2, 0); // 0 號格沒有船
  assert(res.ok === true, "firing at an empty cell is accepted");
  assert(res.hit === false, "empty cell is reported as a miss");
  assert(g.shots[1][0] === "miss", "miss recorded in the shooter's tracking grid");
  assert(g.turn === 2, "turn passes after a shot");
}

// ── 3) 打中船身但還沒擊沉 ──
{
  const g = emptyGame();
  g.boards[2] = fleetWithSingleShip([10, 11, 12]); // 3 格長的船
  const res = g.fire(2, 10);
  assert(res.ok === true && res.hit === true, "hitting a ship cell is reported as a hit");
  assert(res.sunk === null, "ship is not sunk after only one of its cells is hit");
  assert(g.boards[2].ships[0].hits === 1, "ship's hit counter increments");
  assert(g.shots[1][10] === "hit", "hit recorded in the tracking grid");
}

// ── 4) 打中最後一格 → 擊沉該船 ──
{
  const g = emptyGame();
  g.boards[2] = fleetWithSingleShip([20, 21]);
  g.boards[2].ships[0].hits = 1; // 20 已經打過
  g.shots[1][20] = "hit";
  const res = g.fire(2, 21);
  assert(res.ok === true, "second hit accepted");
  assert(res.sunk === 0, "hitting the ship's final cell reports it sunk (ship index 0)");
}

// ── 5) 不能對自己的棋盤開火 ──
{
  const g = emptyGame();
  const res = g.fire(1, 5);
  assert(res.ok === false, "firing at your own board is rejected");
}

// ── 6) 不能對同一格開兩次火 ──
{
  const g = emptyGame();
  g.boards[2] = fleetWithSingleShip([50]);
  g.fire(2, 0);
  g.turn = 1; // 手動切回來，單獨測試同一格重複開火
  const res = g.fire(2, 0);
  assert(res.ok === false, "firing at an already-shot cell is rejected");
}

// ── 7) 擊沉對方全部的船 → 遊戲結束 ──
{
  const g = emptyGame();
  g.boards[2] = fleetWithSingleShip([30, 31]);
  g.boards[2].ships[0].hits = 1;
  g.shots[1][30] = "hit";
  const res = g.fire(2, 31);
  assert(res.ok === true, "final shot accepted");
  assert(g.status === "over", "sinking the whole enemy fleet ends the game");
  assert(g.result.indexOf("Player 1 wins") !== -1, "result credits the shooting player");
}

// ── 8) Undo 還原上一發（含擊沉計數） ──
{
  const g = emptyGame();
  g.boards[2] = fleetWithSingleShip([40, 41]);
  g.fire(2, 40);
  const ok = g.undo();
  assert(ok === true, "undo reports success");
  assert(g.shots[1][40] === null, "undo clears the shot marker");
  assert(g.boards[2].ships[0].hits === 0, "undo reverts the ship's hit counter");
  assert(g.turn === 1, "undo restores the previous turn");
}

console.log("\nALL BATTLESHIP TESTS PASSED (" + pass + ")");
