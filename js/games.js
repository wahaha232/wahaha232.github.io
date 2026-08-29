// ═══════════════════════════════════════════════════════════════
// Mindboard Games — 遊戲資料中心（Classic Board Games Portal）
//
// 首頁的 9 款遊戲全部由此陣列動態產生（3×3 網格）。
//
// 開發一款新遊戲時：
//   1. 建立 games/<id>.html（真正可玩的遊戲頁面）
//   2. 把該筆資料的 status 改為 "available"
//   首頁會自動把「Coming Soon」換成「PLAY NOW」，不需要重新設計。
//
// status 可為：
//   "available"     → 可玩，顯示 PLAY NOW 按鈕
//   "coming-soon"   → 尚未開發，顯示 🔒 Coming Soon（點擊跳出提示）
//
// cat 分類：board-games（經典桌遊）/ puzzle / arcade / cards / trivia
// ═══════════════════════════════════════════════════════════════

const games = [
  {
    id: "ludo",
    name: "Ludo",
    cat: "board-games",
    image: "assets/games/ludo.webp",
    url: "games/ludo.html",
    status: "available"
  },
  {
    id: "chess",
    name: "Easy Chess",
    cat: "board-games",
    image: "assets/games/chess.webp",
    url: "games/chess.html",
    status: "available"
  },
  {
    id: "othello",
    name: "Othello Reversi",
    cat: "board-games",
    image: "assets/games/othello.webp",
    url: "games/othello.html",
    status: "available"
  },
  {
    id: "checkers",
    name: "Checkers",
    cat: "board-games",
    image: "assets/games/checkers.webp",
    url: "games/checkers.html",
    status: "available"
  },
  {
    id: "backgammon",
    name: "Backgammon",
    cat: "board-games",
    image: "assets/games/backgammon.webp",
    url: "games/backgammon.html",
    status: "available"
  },
  {
    id: "morris",
    name: "Nine Men's Morris",
    cat: "board-games",
    image: "assets/games/morris.webp",
    url: "games/morris.html",
    status: "available"
  },
  {
    id: "dominoes",
    name: "Dominoes",
    cat: "board-games",
    image: "assets/games/dominoes.webp",
    url: "games/dominoes.html",
    status: "available"
  },
  {
    id: "battleship",
    name: "Classic Battleship",
    cat: "board-games",
    image: "assets/games/battleship.webp",
    url: "games/battleship.html",
    status: "available"
  },
  {
    id: "snakes-ladders",
    name: "Snakes & Ladders",
    cat: "board-games",
    image: "assets/games/snakes-ladders.webp",
    url: "games/snakes-ladders.html",
    status: "available"
  },
  {
    id: "solitaire",
    name: "Solitaire Online",
    cat: "cards",
    image: "assets/games/solitaire.webp",
    url: "games/solitaire.html",
    status: "available"
  },
  {
    id: "quiz",
    name: "Quiz",
    cat: "trivia",
    image: "assets/games/quiz.webp",
    url: "games/quiz.html",
    status: "coming-soon"
  }
];
