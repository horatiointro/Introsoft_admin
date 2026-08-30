import React, { useState, useEffect } from 'react';
import { AltilLogo } from './AltilLogo';
import { Shield, Cpu, Lock, CheckCircle2, Server, Key, Radio, Terminal } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  userName?: string;
  userRole?: string;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  userName = 'Horatio Huxham',
  userRole = 'Global Super Admin',
  minDurationMs = 1400 // Guaranteed > 1 second duration
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { label: 'Initializing FIPS 140-3 HSM Security Tokens...', icon: Key },
    { label: 'Synchronizing Multi-Tenant Gateway Policies...', icon: Server },
    { label: 'Verifying POPIA & GDPR Statutory Audit Ledger...', icon: Shield },
    { label: 'Allocating Dedicated Compute Subnets...', icon: Cpu },
    { label: 'Console Hydrated. Launching ALTIL Secure AI Engine...', icon: CheckCircle2 }
  ];

  useEffect(() => {
    const startTime = Date.now();
    const intervalMs = 30;
    const totalIncrements = minDurationMs / intervalMs;
    const incrementAmount = 100 / totalIncrements;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + incrementAmount;
        const elapsedTime = Date.now() - startTime;

        // Calculate current step based on progress percentage
        const stepIdx = Math.min(
          steps.length - 1,
          Math.floor((next / 100) * steps.length)
        );
        setCurrentStepIndex(stepIdx);

        if (next >= 100 && elapsedTime >= minDurationMs) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 150);
          return 100;
        }
        return Math.min(next, 99.5);
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [minDurationMs, onComplete, steps.length]);

  const CurrentStepIcon = steps[currentStepIndex].icon;

  return (
    <div className="fixed inset-0 z-50 bg-[#06080d] flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans">
      {/* Background Animated Cyber Mesh Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Main Splash Container */}
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center text-center space-y-8">
        
        {/* Banner Card Mirroring Uploaded Aesthetic */}
        <div className="w-full bg-gradient-to-r from-[#0c121e] via-[#111928] to-[#0c121e] border border-[#1f293d] rounded-2xl p-8 shadow-2xl shadow-emerald-950/20 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Banner Text */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
                SECURITY CONSOLE BOOT SEQUENCE
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)] uppercase">
              WELCOME TO <br />
              <span className="bg-gradient-to-r from-blue-300 via-emerald-300 to-cyan-200 bg-clip-text text-transparent">
                ALTIL SECURE AI
              </span>
            </h1>

            <h2 className="text-sm sm:text-lg font-bold tracking-wider text-slate-300 uppercase">
              Administration Console
            </h2>

            <div className="pt-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-400 font-mono">
              <span>Powered by</span>
              <span className="text-emerald-400 font-bold border-b border-emerald-500/30">Introsoft International</span>
            </div>
          </div>
        </div>

        {/* Futuristic Loading Spinner & Progress Ring */}
        <div className="relative flex flex-col items-center space-y-4">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Outer Spinning Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" style={{ animationDuration: '1.2s' }} />
            {/* Inner Counter-Spinning Ring */}
            <div className="absolute inset-2 rounded-full border-2 border-blue-500/20 border-b-blue-400 animate-spin" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} />
            {/* Innermost Pulse Ring */}
            <div className="absolute inset-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Shield className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Progress Percentage Display */}
          <div className="flex flex-col items-center">
            <span className="text-3xl font-mono font-extrabold text-white tracking-wider">
              {Math.min(100, Math.floor(progress))}%
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
              Authenticating {userName}
            </span>
          </div>
        </div>

        {/* Progress Bar & Dynamic Step Label */}
        <div className="w-full max-w-lg space-y-3">
          <div className="w-full bg-[#111622] h-2.5 rounded-full border border-[#1e2738] overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-teal-300 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(16,185,129,0.6)]"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>

          {/* Live Step Ticker */}
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-300 bg-[#0d131f] border border-[#1c2638] px-4 py-2 rounded-xl">
            <CurrentStepIcon className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
            <span className="truncate">{steps[currentStepIndex].label}</span>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>FIPS 140-3 HSM Certified</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3 h-3 text-blue-500" />
            <span>POPIA & GDPR Vault</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-amber-500" />
            <span>TLS 1.3 Active</span>
          </div>
        </div>

      </div>
    </div>
  );
};
