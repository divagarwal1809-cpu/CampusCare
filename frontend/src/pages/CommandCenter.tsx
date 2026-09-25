import React, { useState } from 'react';
import {
  Incident,
  Responder,
  AllocationPlan,
} from '../types';
import { TacticalMap } from '../components/TacticalMap';
import { PriorityBadge, PriorityDial } from '../components/PriorityBadge';
import { SLATimerBar } from '../components/SLATimerBar';
import { ResourcePressureMeters } from '../components/ResourcePressureMeters';
import { UrgentAlertBanner } from '../components/UrgentAlertBanner';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  Sliders,
  ArrowUpRight,
  Sparkles,
  Shield,
  Activity,
  ChevronRight,
  ExternalLink,
  Users,
  Siren,
  Radio,
  BatteryCharging,
  Stethoscope,
  Flame,
  Wrench,
  Compass,
  Zap,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

interface CommandCenterProps {
  incidents: Incident[];
  responders: Responder[];
  allocationPlan: AllocationPlan | null;
  situationBriefing: any;
  onOpenReallocation: () => void;
  onOpenDynamicFactors: (incident: Incident) => void;
  onEvaluateCandidate: (incident: Incident) => void;
  onViewIncidentDetail: (incident: Incident) => void;
  onResolveIncident: (incidentId: number) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Medical: '🏥',
  Fire: '🔥',
  Security: '🔒',
  Technical: '⚡',
  Hazmat: '☢️',
  General: '📋',
};

