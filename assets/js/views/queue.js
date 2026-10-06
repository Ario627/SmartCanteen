(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const { esc } = SC.dom;

  const STATES = {
    PENDING: { label: "Belum dibayar", tone: "pending" },
    PAID: { label: "Dibayar", tone: "paid" },
    PROCESSING: { label: "Diproses", tone: "processing" },
    READY: { label: "Siap diambil", tone: "ready" },
    COMPLETED: { label: "Selesai", tone: "completed" },
  };

  function orderCard(order) {
    const state = STATES[order.status] || STATES.PENDING;
    const preview = order.items.map((item) => `${item.qty}× ${item.name}`).join(" · ");
    return `<li class="queue-card queue-card--${state.tone}">
      <div class="queue-card__top">
        <strong>${esc(order.queueNumber)}</strong>
        <span class="queue-card__status">${state.label}</span>
      </div>
      <p class="queue-card__items">${esc(preview)}</p>
      <p class="queue-card__customer">${esc(order.customer.name)} · ${esc(order.customer.grade)}</p>
    </li>`;
  }

  function grouped(orders) {
    const newestFirst = orders.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const completedNewestFirst = orders
      .filter((order) => order.status === "COMPLETED")
      .slice()
      .sort((a, b) => (b.completedSequence || 0) - (a.completedSequence || 0));
    return {
      pending: newestFirst.filter((order) => order.status === "PENDING"),
      paid: newestFirst.filter((order) => order.status === "PAID"),
      processing: newestFirst.filter((order) => order.status === "PROCESSING"),
      ready: newestFirst.filter((order) => order.status === "READY"),
      completed: completedNewestFirst,
    };
  }

  views.queue = function queueView() {
    let showCompleted = false;
    let now = Date.now();
    let stopOrders = null;
    let stopCrowd = null;
    let clockTimer = 0;
    let latest = SC.orders.list();
    let crowd = SC.crowd.snapshot();

    const el = SC.dom.html('<div class="queue-screen"></div>');

    function paint() {
      const groups = grouped(latest);
      const active = latest.filter((order) => order.status !== "COMPLETED");
      const currentlyMaking = groups.processing.concat(groups.paid);
      const firstReady = groups.ready[0] || null;
      const clock = SC.fmt.clock(new Date(now));
      const occupancy = `${crowd.occupancy}%`;
      const lastUpdated = SC.fmt.clock(new Date(now));
      const lanes = [
        { id: "processing", title: "Sedang disiapkan", items: groups.processing.concat(groups.paid) },
        { id: "ready", title: "Siap diambil", items: groups.ready },
      ];

      el.innerHTML = `<header class="queue-head">
          <a class="brand" href="#/"><span class="brand__mark" aria-hidden="true"></span>SmartCanteen</a>
          <span class="queue-head__label">Layar antrean kantin</span>
          <time class="queue-head__clock" data-clock>${clock}</time>
        </header>
        <main class="queue-main">
          <section class="queue-feature" aria-label="Nomor yang sedang dilayani">
            ${firstReady
              ? `<p class="queue-feature__eyebrow">Silakan ambil pesanan</p><p class="queue-feature__number">${esc(firstReady.queueNumber)}</p><p class="queue-feature__detail">${esc(firstReady.customer.name)} · ${esc(firstReady.customer.grade)}</p>`
              : currentlyMaking.length
                ? `<p class="queue-feature__eyebrow">Sedang disiapkan</p><p class="queue-feature__number">${esc(currentlyMaking[0].queueNumber)}</p><p class="queue-feature__detail">Mohon tunggu, pesananmu sedang dibuat</p>`
                : `<p class="queue-feature__eyebrow">Kantin siap menerima pesanan</p><p class="queue-feature__number queue-feature__number--empty">— — —</p><p class="queue-feature__detail">Belum ada pesanan yang perlu dipanggil</p>`}
          </section>
          <section class="queue-lanes" aria-label="Daftar pesanan aktif">
            ${lanes.map((lane) => `<div class="queue-lane">
              <header class="queue-lane__head"><h2>${lane.title}</h2><span>${String(lane.items.length).padStart(2, "0")}</span></header>
              ${lane.items.length
                ? `<ol class="queue-list">${lane.items.map(orderCard).join("")}</ol>`
                : `<p class="queue-empty">Belum ada pesanan</p>`}
            </div>`).join("")}
          </section>
        </main>
        <footer class="queue-foot">
          <div class="queue-foot__crowd"><span class="tag" style="--sc:${crowd.state.color}">${esc(crowd.state.label)}</span><span>${crowd.people} / ${crowd.capacity} orang</span><span>${occupancy} kapasitas</span></div>
          <div class="queue-foot__stats"><span>${active.length} pesanan aktif</span><span>Estimasi tunggu ${crowd.eta} menit</span><span>Pembaruan ${lastUpdated}</span></div>
          <button class="queue-foot__toggle" type="button" data-completed>${showCompleted ? "Sembunyikan riwayat" : `Riwayat selesai (${groups.completed.length})`}</button>
        </footer>
        ${showCompleted ? `<section class="queue-history"><h2>Pesanan selesai hari ini</h2>${groups.completed.length ? `<ol class="queue-list queue-list--history">${groups.completed.map(orderCard).join("")}</ol>` : '<p class="queue-empty">Belum ada pesanan selesai</p>'}</section>` : ""}`;
    }

    SC.dom.on(el, "click", "[data-completed]", () => {
      showCompleted = !showCompleted;
      paint();
    });

    paint();

    return {
      title: "Layar antrean — SmartCanteen",
      announce: "Layar antrean kantin",
      el,
      mount() {
        document.body.dataset.screen = "queue";
        stopOrders = SC.orders.subscribe((orders) => {
          latest = orders;
          paint();
        });
        stopCrowd = SC.crowd.watch((snapshot) => {
          crowd = snapshot;
          paint();
        }, 5000);
        clockTimer = window.setInterval(() => {
          now = Date.now();
          const node = SC.dom.qs("[data-clock]", el);
          if (node) node.textContent = SC.fmt.clock(new Date(now));
        }, 1000);
      },
      destroy() {
        delete document.body.dataset.screen;
        if (stopOrders) stopOrders();
        if (stopCrowd) stopCrowd();
        window.clearInterval(clockTimer);
      },
    };
  };
})(window.SC || (window.SC = {}));
