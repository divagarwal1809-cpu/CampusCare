import {
  Incident,
  Responder,
  CapabilityRow,
  CandidateEvaluation,
  AllocationPlan,
  SimulationResult,
  AuditLogItem,
  NotificationItem
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api/v1';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }
  return response.json();
}

export const api = {
  // Incidents
  getIncidents: () => fetchJSON<Incident[]>('/incidents'),
  getActiveIncidents: () => fetchJSON<Incident[]>('/incidents/active'),
  getIncidentDetail: (id: number) => fetchJSON<any>(`/incidents/${id}`),
  createIncident: (data: Partial<Incident>) =>
    fetchJSON<Incident>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateDynamicFactors: (id: number, data: {
    people_affected?: number;
    smoke_spreading?: boolean;
    trapped_persons?: boolean;
    hazard_leak?: boolean;
    delayed_minutes?: number;
    severity?: number;
  }) =>
    fetchJSON<any>(`/incidents/${id}/dynamic-factors`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  resolveIncident: (id: number) =>
    fetchJSON<{ success: boolean; incident_code: string; status: string }>(
      `/incidents/${id}/resolve`,
      { method: 'POST' }
    ),
  getPostIncidentReview: (id: number) =>
    fetchJSON<any>(`/incidents/${id}/post-incident-review`),

  // Responders
  getResponders: (team?: string) =>
    fetchJSON<Responder[]>(`/responders${team ? `?team=${team}` : ''}`),
  getAvailableResponders: () =>
    fetchJSON<Responder[]>('/responders/available'),
  getCapabilityMatrix: () =>
    fetchJSON<CapabilityRow[]>('/responders/capability-matrix'),
  updateResponderStatus: (id: number, data: { is_available?: boolean; status?: string }) =>
    fetchJSON<any>(`/responders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Decisions & Allocations
  getAllocationPlan: () => fetchJSON<AllocationPlan>('/decisions/allocation-plan'),
  evaluateCandidate: (incident_id: number, responder_id: number) =>
    fetchJSON<CandidateEvaluation>('/decisions/evaluate-candidate', {
      method: 'POST',
      body: JSON.stringify({ incident_id, responder_id }),
    }),
  assignResponder: (incident_id: number, responder_id: number) =>
    fetchJSON<any>('/decisions/assign', {
      method: 'POST',
      body: JSON.stringify({ incident_id, responder_id }),
    }),
  executeOption: (payload: {
    option_id: string;
    action_type: string;
    reallocate_responder_code?: string;
    from_incident_code?: string;
    to_incident_code?: string;
  }) =>
    fetchJSON<any>('/decisions/execute-option', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getSituationBriefing: () => fetchJSON<any>('/decisions/situation-briefing'),

  // Simulation
  runSimulation: (data: {
    medical_teams_count: number;
    fire_teams_count: number;
    security_teams_count: number;
    general_teams_count: number;
    incident_spike_count: number;
    allow_cross_training: boolean;
    delay_multiplier: number;
  }) =>
    fetchJSON<SimulationResult>('/simulation/run', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Analytics
  getAnalyticsDashboard: () => fetchJSON<any>('/analytics/dashboard'),

  // Audit
  getAuditLogs: (incident_code?: string) =>
    fetchJSON<AuditLogItem[]>(
      `/audit/logs${incident_code ? `?incident_code=${incident_code}` : ''}`
    ),

  // Notifications
  getNotifications: () => fetchJSON<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: number) =>
    fetchJSON<any>(`/notifications/${id}/read`, { method: 'POST' }),

  // Admin Reset
  resetDemoScenario: () => fetchJSON<any>('/admin/reset-demo', { method: 'POST' }),
};
