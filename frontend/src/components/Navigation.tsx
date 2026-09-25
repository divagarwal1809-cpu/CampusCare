import React, { useRef, useState, useEffect } from 'react';
import {
  Radio, Cpu, Grid3X3, TrendingUp, FileText,
  AlertCircle, UserCircle2, ShieldCheck
} from 'lucide-react';

export type NavTab = 'command' | 'simulation' | 'matrix' | 'analytics' | 'audit';
export type UserRole = 'user' | 'admin';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unassignedCount?: number;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
}

const ADMIN_TABS = [
  { id: 'command' as NavTab, label: 'Command Center', icon: Radio },
  { id: 'simulation' as NavTab, label: 'Decision Simulator', icon: Cpu },
  { id: 'matrix' as NavTab, label: 'Capability Matrix', icon: Grid3X3 },
  { id: 'analytics' as NavTab, label: 'Risk Analytics', icon: TrendingUp },
  { id: 'audit' as NavTab, label: 'Audit Trail', icon: FileText },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  unassignedCount = 0,
  role,
  onRoleChange,
}) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Animate sliding underline indicator
  useEffect(() => {
    const el = tabRefs.current[currentTab];
    if (el) {
      const rect = el.getBoundingClientRect();
      const parentRect = el.parentElement?.getBoundingClientRect();
      if (parentRect) {
        setIndicatorStyle({
          left: rect.left - parentRect.left,
          width: rect.width,
        });
      }
    }
  }, [currentTab, role]);

  if (role === 'user') {
    // User navigation is minimal — just the role switcher
    return (
      <nav className="sticky top-[65px] z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200/80 px-4 lg:px-8 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 status-dot-live" />
          <span className="text-xs text-slate-600 font-semibold">Student & Staff Incident Portal</span>
        </div>
        <RoleToggle role={role} onRoleChange={onRoleChange} />
      </nav>
    );
  }

  return (
    <nav className="sticky top-[65px] z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200/80 px-4 lg:px-8 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="relative flex items-center overflow-x-auto scrollbar-hide py-0">
          {/* Sliding indicator bar */}
          <div
            className="absolute bottom-0 h-[2.5px] rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 transition-all duration-300 ease-out pointer-events-none"
            style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
          />

          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            const hasBadge = tab.id === 'command' && unassignedCount > 0;

            return (
              <button
                key={tab.id}
                ref={el => { tabRefs.current[tab.id] = el; }}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'text-sky-700 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors duration-200 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {hasBadge && (
                  <span className="flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                    <AlertCircle className="w-2.5 h-2.5" />
                    {unassignedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="shrink-0 py-2">
          <RoleToggle role={role} onRoleChange={onRoleChange} />
        </div>
      </div>
    </nav>
  );
};

// Role toggle component
const RoleToggle: React.FC<{ role: UserRole; onRoleChange: (r: UserRole) => void }> = ({ role, onRoleChange }) => {
  return (
    <div className="role-toggle-track" onClick={() => onRoleChange(role === 'admin' ? 'user' : 'admin')}>
      {/* Slider */}
      <div
        className={`role-toggle-slider ${role === 'admin' ? 'bg-gradient-to-r from-sky-500 to-indigo-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}
        style={{
          left: role === 'user' ? '3px' : '50%',
          width: 'calc(50% - 3px)',
        }}
      />
      <span className={`role-toggle-option ${role === 'user' ? 'active' : ''}`}>
        <UserCircle2 className="inline w-3 h-3 mr-1" />
        User
      </span>
      <span className={`role-toggle-option ${role === 'admin' ? 'active' : ''}`}>
        <ShieldCheck className="inline w-3 h-3 mr-1" />
        Admin
      </span>
    </div>
  );
};
