import numpy as np
import pandas as pd
from datetime import datetime, timedelta

from config import DATA_DIR, RANDOM_SEED

np.random.seed(RANDOM_SEED)

CITIES = [
    {"city": "CityA", "lat": 28.6, "lon": 77.2},   # hot, polluted
    {"city": "CityB", "lat": 19.0, "lon": 72.8},   # coastal, rainy
    {"city": "CityC", "lat": 12.9, "lon": 77.6},   # moderate
]


def simulate_environment(n_days: int = 60, workers_per_city: int = 200) -> pd.DataFrame:
    rows = []
    start_date = datetime.now() - timedelta(days=n_days)
    for city_info in CITIES:
        for worker_id in range(workers_per_city):
            worker_global_id = f"{city_info['city']}_{worker_id}"
            worker_risk_cat = np.random.choice(["low", "medium", "high"], p=[0.5, 0.3, 0.2])

            for d in range(n_days):
                date = start_date + timedelta(days=d)
                for hour in range(6, 24):  # active hours
                    ts = date.replace(hour=hour, minute=0, second=0, microsecond=0)
                    dow = ts.weekday()  # 0=Mon

                    base_temp = {
                        "CityA": 35,
                        "CityB": 30,
                        "CityC": 28,
                    }[city_info["city"]]
                    temp = np.random.normal(base_temp, 3)
                    rain = max(0, np.random.exponential(5))
                    if city_info["city"] == "CityB":
                        rain *= 1.5
                    wind = np.random.uniform(0, 25)

                    base_aqi = {
                        "CityA": 250,
                        "CityB": 150,
                        "CityC": 120,
                    }[city_info["city"]]
                    aqi = max(50, np.random.normal(base_aqi, 40))

                    traffic_index = np.clip(
                        np.random.normal(0.6 + 0.1 * (dow >= 5), 0.15), 0, 1
                    )

                    hist_disrupt_freq = {
                        "low": np.random.uniform(0.02, 0.06),
                        "medium": np.random.uniform(0.05, 0.12),
                        "high": np.random.uniform(0.1, 0.2),
                    }[worker_risk_cat]

                    env_risk = (
                        0.3 * (rain / 50)
                        + 0.3 * ((temp - 32) / 10)
                        + 0.3 * (aqi / 400)
                        + 0.1 * traffic_index
                    )

                    prob_disruption = np.clip(
                        0.05
                        + 0.4 * env_risk
                        + 0.3 * hist_disrupt_freq
                        + (0.05 if hour in [13, 14, 15] and temp > 35 else 0)
                        + (0.05 if rain > 20 else 0),
                        0,
                        0.95,
                    )
                    disruption = np.random.rand() < prob_disruption

                    avg_deliv_per_hour = np.random.uniform(1.5, 4.5)
                    earnings_per_delivery = np.random.uniform(60, 120)

                    if disruption:
                        duration_hours = np.random.uniform(1, 4)
                        demand_level = np.random.uniform(0.3, 0.8)
                        loss = (
                            avg_deliv_per_hour
                            * earnings_per_delivery
                            * duration_hours
                            * demand_level
                        )
                    else:
                        duration_hours = 0.0
                        demand_level = np.random.uniform(0.6, 1.0)
                        loss = 0.0

                    rows.append(
                        {
                            "worker_id": worker_global_id,
                            "city": city_info["city"],
                            "lat": city_info["lat"],
                            "lon": city_info["lon"],
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
                            "avg_deliveries_per_hour": avg_deliv_per_hour,
                            "earnings_per_delivery": earnings_per_delivery,
                            "predicted_disruption_duration": duration_hours,
                            "area_demand_level": demand_level,
                            "disrupted": int(disruption),
                            "income_loss": loss,
                        }
                    )
    df = pd.DataFrame(rows)
    return df


def simulate_claims(df_env: pd.DataFrame, n_claims: int = 2000) -> pd.DataFrame:
    disrupted_rows = df_env[df_env["disrupted"] == 1].sample(
        min(n_claims, len(df_env[df_env["disrupted"] == 1])), random_state=RANDOM_SEED
    )
    claims = []
    for _, row in disrupted_rows.iterrows():
        legit = np.random.rand() > 0.1  # 10% fraud rate
        if legit:
            claim_amount = row["income_loss"] * np.random.uniform(0.8, 1.1)
            fraud_label = 0
            loc_match = 1
        else:
            claim_amount = row["income_loss"] * np.random.uniform(0.2, 2.0)
            fraud_label = 1
            loc_match = np.random.choice([0, 1], p=[0.7, 0.3])

        gps_noise = np.random.normal(0, 0.01 if loc_match else 0.1)
        claims.append(
            {
                "worker_id": row["worker_id"],
                "city": row["city"],
                "claim_time": row["timestamp"],
                "claimed_amount": claim_amount,
                "gps_lat": row["lat"] + gps_noise,
                "gps_lon": row["lon"] + gps_noise,
                "disruption_lat": row["lat"],
                "disruption_lon": row["lon"],
                "loc_match": loc_match,
                "claim_frequency_30d": np.random.poisson(1 if legit else 4),
                "deliveries_last_7d": np.random.poisson(
                    7 * row["avg_deliveries_per_hour"] * 8
                ),
                "fraud_label": fraud_label,
            }
        )
    df_claims = pd.DataFrame(claims)
    return df_claims


if __name__ == "__main__":
    df_env = simulate_environment()
    df_env.to_csv(DATA_DIR / "env_data.csv", index=False)
    df_claims = simulate_claims(df_env)
    df_claims.to_csv(DATA_DIR / "claims_data.csv", index=False)
    print("Synthetic datasets saved to", DATA_DIR)

