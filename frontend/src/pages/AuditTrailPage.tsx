import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AuditLogItem } from '../types';
import { FileText, RefreshCw, Filter, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterCode, setFilterCode] = useState<string>('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs(filterCode || undefined);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterCode]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-100 border border-sky-200 text-sky-600">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">Operations Audit Trail & Timeline</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident, chronological execution ledger of every triage calculation, dispatch decision, and reallocation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Filter by Incident (e.g. INC-105)"
            value={filterCode}
            onChange={(e) => setFilterCode(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
          />
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-600 hover:text-slate-900 border border-slate-300 hover:border-slate-400 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Ledger Container */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>{logs.length} Operational Events Recorded</span>
          <span className="font-mono text-[11px]">UTC / Local Telemetry Log</span>
        </div>

        <div className="divide-y divide-slate-100">
          {loading && logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No audit logs matched current query.
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedId === log.id;
              const hasPayload = log.payload && Object.keys(log.payload).length > 0;

              return (
                <div key={log.id} className="p-4 hover:bg-slate-50 transition text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-[11px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.timestamp}
                      </span>
                      {log.incident_code && (
                        <span className="font-mono text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {log.incident_code}
                        </span>
                      )}
                      <span className="font-bold text-slate-900 uppercase text-[11px] tracking-wide">
                        {log.action}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Actor: <strong className="text-slate-800">{log.actor}</strong></span>
                      {hasPayload && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          className="flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold"
                        >
                          <span>{isExpanded ? 'Hide Payload' : 'Inspect JSON'}</span>
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-600 leading-relaxed pl-1">
                    {log.details}
                  </p>

                  {/* Expanded JSON Payload */}
                  {isExpanded && hasPayload && (
                    <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 overflow-x-auto">
                      <pre className="font-mono text-[10px] text-emerald-700">
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
