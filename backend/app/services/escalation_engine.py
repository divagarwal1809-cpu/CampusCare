from datetime import datetime
from typing import Dict, Any, Tuple
from app.models.incident import Incident

class EscalationEngine:
    @staticmethod
    def calculate_sla_status(incident: Incident) -> Dict[str, Any]:
        """
        Calculates elapsed time vs target SLA in minutes and seconds,
        percentage elapsed, and breach status.
        """
        now = datetime.utcnow()
        created_time = incident.created_at or now
        elapsed_seconds = int((now - created_time).total_seconds())
        # Account for dynamic delay minutes
        elapsed_seconds += incident.delayed_minutes * 60
        
        target_minutes = incident.sla_target_minutes or 15
        target_seconds = target_minutes * 60

        percent = round(min(150.0, (elapsed_seconds / target_seconds) * 100.0), 1) if target_seconds > 0 else 100.0
        is_breached = elapsed_seconds > target_seconds
        
        elapsed_min = elapsed_seconds // 60
        elapsed_sec = elapsed_seconds % 60
        
        formatted_elapsed = f"{elapsed_min}m {elapsed_sec}s"
        formatted_target = f"{target_minutes}m 00s"

        return {
            "elapsed_seconds": elapsed_seconds,
            "target_seconds": target_seconds,
            "formatted_elapsed": formatted_elapsed,
            "formatted_target": formatted_target,
            "percent": percent,
            "is_breached": is_breached,
            "status_text": "⚠ RESPONSE TARGET EXCEEDED" if is_breached else f"{int(percent)}% SLA elapsed"
        }

    @staticmethod
    def evaluate_escalation_level(incident: Incident, has_free_responders: bool = True) -> Tuple[int, str, str]:
        """
        Evaluates escalation level 1-4 and justification.
        """
        # Level 4: External Emergency Services
        if incident.priority_score >= 90.0 or incident.people_affected >= 15 or incident.hazard_leak:
            return 4, "LEVEL 4: External Emergency Services", "Critical mass incident or hazardous emergency exceeding campus containment."
        
        # Level 3: Campus Emergency Coordination
        if incident.priority_score >= 75.0 or not has_free_responders or incident.smoke_spreading or incident.trapped_persons:
            return 3, "LEVEL 3: Campus Emergency Coordination", "High-severity event or critical resource exhaustion requiring EOC commander control."

        # Level 2: Supervisor Notification
        if incident.priority_score >= 50.0 or incident.delayed_minutes > 5:
            return 2, "LEVEL 2: Supervisor Notification", "Elevated incident requiring watch commander situational awareness."

        # Level 1: Normal Response
        return 1, "LEVEL 1: Normal Campus Response", "Standard local response operating within baseline campus protocols."
