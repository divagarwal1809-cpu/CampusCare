from typing import List, Dict, Any
from datetime import datetime
from app.models.incident import Incident
from app.services.assignment_engine import AssignmentEngine

class CorrelationEngine:
    @staticmethod
    def detect_correlations(target: Incident, all_incidents: List[Incident]) -> Dict[str, Any]:
        """
        Analyzes spatiotemporal proximity between target incident and all active/recent incidents.
        Does not declare connection conclusively, but flags:
        'These incidents share location/time characteristics and may warrant review.'
        """
        correlated = []
        max_dist_km = 0.35 # 350 meters
        max_time_diff_hours = 2.0

        target_time = target.created_at or datetime.utcnow()

        for inc in all_incidents:
            if inc.id == target.id:
                continue

            # Distance
            dist = AssignmentEngine.calculate_distance_km(
                target.latitude, target.longitude,
                inc.latitude, inc.longitude
            )

            # Time difference
            inc_time = inc.created_at or datetime.utcnow()
            time_diff = abs((target_time - inc_time).total_seconds()) / 3600.0

            if dist <= max_dist_km and time_diff <= max_time_diff_hours:
                correlated.append({
                    "incident_id": inc.id,
                    "code": inc.code,
                    "title": inc.title,
                    "category": inc.category,
                    "location_name": inc.location_name,
                    "distance_meters": int(dist * 1000),
                    "time_diff_minutes": int(time_diff * 60)
                })

        has_correlations = len(correlated) > 0
        advisory = ""
        if has_correlations:
            advisory = (
                f"Cluster Detected: {len(correlated)} incidents share location/time proximity "
                f"(within 350m and 2 hours) and warrant review by dispatch supervisor."
            )

        return {
            "has_correlations": has_correlations,
            "correlated_incidents": correlated,
            "advisory_note": advisory
        }

    @staticmethod
    def get_dependency_tree(target: Incident, all_incidents: List[Incident]) -> Dict[str, Any]:
        """
        Constructs parent-child cascading dependency tree.
        Example: Electrical Fire -> Power Failure -> Elevator Failure
        """
        # Find root parent if exists
        root = target
        visited = set([target.id])
        while root.parent_incident_id is not None:
            parent = next((i for i in all_incidents if i.id == root.parent_incident_id), None)
            if not parent or parent.id in visited:
                break
            visited.add(parent.id)
            root = parent

        # Recursively build tree starting from root
        def build_node(node: Incident) -> Dict[str, Any]:
            children = [i for i in all_incidents if i.parent_incident_id == node.id]
            return {
                "id": node.id,
                "code": node.code,
                "title": node.title,
                "category": node.category,
                "priority_score": node.priority_score,
                "status": node.status,
                "is_target": node.id == target.id,
                "children": [build_node(child) for child in children]
            }

        return {
            "primary_incident_code": root.code,
            "tree": build_node(root)
        }
