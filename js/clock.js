// ============================================================
// CLOCK WIDGET
// Updates every second. No network calls.
// ============================================================

const ClockWidget = {

  els: {
    clock: null,
    date: null,
  },

  init() {
    this.els.clock = document.getElementById("clock");
    this.els.date = document.getElementById("date");
    this.tick();
    setInterval(() => this.tick(), CONFIG.refresh.clock);
  },

  tick() {
    const now = new Date();

    let hh = now.getHours();
    const ampm = hh >= 12 ? "PM" : "AM";
    hh = hh % 12 || 12;
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    this.els.clock.textContent = `${hh}:${mm}:${ss} ${ampm}`;

    const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    this.els.date.textContent =
      `${days[now.getDay()]} ${String(now.getDate()).padStart(2,"0")} ${months[now.getMonth()]} ${now.getFullYear()}`;
  },
};
