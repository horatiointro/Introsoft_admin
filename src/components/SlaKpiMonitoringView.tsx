import React, { useState } from 'react';
import {
  LineChart,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Building2,
  DollarSign,
  TrendingUp,
  Sliders,
  ShieldAlert,
  ArrowUpRight,
  Maximize2
} from 'lucide-react';
import { Customer, TenantSlaProfile as SlaProfile, KpiDefinition } from '../types';
import { TileDetailModal, TileDetailData } from './TileDetailModal';
import { getTileDetailData } from '../data/tileDetailData';

interface SlaKpiMonitoringViewProps {
  customers: Customer[];
  slaProfiles: SlaProfile[];
  kpis: KpiDefinition[];
  onUpdateSlaProfile?: (profile: SlaProfile) => void;
}

export const SlaKpiMonitoringView: React.FC<SlaKpiMonitoringViewProps> = ({
  customers,
  slaProfiles,
  kpis
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');
  const [selectedSlaId, setSelectedSlaId] = useState<string>('all');
  const [selectedTileDetail, setSelectedTileDetail] = useState<TileDetailData | null>(null);

  const filteredCustomers = selectedTenantId === 'all' 
    ? customers 
    : customers.filter(c => c.id === selectedTenantId);

  const handleTileClick = (title: string, value: string | number, category?: any) => {
    setSelectedTileDetail(getTileDetailData(title, value, category || 'Platform Health'));
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
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              Configuration-Driven Engine
            </span>
            <span className="text-xs text-emerald-400 font-mono">Live KPI Evaluation</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Service Level & KPI Monitoring Dashboard</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Real-time evaluation of SLA compliance, P95/P99 latencies, RTO/RPO targets, and automated penalty credit calculations per tenant. Click any card for derivation metrics.
          </p>
        </div>

        {/* Filter selectors */}
        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] uppercase font-semibold text-[#666666] block mb-1">Select Tenant</label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-[#181c28] border border-[#283046] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">All Tenants ({customers.length})</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-semibold text-[#666666] block mb-1">Filter SLA Tier</label>
            <select
              value={selectedSlaId}
              onChange={(e) => setSelectedSlaId(e.target.value)}
              className="bg-[#181c28] border border-[#283046] text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="all">All SLA Profiles ({slaProfiles.length})</option>
              {slaProfiles.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Global KPI Target Evaluation Matrix */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#77809a] mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400" />
          Active Service Level KPI Engine Controls
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(kpi => (
            <div
              key={kpi.id}
              onClick={() => handleTileClick(kpi.name, `${kpi.currentValue} ${kpi.unit}`, 'Platform Health')}
              className="bg-[#12141c] border border-[#222636] hover:border-blue-500/60 p-4 rounded-xl space-y-3 cursor-pointer transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  {kpi.name}
                  <Maximize2 className="w-3 h-3 text-[#555e78] group-hover:text-blue-400" />
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    kpi.status === 'within_target'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : kpi.status === 'warning'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {kpi.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-bold text-white font-mono">{kpi.currentValue}</span>
                  <span className="text-xs text-[#8890a6] font-mono ml-1">{kpi.unit}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#666666] block">Target Threshold</span>
                  <span className="text-xs text-blue-400 font-mono font-semibold">
                    {kpi.targetValue} {kpi.unit}
                  </span>
                </div>
              </div>

              <div className="w-full bg-[#1e2230] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (kpi.currentValue / kpi.targetValue) * 100)}%`
                  }}
                />
              </div>

              <p className="text-[11px] text-[#77809a] leading-tight">{kpi.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant-by-Tenant SLA Performance Ledger */}
      <div className="bg-[#12141c] border border-[#222636] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#222636] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Tenant SLA & KPI Profile Scorecards</h3>
            <p className="text-xs text-[#8890a6] mt-0.5">
              Live telemetry aggregated per tenant according to their contractual Service Tier.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161924] text-[10px] uppercase font-mono text-[#77809a] border-b border-[#222636]">
                <th className="p-3.5">Tenant Organization</th>
                <th className="p-3.5">Service Tier</th>
                <th className="p-3.5">Availability (Target / Actual)</th>
                <th className="p-3.5">Response Time (P95 Target / Actual)</th>
                <th className="p-3.5">P1 / P2 Response SLA</th>
                <th className="p-3.5">RTO / RPO</th>
                <th className="p-3.5">Support Hours</th>
                <th className="p-3.5">Accrued Credits</th>
                <th className="p-3.5 text-right">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222636] text-xs">
              {filteredCustomers.map(cust => {
                const sla = cust.slaProfile;
                const kpi = cust.kpiProfile;
                const isCompliant = (kpi?.availabilityPercent || 100) >= (sla?.availabilityTargetPercent || 99.9);

                return (
                  <tr key={cust.id} className="hover:bg-[#181c28] transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-white">{cust.name}</div>
                      <div className="text-[10px] text-[#77809a] font-mono">{cust.id} • {cust.country}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {cust.serviceTier || cust.tier}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono">
                      <div className="text-emerald-400 font-bold">{kpi?.availabilityPercent || 99.98}%</div>
                      <div className="text-[10px] text-[#77809a]">Target: ≥ {sla?.availabilityTargetPercent || 99.95}%</div>
                    </td>

                    <td className="p-3.5 font-mono">
                      <div className="text-white font-semibold">{kpi?.p95LatencyMs || 412} ms</div>
                      <div className="text-[10px] text-[#77809a]">Target: ≤ {sla?.p95LatencyMsTarget || 800} ms</div>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-[#8890a6]">
                      <div>P1: <span className="text-white">{sla?.p1ResponseMinutes || 15}m</span></div>
                      <div>P2: <span className="text-white">{sla?.p2ResponseMinutes || 30}m</span></div>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-[#8890a6]">
                      <div>RTO: <span className="text-white">{sla?.rtoHours || 1}h</span></div>
                      <div>RPO: <span className="text-white">{sla?.rpoMinutes || 15}m</span></div>
                    </td>

                    <td className="p-3.5 font-mono text-[#8890a6]">
                      {sla?.supportHours || '24/7/365'}
                    </td>

                    <td className="p-3.5 font-mono font-semibold text-emerald-400">
                      ${kpi?.serviceCreditsAccruedUsd || 0}.00
                    </td>

                    <td className="p-3.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                          isCompliant
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {isCompliant ? 'PASSING' : 'BREACH'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
