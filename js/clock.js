// ============================================================
// CLOCK + CALENDAR-BLOCK WIDGET
// Drives the hero clock (HH:MM, with a small muted pulsing
// seconds trailer) and the calendar-block header at the top of
// the "Today" column (weekday / big day number / month-year).
// Updates every second. No network calls.
// ============================================================

const ClockWidget = {

  els: {
    clockMain: null,
    clockSeconds: null,
    calWeekday: null,
    calDay: null,
    calMonth: null,
  },

  init() {
    this.els.clockMain = document.getElementById("clock-main");
    this.els.clockSeconds = document.getElementById("clock-seconds");
    this.els.calWeekday = document.getElementById("cal-weekday");
    this.els.calDay = document.getElementById("cal-day");
    this.els.calMonth = document.getElementById("cal-month");
    this.tick();
    setInterval(() => this.tick(), CONFIG.refresh.clock);
  },

  tick() {
    const now = new Date();

    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    this.els.clockMain.textContent = `${hh}:${mm}`;
    this.els.clockSeconds.textContent = `:${ss}`;

    const days = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
    const months = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];

    this.els.calWeekday.textContent = days[now.getDay()];
    this.els.calDay.textContent = String(now.getDate()).padStart(2, "0");
    this.els.calMonth.textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
  },
};