import React from 'react';
import { ShieldCheck, Cpu, GitFork, FlaskConical, Database, AlertTriangle } from 'lucide-react';
import { DataProvenanceType } from '../types';

interface ProvenanceBadgeProps {
  type: DataProvenanceType;
  source?: string;
  className?: string;
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export const ProvenanceBadge: React.FC<ProvenanceBadgeProps> = ({
  type,
  source,
  className = '',
  showIcon = true,
  size = 'xs'
}) => {
  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  };

  const config: Record<DataProvenanceType, { label: string; icon: React.ReactNode; bg: string; text: string; border: string; desc: string }> = {
    LIVE: {
      label: 'LIVE',
      icon: <ShieldCheck className="w-3 h-3" />,
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-700/50',
      desc: 'Real-time operational data from active database / executed API payload'
    },
    CALCULATED: {
      label: 'CALCULATED',
      icon: <Cpu className="w-3 h-3" />,
      bg: 'bg-blue-950/60',
      text: 'text-blue-400',
      border: 'border-blue-700/50',
      desc: 'Computed directly from operational transaction logs or billing metrics'
    },
    DERIVED: {
      label: 'DERIVED',
      icon: <GitFork className="w-3 h-3" />,
      bg: 'bg-purple-950/60',
      text: 'text-purple-400',
      border: 'border-purple-700/50',
      desc: 'Aggregated statistical rollups across historic tenant telemetry'
    },
    FALLBACK: {
      label: 'FALLBACK',
      icon: <Database className="w-3 h-3" />,
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-700/50',
      desc: 'In-memory operational fallback store while primary database synchronizes'
    },
    DEMO: {
      label: 'DEMO',
      icon: <FlaskConical className="w-3 h-3" />,
      bg: 'bg-zinc-800/80',
      text: 'text-zinc-400',
      border: 'border-zinc-700/60',
      desc: 'Pre-seeded synthetic benchmark scenario for security evaluation'
    }
  };

  const item = config[type] || config.DEMO;

  return (
    <span
      className={`inline-flex items-center font-mono font-semibold uppercase tracking-wider rounded border ${item.bg} ${item.text} ${item.border} ${sizeClasses[size]} ${className}`}
      title={`${item.label}: ${item.desc}${source ? ` (Source: ${source})` : ''}`}
    >
      {showIcon && item.icon}
      <span>{item.label}</span>
      {source && <span className="opacity-60 normal-case font-normal text-[8px]">({source})</span>}
    </span>
  );
};
