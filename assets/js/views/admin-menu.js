(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const { esc } = SC.dom;
  const PRICE_FORMAT = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

  function displayPrice(value) {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 6);
    return digits ? PRICE_FORMAT.format(Number(digits)) : "";
  }

  function productCard(product) {
    const available = product.available;
    return `<article class="stock-row" data-stock-row="${esc(product.id)}">
      <div class="stock-row__art">${SC.ui.art(product, { thumb: true })}</div>
      <div class="stock-row__body">
        <strong>${esc(product.name)}</strong>
        <span>${esc(SC.data.categoryOf(product.category).label)} · ${SC.fmt.currency(product.price)}</span>
      </div>
      <span class="pill ${available ? "pill--ready" : "pill--pending"}">${available ? "Tersedia" : "Habis"}</span>
      <div class="stock-row__actions">
        <button class="btn btn--link" type="button" data-edit-menu="${esc(product.id)}">Ubah</button>
        <button class="btn btn--link" type="button" data-toggle-stock="${esc(product.id)}">${available ? "Tandai habis" : "Aktifkan"}</button>
        ${product.id.startsWith("custom-") ? `<button class="btn btn--link stock-row__delete" type="button" data-delete-menu="${esc(product.id)}">Hapus</button>` : ""}
      </div>
    </article>`;
  }

  function editorMarkup(product) {
    const current = product || { name: "", category: "makanan", price: "", description: "" };
    const editing = Boolean(product);

    return `<section class="menu-editor" data-editor>
      <header class="menu-editor__head">
        <div><p class="eyebrow">${editing ? "Sunting katalog" : "Entri katalog"}</p><h2>${editing ? "Ubah menu" : "Tambah menu"}</h2></div>
        <button class="btn btn--link" type="button" data-cancel-editor>Batal</button>
      </header>
      <form class="menu-form" data-menu-form data-product-id="${editing ? esc(product.id) : ""}" novalidate>
        <div class="menu-form__grid">
          <div class="menu-form__name">
            <label class="field-label" for="menu-name">Nama menu</label>
            <input class="field" id="menu-name" name="name" maxlength="48" autocomplete="off" required value="${esc(current.name)}" placeholder="Contoh: Nasi ayam sambal matah">
          </div>
          <div>
            <label class="field-label" for="menu-category">Kategori</label>
            <select class="field" id="menu-category" name="category" required>
              ${SC.data.categories.filter((category) => category.id !== "semua").map((category) => `<option value="${category.id}"${category.id === current.category ? " selected" : ""}>${esc(category.label)}</option>`).join("")}
            </select>
          </div>
          <div>
            <label class="field-label" for="menu-price">Harga / rupiah</label>
            <input class="field" id="menu-price" name="price" type="text" inputmode="numeric" required value="${current.price ? PRICE_FORMAT.format(Number(current.price)) : ""}" placeholder="12.000">
          </div>
          <div class="menu-form__description">
            <label class="field-label" for="menu-description">Deskripsi</label>
            <textarea class="field" id="menu-description" name="description" rows="3" maxlength="180" required placeholder="Bahan utama dan detail penyajian">${esc(current.description)}</textarea>
            <span class="menu-form__counter" data-description-count>${current.description.length}/180</span>
          </div>
        </div>
        <p class="menu-form__error" data-menu-error hidden></p>
        <div class="menu-form__footer"><span>Harga Rp500–Rp250.000 · Deskripsi 8–180 karakter</span><button class="btn btn--solid" type="submit">${editing ? "Simpan perubahan" : "Tambah ke katalog"}</button></div>
      </form>
    </section>`;
  }

  views.menuAdmin = function menuAdminView() {
    let filter = "semua";
    let query = "";
    let editingId = null;
    const el = SC.dom.html('<main class="admin-app"></main>');

    function paint() {
      const selected = SC.data.list({ category: filter, query, sort: "nama" });
      const unavailableCount = SC.data.products.filter((product) => !product.available).length;
      el.innerHTML = `<header class="admin-head">
          <div class="admin-head__brand"><a class="brand" href="#/"><span class="brand__mark" aria-hidden="true"></span>SmartCanteen</a><span class="admin-head__divider"></span><span class="admin-head__label">Kantin / Kelola menu</span></div>
          ${SC.layout.operationsNav("/admin/menu")}
        </header>
        <div class="admin-shell">
          <section class="admin-welcome">
            <div><p class="eyebrow">Katalog kantin</p><h1>Kelola menu</h1><p>Perbarui nama, harga, stok, dan deskripsi katalog kantin.</p></div>
            <button class="btn btn--solid" type="button" data-new-menu>Tambah menu</button>
          </section>
          ${editorMarkup(editingId ? SC.data.byId(editingId) : null)}
          <section class="admin-menu-tools">
            <label class="admin-search"><span class="live-label">Cari menu</span><input class="field" type="search" data-menu-search aria-label="Cari menu" placeholder="Cari menu" value="${esc(query)}"></label>
            <div class="chips" role="group" aria-label="Filter kategori">${SC.ui.chipRow(SC.data.categories, filter, "menu-filter")}</div>
          </section>
          <p class="admin-menu-summary">${SC.data.products.length} menu terdaftar · ${unavailableCount} sedang habis · ${SC.data.products.length - unavailableCount} tersedia</p>
          <section class="admin-menu-list" aria-label="Daftar menu">
            <header class="admin-menu-list__head"><span>Menu / harga</span><span>Status</span><span>Perubahan</span></header>
            ${selected.length ? selected.map(productCard).join("") : '<div class="admin-empty"><p>Menu tidak ditemukan</p><span>Coba kata kunci atau kategori lain.</span></div>'}
          </section>
          <footer class="admin-note"><span>SMARTCANTEEN / PROTOTYPE</span><span>Katalog lokal tersimpan di peramban</span></footer>
        </div>`;
    }

    SC.dom.on(el, "input", "[data-menu-search]", (event, node) => {
      query = node.value.trim();
      const top = window.scrollY;
      paint();
      const nextSearch = el.querySelector("[data-menu-search]");
      nextSearch.focus();
      nextSearch.setSelectionRange(query.length, query.length);
      window.scrollTo(0, top);
    });

    SC.dom.on(el, "click", "[data-menu-filter]", (event, node) => {
      filter = node.dataset.menuFilter;
      query = el.querySelector("[data-menu-search]").value.trim();
      const top = window.scrollY;
      paint();
      window.scrollTo(0, top);
    });

    SC.dom.on(el, "input", "[name='price']", (event, node) => {
      node.value = displayPrice(node.value);
    });

    SC.dom.on(el, "input", "[name='description']", (event, node) => {
      const counter = el.querySelector("[data-description-count]");
      if (counter) counter.textContent = `${node.value.length}/180`;
    });

    SC.dom.on(el, "click", "[data-new-menu]", () => {
      editingId = null;
      paint();
      el.querySelector("#menu-name").focus();
    });

    SC.dom.on(el, "click", "[data-edit-menu]", (event, node) => {
      editingId = node.dataset.editMenu;
      paint();
      el.querySelector("#menu-name").focus();
    });

    SC.dom.on(el, "click", "[data-cancel-editor]", () => {
      editingId = null;
      paint();
    });

    SC.dom.on(el, "submit", "[data-menu-form]", (event, form) => {
      event.preventDefault();
      const data = new FormData(form);
      const result = SC.data.saveProduct(
        {
          name: data.get("name"),
          category: data.get("category"),
          price: Number(String(data.get("price")).replace(/\D/g, "")),
          description: data.get("description"),
        },
        form.dataset.productId || null
      );

      const error = el.querySelector("[data-menu-error]");
      if (result.error) {
        error.textContent = result.error;
        error.hidden = false;
        return;
      }

      const wasEditing = Boolean(form.dataset.productId);
      editingId = null;
      filter = "semua";
      query = "";
      paint();
      SC.layout.toast(wasEditing ? "Perubahan menu disimpan" : "Menu baru ditambahkan");
      el.querySelector("[data-menu-search]")?.focus();
    });

    SC.dom.on(el, "click", "[data-toggle-stock]", (event, node) => {
      const product = SC.data.byId(node.dataset.toggleStock);
      if (!product) return;
      SC.data.setAvailability(product.id, !product.available);
      SC.layout.toast(`${product.name}: ${product.available ? "tersedia" : "habis"}`);
    });

    SC.dom.on(el, "click", "[data-delete-menu]", (event, node) => {
      const result = SC.data.removeProduct(node.dataset.deleteMenu);
      if (result.error) {
        SC.layout.toast(result.error);
        return;
      }
      editingId = null;
      paint();
      SC.layout.toast(`${result.product.name} dihapus dari katalog`);
    });

    const stopInventory = SC.data.subscribeInventory(() => paint());

    paint();

    return {
      title: "Kelola menu — SmartCanteen",
      announce: "Pengelolaan menu kantin",
      el,
      destroy() {
        stopInventory();
      },
    };
  };
})(window.SC || (window.SC = {}));
