import React from "react";
import { X, ShieldCheck, Check } from "lucide-react";
import { CandidateEvaluation } from "../types";

interface CandidateScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: CandidateEvaluation | null;
  onConfirmAssignment: (responderId: number) => void;
  isAssigning?: boolean;
}

export const CandidateScoreModal: React.FC<CandidateScoreModalProps> = ({
  isOpen, onClose, evaluation, onConfirmAssignment, isAssigning = false,
}) => {
  if (!isOpen || !evaluation) return null;
  const { breakdown } = evaluation;
  const factors = [
    { label: "Skill Compatibility (40%)", score: breakdown.skill_score, max: 40 },
    { label: "Distance / Proximity (20%)", score: breakdown.distance_score, max: 20 },
    { label: "Current Workload (15%)", score: breakdown.workload_score, max: 15 },
    { label: "Unit Availability (10%)", score: breakdown.availability_score, max: 10 },
    { label: "Historical Response Time (10%)", score: breakdown.response_time_score, max: 10 },
    { label: "Priority Compatibility (5%)", score: breakdown.priority_score, max: 5 },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 bg-gradient-to-r from-sky-50 via-white to-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 border border-sky-200 text-sky-600"><ShieldCheck className="w-5 h-5" /></div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Intelligent Assignment Evaluation</h3>
              <p className="text-xs text-slate-500">Deterministic scoring & operational reasoning</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-600 tracking-wider">Recommended Responder</span>
              <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{evaluation.responder_name}</h4>
              <p className="text-xs text-slate-500">Unit Code: <span className="font-mono text-slate-800">{evaluation.responder_code}</span> | Distance: <span className="text-slate-800 font-semibold">{evaluation.distance_km} km</span> (~{evaluation.eta_minutes} min ETA)</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-600 font-mono">{evaluation.match_score}</span>
              <span className="text-xs text-slate-400 font-mono block">/ 100 Match</span>
            </div>
          </div>
          <div className="space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">Score Factor Decomposition</h5>
            {factors.map((f, i) => {
              const pct = Math.round((f.score / f.max) * 100);
              return (
                <div key={i} className="text-xs">
                  <div className="flex justify-between mb-1 text-[11px]">
                    <span className="text-slate-600">{f.label}</span>
                    <span className="font-mono font-semibold text-slate-800">{f.score} / {f.max} pts</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full transition-all duration-500" style={{ width: pct + "%" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2 border-t border-slate-100">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Why this unit was recommended:</h5>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {evaluation.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                  <span className="text-emerald-600 shrink-0 mt-0.5">✓</span>
                  <span>{r.replace(/^[\u2713\u2022\u26A0]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium transition">Close</button>
          <button onClick={() => onConfirmAssignment(evaluation.responder_id)} disabled={isAssigning} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition">
            <Check className="w-4 h-4" /><span>Confirm & Dispatch Responder</span>
          </button>
        </div>
      </div>
    </div>
  );
};
