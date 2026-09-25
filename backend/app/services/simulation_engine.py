from typing import Dict, Any, List
from app.models.incident import Incident
from app.models.responder import Responder
from app.models.responder import Assignment
from app.services.allocation_engine import AllocationEngine
from app.schemas.simulation import SimulationInput

class SimulationEngine:
    @classmethod
    def run_simulation(
        cls,
        sim_input: SimulationInput,
        live_incidents: List[Incident],
        live_responders: List[Responder],
        live_assignments: List[Assignment]
    ) -> Dict[str, Any]:
        """
        Runs a What-If scenario against current operational state.
        Allows administrators to test capacity changes without modifying live data.
        """
        # 1. Evaluate baseline current plan
        baseline = AllocationEngine.optimize_multi_incident_allocation(
            incidents=live_incidents,
            responders=live_responders,
            active_assignments=live_assignments
        )

        # 2. Synthesize simulated responders according to slider inputs
        sim_responders: List[Responder] = []
        r_id = 9000

        # Medical teams
        for i in range(sim_input.medical_teams_count):
            r_id += 1
            sim_responders.append(Responder(
                id=r_id,
                code=f"SIM-MED-{i+1}",
                name=f"Simulated Medical Team {i+1}",
                primary_team="Medical",
                skills=["medical", "first_aid"],
                latitude=12.9716 + (i * 0.002),
                longitude=77.5946 - (i * 0.002),
                status="AVAILABLE",
                is_available=True,
                current_workload=0,
                max_workload=2,
                avg_response_time_min=3.0
            ))

        # Fire teams
        for i in range(sim_input.fire_teams_count):
            r_id += 1
            sim_responders.append(Responder(
                id=r_id,
                code=f"SIM-FIRE-{i+1}",
                name=f"Simulated Fire Engine {i+1}",
                primary_team="Fire",
                skills=["fire_response", "evacuation"],
                latitude=12.9720,
                longitude=77.5950,
                status="AVAILABLE",
                is_available=True,
                current_workload=0,
                max_workload=2,
                avg_response_time_min=3.5
            ))

        # Security teams
        for i in range(sim_input.security_teams_count):
            r_id += 1
            skills = ["security", "crowd_control"]
            # Cross-trained team D if enabled
            if sim_input.allow_cross_training and i == 1:
                skills.append("medical")
                skills.append("first_aid")
            sim_responders.append(Responder(
                id=r_id,
                code=f"SIM-SEC-{i+1}",
                name=f"Simulated Security Team {i+1}" + (" (Cross-Trained)" if "medical" in skills else ""),
                primary_team="Security",
                skills=skills,
                latitude=12.9710 + (i * 0.003),
                longitude=77.5940,
                status="AVAILABLE",
                is_available=True,
                current_workload=0,
                max_workload=2,
                avg_response_time_min=2.8
            ))

        # General teams
        for i in range(sim_input.general_teams_count):
            r_id += 1
            sim_responders.append(Responder(
                id=r_id,
                code=f"SIM-GEN-{i+1}",
                name=f"Simulated General Patrol {i+1}",
                primary_team="General",
                skills=["first_aid", "crowd_control"],
                latitude=12.9705,
                longitude=77.5960,
                status="AVAILABLE",
                is_available=True,
                current_workload=0,
                max_workload=2,
                avg_response_time_min=4.0
            ))

        # Synthetic incidents copy (handle spike if requested)
        sim_incidents = list(live_incidents)
        if sim_input.incident_spike_count > 0:
            for s in range(sim_input.incident_spike_count):
                spike_id = 8000 + s
                sim_incidents.append(Incident(
                    id=spike_id,
                    code=f"SIM-SPIKE-{s+1}",
                    title=f"Synthetic Mass Surge Incident #{s+1}",
                    description="Synthetically generated surge incident from what-if parameters.",
                    category="Medical" if s % 2 == 0 else "Security",
                    severity=4,
                    people_affected=8,
                    location_name="Hostel Quad Zone",
                    latitude=12.9725,
                    longitude=77.5935,
                    priority_score=86.0,
                    priority_level="CRITICAL",
                    status="TRIAGED",
                    required_team="Medical" if s % 2 == 0 else "Security",
                    optional_teams=["General"],
                    min_responders=1,
                    sla_target_minutes=3
                ))

        # 3. Run simulated allocation with zero pre-existing locks to find optimal theoretical distribution
        simulated_res = AllocationEngine.optimize_multi_incident_allocation(
            incidents=sim_incidents,
            responders=sim_responders,
            active_assignments=[]
        )

        # 4. Compute metrics and key findings
        base_unassigned = len(baseline["unassigned_incidents"])
        sim_unassigned = len(simulated_res["unassigned_incidents"])
        
        base_assigned = len(baseline["assigned_incidents"])
        sim_assigned = len(simulated_res["assigned_incidents"])

        findings = []
        if sim_unassigned > base_unassigned:
            findings.append(f"⚠ Critical Shortage: Resource reduction results in {sim_unassigned - base_unassigned} additional unassigned incident(s).")
        elif sim_unassigned < base_unassigned:
            findings.append(f"✓ Resource Expansion Success: Unassigned queue reduced by {base_unassigned - sim_unassigned} incident(s).")
        else:
            findings.append("• Queue throughput parity maintained under tested configuration.")

        if sim_input.allow_cross_training:
            cross_count = sum(1 for a in simulated_res["assigned_incidents"] if a.get("is_cross_trained"))
            if cross_count > 0:
                findings.append(f"✓ Cross-training resolved {cross_count} specialist shortage(s) using hybrid responders.")
        else:
            findings.append("⚠ Cross-training disabled: Higher reliance on dedicated single-specialty teams.")

        return {
            "scenario_name": f"Simulation: {sim_input.medical_teams_count} Med / {sim_input.fire_teams_count} Fire / {sim_input.security_teams_count} Sec",
            "current_plan": {
                "assigned_count": base_assigned,
                "unassigned_count": base_unassigned,
                "unassigned_incidents": baseline["unassigned_incidents"],
                "resource_pressure": baseline["resource_pressure"],
                "system_status": baseline["system_status"]
            },
            "simulated_plan": {
                "assigned_count": sim_assigned,
                "unassigned_count": sim_unassigned,
                "unassigned_incidents": simulated_res["unassigned_incidents"],
                "resource_pressure": simulated_res["resource_pressure"],
                "system_status": simulated_res["system_status"]
            },
            "metrics": {
                "unassigned_delta": sim_unassigned - base_unassigned,
                "assigned_delta": sim_assigned - base_assigned,
                "simulated_total_incidents": len(sim_incidents),
                "simulated_total_responders": len(sim_responders)
            },
            "key_findings": findings
        }
