(function (SC) {
  "use strict";

  const root = document.getElementById("app");

  SC.layout.mount(root);

  SC.router
    .add("/", SC.views.home)
    .add("/menu", SC.views.menu)
    .add("/menu/:id", SC.views.product)
    .add("/cart", SC.views.cart)
    .add("/checkout", SC.views.checkout)
    .add("/queue", () =>
      SC.views.soon({
        title: "Layar antrean",
        lead:
          "Halaman ini dirancang untuk monitor di kantin: menampilkan nomor yang sedang diproses dan nomor yang siap diambil.",
        items: [
          "Tata letak layar penuh tanpa navigasi",
          "Nomor sedang diproses dengan sorotan",
          "Daftar nomor berikutnya",
          "Pembaruan berkala tanpa muat ulang",
        ],
      })
    )
    .add("/admin", () =>
      SC.views.soon({
        title: "Dashboard kantin",
        lead:
          "Ruang kerja pengelola kantin untuk memproses pesanan dan membaca kepadatan pengunjung.",
        items: [
          "Daftar pesanan masuk beserta isinya",
          "Perubahan status dari diproses hingga selesai",
          "Riwayat transaksi harian",
          "Grafik kepadatan per jam istirahat",
        ],
      })
    )
    .fallback(SC.views.notFound)
    .start(document.getElementById("main"));

  SC.dom.on(document, "click", "[data-add]", (event, node) => {
    const product = SC.data.byId(node.dataset.add);
    const key = SC.cart.add(node.dataset.add);
    if (key && product) SC.layout.toast(`${product.name} ditambahkan ke keranjang`);
  });

  SC.dom.on(document, "click", "[data-bump]", (event, node) => {
    SC.cart.bump(node.dataset.key, Number(node.dataset.bump));
  });

  SC.dom.on(document, "click", "[data-scroll]", (event, node) => {
    const target = document.getElementById(node.dataset.scroll);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  SC.cart.subscribe(() => {
    SC.layout.syncCartCount();
    SC.ui.syncFeet();
  });

  SC.layout.syncCartCount();
})(window.SC || (window.SC = {}));
