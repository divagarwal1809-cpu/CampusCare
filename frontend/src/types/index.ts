export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentCategory = 'Medical' | 'Fire' | 'Security' | 'Technical' | 'Hazmat' | 'General';
export type IncidentStatus = 'REPORTED' | 'TRIAGED' | 'ASSIGNED' | 'DISPATCHED' | 'ON_SCENE' | 'RESOLVED' | 'CLOSED';

export interface Incident {
  id: number;
  code: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: number;
  people_affected: number;
  location_name: string;
  building?: string;
  floor?: string;
  latitude: number;
  longitude: number;
  priority_score: number;
  priority_scale_10: number;
  priority_level: PriorityLevel;
  status: IncidentStatus;
  smoke_spreading: boolean;
  trapped_persons: boolean;
  hazard_leak: boolean;
  delayed_minutes: number;
  required_team: string;
  optional_teams: string[];
  min_responders: number;
  required_equipment: string[];
  escalation_level: number;
  sla_target_minutes: number;
  created_at: string;
  first_response_at?: string;
  resolved_at?: string;
  assigned_responder_names?: string[];
  parent_incident_id?: number;
  reporter_name?: string;
  reporter_contact?: string;
  attachments?: string[];
}

export interface Responder {
  id: number;
  code: string;
  name: string;
  primary_team: string;
  skills: string[];
  latitude: number;
  longitude: number;
  location_label: string;
  status: string;
  is_available: boolean;
  current_workload: number;
  max_workload: number;
  shift: string;
  avg_response_time_min: number;
  current_assignment_code?: string;
}

export interface CapabilityRow {
  id: number;
  code: string;
  name: string;
  primary_team: string;
  medical: boolean;
  fire: boolean;
  security: boolean;
  technical: boolean;
  first_aid: boolean;
  crowd_control: boolean;
  status: string;
  is_available: boolean;
  current_workload: number;
  max_workload: number;
}

export interface CandidateEvaluation {
  responder_id: number;
  responder_code: string;
  responder_name: string;
  primary_team: string;
  distance_km: number;
  eta_minutes: number;
  match_score: number;
  breakdown: {
    skill_score: number;
    distance_score: number;
    workload_score: number;
    availability_score: number;
    response_time_score: number;
    priority_score: number;
    total_score: number;
  };
  reasons: string[];
  is_cross_trained: boolean;
}

export interface ReallocationOption {
  option_id: string;
  title: string;
  action_type: 'REALLOCATE' | 'CROSS_TRAINED' | 'EXTERNAL' | 'ESCALATE';
  description: string;
  reallocate_responder_code?: string;
  from_incident_code?: string;
  to_incident_code?: string;
  impact: string;
  benefit: string;
  net_priority_gain: number;
  recommended: boolean;
}

export interface ResourcePressureItem {
  total: number;
  used: number;
  available: number;
  percent_used: number;
  is_critical: boolean;
}

export interface AllocationPlan {
  timestamp: string;
  active_incidents_count: number;
  assigned_incidents: Array<{
    incident_id: number;
    incident_code: string;
    incident_title: string;
    priority_score: number;
    priority_level: PriorityLevel;
    required_team: string;
    responder_id: number;
    responder_code: string;
    responder_name: string;
    match_score: number;
    eta_minutes: number;
    is_cross_trained: boolean;
    reasons: string[];
  }>;
  unassigned_incidents: Array<{
    incident_id: number;
    incident_code: string;
    incident_title: string;
    priority_score: number;
    priority_level: PriorityLevel;
    required_team: string;
    severity: number;
    sla_target_minutes: number;
    reason: string;
  }>;
  resource_pressure: Record<string, ResourcePressureItem>;
  resource_conflicts: string[];
  reallocation_proposals: ReallocationOption[];
  escalation_alerts: string[];
  system_status: 'OPERATIONAL' | 'ELEVATED' | 'CRITICAL_PRESSURE';
}

export interface SimulationResult {
  scenario_name: string;
  current_plan: {
    assigned_count: number;
    unassigned_count: number;
    unassigned_incidents: any[];
    resource_pressure: Record<string, ResourcePressureItem>;
    system_status: string;
  };
  simulated_plan: {
    assigned_count: number;
    unassigned_count: number;
    unassigned_incidents: any[];
    resource_pressure: Record<string, ResourcePressureItem>;
    system_status: string;
  };
  metrics: {
    unassigned_delta: number;
    assigned_delta: number;
    simulated_total_incidents: number;
    simulated_total_responders: number;
  };
  key_findings: string[];
}

export interface AuditLogItem {
  id: number;
  timestamp: string;
  full_time: string;
  action: string;
  actor: string;
  incident_code?: string;
  details: string;
  payload: any;
}

export interface NotificationItem {
  id: number;
  timestamp: string;
  level: string;
  title: string;
  message: string;
  incident_code?: string;
  is_read: boolean;
}
