import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface SLATimerBarProps {
  createdAt: string;
  targetMinutes: number;
  delayedMinutes?: number;
  status?: string;
  resolvedAt?: string;
}

export const SLATimerBar: React.FC<SLATimerBarProps> = ({
  createdAt,
  targetMinutes,
  delayedMinutes = 0,
  status,
  resolvedAt,
}) => {
  const [elapsedSec, setElapsedSec] = useState<number>(0);

  useEffect(() => {
    const calc = () => {
      const created = new Date(createdAt).getTime();
      const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
      const diff = Math.max(0, Math.floor((end - created) / 1000) + (delayedMinutes * 60));
      setElapsedSec(diff);
    };

    calc();
    if (!resolvedAt && status !== 'RESOLVED' && status !== 'CLOSED') {
      const timer = setInterval(calc, 1000);
      return () => clearInterval(timer);
    }
  }, [createdAt, delayedMinutes, resolvedAt, status]);

  const targetSec = (targetMinutes || 15) * 60;
  const percent = Math.min(100, Math.round((elapsedSec / targetSec) * 100));
  const isBreached = elapsedSec > targetSec;

  const elapsedM = Math.floor(elapsedSec / 60);
  const elapsedS = elapsedSec % 60;
  const formattedElapsed = `${elapsedM}m ${elapsedS < 10 ? '0' : ''}${elapsedS}s`;

  // Color progress bar
  let barColor = 'bg-emerald-500';
  if (percent >= 85 || isBreached) {
    barColor = 'bg-rose-500';
  } else if (percent >= 50) {
    barColor = 'bg-amber-400';
  }

  return (
    <div className="w-full text-xs">
      <div className="flex items-center justify-between mb-1 text-[11px]">
        <div className="flex items-center gap-1 text-slate-600 font-semibold">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Response Target</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className={isBreached ? 'text-rose-600 font-bold' : 'text-slate-800 font-semibold'}>
            {formattedElapsed}
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500">{targetMinutes}m</span>
          <span className="text-slate-600 font-bold ml-1">({percent}%)</span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative">
        <div
          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Overdue alert text */}
      {isBreached && (
        <div className="flex items-center gap-1 mt-1 text-[10px] text-rose-600 font-bold animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          <span>⚠ Response target exceeded — Escalation advised</span>
        </div>
      )}
    </div>
  );
};
