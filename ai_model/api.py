import asyncio
import os

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional

from bootstrap import ensure_ready
from models_service import RiskModelService, LossModelService, FraudModelService, PremiumEngine
from trigger_engine import ParametricTriggerEngine
from config import BASE_DIR


app = FastAPI(title="GigZo AI — Parametric Insurance Engine")

# ── CORS ── allow direct calls from the mobile app (Expo / devtunnel / web)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

auto_generate = os.environ.get("AUTO_GENERATE_DATA", "0") == "1"
auto_train = os.environ.get("AUTO_TRAIN_MODELS", "0") == "1"

try:
    ensure_ready(auto_generate=auto_generate, auto_train=auto_train)
except Exception as e:
    import traceback
    traceback.print_exc()

risk_service = None
loss_service = None
fraud_service = None
premium_engine = PremiumEngine()
trigger_engine = ParametricTriggerEngine()

def _ensure_models():
    global risk_service, loss_service, fraud_service
    if risk_service is not None and loss_service is not None and fraud_service is not None:
        return
    try:
        from models_service import RiskModelService, LossModelService, FraudModelService
        risk_service = RiskModelService()
        loss_service = LossModelService()
        fraud_service = FraudModelService()
    except FileNotFoundError as e:
        raise RuntimeError("Models not loaded. Run: python train_models.py") from e


@app.on_event("startup")
def _warm_start_models() -> None:
    """Preload models once at startup to avoid per-request initialization overhead."""
    eager_load_models = os.environ.get("EAGER_LOAD_MODELS", "1") == "1"
    if eager_load_models:
        _ensure_models()


class RiskRequest(BaseModel):
    lat: float
    lon: float
    city: str
    day_of_week: int = Field(ge=0, le=6)
    hour_of_day: int = Field(ge=0, le=23)
    temperature: float
    rain_mm: float
    wind_kph: float
    aqi: float
    traffic_index: float = Field(ge=0, le=1)
    hist_disrupt_freq: float = Field(ge=0)
    worker_risk_category: str


class RiskResponse(BaseModel):
    risk_score: float


class PremiumRequest(BaseModel):
    risk_score: float
    weather_volatility: float = Field(ge=0, le=1)
    pollution_level: float
    hist_disrupt_freq: float
    worker_risk_category: str


class PremiumResponse(BaseModel):
    weekly_premium: float


class LossRequest(BaseModel):
    avg_deliveries_per_hour: float
    earnings_per_delivery: float
    predicted_disruption_duration: float
    area_demand_level: float
    worker_risk_category: str
    aqi: Optional[float] = None
    rain_mm: Optional[float] = None
    temperature: Optional[float] = None


class LossResponse(BaseModel):
    estimated_loss: float


class FraudRequest(BaseModel):
    claimed_amount: float
    gps_lat: float
    gps_lon: float
    disruption_lat: float
    disruption_lon: float
    loc_match: bool
    claimed_altitude: Optional[float] = None
    claim_frequency_30d: int
    deliveries_last_7d: int


class FraudResponse(BaseModel):
    fraud_probability: float


class TriggerRequest(BaseModel):
    worker_lat: float
    worker_lon: float
    zone_lat: float
    zone_lon: float
    env_rain_mm: float
    env_aqi: float
    curfew: bool = False
    severe_weather_alert: bool = False
    avg_deliveries_per_hour: float
    earnings_per_delivery: float
    predicted_disruption_duration: float
    area_demand_level: float
    worker_risk_category: str
    aqi: Optional[float] = None
    rain_mm: Optional[float] = None
    temperature: Optional[float] = None


class TriggerResponse(BaseModel):
    triggered: bool
    conditions: List[str]
    location_verified: bool
    estimated_loss: float
    payout_amount: float


def _req_dict(m):
    return m.model_dump() if hasattr(m, "model_dump") else m.dict()


@app.get("/live-weather", include_in_schema=True)
async def live_weather(lat: float, lon: float):
    """Fetch real-world weather and AQI for given coordinates concurrently."""
    from data_fetchers import get_weather, get_aqi
    try:
        loop = asyncio.get_event_loop()
        w, aqi = await asyncio.gather(
            loop.run_in_executor(None, lambda: get_weather(lat, lon, date=None)),
            loop.run_in_executor(None, lambda: get_aqi(lat, lon)),
        )
        return {"temperature": w["temperature"], "rain_mm": w["rain_mm"], "wind_kph": w["wind_kph"], "aqi": aqi}
    except Exception as e:
        return {"error": str(e), "temperature": 25.0, "rain_mm": 0.0, "wind_kph": 10.0, "aqi": 100.0}


@app.get("/search-cities", include_in_schema=True)
def search_cities(q: str):
    """Search for cities in India."""
    try:
        from data_fetchers import search_indian_cities
        results = search_indian_cities(q)
        return {"results": results}
    except Exception as e:
        return {"error": str(e), "results": []}


@app.get("/earthquakes-live", include_in_schema=True)
def get_earthquakes():
    """Fetch recent significant earthquakes."""
    try:
        from data_fetchers import fetch_latest_earthquakes
        quakes = fetch_latest_earthquakes()
        return {"earthquakes": quakes[:10]}
    except Exception as e:
        return {"error": str(e), "earthquakes": []}


