// ═══════════════════════════════════════════════════════════════
// Mindboard Games — 首頁遊戲列表產生器
//
// 依照 js/games.js 的資料自動產生 3×3 遊戲卡片：
//   - status "available"    → 可點擊進入遊戲，顯示 ▶ PLAY NOW
//   - status "coming-soon"  → 點擊跳出「Coming Soon」提示，不進入遊戲
//
// 新增遊戲時只需要修改 games.js，不需要修改 HTML。
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var grid = document.getElementById("game-grid");
  var modal = document.getElementById("soon-modal");
  var modalName = document.getElementById("soon-name");
  var modalClose = document.getElementById("soon-close");

  function buildCard(game) {
    var card = document.createElement("a");
    card.className = "game-card" + (game.status === "available" ? " game-card--active" : " game-card--soon");
    card.href = game.url;
    card.setAttribute("aria-label", game.name);

    // ── 圖片區 ──
    var thumb = document.createElement("span");
    thumb.className = "game-card__thumb";

    var img = document.createElement("img");
    img.src = game.image;
    img.alt = game.name;
    img.loading = "lazy";
    img.width = 400;
    img.height = 400;
    thumb.appendChild(img);

    // ── 名稱列 ──
    var meta = document.createElement("span");
    meta.className = "game-card__meta";

    var name = document.createElement("span");
    name.className = "game-card__name";
    name.textContent = game.name;

    var btn = document.createElement("span");
    btn.className = "game-card__btn " + (game.status === "available" ? "game-card__btn--play" : "game-card__btn--soon");
    btn.textContent = game.status === "available" ? "▶ PLAY NOW" : "🔒 Coming Soon";
    meta.appendChild(name);
    meta.appendChild(btn);

    card.appendChild(thumb);
    card.appendChild(meta);

    // 尚未開發的遊戲：點擊顯示 Coming Soon 提示，不進入遊戲
    if (game.status !== "available") {
      card.addEventListener("click", function (event) {
        event.preventDefault();
        showComingSoon(game.name);
      });
    }

    return card;
  }

  function showComingSoon(name) {
    if (!modal || !modalName) return;
    modalName.textContent = name;
    modal.classList.remove("is-hidden");
  }

  function hideModal() {
    if (!modal) return;
    modal.classList.add("is-hidden");
  }

  function initGrid() {
    if (!grid) return;
    // data-category 可將卡片限定在某一分類（例如 board-games.html 只列出
    // cat === "board-games" 的項目）；沒有這個屬性時列出全部（供未來若
    // 有頁面想顯示所有遊戲使用）。
    var category = grid.dataset.category;
    var list = category ? games.filter(function (g) { return g.cat === category; }) : games;
    list.forEach(function (game) {
      grid.appendChild(buildCard(game));
    });
  }

  function initModal() {
    if (!modal) return;
    if (modalClose) modalClose.addEventListener("click", hideModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) hideModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") hideModal();
    });
  }

  function initNav() {
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function init() {
    initGrid();
    initModal();
    initNav();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
