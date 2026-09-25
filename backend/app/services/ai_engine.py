from typing import List, Dict, Any
from app.models.incident import Incident
from app.models.responder import Responder

class AIEngine:
    @staticmethod
    def generate_incident_summary(raw_text: str, category: str, location: str) -> str:
        """
        Synthesizes unstructured user reporting text into standard EOC operational language.
        Deterministic NLP transformation with structured entity normalization.
        """
        text_lower = raw_text.lower()
        if "unresponsive" in text_lower or "fell" in text_lower or "fainted" in text_lower or "bleed" in text_lower or "heart" in text_lower:
            return f"Reported urgent medical emergency involving an unresponsive or injured casualty in the vicinity of {location}. Urgent triage requested."
        elif "smoke" in text_lower or "flame" in text_lower or "fire" in text_lower or "spark" in text_lower:
            return f"Confirmed active fire/smoke manifestation at {location}. Structural hazard potential flagged; perimeter evacuation advisory initiated."
        elif "trespass" in text_lower or "intruder" in text_lower or "fight" in text_lower or "weapon" in text_lower or "theft" in text_lower:
            return f"Security altercation / unauthorized breach detected at {location}. Dispatching security containment and monitoring access portals."
        elif "leak" in text_lower or "chemical" in text_lower or "fume" in text_lower or "odor" in text_lower:
            return f"Hazardous material / airborne contaminant advisory at {location}. Upwind safety corridor protocol activated."
        else:
            cleaned = raw_text.strip().replace("\n", " ")
            return f"Operational event at {location}: {cleaned[:150]}"

    @staticmethod
    def generate_situation_briefing(
        active_incidents: List[Incident],
        responders: List[Responder],
        pressure: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates executive EOC situation summary and command briefing.
        """
        crit_count = sum(1 for i in active_incidents if i.priority_score >= 75)
        high_count = sum(1 for i in active_incidents if 50 <= i.priority_score < 75)
        med_count = sum(1 for i in active_incidents if i.priority_score < 50)
        
        avail_resp = sum(1 for r in responders if r.is_available)
        deployed_resp = sum(1 for r in responders if not r.is_available or r.current_workload > 0)

        # Build dynamic command narrative
        lines = []
        if crit_count > 0:
            lines.append(f"COMMAND BRIEFING: {crit_count} CRITICAL priority incident(s) currently active on campus, requiring executive focus.")
        else:
            lines.append("COMMAND BRIEFING: Campus operations stable. Zero active critical-tier emergencies.")

        # Resource status highlights
        exhausted_teams = [team for team, stat in pressure.items() if stat.get("is_critical") and stat.get("used", 0) > 0]
        if exhausted_teams:
            lines.append(f"RESOURCE ALERT: {', '.join(exhausted_teams)} unit capacity is fully saturated (100% utilization). Cross-training and reallocation protocols in effect.")
        else:
            lines.append(f"RESOURCE ADEQUACY: Dedicated units available across primary responder teams ({avail_resp} units ready).")

        return {
            "headline": f"{crit_count} Critical, {high_count} High Urgency Incident(s) Active",
            "summary_paragraph": " ".join(lines),
            "command_recommendations": [
                "Maintain staging lane clearance at Campus Main Gate for rapid mutual aid access.",
                "Review CCTV corridors for potential secondary crowd migrations.",
                "Verify SLA timer compliance on highest priority active queues."
            ],
            "metrics_glance": {
                "critical": crit_count,
                "high": high_count,
                "medium": med_count,
                "responders_available": avail_resp,
                "responders_deployed": deployed_resp
            }
        }
