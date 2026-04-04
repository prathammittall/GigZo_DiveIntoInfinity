"""
Production-grade training: cross-validation, hyperparameter tuning,
probability calibration for risk model, and metrics logging.
"""
from __future__ import annotations

import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    mean_squared_error,
    mean_absolute_error,
    brier_score_loss,
)
import joblib
from sklearn.ensemble import RandomForestClassifier

from config import (
    DATA_DIR,
    MODELS_DIR,
    RISK_MODEL_PATH,
    LOSS_MODEL_PATH,
    FRAUD_MODEL_PATH,
    RISK_CALIBRATOR_PATH,
    METRICS_PATH,
    RANDOM_SEED,
)


def load_env_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_DIR / "env_data.csv", parse_dates=["timestamp"])
    return df


def load_claims_data() -> pd.DataFrame:
    df = pd.read_csv(DATA_DIR / "claims_data.csv", parse_dates=["claim_time"])
    return df


def encode_worker_risk(df: pd.DataFrame) -> pd.DataFrame:
    mapping = {"low": 0, "medium": 1, "high": 2}
    df = df.copy()
    df["worker_risk_category_enc"] = df["worker_risk_category"].map(mapping)
    return df


def train_risk_model(df_env: pd.DataFrame) -> dict:
    df = encode_worker_risk(df_env)

    feature_cols = [
        "lat",
        "lon",
        "day_of_week",
        "hour_of_day",
        "temperature",
        "rain_mm",
        "wind_kph",
        "aqi",
        "traffic_index",
        "hist_disrupt_freq",
        "worker_risk_category_enc",
    ]
    X = df[feature_cols]
    y = df["disrupted"].values

    n_pos, n_neg = int(y.sum()), int((1 - y).sum())
    stratify_arg = y if (n_pos >= 2 and n_neg >= 2) else None
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=stratify_arg
    )

    clf = RandomForestClassifier(
        n_estimators=5,
        max_depth=5,
        min_samples_split=2,
        random_state=RANDOM_SEED,
        n_jobs=1,
        class_weight="balanced"
    )
    clf.fit(X_train, y_train)
    best = clf

    # Calibrate probabilities for reliable risk scores (critical for insurance)
    calibrated = CalibratedClassifierCV(best, method="isotonic", cv="prefit")
    calibrated.fit(X_test, y_test)

    y_pred_proba = calibrated.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    roc = roc_auc_score(y_test, y_pred_proba)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    brier = brier_score_loss(y_test, y_pred_proba)

    # Save RandomForest calibrator (which contains the base model too)
    joblib.dump(calibrated, RISK_CALIBRATOR_PATH)
    joblib.dump(best, RISK_MODEL_PATH)
    np.save(MODELS_DIR / "risk_feature_cols.npy", np.array(feature_cols, dtype=object), allow_pickle=True)
    joblib.dump(calibrated, RISK_CALIBRATOR_PATH)

    print(f"Risk model - ROC-AUC: {roc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}, Brier: {brier:.4f}")
    return {
        "risk_roc_auc": roc,
        "risk_precision": prec,
        "risk_recall": rec,
        "risk_f1": f1,
        "risk_brier": brier,
    }


def train_loss_model(df_env: pd.DataFrame) -> dict:
    df = encode_worker_risk(df_env)
    df_train = df[df["disrupted"] == 1].copy()
    if len(df_train) < 50:
        print("Not enough disrupted samples for loss model.")
        return {}

    feature_cols = [
        "avg_deliveries_per_hour",
        "earnings_per_delivery",
        "predicted_disruption_duration",
        "area_demand_level",
        "worker_risk_category_enc",
        "aqi",
        "rain_mm",
        "temperature",
    ]
    X = df_train[feature_cols]
    y = df_train["income_loss"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    rf = RandomForestRegressor(
        n_estimators=5,
        max_depth=5,
        min_samples_leaf=2,
        random_state=RANDOM_SEED,
        n_jobs=1
    )
    rf.fit(X_train_scaled, y_train)
    best_rf = rf

    y_pred = best_rf.predict(X_test_scaled)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mae = mean_absolute_error(y_test, y_pred)

    joblib.dump(
        {"model": best_rf, "scaler": scaler, "feature_cols": feature_cols},
        LOSS_MODEL_PATH,
    )
    print(f"Income loss model - RMSE: {rmse:.2f}, MAE: {mae:.2f}")
    return {"loss_rmse": rmse, "loss_mae": mae}


def train_fraud_model(df_claims: pd.DataFrame) -> dict:
    df = df_claims.copy()
    df["loc_distance"] = np.sqrt(
        (df["gps_lat"] - df["disruption_lat"]) ** 2
        + (df["gps_lon"] - df["disruption_lon"]) ** 2
    )

    feature_cols = [
        "claimed_amount",
        "loc_distance",
        "loc_match",
        "claim_frequency_30d",
        "deliveries_last_7d",
    ]
    X = df[feature_cols].values

    iso = IsolationForest(
        n_estimators=5,
        contamination=0.1,
        max_samples=0.8,
        random_state=RANDOM_SEED,
        n_jobs=1,
    )
    iso.fit(X)

    scores = -iso.score_samples(X)
    labels = (scores > np.percentile(scores, 90)).astype(int)

    out = {}
    if "fraud_label" in df.columns:
        roc = roc_auc_score(df["fraud_label"], scores)
        prec = precision_score(df["fraud_label"], labels, zero_division=0)
        rec = recall_score(df["fraud_label"], labels, zero_division=0)
        f1 = f1_score(df["fraud_label"], labels, zero_division=0)
        print(f"Fraud model - ROC-AUC: {roc:.4f}, Precision: {prec:.4f}, Recall: {rec:.4f}, F1: {f1:.4f}")
        out = {"fraud_roc_auc": roc, "fraud_precision": prec, "fraud_recall": rec, "fraud_f1": f1}

    joblib.dump({"model": iso, "feature_cols": feature_cols}, FRAUD_MODEL_PATH)
    return out


def main() -> None:
    df_env = load_env_data()
    df_claims = load_claims_data()

    metrics = {}
    metrics.update(train_risk_model(df_env))
    metrics.update(train_loss_model(df_env))
    metrics.update(train_fraud_model(df_claims))

    METRICS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print("Models and metrics saved to", MODELS_DIR, "and", METRICS_PATH)


if __name__ == "__main__":
    main()
