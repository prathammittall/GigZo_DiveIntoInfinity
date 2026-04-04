"""
Build training/validation datasets from real-world weather and AQI.
Fetches historical data from Open-Meteo; generates disruption labels using
thresholds + worker behaviour so models learn realistic risk/loss patterns.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

from config import DATA_DIR, REAL_CITIES, RANDOM_SEED, USE_REAL_WEATHER
from data_fetchers import fetch_historical_weather_batch, get_aqi, get_weather

np.random.seed(RANDOM_SEED)


def _disruption_probability(row: dict) -> float:
    """Domain-based probability of disruption from weather/AQI (used to generate labels)."""
    rain = row.get("rain_mm", 0)
    temp = row.get("temperature", 25)
    aqi = row.get("aqi", 100)
    wind = row.get("wind_kph", 0)
    hour = row.get("hour_of_day", 12)
    p = 0.02
    if rain >= 50:
        p += 0.45
    elif rain >= 20:
        p += 0.25
    elif rain >= 5:
        p += 0.08
    if aqi >= 350:
        p += 0.35
    elif aqi >= 200:
        p += 0.15
    elif aqi >= 150:
        p += 0.05
    if temp >= 42:
        p += 0.2
    elif temp >= 38:
        p += 0.1
    if wind >= 50:
        p += 0.15
    if hour in (12, 13, 14, 15) and temp >= 35:
        p += 0.05
    return min(p, 0.92)


def build_real_weather_dataset(
    days_back: int = 60,
    workers_per_city: int = 80,
    max_hours_per_request: int = 500,
) -> pd.DataFrame:
    """
    Fetch real historical weather for REAL_CITIES, then generate worker-hour rows
    with synthetic worker/disruption/loss fields for training.
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_back)
    rows = []

    for city_info in REAL_CITIES:
        lat, lon = city_info["lat"], city_info["lon"]
        chunk_start = end_date - timedelta(days=min(days_back, 30))
        chunk_end = end_date
        all_hourly = fetch_historical_weather_batch(lat, lon, chunk_start, chunk_end)
        all_hourly = all_hourly[:max_hours_per_request]
        if not all_hourly:
            continue
        try:
            aqi_current = get_aqi(lat, lon)
        except Exception:
            aqi_current = 120.0

        for worker_id in range(workers_per_city):
            worker_risk_cat = np.random.choice(["low", "medium", "high"], p=[0.5, 0.3, 0.2])
            hist_disrupt_freq = {
                "low": np.random.uniform(0.02, 0.06),
                "medium": np.random.uniform(0.05, 0.12),
                "high": np.random.uniform(0.1, 0.2),
            }[worker_risk_cat]
            avg_deliv = np.random.uniform(1.5, 4.5)
            earn_per_del = np.random.uniform(60, 120)

            for h in all_hourly[:max_hours_per_request]:
                ts = h["timestamp"]
                dow = ts.weekday()
                hour = ts.hour
                temp = h["temperature"]
                rain = h["rain_mm"]
                wind = h["wind_kph"]
                # Vary AQI slightly around city proxy
                aqi = max(50, aqi_current + np.random.normal(0, 25))
                traffic_index = np.clip(np.random.normal(0.6 + 0.1 * (dow >= 5), 0.15), 0, 1)

                prob = _disruption_probability({
                    "rain_mm": rain, "temperature": temp, "aqi": aqi, "wind_kph": wind,
                    "hour_of_day": hour,
                })
                prob = min(0.92, prob + 0.25 * hist_disrupt_freq)
                disruption = np.random.rand() < prob

                if disruption:
                    duration_hours = np.random.uniform(1, 4)
                    demand_level = np.random.uniform(0.3, 0.8)
                    loss = avg_deliv * earn_per_del * duration_hours * demand_level
                else:
                    duration_hours = 0.0
                    demand_level = np.random.uniform(0.6, 1.0)
                    loss = 0.0

                rows.append({
                    "worker_id": f"{city_info['city']}_{worker_id}",
                    "city": city_info["city"],
                    "lat": lat,
                    "lon": lon,
                    "timestamp": ts,
                    "day_of_week": dow,
                    "hour_of_day": hour,
                    "temperature": temp,
                    "rain_mm": rain,
                    "wind_kph": wind,
                    "aqi": aqi,
                    "traffic_index": traffic_index,
                    "hist_disrupt_freq": hist_disrupt_freq,
                    "worker_risk_category": worker_risk_cat,
                    "avg_deliveries_per_hour": avg_deliv,
                    "earnings_per_delivery": earn_per_del,
                    "predicted_disruption_duration": duration_hours,
                    "area_demand_level": demand_level,
                    "disrupted": int(disruption),
                    "income_loss": loss,
                })

    return pd.DataFrame(rows)


def ensure_real_data(merge_with_synthetic: bool = True) -> None:
    """
    If USE_REAL_WEATHER, build real dataset and optionally merge with existing synthetic;
    then overwrite or merge env_data.csv so training uses real-world inputs.
    """
    if not USE_REAL_WEATHER:
        return
    real_df = build_real_weather_dataset(days_back=45, workers_per_city=50, max_hours_per_request=400)
    if real_df.empty:
        return
    env_path = DATA_DIR / "env_data.csv"
    if merge_with_synthetic and env_path.exists():
        try:
            syn = pd.read_csv(env_path, parse_dates=["timestamp"])
            combined = pd.concat([syn, real_df], ignore_index=True).drop_duplicates(subset=["worker_id", "timestamp"], keep="last")
            combined.to_csv(env_path, index=False)
        except Exception:
            real_df.to_csv(env_path, index=False)
    else:
        real_df.to_csv(env_path, index=False)
    # Regenerate claims from env_data for consistency
    from data_simulation import simulate_claims
    df_env = pd.read_csv(env_path, parse_dates=["timestamp"])
    claims = simulate_claims(df_env, n_claims=min(3000, max(1000, len(df_env[df_env["disrupted"] == 1]) // 2)))
    claims.to_csv(DATA_DIR / "claims_data.csv", index=False)


if __name__ == "__main__":
    ensure_real_data(merge_with_synthetic=True)
    print("Real data pipeline finished. Check", DATA_DIR)
