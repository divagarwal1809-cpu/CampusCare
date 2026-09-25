import React from 'react';
import { ResourcePressureItem } from '../types';
import { Stethoscope, Flame, Shield, Wrench, AlertCircle } from 'lucide-react';

interface ResourcePressureMetersProps {
  pressure: Record<string, ResourcePressureItem>;
}

export const ResourcePressureMeters: React.FC<ResourcePressureMetersProps> = ({
  pressure,
}) => {
  const getIcon = (team: string) => {
    switch (team.toLowerCase()) {
      case 'medical':
        return <Stethoscope className="w-3.5 h-3.5 text-rose-400" />;
      case 'fire':
        return <Flame className="w-3.5 h-3.5 text-amber-400" />;
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-sky-400" />;
      default:
        return <Wrench className="w-3.5 h-3.5 text-violet-400" />;
    }
  };

  const teams = Object.keys(pressure);

  return (
    <div className="bento-card p-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
          <span>Resource Pressure</span>
        </h3>
        <span className="text-[10px] text-slate-500 font-mono font-medium">Live Roster Capacity</span>
      </div>

      <div className="space-y-3">
        {teams.length === 0 ? (
          <div className="text-xs text-slate-400 py-2">Loading resource meters...</div>
        ) : (
          teams.map((team) => {
            const data = pressure[team];
            const pct = data.percent_used;
            const isFull = data.available === 0 && data.total > 0;

            let barColor = 'bg-sky-600';
            if (isFull) {
              barColor = 'bg-rose-600';
            } else if (pct >= 70) {
              barColor = 'bg-amber-500';
            }

            return (
              <div key={team} className="text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    {getIcon(team)}
                    <span>{team}</span>
                    {isFull && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase tracking-widest animate-pulse">
                        SATURATED
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-slate-600">
                    <span className="font-bold text-slate-900">{data.used}</span>
                    <span className="text-slate-400"> / {data.total} deployed</span>
                    <span className="text-slate-700 font-extrabold ml-1.5">({pct}%)</span>
                  </div>
                </div>

                {/* Progress bar track */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