export const CommandCenter: React.FC<CommandCenterProps> = ({
  incidents,
  responders,
  allocationPlan,
  situationBriefing,
  onOpenReallocation,
  onOpenDynamicFactors,
  onEvaluateCandidate,
  onViewIncidentDetail,
  onResolveIncident,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const activeIncidents = incidents.filter(
    (i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED'
  );

  const criticalCount = activeIncidents.filter((i) => i.priority_score >= 75).length;
  const highCount = activeIncidents.filter((i) => i.priority_score >= 50 && i.priority_score < 75).length;
  const medCount = activeIncidents.filter((i) => i.priority_score >= 25 && i.priority_score < 50).length;
  const lowCount = activeIncidents.filter((i) => i.priority_score < 25).length;

  const availableResponders = responders.filter((r) => r.is_available).length;
  const deployedResponders = responders.filter((r) => !r.is_available || r.current_workload > 0).length;
  const unassignedCount = allocationPlan?.unassigned_incidents.length || 0;

  // Highest priority incident for highlight widget
  const peakIncident = activeIncidents.slice().sort((a, b) => b.priority_score - a.priority_score)[0];

  // Team counts for readiness widget
  const medResponders = responders.filter(r => r.primary_team.toLowerCase() === 'medical');
  const fireResponders = responders.filter(r => r.primary_team.toLowerCase() === 'fire');
  const secResponders = responders.filter(r => r.primary_team.toLowerCase() === 'security');
  const techResponders = responders.filter(r => r.primary_team.toLowerCase() === 'technical');

  const filteredIncidents = activeIncidents.filter((inc) => {
    if (filterCategory === 'ALL') return true;
    return inc.category.toUpperCase() === filterCategory;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto page-enter">

      {/* ── 1. Wide Tactical Operations Strip (Bento Hero Tile) ── */}
      <div className="bento-card p-4 lg:p-5 bg-gradient-to-r from-white via-slate-50 to-sky-50/50 border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Operational Beacon */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-500/25 shrink-0">
              <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Campus EOC Operational Status
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  DEFCON 4 • ACTIVE MONITORING
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Spatial Telemetry synchronized across {responders.length} field units • Triage latency avg 4.2m • Zero systemic backlog
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              <span className="text-slate-500 font-medium">Frequency:</span>
              <span className="font-mono font-bold text-slate-800">462.550 MHz</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500 font-medium">SLA Compliance:</span>
              <span className="font-mono font-bold text-emerald-700">96.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Non-Uniform Bento Metric Boxes (4 Different Tile Types) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">

        {/* Tile Type A: Active Incidents + Segmented Severity Bar */}
        <div className="bento-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">
              <span>Active Incidents</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                {activeIncidents.length} Total
              </span>
            </div>
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {activeIncidents.length}
            </div>
          </div>

          {/* Stacked Colored Severity Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mb-1.5">
              <span>Severity Breakdown</span>
              <span className="font-mono">{criticalCount} Crit / {highCount} High</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 gap-0.5">
              <div
                className="bg-rose-500 transition-all duration-500"
                style={{ width: `${activeIncidents.length ? (criticalCount / activeIncidents.length) * 100 : 0}%` }}
                title={`Critical: ${criticalCount}`}
              />
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${activeIncidents.length ? (highCount / activeIncidents.length) * 100 : 0}%` }}
                title={`High: ${highCount}`}
              />
              <div
                className="bg-sky-500 transition-all duration-500"
                style={{ width: `${activeIncidents.length ? (medCount / activeIncidents.length) * 100 : 0}%` }}
                title={`Medium: ${medCount}`}
              />
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${activeIncidents.length ? (lowCount / activeIncidents.length) * 100 : 0}%` }}
                title={`Low: ${lowCount}`}
              />
            </div>
          </div>
        </div>

        {/* Tile Type B: Fleet Readiness Deck with Unit-Type Chips */}
        <div className="bento-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">
              <span>Fleet Readiness</span>
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 font-mono tracking-tight">
                {availableResponders}
              </span>
              <span className="text-sm font-bold text-slate-400 font-mono">
                / {responders.length} Units Ready
              </span>
            </div>
          </div>

          {/* Unit Type Breakdown Chips */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
            <span className="px-2 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-bold" title="Medical Teams">
              🏥 {medResponders.filter(r => r.is_available).length}/{medResponders.length}
            </span>
            <span className="px-2 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-bold" title="Fire Teams">
              🔥 {fireResponders.filter(r => r.is_available).length}/{fireResponders.length}
            </span>
            <span className="px-2 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-800 font-bold" title="Security Units">
              🛡️ {secResponders.filter(r => r.is_available).length}/{secResponders.length}
            </span>
            <span className="px-2 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-800 font-bold" title="Tech / Facilities">
              ⚡ {techResponders.filter(r => r.is_available).length}/{techResponders.length}
            </span>
          </div>
        </div>

        {/* Tile Type C: Triage Velocity & SLA Target Latency */}
        <div className="bento-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">
              <span>Triage Velocity</span>
              <Clock className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-sky-700 font-mono tracking-tight">
                4.2
              </span>
              <span className="text-sm font-bold text-slate-500">minutes avg</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Under 15m SLA Target</span>
            <span className="font-extrabold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +18% Speed
            </span>
          </div>
        </div>

        {/* Tile Type D: Peak Priority Threat Hotspot */}
        <div className="bento-card p-5 flex flex-col justify-between bg-gradient-to-br from-white to-rose-50/30 border-rose-200">
          <div>
            <div className="flex items-center justify-between text-rose-700 text-[11px] font-bold uppercase tracking-wider mb-2">
              <span>Peak Threat Hotspot</span>
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            </div>
            {peakIncident ? (
              <div className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <div className="font-extrabold text-slate-900 text-sm truncate">{peakIncident.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">📍 {peakIncident.location_name}</div>
                </div>
                <PriorityDial
                  scale10={peakIncident.priority_scale_10 ?? Math.max(1, Math.min(10, Math.round(peakIncident.priority_score / 10)))}
                  level={peakIncident.priority_level}
                  size="sm"
                />
              </div>
            ) : (
              <div className="text-sm font-bold text-emerald-700">All Quiet • No Escalations</div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-rose-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 font-medium">Unassigned Backlog:</span>
            <span className={`font-mono font-extrabold ${unassignedCount > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-700'}`}>
              {unassignedCount} waiting
            </span>
          </div>
        </div>

      </div>

      {/* ── 3. Urgent Alert Banner (Conditional) ── */}
      {allocationPlan && (
        <UrgentAlertBanner
          conflicts={allocationPlan.resource_conflicts}
          reallocationProposals={allocationPlan.reallocation_proposals}
          onOpenReallocation={onOpenReallocation}
        />
      )}

      {/* ── 4. AI Situation Briefing Tile ── */}
      {situationBriefing && (
        <div className="bento-card p-4 lg:p-5 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-white border-sky-200 flex flex-col md:flex-row md:items-center justify-between gap-4 slide-up">
          <div className="flex items-start md:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-extrabold text-sky-900 uppercase tracking-wider text-[11px]">
                  Automated Triage & Situation Briefing
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white text-sky-800 border border-sky-200">
                  REAL-TIME SYNTHESIS
                </span>
              </div>
              <p className="text-slate-700 text-xs leading-relaxed">{situationBriefing.summary_paragraph}</p>
            </div>
          </div>
          <div className="shrink-0 text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 shadow-xs">
            System State: <strong className="text-slate-900">{allocationPlan?.system_status || 'OPERATIONAL'}</strong>
          </div>
        </div>
      )}

      {/* ── 5. Spatial Telemetry & Resource Gauges (Bento Split Deck) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Architectural Map Tile */}
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              Campus Tactical Map & Spatial Telemetry
            </h2>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              📍 12.9720° N, 77.5945° E
            </span>
          </div>

          <TacticalMap
            incidents={activeIncidents}
            responders={responders}
            onSelectIncident={onViewIncidentDetail}
          />
        </div>

        {/* Right 1 Col: Pressure Gauges + Reallocation Shortcuts */}
        <div className="space-y-4">
          <ResourcePressureMeters pressure={allocationPlan?.resource_pressure || {}} />

          {allocationPlan?.reallocation_proposals && allocationPlan.reallocation_proposals.length > 0 && (
            <div className="bento-card p-4 space-y-3 bg-gradient-to-br from-white to-amber-50/30 border-amber-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-600" />
                  Decision Options Available
                </h4>
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                  {allocationPlan.reallocation_proposals.length} options
                </span>
              </div>
              <div className="space-y-2">
                {allocationPlan.reallocation_proposals.slice(0, 2).map((opt) => (
                  <div
                    key={opt.option_id}
                    onClick={onOpenReallocation}
                    className="p-3 rounded-xl bg-white border border-slate-200 hover:border-sky-500 cursor-pointer transition-all duration-200 text-xs space-y-1 shadow-xs hover:shadow-md"
                  >
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="truncate">{opt.title}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold truncate">
                      ↑ {opt.benefit.slice(0, 60)}...
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={onOpenReallocation}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <span>Inspect All Reallocation Proposals</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 6. Operational Priority Queue (Bento Incident Deck) ── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Siren className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Operational Priority Queue
            </h2>
            <span className="text-xs text-slate-500 font-mono font-semibold">({filteredIncidents.length} active)</span>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 sm:pb-0">
            {['ALL', 'MEDICAL', 'FIRE', 'SECURITY', 'TECHNICAL', 'HAZMAT'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full font-bold transition-all duration-200 whitespace-nowrap shadow-xs ${
                  filterCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {CATEGORY_ICONS[cat.charAt(0) + cat.slice(1).toLowerCase()] ?? ''} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Incident Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-children">
          {filteredIncidents.map((incident) => {
            const isUnassigned =
              allocationPlan?.unassigned_incidents.some((u) => u.incident_id === incident.id) ||
              (!incident.assigned_responder_names || incident.assigned_responder_names.length === 0);
            const isCritical = incident.priority_score >= 75;
            const isHigh = incident.priority_score >= 50 && incident.priority_score < 75;

            // Border accent color strip
            const stripColor = isCritical ? 'border-l-rose-500' : isHigh ? 'border-l-amber-500' : 'border-l-sky-500';

            return (
              <div
                key={incident.id}
                className={`bento-card border-l-4 ${stripColor} relative flex flex-col justify-between overflow-hidden`}
              >
                <div className="p-4 lg:p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-[11px] text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {incident.code}
                      </span>
                      <span className="text-xl">{CATEGORY_ICONS[incident.category] ?? '📋'}</span>
                      {incident.parent_incident_id && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                          Cascade
                        </span>
                      )}
                    </div>

                    {/* Prominent 1-10 Priority Dial */}
                    <PriorityDial
                      scale10={incident.priority_scale_10 ?? Math.max(1, Math.min(10, Math.round(incident.priority_score / 10)))}
                      level={incident.priority_level}
                      size="md"
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className="text-sm font-extrabold text-slate-900 hover:text-sky-600 cursor-pointer transition-colors duration-200 mb-1 leading-snug"
                    onClick={() => onViewIncidentDetail(incident)}
                  >
                    {incident.title}
                  </h3>

                  {/* Priority badge row */}
                  <div className="flex items-center gap-2 mb-2">
                    <PriorityBadge
                      level={incident.priority_level}
                      score={incident.priority_score}
                      size="sm"
                    />
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">Esc. Lvl {incident.escalation_level}</span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {incident.description}
                  </p>

                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {incident.location_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {incident.people_affected} affected
                    </span>
                    <span className="text-sky-700 font-bold">Req: {incident.required_team}</span>
                  </div>

                  {/* SLA Timer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <SLATimerBar
                      createdAt={incident.created_at}
                      targetMinutes={incident.sla_target_minutes}
                      delayedMinutes={incident.delayed_minutes}
                      status={incident.status}
                    />
                  </div>

                  {/* Assignment Status */}
                  <div className="mt-2.5 text-xs">
                    {incident.assigned_responder_names && incident.assigned_responder_names.length > 0 ? (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50/60 px-2.5 py-1 rounded-lg border border-emerald-100">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                        <span className="truncate">Assigned: {incident.assigned_responder_names.join(', ')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                        <span>Awaiting Response Dispatch</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="px-4 lg:px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenDynamicFactors(incident)}
                      title="Adjust dynamic factors to test priority recalculation"
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 shadow-xs transition-all duration-200 flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3 text-amber-500" />
                      <span>Factors</span>
                    </button>

                    <button
                      onClick={() => onEvaluateCandidate(incident)}
                      title="Run assignment engine to find best available responder"
                      className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold shadow-xs transition-all duration-200 flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Assign</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onResolveIncident(incident.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-[11px] font-bold border border-slate-200 shadow-xs transition-all duration-200"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => onViewIncidentDetail(incident)}
                      className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs transition-all duration-200"
                      title="Open full incident detail"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredIncidents.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm bento-card">
              <Shield className="w-8 h-8 mx-auto mb-3 text-slate-300" />
              No active incidents matching the selected category.
            </div>
          )}
        </div>
      </div>

      {/* ── 7. Brand New: Field Responder Fleet Deck (Transceiver Tiles) ── */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Field Responder Fleet Status & Telemetry
            </h2>
            <span className="text-xs text-slate-500 font-mono font-semibold">({responders.length} units deployed)</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            🟢 Ready: {availableResponders} | 🟡 En Route: {deployedResponders}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {responders.map((resp) => {
            const isAvail = resp.is_available;
            const statusColor = isAvail ? 'bg-emerald-500' : 'bg-amber-500';

            const teamEmoji = {
              Medical: '🏥',
              Fire: '🔥',
              Security: '🛡️',
              Technical: '⚡',
            }[resp.primary_team] || '📋';

            return (
              <div
                key={resp.id}
                className="bento-card p-3.5 space-y-2.5 hover:border-sky-300 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {resp.code}
                    </span>
                    <span className="text-xs">{teamEmoji}</span>
                    <span className="text-xs font-bold text-slate-700">{resp.primary_team}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAvail ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                    {resp.status}
                  </span>
                </div>

                {/* Responder Details */}
                <div>
                  <div className="text-xs font-extrabold text-slate-900 truncate">{resp.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Shift: <strong>{resp.shift}</strong></span>
                    <span className="flex items-center gap-1 font-mono text-emerald-600 font-semibold">
                      <BatteryCharging className="w-3 h-3" /> 96%
                    </span>
                  </div>
                </div>

                {/* Assignment or Standby */}
                <div className="text-[11px] pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500 truncate">
                    {resp.current_assignment_code ? (
                      <span className="font-bold text-sky-700">En route: {resp.current_assignment_code}</span>
                    ) : (
                      <span className="text-slate-400">Standby at station</span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    load: {resp.current_workload}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
