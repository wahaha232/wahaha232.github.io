// 木製飛行棋（Ludo，2 人簡化版）引擎測試（node scripts/test-ludo.cjs）
const Ludo = require("../js/ludo.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

// ── 1) 初始狀態：2 人，每人 4 顆棋子都在家（distance 0） ──
{
  const g = new Ludo();
  assert(g.players.length === 2, "defaults to a 2-player game (red vs yellow)");
  assert(g.tokens.red.every((d) => d === 0) && g.tokens.yellow.every((d) => d === 0), "all tokens start at home (distance 0)");
  assert(g.turn === "red", "red rolls first");
}

// ── 2) 沒擲到 6、棋子全在家 → 無棋可動，自動換手 ──
{
  const g = new Ludo();
  const res = g.roll(3);
  assert(res.ok === true, "roll accepted");
  assert(res.noMoves === true, "no legal moves reported when every token is home and the die isn't 6");
  assert(g.turn === "yellow", "turn auto-passes when there's nothing to play");
}

// ── 3) 擲到 6：所有在家的棋子都可以選擇出發 ──
{
  const g = new Ludo();
  const res = g.roll(6);
  assert(res.legal.length === 4, "rolling a 6 makes all 4 home tokens eligible to enter");
}

// ── 4) 出發：棋子落在自己的起點格（安全格），擲 6 可以再擲一次 ──
{
  const g = new Ludo();
  g.roll(6);
  const res = g.moveToken(0, 6);
  assert(res.ok === true, "entering a token from home is accepted");
  assert(g.tokens.red[0] === 1, "token distance becomes 1 (on its own start square)");
  assert(g.turn === "red", "rolling a 6 grants an extra turn, same player continues");
}

// ── 5) 一般前進：非 6 的擲骰換手 ──
{
  const g = new Ludo();
  g.tokens.red[0] = 10;
  g.turn = "red";
  const res = g.moveToken(0, 3);
  assert(res.ok === true, "forward move accepted");
  assert(g.tokens.red[0] === 13, "token advances by the die value");
  assert(g.turn === "yellow", "turn passes after a non-six move");
}

// ── 6) 終點跑道必須「剛好」走到，超過則該棋子這次不能動 ──
{
  const g = new Ludo();
  g.tokens.red[0] = 55;
  g.turn = "red";
  const overshoot = g.legalMoves(3); // 55+3=58 超過 57
  assert(overshoot.indexOf(0) === -1, "a roll that overshoots home excludes that token from legal moves");
  const exact = g.legalMoves(2); // 55+2=57 剛好到家
  assert(exact.indexOf(0) !== -1, "a roll landing exactly on 57 is legal");
  const res = g.moveToken(0, 2);
  assert(res.ok === true && g.tokens.red[0] === 57, "the token reaches home with an exact roll");
}

// ── 7) 四顆棋子都到家 → 獲勝 ──
{
  const g = new Ludo();
  g.tokens.red = [57, 57, 57, 55];
  g.turn = "red";
  const res = g.moveToken(3, 2);
  assert(res.ok === true, "final token's move accepted");
  assert(g.status === "over", "getting all 4 tokens home ends the game");
  assert(g.result.indexOf("Red wins") !== -1, "result credits the winning color");
}

// ── 8) 走到對手棋子所在的「非安全格」會把對方吃回家 ──
{
  const g = new Ludo();
  g.tokens.red[0] = 13; // globalPos(red,13) = 12
  g.tokens.yellow[0] = 42; // globalPos(yellow,42) = 15
  g.turn = "red";
  const res = g.moveToken(0, 3); // 13+3=16 -> globalPos(red,16) = 15，跟黃棋同格
  assert(res.ok === true, "move onto the opponent's square is accepted");
  assert(res.captured && res.captured.color === "yellow" && res.captured.index === 0, "landing on an opponent sends it home");
  assert(g.tokens.yellow[0] === 0, "captured token's distance resets to 0 (back in the yard)");
}

// ── 9) 安全格（各色起點）上不會發生吃子 ──
{
  const g = new Ludo();
  g.tokens.yellow[0] = 27; // globalPos(yellow,27) = 0，紅方起點（安全格）
  g.turn = "red";
  g.roll(6);
  const res = g.moveToken(0, 6); // 進場，落在紅方起點 globalPos=0
  assert(res.ok === true, "entering onto a safe square is accepted");
  assert(res.captured === null, "no capture happens on a safe square");
  assert(g.tokens.yellow[0] === 27, "the piece sitting on the safe square is untouched");
}

// ── 10) 連續三次擲到 6 → 直接失去回合 ──
{
  const g = new Ludo();
  g.roll(6);
  g.roll(6);
  const res = g.roll(6);
  assert(res.forfeited === true, "a third consecutive six forfeits the turn");
  assert(g.turn === "yellow", "turn passes to the other player after the forfeit");
  assert(g.sixStreak === 0, "the streak resets once the turn changes");
}

// ── 11) Undo 一次還原「擲骰＋隨後的一步棋」──
{
  const g = new Ludo();
  g.tokens.red[0] = 13;
  g.turn = "red";
  g.roll(3);
  g.moveToken(0, 3);
  assert(g.turn === "yellow", "precondition: move completed, turn passed");

  const ok = g.undo();
  assert(ok === true, "undo reports success");
  assert(g.tokens.red[0] === 13, "undo restores the token's distance from before the roll");
  assert(g.turn === "red", "undo restores the turn to before the roll");
}

console.log("\nALL LUDO TESTS PASSED (" + pass + ")");
