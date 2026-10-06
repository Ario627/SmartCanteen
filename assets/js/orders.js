(function (SC) {
  "use strict";

  const STORE = "smartcanteen.orders.v1";
  const COUNTER = "smartcanteen.queue.v1";
  const LIMIT = 80;
  const STATUS_FLOW = ["PENDING", "PAID", "PROCESSING", "READY", "COMPLETED"];
  const listeners = new Set();
  let lastSequence = 0;

  function safe(fn) {
    try {
      return fn();
    } catch {
      return null;
    }
  }

  function day() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function normalizeOrder(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if (typeof value.id !== "string" || typeof value.queueNumber !== "string") return null;
    if (!value.customer || typeof value.customer !== "object" || !Array.isArray(value.items)) return null;
    if (!STATUS_FLOW.includes(value.status)) return null;
    if (!["QRIS", "CASH"].includes(value.paymentMethod)) return null;
    if (!["PAID", "PENDING"].includes(value.paymentStatus)) return null;
    const createdAt = new Date(value.createdAt);
    if (!Number.isFinite(createdAt.getTime())) return null;

    const customer = {
      name: String(value.customer.name || "").trim().slice(0, 40),
      grade: String(value.customer.grade || "").trim().slice(0, 16),
    };
    if (!customer.name || !customer.grade) return null;

    const items = value.items
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const product = SC.data.byId(item.productId);
        const qty = Math.floor(Number(item.qty));
        if (!product || qty < 1 || qty > 20) return null;
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          qty,
          note: String(item.note || "").trim().slice(0, 80),
        };
      })
      .filter(Boolean);
    if (!items.length || items.length !== value.items.length) return null;

    return {
      id: value.id.slice(0, 80),
      queueNumber: value.queueNumber.slice(0, 16),
      customer,
      items,
      units: items.reduce((total, item) => total + item.qty, 0),
      total: items.reduce((total, item) => total + item.price * item.qty, 0),
      paymentMethod: value.paymentMethod,
      paymentStatus: value.paymentStatus,
      status: value.status,
      createdAt: createdAt.toISOString(),
      ...(value.completedAt ? { completedAt: new Date(value.completedAt).toISOString() } : {}),
    };
  }

  function read() {
    const value = safe(() => JSON.parse(window.localStorage.getItem(STORE) || "[]"));
    return Array.isArray(value) ? value.map(normalizeOrder).filter(Boolean).slice(0, LIMIT) : [];
  }

  let orders = read();

  function emit() {
    persist();
    listeners.forEach((listener) => listener(list()));
  }

  function persist() {
    safe(() => window.localStorage.setItem(STORE, JSON.stringify(orders)));
  }

  function queueNumber() {
    const stored = safe(() => JSON.parse(window.localStorage.getItem(COUNTER) || "null"));
    const today = day();
    const existing = orders
      .filter((order) => order.createdAt.slice(0, 10) === today)
      .reduce((max, order) => {
        const match = new RegExp(`^${SC.config.orderPrefix}(\\d+)$`).exec(order.queueNumber);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 0);
    const step = Math.max(stored && stored.day === today ? Number(stored.step) || 0 : 0, existing);
    const next = step + 1;
    safe(() =>
      window.localStorage.setItem(COUNTER, JSON.stringify({ day: today, step: next }))
    );
    return `${SC.config.orderPrefix}${String(next).padStart(3, "0")}`;
  }

  function create(draft) {
    if (!draft || !draft.customer || !Array.isArray(draft.items)) {
      throw new TypeError("Data pesanan tidak valid");
    }

    const customer = {
      name: String(draft.customer.name || "").trim().slice(0, 40),
      grade: String(draft.customer.grade || "").trim().slice(0, 16),
    };
    if (customer.name.length < 2 || !customer.grade) {
      throw new TypeError("Data pemesan belum lengkap");
    }

    const items = draft.items.map((item) => {
      const product = item && SC.data.byId(item.productId);
      const qty = Math.floor(Number(item && item.qty));
      if (!product || !product.available || qty < 1 || qty > 20) {
        throw new TypeError("Item pesanan tidak valid atau tidak tersedia");
      }
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        qty,
        note: String(item.note || "").trim().slice(0, 80),
      };
    });
    if (!items.length || items.length > 30) throw new TypeError("Jumlah item pesanan tidak valid");

    const digital = draft.paymentMethod === "QRIS";
    if (!digital && draft.paymentMethod !== "CASH") throw new TypeError("Metode pembayaran tidak valid");
    const now = new Date();
    const order = {
      id: `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      queueNumber: queueNumber(),
      customer,
      items,
      units: items.reduce((total, item) => total + item.qty, 0),
      total: items.reduce((total, item) => total + item.price * item.qty, 0),
      paymentMethod: draft.paymentMethod,
      paymentStatus: digital ? "PAID" : "PENDING",
      status: digital ? "PAID" : "PENDING",
      createdAt: now.toISOString(),
    };

    orders = [order].concat(orders).slice(0, LIMIT);
    emit();
    return order;
  }

  function list() {
    return orders.slice();
  }

  function byId(id) {
    return orders.find((order) => order.id === id) || null;
  }

  function payCash(id) {
    const order = byId(id);
    if (!order || order.paymentMethod !== "CASH" || order.status !== "PENDING") return null;
    order.paymentStatus = "PAID";
    order.status = "PAID";
    order.paidAt = new Date().toISOString();
    emit();
    return order;
  }

  function updateStatus(id, status) {
    const order = byId(id);
    if (!order || !STATUS_FLOW.includes(status)) return null;
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const nextIndex = STATUS_FLOW.indexOf(status);
    if (status === "PAID") return payCash(id);
    if (nextIndex !== currentIndex + 1) return null;

    order.status = status;
    if (status === "COMPLETED") {
      order.completedAt = new Date().toISOString();
      order.completedSequence = nextSequence();
    }
    emit();
    return order;
  }

  function nextSequence() {
    const stored = safe(() => Number(window.localStorage.getItem("smartcanteen.sequence.v1")) || 0);
    lastSequence = Math.max(lastSequence, stored || 0) + 1;
    safe(() => window.localStorage.setItem("smartcanteen.sequence.v1", String(lastSequence)));
    return lastSequence;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function active() {
    return orders.filter((order) => order.status !== "COMPLETED");
  }

  window.addEventListener("storage", (event) => {
    if (event.key !== STORE) return;
    orders = read();
    listeners.forEach((listener) => listener(list()));
  });

  orders.forEach((order) => {
    if (!Number.isFinite(order.completedSequence) && order.status === "COMPLETED") {
      order.completedSequence = nextSequence();
    }
  });
  persist();

  SC.orders = { create, list, byId, updateStatus, payCash, subscribe, active, STATUS_FLOW };
})(window.SC || (window.SC = {}));
