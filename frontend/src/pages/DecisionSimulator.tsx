import React, { useState } from 'react';
import { api } from '../api/client';
import { SimulationResult } from '../types';
import { 
  Cpu, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Layers, 
  Sliders, 
  ShieldAlert,
  Flame,
  Stethoscope,
  Shield,
  Wrench
} from 'lucide-react';

export const DecisionSimulator: React.FC = () => {
  const [medicalCount, setMedicalCount] = useState<number>(1); // Reduced from 2 to 1 to demonstrate crunch!
  const [fireCount, setFireCount] = useState<number>(1);
  const [securityCount, setSecurityCount] = useState<number>(2);
  const [generalCount, setGeneralCount] = useState<number>(2);
  const [incidentSpike, setIncidentSpike] = useState<number>(0);
  const [allowCrossTraining, setAllowCrossTraining] = useState<boolean>(true);
  const [delayMultiplier, setDelayMultiplier] = useState<number>(1.0);

  const [loading, setLoading] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const handleRunSimulation = async (
    med = medicalCount,
    fire = fireCount,
    sec = securityCount,
    spike = incidentSpike,
    cross = allowCrossTraining
  ) => {
    setLoading(true);
    try {
      const res = await api.runSimulation({
        medical_teams_count: med,
        fire_teams_count: fire,
        security_teams_count: sec,
        general_teams_count: generalCount,
        incident_spike_count: spike,
        allow_cross_training: cross,
        delay_multiplier: delayMultiplier,
      });
      setSimulationResult(res);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Preset 1: The 10:32 PM Medical Crunch (Med reduced to 1)
  const applyPresetCrunch = () => {
    setMedicalCount(1);
    setFireCount(1);
    setSecurityCount(2);
    setIncidentSpike(0);
    setAllowCrossTraining(true);
    handleRunSimulation(1, 1, 2, 0, true);
  };

  // Preset 2: Severe Mass Surge (Incident Spike + 4)
  const applyPresetSurge = () => {
    setMedicalCount(2);
    setFireCount(1);
    setSecurityCount(2);
    setIncidentSpike(4);
    setAllowCrossTraining(true);
    handleRunSimulation(2, 1, 2, 4, true);
  };

  // Preset 3: Strict No-Cross-Training Stress Test
  const applyPresetStrict = () => {
    setMedicalCount(2);
    setFireCount(1);
    setSecurityCount(2);
    setIncidentSpike(1);
    setAllowCrossTraining(false);
    handleRunSimulation(2, 1, 2, 1, false);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white">Decision Simulation & What-If Studio</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test hypothetical resource capacities, simultaneous incident surges, and cross-training protocols in a risk-free sandbox.
          </p>
        </div>

        {/* Quick Scenario Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Presets:
          </span>
          <button
            onClick={applyPresetCrunch}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-600/50 hover:bg-rose-900 transition"
          >
            The 10:32 PM Crunch
          </button>
          <button
            onClick={applyPresetSurge}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/50 hover:bg-amber-900 transition"
          >
            Mass Surge (+4 Incidents)
          </button>
          <button
            onClick={applyPresetStrict}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
          >
            Disable Cross-Training
          </button>
        </div>
      </div>

      {/* Main Studio Grid: Parameters on Left, Before vs After on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: What-If Controls (1 Col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>What-If Scenario Controls</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Sandbox Inputs</span>
          </div>

          {/* Medical Teams Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-rose-400" />
                Medical Units Available:
              </span>
              <span className="font-mono font-bold text-rose-400">{medicalCount} Team(s)</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={medicalCount}
              onChange={(e) => setMedicalCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0</span>
              <span>1 (Critical shortage)</span>
              <span>2 (Normal)</span>
              <span>5</span>
            </div>
          </div>

          {/* Fire Teams Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Fire Teams Available:
              </span>
              <span className="font-mono font-bold text-amber-400">{fireCount} Team(s)</span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              value={fireCount}
              onChange={(e) => setFireCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Security Teams Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400" />
                Security Teams Available:
              </span>
              <span className="font-mono font-bold text-sky-400">{securityCount} Team(s)</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              value={securityCount}
              onChange={(e) => setSecurityCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Incident Spike Surge */}
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span className="text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />
                Simulated Incident Surge:
              </span>
              <span className="font-mono font-bold text-violet-400">+{incidentSpike} Incidents</span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              value={incidentSpike}
              onChange={(e) => setIncidentSpike(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
            />
          </div>

          {/* Cross-training toggle */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700">
              <span className="text-xs font-semibold text-slate-200">
                Allow Cross-Trained Responders (e.g. Team D)
              </span>
              <input
                type="checkbox"
                checked={allowCrossTraining}
                onChange={(e) => setAllowCrossTraining(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 bg-slate-900 border-slate-700 cursor-pointer"
              />
            </label>
          </div>

          {/* Run Button */}
          <button
            onClick={() => handleRunSimulation()}
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-600/30 transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate Entire Response Plan</span>
          </button>
        </div>

        {/* Right Column: Side-by-Side Comparison (2 Cols) */}
        <div className="lg:col-span-2 space-y-5">
          {!simulationResult ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
              <Cpu className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-300">Simulation Ready</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Adjust resource controls on the left or select a preset to evaluate before-and-after allocations in real-time.
              </p>
              <button
                onClick={() => handleRunSimulation()}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950"
              >
                Run Baseline Simulation
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Key Findings Card */}
              <div className="p-4 rounded-xl bg-slate-900 border border-sky-900/60 shadow-lg space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                  Automated Decision Engine Findings:
                </span>
                <ul className="space-y-1.5 text-xs">
                  {simulationResult.key_findings.map((f, i) => (
                    <li key={i} className="text-slate-200 leading-relaxed flex items-start gap-2">
                      <span className="text-sky-400 shrink-0">👉</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Side-by-Side Cards: Current vs Simulated */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. CURRENT PLAN */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      CURRENT PLAN (BASELINE)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                      Live Roster
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Assigned</span>
                      <span className="text-xl font-mono font-bold text-emerald-400">
                        {simulationResult.current_plan.assigned_count}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Unassigned</span>
                      <span className="text-xl font-mono font-bold text-rose-400">
                        {simulationResult.current_plan.unassigned_count}
                      </span>
                    </div>
                  </div>

                  {/* Unassigned list in current plan */}
                  <div className="text-xs space-y-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Unassigned Incidents:
                    </span>
                    {simulationResult.current_plan.unassigned_incidents.length === 0 ? (
                      <p className="text-[11px] text-emerald-400 italic">None (Fully Covered)</p>
                    ) : (
                      simulationResult.current_plan.unassigned_incidents.map((u: any) => (
                        <div key={u.incident_id} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-rose-300">
                          {u.incident_code}: {u.incident_title}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. SIMULATED PLAN */}
                <div className="bg-slate-900 border border-sky-500/40 rounded-xl p-4 space-y-3 shadow-lg shadow-sky-950/40">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                      SIMULATED PLAN (HYPOTHETICAL)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-sky-950 text-sky-300 border border-sky-800">
                      Tested Parameters
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Assigned</span>
                      <span className="text-xl font-mono font-bold text-emerald-400">
                        {simulationResult.simulated_plan.assigned_count}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Unassigned</span>
                      <span className={`text-xl font-mono font-bold ${
                        simulationResult.simulated_plan.unassigned_count > 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {simulationResult.simulated_plan.unassigned_count}
                      </span>
                    </div>
                  </div>

                  {/* Unassigned list in simulated plan */}
                  <div className="text-xs space-y-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Simulated Unassigned Incidents:
                    </span>
                    {simulationResult.simulated_plan.unassigned_incidents.length === 0 ? (
                      <p className="text-[11px] text-emerald-400 italic">None (100% Resolved)</p>
                    ) : (
                      simulationResult.simulated_plan.unassigned_incidents.map((u: any) => (
                        <div key={u.incident_id} className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-[11px] text-rose-300 font-medium">
                          ⚠ {u.incident_code}: {u.incident_title} (Req: {u.required_team})
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
