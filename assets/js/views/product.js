(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const { esc, qs, replace } = SC.dom;

  views.product = function product(ctx) {
    const item = SC.data.byId(ctx.params.id);
    if (!item) return views.notFound(ctx);

    const category = SC.data.categoryOf(item.category);
    const related = SC.data
      .list({ category: item.category, sort: "populer" })
      .filter((candidate) => candidate.id !== item.id)
      .slice(0, 4);

    let qty = 1;

    const el = SC.dom.html(`<div data-product>
      <section class="shell">
        <div class="detail">
          <div class="detail__art">${SC.ui.art(item)}</div>
          <div>
            <a class="back" href="#/menu">&larr; Semua menu</a>
            <h1 class="detail__title">${esc(item.name)}</h1>
            <p class="detail__price" data-price>${SC.fmt.currency(item.price)}</p>
            <p class="detail__desc">${esc(item.description)}</p>
            <p class="detail__facts">
              <span>${esc(category.label)}</span>
              <span>${SC.fmt.number(item.sold)} terjual</span>
              <span>Kode ${SC.data.code(item.id)}</span>
            </p>
            ${
              item.available
                ? ""
                : `<p class="notice">Menu ini sedang habis hari ini. Pengelola kantin biasanya menambah stok pada jam istirahat kedua.</p>`
            }
            <div class="detail__buy">
              <span class="stepper stepper--lg">
                <button type="button" data-qty="-1" aria-label="Kurangi jumlah">&minus;</button>
                <span data-qty-value>1</span>
                <button type="button" data-qty="1" aria-label="Tambah jumlah">+</button>
              </span>
              <button class="btn btn--solid btn--wide" type="button" data-submit${item.available ? "" : " disabled"} data-submit-label>
                Tambahkan &middot; ${SC.fmt.currency(item.price)}
              </button>
            </div>
            <div class="detail__note">
              <label class="field-label" for="note">Catatan untuk dapur</label>
              <textarea class="field" id="note" maxlength="${SC.cart.NOTE_LIMIT}" rows="2" placeholder="Contoh: tanpa sayur, sambal dipisah" data-note></textarea>
              <p class="detail__note-meta"><span>Opsional</span><span><span data-note-count>0</span>/${SC.cart.NOTE_LIMIT}</span></p>
            </div>
          </div>
        </div>
      </section>

      ${
        related.length
          ? `<section class="band">
              <div class="shell">
                ${SC.ui.sectionHead({
                  title: `Lainnya di ${category.label.toLowerCase()}`,
                  hint: "Menu lain yang sering dipesan bersama ini.",
                })}
                <div class="grid grid--products">${SC.ui.productGrid(related)}</div>
              </div>
            </section>`
          : ""
      }
    </div>`);

    const qtyValue = qs("[data-qty-value]", el);
    const priceNode = qs("[data-price]", el);
    const submit = qs("[data-submit]", el);
    const note = qs("[data-note]", el);
    const noteCount = qs("[data-note-count]", el);

    function paint() {
      qtyValue.textContent = String(qty);
      replace(priceNode, SC.fmt.currency(item.price * qty));
      if (submit) {
        replace(submit, `Tambahkan &middot; ${SC.fmt.currency(item.price * qty)}`);
      }
    }

    SC.dom.on(el, "click", "[data-qty]", (event, node) => {
      qty = SC.fmt.clamp(qty + Number(node.dataset.qty), 1, SC.cart.MAX_QTY);
      paint();
    });

    SC.dom.on(el, "input", "[data-note]", () => {
      noteCount.textContent = String(note.value.length);
    });

    SC.dom.on(el, "click", "[data-submit]", () => {
      const key = SC.cart.add(item.id, { note: note.value, qty });
      if (!key) return;
      note.value = "";
      noteCount.textContent = "0";
      qty = 1;
      paint();
      SC.layout.toast(`${item.name} ditambahkan ke keranjang`);
    });

    return {
      title: `${item.name} — SmartCanteen`,
      announce: `Detail menu ${item.name}`,
      el,
    };
  };
})(window.SC || (window.SC = {}));
