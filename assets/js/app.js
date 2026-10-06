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
    .add("/order/:id", SC.views.order)
    .add("/queue", SC.views.queue)
    .add("/admin", SC.views.admin)
    .add("/admin/menu", SC.views.menuAdmin)
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

  SC.data.subscribeInventory(() => {
    if (document.body.dataset.route === "/menu") SC.router.go("/menu");
  });

  SC.data.subscribeInventory(() => {
    if (document.body.dataset.route === "/admin/menu") SC.router.go("/admin/menu");
  });

  SC.layout.syncCartCount();
})(window.SC || (window.SC = {}));
