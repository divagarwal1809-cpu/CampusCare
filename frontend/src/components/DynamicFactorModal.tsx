import React, { useState } from 'react';
import { X, Flame, Users, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Incident } from '../types';

interface DynamicFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  onUpdateFactors: (
    incidentId: number,
    data: {
      people_affected?: number;
      smoke_spreading?: boolean;
      trapped_persons?: boolean;
      hazard_leak?: boolean;
      delayed_minutes?: number;
      severity?: number;
    }
  ) => Promise<any>;
}

export const DynamicFactorModal: React.FC<DynamicFactorModalProps> = ({
  isOpen,
  onClose,
  incident,
  onUpdateFactors,
}) => {
  if (!isOpen || !incident) return null;

  const [people, setPeople] = useState<number>(incident.people_affected || 1);
  const [smoke, setSmoke] = useState<boolean>(incident.smoke_spreading || false);
  const [trapped, setTrapped] = useState<boolean>(incident.trapped_persons || false);
  const [leak, setLeak] = useState<boolean>(incident.hazard_leak || false);
  const [delay, setDelay] = useState<number>(incident.delayed_minutes || 0);
  const [severity, setSeverity] = useState<number>(incident.severity || 3);
  const [isUpdating, setIsUpdating] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await onUpdateFactors(incident.id, {
        people_affected: Number(people),
        smoke_spreading: smoke,
        trapped_persons: trapped,
        hazard_leak: leak,
        delayed_minutes: Number(delay),
        severity: Number(severity),
      });
      setResult(res);
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Dynamic Condition Simulator</h3>
              <p className="text-[11px] text-slate-400">
                Adjust on-scene telemetry for {incident.code}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* People Affected Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                People Affected / Casualties:
              </span>
              <span className="font-mono font-bold text-sky-400">{people} people</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={people}
              onChange={(e) => setPeople(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>0 (None)</span>
              <span>10</span>
              <span>25</span>
              <span>50 (Mass surge)</span>
            </div>
          </div>

          {/* Severity scale */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-300">Severity Tier:</span>
              <span className="font-mono font-bold text-amber-400">{severity} / 5</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Delay Minutes */}
          <div>
            <div className="flex justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                Responder Delay Minutes:
              </span>
              <span className="font-mono font-bold text-rose-400">{delay} min elapsed</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Hazard & Environmental Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <span className="text-xs text-slate-200 font-medium flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Smoke / Flame Spreading
              </span>
              <input
                type="checkbox"
                checked={smoke}
                onChange={(e) => setSmoke(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer">
              <span className="text-xs text-slate-200 font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Trapped Persons Detected
              </span>
              <input
                type="checkbox"
                checked={trapped}
                onChange={(e) => setTrapped(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Result Alert if updated */}
          {result && (
            <div className="p-3 rounded-lg bg-sky-950/60 border border-sky-600/50 text-xs space-y-1">
              <div className="flex justify-between font-bold">
                <span className="text-sky-300">Recalculation Complete:</span>
                <span className="font-mono text-white">
                  {result.old_score} ➔ {result.new_score}
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Classification: <span className="font-bold">{result.old_level}</span> shifted to{' '}
                <span className="font-bold text-rose-400">{result.new_level}</span>.
                Triggering global resource reallocation check!
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>Recalculate Dynamic Priority</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
