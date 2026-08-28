// 西洋棋引擎進階測試（node scripts/test-chess.cjs）
const Chess = require("../js/chess.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

function emptyBoard() {
  const c = new Chess();
  c.board = new Array(64).fill(null);
  c.turn = "w";
  c.enPassantTarget = -1;
  c.castlingRights = { K: false, Q: false, k: false, q: false };
  return c;
}

// ── 1) 釘子兵不能吃過路兵（exd6 會讓白王暴露在黑車前）──
{
  const c = emptyBoard();
  c.board[60] = { type: "k", color: "w" };  // e1
  c.board[0] = { type: "k", color: "b" };   // a8
  c.board[4] = { type: "r", color: "b" };   // e8（控制 e 線）
  c.board[28] = { type: "p", color: "w" };  // e5（被釘住）
  c.board[27] = { type: "p", color: "b" };  // d5（剛雙步）
  c.enPassantTarget = 19;                   // d6
  const legal = c.legalMoves(28);
  assert(legal.indexOf(19) === -1, "pinned pawn cannot capture en passant");
  assert(legal.indexOf(20) !== -1, "pinned pawn may still push e5-e6");
}

// ── 2) 穿將易位：f1 被黑車攻擊 → 王翼易位禁止 ──
{
  const c = emptyBoard();
  c.castlingRights = { K: true, Q: true, k: false, q: false };
  c.board[60] = { type: "k", color: "w" };  // e1
  c.board[56] = { type: "r", color: "w" };  // a1
  c.board[63] = { type: "r", color: "w" };  // h1
  c.board[4] = { type: "k", color: "b" };   // e8
  c.board[5] = { type: "r", color: "b" };   // f8 → 攻擊 f1
  const legal = c.legalMoves(60);
  assert(legal.indexOf(62) === -1, "castling blocked: f1 attacked");
  assert(legal.indexOf(58) !== -1, "queenside castling still allowed");
}

// ── 3) 王不能走進被車攻擊的格子 ──
{
  const c = emptyBoard();
  c.board[60] = { type: "k", color: "w" };  // e1
  c.board[0] = { type: "k", color: "b" };   // a8
  c.board[56] = { type: "r", color: "b" };  // a1（控制第一橫排）
  const legal = c.legalMoves(60);
  assert(legal.indexOf(59) === -1, "king cannot move to d1 (attacked)");
  assert(legal.indexOf(61) === -1, "king cannot move to f1 (attacked)");
  assert(legal.indexOf(52) !== -1, "king may move to e2");
}

// ── 4) 釘住的騎士不能動（e2 騎士被 e8 黑車釘住）──
{
  const c = emptyBoard();
  c.board[60] = { type: "k", color: "w" };  // e1
  c.board[52] = { type: "n", color: "w" };  // e2
  c.board[0] = { type: "k", color: "b" };   // a8
  c.board[4] = { type: "r", color: "b" };   // e8
  assert(c.legalMoves(52).length === 0, "pinned knight has no legal moves");
}

// ── 5) 學者將殺：1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6 4.Qxf7#（黑方 d8 有己方皇后、f8 有主教擋路）──
{
  const c = new Chess();
  c.makeMove(52, 36); c.makeMove(12, 28);  // e4 e5
  c.makeMove(61, 34); c.makeMove(1, 18);   // Bc4 Nc6
  c.makeMove(59, 31); c.makeMove(6, 21);   // Qh5 Nf6（h5=31, f6=21）
  c.makeMove(31, 13);                      // Qxf7#（f7=13）
  assert(c.status === "checkmate", "scholar's mate = checkmate");
  const h = c.getMoveHistory();
  assert(h[h.length - 1].notation === "Qh5xf7#", "notation Qh5xf7# (" + h[h.length - 1].notation + ")");
}

// ── 5b) 構造將殺局面：黑王 e8、白后 e7（白王 f6 防守，f6=21）──
{
  const c = emptyBoard();
  c.board[4] = { type: "k", color: "b" };   // e8
  c.board[12] = { type: "q", color: "w" };  // e7
  c.board[21] = { type: "k", color: "w" };  // f6（防守 e7）
  c.turn = "b";
  c.updateStatus();
  assert(c.status === "checkmate", "constructed position = checkmate");
}

// ── 6) 王 vs 王 → 不足子力和棋 ──
{
  const c = emptyBoard();
  c.board[60] = { type: "k", color: "w" };
  c.board[4] = { type: "k", color: "b" };
  c.turn = "b";
  c.updateStatus();
  assert(c.status === "draw", "K vs K = draw");
}

// ── 7) 王不能走到敵王相鄰的格子（合法局面：白王 e4、黑王 e6）──
{
  const c = emptyBoard();
  c.board[36] = { type: "k", color: "w" };  // e4
  c.board[20] = { type: "k", color: "b" };  // e6（與 e4 隔一格）
  c.turn = "w";
  const legal = c.legalMoves(36);
  assert(legal.indexOf(27) === -1, "king cannot move to d5 (adjacent to enemy king)");
  assert(legal.indexOf(28) === -1, "king cannot move to e5 (adjacent to enemy king)");
  assert(legal.indexOf(29) === -1, "king cannot move to f5 (adjacent to enemy king)");
  assert(legal.indexOf(44) !== -1, "king may move to e3");
}

// ── 8) 隨機對局壓力測試（100 場 × 最多 120 手，不崩潰）──
{
  let games = 0;
  for (let g = 0; g < 100; g++) {
    const c = new Chess();
    let plies = 0;
    while (plies < 120 && (c.status === "active" || c.status === "check")) {
      const moves = c.allLegalMoves(c.turn);
      if (moves.length === 0) break;
      const mv = moves[Math.floor(Math.random() * moves.length)];
      const res = c.makeMove(mv.from, mv.to);
      if (!res.ok) {
        console.error("RANDOM GAME REJECTED A LEGAL MOVE:", mv.from, "->", mv.to);
        process.exit(1);
      }
      plies++;
    }
    games++;
  }
  assert(true, "100 random games played without errors (" + games + " games)");
}

// ── 9) 50 手無吃子/無兵動 → 和棋（fifty-move rule）──
{
  const c = emptyBoard();
  c.board[60] = { type: "k", color: "w" };  // e1
  c.board[4] = { type: "k", color: "b" };   // e8
  c.board[56] = { type: "r", color: "w" };  // a1
  c.board[0] = { type: "r", color: "b" };   // a8
  c.halfmoveClock = 99;
  c.turn = "w";
  c.updateStatus();
  assert(c.status === "active", "halfmoveClock 99 with legal moves = still active");
  const res = c.makeMove(56, 57); // Ra1-b1（非吃子、非兵動 → halfmoveClock 100）
  assert(res.ok === true, "rook move accepted at halfmoveClock 99");
  assert(c.status === "draw", "halfmoveClock 100 = draw (fifty-move rule)");
  assert(c.result.indexOf("fifty-move") !== -1, "fifty-move rule result text set");
}

// ── 10) 三次重複局面 → 和棋（threefold repetition）──
{
  // 王 e1/e8 + 白馬 g1 + 黑馬 g8，兩馬往返造成重複循環
  const c = emptyBoard();
  c.board[60] = { type: "k", color: "w" };  // e1
  c.board[4] = { type: "k", color: "b" };   // e8
  c.board[62] = { type: "n", color: "w" };  // g1
  c.board[6] = { type: "n", color: "b" };   // g8
  // 兩個半回合構成一次完整循環（Ng1-f3, Ng8-f6, Nf3-g1, Nf6-g8）
  const cycle = [
    [62, 45], [6, 21], [45, 62], [21, 6] // Ng1-f3, Ng8-f6, Nf3-g1, Nf6-g8
  ];
  for (let r = 0; r < 2; r++) {
    for (const [from, to] of cycle) {
      const res = c.makeMove(from, to);
      assert(res.ok === true, "repetition cycle move accepted (" + from + "->" + to + ")");
    }
  }
  // 進行第三次循環的第一個半回合，讓同一局面第 3 次出現
  const res = c.makeMove(62, 45); // Ng1-f3
  assert(res.ok === true, "third cycle first ply accepted");
  assert(c.status === "draw", "threefold repetition = draw");
  assert(c.result.indexOf("threefold") !== -1, "threefold repetition result text set");
}

// ── 11) 不足子力：一方一象 vs 一方一象（K+B vs K+B）永遠是死局和棋 ──
{
  // 白方一象(c1)、黑方一象(g8)，兩象異色格（先前被誤判成「還能下」的情況）
  let c = emptyBoard();
  c.board[60] = { type: "k", color: "w" };  // e1
  c.board[4] = { type: "k", color: "b" };   // e8
  c.board[58] = { type: "b", color: "w" };  // c1（格色 (7+2)%2=1）
  c.board[6] = { type: "b", color: "b" };   // g8（格色 (0+6)%2=0，與 c1 異色）
  assert(c.isInsufficientMaterial() === true, "K+B vs K+B = draw (insufficient material)");

  // 兩象同色格也依然是死局，證明與格色無關
  c = emptyBoard();
  c.board[60] = { type: "k", color: "w" };  // e1
  c.board[4] = { type: "k", color: "b" };   // e8
  c.board[58] = { type: "b", color: "w" };  // c1（格色 1）
  c.board[12] = { type: "b", color: "b" };  // e7（格色 (1+4)%2=1，與 c1 同色）
  assert(c.isInsufficientMaterial() === true, "K+B vs K+B = draw regardless of square color");

  // 對照組：兩象同屬一方且異色格（K+B+B vs K）→ 可強迫將死，非和棋
  c = emptyBoard();
  c.board[60] = { type: "k", color: "w" };  // e1
  c.board[4] = { type: "k", color: "b" };   // e8
  c.board[58] = { type: "b", color: "w" };  // c1（格色 1）
  c.board[41] = { type: "b", color: "w" };  // b3（格色 0，與 c1 異色）
  assert(c.isInsufficientMaterial() === false, "K+B+B vs K with different-color bishops = NOT a draw");
}

console.log("\nALL ADVANCED CHESS TESTS PASSED (" + pass + ")");
