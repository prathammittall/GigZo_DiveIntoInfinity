import os
import pathlib

# Load env before reading keys (optional)
try:
    from dotenv import load_dotenv
    load_dotenv(pathlib.Path(__file__).parent / ".env")
except ImportError:
    pass

BASE_DIR = pathlib.Path(__file__).parent

DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
METRICS_DIR = BASE_DIR / "metrics"

DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)
METRICS_DIR.mkdir(exist_ok=True)

RISK_MODEL_PATH = MODELS_DIR / "risk_xgb.json"
LOSS_MODEL_PATH = MODELS_DIR / "loss_rf.pkl"
FRAUD_MODEL_PATH = MODELS_DIR / "fraud_iforest.pkl"
RISK_CALIBRATOR_PATH = MODELS_DIR / "risk_calibrator.pkl"
METRICS_PATH = METRICS_DIR / "training_metrics.json"

# API keys (optional): set in .env for real-world data
USE_REAL_WEATHER = os.environ.get("USE_REAL_WEATHER", "1") == "1"

# Real-world city coordinates (lat, lon, name) for fetching live data
REAL_CITIES = [
    {"city": "Delhi", "lat": 28.6139, "lon": 77.2090},
    {"city": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    {"city": "Bangalore", "lat": 12.9716, "lon": 77.5946},
    {"city": "Chennai", "lat": 13.0827, "lon": 80.2707},
    {"city": "Kolkata", "lat": 22.5726, "lon": 88.3639},
]

RANDOM_SEED = 42
