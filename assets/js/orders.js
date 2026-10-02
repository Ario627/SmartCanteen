(function (SC) {
  "use strict";

  const STORE = "smartcanteen.orders.v1";
  const COUNTER = "smartcanteen.queue.v1";
  const LIMIT = 80;

  function safe(fn) {
    try {
      return fn();
    } catch {
      return null;
    }
  }

  function day() {
    return new Date().toISOString().slice(0, 10);
  }

  function read() {
    const value = safe(() => JSON.parse(window.localStorage.getItem(STORE) || "[]"));
    return Array.isArray(value) ? value : [];
  }

  let orders = read();

  function persist() {
    safe(() => window.localStorage.setItem(STORE, JSON.stringify(orders)));
  }

  function queueNumber() {
    const stored = safe(() => JSON.parse(window.localStorage.getItem(COUNTER) || "null"));
    const step = stored && stored.day === day() ? Number(stored.step) || 0 : 0;
    const next = step + 1;
    safe(() =>
      window.localStorage.setItem(COUNTER, JSON.stringify({ day: day(), step: next }))
    );
    return `${SC.config.orderPrefix}${String(next).padStart(3, "0")}`;
  }

  function create(draft) {
    const digital = draft.paymentMethod === "QRIS";
    const order = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      queueNumber: queueNumber(),
      customer: { name: draft.customer.name, grade: draft.customer.grade },
      items: draft.items.map((item) => Object.assign({}, item)),
      units: draft.items.reduce((total, item) => total + item.qty, 0),
      total: draft.total,
      paymentMethod: draft.paymentMethod,
      paymentStatus: digital ? "PAID" : "PENDING",
      status: digital ? "PAID" : "PENDING",
      createdAt: new Date().toISOString(),
    };

    orders = [order].concat(orders).slice(0, LIMIT);
    persist();
    return order;
  }

  function list() {
    return orders.slice();
  }

  function byId(id) {
    return orders.find((order) => order.id === id) || null;
  }

  SC.orders = { create, list, byId };
})(window.SC || (window.SC = {}));
