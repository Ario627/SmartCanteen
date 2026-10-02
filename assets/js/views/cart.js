(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const { esc, qs } = SC.dom;

  function lineMarkup(line) {
    const item = SC.data.byId(line.productId);
    const category = SC.data.categoryOf(item.category);
    const total = item.price * line.qty;
    return `<li class="line">
      <div class="line__art">${SC.ui.art(item, { thumb: true })}</div>
      <div>
        <a class="line__name" href="#/menu/${esc(item.id)}">${esc(item.name)}</a>
        <p class="line__meta">${esc(category.label)} · ${SC.fmt.currency(item.price)} per porsi${
          line.note ? `<br>Catatan: ${esc(line.note)}` : ""
        }</p>
      </div>
      <div class="line__side">
        <span class="stepper">
          <button type="button" data-bump="-1" data-key="${esc(line.key)}" aria-label="Kurangi ${esc(item.name)}">&minus;</button>
          <span>${line.qty}</span>
          <button type="button" data-bump="1" data-key="${esc(line.key)}" aria-label="Tambah ${esc(item.name)}">+</button>
        </span>
        <span class="line__sum">${SC.fmt.currency(total)}</span>
        <button type="button" class="line__del" data-remove="${esc(line.key)}">Hapus</button>
      </div>
    </li>`;
  }

  function summaryMarkup() {
    const lines = SC.cart.lines();
    const units = SC.cart.count();
    const subtotal = SC.cart.subtotal();
    return `<aside class="summary">
      <h2 class="summary__title">Ringkasan</h2>
      <dl class="summary__rows">
        <div><dt>Jenis pesanan</dt><dd>${SC.fmt.number(lines.length)}</dd></div>
        <div><dt>Total porsi</dt><dd>${SC.fmt.number(units)}</dd></div>
        <div><dt>Subtotal</dt><dd>${SC.fmt.currency(subtotal)}</dd></div>
      </dl>
      <div class="summary__total"><span>Total</span><strong>${SC.fmt.currency(subtotal)}</strong></div>
      <div class="summary__cta"><a class="btn btn--solid btn--wide" href="#/checkout">Lanjut ke pembayaran</a></div>
      <p class="summary__note">Kantin tidak menambahkan biaya layanan. Nomor antrean dibuat setelah pembayaran dikonfirmasi.</p>
      <button type="button" class="summary__clear" data-clear>Kosongkan keranjang</button>
    </aside>`;
  }

  views.cart = function cart() {
    let armed = false;
    let armTimer = 0;
    let stop = null;

    const el = SC.dom.html('<section class="shell page"></section>');

    function paint() {
      const lines = SC.cart.lines();

      if (!lines.length) {
        el.innerHTML = `
          ${SC.ui.pageHead({ index: "02 / Keranjang", title: "Keranjang" })}
          <div class="grid grid--products">
            ${SC.ui.empty({
              title: "Keranjang masih kosong",
              note: "Pilih menu lebih dulu, lalu atur jumlah porsi di halaman ini.",
              action: { label: "Buka menu", attr: 'data-link="/menu"' },
            })}
          </div>`;
        return;
      }

      el.innerHTML = `
        ${SC.ui.pageHead({
          index: "02 / Keranjang",
          title: "Keranjang",
          lead: "Periksa jumlah porsi dan catatan sebelum melanjutkan ke pembayaran.",
        })}
        <div class="cart-grid">
          <ol class="lines">${lines.map(lineMarkup).join("")}</ol>
          ${summaryMarkup()}
        </div>`;
    }

    function disarm() {
      armed = false;
      window.clearTimeout(armTimer);
      const button = qs("[data-clear]", el);
      if (button) button.textContent = "Kosongkan keranjang";
    }

    SC.dom.on(el, "click", "[data-remove]", (event, node) => {
      const item = SC.cart.lines().find((line) => line.key === node.dataset.remove);
      const product = item ? SC.data.byId(item.productId) : null;
      SC.cart.remove(node.dataset.remove);
      if (product) SC.layout.toast(`${product.name} dihapus dari keranjang`);
    });

    SC.dom.on(el, "click", "[data-clear]", () => {
      if (!armed) {
        armed = true;
        qs("[data-clear]", el).textContent = "Tekan lagi untuk mengosongkan";
        armTimer = window.setTimeout(disarm, 3200);
        return;
      }
      SC.cart.clear();
      disarm();
      SC.layout.toast("Keranjang dikosongkan");
    });

    SC.dom.on(el, "click", "[data-link]", (event, node) => {
      SC.router.go(node.dataset.link);
    });

    return {
      title: "Keranjang — SmartCanteen",
      announce: "Halaman keranjang",
      el,
      mount() {
        paint();
        stop = SC.cart.subscribe(() => {
          if (armed) disarm();
          paint();
        });
      },
      destroy() {
        if (stop) stop();
        window.clearTimeout(armTimer);
      },
    };
  };
})(window.SC || (window.SC = {}));
