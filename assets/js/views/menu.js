(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const SORTS = [
    { id: "populer", label: "Terlaris" },
    { id: "murah", label: "Termurah" },
    { id: "mahal", label: "Termahal" },
  ];

  views.menu = function menu(ctx) {
    let category = ctx.query.get("kategori") || "semua";
    let keyword = ctx.query.get("cari") || "";
    let sort = "populer";

    const el = SC.dom.html(`
      <section class="shell page">
        ${SC.ui.pageHead({
          index: "01 / Katalog",
          title: "Menu kantin",
          lead: "Harga dan ketersediaan diperbarui setiap pagi oleh pengelola kantin. Stok terbatas ditandai langsung pada kartu menu.",
        })}
        <div class="toolbar">
          <div class="toolbar__row">
            <div class="toolbar__search">
              <input class="field" type="search" data-search aria-label="Cari menu" placeholder="Cari nama menu atau bahan" value="${SC.dom.esc(keyword)}">
            </div>
            <div class="seg" role="group" aria-label="Urutkan menu">
              ${SORTS.map(
                (item) =>
                  `<button type="button" data-sort="${item.id}" aria-pressed="${item.id === sort}">${item.label}</button>`
              ).join("")}
            </div>
          </div>
          <div class="chips" role="group" aria-label="Kategori" data-chips>
            ${SC.ui.chipRow(SC.data.categories, category, "cat")}
          </div>
        </div>
        <p class="result-line" data-result></p>
        <div class="grid grid--products" data-grid></div>
      </section>
    `);

    const grid = SC.dom.qs("[data-grid]", el);
    const chips = SC.dom.qs("[data-chips]", el);
    const resultLine = SC.dom.qs("[data-result]", el);
    const search = SC.dom.qs("[data-search]", el);

    function paintGrid() {
      const items = SC.data.list({ category, query: keyword, sort });

      grid.innerHTML = items.length
        ? SC.ui.productGrid(items)
        : SC.ui.empty({
            title: "Tidak ada menu yang cocok",
            note: `Tidak ada hasil untuk "${keyword}" pada kategori ini.`,
            action: { label: "Reset filter", attr: "data-reset" },
          });

      const label = SC.data.categoryOf(category).label.toLowerCase();
      resultLine.textContent = items.length
        ? `${SC.fmt.number(items.length)} menu · kategori ${label}`
        : `0 menu · kategori ${label}`;
    }

    function syncControls() {
      SC.dom.qsa("[data-cat]", chips).forEach((node) => {
        const on = node.dataset.cat === category;
        node.classList.toggle("is-on", on);
        node.setAttribute("aria-pressed", String(on));
      });
      SC.dom.qsa("[data-sort]", el).forEach((node) => {
        node.setAttribute("aria-pressed", String(node.dataset.sort === sort));
      });
    }

    const onSearch = SC.dom.debounce(() => {
      keyword = search.value.trim();
      paintGrid();
    }, 140);

    SC.dom.on(el, "click", "[data-cat]", (event, node) => {
      category = node.dataset.cat;
      syncControls();
      paintGrid();
    });

    SC.dom.on(el, "click", "[data-sort]", (event, node) => {
      sort = node.dataset.sort;
      syncControls();
      paintGrid();
    });

    SC.dom.on(el, "click", "[data-reset]", () => {
      category = "semua";
      keyword = "";
      sort = "populer";
      search.value = "";
      syncControls();
      paintGrid();
    });

    SC.dom.on(el, "input", "[data-search]", onSearch);

    paintGrid();

    return {
      title: "Menu — SmartCanteen",
      announce: "Halaman menu kantin",
      el,
    };
  };
})(window.SC || (window.SC = {}));
