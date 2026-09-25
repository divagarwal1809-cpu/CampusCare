from typing import Tuple, Dict, Any
from app.config import settings

# Category baseline weights (0 - 100)
CATEGORY_WEIGHTS: Dict[str, float] = {
    "Fire": 100.0,
    "Hazmat": 95.0,
    "Medical": 85.0,
    "Security": 80.0,
    "Technical": 55.0,
    "General": 40.0
}

# Location risk baseline (0 - 100)
LOCATION_RISKS: Dict[str, float] = {
    "Chemical Lab": 100.0,
    "Hostel Zone": 85.0,
    "Auditorium": 80.0,
    "Library": 75.0,
    "Block C Science Lab": 90.0,
    "Main Gate": 65.0,
    "Dining Hall": 70.0,
    "Sports Complex": 45.0,
    "Admin Building": 50.0,
    "Tech Park": 60.0
}

class PriorityEngine:
    @staticmethod
    def calculate_priority(
        category: str,
        severity: int, # 1 - 5
        people_affected: int,
        location_name: str,
        smoke_spreading: bool = False,
        trapped_persons: bool = False,
        hazard_leak: bool = False,
        delayed_minutes: int = 0
    ) -> Tuple[float, str, Dict[str, float]]:
        """
        Calculates 0-100 priority score using deterministic weighted formula:
        Severity: 30%
        People affected: 20%
        Category: 20%
        Location risk: 10%
        Time sensitivity: 10%
        Escalation indicators: 10%
        """
        # 1. Severity (1-5 mapped to 20-100)
        severity_score = min(100.0, max(0.0, severity * 20.0))

        # 2. People affected (0=0, 1=20, 5=50, 10=80, 20+=100)
        if people_affected <= 0:
            people_score = 10.0
        elif people_affected == 1:
            people_score = 30.0
        elif people_affected <= 5:
            people_score = 55.0
        elif people_affected <= 15:
            people_score = 80.0
        else:
            people_score = 100.0

        # 3. Category weight
        cat_score = CATEGORY_WEIGHTS.get(category, 50.0)

        # 4. Location risk
        loc_score = 50.0
        for loc_key, val in LOCATION_RISKS.items():
            if loc_key.lower() in location_name.lower():
                loc_score = val
                break

        # 5. Time sensitivity (escalates with delay and active hazards)
        base_time = 40.0
        if category in ["Fire", "Medical"]:
            base_time = 75.0
        time_score = min(100.0, base_time + (delayed_minutes * 2.5))

        # 6. Escalation indicators
        escalation_score = 10.0
        if smoke_spreading:
            escalation_score += 35.0
        if trapped_persons:
            escalation_score += 45.0
        if hazard_leak:
            escalation_score += 35.0
        if delayed_minutes > 5:
            escalation_score += 20.0
        escalation_score = min(100.0, escalation_score)

        # Weighted calculation
        total_score = (
            (severity_score * settings.WEIGHT_SEVERITY) +
            (people_score * settings.WEIGHT_PEOPLE_AFFECTED) +
            (cat_score * settings.WEIGHT_CATEGORY) +
            (loc_score * settings.WEIGHT_LOCATION_RISK) +
            (time_score * settings.WEIGHT_TIME_SENSITIVITY) +
            (escalation_score * settings.WEIGHT_ESCALATION)
        )
        total_score = round(min(100.0, max(0.0, total_score)), 1)

        # Classification thresholds
        if total_score >= 75.0:
            level = "CRITICAL"
        elif total_score >= 50.0:
            level = "HIGH"
        elif total_score >= 25.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        priority_scale_10 = max(1, min(10, int(round(total_score / 10.0)))) if total_score > 0 else 1

        breakdown = {
            "severity_component": round(severity_score * settings.WEIGHT_SEVERITY, 1),
            "people_component": round(people_score * settings.WEIGHT_PEOPLE_AFFECTED, 1),
            "category_component": round(cat_score * settings.WEIGHT_CATEGORY, 1),
            "location_component": round(loc_score * settings.WEIGHT_LOCATION_RISK, 1),
            "time_component": round(time_score * settings.WEIGHT_TIME_SENSITIVITY, 1),
            "escalation_component": round(escalation_score * settings.WEIGHT_ESCALATION, 1),
            "raw_total": total_score,
            "priority_scale_10": priority_scale_10
        }

        return total_score, level, breakdown

    @staticmethod
    def get_scale_10(total_score: float) -> int:
        return max(1, min(10, int(round(total_score / 10.0)))) if total_score > 0 else 1

    @staticmethod
    def get_sla_target(level: str) -> int:
        if level == "CRITICAL":
            return settings.SLA_CRITICAL_MIN
        elif level == "HIGH":
            return settings.SLA_HIGH_MIN
        elif level == "MEDIUM":
            return settings.SLA_MEDIUM_MIN
        else:
            return settings.SLA_LOW_MIN
