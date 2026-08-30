import React, { useState } from 'react';
import { AltilLogo } from './AltilLogo';
import {
  Layers,
  Shield,
  Zap,
  Activity,
  User,
  Radio,
  Play,
  Sun,
  Moon,
  Bell,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { MultiChannelAlert } from '../types';

interface HeaderProps {
  onOpenPlayground: () => void;
  onOpenArchitecture: () => void;
  providersOnline?: number;
  totalProviders?: number;
  theme?: 'night' | 'day';
  onToggleTheme?: () => void;
  alertsList?: MultiChannelAlert[];
  onOpenAlertsView?: () => void;
  onOpenIncidentById?: (incidentId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPlayground,
  onOpenArchitecture,
  providersOnline = 4,
  totalProviders = 5,
  theme = 'night',
  onToggleTheme,
  alertsList = [],
  onOpenAlertsView,
  onOpenIncidentById
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadAlerts = alertsList.filter(a => !a.isRead);

  return (
    <header className="h-24 border-b border-[#222222] flex items-center justify-between px-6 sm:px-8 bg-[#0a0a0a] shrink-0 select-none relative z-40">
      {/* Left Branding with Company Logo */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity">
          <AltilLogo size="custom" height="80px" />
        </div>
      </div>

      {/* Center Live System Heartbeat */}
      <div className="hidden lg:flex items-center space-x-5 text-xs text-[#888888]">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-[10px] font-mono uppercase text-[#888888]">Gateway: Online</span>
        </div>

        <div className="h-3.5 w-px bg-[#222222]" />

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono uppercase text-[#666666]">Providers:</span>
          <span className="text-[10px] font-mono text-green-500 font-medium">
            {providersOnline}/{totalProviders} Active
          </span>
        </div>

        <div className="h-3.5 w-px bg-[#222222]" />

        <div className="flex items-center space-x-2">
          <Shield className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-mono uppercase text-[#666666]">Governance:</span>
          <span className="text-[10px] font-mono text-blue-400 font-medium">Enforcing</span>
        </div>

        <div className="h-3.5 w-px bg-[#222222]" />

        <span className="text-[10px] font-mono text-[#666666]">v2.4.1-stable</span>
      </div>

      {/* Right Admin Profile & Quick Actions */}
      <div className="flex items-center space-x-3">
        {/* Multi-Channel Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-[#141414] hover:bg-[#1a1a1a] text-[#888888] hover:text-white border border-[#222222] transition-colors relative"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-[9px] font-mono font-bold text-white flex items-center justify-center animate-pulse">
                {unreadAlerts.length}
              </span>
            )}
          </button>

          {/* Notification Drawer Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#10121a] border border-[#222636] rounded-xl shadow-2xl p-4 space-y-3 z-50 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#222636] pb-2">
                <span className="font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Live Incident Alerts ({alertsList.length})
                </span>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    if (onOpenAlertsView) onOpenAlertsView();
                  }}
                  className="text-[10px] text-blue-400 hover:underline"
                >
                  View CRM Alerts →
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {alertsList.length === 0 ? (
                  <div className="text-center py-4 text-[#666666]">No active alerts</div>
                ) : (
                  alertsList.map(alt => (
                    <div
                      key={alt.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (onOpenIncidentById) onOpenIncidentById(alt.incidentId);
                      }}
                      className="p-2.5 rounded-lg bg-[#181c2b] border border-[#283046] hover:border-blue-500 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-blue-400 font-bold">{alt.incidentId}</span>
                        <span className="text-red-400 font-bold">{alt.severity}</span>
                      </div>
                      <p className="text-white text-[11px] leading-tight line-clamp-2">{alt.message}</p>
                      <div className="text-[9px] text-[#8890a6] flex justify-between pt-1">
                        <span>Tenant: {alt.tenantName || 'Enterprise'}</span>
                        <span className="text-emerald-400">Channels: {alt.channels.join(', ').toUpperCase()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          id="btn-architecture-diagram"
          onClick={onOpenArchitecture}
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#141414] hover:bg-[#1a1a1a] text-[#888888] hover:text-white border border-[#222222] transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span>Architecture</span>
        </button>

        <button
          id="btn-quick-playground"
          onClick={onOpenPlayground}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Simulate API</span>
        </button>

        {/* Admin Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-[#222222]">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-800 flex items-center justify-center text-[10px] font-bold text-white">
            H
          </div>
          <div className="hidden xl:flex flex-col">
            <span className="text-xs font-semibold text-white leading-tight">Horatio</span>
            <span className="text-[10px] text-green-500 font-mono leading-tight">Admin Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
