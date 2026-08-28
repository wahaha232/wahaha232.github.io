// Solitaire 引擎自動測試（node scripts/test-solitaire.cjs）
const Solitaire = require("../js/solitaire.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

function mk(rank, suit, faceUp) {
  return { rank: rank, suit: suit, faceUp: faceUp !== false };
}

// 1) 標準牌組完整性
{
  const deck = [];
  for (const suit of ["s", "h", "d", "c"]) {
    for (const rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]) {
      deck.push(suit + rank);
    }
  }
  assert(deck.length === 52, "standard deck = 52 cards");
}

// 2) 發牌結構
{
  const g = new Solitaire();
  let total = 0;
  g.tableau.forEach(function (p, i) {
    assert(p.length === i + 1, "tableau pile " + i + " has " + (i + 1) + " cards");
    total += p.length;
  });
  assert(total === 28, "tableau total = 28");
  assert(g.stock.length === 24, "stock = 24");
  assert(g.tableau[6][0].faceUp === false && g.tableau[6][6].faceUp === true, "only top card is face up");
}

// 3) 抽牌
{
  const g = new Solitaire();
  const before = g.stock.length;
  const res = g.drawStock();
  assert(res.ok && g.waste.length === 1 && g.waste[0].faceUp, "draw puts a face-up card on waste");
  assert(g.stock.length === before - 1, "stock decreased by 1");
  assert(g.moves === 1, "moves incremented");
}

// 4) 庫存抽完 → 回收廢牌堆
{
  const g = new Solitaire();
  while (g.stock.length > 0) g.drawStock();
  assert(g.stock.length === 0 && g.waste.length === 24, "all cards drawn to waste");
  const res = g.drawStock();
  assert(res.ok && res.recycled === true && g.stock.length === 24 && g.waste.length === 0, "waste recycled to stock face-down");
  assert(g.stock.every(function (c) { return !c.faceUp; }), "recycled cards are face-down");
}

// 5) 廢牌堆 A 上基礎堆
{
  const g = new Solitaire();
  g.waste = [mk("A", "s", true)];
  const res = g.moveWasteToFoundation();
  assert(res.ok && g.foundations[0].length === 1 && g.foundations[0][0].rank === "A", "waste A moves to foundation");
  assert(g.score >= 10, "score gains 10 for foundation move");
}

// 6) 基礎堆依序、同花色
{
  const g = new Solitaire();
  g.foundations[0] = [mk("A", "s", true)];
  g.waste = [mk("2", "s", true)];
  assert(g.moveWasteToFoundation().ok, "2s onto As is legal");
  g.waste = [mk("3", "d", true)];
  assert(!g.moveWasteToFoundation().ok, "3d cannot go onto As/2s (wrong suit)");
  g.waste = [mk("2", "h", true)];
  assert(!g.moveWasteToFoundation().ok, "2h cannot go onto As (wrong suit)");
}

// 7) 桌面放置規則（紅黑交替、降序、空疊只能放 K）
{
  const g = new Solitaire();
  g.tableau = [[], [], [], [], [], [], []];
  g.waste = [mk("K", "s", true)];
  assert(g.moveWasteToTableau(0).ok, "K to empty tableau");
  g.waste = [mk("Q", "h", true)];
  assert(g.moveWasteToTableau(0).ok, "Qh onto Ks (alternating, descending)");
  g.waste = [mk("J", "s", true)];
  assert(g.moveWasteToTableau(0).ok, "Js onto Qh");
  g.waste = [mk("J", "h", true)];
  assert(!g.moveWasteToTableau(0).ok, "Jh rejected (same color on Qh)");
  g.waste = [mk("Q", "s", true)];
  assert(!g.moveWasteToTableau(0).ok, "Qs rejected (equal rank)");
  g.waste = [mk("A", "s", true)];
  assert(!g.moveWasteToTableau(0).ok, "As rejected (not descending)");
}

// 8) 桌面到桌面：序列移動 + 空疊規則 + 自動翻牌
{
  const g = new Solitaire();
  g.tableau = [
    [mk("K", "s", true), mk("Q", "h", true), mk("J", "s", true)],
    [mk("A", "c", true)],
    [],
    [],
    [],
    [],
    []
  ];
  // Q 序列不能放空疊（首張非 K）
  assert(!g.moveTableauToTableau(0, 1, 2).ok, "Q-sequence cannot go to empty pile");
  // 移到另一疊（該疊頂 A♣）也不行
  assert(!g.moveTableauToTableau(0, 1, 1).ok, "Qh cannot go onto Ac");
  // K 序列（含 Qh,Js）移到空疊 → 成功
  assert(g.moveTableauToTableau(0, 0, 2).ok, "K-sequence moves to empty pile");
  assert(g.tableau[0].length === 0, "source pile emptied");
  assert(g.tableau[2].length === 3, "target pile has 3 cards");
}

// 9) 移走後自動翻開蓋牌
{
  const g = new Solitaire();
  g.tableau = [
    [mk("K", "s", false), mk("Q", "h", true)],
    [],
    [],
    [],
    [],
    [],
    []
  ];
  g.tableau[2] = [mk("K", "s", true)];
  assert(g.moveTableauToTableau(0, 1, 2).ok, "Qh moves onto Ks");
  assert(g.tableau[0][0].faceUp === true, "face-down card auto-flipped after move");
  assert(g.score >= 5, "flip adds score");
}

// 10) 桌面頂牌上基礎堆
{
  const g = new Solitaire();
  g.tableau = [[mk("A", "d", true)], [], [], [], [], [], []];
  const res = g.moveTableauToFoundation(0);
  assert(res.ok, "tableau A moves to foundation");
  assert(g.foundations.some(function (f) { return f.length === 1 && f[0].rank === "A"; }), "foundation holds the A");
}

// 11) 基礎堆放回桌面（扣分）
{
  const g = new Solitaire();
  g.foundations[0] = [mk("A", "s", true), mk("2", "s", true)];
  g.tableau[0] = [mk("3", "h", true)];
  const scoreBefore = g.score;
  const res = g.moveFoundationToTableau(0, 0);
  assert(res.ok && g.foundations[0].length === 1 && g.tableau[0].length === 2, "foundation 2s moves back to tableau");
  assert(g.score < scoreBefore, "foundation-to-tableau deducts score");
}

// 12) 悔棋
{
  const g = new Solitaire();
  g.waste = [mk("A", "h", true)];
  g.moveWasteToFoundation();
  const movesBefore = g.moves;
  assert(g.undo(), "undo succeeds");
  assert(g.waste.length === 1 && g.foundations[0].length === 0, "undo restores waste & foundation");
  assert(g.moves === movesBefore - 1, "undo restores moves count");
}

// 13) 自動上基礎堆（雙擊）
{
  const g = new Solitaire();
  g.waste = [mk("A", "c", true)];
  assert(g.autoMoveToFoundation(-1).ok, "auto-move waste A to foundation");
}

// 14) 勝利偵測
{
  const g = new Solitaire();
  const order = ["s", "h", "d", "c"];
  for (let i = 0; i < 4; i++) {
    for (const rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]) {
      g.foundations[i].push(mk(rank, order[i], true));
    }
  }
  g.won = false;
  g.checkWin();
  assert(g.won === true, "all four foundations full = win");
}

console.log("\nALL SOLITAIRE TESTS PASSED (" + pass + ")");
