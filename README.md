# PlayHub — Free Online Games

🎮 A casual online games portal. **25 games are playable right now** — classic board and
card games, Solitaire, puzzles, arcade games and quizzes — with no accounts, no downloads
and no sign-up. **Click → Play.**

🔗 Live site: https://wahaha232.github.io/

Pure HTML / CSS / vanilla JavaScript. No build step.

## Games

Five category hubs open from the homepage; each hub links its playable games.

| Category (hub) | Games |
| --- | --- |
| **Board Games** — `board-games.html` | Easy Chess, Checkers, Ludo, Othello Reversi, Backgammon, Nine Men's Morris, Dominoes, Classic Battleship, Snakes & Ladders |
| **Solitaire** — `games/solitaire.html` | Klondike, FreeCell, Spider, Pyramid, TriPeaks |
| **Puzzle** — `games/puzzle.html` | 2048, Sliding Puzzle, Minesweeper, Sudoku |
| **Arcade** — `games/space-invaders.html` | Space Invaders, Snake, Breakout, Pong |
| **Quiz** — `games/quiz.html` | General Knowledge, Math, World Capitals |

All 25 games are original, self-built code that runs entirely in your browser — nothing is
embedded from a third party. Each game follows a consistent split: `js/<game>.js` (engine,
no DOM) + `js/<game>-ui.js` (UI) + its own `css/<game>.css` (or the shared
`css/board-game.css` / `css/cards.css`). Each has an engine test script under `scripts/`.

## Homepage

The homepage (`index.html`) is real HTML (not an image): a hero with an `<h1>`, a
Featured Games grid and the mobile nav toggle. The ad area sits
below the featured games (before the footer); `js/consent.js` injects each third-party ad
network into its own iframe only after consent and auto-sizes it so every ad is visible
without a scrollbar.

## Localization

Marketing pages (Board Games, About, Contact, Privacy) are available in English,
Spanish (`es/`) and French (`fr/`), cross-linked with `hreflang`. Game pages themselves
are English-only; the localized category pages link through to them.

## Cookies & advertising

This site does **not** use Google AdSense or Google Analytics. Advertising is delivered by
third-party ad networks, loaded **only after the visitor accepts** the cookie notice.
`js/consent.js` shows an accept/decline banner (`localStorage`, key `playhub-consent-v1`)
and, on acceptance, injects each ad network into its own sandboxed iframe (so their
`document.write` cannot overwrite the page) sized to fit its content:

- `profitableratecpmnetwork.com` via `invoke.js` + `<div id="container-7d9bb8a39fc580ee58de14d8a8e63eab">`.
- `highrevenueformat.com` via `atOptions` + `invoke.js` (300×250 iframe).

The Privacy Policy (en/es/fr) describes these third-party advertising cookies.

## Engine tests

Each self-built game has a Node-based test script under `scripts/`. Run everything with:

```bash
npm install   # only needed once, for the jsdom-based chess UI tests
npm test
```

## Structure

```
/
├── index.html            # Homepage (hero + featured category cards)
├── board-games.html      # Board Games category (cards from js/games.js)
├── about.html / contact.html / privacy.html
├── es/ fr/               # Spanish / French marketing pages
├── 404.html
├── robots.txt / sitemap.xml / ads.txt
├── css/
│   ├── style.css         # shared portal + page styles (+ cookie banner)
│   ├── board-game.css    # shared 8×8 board styles
│   └── chess.css / ludo.css / backgammon.css / morris.css
│       / dominoes.css / battleship.css / snakes-ladders.css
├── js/
│   ├── consent.js        # cookie banner + third-party ad-network gating
│   ├── games.js          # game data (used by board-games.html)
│   ├── main.js           # card generator (board-games grid)
│   └── <game>.js + <game>-ui.js
├── scripts/              # Node test scripts (one per self-built game)
├── games/                # playable game pages
├── assets/               # favicon + game cover images (.webp / .svg)
└── shibuya/              # separate Shibuya live-cam microsite
```

## Adding a game

1. Build the real game page `games/<id>.html` (+ engine/UI if self-built).
2. In `js/games.js`, add/adjust the entry and set `status: "available"`.

`board-games.html` filters `games.js` by `cat === "board-games"`, so card status follows
the data automatically.

## Deployment

This repo is named `wahaha232.github.io`, so GitHub Pages serves it directly from the
`main` branch root. Push to `main` to publish — no workflow file is required.

## Local preview

```bash
python -m http.server 8080
```

Open http://localhost:8080/

## SEO

- `robots.txt` allows all crawlers and points to `sitemap.xml`.
- `sitemap.xml` lists the homepage, board-games, the 25 games and 5 category hubs,
  about/contact/privacy and the `es/` + `fr/` marketing pages.
- Indexable pages declare `rel="canonical"`; the Board Games / About / Contact / Privacy
  pages declare `hreflang` alternates (en / es / fr / x-default).
- All paths are relative, so the site works under the GitHub Pages path.
