"""
Fetch real-world weather and AQI data. Uses Open-Meteo (no key) by default;
optional OpenWeatherMap and WAQI when API keys are set in .env.
"""
from __future__ import annotations

import time
from datetime import datetime, timedelta
from typing import Any, Optional

import requests

from config import REAL_CITIES

_USER_AGENT = "ParametricInsurance/1.0 (compliance; contact optional)"


def _get(url: str, params: dict[str, Any] | None = None, timeout: int = 8) -> dict:
    r = requests.get(url, params=params or {}, timeout=timeout, headers={"User-Agent": _USER_AGENT})
    r.raise_for_status()
    return r.json()


def fetch_weather_openmeteo(lat: float, lon: float, date: datetime | None = None) -> dict[str, float]:
    """Fetch current or historical weather from Open-Meteo (no API key)."""
    if date is None:
        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "temperature_2m,precipitation,windspeed_10m",
            "forecast_days": 1,
        }
    else:
        url = "https://archive-api.open-meteo.com/v1/archive"
        start = date.strftime("%Y-%m-%d")
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start,
            "end_date": start,
            "hourly": "temperature_2m,precipitation,windspeed_10m",
        }
    data = _get(url, params)
    hourly = data.get("hourly", {})
    times = hourly.get("time", [])
    temps = hourly.get("temperature_2m", [])
    preci = hourly.get("precipitation", [])
    winds = hourly.get("windspeed_10m", [])
    if not times:
        return {"temperature": 25.0, "rain_mm": 0.0, "wind_kph": 10.0}
    # Use noon (index 12) or middle of available hours
    i = min(12, len(times) - 1) if len(times) > 12 else len(times) // 2
    # wind from m/s to km/h: * 3.6
    wind_ms = winds[i] if winds else 0
    return {
        "temperature": float(temps[i]) if temps else 25.0,
        "rain_mm": float(preci[i]) if preci else 0.0,
        "wind_kph": round(wind_ms * 3.6, 2),
    }


def fetch_aqi_openmeteo(lat: float, lon: float) -> float:
    """Fetch current AQI from Open-Meteo Air Quality API (no key). Returns US AQI or 100 if unavailable."""
    try:
        url = "https://air-quality.api.open-meteo.com/v1/air-quality"
        params = {"latitude": lat, "longitude": lon, "current": "us_aqi"}
        data = _get(url, params)
        current = data.get("current", {}) or data.get("current", {})
        aqi = current.get("us_aqi")
        if aqi is not None:
            return float(aqi)
    except Exception:
        pass
    return 100.0


def get_weather(lat: float, lon: float, date: datetime | None = None) -> dict[str, float]:
    """Best available weather: Open-Meteo."""
    return fetch_weather_openmeteo(lat, lon, date)


def get_aqi(lat: float, lon: float) -> float:
    """Best available AQI: Open-Meteo."""
    return fetch_aqi_openmeteo(lat, lon)


def fetch_historical_weather_batch(
    lat: float, lon: float, start_date: datetime, end_date: datetime
) -> list[dict[str, Any]]:
    """Fetch historical hourly weather for a date range (Open-Meteo). Returns list of hourly records."""
    out = []
    # Open-Meteo archive allows range; avoid huge ranges to respect rate limits
    delta = (end_date - start_date).days
    step_days = 30
    current = start_date
    while current <= end_date:
        chunk_end = min(current + timedelta(days=step_days), end_date)
        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": current.strftime("%Y-%m-%d"),
            "end_date": chunk_end.strftime("%Y-%m-%d"),
            "hourly": "temperature_2m,precipitation,windspeed_10m",
        }
        try:
            data = _get(url, params)
            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            temps = hourly.get("temperature_2m", [])
            preci = hourly.get("precipitation", [])
            winds = hourly.get("windspeed_10m", [])
            for i, t in enumerate(times):
                if i >= len(temps):
                    break
                try:
                    dt = datetime.fromisoformat(t.replace("Z", "+00:00"))
                except Exception:
                    dt = current
                wind_ms = winds[i] if i < len(winds) else 0
                out.append({
                    "timestamp": dt,
                    "temperature": float(temps[i]),
                    "rain_mm": float(preci[i]) if i < len(preci) else 0.0,
                    "wind_kph": round((wind_ms or 0) * 3.6, 2),
                })
            time.sleep(0.2)  # rate limit
        except Exception:
            pass
        current = chunk_end + timedelta(days=1)
    return out


def fetch_live_snapshot(city: dict | None = None) -> dict[str, Any]:
    """Fetch current weather + AQI for one city. If city is None, use first REAL_CITIES."""
    city = city or REAL_CITIES[0]
    lat, lon = city["lat"], city["lon"]
    weather = get_weather(lat, lon, date=None)
    aqi = get_aqi(lat, lon)
    return {
        "city": city["city"],
        "lat": lat,
        "lon": lon,
        "temperature": weather["temperature"],
        "rain_mm": weather["rain_mm"],
        "wind_kph": weather["wind_kph"],
        "aqi": aqi,
    }


def fetch_elevation_openmeteo(lat: float, lon: float) -> Optional[float]:
    """Fetch exact altitude matching GPS coordinates from Open-Meteo."""
    try:
        url = "https://api.open-meteo.com/v1/elevation"
        params = {"latitude": lat, "longitude": lon}
        data = _get(url, params)
        elevations = data.get("elevation", [])
        if elevations and len(elevations) > 0:
            return float(elevations[0])
    except Exception:
        pass
    return None


def fetch_route_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate basic haversine distance (approximation of true distance). Open-Meteo doesn't natively do routing but we can calculate precise geographic distance in km."""
    import math
    R = 6371.0 # Earth radius in km
    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def search_indian_cities(query: str) -> list[dict[str, Any]]:
    """Query Open-Meteo Geocoding to dynamically find Indian cities."""
    try:
        url = "https://geocoding-api.open-meteo.com/v1/search"
        params = {"name": query, "count": 10, "language": "en", "format": "json"}
        data = _get(url, params)
        results = data.get("results", [])
        indian_cities = []
        for city in results:
            if city.get("country_code") == "IN" or city.get("country") == "India":
                indian_cities.append({
                    "city": city.get("name"),
                    "admin1": city.get("admin1", ""),
                    "lat": city.get("latitude"),
                    "lon": city.get("longitude")
                })
        return indian_cities
    except Exception:
        return []


def fetch_latest_earthquakes() -> list[dict[str, Any]]:
    """Fetch significant earthquakes from USGS."""
    try:
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson"
        data = _get(url)
        features = data.get("features", [])
        quakes = []
        for feature in features:
            props = feature.get("properties", {})
            geom = feature.get("geometry", {})
            coords = geom.get("coordinates", [0, 0, 0]) # lon, lat, depth
            quakes.append({
                "place": props.get("place", "Unknown"),
                "magnitude": props.get("mag", 0.0),
                "time": props.get("time"),
                "lat": coords[1],
                "lon": coords[0],
                "depth_km": coords[2]
            })
        return sorted(quakes, key=lambda x: x["time"] or 0, reverse=True)
    except Exception:
        return []

