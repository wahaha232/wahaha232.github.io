# Mindboard Games — Free Online Games Portal

🎮 A casual online games portal. The homepage (`https://wahaha232.github.io/`) is a Playpager-style game lobby whose main entry is **Classic Board Games**, linking to the full game hub at **https://wahaha232.github.io/CHESSGAME/** (Ludo, Chess, Checkers, Backgammon, Morris, Dominoes, Battleship, Snakes & Ladders — all playable).

## Live

- Portal homepage: https://wahaha232.github.io/
- Games hub: https://wahaha232.github.io/CHESSGAME/
- Tokyo Live Cam (preserved): https://wahaha232.github.io/shibuya.html

## Structure

```
index.html    # 遊戲入口首頁（Playpager 風格，點 Classic Board Games 進入 CHESSGAME）
portal.css    # 入口首頁樣式
shibuya.html  # 原 Shibuya 直播鏡頭網站（已保留，不再是首頁）
style.css     # Shibuya 站的樣式（供 shibuya.html 使用）
ads.txt       # AdSense 授權（真實 publisher ID）
404.html / sitemap.xml / robots.txt
about.html / privacy.html   # Shibuya 站的附屬頁面
```

## Deployment

This repo deploys directly from the `main` branch (`Settings → Pages → Deploy from a branch: main / /`). Push to `main` and the root site updates automatically.
