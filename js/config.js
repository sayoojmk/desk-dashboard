// ============================================================
// CONFIG — edit these values for your setup. Nothing else in
// the js/ folder needs to change for basic use.
// ============================================================

const CONFIG = {

  // --- Location (for weather) ---
  // Get lat/lon from https://www.latlong.net or Google Maps (right-click a point).
  location: {
    name: "Thiruvananthapuram",
    lat: 8.555747874083433,
    lon: 76.86840505741645,
  },
  secondaryLocation: {
    name: "Kozhikode",
    lat: 11.2588,
    lon: 75.7804,
  },

  // --- Units ---
  tempUnit: "celsius", // "celsius" | "fahrenheit"

  // --- Calendar ---
  // Leave calendarIcsUrl empty ("") to show a placeholder agenda.
  // To wire a real calendar (Google Calendar):
  //   1. Google Calendar → Settings → [your calendar] → "Integrate calendar"
  //   2. Copy the "Secret address in iCal format" (keep it secret — it's a link
  //      to your whole calendar, don't publish this repo publicly if you paste it in)
  //   3. Paste it below. It will be fetched through a CORS proxy since Google
  //      does not allow direct browser fetches of .ics files.
  calendarIcsUrl: "",
  corsProxy: "https://corsproxy.io/?url=",

  // How many upcoming events to show
  agendaMaxItems: 4,

  // --- Medication reminders ---
  // Medicines, doses, and schedule now live in a Google Sheet, served
  // through this Cloud Function. Edit the sheet any time — no code or
  // redeploy needed for a dose/schedule change.
  medicationApiUrl: "https://dashboard-api-423410331874.europe-west1.run.app/",
  medicationAlarmSeconds: 60, // how long it beeps/shows if not confirmed

  // --- Timers ---
  // Preset quick-start timers, shown as buttons. Rename/retime/add more
  // freely — no other file needs to change. A custom-minutes input is
  // always shown alongside these on the dashboard.
  // NOTE: unlike medication alerts, timer alerts do NOT auto-dismiss —
  // they ring until you tap "Done". This is deliberate (e.g. a water
  // pump timer should not silently stop nagging if you're not there).
  timers: {
    presets: [
      { label: "Water Pump", minutes: 7 },
      { label: "Preset 2", minutes: 20 },
      { label: "Preset 3", minutes: 23 },
    ],
  },

  // --- Refresh intervals (ms) ---
  refresh: {
    clock: 1000,
    weather: 10 * 60 * 1000,   // 10 min
    calendar: 5 * 60 * 1000,   // 5 min
    medication: 5 * 60 * 1000, // 5 min — how often to re-pull today's med list
  },

  // --- Behavior ---
  flickerOnRefresh: true, // e-ink style ghost-flicker when data updates
};