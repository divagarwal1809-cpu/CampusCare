import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { api } from '../api/client';
import { PriorityBadge, PriorityDial } from '../components/PriorityBadge';
import { SLATimerBar } from '../components/SLATimerBar';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  FileCheck2, 
  Share2, 
  Radio, 
  Activity, 
  AlertTriangle,
  Sliders,
  CheckCircle,
  FileText
} from 'lucide-react';

interface IncidentDetailViewProps {
  incident: Incident;
  onBack: () => void;
  onOpenDynamicFactors: (incident: Incident) => void;
  onResolveIncident: (incidentId: number) => void;
}

export const IncidentDetailView: React.FC<IncidentDetailViewProps> = ({
  incident,
  onBack,
  onOpenDynamicFactors,
  onResolveIncident,
}) => {
  const [detail, setDetail] = useState<any>(null);
  const [postReview, setPostReview] = useState<any>(null);
  const [showAARModal, setShowAARModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await api.getIncidentDetail(incident.id);
        setDetail(data);
      } catch (err) {
        console.error('Error fetching detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [incident.id]);

  const loadPostIncidentReview = async () => {
    try {
      const data = await api.getPostIncidentReview(incident.id);
      setPostReview(data);
      setShowAARModal(true);
    } catch (err) {
      alert('Could not generate post-incident review');
    }
  };

  if (loading || !detail) {
    return (
      <div className="p-8 lg:p-16 text-center">
        <div className="inline-flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-8 py-5">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-500" />
          <span className="text-slate-300 text-xs font-medium">Loading operational telemetry for <strong className="text-sky-400">{incident.code}</strong>...</span>
        </div>
      </div>
    );
  }

  const { incident: inc, operational_sop, correlations, dependency_tree, active_assignments, events } = detail;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto page-enter">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Command Queue</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenDynamicFactors(inc)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulate Dynamic Factors</span>
          </button>

          <button
            onClick={loadPostIncidentReview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-950 text-sky-300 border border-sky-800 hover:bg-sky-900 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Post-Incident Review (AAR)</span>
          </button>

          {inc.status !== 'RESOLVED' && (
            <button
              onClick={() => onResolveIncident(inc.id)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
            >
              Resolve Incident
            </button>
          )}
        </div>
      </div>

      {/* Main Incident Dossier Header */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-base font-bold text-sky-400 bg-sky-950 px-3 py-1 rounded-lg border border-sky-800">
              {inc.code}
            </span>
            <PriorityBadge level={inc.priority_level} score={inc.priority_score} size="md" />
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {inc.category}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
              inc.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
              inc.status === 'ON_SCENE' || inc.status === 'DISPATCHED' ? 'bg-sky-950 text-sky-300 border-sky-800' :
              'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {inc.status.replace('_', ' ')}
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Escalation Tier: <strong className="text-white">Level {inc.escalation_level}</strong>
          </div>
        </div>

        <div className="flex items-start gap-5">
          {/* Large Priority Dial — 1-10 scale */}
          <div className="shrink-0 text-center">
            <PriorityDial
              scale10={inc.priority_scale_10 ?? Math.max(1, Math.min(10, Math.round(inc.priority_score / 10)))}
              level={inc.priority_level}
              size="xl"
            />
            <div className="text-[10px] text-slate-500 mt-1.5 font-bold tracking-wider">PRIORITY</div>
            <div className="text-[10px] text-slate-600">{inc.priority_score}/100</div>
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-white">{inc.title}</h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed font-normal">
              {inc.description}
            </p>
          </div>
        </div>

        {/* Location & Reporter Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-slate-300 border-t border-slate-800/80">
          <div>
            <span className="text-slate-500 font-medium block">Campus Location</span>
            <span className="font-semibold text-white">📍 {inc.location_name}</span>
            <span className="text-[11px] text-slate-400 block">{inc.building} - {inc.floor}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Casualties & Impact</span>
            <span className="font-semibold text-white">{inc.people_affected} person(s) affected</span>
            <span className="text-[11px] text-slate-400 block">Severity rating: {inc.severity} / 5</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Reporter Information</span>
            <span className="font-semibold text-white">{inc.reporter_name}</span>
            <span className="text-[11px] text-slate-400 font-mono block">Contact: {inc.reporter_contact}</span>
          </div>
        </div>

        {/* SLA Response Timer */}
        <div className="pt-2">
          <SLATimerBar
            createdAt={inc.created_at}
            targetMinutes={inc.sla_target_minutes}
            delayedMinutes={inc.delayed_minutes}
            status={inc.status}
            resolvedAt={inc.resolved_at}
          />
        </div>
      </div>

      {/* Grid: SOP & Cordon vs Dependencies & Correlations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Operational SOP & Cordon Protocol */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Standard Operating Procedures (SOP)</span>
            </h3>
            <span className="text-[10px] font-mono text-sky-400 font-bold px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
              Cordon: {operational_sop?.cordon_radius_meters}m Perimeter
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Dispatcher Action Checklist:</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {operational_sop?.dispatcher_sop_checklist.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-sky-400 font-bold shrink-0 mt-0.5">{idx + 1}.</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Public Advisory Broadcast Template */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Public Safety Audio / App Broadcast:
            </span>
            <p className="text-slate-200 italic font-mono text-[11px] leading-relaxed">
              "{operational_sop?.public_broadcast_template}"
            </p>
          </div>
        </div>

        {/* Right: Dependencies & Spatiotemporal Correlations */}
        <div className="space-y-6">
          {/* Cascading Dependency Tree */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-violet-400" />
                <span>Incident Dependency & Cascades</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Hierarchy Graph</span>
            </div>

            <p className="text-[11px] text-slate-400">
              Tracks secondary cascading incidents caused by root failures (e.g. Electrical Short ➔ Power Failure ➔ Elevator Trap):
            </p>

            {dependency_tree?.tree ? (
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                <div className={`p-2 rounded ${dependency_tree.tree.is_target ? 'bg-sky-950 text-sky-300 border border-sky-800 font-bold' : 'text-slate-300'}`}>
                  Primary: {dependency_tree.tree.code} ({dependency_tree.tree.title})
                </div>
                {dependency_tree.tree.children?.map((c1: any) => (
                  <div key={c1.id} className="ml-4 pl-3 border-l-2 border-slate-700 space-y-1">
                    <div className={`p-1.5 rounded ${c1.is_target ? 'bg-sky-950 text-sky-300 border border-sky-800 font-bold' : 'text-slate-300'}`}>
                      ↳ Secondary: {c1.code} ({c1.title})
                    </div>
                    {c1.children?.map((c2: any) => (
                      <div key={c2.id} className="ml-4 pl-3 border-l-2 border-slate-700">
                        <div className={`p-1 rounded ${c2.is_target ? 'bg-sky-950 text-sky-300 border border-sky-800 font-bold' : 'text-slate-300'}`}>
                          ↳ Tertiary: {c2.code} ({c2.title})
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-2">No cascading dependencies logged.</div>
            )}
          </div>

          {/* Spatiotemporal Cluster Correlations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>Spatial & Temporal Correlations</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">350m Proximity Radius</span>
            </div>

            {correlations?.has_correlations ? (
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 leading-relaxed font-medium">
                  {correlations.advisory_note}
                </div>
                <div className="space-y-1.5">
                  {correlations.correlated_incidents.map((c: any) => (
                    <div key={c.incident_id} className="p-2 rounded bg-slate-950 border border-slate-800 text-xs flex justify-between items-center text-slate-300">
                      <div>
                        <strong className="text-white">{c.code}</strong>: {c.title}
                        <div className="text-[10px] text-slate-400">{c.location_name}</div>
                      </div>
                      <div className="text-right text-[11px] font-mono text-sky-400">
                        {c.distance_meters}m away
                        <div className="text-[10px] text-slate-500">~{c.time_diff_minutes}m apart</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No active spatiotemporal clusters detected within immediate proximity.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dispatched Responders with Explainable Reasoning */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Assigned Field Units</span>
        </h3>

        {active_assignments.length === 0 ? (
          <div className="p-4 text-center text-xs text-rose-400 font-medium bg-rose-950/20 border border-rose-900/50 rounded-lg">
            No responder assigned yet. Resource allocation required.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active_assignments.map((asgn: any) => (
              <div key={asgn.assignment_id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white text-sm">{asgn.responder_name}</div>
                  <span className="font-mono text-xs text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {asgn.match_score}% Match
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Unit Code: <strong className="text-slate-200">{asgn.responder_code}</strong> | Team: {asgn.primary_team}
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Assignment Justification:</span>
                  <ul className="space-y-1 text-slate-300">
                    {asgn.reasoning?.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px]">
                        <span className="text-emerald-400 shrink-0">✓</span>
                        <span>{r.replace(/^[✓•⚠]\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-Time Operational Event Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          <span>Incident Operational Event Log</span>
        </h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {events.map((e: any) => (
            <div key={e.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-start justify-between gap-3">
              <div>
                <span className="font-bold text-sky-300 font-mono text-[11px]">{e.event_type}</span>
                <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">{e.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 font-mono">{new Date(e.timestamp).toLocaleTimeString()}</span>
                <span className="text-[10px] text-slate-500 block font-medium">{e.actor}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Incident Review (AAR) Modal */}
      {showAARModal && postReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">After Action Report (AAR)</h3>
              </div>
              <button onClick={() => setShowAARModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
              <div className="text-sm font-bold text-white">{postReview.title} ({postReview.incident_code})</div>
              <p className="text-slate-300 leading-relaxed">{postReview.what_happened}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Initial Response</span>
                <span className="text-sm font-bold text-white font-mono">{postReview.response_time_minutes}m</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Target SLA</span>
                <span className="text-sm font-bold text-sky-400 font-mono">{postReview.sla_target_minutes}m</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">Total Duration</span>
                <span className="text-sm font-bold text-white font-mono">{postReview.resolution_time_minutes}m</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">SLA Met</span>
                <span className={`text-sm font-bold ${postReview.sla_targets_met ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {postReview.sla_targets_met ? 'YES' : 'BREACHED'}
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <span className="font-bold text-slate-300 text-xs">Key Operational Lessons Learned:</span>
              <ul className="space-y-1.5 text-slate-300">
                {postReview.key_lessons?.map((l: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 bg-slate-950 p-2 rounded border border-slate-800/80">
                    <span className="text-sky-400">💡</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAARModal(false)}
                className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
