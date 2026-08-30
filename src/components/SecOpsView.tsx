import React, { useState } from 'react';
import { ShieldAlert, Lock, AlertCircle, Eye, EyeOff, ShieldCheck, Cpu, Maximize2 } from 'lucide-react';
import { Customer, AIProvider, AuditLog } from '../types';
import { TileDetailModal, TileDetailData } from './TileDetailModal';
import { getTileDetailData } from '../data/tileDetailData';

interface SecOpsViewProps {
  customers: Customer[];
  providers: AIProvider[];
  auditLogs: AuditLog[];
}

export const SecOpsView: React.FC<SecOpsViewProps> = ({
  customers,
  auditLogs
}) => {
  const [selectedTileDetail, setSelectedTileDetail] = useState<TileDetailData | null>(null);

  const handleTileClick = (title: string, value: string | number, category?: any) => {
    setSelectedTileDetail(getTileDetailData(title, value, category || 'SOC & Security'));
  };

  return (
    <div className="space-y-6">
      {/* Tile Detail Inspector Modal */}
      <TileDetailModal
        data={selectedTileDetail}
        onClose={() => setSelectedTileDetail(null)}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
              CISO Cyber Security
            </span>
            <span className="text-xs text-emerald-400 font-mono">Real-time Injection & PII Guard</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Security Operations Centre (SOC) & Threat Shield</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Monitor API threat vectors, prompt injection telemetry, POPIA/GDPR real-time PII redaction accuracy, and IP whitelisting rules. Click any tile to inspect derivations and root cause logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Gateway Shield: ACTIVE
          </span>
        </div>
      </div>

      {/* Threat Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => handleTileClick('Threats Deflected', '142', 'SOC & Security')}
          className="bg-[#12141c] border border-[#222636] hover:border-red-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#77809a] uppercase font-semibold">Total Threats Deflected</span>
            <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-red-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">142</div>
          <span className="text-[10px] text-[#8890a6] mt-0.5 block">0 Bypasses Logged</span>
        </div>

        <div
          onClick={() => handleTileClick('Prompt Injections', '38', 'SOC & Security')}
          className="bg-[#12141c] border border-[#222636] hover:border-purple-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#77809a] uppercase font-semibold">Prompt Injections Blocked</span>
            <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono mt-1">38</div>
          <span className="text-[10px] text-[#8890a6] mt-0.5 block">Jailbreak / Adversarial</span>
        </div>

        <div
          onClick={() => handleTileClick('PII Incidents Scrubbed', '1,240', 'SOC & Security')}
          className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#77809a] uppercase font-semibold">PII Redactions Performed</span>
            <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-1">1,240</div>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">100% Zero-Retention</span>
        </div>

        <div
          onClick={() => handleTileClick('Risk Rating Score', 'LOW (0.02)', 'SOC & Security')}
          className="bg-[#12141c] border border-[#222636] hover:border-emerald-500/60 p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#77809a] uppercase font-semibold">Risk Rating Score</span>
            <Maximize2 className="w-3.5 h-3.5 text-[#555e78] group-hover:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">LOW (0.02)</div>
          <span className="text-[10px] text-[#8890a6] mt-0.5 block">ISO 27001 Benchmark</span>
        </div>
      </div>

      {/* Security Threat Event Logs */}
      <div className="bg-[#12141c] border border-[#222636] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#222636] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Security Threat Log & PII Inspection Ledger</h3>
            <p className="text-xs text-[#8890a6] mt-0.5">Real-time prompt inspection events before model submission.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161924] text-[10px] uppercase font-mono text-[#77809a] border-b border-[#222636]">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Tenant</th>
                <th className="p-3.5">Threat Type</th>
                <th className="p-3.5">Action Taken</th>
                <th className="p-3.5">PII Masked</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222636] text-xs">
              {auditLogs.slice(0, 5).map((log, i) => (
                <tr key={i} className="hover:bg-[#181c28] transition-colors">
                  <td className="p-3.5 font-mono text-[#8890a6]">{log.timestamp}</td>
                  <td className="p-3.5 font-semibold text-white">{log.tenantName || 'Acme Financial Technologies'}</td>
                  <td className="p-3.5 font-mono text-purple-300">Prompt Inspection & Sanity Check</td>
                  <td className="p-3.5 font-mono text-emerald-400">Sanitized & Submitted</td>
                  <td className="p-3.5 font-mono text-blue-400">ID / Account # Redacted</td>
                  <td className="p-3.5 text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      DEFENDED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
