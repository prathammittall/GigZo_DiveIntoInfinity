# Parametric Insurance Platform for Gig Workers

Production-oriented AI system for parametric insurance: risk prediction, premium calculation, income loss estimation, fraud detection, and automatic parametric payouts using **real-world weather and AQI data** where possible.

## Setup

### 1. Install dependencies

```bash
cd e:\Hackathon\DevTrail\001
pip install -r requirements.txt
```

### 2. Environment Variables

- Copy `.env.example` to `.env`.
- The app uses **Open-Meteo** (free, no key) for weather and AQI.

### 3. Generate data and train models

```bash
# Synthetic data (always run first)
python data_simulation.py

# Optional: fetch real historical weather/AQI and merge into training set (set USE_REAL_WEATHER=1 in .env)
python real_data_pipeline.py

# Train all models (risk, loss, fraud) with tuning and calibration
python train_models.py
```

### 4. Validate accuracy

```bash
# Hold-out validation + live API risk check
python validate_models.py
```

### 5. Run the API and dashboard

```bash
python -m uvicorn api:app --reload
```

For Render deployment (single worker, low memory):

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
```

Recommended Render env vars:

- `AUTO_GENERATE_DATA=0`
- `AUTO_TRAIN_MODELS=0`
- `EAGER_LOAD_MODELS=1`

- Dashboard: **http://127.0.0.1:8000/**
- API docs: **http://127.0.0.1:8000/docs**
- Live weather: **GET /live-weather?lat=28.6&lon=77.2**
- Training metrics: **GET /metrics**

## What’s included

| Component | Description |
|----------|-------------|
| **Risk prediction** | XGBoost + isotonic calibration → disruption probability (0–1). Tuned via 5-fold CV. |
| **Premium calculation** | `Base_Price + Risk_Score × Multiplier` adjusted by volatility, AQI, history, worker category. |
| **Income loss** | RandomForestRegressor (tuned) on deliveries, earnings, duration, demand, weather. |
| **Fraud detection** | Isolation Forest on claim amount, location mismatch, claim frequency, deliveries. |
| **Parametric triggers** | Payout when rain ≥50mm, AQI ≥350, curfew, or severe weather alert; location verified. |
| **Real-world data** | Open-Meteo (no key). |
| **Validation** | Hold-out metrics (ROC-AUC, RMSE, MAE, Brier) + optional live weather risk check. |

## File layout

- `config.py` – Paths, `REAL_CITIES`.
- `data_fetchers.py` – Fetch weather and AQI from Open-Meteo.
- `data_simulation.py` – Synthetic environment and claims data.
- `real_data_pipeline.py` – Fetch historical weather/AQI and build/merge training data.
- `train_models.py` – Train risk (XGBoost + calibration), loss (RF), fraud (Isolation Forest); save metrics to `metrics/training_metrics.json`.
- `models_service.py` – Load models and serve predictions (uses calibrator when present).
- `trigger_engine.py` – Parametric trigger rules and payout logic.
- `validate_models.py` – Hold-out validation and live risk check.
- `api.py` – FastAPI app: `/predict-risk`, `/calculate-premium`, `/estimate-loss`, `/fraud-check`, `/trigger-payout`, `/live-weather`, `/metrics`.
- `static/index.html` – Dashboard with “Fetch live weather & AQI” and real-city presets.

## Accuracy and “billions at stake”

- **Risk**: Calibrated probabilities (Brier score), ROC-AUC, and CV tuning so premiums and reserves align with actual disruption rates.
- **Loss**: RMSE/MAE on hold-out set; tuning and scaling so payouts are accurate at scale.
- **Fraud**: Anomaly scoring and thresholds to control false positives while catching abuse.
- **Real data**: Use `.env` keys and `real_data_pipeline.py` so models see real weather/AQI; validate with `validate_models.py` and the dashboard’s live weather.
