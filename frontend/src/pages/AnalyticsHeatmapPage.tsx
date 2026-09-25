import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  TrendingUp, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer,
  Cell 
} from 'recharts';

export const AnalyticsHeatmapPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalyticsDashboard();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Loading campus operational analytics & heatmap...
      </div>
    );
  }

  const { summary, heatmap_zones, categories_breakdown, hourly_trend } = data;

  const categoryColors: Record<string, string> = {
    Medical: '#38bdf8',
    Fire: '#f43f5e',
    Security: '#3b82f6',
    Technical: '#a855f7',
    Hazmat: '#f59e0b',
    General: '#10b981',
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-sky-950 border border-sky-800 text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white">Campus Operational Risk & Analytics</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Historical incident density, spatial hotspots, SLA compliance rates, and multi-incident resource utilization.
        </p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Response Time</span>
          <div className="text-2xl font-black text-sky-400 font-mono mt-1">
            {summary.avg_response_time_minutes} min
          </div>
          <span className="text-[10px] text-emerald-400">Within 3m critical SLA</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">SLA Target Compliance</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {summary.sla_compliance_percent}%
          </div>
          <span className="text-[10px] text-slate-400">Historical performance</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Resource Utilization</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {summary.utilization_rate}%
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.deployed_responders} / {summary.total_responders} deployed
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Lifetime Incidents</span>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {summary.total_incidents}
          </div>
          <span className="text-[10px] text-slate-400">EOC operations log</span>
        </div>
      </div>

      {/* Campus Risk Heatmap Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Campus Risk Heatmap (Historical Incident Hotspots)
              </h2>
              <p className="text-[11px] text-slate-400">
                Operational density analysis across campus zones (not predictive, based on historical response logs)
              </p>
            </div>
          </div>
        </div>

        {/* Hotspot Progress Gauges */}
        <div className="space-y-3.5">
          {heatmap_zones.map((zone: any) => {
            let meterColor = 'bg-sky-500';
            if (zone.risk_score >= 85) meterColor = 'bg-rose-500 shadow-sm shadow-rose-500/50';
            else if (zone.risk_score >= 70) meterColor = 'bg-amber-400';

            return (
              <div key={zone.zone} className="text-xs space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{zone.zone}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {zone.primary_concern}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400">{zone.incidents_count} incidents</span>
                    <span className="font-bold text-white">({zone.risk_score}/100)</span>
                    <span className={`text-[10px] font-bold ${zone.trend.startsWith('+') ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {zone.trend}
                    </span>
                  </div>
                </div>

                {/* Progress Meter */}
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${meterColor}`}
                    style={{ width: `${zone.risk_score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Grid: Volume by Category & Hourly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Volume Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            <span>Incident Volume by Category</span>
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {categories_breakdown.map((entry: any) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={categoryColors[entry.name] || '#38bdf8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Incident Surge Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Operational Incident Pace (Hourly)</span>
          </h3>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#38bdf8' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
