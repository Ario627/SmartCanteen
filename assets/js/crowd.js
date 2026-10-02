(function (SC) {
  "use strict";

  const CAPACITY = 60;
  const SECONDS_PER_ORDER = 36;

  const PEAKS = [
    { minute: 9 * 60 + 40, weight: 0.58, spread: 34 },
    { minute: 12 * 60 + 15, weight: 1, spread: 44 },
  ];

  const STATES = {
    LOW: { label: "Sepi", color: "var(--low)", hint: "Waktu paling nyaman untuk datang ke kantin." },
    NORMAL: { label: "Normal", color: "var(--normal)", hint: "Alur pesanan berjalan lancar." },
    BUSY: { label: "Ramai", color: "var(--busy)", hint: "Sebaiknya pesan lebih awal sebelum antrean menumpuk." },
    FULL: { label: "Penuh", color: "var(--full)", hint: "Pertimbangkan menunda kedatangan beberapa menit." },
  };

  function loadAt(minute) {
    return PEAKS.reduce(
      (total, peak) =>
        total + peak.weight * Math.exp(-((minute - peak.minute) ** 2) / (2 * peak.spread ** 2)),
      0.05
    );
  }

  function statusFrom(occupancy) {
    if (occupancy <= 40) return "LOW";
    if (occupancy <= 70) return "NORMAL";
    if (occupancy <= 90) return "BUSY";
    return "FULL";
  }

  function snapshot(date) {
    const now = date instanceof Date ? date : new Date();
    const minute = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    const drift = Math.sin(now.getTime() / 47000) * 0.02;
    const load = SC.fmt.clamp(loadAt(minute) + drift, 0.04, 1);
    const people = Math.round(CAPACITY * load);
    const occupancy = SC.fmt.clamp(Math.round((people / CAPACITY) * 100), 0, 100);
    const status = statusFrom(occupancy);
    const queue = Math.round(people * 0.24);

    return {
      people,
      capacity: CAPACITY,
      occupancy,
      status,
      state: STATES[status],
      queue,
      eta: Math.max(1, Math.round((queue * SECONDS_PER_ORDER) / 60)),
      updatedAt: now,
    };
  }

  function watch(callback, interval) {
    callback(snapshot());
    const timer = window.setInterval(() => callback(snapshot()), interval || 5000);
    return () => window.clearInterval(timer);
  }

  SC.crowd = { snapshot, watch, STATES, CAPACITY };
})(window.SC || (window.SC = {}));
