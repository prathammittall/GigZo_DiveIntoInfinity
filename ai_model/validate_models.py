"""
Validate model accuracy: load test set, run predictions, report metrics.
Optionally fetch live weather/AQI and run risk prediction to verify real-world consistency.
"""
from __future__ import annotations

import json
import numpy as np
import pandas as pd
from pathlib import Path

from config import DATA_DIR, MODELS_DIR, METRICS_PATH, REAL_CITIES
from sklearn.metrics import (
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    mean_squared_error,
    mean_absolute_error,
    brier_score_loss,
)


def load_metrics() -> dict:
    if not METRICS_PATH.exists():
        return {}
    with open(METRICS_PATH) as f:
        return json.load(f)


def validate_risk(df: pd.DataFrame, feature_cols: list, _predictor=None) -> dict:
    from train_models import encode_worker_risk
    from models_service import RiskModelService

    df = encode_worker_risk(df)
    y = df["disrupted"].values
    svc = RiskModelService()
    proba = np.array([
        svc.predict_risk({
            "lat": r["lat"], "lon": r["lon"], "day_of_week": int(r["day_of_week"]),
            "hour_of_day": int(r["hour_of_day"]), "temperature": float(r["temperature"]),
            "rain_mm": float(r["rain_mm"]), "wind_kph": float(r["wind_kph"]),
            "aqi": float(r["aqi"]), "traffic_index": float(r["traffic_index"]),
            "hist_disrupt_freq": float(r["hist_disrupt_freq"]),
            "worker_risk_category": ["low", "medium", "high"][int(r["worker_risk_category_enc"])],
        })
        for _, r in df.iterrows()
    ])
    pred = (proba >= 0.5).astype(int)
    return {
        "roc_auc": roc_auc_score(y, proba),
        "precision": precision_score(y, pred, zero_division=0),
        "recall": recall_score(y, pred, zero_division=0),
        "f1": f1_score(y, pred, zero_division=0),
        "brier": brier_score_loss(y, proba),
    }


def validate_loss(df: pd.DataFrame, feature_cols: list, _predictor=None) -> dict:
    from train_models import encode_worker_risk
    from models_service import LossModelService

    df = encode_worker_risk(df)
    disrupted = df[df["disrupted"] == 1]
    if len(disrupted) < 20:
        return {}
    disrupted = disrupted.sample(min(500, len(disrupted)), random_state=42) if len(disrupted) > 500 else disrupted
    svc = LossModelService()
    y_true = disrupted["income_loss"].values
    y_pred = []
    for _, r in disrupted.iterrows():
        row = {
            "avg_deliveries_per_hour": r["avg_deliveries_per_hour"],
            "earnings_per_delivery": r["earnings_per_delivery"],
            "predicted_disruption_duration": r["predicted_disruption_duration"],
            "area_demand_level": r["area_demand_level"],
            "worker_risk_category": ["low", "medium", "high"][int(r["worker_risk_category_enc"])],
            "aqi": r["aqi"], "rain_mm": r["rain_mm"], "temperature": r["temperature"],
        }
        y_pred.append(svc.predict_loss(row))
    y_pred = np.array(y_pred)
    return {
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "mae": float(mean_absolute_error(y_true, y_pred)),
    }


def validate_fraud(df_claims: pd.DataFrame) -> dict:
    from models_service import FraudModelService
    svc = FraudModelService()
    if "fraud_label" not in df_claims.columns:
        return {}
    scores = []
    for _, r in df_claims.iterrows():
        scores.append(svc.fraud_score({
            "claimed_amount": r["claimed_amount"],
            "gps_lat": r["gps_lat"], "gps_lon": r["gps_lon"],
            "disruption_lat": r["disruption_lat"], "disruption_lon": r["disruption_lon"],
            "loc_match": bool(r["loc_match"]),
            "claim_frequency_30d": int(r["claim_frequency_30d"]),
            "deliveries_last_7d": int(r["deliveries_last_7d"]),
        }))
    scores = np.array(scores)
    labels = (scores > np.percentile(scores, 90)).astype(int)
    y = df_claims["fraud_label"].values
    return {
        "roc_auc": roc_auc_score(y, scores),
        "precision": precision_score(y, labels, zero_division=0),
        "recall": recall_score(y, labels, zero_division=0),
        "f1": f1_score(y, labels, zero_division=0),
    }


def run_validation() -> dict:
    env_path = DATA_DIR / "env_data.csv"
    claims_path = DATA_DIR / "claims_data.csv"
    if not env_path.exists() or not claims_path.exists():
        print("Missing env_data.csv or claims_data.csv. Run data_simulation.py and train_models.py first.")
        return {}

    df_env = pd.read_csv(env_path, parse_dates=["timestamp"])
    df_claims = pd.read_csv(claims_path, parse_dates=["claim_time"])

    # Use last 20% as hold-out; cap size for speed
    n = len(df_env)
    test_df = df_env.iloc[int(0.8 * n):].copy()
    if len(test_df) > 2000:
        test_df = test_df.sample(2000, random_state=42)
    feature_cols = list(np.load(MODELS_DIR / "risk_feature_cols.npy", allow_pickle=True))

    results = {}
    try:
        results["risk"] = validate_risk(test_df, feature_cols, None)
        print("Risk (hold-out):", results["risk"])
    except Exception as e:
        print("Risk validation error:", e)
        results["risk"] = {}

    try:
        results["loss"] = validate_loss(test_df, feature_cols, None)
        print("Loss (hold-out):", results["loss"])
    except Exception as e:
        print("Loss validation error:", e)
        results["loss"] = {}

    try:
        results["fraud"] = validate_fraud(df_claims)
        print("Fraud:", results["fraud"])
    except Exception as e:
        print("Fraud validation error:", e)
        results["fraud"] = {}

    return results


def run_live_check() -> None:
    """Fetch live weather/AQI for REAL_CITIES and run risk prediction."""
    from data_fetchers import fetch_live_snapshot
    from models_service import RiskModelService

    svc = RiskModelService()
    print("Live risk check (real-world data):")
    for city_info in REAL_CITIES[:3]:
        try:
            snap = fetch_live_snapshot(city_info)
            risk = svc.predict_risk({
                "lat": snap["lat"], "lon": snap["lon"],
                "city": snap["city"],
                "day_of_week": 2, "hour_of_day": 12,
                "temperature": snap["temperature"],
                "rain_mm": snap["rain_mm"], "wind_kph": snap["wind_kph"],
                "aqi": snap["aqi"], "traffic_index": 0.6,
                "hist_disrupt_freq": 0.08, "worker_risk_category": "medium",
            })
            print(f"  {snap['city']}: temp={snap['temperature']:.1f}°C, rain={snap['rain_mm']:.1f}mm, AQI={snap['aqi']:.0f} -> risk={risk:.3f}")
        except Exception as e:
            print(f"  {city_info.get('city', '?')}: error - {e}")


if __name__ == "__main__":
    print("=== Training metrics (from last train) ===")
    print(json.dumps(load_metrics(), indent=2))
    print("\n=== Hold-out validation ===")
    run_validation()
    print("\n=== Live API check ===")
    run_live_check()
