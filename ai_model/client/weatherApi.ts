/**
 * GigZo AI Model — TypeScript Client SDK
 * ═══════════════════════════════════════════════════════════════════
 * Lives in: ai_model/client/weatherApi.ts
 *
 * This is the ONLY place weather/AI fetch logic exists for the
 * frontend. The mobile app imports from here via the @ai path alias.
 *
 * Configure in mobile_app/.env:
 *   EXPO_PUBLIC_AI_BASE_URL=https://your-ai-model-url.com
 *
 * AI Model Endpoints (defined in ai_model/api.py):
 *   GET /health                → { status: "ok", service: "gigzo-ai" }
 *   GET /live-weather          → { temperature, rain_mm, wind_kph, aqi }
 *   GET /search-cities?q=...  → { results: [{city, admin1, lat, lon}] }
 *
 * Risk thresholds mirror ai_model/trigger_engine.py:
 *   TriggerThresholds: rain_mm=50, aqi=350
 * ═══════════════════════════════════════════════════════════════════
 */

// Expo injects EXPO_PUBLIC_* env vars at build time via process.env
declare const process: { env: Record<string, string | undefined> };

const AI_BASE_URL = (
  process.env.EXPO_PUBLIC_AI_BASE_URL || "http://localhost:8000"
).replace(/\/$/, "");

// ── Types ─────────────────────────────────────────────────────────────────────

export type LiveWeatherData = {
  temperature: number; // °C
  rain_mm: number;     // mm/hr
  wind_kph: number;    // km/h
  aqi: number;         // US AQI index
};

export type CityResult = {
  city: string;
  admin1: string;
  lat: number;
  lon: number;
};

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

// ── City Coordinate Map ───────────────────────────────────────────────────────
// Mirrors REAL_CITIES in ai_model/config.py — avoids a geocoding
// network call for the most common Indian cities.

export const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  "delhi":              { lat: 28.6139, lon: 77.2090 },
  "new delhi":          { lat: 28.6139, lon: 77.2090 },
  "mumbai":             { lat: 19.0760, lon: 72.8777 },
  "bangalore":          { lat: 12.9716, lon: 77.5946 },
  "bengaluru":          { lat: 12.9716, lon: 77.5946 },
  "chennai":            { lat: 13.0827, lon: 80.2707 },
  "kolkata":            { lat: 22.5726, lon: 88.3639 },
  "hyderabad":          { lat: 17.3850, lon: 78.4867 },
  "pune":               { lat: 18.5204, lon: 73.8567 },
  "ahmedabad":          { lat: 23.0225, lon: 72.5714 },
  "jaipur":             { lat: 26.9124, lon: 75.7873 },
  "lucknow":            { lat: 26.8467, lon: 80.9462 },
  "chandigarh":         { lat: 30.7333, lon: 76.7794 },
  "noida":              { lat: 28.5355, lon: 77.3910 },
  "gurgaon":            { lat: 28.4595, lon: 77.0266 },
  "gurugram":           { lat: 28.4595, lon: 77.0266 },
  "surat":              { lat: 21.1702, lon: 72.8311 },
  "nagpur":             { lat: 21.1458, lon: 79.0882 },
  "indore":             { lat: 22.7196, lon: 75.8577 },
  "bhopal":             { lat: 23.2599, lon: 77.4126 },
  "visakhapatnam":      { lat: 17.6868, lon: 83.2185 },
  "patna":              { lat: 25.5941, lon: 85.1376 },
  "coimbatore":         { lat: 11.0168, lon: 76.9558 },
  "kochi":              { lat:  9.9312, lon: 76.2673 },
  "thiruvananthapuram": { lat:  8.5241, lon: 76.9366 },
};

// ── Internal Fetch Helper ─────────────────────────────────────────────────────

