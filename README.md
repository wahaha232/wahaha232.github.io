# Mindboard Games — Free Online Classic Board Games

🎮 A casual online games portal. **9 classic board games** on the homepage (3×3 grid) — **all 9 are fully playable**, each with its own original, self-built rules engine (no third-party embeds).

Pure HTML / CSS / Vanilla JavaScript. No frameworks, no accounts, no downloads. **Click → Play.**

🔗 Live site: https://wahaha232.github.io/

## Games

| # | Game | Status |
| --- | --- | --- |
| 1 | Ludo | ✅ **Available** |
| 2 | Othello Reversi | ✅ **Available** |
| 3 | Mini Chess | ✅ **Available** |
| 4 | Checkers | ✅ **Available** |
| 5 | Backgammon | ✅ **Available** |
| 6 | Nine Men's Morris | ✅ **Available** |
| 7 | Dominoes | ✅ **Available** |
| 8 | Classic Battleship | ✅ **Available** |
| 9 | Snakes & Ladders | ✅ **Available** |

Every game page also has a "How to play" rules section, and each has its own engine test script under `scripts/`.

## Mini Chess

`games/chess.html` — a full chess game built in vanilla JS:

- 8×8 board, white/black pieces, legal move highlighting
- Move / capture / turn management
- Check, checkmate, stalemate, draw by insufficient material, 50-move rule, threefold repetition
- Castling, en passant, pawn promotion (with piece picker)
- Keyboard-accessible board (arrow keys + Enter), `aria-live` status
- New Game / Undo, move history panel
- Responsive, touch-friendly

Architecture is modular:

- `js/chess.js` — chess engine (rules, move generation, game state). No DOM.
- `js/chess-ui.js` — board UI, click/keyboard handling, promotion picker, history.
- `css/chess.css` — board styling.

Every other game follows the same split: `js/<game>.js` (engine, no DOM) + `js/<game>-ui.js` (UI, calls only the engine's public methods) + its own `css/<game>.css` (or the shared `css/board-game.css` for the 8×8-grid games).

## Engine tests

Each game has its own Node-based test script under `scripts/`. Run everything with:

```bash
npm install   # only needed once, for the jsdom-based chess UI tests
npm test
```

This runs, in order: `test-chess.cjs`, `test-chess-ui.cjs` (jsdom), `test-othello.cjs`, `test-checkers.cjs`, `test-snakes-ladders.cjs`, `test-dominoes.cjs`, `test-battleship.cjs`, `test-morris.cjs`, `test-ludo.cjs`, `test-backgammon.cjs` — 306 checks total across all 9 games, covering the rule edge cases specific to each (castling/en passant/promotion, mandatory capture chains, mill formation, bear-off overage, etc.), not just happy-path moves.

## Structure

```
/
├── index.html            # 首頁：3×3 Classic Board Games 清單
├── about.html / privacy.html
├── robots.txt / sitemap.xml
├── css/
│   ├── style.css         # 首頁樣式（portal 風格）
│   ├── board-game.css    # Othello + Checkers 共用的 8×8 棋盤樣式
│   ├── chess.css         # 西洋棋專用樣式
│   └── ludo.css / backgammon.css / morris.css / dominoes.css
│       / battleship.css / snakes-ladders.css   # 其餘 6 款各自的棋盤樣式
├── js/
│   ├── games.js          # ★ 遊戲資料陣列（status: available / coming-soon）
│   ├── main.js           # 首頁卡片產生器 + Coming Soon 彈窗 + 選單
│   └── <game>.js + <game>-ui.js   # 每款遊戲各自的引擎 + 介面（9 組）
├── scripts/
│   └── test-<game>.cjs   # 每款遊戲各自的 Node 測試腳本（+ test-chess-ui.cjs 用 jsdom）
├── games/
│   └── <game>.html        # 9 個可玩的遊戲頁面
└── assets/
    ├── favicon.svg
    └── games/            # 9 張遊戲封面圖（.webp）
```

## Making a Game Available

(Kept for reference — this is how each of the 9 games above went from "Coming Soon" to playable.)

1. Build the real game page, e.g. `games/<id>.html`, plus its `js/<id>.js` engine and `js/<id>-ui.js` UI.
2. In `js/games.js`, change its status:

```javascript
{ id: "ludo", name: "Ludo", image: "assets/games/ludo.webp", url: "games/ludo.html", status: "available" }
```

The homepage automatically turns the card from `🔒 Coming Soon` into `▶ PLAY NOW`. No homepage redesign needed.

## Deployment

`.github/workflows/deploy.yml` publishes the static files to GitHub Pages on every push to `main`.

## Local Preview

```bash
python -m http.server 8080
```

Open http://localhost:8080/

## Notes

- Advertisement slots are reserved with fixed heights to avoid layout shift, on every page (homepage + all 9 game pages).
- All paths are relative, so the site works under the GitHub Pages sub-path.
- All 9 games are original, self-built engines — no third-party game embeds.

## Google AdSense

Ad units are **reserved** (not active yet). To activate them:

1. Get approved by Google AdSense, then add your publisher line to `ads.txt`:

   ```
   google.com, pub-XXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
   ```

2. In `index.html` and every `games/*.html` page, replace `ca-pub-XXXXXXXXXXXXXXXX` with your publisher ID and uncomment the AdSense loader `<script>`.

3. In each `.ad-slot` div, replace the placeholder with your `<ins class="adsbygoogle">` snippet (copy it from your AdSense account) and set `data-ad-client` / `data-ad-slot`.

Ad slot positions (all fixed-height to avoid CLS, all **outside** the game area):

- Homepage: leaderboard under the title, leaderboard below the game grid
- Every game page: 300×250 rectangle between the game controls and the "How to play" section, plus a leaderboard at the bottom

## SEO

- `robots.txt` allows all crawlers and points to `sitemap.xml`.
- `sitemap.xml` lists all 12 pages (homepage, 9 games, about, privacy).
