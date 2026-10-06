(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const { esc, qs } = SC.dom;

  const STATES = {
    PENDING: { label: "Belum dibayar", tone: "pending" },
    PAID: { label: "Dibayar", tone: "paid" },
    PROCESSING: { label: "Diproses", tone: "processing" },
    READY: { label: "Siap diambil", tone: "ready" },
    COMPLETED: { label: "Selesai", tone: "completed" },
  };

  const TABS = [
    { id: "active", label: "Pesanan aktif" },
    { id: "all", label: "Semua" },
    { id: "completed", label: "Selesai" },
  ];

  function nextAction(order) {
    if (order.status === "PENDING") {
      return { label: "Konfirmasi tunai", next: "PAID", outline: false };
    }
    if (order.status === "PAID") {
      return { label: "Mulai diproses", next: "PROCESSING", outline: false };
    }
    if (order.status === "PROCESSING") {
      return { label: "Tandai siap", next: "READY", outline: false };
    }
    if (order.status === "READY") {
      return { label: "Selesaikan", next: "COMPLETED", outline: true };
    }
    return null;
  }

  function card(order) {
    const state = STATES[order.status] || STATES.PENDING;
    const action = nextAction(order);
    const lines = order.items.map((item) => `
      <li><span><em>${item.qty}&times;</em>${esc(item.name)}</span><span>${SC.fmt.currency(item.price * item.qty)}</span></li>`).join("");
    return `<article class="admin-order">
      <header class="admin-order__head">
        <div><p class="admin-order__queue">${esc(order.queueNumber)}</p><p class="admin-order__time">${SC.fmt.clock(new Date(order.createdAt))} · ${esc(order.customer.name)} · ${esc(order.customer.grade)}</p></div>
        <span class="pill pill--${state.tone}">${state.label}</span>
      </header>
      <ol class="admin-order__items">${lines}</ol>
      <footer class="admin-order__foot">
        <span class="admin-order__method">${order.paymentMethod === "QRIS" ? "QRIS" : "Tunai"} · ${order.paymentStatus === "PAID" ? "Lunas" : "Belum dibayar"}</span>
        <strong>${SC.fmt.currency(order.total)}</strong>
      </footer>
      <div class="admin-order__actions">
        <a class="btn btn--link" href="#/order/${encodeURIComponent(order.id)}">Detail</a>
        ${action ? `<button class="btn ${action.outline ? "btn--line" : "btn--solid"}" type="button" data-advance="${esc(order.id)}" data-next="${action.next}">${action.label}</button>` : '<span class="admin-order__done">Pesanan ditutup</span>'}
      </div>
    </article>`;
  }

  function dayBounds(now) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start: start.getTime(), end: end.getTime() };
  }

  function metrics(orders, crowd) {
    const bounds = dayBounds(Date.now());
    const today = orders.filter((order) => {
      const time = new Date(order.createdAt).getTime();
      return time >= bounds.start && time < bounds.end;
    });
    const paid = today.filter((order) => order.paymentStatus === "PAID");
    const revenue = paid.reduce((total, order) => total + order.total, 0);
    const active = today.filter((order) => order.status !== "COMPLETED").length;
    const waiting = today.filter((order) => ["PAID", "PROCESSING"].includes(order.status)).length;

    return [
      { label: "Pesanan hari ini", value: SC.fmt.number(today.length), note: `${active} masih aktif` },
      { label: "Pendapatan lunas", value: SC.fmt.currency(revenue), note: `${paid.length} transaksi lunas` },
      { label: "Perlu diproses", value: SC.fmt.number(waiting), note: "sudah dibayar" },
      { label: "Kepadatan kantin", value: `${crowd.occupancy}%`, note: `${crowd.people} dari ${crowd.capacity} orang` },
    ];
  }

  views.admin = function adminView() {
    let selected = "active";
    let allOrders = SC.orders.list();
    let crowd = SC.crowd.snapshot();
    let stopOrders = null;
    let stopCrowd = null;
    let clockTimer = 0;
    let el = SC.dom.html('<main class="admin-app"></main>');

    function paint() {
      const metricsMarkup = metrics(allOrders, crowd)
        .map((metric, index) => `<article class="metric-card"><p class="metric-card__index">${String(index + 1).padStart(2, "0")}</p><p class="metric-card__label">${esc(metric.label)}</p><strong class="metric-card__value">${esc(metric.value)}</strong><p class="metric-card__note">${esc(metric.note)}</p></article>`)
        .join("");
      const byFilter = {
        active: allOrders.filter((order) => order.status !== "COMPLETED"),
        all: allOrders,
        completed: allOrders.filter((order) => order.status === "COMPLETED"),
      }[selected];
      const sorted = byFilter.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const countByTab = {
        active: allOrders.filter((order) => order.status !== "COMPLETED").length,
        all: allOrders.length,
        completed: allOrders.filter((order) => order.status === "COMPLETED").length,
      };

      el.innerHTML = `<header class="admin-head">
          <div class="admin-head__brand"><a class="brand" href="#/"><span class="brand__mark" aria-hidden="true"></span>SmartCanteen</a><span class="admin-head__divider"></span><span class="admin-head__label">Kantin / Panel operasional</span></div>
          ${SC.layout.operationsNav("/admin")}
          <div class="admin-head__right"><span class="tag" style="--sc:${crowd.state.color}">${esc(crowd.state.label)}</span><time data-admin-clock>${SC.fmt.clock(new Date())}</time></div>
        </header>
        <div class="admin-shell">
          <section class="admin-welcome">
            <div><p class="eyebrow">Panel pengelola</p><h1>Operasional kantin</h1><p>Kelola antrean pesanan dan lihat ringkasan aktivitas hari ini.</p></div>
            <a class="btn btn--line" href="#/queue">Buka layar antrean &nearr;</a>
          </section>
          <section class="metrics" aria-label="Ringkasan hari ini">${metricsMarkup}</section>
          <section class="admin-work">
            <header class="admin-work__head"><div><h2>Pesanan</h2><p>Tahapan pesanan bergerak berurutan agar status dan pembayaran tetap konsisten.</p></div><span class="admin-work__date">${new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</span></header>
            <div class="admin-tabs" role="tablist" aria-label="Filter pesanan">${TABS.map((tab) => `<button type="button" role="tab" aria-selected="${tab.id === selected}" data-tab="${tab.id}">${tab.label}<span>${countByTab[tab.id]}</span></button>`).join("")}</div>
            <div class="admin-orders" data-orders>
              ${sorted.length ? sorted.map(card).join("") : `<div class="admin-empty"><p>${selected === "completed" ? "Belum ada pesanan selesai" : "Belum ada pesanan"}</p><span>Pesanan yang dibuat pelanggan akan muncul di panel ini.</span></div>`}
            </div>
          </section>
          <footer class="admin-note"><span>SMARTCANTEEN / PROTOTYPE</span><span>Data disimpan di peramban ini</span></footer>
        </div>`;
    }

    SC.dom.on(el, "click", "[data-tab]", (event, node) => {
      selected = node.dataset.tab;
      paint();
    });

    SC.dom.on(el, "click", "[data-advance]", (event, node) => {
      const order = SC.orders.updateStatus(node.dataset.advance, node.dataset.next);
      if (order) SC.layout.toast(`${order.queueNumber} · ${STATES[order.status].label}`);
      else SC.layout.toast("Status pesanan tidak dapat dilanjutkan");
    });

    paint();

    return {
      title: "Dashboard kantin — SmartCanteen",
      announce: "Dashboard pengelola kantin",
      el,
      mount() {
        stopOrders = SC.orders.subscribe((orders) => {
          allOrders = orders;
          paint();
        });
        stopCrowd = SC.crowd.watch((snapshot) => {
          crowd = snapshot;
          paint();
        }, 5000);
        clockTimer = window.setInterval(() => {
          const clock = qs("[data-admin-clock]", el);
          if (clock) clock.textContent = SC.fmt.clock(new Date());
        }, 30000);
      },
      destroy() {
        if (stopOrders) stopOrders();
        if (stopCrowd) stopCrowd();
        window.clearInterval(clockTimer);
      },
    };
  };
})(window.SC || (window.SC = {}));