async function aiFetch(path: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000); // 15s timeout
  try {
    return await fetch(`${AI_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "GigZo-Mobile/1.0",
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Guard: return null if the response is HTML (e.g. devtunnel portal redirect) */
async function safeJson<T>(res: Response): Promise<T | null> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    console.error(
      `[ai_model] Expected JSON but got "${ct}". ` +
        "Devtunnel may require authentication or is unreachable."
    );
    return null;
  }
  return res.json() as Promise<T>;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Ping the AI model's /health endpoint.
 * Maps to: GET /health in ai_model/api.py
 */
export async function checkAiConnectivity(): Promise<boolean> {
  try {
    const res = await aiFetch("/health");
    if (!res.ok) return false;
    const data = await safeJson<{ status: string }>(res);
    return data?.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Resolve a city name to lat/lon coordinates.
 * 1. Checks built-in CITY_COORDS map (instant, no network)
 * 2. Falls back to GET /search-cities in ai_model/api.py
 */
export async function resolveCity(
  city: string
): Promise<{ lat: number; lon: number } | null> {
  const key = city.toLowerCase().trim();

  if (CITY_COORDS[key]) return CITY_COORDS[key];

  try {
    const res = await aiFetch(`/search-cities?q=${encodeURIComponent(city)}`);
    if (!res.ok) return null;
    const data = await safeJson<{ results: CityResult[] }>(res);
    const results = data?.results ?? [];
    if (results.length > 0) return { lat: results[0].lat, lon: results[0].lon };
  } catch (err) {
    console.warn("[ai_model] City geocoding failed:", err);
  }

  return null;
}

/**
 * Fetch live weather + AQI for a given city.
 * Maps to: GET /live-weather?lat=...&lon=... in ai_model/api.py
 * Which internally calls data_fetchers.get_weather() + get_aqi()
 */
export async function fetchLiveWeather(
  city: string
): Promise<LiveWeatherData | null> {
  const coords = await resolveCity(city);
  if (!coords) {
    console.warn(`[ai_model] Cannot resolve city: "${city}"`);
    return null;
  }
  return fetchLiveWeatherByCoords(coords.lat, coords.lon);
}

/**
 * Fetch live weather + AQI directly from GPS coordinates.
 * Use this when you already have precise lat/lon (e.g. from expo-location).
 * Maps to: GET /live-weather?lat=...&lon=... in ai_model/api.py
 */
export async function fetchLiveWeatherByCoords(
  lat: number,
  lon: number
): Promise<LiveWeatherData | null> {
  try {
    const res = await aiFetch(
      `/live-weather?lat=${lat}&lon=${lon}`
    );

    if (!res.ok) {
      console.error("[ai_model] /live-weather HTTP error:", res.status, res.statusText);
      return null;
    }

    const data = await safeJson<Partial<LiveWeatherData>>(res);
    if (!data || typeof data.temperature !== "number") {
      console.error("[ai_model] Unexpected /live-weather response:", data);
      return null;
    }

    return {
      temperature: data.temperature,
      rain_mm:     data.rain_mm  ?? 0.0,
      wind_kph:    data.wind_kph ?? 10.0,
      aqi:         data.aqi      ?? 100.0,
    };
  } catch (err) {
    const name = (err as Error).name;
    if (name === "AbortError") {
      console.error("[ai_model] /live-weather request timed out (15s)");
    } else {
      console.error("[ai_model] /live-weather fetch failed:", err);
    }
    return null;
  }
}

/**
 * Compute risk level from weather data.
 * Mirrors TriggerThresholds in ai_model/trigger_engine.py:
 *   rain_mm >= 50  → triggers "heavy_rain"  (HIGH)
 *   aqi    >= 350  → triggers "hazardous_aqi" (HIGH)
 */
export function computeRiskLevel(data: LiveWeatherData): RiskLevel {
  const { temperature, rain_mm, wind_kph, aqi } = data;

  // HIGH — exact trigger thresholds from trigger_engine.py
  if (rain_mm >= 50 || aqi >= 350)            return "HIGH";
  if (temperature >= 45 || temperature <= 2)  return "HIGH";
  if (wind_kph >= 80)                         return "HIGH";

  // MEDIUM
  if (rain_mm >= 20 || aqi >= 200)            return "MEDIUM";
  if (temperature >= 40 || temperature <= 8)  return "MEDIUM";
  if (wind_kph >= 50)                         return "MEDIUM";

  return "LOW";
}
