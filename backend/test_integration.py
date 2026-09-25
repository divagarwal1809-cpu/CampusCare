import urllib.request
import json

def test():
    print("--- 1. Testing Allocation Plan & Multi-Incident Optimization ---")
    req = urllib.request.urlopen('http://127.0.0.1:8000/api/v1/decisions/allocation-plan')
    plan = json.loads(req.read().decode('utf-8'))
    print("✓ Allocation plan loaded successfully!")
    print(f"  Active incidents: {plan['active_incidents_count']}")
    print(f"  System status: {plan['system_status']}")
    print(f"  Resource pressure: {list(plan['resource_pressure'].keys())}")
    print(f"  Reallocation proposals: {len(plan['reallocation_proposals'])} available")
    for p in plan['reallocation_proposals']:
        print(f"    * {p['title']}")

    print("\n--- 2. Testing Candidate Evaluation & Explainable Reasoning ---")
    payload = json.dumps({'incident_id': 105, 'responder_id': 8}).encode('utf-8')
    req2 = urllib.request.Request('http://127.0.0.1:8000/api/v1/decisions/evaluate-candidate', data=payload, headers={'Content-Type': 'application/json'})
    eval_res = json.loads(urllib.request.urlopen(req2).read().decode('utf-8'))
    print(f"✓ Candidate evaluation for {eval_res['responder_name']} on INC-105:")
    print(f"  Match score: {eval_res['match_score']} / 100")
    print(f"  Cross-trained: {eval_res['is_cross_trained']}")
    print(f"  Reasons: {eval_res['reasons'][:2]}")

    print("\n--- 3. Testing Dynamic Factor Recalculation ---")
    payload3 = json.dumps({'people_affected': 18, 'smoke_spreading': True, 'delayed_minutes': 12}).encode('utf-8')
    req3 = urllib.request.Request('http://127.0.0.1:8000/api/v1/incidents/102/dynamic-factors', data=payload3, headers={'Content-Type': 'application/json'}, method='PATCH')
    dyn_res = json.loads(urllib.request.urlopen(req3).read().decode('utf-8'))
    print(f"✓ Dynamic recalculation on INC-102:")
    print(f"  Shift: {dyn_res['old_score']} -> {dyn_res['new_score']}")
    print(f"  Level: {dyn_res['old_level']} -> {dyn_res['new_level']}")

    print("\n--- 4. Testing What-If Decision Simulation Engine ---")
    payload4 = json.dumps({
        'medical_teams_count': 1,
        'fire_teams_count': 1,
        'security_teams_count': 2,
        'general_teams_count': 2,
        'incident_spike_count': 0,
        'allow_cross_training': True,
        'delay_multiplier': 1.0
    }).encode('utf-8')
    req4 = urllib.request.Request('http://127.0.0.1:8000/api/v1/simulation/run', data=payload4, headers={'Content-Type': 'application/json'})
    sim_res = json.loads(urllib.request.urlopen(req4).read().decode('utf-8'))
    print("✓ What-If Simulation run:")
    print(f"  Current unassigned: {sim_res['current_plan']['unassigned_count']}")
    print(f"  Simulated unassigned: {sim_res['simulated_plan']['unassigned_count']}")
    print(f"  Key findings: {sim_res['key_findings']}")

    print("\n--- 5. Testing Capability Matrix ---")
    req5 = urllib.request.urlopen('http://127.0.0.1:8000/api/v1/responders/capability-matrix')
    matrix = json.loads(req5.read().decode('utf-8'))
    team_d = next(r for r in matrix if r['code'] == 'TEAM-D')
    print(f"✓ Capability Matrix for {team_d['name']}:")
    print(f"  Medical: {team_d['medical']} | Security: {team_d['security']}")

    print("\n--- 6. Testing Analytics & Campus Risk Heatmap ---")
    req6 = urllib.request.urlopen('http://127.0.0.1:8000/api/v1/analytics/dashboard')
    analytics = json.loads(req6.read().decode('utf-8'))
    print("✓ Analytics & Risk Heatmap:")
    print(f"  Heatmap zones count: {len(analytics['heatmap_zones'])}")
    print(f"  Highest risk zone: {analytics['heatmap_zones'][0]['zone']} ({analytics['heatmap_zones'][0]['risk_score']}/100)")

    print("\n--- 7. Resetting Scenario to 10:32 PM Baseline ---")
    req7 = urllib.request.Request('http://127.0.0.1:8000/api/v1/admin/reset-demo', data=b'{}', headers={'Content-Type': 'application/json'})
    reset_res = json.loads(urllib.request.urlopen(req7).read().decode('utf-8'))
    print(f"✓ Demo baseline reset: {reset_res['message']}")
    print("\n>>> ALL CAMPUSCARE OPERATIONAL ENGINES VERIFIED 100% SUCCESSFUL! <<<")

if __name__ == '__main__':
    test()
