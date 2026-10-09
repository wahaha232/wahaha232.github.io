# PlayHub — Free Online Games

🎮 A casual online games portal. **10 games are playable right now** — 9 classic board
games plus Solitaire — with no accounts, no downloads and no sign-up. **Click → Play.**

🔗 Live site: https://wahaha232.github.io/

Pure HTML / CSS / vanilla JavaScript. No build step.

## Games

| # | Game | Engine |
| --- | --- | --- |
| 1 | Easy Chess | embedded (Playpager) |
| 2 | Checkers | embedded (Playpager) |
| 3 | Ludo | embedded (Playpager) |
| 4 | Othello Reversi | self-built |
| 5 | Backgammon | self-built |
| 6 | Nine Men's Morris | self-built |
| 7 | Dominoes | self-built |
| 8 | Classic Battleship | self-built |
| 9 | Snakes & Ladders | self-built |
| 10 | Solitaire Online | self-built |

Easy Chess, Checkers and Ludo run in an iframe provided by
[Playpager](https://playpager.com/) under their free embed program. The other seven are
original, self-built engines (rules + board + controls), running entirely in your browser.
Coming soon: Puzzle Games, Space Invaders and Quiz.

The seven self-built games follow a consistent split: `js/<game>.js` (engine, no DOM) +
`js/<game>-ui.js` (UI) + their own `css/<game>.css` (or the shared `css/board-game.css`
for the 8×8-grid games). Each has an engine test script under `scripts/`.

## Homepage

The homepage (`index.html`) is real HTML (not an image): a hero with an `<h1>`, a
Featured Games grid, and a crawlable "All Games" link list, plus the mobile nav toggle
and the "Coming Soon" modal. Advertisement slots are reserved with fixed heights to
avoid layout shift (CLS) and hidden while empty.

## Localization

Marketing pages (Board Games, About, Contact, Privacy) are available in English,
Spanish (`es/`) and French (`fr/`), cross-linked with `hreflang`. Game pages themselves
are English-only; the localized category pages link through to them.

## Cookies & advertising

Google AdSense is enabled. `js/consent.js` sets **Google Consent Mode v2** defaults to
`denied` and loads *before* the AdSense loader on every page, then shows a small
accept/decline banner (`localStorage`, key `playhub-consent-v1`). For full EEA/UK
compliance, configure a Google-certified CMP in the AdSense account as well.

Publisher ID: `ca-pub-1512317781873771` (`ads.txt` present).

An additional third-party CPM network (`profitableratecpmnetwork.com`) is loaded on the
AdSense pages via `invoke.js` + `<div id="container-7d9bb8a39fc580ee58de14d8a8e63eab">`.
Note: mixing Google AdSense with third-party pop-under/CPM networks can violate AdSense
policy, and this loader currently runs outside the consent flow — review before relying
on it in production.

## Engine tests

Each self-built game has a Node-based test script under `scripts/`. Run everything with:

```bash
npm install   # only needed once, for the jsdom-based chess UI tests
npm test
```

## Structure

```
/
├── index.html            # Homepage (hero + featured cards + all-games list)
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
│   ├── consent.js        # cookie banner + Consent Mode v2
│   ├── games.js          # game data (used by board-games.html)
│   ├── main.js           # card generator + Coming Soon modal
│   └── <game>.js + <game>-ui.js
├── scripts/              # Node test scripts (one per self-built game)
├── games/                # playable game pages
├── assets/               # favicon + game cover images (.webp)
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
- `sitemap.xml` lists the homepage, board-games, the 10 games, about/contact/privacy and
  the `es/` + `fr/` marketing pages.
- Indexable pages declare `rel="canonical"`; the Board Games / About / Contact / Privacy
  pages declare `hreflang` alternates (en / es / fr / x-default).
- All paths are relative, so the site works under the GitHub Pages path.
