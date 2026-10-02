(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const { esc } = SC.dom;

  const STEPS = [
    { index: "01", title: "Pilih menu", body: "Telusuri katalog, atur jumlah, dan tulis catatan untuk dapur." },
    { index: "02", title: "Bayar", body: "QRIS atau tunai. Tahap ini masih berupa simulasi pembayaran." },
    { index: "03", title: "Terima nomor", body: "Nomor antrean dibuat otomatis setelah pembayaran tercatat." },
    { index: "04", title: "Ambil pesanan", body: "Pantau status dan datang saat penanda siap menyala." },
  ];

  function board(snapshot) {
    return `<aside class="board" data-board style="--sc:${snapshot.state.color}">
      <div class="board__top">
        <span class="tag" data-live="status">${esc(snapshot.state.label)}</span>
        <span class="board__stamp">Diperbarui <span data-live="clock">${SC.fmt.clock(snapshot.updatedAt)}</span></span>
      </div>
      <p class="board__big"><span data-live="people">${snapshot.people}</span><span class="board__unit">dari ${snapshot.capacity} orang</span></p>
      <div class="meter" aria-hidden="true"><i data-live="bar" style="width:${snapshot.occupancy}%"></i></div>
      <p class="board__cap"><span data-live="occupancy">${snapshot.occupancy}%</span> kapasitas terpakai</p>
      <dl class="board__rows">
        <div><dt>Antrean berjalan</dt><dd><span data-live="queue">${snapshot.queue}</span> pesanan</dd></div>
        <div><dt>Estimasi tunggu</dt><dd><span data-live="eta">${snapshot.eta}</span> menit</dd></div>
        <div><dt>Puncak istirahat</dt><dd>12.15</dd></div>
      </dl>
      <p class="board__hint" data-live="hint">${esc(snapshot.state.hint)}</p>
    </aside>`;
  }

  function ticker(snapshot) {
    const parts = [
      "SmartCanteen",
      `status ${snapshot.state.label}`,
      `${snapshot.people} dari ${snapshot.capacity} orang`,
      `antrean ${snapshot.queue} pesanan`,
      `estimasi ${snapshot.eta} menit`,
      "pesan dari kelas, ambil saat siap",
    ];
    const half = parts.map((part) => `<span>${esc(part)}</span>`).join("");
    return `<div class="ticker" aria-hidden="true"><div class="ticker__track" data-ticker>${half}${half}</div></div>`;
  }

  views.home = function home() {
    const initial = SC.crowd.snapshot();
    const popular = SC.data.list({ sort: "populer" }).slice(0, 8);

    const el = SC.dom.html(`<div data-home>
      <section class="hero">
        <div class="shell hero__grid">
          <div>
            <p class="eyebrow">Kantin sekolah · jam istirahat</p>
            <h1 class="hero__title">Antrean kantin,<br>tanpa <em>berdiri lama</em>.</h1>
            <p class="hero__lead">Pesan dari kelas, bayar dari ponsel, lalu datang ke meja pengambilan saat nomor antreanmu dipanggil. Satu alur untuk seluruh jam istirahat.</p>
            <div class="hero__cta">
              <a class="btn btn--solid" href="#/menu">Pesan sekarang</a>
              <button class="btn btn--line" type="button" data-scroll="cara-kerja">Lihat cara kerja</button>
            </div>
          </div>
          ${board(initial)}
        </div>
      </section>

      ${ticker(initial)}

      <section class="band" id="cara-kerja">
        <div class="shell">
          ${SC.ui.sectionHead({
            index: "01",
            title: "Cara kerja",
            hint: "Empat langkah dari meja kelas sampai meja pengambilan.",
          })}
          <ol class="steps">
            ${STEPS.map(
              (step) =>
                `<li><p class="step__i">${step.index}</p><h3 class="step__t">${esc(step.title)}</h3><p class="step__d">${esc(step.body)}</p></li>`
            ).join("")}
          </ol>
        </div>
      </section>

      <section class="band">
        <div class="shell">
          ${SC.ui.sectionHead({
            index: "02",
            title: "Paling dicari",
            hint: "Delapan menu dengan penjualan tertinggi minggu ini.",
          })}
          <div class="grid grid--products">${SC.ui.productGrid(popular)}</div>
          <a class="more" href="#/menu">Lihat semua menu</a>
        </div>
      </section>

      <section class="band">
        <div class="shell">
          ${SC.ui.sectionHead({
            index: "03",
            title: "Batasan tahap ini",
          })}
          <div class="roster">
            <div>
              <h3 class="roster__title">Sudah berjalan</h3>
              <ul class="roster__list">
                <li>Katalog menu dengan pencarian dan filter kategori</li>
                <li>Keranjang beserta catatan per pesanan</li>
                <li>Status kepadatan dan estimasi waktu tunggu</li>
                <li>Keranjang tersimpan di peramban tanpa server</li>
              </ul>
            </div>
            <div>
              <h3 class="roster__title roster__title--muted">Menyusul</h3>
              <ul class="roster__list roster__list--muted">
                <li>Checkout dan simulasi pembayaran</li>
                <li>Nomor antrean serta pelacakan status pesanan</li>
                <li>Dashboard pengelola kantin</li>
                <li>Penghitungan orang dari kamera kantin</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>`);

    let stop = null;

    return {
      title: "SmartCanteen — Antrean virtual kantin sekolah",
      announce: "Beranda SmartCanteen",
      el,
      mount(node) {
        const boardNode = SC.dom.qs("[data-board]", node);
        const line = (name) => SC.dom.qs(`[data-live="${name}"]`, node);

        stop = SC.crowd.watch((snapshot) => {
          boardNode.style.setProperty("--sc", snapshot.state.color);
          line("status").textContent = snapshot.state.label;
          line("clock").textContent = SC.fmt.clock(snapshot.updatedAt);
          line("people").textContent = String(snapshot.people);
          line("queue").textContent = String(snapshot.queue);
          line("eta").textContent = String(snapshot.eta);
          line("occupancy").textContent = `${snapshot.occupancy}%`;
          line("hint").textContent = snapshot.state.hint;
          line("bar").style.width = `${snapshot.occupancy}%`;

          const parts = [
            "SmartCanteen",
            `status ${snapshot.state.label}`,
            `${snapshot.people} dari ${snapshot.capacity} orang`,
            `antrean ${snapshot.queue} pesanan`,
            `estimasi ${snapshot.eta} menit`,
            "pesan dari kelas, ambil saat siap",
          ];
          const half = parts.map((part) => `<span>${esc(part)}</span>`).join("");
          SC.dom.replace(SC.dom.qs("[data-ticker]", node), half + half);
        }, 5000);
      },
      destroy() {
        if (stop) stop();
      },
    };
  };
})(window.SC || (window.SC = {}));
