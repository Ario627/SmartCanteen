(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const { esc, qs } = SC.dom;

  const METHODS = [
    { id: "QRIS", title: "QRIS", desc: "Pindai kode dari ponsel, tanpa uang tunai." },
    { id: "CASH", title: "Tunai", desc: "Bayar di kasir saat mengambil pesanan." },
  ];

  const CHECK =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 12.5 9.5 17.5 19.5 6.5"/></svg>';

  function qrisMarkup() {
    const url = SC.config.instagramUrl;
    const handle = SC.config.instagramHandle;
    const code = SC.qr.svg(url, { label: `Tautan Instagram ${handle}` });

    return `<div class="pay">
      <div class="pay__code">${
        code ||
        '<div class="pay__off"><span>Kode QR tidak dapat dimuat. Gunakan tombol di samping.</span></div>'
      }</div>
      <div class="pay__info">
        <p class="pay__label">QRIS simulasi</p>
        <p class="pay__title">Pindai untuk membuka ${esc(handle)}</p>
        <p class="pay__note">Gunakan Google Lens atau aplikasi pemindai lain di ponsel. Kode ini bukan QRIS asli, hanya contoh tautan pada prototype.</p>
        <a class="btn btn--line" href="${esc(url)}" target="_blank" rel="noopener">Buka tautan langsung</a>
      </div>
    </div>`;
  }

  function cashMarkup() {
    return `<div class="pay pay--cash">
      <div class="pay__info">
        <p class="pay__label">Tunai di kasir</p>
        <p class="pay__title">Bayar saat mengambil pesanan</p>
        <p class="pay__note">Nomor antrean tetap dibuat sekarang. Tunjukkan nomor tersebut ke petugas kantin lalu bayar di kasir.</p>
      </div>
    </div>`;
  }

  function summaryMarkup(status) {
    const lines = SC.cart.lines();
    const subtotal = SC.cart.subtotal();
    const busy = status === "processing";

    return `<aside class="summary">
      <h2 class="summary__title">Pesanan</h2>
      <ol class="summary__items">
        ${lines
          .map((line) => {
            const item = SC.data.byId(line.productId);
            if (!item) return "";
            return `<li><span><em>${line.qty}&times;</em>${esc(item.name)}</span><span>${SC.fmt.currency(item.price * line.qty)}</span></li>`;
          })
          .join("")}
      </ol>
      <dl class="summary__rows">
        <div><dt>Total porsi</dt><dd>${SC.fmt.number(SC.cart.count())}</dd></div>
        <div><dt>Subtotal</dt><dd>${SC.fmt.currency(subtotal)}</dd></div>
      </dl>
      <div class="summary__total"><span>Total</span><strong>${SC.fmt.currency(subtotal)}</strong></div>
      <button class="btn btn--solid btn--wide summary__cta" type="submit"${busy ? " disabled" : ""}>
        ${busy ? "Memproses pembayaran" : "Bayar sekarang"}
      </button>
      <p class="summary__note">Seluruh pembayaran pada prototype ini adalah simulasi. Tidak ada uang yang berpindah.</p>
    </aside>`;
  }

  function receiptMarkup(order) {
    const digital = order.paymentMethod === "QRIS";

    return `<section class="shell">
      <div class="receipt">
        <span class="receipt__mark">${CHECK}</span>
        <p class="receipt__eyebrow">${digital ? "Pembayaran diterima" : "Pesanan dibuat"} &middot; ${digital ? "QRIS" : "Tunai"}</p>
        <h1 class="receipt__title">Nomor antrean</h1>
        <p class="receipt__queue">${esc(order.queueNumber)}</p>
        <p class="receipt__note">${
          digital
            ? "Tunjukkan nomor ini ke petugas kantin saat pesanan diambil."
            : "Bayar di kasir, lalu tunjukkan nomor ini saat pesanan diambil."
        }</p>
        <ul class="receipt__items">
          ${order.items
            .map(
              (item) =>
                `<li><span>${item.qty}&times; ${esc(item.name)}</span><span>${SC.fmt.currency(item.price * item.qty)}</span></li>`
            )
            .join("")}
        </ul>
        <dl class="receipt__rows">
          <div><dt>Nama</dt><dd>${esc(order.customer.name)} &middot; ${esc(order.customer.grade)}</dd></div>
          <div><dt>Total</dt><dd>${SC.fmt.currency(order.total)}</dd></div>
          <div><dt>Waktu</dt><dd>${SC.fmt.clock(new Date(order.createdAt))}</dd></div>
        </dl>
        <div class="receipt__actions">
          <a class="btn btn--solid" href="#/menu">Pesan lagi</a>
          <a class="btn btn--line" href="#/">Beranda</a>
        </div>
      </div>
    </section>`;
  }

  views.checkout = function checkout() {
    const el = SC.dom.html('<section class="shell page"></section>');

    let name = "";
    let grade = "";
    let method = "QRIS";
    let status = "form";
    let fault = null;
    let order = null;
    let timer = 0;
    let stopCart = null;

    function problem() {
      if (name.trim().length < 2) return { field: "name", message: "Tulis nama minimal 2 karakter." };
      if (grade.trim().length < 1) return { field: "grade", message: "Tulis kelas atau keterangan singkat." };
      return null;
    }

    function blocksMarkup() {
      return `<div class="checkout-block">
          <div class="block-head"><h2>Data pemesan</h2><span>01</span></div>
          <div class="field-row field-row--two">
            <div>
              <label class="field-label" for="co-name">Nama</label>
              <input class="field" id="co-name" type="text" maxlength="40" autocomplete="name" placeholder="Nama panggilan" value="${esc(name)}" data-name>
              ${fault && fault.field === "name" ? `<p class="field-err">${esc(fault.message)}</p>` : ""}
            </div>
            <div>
              <label class="field-label" for="co-grade">Kelas</label>
              <input class="field" id="co-grade" type="text" maxlength="16" placeholder="Contoh: XI IPA 2" value="${esc(grade)}" data-grade>
              ${fault && fault.field === "grade" ? `<p class="field-err">${esc(fault.message)}</p>` : ""}
            </div>
          </div>
        </div>

        <div class="checkout-block">
          <div class="block-head"><h2>Metode pembayaran</h2><span>02</span></div>
          <div class="methods">
            ${METHODS.map(
              (item) => `<label class="method">
                <input type="radio" id="co-method-${item.id.toLowerCase()}" name="method" value="${esc(item.id)}"${item.id === method ? " checked" : ""} data-method>
                <span class="method__mark" aria-hidden="true"></span>
                <span class="method__body">
                  <span class="method__title">${esc(item.title)}</span>
                  <span class="method__desc">${esc(item.desc)}</span>
                </span>
              </label>`
            ).join("")}
          </div>
          ${method === "QRIS" ? qrisMarkup() : cashMarkup()}
        </div>`;
    }

    function paint() {
      if (status === "done" && order) {
        el.innerHTML = receiptMarkup(order);
        return;
      }

      if (!SC.cart.lines().length) {
        el.innerHTML = `
          ${SC.ui.pageHead({ index: "03 / Checkout", title: "Checkout" })}
          <div class="grid grid--products">
            ${SC.ui.empty({
              title: "Belum ada pesanan",
              note: "Keranjang kosong, jadi checkout belum bisa dijalankan. Pilih menu lebih dulu.",
              action: { label: "Buka menu", attr: 'data-link="/menu"' },
            })}
          </div>`;
        return;
      }

      el.innerHTML = `
        ${SC.ui.pageHead({
          index: "03 / Checkout",
          title: "Checkout",
          lead: "Isi data pengambilan, pilih metode pembayaran, lalu konfirmasi pesanan.",
        })}
        <form class="checkout-grid" data-form novalidate>
          <div class="checkout-main">${blocksMarkup()}</div>
          ${summaryMarkup(status)}
        </form>`;
    }

    function startPayment() {
      if (status !== "form") return;
      const issue = problem();
      if (issue) {
        fault = issue;
        paint();
        const field = qs(`[data-${issue.field}]`, el);
        if (field) field.focus();
        return;
      }
      fault = null;
      status = "processing";
      paint();
      timer = window.setTimeout(commit, 900);
    }

    function commit() {
      const lines = SC.cart.lines();
      if (!lines.length) return;

      order = SC.orders.create({
        customer: { name: name.trim(), grade: grade.trim() },
        items: lines.map((line) => {
          const item = SC.data.byId(line.productId);
          return {
            productId: line.productId,
            name: item ? item.name : "",
            price: item ? item.price : 0,
            qty: line.qty,
            note: line.note,
          };
        }),
        total: SC.cart.subtotal(),
        paymentMethod: method,
      });

      status = "done";
      paint();
      SC.cart.clear();
      SC.layout.announce(`Pesanan diterima dengan nomor antrean ${order.queueNumber}`);
      window.scrollTo(0, 0);
    }

    SC.dom.on(el, "input", "[data-name]", (event, node) => {
      name = node.value;
      const message = qs(".field-err", node.parentElement);
      if (message) message.remove();
    });

    SC.dom.on(el, "input", "[data-grade]", (event, node) => {
      grade = node.value;
      const message = qs(".field-err", node.parentElement);
      if (message) message.remove();
    });

    SC.dom.on(el, "change", "[data-method]", (event, node) => {
      method = node.value;
      paint();
      const next = qs(`[data-method][value="${method}"]`, el);
      if (next) next.focus();
    });

    SC.dom.on(el, "submit", "[data-form]", (event) => {
      event.preventDefault();
      startPayment();
    });

    SC.dom.on(el, "click", "[data-link]", (event, node) => {
      SC.router.go(node.dataset.link);
    });

    return {
      title: "Checkout — SmartCanteen",
      announce: "Halaman checkout",
      el,
      mount() {
        paint();
        stopCart = SC.cart.subscribe(() => {
          if (status === "form") paint();
        });
      },
      destroy() {
        window.clearTimeout(timer);
        if (stopCart) stopCart();
      },
    };
  };
})(window.SC || (window.SC = {}));
