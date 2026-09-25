from typing import Dict, Any, List

RESOURCE_PROFILES: Dict[str, Dict[str, Any]] = {
    "Fire": {
        "required_team": "Fire",
        "optional_teams": ["Security", "Medical"],
        "min_responders": 2,
        "equipment": [
            "CO2 / Foam Fire Extinguishers",
            "Thermal Imaging Camera",
            "SCBA Protective Gear",
            "Fire Hose Kit"
        ]
    },
    "Medical": {
        "required_team": "Medical",
        "optional_teams": ["Security"],
        "min_responders": 1,
        "equipment": [
            "Emergency First-Aid Trauma Kit",
            "Automated External Defibrillator (AED)",
            "Foldable Stretcher & Cervical Collar",
            "Portable O2 Inhalator"
        ]
    },
    "Security": {
        "required_team": "Security",
        "optional_teams": ["Medical"],
        "min_responders": 2,
        "equipment": [
            "Tactical Two-Way Radios",
            "Crowd Control Barriers",
            "High-Lumen Tactical Flashlights",
            "Body Cameras & Restraints"
        ]
    },
    "Technical": {
        "required_team": "Technical",
        "optional_teams": ["Security", "Fire"],
        "min_responders": 1,
        "equipment": [
            "Electrical Lockout/Tagout Kit",
            "High-Voltage Digital Multimeter",
            "Elevator Mechanical Key & Hoist Tool",
            "Emergency Hazard Warning Signs"
        ]
    },
    "Hazmat": {
        "required_team": "Fire",
        "optional_teams": ["Medical", "Security"],
        "min_responders": 3,
        "equipment": [
            "Chemical Spill Neutralizer Kit",
            "Level B Encapsulated Hazmat Suits",
            "Multi-Gas Hazardous Detector",
            "Emergency Decontamination Eyewash"
        ]
    },
    "General": {
        "required_team": "General",
        "optional_teams": ["Security"],
        "min_responders": 1,
        "equipment": [
            "Basic First-Aid Bag",
            "Megaphone",
            "Flashlight"
        ]
    }
}

class ResourceEngine:
    @staticmethod
    def get_resource_profile(category: str, severity: int = 3, people_affected: int = 1) -> Dict[str, Any]:
        profile = RESOURCE_PROFILES.get(category, RESOURCE_PROFILES["General"]).copy()
        
        # Scale responders if severe or mass casualties
        min_resp = profile["min_responders"]
        if severity >= 4:
            min_resp += 1
        if people_affected > 10:
            min_resp += 1
            
        profile["min_responders"] = min_resp
        return profile
