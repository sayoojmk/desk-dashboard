// ============================================================
// TIMER WIDGET
// Tap the "⏱ Timer" launcher button to open a picker (presets +
// custom minutes). Starting a timer closes the picker. Running
// timers show as a ribbon at the top of the Home Screen (not
// tucked away), each with its own cancel (x).
//
// On expiry: full-screen strobing alert with a continuous siren
// — deliberately louder/harsher than the medication alert, and
// it does NOT auto-dismiss. It rings until "Done" is tapped, by
// design (e.g. a water-pump timer shouldn't quietly give up).
// If the medication overlay (or another timer alert) is already
// showing, it waits its turn instead of stacking.
// ============================================================

const TimerWidget = {

  presetsEl: null,
  ribbonEl: null,
  customInput: null,
  customBtn: null,
  overlayEl: null,
  overlayNameEl: null,
  confirmBtn: null,
  modalEl: null,
  openModalBtn: null,
  closeModalBtn: null,

  timers: [],    // { id, label, endsAt }
  ringing: null, // the timer currently showing the alert overlay, if any
  audioCtx: null,
  osc: null,
  gainNode: null,
  sweepInterval: null,

  init() {
    this.presetsEl = document.getElementById("timer-presets");
    this.ribbonEl = document.getElementById("timer-ribbon");
    this.customInput = document.getElementById("timer-custom-minutes");
    this.customBtn = document.getElementById("timer-custom-start");
    this.overlayEl = document.getElementById("timer-overlay");
    this.overlayNameEl = document.getElementById("timer-overlay-name");
    this.confirmBtn = document.getElementById("timer-confirm");
    this.modalEl = document.getElementById("timer-modal");
    this.openModalBtn = document.getElementById("open-timer-modal");
    this.closeModalBtn = document.getElementById("timer-modal-close");

    this.renderPresetButtons();
    this.customBtn.addEventListener("click", () => this.startCustom());
    this.confirmBtn.addEventListener("click", () => this.dismissRinging());

    this.openModalBtn.addEventListener("click", () => this.openModal());
    this.closeModalBtn.addEventListener("click", () => this.closeModal());
    this.modalEl.addEventListener("click", (e) => {
      if (e.target === this.modalEl) this.closeModal(); // tap outside card
    });

    setInterval(() => this.tick(), 1000);
  },

  openModal() { this.modalEl.classList.add("active"); },
  closeModal() { this.modalEl.classList.remove("active"); },

  renderPresetButtons() {
    const presets = (CONFIG.timers && CONFIG.timers.presets) || [];
    this.presetsEl.innerHTML = presets.map((p, i) => `
      <button class="timer-btn" data-index="${i}">${this.escapeHtml(p.label)} · ${p.minutes} min</button>
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
    this.renderRibbon();
    this.closeModal();
  },

  cancel(id) {
    this.timers = this.timers.filter(t => t.id !== id);
    this.renderRibbon();
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
    this.renderRibbon();
  },

  renderRibbon() {
    if (!this.timers.length) {
      this.ribbonEl.innerHTML = "";
      return;
    }
    const now = Date.now();
    this.ribbonEl.innerHTML = this.timers.map(t => {
      const remainingMs = Math.max(0, t.endsAt - now);
      const mm = String(Math.floor(remainingMs / 60000)).padStart(2, "0");
      const ss = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0");
      return `
        <div class="timer-ribbon-item" data-id="${t.id}">
          <span>⏱ ${this.escapeHtml(t.label)} · ${mm}:${ss}</span>
          <span class="cancel" data-cancel="${t.id}">✕</span>
        </div>
      `;
    }).join("");
    this.ribbonEl.querySelectorAll("[data-cancel]").forEach(el => {
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
    this.startSiren();
  },

  // No auto-dismiss, by design — see file header.
  dismissRinging() {
    this.ringing = null;
    this.overlayEl.classList.remove("active");
    this.stopSiren();
  },

  // Continuous two-tone siren sweep — much harder to miss than short
  // beeps, and deliberately distinct from the medication alert's soft
  // single tone.
  startSiren() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return; // no audio support, the strobing screen still works
    }
    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = "sawtooth";
    gainNode.gain.value = 0.9;
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();

    const low = 600, high = 1100;
    const sweep = () => {
      const now = ctx.currentTime;
      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setValueAtTime(low, now);
      osc.frequency.linearRampToValueAtTime(high, now + 0.4);
      osc.frequency.linearRampToValueAtTime(low, now + 0.8);
    };
    sweep();
    this.sweepInterval = setInterval(sweep, 800);

    this.osc = osc;
    this.gainNode = gainNode;
  },

  stopSiren() {
    clearInterval(this.sweepInterval);
    this.sweepInterval = null;
    if (this.osc) {
      try { this.osc.stop(); } catch {}
      this.osc = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
  },

  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },
};