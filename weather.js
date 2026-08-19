// ============================================================
// WEATHER WIDGET
// Uses Open-Meteo (https://open-meteo.com) — free, no API key,
// no CORS issues, fine to call directly from a static site.
// ============================================================

const WeatherWidget = {

  els: {
    temp: null,
    desc: null,
    sub: null,
  },

  // WMO weather codes -> short label
  // https://open-meteo.com/en/docs (see "Weather variable documentation")
  codeMap: {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Rime fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow",
    80: "Rain showers", 81: "Rain showers", 82: "Violent showers",
    95: "Thunderstorm", 96: "Thunderstorm", 99: "Thunderstorm",
  },

  init() {
    this.els.temp = document.getElementById("weather-temp");
    this.els.desc = document.getElementById("weather-desc");
    this.els.sub = document.getElementById("weather-sub");
    this.fetch();
    setInterval(() => this.fetch(), CONFIG.refresh.weather);
  },

  buildUrl() {
    const { lat, lon } = CONFIG.location;
    const unit = CONFIG.tempUnit === "fahrenheit" ? "fahrenheit" : "celsius";
    return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=${unit}&wind_speed_unit=kmh&timezone=auto`;
  },

  async fetch() {
    try {
      const res = await fetch(this.buildUrl());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.render(data);
    } catch (err) {
      console.error("[weather] fetch failed:", err);
      this.els.desc.textContent = "Unavailable";
    }
  },

  render(data) {
    const cur = data.current;
    const day = data.daily;
    const unitSymbol = CONFIG.tempUnit === "fahrenheit" ? "°F" : "°C";

    this.els.temp.textContent = `${Math.round(cur.temperature_2m)}°`;
    this.els.desc.textContent = this.codeMap[cur.weather_code] || "—";
    this.els.sub.textContent =
      `H:${Math.round(day.temperature_2m_max[0])}${unitSymbol} ` +
      `L:${Math.round(day.temperature_2m_min[0])}${unitSymbol} · ` +
      `WIND ${Math.round(cur.wind_speed_10m)} KM/H`;

    if (CONFIG.flickerOnRefresh) App.flicker(document.getElementById("weather-panel"));
  },
};