@app.get("/metrics", include_in_schema=True)
def get_metrics():
    """Return last training metrics (ROC-AUC, RMSE, etc.) for accuracy monitoring."""
    import json
    from config import METRICS_PATH
    if not METRICS_PATH.exists():
        return {}
    with open(METRICS_PATH) as f:
        return json.load(f)


@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(req: RiskRequest) -> RiskResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    risk_score = risk_service.predict_risk(_req_dict(req))
    return RiskResponse(risk_score=risk_score)


@app.post("/calculate-premium", response_model=PremiumResponse)
def calculate_premium(req: PremiumRequest) -> PremiumResponse:
    premium = premium_engine.calculate_weekly_premium(
        risk_score=req.risk_score,
        weather_volatility=req.weather_volatility,
        pollution_level=req.pollution_level,
        hist_disrupt_freq=req.hist_disrupt_freq,
        worker_risk_category=req.worker_risk_category,
    )
    return PremiumResponse(weekly_premium=premium)


@app.post("/estimate-loss", response_model=LossResponse)
def estimate_loss(req: LossRequest) -> LossResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    loss = loss_service.predict_loss(_req_dict(req))
    return LossResponse(estimated_loss=loss)


@app.post("/fraud-check", response_model=FraudResponse)
def fraud_check(req: FraudRequest) -> FraudResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    prob = fraud_service.fraud_score(_req_dict(req))
    return FraudResponse(fraud_probability=prob)


@app.post("/trigger-payout", response_model=TriggerResponse)
def trigger_payout(req: TriggerRequest) -> TriggerResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    env = {
        "rain_mm": req.env_rain_mm,
        "aqi": req.env_aqi,
        "curfew": req.curfew,
        "severe_weather_alert": req.severe_weather_alert,
        # Default earthquake and health to false for weather triggers
        "earthquake_magnitude": 0.0,
        "health_emergency": False,
    }
    trig = trigger_engine.check_triggers(env)
    loc_ok = trigger_engine.verify_worker_location(
        req.worker_lat, req.worker_lon, req.zone_lat, req.zone_lon
    )

    loss_payload = {
        "avg_deliveries_per_hour": req.avg_deliveries_per_hour,
        "earnings_per_delivery": req.earnings_per_delivery,
        "predicted_disruption_duration": req.predicted_disruption_duration,
        "area_demand_level": req.area_demand_level,
        "worker_risk_category": req.worker_risk_category,
        "aqi": req.aqi or req.env_aqi,
        "rain_mm": req.rain_mm or req.env_rain_mm,
        "temperature": req.temperature or 30.0,
    }
    est_loss = (
        loss_service.predict_loss(loss_payload)
        if trig["is_triggered"] and loc_ok
        else 0.0
    )
    payout = trigger_engine.estimate_payout(est_loss) if est_loss > 0 else 0.0

    return TriggerResponse(
        triggered=trig["is_triggered"],
        conditions=trig["conditions"],
        location_verified=loc_ok,
        estimated_loss=est_loss,
        payout_amount=payout,
    )


class HealthAccidentRequest(BaseModel):
    worker_lat: float
    worker_lon: float
    condition_details: str
    verified_hospital_code: Optional[str] = None
    avg_deliveries_per_hour: float = 3.0
    earnings_per_delivery: float = 80.0
    worker_risk_category: str = "medium"


@app.post("/trigger-health-accident", response_model=TriggerResponse)
def trigger_health_accident(req: HealthAccidentRequest) -> TriggerResponse:
    try:
        _ensure_models()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    
    # Simple hardcoded mock verification for hospital codes
    is_verified = bool(req.verified_hospital_code and req.verified_hospital_code.startswith("HOSP-"))
    
    env = {
        "health_emergency": True,
        "earthquake_magnitude": 0.0,
        "rain_mm": 0.0,
        "aqi": 0.0,
        "curfew": False,
        "severe_weather_alert": False,
    }
    trig = trigger_engine.check_triggers(env)
    
    # Assume loss is standard 2 days of income (16 hours)
    loss_payload = {
        "avg_deliveries_per_hour": req.avg_deliveries_per_hour,
        "earnings_per_delivery": req.earnings_per_delivery,
        "predicted_disruption_duration": 16.0,
        "area_demand_level": 0.5,
        "worker_risk_category": req.worker_risk_category,
        "aqi": 100.0,
        "rain_mm": 0.0,
        "temperature": 25.0,
    }
    
    est_loss = loss_service.predict_loss(loss_payload) if is_verified else 0.0
    payout = trigger_engine.estimate_payout(est_loss, coverage_ratio=1.0) if is_verified else 0.0
    
    return TriggerResponse(
        triggered=trig["is_triggered"] and is_verified,
        conditions=trig["conditions"] if is_verified else ["unverified_hospital"],
        location_verified=True, # no specific zone to be in
        estimated_loss=est_loss,
        payout_amount=payout,
    )


# Static frontend (only mounted if the directory exists)
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/", include_in_schema=False)
def root():
    index = static_dir / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return JSONResponse({"status": "GigZo AI model is running", "docs": "/docs"})


@app.get("/health", include_in_schema=True)
def health():
    """Health check — used by the mobile app to verify connectivity."""
    return {"status": "ok", "service": "gigzo-ai"}


# To run:
#   uvicorn api:app --reload
