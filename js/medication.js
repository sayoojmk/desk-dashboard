// ============================================================
// MEDICATION REMINDER WIDGET
// Checks every second against CONFIG.medications. When the
// clock hits a configured time, shows a full-screen alert with
// the medicine name and a short repeating beep until confirmed
// or CONFIG.medicationAlarmSeconds elapses.
//
// A confirmation is remembered per medicine per day (localStorage)
// so it won't re-trigger once you've confirmed it.
// ============================================================

const MedicationWidget = {

  overlayEl: null,
  nameEl: null,
  confirmBtn: null,
  audioCtx: null,
  beepInterval: null,
  autoDismissTimeout: null,
  activeMed: null,

  init() {
    this.overlayEl = document.getElementById("med-overlay");
    this.nameEl = document.getElementById("med-name");
    this.confirmBtn = document.getElementById("med-confirm");

    this.confirmBtn.addEventListener("click", () => this.confirm());

    setInterval(() => this.check(), 1000);
  },

  todayKey(medName) {
    const d = new Date();
    const dateStr = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    return `med-taken:${medName}:${dateStr}`;
  },

  isConfirmedToday(medName) {
    try {
      return localStorage.getItem(this.todayKey(medName)) === "1";
    } catch {
      return false;
    }
  },

  check() {
    if (this.activeMed) return; // already showing an alert

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const nowStr = `${hh}:${mm}`;

    const due = (CONFIG.medications || []).find(
      m => m.time === nowStr && !this.isConfirmedToday(m.name)
    );

    if (due) this.trigger(due);
  },

  trigger(med) {
    this.activeMed = med;
    this.nameEl.textContent = med.name;
    this.overlayEl.classList.add("active");
    this.startBeeping();

    this.autoDismissTimeout = setTimeout(() => {
      this.stopBeeping();
      this.overlayEl.classList.remove("active");
      this.activeMed = null; // will re-trigger next minute if still not confirmed... 
    }, (CONFIG.medicationAlarmSeconds || 60) * 1000);
  },

  confirm() {
    if (!this.activeMed) return;
    try {
      localStorage.setItem(this.todayKey(this.activeMed.name), "1");
    } catch {}
    this.dismiss();
  },

  dismiss() {
    clearTimeout(this.autoDismissTimeout);
    this.stopBeeping();
    this.overlayEl.classList.remove("active");
    this.activeMed = null;
  },

  startBeeping() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return; // no audio support, overlay still shows silently
    }
    this.beep();
    this.beepInterval = setInterval(() => this.beep(), 1500);
  },

  beep() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.3);
  },

  stopBeeping() {
    clearInterval(this.beepInterval);
    this.beepInterval = null;
  },
};