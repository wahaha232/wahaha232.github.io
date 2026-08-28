// 骨牌接龍引擎測試（node scripts/test-dominoes.cjs）
const Dominoes = require("../js/dominoes.js");
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
  const g = new Dominoes();
  g.hands = { 1: [], 2: [] };
  g.boneyard = [];
  g.line = [];
  g.leftEnd = null;
  g.rightEnd = null;
  g.turn = 1;
  g.passCount = 0;
  g.status = "active";
  g.result = "";
  g.history = [];
  return g;
}

// ── 1) 初始發牌：雙方各 7 張、牌堆 14 張，全部 28 張不重複 ──
{
  const g = new Dominoes();
  assert(g.hands[1].length === 7, "player 1 gets 7 tiles");
  assert(g.hands[2].length === 7, "player 2 gets 7 tiles");
  assert(g.boneyard.length === 14, "boneyard holds the remaining 14 tiles");
  const all = g.hands[1].concat(g.hands[2], g.boneyard).map((t) => t.join(","));
  const unique = new Set(all);
  assert(all.length === 28 && unique.size === 28, "all 28 tiles are present and unique");
}

// ── 2) 第一手：任何牌都能出，決定牌列兩端 ──
{
  const g = emptyGame();
  g.hands[1] = [[3, 5], [1, 1]]; // 出牌後手上還有牌，才能測「換手」而不是「出完手牌獲勝」
  const res = g.playTile(0, "left");
  assert(res.ok === true, "first tile of the game is always playable");
  assert(g.leftEnd === 3 && g.rightEnd === 5, "first tile sets both ends");
  assert(g.turn === 2, "turn passes after playing");
}

// ── 3) 接龍時骨牌方向會自動翻轉，讓相同數字對齊該端 ──
{
  const g = emptyGame();
  g.line = [[3, 5]];
  g.leftEnd = 3;
  g.rightEnd = 5;
  g.hands[1] = [[7, 5]]; // 5 端要接右邊，[7,5] 要翻成 [5,7] 才會對齊
  const res = g.playTile(0, "right");
  assert(res.ok === true, "tile matching the right end is accepted");
  assert(g.rightEnd === 7, "new right end is the tile's other value");
  assert(g.line[g.line.length - 1][0] === 5, "tile is oriented so the matching value faces the join");
}

// ── 4) 不符合任一端的骨牌不能出 ──
{
  const g = emptyGame();
  g.line = [[3, 5]];
  g.leftEnd = 3;
  g.rightEnd = 5;
  g.hands[1] = [[1, 2]];
  const res = g.playTile(0, "left");
  assert(res.ok === false, "a tile matching neither end is rejected");
}

// ── 5) legalPlays 正確列出可出的牌與可接的端 ──
{
  const g = emptyGame();
  g.line = [[3, 5]];
  g.leftEnd = 3;
  g.rightEnd = 5;
  g.hands[1] = [[1, 2], [5, 6], [3, 3]];
  const legal = g.legalPlays(1);
  assert(legal.length === 2, "only the two matching tiles are legal (2 possible plays)");
  assert(legal.some((m) => m.tileIndex === 1 && m.end === "right"), "[5,6] can join the right end");
  assert(legal.some((m) => m.tileIndex === 2 && m.end === "left"), "[3,3] can join the left end");
}

// ── 6) 沒有可出的牌時，摸牌會禁止（有牌可出時不能摸牌）；沒牌可出才能摸 ──
{
  const g = emptyGame();
  g.line = [[3, 5]];
  g.leftEnd = 3;
  g.rightEnd = 5;
  g.hands[1] = [[3, 3]]; // 有牌可出
  g.boneyard = [[1, 1]];
  const blocked = g.draw();
  assert(blocked.ok === false, "cannot draw while a legal play exists");

  g.hands[1] = [[1, 2]]; // 完全出不了
  const res = g.draw();
  assert(res.ok === true, "drawing is allowed when no legal play exists");
  assert(g.hands[1].length === 2, "drawn tile is added to the hand");
  assert(g.boneyard.length === 0, "boneyard shrinks after a draw");
}

// ── 7) 先出完手牌獲勝 ──
{
  const g = emptyGame();
  g.line = [[3, 5]];
  g.leftEnd = 3;
  g.rightEnd = 5;
  g.hands[1] = [[3, 3]];
  const res = g.playTile(0, "left");
  assert(res.ok === true, "final tile play accepted");
  assert(g.status === "over", "emptying your hand ends the game");
  assert(g.result.indexOf("Player 1 wins") !== -1, "result credits the player who emptied their hand");
}

// ── 8) 雙方都卡關（牌堆空、都出不了）→ 比剩餘點數少者獲勝 ──
{
  const g = emptyGame();
  g.line = [[3, 5]];
  g.leftEnd = 3;
  g.rightEnd = 5;
  g.boneyard = [];
  g.hands[1] = [[1, 2]]; // 3 點
  g.hands[2] = [[6, 6]]; // 12 點
  g.turn = 1;
  const first = g.draw();
  assert(first.ok === true && first.passed === true, "first blocked player passes without ending the game yet");
  assert(g.turn === 2, "turn passes to the other player after a pass");
  const second = g.draw();
  assert(second.ok === true && second.blocked === true, "second consecutive block ends the game");
  assert(g.result.indexOf("Player 1 wins") !== -1, "lower total pip count wins when blocked");
}

// ── 9) Undo 還原上一步 ──
{
  const g = emptyGame();
  g.hands[1] = [[3, 5]];
  g.playTile(0, "left");
  const ok = g.undo();
  assert(ok === true, "undo reports success");
  assert(g.line.length === 0, "undo removes the played tile from the line");
  assert(g.hands[1].length === 1, "undo returns the tile to the hand");
  assert(g.turn === 1, "undo restores the previous turn");
}

console.log("\nALL DOMINOES TESTS PASSED (" + pass + ")");
