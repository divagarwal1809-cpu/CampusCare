import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  RotateCcw,
  PlusCircle,
  Bell,
  Clock,
  Radio,
  Activity,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCircle2
} from 'lucide-react';
import { NotificationItem } from '../types';
import { UserRole } from './Navigation';

interface HeaderProps {
  systemStatus: 'OPERATIONAL' | 'ELEVATED' | 'CRITICAL_PRESSURE';
  notifications: NotificationItem[];
  onOpenIntake: () => void;
  onResetDemo: () => void;
  isResetting?: boolean;
  role?: UserRole;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  notifications,
  onOpenIntake,
  onResetDemo,
  isResetting = false,
  role = 'admin',
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const statusConfig = {
    CRITICAL_PRESSURE: {
      cls: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-600 animate-ping',
      label: 'CRITICAL PRESSURE',
      pulse: true,
    },
    ELEVATED: {
      cls: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500',
      label: 'ELEVATED LOAD',
      pulse: false,
    },
    OPERATIONAL: {
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'OPERATIONAL',
      pulse: false,
    },
  }[systemStatus];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/90 px-4 lg:px-8 py-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ── Logo ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-sky-500 shadow-md shadow-sky-500/20 text-white">
            <ShieldAlert className="w-5 h-5" />
            {/* Live pulse beacon */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                CAMPUSCARE
              </h1>
              <span className="text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                EOC v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">
              {role === 'user' ? 'Student & Staff Incident Portal' : 'Emergency Operations & Decision-Support Platform'}
            </p>
          </div>
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* System status (admin only) */}
          {role === 'admin' && (
            <span className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.cls} ${statusConfig.pulse ? 'animate-pulse' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>
          )}

          {/* EOC Clock */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-mono text-xs font-semibold shadow-xs">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            <span>{timeStr || '00:00:00'}</span>
            <span className="text-[10px] text-slate-400 font-bold">EOC</span>
          </div>

          {/* Admin-only controls */}
          {role === 'admin' && (
            <>
              <button
                onClick={onResetDemo}
                disabled={isResetting}
                title="Reset scenario to the exact 10:32 PM Medical Crunch & Incident #105 crisis"
                data-tooltip="Reset to 10:32 PM demo"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-all duration-200 hover:border-slate-300"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-amber-500 ${isResetting ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">Reset Demo</span>
              </button>

              <button
                onClick={onOpenIntake}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <PlusCircle className="w-4 h-4 text-sky-400" />
                <span>Intake Incident</span>
              </button>
            </>
          )}

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-xs transition-all duration-200"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden modal-enter">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-sky-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Operational Broadcasts</span>
                  </div>
                  <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">No active alerts logged.</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs hover:bg-slate-50 transition-colors ${n.level === 'CRITICAL' ? 'bg-rose-50/40' : ''}`}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold ${
                            n.level === 'CRITICAL' ? 'text-rose-600' :
                            n.level === 'WARNING' ? 'text-amber-600' : 'text-sky-600'
                          }`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
