import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { CapabilityRow } from '../types';
import { Grid3X3, Check, X, Shield, RefreshCw, Zap, Users } from 'lucide-react';

export const CapabilityMatrixPage: React.FC = () => {
  const [matrix, setMatrix] = useState<CapabilityRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const data = await api.getCapabilityMatrix();
      setMatrix(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, []);

  const toggleAvailability = async (id: number, currentAvail: boolean) => {
    try {
      await api.updateResponderStatus(id, { is_available: !currentAvail });
      fetchMatrix();
    } catch (err) {
      alert('Could not update responder availability');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
              <Grid3X3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white">Responder Capability Matrix</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Multi-disciplinary cross-training matrix enabling intelligent fallback dispatch when specialized units are exhausted.
          </p>
        </div>

        <button
          onClick={fetchMatrix}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Matrix</span>
        </button>
      </div>

      {/* Special Feature Highlight Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-800/60 flex items-start sm:items-center gap-3">
        <div className="p-2 rounded-lg bg-sky-500/20 text-sky-300 shrink-0">
          <Zap className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-300">
          <strong className="text-white">Cross-Training Intelligence Active: </strong>
          When single-specialty teams are 100% saturated, CampusCare automatically matches multi-certified units (e.g.{' '}
          <span className="font-bold text-sky-300">Team D</span> holding both Medical & Security credentials) to prevent unassigned bottlenecks.
        </div>
      </div>

      {/* Capability Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Unit Code & Name</th>
                <th className="py-3.5 px-3">Primary Team</th>
                <th className="py-3.5 px-3 text-center">Medical</th>
                <th className="py-3.5 px-3 text-center">Fire</th>
                <th className="py-3.5 px-3 text-center">Security</th>
                <th className="py-3.5 px-3 text-center">Technical</th>
                <th className="py-3.5 px-3 text-center">First Aid</th>
                <th className="py-3.5 px-3 text-center">Crowd Control</th>
                <th className="py-3.5 px-3 text-center">Workload</th>
                <th className="py-3.5 px-4 text-center">Status / Duty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && matrix.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    Loading capability telemetry...
                  </td>
                </tr>
              ) : (
                matrix.map((row) => {
                  const isCrossTrained = (row.medical && row.security) || (row.fire && row.technical);

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isCrossTrained ? 'bg-sky-950/15' : ''
                      }`}
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="font-mono text-sky-400">{row.code}</span>
                          <span>{row.name}</span>
                          {isCrossTrained && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-sky-900 text-sky-300 border border-sky-600/50 uppercase">
                              Cross-Trained
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Primary Team */}
                      <td className="py-3.5 px-3 font-medium text-slate-300">
                        {row.primary_team}
                      </td>

                      {/* Capabilities Checkmarks */}
                      <td className="py-3.5 px-3 text-center">
                        {row.medical ? (
                          <span className="inline-flex p-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {row.fire ? (
                          <span className="inline-flex p-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {row.security ? (
                          <span className="inline-flex p-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {row.technical ? (
                          <span className="inline-flex p-1 rounded-full bg-violet-950 text-violet-400 border border-violet-800">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {row.first_aid ? (
                          <span className="inline-flex p-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {row.crowd_control ? (
                          <span className="inline-flex p-1 rounded-full bg-sky-950 text-sky-400 border border-sky-800">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Workload */}
                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="font-bold text-white">{row.current_workload}</span>
                        <span className="text-slate-500"> / {row.max_workload}</span>
                      </td>

                      {/* Status / Duty Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleAvailability(row.id, row.is_available)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                            row.is_available
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/50 hover:bg-emerald-900'
                              : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {row.is_available ? 'AVAILABLE' : 'OFF DUTY'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
