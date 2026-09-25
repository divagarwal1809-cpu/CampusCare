import math
from typing import Dict, Any, List, Tuple
from app.models.responder import Responder
from app.models.incident import Incident

class AssignmentEngine:
    @staticmethod
    def calculate_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        # Haversine formula
        R = 6371.0 # km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2 +
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
            math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 2)

    @classmethod
    def evaluate_candidate(
        cls,
        responder: Responder,
        incident: Incident
    ) -> Dict[str, Any]:
        """
        Calculates an assignment suitability score (0-100) and produces
        explainable bullet points why this responder was evaluated this way.
        """
        reasons: List[str] = []
        is_cross_trained = False

        # 1. Skill Compatibility (40%)
        # Check primary team match vs secondary skills
        req_team = incident.required_team.lower()
        skills = [s.lower() for s in (responder.skills or [])]
        primary = responder.primary_team.lower()

        if primary == req_team:
            skill_score = 100.0
            reasons.append(f"✓ Direct primary team match ({responder.primary_team})")
        elif req_team in skills or (req_team == "medical" and "first_aid" in skills):
            skill_score = 85.0
            is_cross_trained = True
            reasons.append(f"✓ Cross-trained capability: Responder is certified in {req_team}")
        elif any(opt.lower() in skills or opt.lower() == primary for opt in (incident.optional_teams or [])):
            skill_score = 65.0
            reasons.append(f"✓ Matches incident secondary support capability")
        elif primary == "general":
            skill_score = 45.0
            reasons.append("• General responder available for perimeter and support")
        else:
            skill_score = 10.0
            reasons.append("⚠ Lacks specialized training for this incident profile")

        # 2. Distance (20%)
        dist_km = cls.calculate_distance_km(
            responder.latitude, responder.longitude,
            incident.latitude, incident.longitude
        )
        # Campus scale: <0.3 km is close, >1.5 km is farther
        if dist_km <= 0.3:
            dist_score = 100.0
        elif dist_km <= 0.8:
            dist_score = 85.0
        elif dist_km <= 1.5:
            dist_score = 65.0
        else:
            dist_score = 40.0
        
        # Calculate ETA based on avg walking/vehicle speed (15 km/h on campus = ~4 min/km)
        eta_minutes = round(max(1.0, dist_km * 3.5 + 0.5), 1)
        reasons.append(f"✓ Location: {dist_km} km away (~{eta_minutes} min ETA)")

        # 3. Workload (15%)
        # 0 assignments = 100%, 1 assignment = 50%, >= max = 0%
        if responder.current_workload <= 0:
            workload_score = 100.0
            reasons.append("✓ Zero current workload - 100% capacity available")
        elif responder.current_workload < responder.max_workload:
            workload_score = 50.0
            reasons.append(f"• Has {responder.current_workload} active assignment (below max limit {responder.max_workload})")
        else:
            workload_score = 0.0
            reasons.append(f"⚠ At maximum workload capacity ({responder.current_workload}/{responder.max_workload})")

        # 4. Availability (10%)
        if responder.is_available and responder.status in ["AVAILABLE", "ON_SCENE"]:
            avail_score = 100.0
            reasons.append(f"✓ Status: {responder.status} and ready for dispatch")
        else:
            avail_score = 15.0
            reasons.append(f"⚠ Status is currently {responder.status}")

        # 5. Response Time (10%)
        # Historical avg response time (3 min = 100, 5 min = 75, >8 min = 40)
        avg_resp = responder.avg_response_time_min or 4.0
        if avg_resp <= 3.0:
            resp_time_score = 100.0
            reasons.append(f"✓ Rapid historical response rate ({avg_resp} min)")
        elif avg_resp <= 5.0:
            resp_time_score = 80.0
        else:
            resp_time_score = 50.0

        # 6. Priority Compatibility (5%)
        # Critical incidents favor elite/available units
        if incident.priority_score >= 75.0 and skill_score >= 80.0:
            priority_score = 100.0
        else:
            priority_score = 75.0

        # Weighted calculation
        total_score = (
            (skill_score * 0.40) +
            (dist_score * 0.20) +
            (workload_score * 0.15) +
            (avail_score * 0.10) +
            (resp_time_score * 0.10) +
            (priority_score * 0.05)
        )
        total_score = round(total_score, 1)

        breakdown = {
            "skill_score": round(skill_score * 0.40, 1),
            "distance_score": round(dist_score * 0.20, 1),
            "workload_score": round(workload_score * 0.15, 1),
            "availability_score": round(avail_score * 0.10, 1),
            "response_time_score": round(resp_time_score * 0.10, 1),
            "priority_score": round(priority_score * 0.05, 1),
            "total_score": total_score
        }

        return {
            "responder_id": responder.id,
            "responder_code": responder.code,
            "responder_name": responder.name,
            "primary_team": responder.primary_team,
            "distance_km": dist_km,
            "eta_minutes": eta_minutes,
            "match_score": total_score,
            "breakdown": breakdown,
            "reasons": reasons,
            "is_cross_trained": is_cross_trained
        }
