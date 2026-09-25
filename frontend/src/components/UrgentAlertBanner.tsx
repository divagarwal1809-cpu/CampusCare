import React from 'react';
import { AlertOctagon, ArrowRight, Zap, ShieldAlert } from 'lucide-react';
import { ReallocationOption } from '../types';

interface UrgentAlertBannerProps {
  conflicts: string[];
  reallocationProposals: ReallocationOption[];
  onOpenReallocation: () => void;
}

export const UrgentAlertBanner: React.FC<UrgentAlertBannerProps> = ({
  conflicts,
  reallocationProposals,
  onOpenReallocation,
}) => {
  if (conflicts.length === 0 && reallocationProposals.length === 0) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-amber-50 p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 shrink-0">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-800">
                Decision Alert: Critical Resource Exhaustion
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-rose-600 text-white uppercase tracking-wider shadow-xs">
                Action Required
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed font-medium">
              {conflicts[0] || 'Unassigned critical incident detected. No free dedicated responders available.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenReallocation}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition transform hover:-translate-y-0.5 active:translate-y-0 shrink-0"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Resolve Resource Crunch ({reallocationProposals.length} Options)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
