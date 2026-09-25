from typing import List, Dict, Any
from app.models.incident import Incident

class RecommendationEngine:
    @staticmethod
    def get_operational_sop(incident: Incident) -> Dict[str, Any]:
        """
        Generates deterministic Standard Operating Procedure (SOP) recommendations,
        cordon zones, and action checklists.
        """
        category = incident.category
        sev = incident.severity
        score = incident.priority_score

        checklist = []
        cordon_radius_meters = 50
        evacuation_recommended = False
        public_broadcast = ""

        if category == "Fire":
            cordon_radius_meters = 150 if incident.smoke_spreading else 80
            evacuation_recommended = sev >= 3 or incident.smoke_spreading
            checklist = [
                "Verify automated HVAC exhaust ventilation is active in " + incident.location_name,
                "Isolate electrical risers to building wing",
                "Deploy Fire Team with SCBA and thermal imaging",
                "Establish triage staging at safe perimeter outside building entrance",
                "Coordinate with campus facility team for hydrant water pressure"
            ]
            public_broadcast = f"ALERT: Active Fire Incident reported at {incident.location_name}. Please evacuate the area immediately via marked emergency exits."

        elif category == "Medical":
            cordon_radius_meters = 30
            evacuation_recommended = False
            checklist = [
                "Dispatch nearest Medical Unit with AED and oxygen kit",
                "Instruct reporter to keep patient still and monitor airway/breathing",
                "Clear elevator and lobby corridors for gurney access",
                "Prepare city ambulance handover gate if priority > 85",
                "Notify campus health clinic physician on duty"
            ]
            public_broadcast = f"Medical response in progress at {incident.location_name}. Please keep hallways and access doors clear."

        elif category == "Security":
            cordon_radius_meters = 120 if sev >= 4 else 60
            evacuation_recommended = sev >= 4
            checklist = [
                "Deploy Security Team with tactical communication and perimeter control",
                "Review live CCTV feeds covering " + incident.location_name,
                "Lock down perimeter card-access portals if intruder suspected",
                "Interview on-scene witnesses and secure evidence",
                "Stand by for external police dispatch if armed or violent threat"
            ]
            public_broadcast = f"Security Advisory: Controlled access in effect near {incident.location_name}. Avoid the sector until further notice."

        elif category == "Hazmat":
            cordon_radius_meters = 300
            evacuation_recommended = True
            checklist = [
                "Establish 300m upwind safety perimeter",
                "Direct all occupants to evacuate upwind immediately",
                "Dispatch HAZMAT containment team with chemical respirators",
                "Shut down air intake vents for all connected academic blocks",
                "Immediately notify Municipal Fire & HAZMAT authorities (Level 4)"
            ]
            public_broadcast = f"CRITICAL HAZMAT ADVISORY: Hazardous vapor leak at {incident.location_name}. Evacuate UPWIND immediately!"

        else: # Technical / General
            cordon_radius_meters = 40
            checklist = [
                "Dispatch Facilities/Technical engineering team",
                "Isolate affected breaker / machinery",
                "Place physical safety cones and signage",
                "Assess impact on critical campus services"
            ]
            public_broadcast = f"Facilities Maintenance notice: Temporary outage near {incident.location_name}."

        return {
            "cordon_radius_meters": cordon_radius_meters,
            "evacuation_recommended": evacuation_recommended,
            "public_broadcast_template": public_broadcast,
            "dispatcher_sop_checklist": checklist,
            "containment_priority": "IMMEDIATE" if score >= 75 else "STANDARD"
        }
