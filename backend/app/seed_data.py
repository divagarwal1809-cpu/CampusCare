from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.incident import Incident, IncidentEvent
from app.models.responder import Responder, Assignment
from app.models.audit import AuditLog
from app.models.notification import Notification

def seed_database(db: Session, force_reset: bool = False):
    if not force_reset and db.query(Incident).count() > 0:
        print("[SEED] Database already contains records. Skipping seed.")
        return

    print("[SEED] Seeding Emergency Operations Center baseline dataset...")

    # Clear existing tables if force_reset
    if force_reset:
        db.query(Assignment).delete()
        db.query(IncidentEvent).delete()
        db.query(Incident).delete()
        db.query(Responder).delete()
        db.query(AuditLog).delete()
        db.query(Notification).delete()
        db.commit()

    # 1. Responders
    # Medical Teams: 2, Security Teams: 2, Fire Team: 1, General: 2, Team D (Cross-trained), Team E (Technical)
    responders_data = [
        {
            "id": 1,
            "code": "MED-1",
            "name": "Medical Team 1 (Paramedic Alpha)",
            "primary_team": "Medical",
            "skills": ["medical", "first_aid", "triage"],
            "latitude": 12.9720,
            "longitude": 77.5940,
            "location_label": "Campus Health Center",
            "status": "ASSIGNED",
            "is_available": False,
            "current_workload": 1,
            "max_workload": 2,
            "shift": "Night Shift",
            "avg_response_time_min": 2.4
        },
        {
            "id": 2,
            "code": "MED-2",
            "name": "Medical Team 2 (Paramedic Bravo)",
            "primary_team": "Medical",
            "skills": ["medical", "first_aid", "trauma"],
            "latitude": 12.9732,
            "longitude": 77.5955,
            "location_label": "Library Medical Post",
            "status": "ASSIGNED",
            "is_available": False,
            "current_workload": 1,
            "max_workload": 2,
            "shift": "Night Shift",
            "avg_response_time_min": 3.1
        },
        {
            "id": 3,
            "code": "FIRE-1",
            "name": "Fire & Rescue Team 1",
            "primary_team": "Fire",
            "skills": ["fire_response", "evacuation", "hazmat"],
            "latitude": 12.9705,
            "longitude": 77.5930,
            "location_label": "Fire Staging Station 1",
            "status": "ASSIGNED",
            "is_available": False,
            "current_workload": 1,
            "max_workload": 2,
            "shift": "Night Shift",
            "avg_response_time_min": 2.8
        },
        {
            "id": 4,
            "code": "SEC-1",
            "name": "Security Team 1 (Tactical Patrol)",
            "primary_team": "Security",
            "skills": ["security", "crowd_control", "patrol"],
            "latitude": 12.9715,
            "longitude": 77.5960,
            "location_label": "North Perimeter Gate",
            "status": "ASSIGNED",
            "is_available": False,
            "current_workload": 1,
            "max_workload": 2,
            "shift": "Night Shift",
            "avg_response_time_min": 2.0
        },
        {
            "id": 5,
            "code": "SEC-2",
            "name": "Security Team 2 (South Watch)",
            "primary_team": "Security",
            "skills": ["security", "access_control", "crowd_control"],
            "latitude": 12.9698,
            "longitude": 77.5942,
            "location_label": "Main Gate Kiosk",
            "status": "AVAILABLE",
            "is_available": True,
            "current_workload": 0,
            "max_workload": 2,
            "shift": "Night Shift",
            "avg_response_time_min": 3.0
        },
        {
            "id": 6,
            "code": "GEN-1",
            "name": "General Responder Team 1",
            "primary_team": "General",
            "skills": ["first_aid", "crowd_control", "evacuation"],
            "latitude": 12.9710,
            "longitude": 77.5950,
            "location_label": "Student Union Hall",
            "status": "AVAILABLE",
            "is_available": True,
            "current_workload": 0,
            "max_workload": 2,
            "shift": "Night Shift",
            "avg_response_time_min": 3.8
        },
        {
            "id": 7,
            "code": "GEN-2",
            "name": "General Responder Team 2",
            "primary_team": "General",
            "skills": ["first_aid", "evacuation", "perimeter"],
            "latitude": 12.9725,
            "longitude": 77.5935,
            "location_label": "Science Quad Annex",
            "status": "AVAILABLE",
            "is_available": True,
            "current_workload": 0,
            "max_workload": 2,
            "shift": "Night Shift",
            "avg_response_time_min": 4.0
        },
        {
            "id": 8,
            "code": "TEAM-D",
            "name": "Team D (Cross-Trained Medical & Security)",
            "primary_team": "Security",
            "skills": ["security", "medical", "first_aid", "evacuation"],
            "latitude": 12.9718,
            "longitude": 77.5948,
            "location_label": "Central Quad Staging",
            "status": "AVAILABLE",
            "is_available": True,
            "current_workload": 0,
            "max_workload": 2,
            "shift": "Night Shift",
            "avg_response_time_min": 2.5
        },
        {
            "id": 9,
            "code": "TEAM-E",
            "name": "Team E (Technical Facilities & Power)",
            "primary_team": "Technical",
            "skills": ["technical", "electrical", "generator_maintenance"],
            "latitude": 12.9735,
            "longitude": 77.5925,
            "location_label": "Central Power Substation",
            "status": "AVAILABLE",
            "is_available": True,
            "current_workload": 0,
            "max_workload": 2,
            "shift": "Night Shift",
            "avg_response_time_min": 4.5
        }
    ]

    for rd in responders_data:
        db.add(Responder(**rd))
    db.commit()

    # 2. Seed Incidents from the Core Challenge specification:
    # Incident #101: Medical emergency, Priority: 91, Required: Medical
    # Incident #102: Fire, Priority: 97, Required: Fire
    # Incident #103: Security threat, Priority: 84, Required: Security
    # Incident #104: Medical emergency, Priority: 82, Required: Medical
    # Incident #105: Medical emergency, Priority: 95, Required: Medical (The Crunch Incident!)
    now = datetime.utcnow()

    incidents_data = [
        {
            "id": 101,
            "code": "INC-101",
            "title": "Severe Cardiac Distress / Unresponsive Student",
            "description": "Student collapsed outside Chemistry Lab wing, difficulty breathing with weak pulse.",
            "category": "Medical",
            "severity": 5,
            "people_affected": 1,
            "location_name": "Science Quad - Chemistry Wing",
            "building": "Science Complex Block A",
            "floor": "1st Floor Corridor",
            "latitude": 12.9722,
            "longitude": 77.5938,
            "priority_score": 91.0,
            "priority_scale_10": 9,
            "priority_level": "CRITICAL",
            "status": "DISPATCHED",
            "required_team": "Medical",
            "optional_teams": ["Security"],
            "min_responders": 1,
            "required_equipment": ["Automated External Defibrillator (AED)", "Trauma kit", "O2 Inhalator"],
            "escalation_level": 3,
            "sla_target_minutes": 3,
            "created_at": now - timedelta(minutes=4),
            "first_response_at": now - timedelta(minutes=2),
            "reporter_name": "Dr. Sarah Jenkins (Lab Faculty)",
            "reporter_contact": "ext-2204"
        },
        {
            "id": 102,
            "code": "INC-102",
            "title": "Active Electrical Fire with Expanding Smoke",
            "description": "Thick black smoke and flames billowing from electrical distribution room near Block C server rack.",
            "category": "Fire",
            "severity": 5,
            "people_affected": 18,
            "location_name": "Block C Engineering Lab",
            "building": "Block C Engineering",
            "floor": "Ground Floor Electrical Bay",
            "latitude": 12.9708,
            "longitude": 77.5932,
            "priority_score": 97.0,
            "priority_scale_10": 10,
            "priority_level": "CRITICAL",
            "status": "ON_SCENE",
            "smoke_spreading": True,
            "trapped_persons": False,
            "required_team": "Fire",
            "optional_teams": ["Security", "Medical"],
            "min_responders": 2,
            "required_equipment": ["CO2 / Foam Fire Extinguishers", "SCBA Protective Gear", "Thermal Camera"],
            "escalation_level": 4,
            "sla_target_minutes": 3,
            "created_at": now - timedelta(minutes=6),
            "first_response_at": now - timedelta(minutes=4),
            "reporter_name": "Security Guard Rao",
            "reporter_contact": "ext-4409"
        },
        {
            "id": 103,
            "code": "INC-103",
            "title": "Aggressive Trespasser & Perimeter Breach",
            "description": "Unauthorized individual forced entry past North Gate barrier, issuing verbal threats toward dormitories.",
            "category": "Security",
            "severity": 4,
            "people_affected": 4,
            "location_name": "North Hostel Gate",
            "building": "North Gate Portal",
            "floor": "Ground Entrance",
            "latitude": 12.9714,
            "longitude": 77.5962,
            "priority_score": 84.0,
            "priority_scale_10": 8,
            "priority_level": "CRITICAL",
            "status": "DISPATCHED",
            "required_team": "Security",
            "optional_teams": ["Medical"],
            "min_responders": 2,
            "required_equipment": ["Tactical Two-Way Radios", "Restraints", "Body Cameras"],
            "escalation_level": 2,
            "sla_target_minutes": 3,
            "created_at": now - timedelta(minutes=5),
            "first_response_at": now - timedelta(minutes=3),
            "reporter_name": "Hostel Warden Sharma",
            "reporter_contact": "ext-1102"
        },
        {
            "id": 104,
            "code": "INC-104",
            "title": "Severe Fracture / Staircase Fall",
            "description": "Student slipped down concrete stairs with compound arm fracture and bleeding.",
            "category": "Medical",
            "severity": 4,
            "people_affected": 1,
            "location_name": "Main Library 2nd Floor",
            "building": "Central Library",
            "floor": "Stairwell B",
            "latitude": 12.9730,
            "longitude": 77.5952,
            "priority_score": 82.0,
            "priority_scale_10": 8,
            "priority_level": "CRITICAL",
            "status": "ON_SCENE",
            "required_team": "Medical",
            "optional_teams": ["Security"],
            "min_responders": 1,
            "required_equipment": ["First-Aid Kit", "Splint & Cervical Collar", "Stretcher"],
            "escalation_level": 2,
            "sla_target_minutes": 3,
            "created_at": now - timedelta(minutes=7),
            "first_response_at": now - timedelta(minutes=5),
            "reporter_name": "Librarian Anita",
            "reporter_contact": "ext-3301"
        },
        {
            "id": 105,
            "code": "INC-105",
            "title": "Severe Asthma & Respiratory Arrest",
            "description": "Student in severe anaphylactic / respiratory crisis at campus sports gym. Gasping for air.",
            "category": "Medical",
            "severity": 5,
            "people_affected": 1,
            "location_name": "Student Activity Center (Gym)",
            "building": "Sports Pavilion",
            "floor": "Main Court",
            "latitude": 12.9719,
            "longitude": 77.5947,
            "priority_score": 95.0,
            "priority_scale_10": 10,
            "priority_level": "CRITICAL",
            "status": "TRIAGED",
            "required_team": "Medical",
            "optional_teams": ["Security"],
            "min_responders": 1,
            "required_equipment": ["First-Aid Kit", "AED", "Portable O2 Inhalator"],
            "escalation_level": 3,
            "sla_target_minutes": 3,
            "created_at": now - timedelta(minutes=1),
            "reporter_name": "Coach Marcus",
            "reporter_contact": "ext-5510"
        },
        # Secondary Cascading Dependency Chain:
        {
            "id": 1042,
            "code": "INC-1042",
            "title": "Primary Transformer Short-Circuit",
            "description": "Underground high-voltage junction box arching violently with burning insulation smell.",
            "category": "Fire",
            "severity": 4,
            "people_affected": 0,
            "location_name": "Block E Substation Vault",
            "building": "Block E Tech Center",
            "floor": "Basement Vault",
            "latitude": 12.9734,
            "longitude": 77.5928,
            "priority_score": 78.0,
            "priority_scale_10": 8,
            "priority_level": "CRITICAL",
            "status": "TRIAGED",
            "required_team": "Fire",
            "optional_teams": ["Technical"],
            "min_responders": 2,
            "required_equipment": ["CO2 Extinguishers", "Electrical Safety PPE"],
            "escalation_level": 2,
            "sla_target_minutes": 7,
            "created_at": now - timedelta(minutes=12),
            "reporter_name": "Substation Tech Patel",
            "reporter_contact": "ext-6602"
        },
        {
            "id": 1043,
            "code": "INC-1043",
            "title": "Secondary Power Failure (Block E)",
            "description": "Complete power blackout across Block E following transformer short-circuit.",
            "category": "Technical",
            "severity": 3,
            "people_affected": 45,
            "location_name": "Block E Entire Wing",
            "building": "Block E Tech Center",
            "floor": "Floors 1-4",
            "latitude": 12.9735,
            "longitude": 77.5927,
            "priority_score": 62.0,
            "priority_scale_10": 6,
            "priority_level": "HIGH",
            "status": "TRIAGED",
            "parent_incident_id": 1042,
            "required_team": "Technical",
            "optional_teams": ["General"],
            "min_responders": 1,
            "required_equipment": ["Lockout kit", "Generator start cable"],
            "escalation_level": 2,
            "sla_target_minutes": 7,
            "created_at": now - timedelta(minutes=9),
            "reporter_name": "Facility Monitor System",
            "reporter_contact": "auto-telemetry"
        },
        {
            "id": 1044,
            "code": "INC-1044",
            "title": "Elevator Trap with 3 Students Inside",
            "description": "Elevator Car #2 stalled between 3rd and 4th floors due to Block E blackout. Emergency intercom active.",
            "category": "Technical",
            "severity": 4,
            "people_affected": 3,
            "location_name": "Block E Lift Shaft 2",
            "building": "Block E Tech Center",
            "floor": "Between 3rd & 4th Floor",
            "latitude": 12.9736,
            "longitude": 77.5926,
            "priority_score": 83.0,
            "priority_scale_10": 8,
            "priority_level": "CRITICAL",
            "status": "TRIAGED",
            "parent_incident_id": 1043,
            "required_team": "Technical",
            "optional_teams": ["Medical", "Fire"],
            "min_responders": 2,
            "required_equipment": ["Elevator mechanical hoist", "Intercom", "First-Aid kit"],
            "escalation_level": 3,
            "sla_target_minutes": 3,
            "created_at": now - timedelta(minutes=6),
            "reporter_name": "Trapped Student Rohan (via intercom)",
            "reporter_contact": "ext-lift-02"
        }
    ]

    for idata in incidents_data:
        db.add(Incident(**idata))
    db.commit()

    # 3. Baseline Assignments matching the Core Challenge
    # Fire Team 1 -> Incident #102
    # Medical Team 1 -> Incident #101
    # Security Team 1 -> Incident #103
    # Medical Team 2 -> Incident #104
    assignments_data = [
        {
            "incident_id": 101,
            "responder_id": 1, # MED-1
            "assigned_at": now - timedelta(minutes=3),
            "status": "ACTIVE",
            "match_score": 96.0,
            "decision_reasoning": [
                "✓ Required medical capability (Score: 40/40)",
                "✓ 0.4 km from Science Quad (Score: 19/20)",
                "✓ High historical arrival speed (2.4 min)",
                "✓ Zero prior conflicts"
            ]
        },
        {
            "incident_id": 102,
            "responder_id": 3, # FIRE-1
            "assigned_at": now - timedelta(minutes=5),
            "status": "ACTIVE",
            "match_score": 98.0,
            "decision_reasoning": [
                "✓ Direct fire apparatus and SCBA match (Score: 40/40)",
                "✓ 0.3 km from Block C (Score: 20/20)",
                "✓ Critical life-safety rating (Score: 100/100)"
            ]
        },
        {
            "incident_id": 103,
            "responder_id": 4, # SEC-1
            "assigned_at": now - timedelta(minutes=4),
            "status": "ACTIVE",
            "match_score": 92.0,
            "decision_reasoning": [
                "✓ Tactical perimeter capability (Score: 40/40)",
                "✓ Positioned near North Gate (0.2 km, Score: 20/20)",
                "✓ Rapid containment authorization"
            ]
        },
        {
            "incident_id": 104,
            "responder_id": 2, # MED-2
            "assigned_at": now - timedelta(minutes=5),
            "status": "ACTIVE",
            "match_score": 90.0,
            "decision_reasoning": [
                "✓ Paramedic trauma capability (Score: 40/40)",
                "✓ Staged near Library Post (0.3 km, Score: 19/20)",
                "✓ Deployed for bone stabilization"
            ]
        }
    ]

    for adata in assignments_data:
        db.add(Assignment(**adata))
    db.commit()

    # 4. Audit Log initial entries
    audits = [
        {
            "timestamp": now - timedelta(minutes=15),
            "action": "EOC_INITIALIZED",
            "actor": "System Commander",
            "details": "CampusCare Emergency Operations Center online. 9 units reporting for shift."
        },
        {
            "timestamp": now - timedelta(minutes=7),
            "action": "INCIDENT_DISPATCH",
            "actor": "Auto-Triage Engine",
            "incident_code": "INC-104",
            "details": "Dispatched Medical Team 2 to Main Library 2nd Floor (Priority 82)."
        },
        {
            "timestamp": now - timedelta(minutes=5),
            "action": "INCIDENT_DISPATCH",
            "actor": "Auto-Triage Engine",
            "incident_code": "INC-102",
            "details": "Dispatched Fire Team 1 to Block C Engineering Lab (Priority 97)."
        },
        {
            "timestamp": now - timedelta(minutes=3),
            "action": "INCIDENT_DISPATCH",
            "actor": "Auto-Triage Engine",
            "incident_code": "INC-101",
            "details": "Dispatched Medical Team 1 to Science Quad (Priority 91)."
        },
        {
            "timestamp": now - timedelta(minutes=1),
            "action": "RESOURCE_CRUNCH_DETECTED",
            "actor": "Allocation Optimizer",
            "incident_code": "INC-105",
            "details": "CRITICAL: Incident #105 (Priority 95) intake complete. ZERO medical teams free. Reallocation & cross-training alternatives computed."
        }
    ]

    for aud in audits:
        db.add(AuditLog(**aud))

    # 5. Notifications
    notifications_data = [
        {
            "timestamp": now - timedelta(minutes=1),
            "level": "CRITICAL",
            "title": "RESOURCE EXHAUSTION ALERT: Medical Teams",
            "message": "Incident #105 (Asthma / Respiratory, Priority 95) requires immediate Medical response. All primary medical teams currently assigned.",
            "incident_code": "INC-105"
        },
        {
            "timestamp": now - timedelta(minutes=4),
            "level": "WARNING",
            "title": "Fire Smoke Spreading at Block C",
            "message": "Incident #102 upgraded to Priority 97. Evacuation advisory broadcast active.",
            "incident_code": "INC-102"
        }
    ]

    for notif in notifications_data:
        db.add(Notification(**notif))

    db.commit()
    print("[SEED] EOC baseline dataset successfully initialized.")
