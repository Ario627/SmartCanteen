(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const { esc, qs } = SC.dom;

  const LABELS = {
    PENDING: "Menunggu pembayaran",
    PAID: "Dibayar",
    PROCESSING: "Sedang disiapkan",
    READY: "Siap diambil",
    COMPLETED: "Selesai",
  };

  function timeline(order) {
    const current = SC.orders.STATUS_FLOW.indexOf(order.status);
    return `<ol class="order-steps" aria-label="Tahapan pesanan">
      ${SC.orders.STATUS_FLOW.map((status, index) => {
        const state = index < current ? "done" : index === current ? "current" : "future";
        return `<li class="order-steps__item is-${state}">
          <span class="order-steps__dot" aria-hidden="true">${index < current ? "✓" : String(index + 1).padStart(2, "0")}</span>
          <span class="order-steps__text">
            <strong>${LABELS[status]}</strong>
            ${status === "PENDING" && order.paymentMethod === "CASH" ? "<small>Bayar di kasir saat mengambil pesanan</small>" : ""}
          </span>
        </li>`;
      }).join("")}
    </ol>`;
  }

  function viewFor(order) {
    const paid = order.paymentStatus === "PAID";
    const next = SC.orders.STATUS_FLOW[SC.orders.STATUS_FLOW.indexOf(order.status) + 1];
    const nextAction = {
      PAID: "Mulai diproses",
      PROCESSING: "Tandai siap diambil",
      READY: "Tandai selesai",
      COMPLETED: "Pesanan selesai",
    }[next] || "";
    const paymentAction = !paid ? '<button class="btn btn--solid" type="button" data-pay-cash>Konfirmasi sudah dibayar</button>' : "";
    const statusAction = next && next !== "PAID"
      ? `<button class="btn btn--line" type="button" data-next-status="${next}">${esc(nextAction)}</button>`
      : "";
    const detailItems = order.items.map((item) => `
      <li class="order-item">
        <span class="order-item__qty">${item.qty}&times;</span>
        <span class="order-item__body"><strong>${esc(item.name)}</strong>${item.note ? `<small>${esc(item.note)}</small>` : ""}</span>
        <span class="order-item__price">${SC.fmt.currency(item.price * item.qty)}</span>
      </li>`).join("");

    return `<section class="shell page order-page">
      <div class="order-topline">
        <a class="back" href="#/menu">&larr; Menu</a>
        <a class="back" href="#/queue">Lihat antrean &rarr;</a>
      </div>
      <header class="order-heading">
        <p class="page-head__idx">Pelacakan pesanan</p>
        <p class="order-heading__queue">${esc(order.queueNumber)}</p>
        <div class="order-heading__meta">
          <span>${esc(order.customer.name)} · ${esc(order.customer.grade)}</span>
          <span>${SC.fmt.clock(new Date(order.createdAt))}</span>
        </div>
        <p class="tag" style="--sc:${order.status === "READY" ? "var(--low)" : order.status === "COMPLETED" ? "var(--ink-mute)" : "var(--accent)"}">${LABELS[order.status]}</p>
      </header>
      <div class="order-grid">
        <section class="order-panel">
          <div class="block-head"><h2>Status pesanan</h2><span>01</span></div>
          ${timeline(order)}
          ${!paid ? '<p class="notice">Pesanan tunai belum ditandai lunas. Bayar di kasir sebelum mengambil makanan.</p>' : ""}
          <div class="order-actions">${paymentAction}${statusAction}</div>
        </section>
        <aside class="order-panel">
          <div class="block-head"><h2>Rincian pesanan</h2><span>${order.units} porsi</span></div>
          <ol class="order-items">${detailItems}</ol>
          <dl class="receipt__rows">
            <div><dt>Metode</dt><dd>${order.paymentMethod === "QRIS" ? "QRIS simulasi" : "Tunai di kasir"}</dd></div>
            <div><dt>Pembayaran</dt><dd>${paid ? "Lunas" : "Belum dibayar"}</dd></div>
            <div><dt>Total</dt><dd>${SC.fmt.currency(order.total)}</dd></div>
          </dl>
        </aside>
      </div>
    </section>`;
  }

  views.order = function orderView(ctx) {
    let current = SC.orders.byId(ctx.params.id);
    let stop = null;
    const el = SC.dom.html('<div data-order-view></div>');

    function paint() {
      current = SC.orders.byId(ctx.params.id);
      el.innerHTML = current
        ? viewFor(current)
        : `<section class="shell page">${SC.ui.empty({
            title: "Pesanan tidak ditemukan",
            note: "Nomor ini tidak tersimpan di peramban saat ini. Pastikan kamu membuka tautan pada perangkat yang sama.",
            action: { label: "Lihat menu", attr: 'data-link="/menu"' },
          })}</section>`;
    }

    SC.dom.on(el, "click", "[data-pay-cash]", () => {
      const updated = SC.orders.updateStatus(ctx.params.id, "PAID");
      if (updated) SC.layout.toast("Pembayaran tunai dikonfirmasi");
    });

    SC.dom.on(el, "click", "[data-next-status]", (event, node) => {
      const updated = SC.orders.updateStatus(ctx.params.id, node.dataset.nextStatus);
      if (updated) SC.layout.toast(`Status pesanan: ${LABELS[updated.status]}`);
    });

    SC.dom.on(el, "click", "[data-link]", (event, node) => {
      SC.router.go(node.dataset.link);
    });

    paint();

    return {
      title: current ? `Pesanan ${current.queueNumber} — SmartCanteen` : "Pesanan tidak ditemukan — SmartCanteen",
      announce: current ? `Pelacakan pesanan ${current.queueNumber}` : "Pesanan tidak ditemukan",
      el,
      mount() {
        stop = SC.orders.subscribe(paint);
      },
      destroy() {
        if (stop) stop();
      },
    };
  };
})(window.SC || (window.SC = {}));
