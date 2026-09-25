from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.incident import Incident
from app.models.responder import Responder
from app.models.responder import Assignment
from app.services.assignment_engine import AssignmentEngine

class AllocationEngine:
    @classmethod
    def optimize_multi_incident_allocation(
        cls,
        incidents: List[Incident],
        responders: List[Responder],
        active_assignments: List[Assignment]
    ) -> Dict[str, Any]:
        """
        Global multi-incident resource allocation optimization algorithm.
        Considers all active incidents simultaneously, sorted by operational priority.
        Identifies resource bottlenecks, cross-trained fallbacks, and reallocation options.
        """
        # Filter active incidents (unresolved)
        active_incidents = [
            inc for inc in incidents 
            if inc.status not in ["RESOLVED", "CLOSED"]
        ]
        # Sort by priority descending (highest urgency first)
        sorted_incidents = sorted(active_incidents, key=lambda x: x.priority_score, reverse=True)

        # Build responder lookup and track dynamic allocation
        responder_map = {r.id: r for r in responders}
        responder_assigned_to: Dict[int, Optional[int]] = {}
        for r in responders:
            responder_assigned_to[r.id] = None

        # Record currently deployed responders
        for a in active_assignments:
            if a.status == "ACTIVE" and a.responder_id in responder_assigned_to:
                responder_assigned_to[a.responder_id] = a.incident_id

        # Calculate current resource inventory pressure
        team_totals: Dict[str, int] = {}
        team_used: Dict[str, int] = {}
        for r in responders:
            pt = r.primary_team
            team_totals[pt] = team_totals.get(pt, 0) + 1
            if responder_assigned_to.get(r.id) is not None:
                team_used[pt] = team_used.get(pt, 0) + 1
            else:
                team_used[pt] = team_used.get(pt, 0)

        resource_pressure = {}
        for team, total in team_totals.items():
            used = team_used.get(team, 0)
            pct = round((used / total * 100.0), 1) if total > 0 else 0.0
            resource_pressure[team] = {
                "total": total,
                "used": used,
                "available": total - used,
                "percent_used": pct,
                "is_critical": (total - used) == 0
            }

        # Simulated optimal matching
        assigned_results = []
        unassigned_results = []
        resource_conflicts = []
        escalation_alerts = []
        reallocation_proposals = []

        # Available pool copy for matching
        allocated_pool: Dict[int, int] = dict(responder_assigned_to)

        for incident in sorted_incidents:
            req_team = incident.required_team
            
            # Find best candidate from free pool
            candidates = []
            for r in responders:
                if not r.is_available:
                    continue
                # If responder is already allocated in this simulation pass, skip
                if allocated_pool[r.id] is not None:
                    continue
                
                eval_res = AssignmentEngine.evaluate_candidate(r, incident)
                candidates.append((eval_res["match_score"], eval_res, r))

            candidates.sort(key=lambda x: x[0], reverse=True)

            # Check if an eligible candidate is found
            best_candidate = None
            if candidates:
                top_score, top_eval, top_resp = candidates[0]
                # Must meet a minimum viability score (e.g. 40+)
                if top_score >= 40.0:
                    best_candidate = top_eval
                    allocated_pool[top_resp.id] = incident.id

            if best_candidate:
                assigned_results.append({
                    "incident_id": incident.id,
                    "incident_code": incident.code,
                    "incident_title": incident.title,
                    "priority_score": incident.priority_score,
                    "priority_level": incident.priority_level,
                    "required_team": incident.required_team,
                    "responder_id": best_candidate["responder_id"],
                    "responder_code": best_candidate["responder_code"],
                    "responder_name": best_candidate["responder_name"],
                    "match_score": best_candidate["match_score"],
                    "eta_minutes": best_candidate["eta_minutes"],
                    "is_cross_trained": best_candidate["is_cross_trained"],
                    "reasons": best_candidate["reasons"]
                })
            else:
                # Incident cannot be fulfilled with current free responders!
                conflict_msg = (
                    f"NO {req_team.upper()} TEAM AVAILABLE for {incident.code} "
                    f"({incident.title}, Priority: {incident.priority_score})"
                )
                resource_conflicts.append(conflict_msg)
                
                unassigned_results.append({
                    "incident_id": incident.id,
                    "incident_code": incident.code,
                    "incident_title": incident.title,
                    "priority_score": incident.priority_score,
                    "priority_level": incident.priority_level,
                    "required_team": incident.required_team,
                    "severity": incident.severity,
                    "sla_target_minutes": incident.sla_target_minutes,
                    "reason": f"Zero available {req_team} teams or cross-trained units"
                })

                if incident.priority_score >= 75.0:
                    escalation_alerts.append(
                        f"CRITICAL DEFICIT: {incident.code} requires immediate {req_team} dispatch. SLA target is {incident.sla_target_minutes}m."
                    )

                # Generate Reallocation proposals for this unassigned incident
                cls._generate_reallocation_options(
                    incident=incident,
                    responders=responders,
                    active_assignments=active_assignments,
                    all_incidents=incidents,
                    reallocation_proposals=reallocation_proposals
                )

        # System Health status
        if len(escalation_alerts) > 0 or any(p["is_critical"] and p["used"] > 0 for p in resource_pressure.values()):
            system_status = "CRITICAL_PRESSURE"
        elif len(unassigned_results) > 0:
            system_status = "ELEVATED"
        else:
            system_status = "OPERATIONAL"

        return {
            "timestamp": datetime.utcnow().strftime("%H:%M:%S"),
            "active_incidents_count": len(active_incidents),
            "assigned_incidents": assigned_results,
            "unassigned_incidents": unassigned_results,
            "resource_pressure": resource_pressure,
            "resource_conflicts": resource_conflicts,
            "reallocation_proposals": reallocation_proposals,
            "escalation_alerts": escalation_alerts,
            "system_status": system_status
        }

    @classmethod
    def _generate_reallocation_options(
        cls,
        incident: Incident,
        responders: List[Responder],
        active_assignments: List[Assignment],
        all_incidents: List[Incident],
        reallocation_proposals: List[Dict[str, Any]]
    ):
        """
        Calculates trade-offs and decision options when no specialized team is free.
        """
        incidents_by_id = {inc.id: inc for inc in all_incidents}
        req_team = incident.required_team

        # 1. Option 1: Reallocation candidate from a lower-priority active incident
        # Find currently deployed responders of matching required team
        candidate_reallocations = []
        for a in active_assignments:
            if a.status != "ACTIVE":
                continue
            resp = next((r for r in responders if r.id == a.responder_id), None)
            inc = incidents_by_id.get(a.incident_id)
            if not resp or not inc:
                continue

            # If responder matches required team and their current incident has lower priority
            if (resp.primary_team.lower() == req_team.lower()) and (inc.priority_score < incident.priority_score):
                net_gain = round(incident.priority_score - inc.priority_score, 1)
                candidate_reallocations.append((net_gain, resp, inc))

        candidate_reallocations.sort(key=lambda x: x[0], reverse=True)

        if candidate_reallocations:
            best_gain, best_resp, lower_inc = candidate_reallocations[0]
            reallocation_proposals.append({
                "option_id": f"REALLOC_{best_resp.code}_{incident.code}",
                "title": f"1. Reallocate {best_resp.name} from {lower_inc.code}",
                "action_type": "REALLOCATE",
                "description": f"Preempt {best_resp.name} currently at {lower_inc.code} (Priority {lower_inc.priority_score}) and reroute to {incident.code} (Priority {incident.priority_score}).",
                "reallocate_responder_code": best_resp.code,
                "from_incident_code": lower_inc.code,
                "to_incident_code": incident.code,
                "impact": f"Incident {lower_inc.code} ({lower_inc.title}) waits longer or is placed on hold.",
                "benefit": f"Incident {incident.code} ({incident.title}) receives immediate specialized {req_team} response (Net Priority Gain: +{best_gain}).",
                "net_priority_gain": best_gain,
                "recommended": True
            })

        # 2. Option 2: Dispatch cross-trained responder (e.g. Team D)
        for r in responders:
            skills = [s.lower() for s in (r.skills or [])]
            if req_team.lower() in skills and r.primary_team.lower() != req_team.lower() and r.is_available:
                reallocation_proposals.append({
                    "option_id": f"CROSS_{r.code}_{incident.code}",
                    "title": f"2. Dispatch Cross-Trained Responder ({r.name})",
                    "action_type": "CROSS_TRAINED",
                    "description": f"{r.name} is primary {r.primary_team}, but holds active certification in {req_team}.",
                    "reallocate_responder_code": r.code,
                    "from_incident_code": None,
                    "to_incident_code": incident.code,
                    "impact": f"Slightly lower speed than dedicated specialist unit, uses {r.primary_team} capacity.",
                    "benefit": f"No disruption to other incidents; {incident.code} receives immediate qualified support.",
                    "net_priority_gain": round(incident.priority_score * 0.85, 1),
                    "recommended": False if candidate_reallocations else True
                })
                break

        # 3. Option 3: Request external assistance (City 911 / Mutual Aid)
        reallocation_proposals.append({
            "option_id": f"EXTERNAL_{incident.code}",
            "title": f"3. Request External Emergency Services (City 911 / Mutual Aid)",
            "action_type": "EXTERNAL",
            "description": f"Activate external mutual aid agreement for city {req_team} response.",
            "reallocate_responder_code": None,
            "from_incident_code": None,
            "to_incident_code": incident.code,
            "impact": "Arrival time ~12-18 minutes; external coordination overhead.",
            "benefit": f"Preserves internal campus teams; provides full heavy external {req_team} apparatus.",
            "net_priority_gain": 50.0,
            "recommended": False
        })

        # 4. Option 4: Escalate to Campus Administrator
        reallocation_proposals.append({
            "option_id": f"ESCALATE_{incident.code}",
            "title": "4. Escalate to Operations Administrator / Duty Chief",
            "action_type": "ESCALATE",
            "description": "Send high-priority notification to campus incident commander for manual override.",
            "reallocate_responder_code": None,
            "from_incident_code": None,
            "to_incident_code": incident.code,
            "impact": "Response delayed until commander logs in to override triage.",
            "benefit": "Executive authorization for campus lockdown or mass mobilization.",
            "net_priority_gain": 0.0,
            "recommended": False
        })
