(function (SC) {
  "use strict";

  const { esc } = SC.dom;
  const { currency, number } = SC.fmt;

  function art(product, options) {
    const settings = options || {};
    const seed = SC.fmt.hash(product.id);
    const vars = [
      `--c: var(--cat-${product.category})`,
      `--a: ${(seed % 180) - 90}deg`,
    ].join(";");

    return `<span class="art${settings.thumb ? " art--thumb" : ""}" aria-hidden="true" style="${vars}"><span class="art__code">${SC.data.code(product.id)}</span></span>`;
  }

  function cardControl(product) {
    if (!product.available) return "";
    const line = SC.cart.lineFor(product.id);
    if (!line) {
      return `<button type="button" class="btn-add" data-add="${esc(product.id)}" aria-label="Tambah ${esc(product.name)} ke keranjang">+</button>`;
    }
    return `<span class="stepper">
      <button type="button" data-bump="-1" data-key="${esc(line.key)}" aria-label="Kurangi ${esc(product.name)}">&minus;</button>
      <span>${line.qty}</span>
      <button type="button" data-bump="1" data-key="${esc(line.key)}" aria-label="Tambah ${esc(product.name)}">+</button>
    </span>`;
  }

  function productCard(product) {
    const category = SC.data.categoryOf(product.category);
    const badge = SC.data.isBestSeller(product.id) && product.available;
    return `<article class="card" data-product="${esc(product.id)}" data-off="${String(!product.available)}">
      <a class="card__link" href="#/menu/${esc(product.id)}">
        ${art(product)}
        ${badge ? '<span class="card__flag card__flag--top">Terlaris</span>' : ""}
        ${product.available ? "" : '<span class="card__flag">Habis</span>'}
      </a>
      <div class="card__body">
        <h3 class="card__name"><a href="#/menu/${esc(product.id)}">${esc(product.name)}</a></h3>
        <p class="card__meta">${esc(category.label)} · ${number(product.sold)} terjual</p>
        <div class="card__foot" data-foot="${esc(product.id)}">
          <span class="price">${currency(product.price)}</span>
          <span data-slot>${cardControl(product)}</span>
        </div>
      </div>
    </article>`;
  }

  function productGrid(products) {
    return products.map(productCard).join("");
  }

  function syncFeet(root) {
    SC.dom.qsa("[data-foot]", root || document).forEach((node) => {
      const product = SC.data.byId(node.dataset.foot);
      const slot = SC.dom.qs("[data-slot]", node);
      if (product && slot) slot.innerHTML = cardControl(product);
    });
  }

  function chipRow(items, active, attribute) {
    return items
      .map((item) => {
        const on = item.id === active;
        return `<button type="button" class="chip${on ? " is-on" : ""}" data-${attribute}="${esc(item.id)}" aria-pressed="${on}">${esc(item.label)}</button>`;
      })
      .join("");
  }

  function pageHead(config) {
    return `<header class="page-head">
      ${config.index ? `<p class="page-head__idx">${esc(config.index)}</p>` : ""}
      <h1 class="page-head__title">${esc(config.title)}</h1>
      ${config.lead ? `<p class="page-head__lead">${esc(config.lead)}</p>` : ""}
    </header>`;
  }

  function sectionHead(config) {
    return `<header class="sec-head">
      ${config.index ? `<p class="sec-head__idx">${esc(config.index)}</p>` : ""}
      <h2 class="sec-head__title">${esc(config.title)}</h2>
      ${config.hint ? `<p class="sec-head__hint">${esc(config.hint)}</p>` : ""}
    </header>`;
  }

  function empty(config) {
    return `<div class="empty">
      <p class="empty__title">${esc(config.title)}</p>
      ${config.note ? `<p class="empty__note">${esc(config.note)}</p>` : ""}
      ${config.action ? `<button type="button" class="btn btn--line" ${config.action.attr}>${esc(config.action.label)}</button>` : ""}
    </div>`;
  }

  SC.ui = { art, productCard, productGrid, syncFeet, chipRow, pageHead, sectionHead, empty };
})(window.SC || (window.SC = {}));
