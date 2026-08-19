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

  // --- Refresh intervals (ms) ---
  refresh: {
    clock: 1000,
    weather: 10 * 60 * 1000,   // 10 min
    calendar: 5 * 60 * 1000,   // 5 min
  },

  // --- Behavior ---
  flickerOnRefresh: true, // e-ink style ghost-flicker when data updates

    // --- Medication reminders ---
  // time is 24hr "HH:MM". Add as many as you like.
  medications: [
    { name: "Blood pressure tablet", time: "13:35" },
  ],
  medicationAlarmSeconds: 60, // how long it beeps/shows if not confirmed
};
