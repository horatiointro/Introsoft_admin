import React from 'react';
import { Activity, Bell, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ActivityFeedEvent } from '../types';
import { initialActivityFeed } from '../data/initialState';

interface UniversalActivityTickerProps {
  events?: ActivityFeedEvent[];
}

export const UniversalActivityTicker: React.FC<UniversalActivityTickerProps> = ({
  events = initialActivityFeed
}) => {
  return (
    <div className="bg-[#0f111a] border-b border-[#1d2232] py-2 px-6 flex items-center justify-between text-xs font-mono select-none overflow-x-auto">
      <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-[#22283a]">
        <Activity className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
        <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
          LIVE ENTERPRISE EVENT TICKER
        </span>
      </div>

      <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap pl-4 py-0.5">
        {events.map(ev => (
          <div key={ev.id} className="flex items-center gap-2 text-[11px]">
            <span className="text-[#666666]">{ev.timestamp}</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
              ev.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
              ev.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
              ev.severity === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {ev.title}
            </span>
            <span className="text-[#a0aabf]">{ev.details}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
