import React from 'react';
import { PriorityLevel } from '../types';

interface PriorityBadgeProps {
  level: PriorityLevel;
  score?: number;
  scale10?: number;
  size?: 'sm' | 'md' | 'lg';
  showDial?: boolean;
}

// Maps priority level to visual config
const LEVEL_CONFIG: Record<PriorityLevel, {
  bg: string;
  text: string;
  border: string;
  dot: string;
  dialBg: string;
  dialText: string;
  dialRing: string;
  glow: string;
  label: string;
}> = {
  CRITICAL: {
    bg: 'bg-rose-50',
    text: 'text-rose-700 font-extrabold',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
    dialBg: 'bg-gradient-to-br from-rose-500 to-rose-600',
    dialText: 'text-white',
    dialRing: 'ring-2 ring-rose-200 shadow-sm shadow-rose-500/30',
    glow: 'shadow-rose-100',
    label: 'CRITICAL',
  },
  HIGH: {
    bg: 'bg-amber-50',
    text: 'text-amber-800 font-extrabold',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    dialBg: 'bg-gradient-to-br from-amber-500 to-amber-600',
    dialText: 'text-white',
    dialRing: 'ring-2 ring-amber-200 shadow-sm shadow-amber-500/30',
    glow: 'shadow-amber-100',
    label: 'HIGH',
  },
  MEDIUM: {
    bg: 'bg-sky-50',
    text: 'text-sky-800 font-extrabold',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    dialBg: 'bg-gradient-to-br from-sky-500 to-sky-600',
    dialText: 'text-white',
    dialRing: 'ring-2 ring-sky-200 shadow-sm shadow-sky-500/20',
    glow: 'shadow-sky-100',
    label: 'MEDIUM',
  },
  LOW: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800 font-extrabold',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    dialBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    dialText: 'text-white',
    dialRing: 'ring-2 ring-emerald-200 shadow-sm shadow-emerald-500/20',
    glow: 'shadow-emerald-100',
    label: 'LOW',
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  level,
  score,
  scale10,
  size = 'md',
  showDial = false,
}) => {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.LOW;

  // Compute scale10 from score if not provided
  const dialValue = scale10 ?? (score !== undefined ? Math.max(1, Math.min(10, Math.round(score / 10))) : undefined);

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  const dialSizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  }[size];

  return (
    <span className={`inline-flex items-center font-bold rounded-md ${cfg.bg} ${cfg.text} border ${cfg.border} shadow-sm ${cfg.glow} ${sizeClasses} transition-all duration-200`}>
      {/* Animated status dot */}
      {level === 'CRITICAL' ? (
        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${cfg.dot} animate-ping`} />
      ) : (
        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${cfg.dot} status-dot-live`} />
      )}

      <span>{cfg.label}</span>

      {/* 0-100 score */}
      {score !== undefined && (
        <span className="font-mono opacity-75">({score})</span>
      )}

      {/* 1-10 dial */}
      {dialValue !== undefined && (showDial || size === 'lg') && (
        <span className={`inline-flex items-center justify-center rounded-full ${cfg.dialBg} ${cfg.dialText} ${cfg.dialRing} ${dialSizeClasses} font-mono font-black shadow-md shrink-0`}>
          {dialValue}
        </span>
      )}
    </span>
  );
};

// Standalone scale-10 dial for use in card headers
export const PriorityDial: React.FC<{
  scale10: number;
  level: PriorityLevel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}> = ({ scale10, level, size = 'md' }) => {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.LOW;

  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  }[size];

  return (
    <div className={`relative flex items-center justify-center rounded-full ${cfg.dialBg} ${cfg.dialRing} ${sizeMap} font-black font-mono shadow-lg transition-all duration-300`}
         data-tooltip={`Priority ${scale10}/10`}>
      <span className={cfg.dialText}>{scale10}</span>
      <span className="absolute inset-0 rounded-full opacity-30 animate-ping"
            style={{ background: 'inherit' }} />
    </div>
  );
};
