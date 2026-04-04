from dataclasses import dataclass
from typing import Dict, Any, List, Optional


@dataclass
class TriggerThresholds:
    rain_mm: float = 50.0
    aqi: float = 350.0
    severe_weather_alert: bool = False
    curfew_active: bool = False
    earthquake_magnitude: float = 5.0
    health_emergency: bool = False


class ParametricTriggerEngine:
    def __init__(self, thresholds: Optional[TriggerThresholds] = None) -> None:
        self.thresholds = thresholds or TriggerThresholds()

    def check_triggers(self, env: Dict[str, Any]) -> Dict[str, Any]:
        triggered_conditions: List[str] = []

        if env.get("rain_mm", 0.0) >= self.thresholds.rain_mm:
            triggered_conditions.append("heavy_rain")

        if env.get("aqi", 0.0) >= self.thresholds.aqi:
            triggered_conditions.append("hazardous_aqi")

        if env.get("curfew", False) or self.thresholds.curfew_active:
            triggered_conditions.append("curfew")

        if env.get("severe_weather_alert", False) or self.thresholds.severe_weather_alert:
            triggered_conditions.append("severe_weather_alert")

        if env.get("earthquake_magnitude", 0.0) >= self.thresholds.earthquake_magnitude:
            triggered_conditions.append("earthquake")

        if env.get("health_emergency", False) or self.thresholds.health_emergency:
            triggered_conditions.append("health_accident_emergency")

        is_triggered = bool(triggered_conditions)
        return {
            "is_triggered": is_triggered,
            "conditions": triggered_conditions,
        }

    @staticmethod
    def verify_worker_location(
        worker_lat: float,
        worker_lon: float,
        zone_lat: float,
        zone_lon: float,
        max_distance_deg: float = 0.05,
    ) -> bool:
        distance = ((worker_lat - zone_lat) ** 2 + (worker_lon - zone_lon) ** 2) ** 0.5
        return distance <= max_distance_deg

    @staticmethod
    def estimate_payout(estimated_loss: float, coverage_ratio: float = 0.8) -> float:
        return float(round(estimated_loss * coverage_ratio, 2))

