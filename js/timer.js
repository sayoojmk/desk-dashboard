// ============================================================
// TIMER WIDGET
// Preset quick-start timers (e.g. "Water Pump · 7m") plus a
// custom-minutes input. Multiple timers can run at once, each
// shown as a small countdown chip with a cancel (x).
//
// On expiry: full-screen alert, distinct alarm sound from the
// medication alert (sharp double-beep vs. medicine's soft
// single tone), and — deliberately — it does NOT auto-dismiss.
// It rings until "Done" is tapped. If the medication overlay is
// showing (or another timer alert is), it waits its turn instead
// of stacking on top.
// ============================================================

const TimerWidget = {

  presetsEl: null,
  activeEl: null,
  customInput: null,
  customBtn: null,
  overlayEl: null,
  overlayNameEl: null,
  confirmBtn: null,

  timers: [],   // { id, label, endsAt }
  ringing: null, // the timer currently showing the alert overlay, if any
  audioCtx: null,
  beepInterval: null,

  init() {
    this.presetsEl = document.getElementById("timer-presets");
    this.activeEl = document.getElementById("timer-active");
    this.customInput = document.getElementById("timer-custom-minutes");
    this.customBtn = document.getElementById("timer-custom-start");
    this.overlayEl = document.getElementById("timer-overlay");
    this.overlayNameEl = document.getElementById("timer-overlay-name");
    this.confirmBtn = document.getElementById("timer-confirm");

    this.renderPresetButtons();
    this.customBtn.addEventListener("click", () => this.startCustom());
    this.confirmBtn.addEventListener("click", () => this.dismissRinging());

    setInterval(() => this.tick(), 1000);
  },

  renderPresetButtons() {
    const presets = (CONFIG.timers && CONFIG.timers.presets) || [];
    this.presetsEl.innerHTML = presets.map((p, i) => `
      <button class="timer-btn" data-index="${i}">${this.escapeHtml(p.label)} · ${p.minutes}m</button>
    `).join("");
    this.presetsEl.querySelectorAll(".timer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const p = presets[+btn.dataset.index];
        this.start(p.label, p.minutes);
      });
    });
  },

  startCustom() {
    const mins = parseInt(this.customInput.value, 10);
    if (!mins || mins <= 0) return;
    this.start(`Timer (${mins}m)`, mins);
    this.customInput.value = "";
  },

  start(label, minutes) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.timers.push({ id, label, endsAt: Date.now() + minutes * 60 * 1000 });
    this.renderActive();
  },

  cancel(id) {
    this.timers = this.timers.filter(t => t.id !== id);
    this.renderActive();
  },

  tick() {
    const now = Date.now();
    const stillRunning = [];

    for (const t of this.timers) {
      if (t.endsAt <= now) {
        this.queueAlert(t);
      } else {
        stillRunning.push(t);
      }
    }

    if (stillRunning.length !== this.timers.length) this.timers = stillRunning;
    this.renderActive();
  },

  renderActive() {
    if (!this.timers.length) {
      this.activeEl.innerHTML = "";
      return;
    }
    const now = Date.now();
    this.activeEl.innerHTML = this.timers.map(t => {
      const remainingMs = Math.max(0, t.endsAt - now);
      const mm = String(Math.floor(remainingMs / 60000)).padStart(2, "0");
      const ss = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0");
      return `
        <span class="timer-chip" data-id="${t.id}">
          ${this.escapeHtml(t.label)} · ${mm}:${ss}
          <span class="cancel" data-cancel="${t.id}">✕</span>
        </span>
      `;
    }).join("");
    this.activeEl.querySelectorAll("[data-cancel]").forEach(el => {
      el.addEventListener("click", () => this.cancel(el.dataset.cancel));
    });
  },

  // Waits its turn instead of stacking a second full-screen overlay if
  // the medication alert (or another timer alert) is already showing.
  queueAlert(timer) {
    const medActive = document.getElementById("med-overlay")?.classList.contains("active");
    if (this.ringing || medActive) {
      setTimeout(() => this.queueAlert(timer), 1000);
      return;
    }
    this.showAlert(timer);
  },

  showAlert(timer) {
    this.ringing = timer;
    this.overlayNameEl.textContent = timer.label;
    this.overlayEl.classList.add("active");
    this.startBeeping();
  },

  // No auto-dismiss, by design — see file header.
  dismissRinging() {
    this.ringing = null;
    this.overlayEl.classList.remove("active");
    this.stopBeeping();
  },

  startBeeping() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return; // no audio support, overlay still shows silently
    }
    this.beep();
    this.beepInterval = setInterval(() => this.beep(), 900);
  },

  // Sharp double-beep (square wave, 1200Hz) — deliberately distinct
  // from the medication alert's soft single sine tone.
  beep() {
    if (!this.audioCtx) return;
    [0, 0.12].forEach(delay => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = "square";
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + delay + 0.1);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(this.audioCtx.currentTime + delay);
      osc.stop(this.audioCtx.currentTime + delay + 0.1);
    });
  },

  stopBeeping() {
    clearInterval(this.beepInterval);
    this.beepInterval = null;
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },
};