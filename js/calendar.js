// ============================================================
// CALENDAR / AGENDA WIDGET
// Fetches a public .ics feed (e.g. a Google Calendar "secret
// iCal address") through a CORS proxy and shows today's
// upcoming events. Ships a lightweight ICS parser — no
// external library needed.
//
// If CONFIG.calendarIcsUrl is empty, shows a placeholder so
// the rest of the dashboard still works out of the box.
// ============================================================

const CalendarWidget = {

  els: { list: null },

  init() {
    this.els.list = document.getElementById("agenda-list");

    if (!CONFIG.calendarIcsUrl) {
      this.renderPlaceholder();
      return;
    }

    this.fetch();
    setInterval(() => this.fetch(), CONFIG.refresh.calendar);
  },

  renderPlaceholder() {
    this.els.list.innerHTML =
      `<li class="agenda-empty">Add calendarIcsUrl in config.js to show real events</li>`;
  },

  async fetch() {
    try {
      const url = CONFIG.corsProxy + encodeURIComponent(CONFIG.calendarIcsUrl);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const events = this.parseIcs(text);
      this.render(events);
    } catch (err) {
      console.error("[calendar] fetch failed:", err);
      this.els.list.innerHTML = `<li class="agenda-empty">Calendar unavailable</li>`;
    }
  },

  // Minimal RFC5545 parser: unfolds lines, reads VEVENT blocks,
  // pulls DTSTART and SUMMARY. Good enough for a read-only agenda.
  parseIcs(raw) {
    const unfolded = raw.replace(/\r\n[ \t]/g, "").split(/\r\n|\n/);
    const events = [];
    let cur = null;

    for (const line of unfolded) {
      if (line === "BEGIN:VEVENT") { cur = {}; continue; }
      if (line === "END:VEVENT") {
        if (cur && cur.start && cur.summary) events.push(cur);
        cur = null;
        continue;
      }
      if (!cur) continue;

      if (line.startsWith("DTSTART")) {
        cur.start = this.parseIcsDate(line);
      } else if (line.startsWith("SUMMARY")) {
        cur.summary = line.split(":").slice(1).join(":").trim();
      }
    }

    const now = new Date();
    return events
      .filter(e => e.start && e.start >= now)
      .sort((a, b) => a.start - b.start)
      .slice(0, CONFIG.agendaMaxItems);
  },

  parseIcsDate(line) {
    const value = line.split(":").slice(1).join(":").trim();
    // All-day: DTSTART;VALUE=DATE:20260819
    if (/^\d{8}$/.test(value)) {
      const y = value.slice(0, 4), m = value.slice(4, 6), d = value.slice(6, 8);
      return new Date(`${y}-${m}-${d}T00:00:00`);
    }
    // Timed, UTC: 20260819T090000Z
    if (/Z$/.test(value)) {
      const y = value.slice(0,4), mo = value.slice(4,6), d = value.slice(6,8);
      const h = value.slice(9,11), mi = value.slice(11,13), s = value.slice(13,15);
      return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
    }
    // Timed, local/floating: 20260819T090000
    const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (m) return new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]);
    return null;
  },

  render(events) {
    if (!events.length) {
      this.els.list.innerHTML = `<li class="agenda-empty">Nothing scheduled</li>`;
    } else {
      this.els.list.innerHTML = events.map(e => `
        <li class="agenda-item">
          <span class="agenda-time">${this.formatTime(e.start)}</span>
          <span class="agenda-title">${this.escapeHtml(e.summary)}</span>
        </li>
      `).join("");
    }
    if (CONFIG.flickerOnRefresh) App.flicker(document.getElementById("today-panel"));
  },

  formatTime(d) {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },
};