// ============================================================
// MEDICATION REMINDER WIDGET
// Pulls today's medications from the Cloud Function (backed by
// the Google Sheet) — no hardcoded list here. Shows a full-screen
// alert with the medicine + dose and a repeating beep once its
// scheduled time arrives, until confirmed or the alarm window
// elapses. Confirming posts back to the same API, which logs it
// to the MedicationLog sheet — that's what "what did I take
// yesterday" answers, and it persists across devices/reloads,
// unlike the old localStorage-only version.
// ============================================================

const MedicationWidget = {

  overlayEl: null,
  nameEl: null,
  confirmBtn: null,
  audioCtx: null,
  beepInterval: null,
  autoDismissTimeout: null,
  activeMed: null,

  meds: [], // cached from the API: [{ name, dose, time, taken }]

  init() {
    this.overlayEl = document.getElementById("med-overlay");
    this.nameEl = document.getElementById("med-name");
    this.confirmBtn = document.getElementById("med-confirm");

    this.confirmBtn.addEventListener("click", () => this.confirm());

    this.fetchMeds();
    setInterval(() => this.fetchMeds(), CONFIG.refresh.medication || 5 * 60 * 1000);
    setInterval(() => this.check(), 1000);
  },

  async fetchMeds() {
    if (!CONFIG.medicationApiUrl) return;
    try {
      const res = await fetch(CONFIG.medicationApiUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.meds = data.medications || [];
    } catch (err) {
      console.error("[medication] fetch failed:", err);
    }
  },

  // zero-pads API times like "8:45" -> "08:45" for string comparison
  _normTime(t) {
    const [h, m] = String(t).split(":");
    return `${h.padStart(2, "0")}:${(m || "00").padStart(2, "0")}`;
  },

  check() {
    if (this.activeMed) return; // already showing an alert

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const nowStr = `${hh}:${mm}`;

    // due = scheduled time has arrived (or passed) and not yet confirmed today
    const due = this.meds.find(m => !m.taken && this._normTime(m.time) <= nowStr);
    if (due) this.trigger(due);
  },

  trigger(med) {
    this.activeMed = med;
    this.nameEl.textContent = med.dose ? `${med.name} · ${med.dose}` : med.name;
    this.overlayEl.classList.add("active");
    this.startBeeping();

    // Re-nags: if not confirmed, hides after medicationAlarmSeconds and
    // check() will simply pick it up again on the next 1s tick since
    // .taken is still false.
    this.autoDismissTimeout = setTimeout(() => {
      this.stopBeeping();
      this.overlayEl.classList.remove("active");
      this.activeMed = null;
    }, (CONFIG.medicationAlarmSeconds || 60) * 1000);
  },

  async confirm() {
    if (!this.activeMed) return;
    const med = this.activeMed;

    // mark taken locally right away so it doesn't re-trigger while the
    // network request is in flight
    med.taken = true;
    this.dismiss();

    try {
      await fetch(CONFIG.medicationApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: med.name, dose: med.dose }),
      });
    } catch (err) {
      console.error("[medication] confirm failed to log:", err);
      // stays marked taken locally for the rest of today either way,
      // so it won't keep nagging even if the log write failed
    }
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