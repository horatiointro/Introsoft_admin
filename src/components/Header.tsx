import React from 'react';
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
  Moon
} from 'lucide-react';

interface HeaderProps {
  onOpenPlayground: () => void;
  onOpenArchitecture: () => void;
  providersOnline?: number;
  totalProviders?: number;
  theme?: 'night' | 'day';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPlayground,
  onOpenArchitecture,
  providersOnline = 4,
  totalProviders = 5,
  theme = 'night',
  onToggleTheme
}) => {
  return (
    <header className="h-16 border-b border-[#222222] flex items-center justify-between px-6 sm:px-8 bg-[#0a0a0a] sticky top-0 z-30 select-none">
      {/* Left Branding with Company Logo */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity">
          <AltilLogo size="lg" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#888888] hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#141414] border border-[#222222]">
            Enterprise Control Centre
          </span>
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
        {/* Day / Night Theme Setting */}
        {onToggleTheme && (
          <button
            id="btn-day-night-toggle"
            onClick={onToggleTheme}
            title={theme === 'night' ? 'Switch to Day mode (Light theme)' : 'Switch to Night mode (Dark theme)'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium bg-[#141414] hover:bg-[#1a1a1a] text-[#888888] hover:text-white border border-[#222222] transition-colors"
          >
            {theme === 'night' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-mono hidden sm:inline">Day</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] font-mono hidden sm:inline">Night</span>
              </>
            )}
          </button>
        )}

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
