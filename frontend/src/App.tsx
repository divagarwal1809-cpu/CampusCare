import React, { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import {
  Incident,
  Responder,
  AllocationPlan,
  CandidateEvaluation,
  ReallocationOption,
  NotificationItem
} from './types';
import { Header } from './components/Header';
import { Navigation, NavTab, UserRole } from './components/Navigation';
import { ReallocationModal } from './components/ReallocationModal';
import { IncidentIntakeModal } from './components/IncidentIntakeModal';
import { DynamicFactorModal } from './components/DynamicFactorModal';
import { CandidateScoreModal } from './components/CandidateScoreModal';

import { CommandCenter } from './pages/CommandCenter';
import { IncidentDetailView } from './pages/IncidentDetailView';
import { DecisionSimulator } from './pages/DecisionSimulator';
import { CapabilityMatrixPage } from './pages/CapabilityMatrixPage';
import { AnalyticsHeatmapPage } from './pages/AnalyticsHeatmapPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { UserPanel } from './pages/UserPanel';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('command');
  const [role, setRole] = useState<UserRole>('admin');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [responders, setResponders] = useState<Responder[]>([]);
  const [allocationPlan, setAllocationPlan] = useState<AllocationPlan | null>(null);
  const [situationBriefing, setSituationBriefing] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Modals state
  const [isReallocationOpen, setIsReallocationOpen] = useState<boolean>(false);
  const [isIntakeOpen, setIsIntakeOpen] = useState<boolean>(false);
  const [dynamicFactorIncident, setDynamicFactorIncident] = useState<Incident | null>(null);
  const [candidateEvaluation, setCandidateEvaluation] = useState<CandidateEvaluation | null>(null);
  const [targetIncidentForCandidate, setTargetIncidentForCandidate] = useState<Incident | null>(null);
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<Incident | null>(null);

  // Load telemetry data from backend
  const refreshData = useCallback(async () => {
    try {
      const [incs, resps, plan, briefing, notifs] = await Promise.all([
        api.getIncidents(),
        api.getResponders(),
        api.getAllocationPlan(),
        api.getSituationBriefing(),
        api.getNotifications(),
      ]);
      setIncidents(incs);
      setResponders(resps);
      setAllocationPlan(plan);
      setSituationBriefing(briefing);
      setNotifications(notifs);
    } catch (err) {
      console.error('Error fetching EOC data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Reset demo scenario
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoScenario();
      await refreshData();
      setSelectedIncidentDetail(null);
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  // Reallocation execution
  const handleExecuteOption = async (option: ReallocationOption) => {
    await api.executeOption({
      option_id: option.option_id,
      action_type: option.action_type,
      reallocate_responder_code: option.reallocate_responder_code,
      from_incident_code: option.from_incident_code,
      to_incident_code: option.to_incident_code,
    });
    await refreshData();
  };

  // Evaluate candidate responder for incident
  const handleEvaluateCandidate = async (incident: Incident) => {
    try {
      const available = responders.filter((r) => r.is_available);
      const targetResponder = available[0] || responders[0];
      if (!targetResponder) {
        alert('No responders registered in system');
        return;
      }
      const evalResult = await api.evaluateCandidate(incident.id, targetResponder.id);
      setCandidateEvaluation(evalResult);
      setTargetIncidentForCandidate(incident);
    } catch (err: any) {
      alert(`Evaluation error: ${err.message}`);
    }
  };

  // Confirm assignment
  const handleConfirmAssignment = async (responderId: number) => {
    if (!targetIncidentForCandidate) return;
    try {
      await api.assignResponder(targetIncidentForCandidate.id, responderId);
      setCandidateEvaluation(null);
      setTargetIncidentForCandidate(null);
      await refreshData();
    } catch (err: any) {
      alert(`Assignment error: ${err.message}`);
    }
  };

  // Dynamic factor updates
  const handleUpdateDynamicFactors = async (incidentId: number, data: any) => {
    const res = await api.updateDynamicFactors(incidentId, data);
    await refreshData();
    return res;
  };

  // Create incident
  const handleCreateIncident = async (data: any) => {
    await api.createIncident(data);
    await refreshData();
  };

  // Resolve incident
  const handleResolveIncident = async (incidentId: number) => {
    if (window.confirm('Mark incident as RESOLVED and demobilize assigned units?')) {
      await api.resolveIncident(incidentId);
      await refreshData();
      if (selectedIncidentDetail?.id === incidentId) {
        setSelectedIncidentDetail(null);
      }
    }
  };

  const unassignedCount = allocationPlan?.unassigned_incidents.length || 0;

  // When switching to user role, clear any detail views
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setSelectedIncidentDetail(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased tactical-grid">
      {/* 1. Header */}
      <Header
        systemStatus={allocationPlan?.system_status || 'OPERATIONAL'}
        notifications={notifications}
        onOpenIntake={() => role === 'admin' ? setIsIntakeOpen(true) : undefined}
        onResetDemo={handleResetDemo}
        isResetting={isResetting}
        role={role}
      />

      {/* 2. Navigation Bar with Role Toggle */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setSelectedIncidentDetail(null);
          setCurrentTab(tab);
        }}
        unassignedCount={unassignedCount}
        role={role}
        onRoleChange={handleRoleChange}
      />

      {/* 3. Main Operational Content */}
      <main className="flex-1 pb-16">
        {/* ────────── USER MODE ────────── */}
        {role === 'user' && (
          <UserPanel
            incidents={incidents}
            onSubmitIncident={handleCreateIncident}
          />
        )}

        {/* ────────── ADMIN MODE ────────── */}
        {role === 'admin' && (
          <>
            {selectedIncidentDetail ? (
              <IncidentDetailView
                incident={selectedIncidentDetail}
                onBack={() => setSelectedIncidentDetail(null)}
                onOpenDynamicFactors={(inc) => setDynamicFactorIncident(inc)}
                onResolveIncident={handleResolveIncident}
              />
            ) : (
              <>
                {currentTab === 'command' && (
                  <CommandCenter
                    incidents={incidents}
                    responders={responders}
                    allocationPlan={allocationPlan}
                    situationBriefing={situationBriefing}
                    onOpenReallocation={() => setIsReallocationOpen(true)}
                    onOpenDynamicFactors={(inc) => setDynamicFactorIncident(inc)}
                    onEvaluateCandidate={handleEvaluateCandidate}
                    onViewIncidentDetail={(inc) => setSelectedIncidentDetail(inc)}
                    onResolveIncident={handleResolveIncident}
                  />
                )}
                {currentTab === 'simulation' && <DecisionSimulator />}
                {currentTab === 'matrix' && <CapabilityMatrixPage />}
                {currentTab === 'analytics' && <AnalyticsHeatmapPage />}
                {currentTab === 'audit' && <AuditTrailPage />}
              </>
            )}
          </>
        )}
      </main>

      {/* 4. Global Modals (Admin-only) */}
      <ReallocationModal
        isOpen={isReallocationOpen}
        onClose={() => setIsReallocationOpen(false)}
        options={allocationPlan?.reallocation_proposals || []}
        onExecuteOption={handleExecuteOption}
      />

      <IncidentIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onSubmitIncident={handleCreateIncident}
      />

      <DynamicFactorModal
        isOpen={dynamicFactorIncident !== null}
        onClose={() => setDynamicFactorIncident(null)}
        incident={dynamicFactorIncident}
        onUpdateFactors={handleUpdateDynamicFactors}
      />

      <CandidateScoreModal
        isOpen={candidateEvaluation !== null}
        onClose={() => {
          setCandidateEvaluation(null);
          setTargetIncidentForCandidate(null);
        }}
        evaluation={candidateEvaluation}
        onConfirmAssignment={handleConfirmAssignment}
      />
    </div>
  );
}

export default App;
