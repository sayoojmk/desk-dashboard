// ============================================================
// APP — wires up widgets. To add a new module later (e.g. a
// "work status" or "trading bot" panel), write it the same way
// as weather.js / calendar.js (an object with init()/fetch()/
// render()), give it a spot in index.html + style.css, then
// call its .init() below.
// ============================================================

const App = {

  init() {
    ClockWidget.init();
    WeatherWidget.init();
    CalendarWidget.init();
    this.renderStatus();
    setInterval(() => this.renderStatus(), 60 * 1000);
  },

  // Brief e-ink style ghost-flicker on a panel when its data updates.
  flicker(el) {
    if (!el) return;
    el.classList.remove("flicker");
    // force reflow so the animation can restart if triggered again quickly
    void el.offsetWidth;
    el.classList.add("flicker");
  },

  renderStatus() {
    const el = document.getElementById("status-row");
    if (!el) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    el.textContent = `SYNCED ${hh}:${mm} · ${CONFIG.location.name.toUpperCase()}`;
  },
};

document.addEventListener("DOMContentLoaded", () => App.init());
