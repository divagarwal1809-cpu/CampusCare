import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert, 
  Zap, 
  Users, 
  PhoneCall, 
  UserCheck
} from 'lucide-react';
import { ReallocationOption } from '../types';

interface ReallocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ReallocationOption[];
  onExecuteOption: (option: ReallocationOption) => Promise<void>;
  isExecuting?: boolean;
}

export const ReallocationModal: React.FC<ReallocationModalProps> = ({
  isOpen,
  onClose,
  options,
  onExecuteOption,
  isExecuting = false,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    options[0]?.option_id || ''
  );
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecute = async (opt: ReallocationOption) => {
    try {
      await onExecuteOption(opt);
      setExecutionMessage(`Option executed: ${opt.title}`);
      setTimeout(() => {
        setExecutionMessage(null);
        onClose();
      }, 1500);
    } catch (e: any) {
      alert(`Error executing option: ${e.message}`);
    }
  };

  const getOptionIcon = (type: string) => {
    switch (type) {
      case 'REALLOCATE':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'CROSS_TRAINED':
        return <Users className="w-4 h-4 text-cyan-400" />;
      case 'EXTERNAL':
        return <PhoneCall className="w-4 h-4 text-emerald-400" />;
      case 'ESCALATE':
      default:
        return <UserCheck className="w-4 h-4 text-violet-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-white to-amber-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-600">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <span>Multi-Incident Decision & Reallocation Center</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                  Critical Shortage
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Resource Crunch Protocol: Reasoning about competing emergencies & calculating trade-offs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Summary Banner */}
        <div className="bg-rose-50 border-b border-rose-100 p-3 sm:px-6 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-rose-800 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>NO MEDICAL TEAM CURRENTLY AVAILABLE FOR INCIDENT #105 (PRIORITY 95)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            <span>Active: MED-1 ➔ #101 (91)</span>
            <span>Active: MED-2 ➔ #104 (82)</span>
          </div>
        </div>

        {/* Execution Success Message */}
        {executionMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-3 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{executionMessage}</span>
          </div>
        )}

        {/* Options List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-slate-500 font-medium">
            CampusCare evaluated all operational parameters. Select an optimized resolution strategy below:
          </p>

          <div className="space-y-3">
            {options.map((opt) => {
              const isSelected = selectedOptionId === opt.option_id;
              return (
                <div
                  key={opt.option_id}
                  onClick={() => setSelectedOptionId(opt.option_id)}
                  className={`p-4 rounded-2xl border-2 transition cursor-pointer relative ${
                    isSelected
                      ? 'bg-sky-50/80 border-sky-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Recommended Badge */}
                  {opt.recommended && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                      Recommended
                    </span>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                      {getOptionIcon(opt.action_type)}
                    </div>
                    <div className="flex-1 pr-16 sm:pr-24">
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        {opt.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {opt.description}
                      </p>

                      {/* Trade-off Calculation: Impact vs Benefit */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-2.5">
                          <span className="font-extrabold text-rose-700 uppercase text-[10px] tracking-wider block mb-0.5">
                            Operational Impact:
                          </span>
                          <span className="text-slate-600 leading-snug">{opt.impact}</span>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5">
                          <span className="font-extrabold text-emerald-700 uppercase text-[10px] tracking-wider block mb-0.5">
                            Operational Benefit:
                          </span>
                          <span className="text-slate-600 leading-snug">{opt.benefit}</span>
                        </div>
                      </div>

                      {/* Action Button inside option */}
                      <div className="mt-3 flex items-center justify-between pt-2">
                        <span className="text-[11px] font-mono text-slate-500">
                          {opt.net_priority_gain > 0 && (
                            <span className="text-emerald-700 font-bold">
                              Net Priority Gain: +{opt.net_priority_gain}
                            </span>
                          )}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExecute(opt);
                          }}
                          disabled={isExecuting}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition transform active:scale-95"
                        >
                          <span>Execute This Strategy</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">Decisions recorded to tamper-evident audit ledger</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition shadow-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
