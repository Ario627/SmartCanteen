(function (SC) {
  "use strict";

  const { esc } = SC.dom;

  const HEAD_NAV = [
    { path: "/", label: "Beranda" },
    { path: "/menu", label: "Menu" },
  ];

  const TAB_NAV = [
    { path: "/", label: "Beranda" },
    { path: "/menu", label: "Menu" },
    { path: "/cart", label: "Keranjang" },
  ];

  const MODULES = [
    { path: "/", label: "Beranda" },
    { path: "/menu", label: "Menu" },
    { path: "/cart", label: "Keranjang" },
    { path: "/queue", label: "Layar antrean" },
    { path: "/admin", label: "Dashboard kantin" },
  ];

  let countNode = null;
  let tabCountNode = null;
  let toastNode = null;
  let liveNode = null;
  let toastTimer = 0;

  const INSTAGRAM_ICON = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2"/><circle cx="12" cy="12" r="3.9"/><circle cx="17.4" cy="6.6" r="1.05" fill="currentColor" stroke="none"/></svg>`;

  function footMarkup() {
    return `<div class="site-foot__side">
      <div class="social">
        <a class="social__link" href="${esc(SC.config.instagramUrl)}" target="_blank" rel="noopener" aria-label="Instagram SmartCanteen">${INSTAGRAM_ICON}</a>
      </div>
      <p class="site-foot__meta">Tahap 02 &mdash; katalog, keranjang, checkout</p>
    </div>`;
  }

  function isActive(itemPath, path) {
    if (itemPath === "/") return path === "/";
    return path === itemPath || path.startsWith(`${itemPath}/`);
  }

  function navMarkup(path) {
    return HEAD_NAV.map(
      (item) =>
        `<a href="#${item.path}" data-nav="${item.path}"${isActive(item.path, path) ? ' aria-current="page"' : ""}>${esc(item.label)}</a>`
    ).join("");
  }

  function tabMarkup(path) {
    return TAB_NAV.map(
      (item) =>
        `<a href="#${item.path}" data-nav="${item.path}"${isActive(item.path, path) ? ' aria-current="page"' : ""}>${esc(item.label)}${item.path === "/cart" ? '<span class="tabbar__n" data-tab-count></span>' : ""}</a>`
    ).join("");
  }

  function mount(root) {
    root.innerHTML = `<a class="skip" href="#main">Lewati ke konten</a>
      <header class="site-head">
        <div class="shell site-head__in">
          <a class="brand" href="#/"><span class="brand__mark" aria-hidden="true"></span>SmartCanteen</a>
          <nav class="site-nav" aria-label="Navigasi utama" data-nav-slot>${navMarkup("/")}</nav>
          <a class="cart-btn" href="#/cart">
            Keranjang
            <span class="cart-btn__n" data-cart-count data-empty="true">0</span>
          </a>
        </div>
      </header>
      <main class="main" id="main"></main>
      <footer class="site-foot">
        <div class="shell site-foot__grid">
          <div>
            <p class="brand brand--foot"><span class="brand__mark" aria-hidden="true"></span>SmartCanteen</p>
            <p class="site-foot__note">Prototype antrean virtual kantin sekolah. Seluruh angka pada versi ini adalah simulasi, bukan data lapangan.</p>
          </div>
          <nav class="site-foot__nav" aria-label="Peta modul">
            ${MODULES.map((item) => `<a href="#${item.path}">${esc(item.label)}</a>`).join("")}
          </nav>
          ${footMarkup()}
        </div>
      </footer>
      <nav class="tabbar" aria-label="Navigasi bawah" data-tabbar>${tabMarkup("/")}</nav>
      <div class="toast" role="status" data-toast data-open="false"></div>
      <div class="live" role="status" aria-live="polite" data-live></div>`;

    countNode = SC.dom.qs("[data-cart-count]", root);
    tabCountNode = SC.dom.qs("[data-tab-count]", root);
    toastNode = SC.dom.qs("[data-toast]", root);
    liveNode = SC.dom.qs("[data-live]", root);
  }

  function syncNav(path) {
    SC.dom.qsa("[data-nav]").forEach((node) => {
      if (isActive(node.dataset.nav, path)) node.setAttribute("aria-current", "page");
      else node.removeAttribute("aria-current");
    });
  }

  function syncCartCount() {
    const total = SC.cart.count();
    if (countNode) {
      countNode.textContent = String(total);
      countNode.dataset.empty = String(total === 0);
    }
    if (tabCountNode) tabCountNode.textContent = total ? String(total) : "";
  }

  function toast(message) {
    if (!toastNode) return;
    toastNode.textContent = message;
    toastNode.dataset.open = "true";
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastNode.dataset.open = "false";
    }, 2400);
  }

  function announce(message) {
    if (liveNode) liveNode.textContent = message;
  }

  SC.layout = { mount, syncNav, syncCartCount, toast, announce };
})(window.SC || (window.SC = {}));
