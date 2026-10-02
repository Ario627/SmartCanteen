(function (SC) {
  "use strict";

  const views = (SC.views = SC.views || {});
  const { esc } = SC.dom;

  function plain(config) {
    return {
      title: `${config.title} — SmartCanteen`,
      announce: config.announce || config.title,
      el: SC.dom.html(`
        <section class="shell">
          <div class="plain">
            ${config.index ? `<p class="eyebrow">${esc(config.index)}</p>` : ""}
            <h1 class="plain__title">${esc(config.title)}</h1>
            ${config.lead ? `<p class="plain__lead">${esc(config.lead)}</p>` : ""}
            ${config.items ? `<ul class="plain__list">${config.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : ""}
            <div class="plain__cta">
              <a class="btn ${config.actionStyle || "btn--solid"}" href="#${config.actionPath || "/"}">${esc(config.actionLabel || "Kembali ke beranda")}</a>
            </div>
          </div>
        </section>
      `),
    };
  }

  views.soon = function soon(config) {
    return plain({
      index: "Tahap berikutnya",
      title: config.title,
      lead: config.lead,
      items: config.items,
      actionPath: config.actionPath || "/menu",
      actionLabel: config.actionLabel || "Kembali ke menu",
      actionStyle: "btn--line",
      announce: `${config.title} belum tersedia`,
    });
  };

  views.notFound = function notFound() {
    return plain({
      index: "404",
      title: "Halaman tidak ditemukan",
      lead: "Alamat yang kamu buka tidak ada di prototype ini. Gunakan navigasi di atas untuk kembali ke alur pemesanan.",
      items: ["Beranda menampilkan status kepadatan kantin", "Menu memuat seluruh katalog dan filter"],
      actionPath: "/",
      actionLabel: "Kembali ke beranda",
    });
  };

  views.error = function error(ctx, cause) {
    return plain({
      index: "Galat",
      title: "Terjadi kesalahan saat memuat halaman",
      lead: `Rute ${ctx && ctx.path ? ctx.path : "-"} gagal dirender. Buka konsol peramban untuk melihat detail teknisnya.`,
      items: [cause && cause.message ? cause.message : "Penyebab tidak diketahui"],
      actionPath: "/",
      actionLabel: "Kembali ke beranda",
    });
  };
})(window.SC || (window.SC = {}));
