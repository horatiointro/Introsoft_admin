import React, { useState } from 'react';
import { Customer, Application, ApiKey } from '../types';
import { AltilLogo } from './AltilLogo';
import {
  Building2,
  Users,
  ShieldCheck,
  Server,
  Plus,
  ChevronRight,
  TrendingUp,
  Layers,
  Network,
  Globe,
  Award,
  DollarSign,
  Key
} from 'lucide-react';

interface OrgHierarchyViewProps {
  customers: Customer[];
  applications: Application[];
  apiKeys: ApiKey[];
  onSelectCustomer?: (customerId: string) => void;
}

export const OrgHierarchyView: React.FC<OrgHierarchyViewProps> = ({
  customers,
  applications,
  apiKeys,
  onSelectCustomer
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'bento' | 'table'>('tree');

  // Identify Parent Owner (Introsoft)
  const parentOwner = customers.find(c => c.orgRole === 'parent_owner') || customers[0];
  const subsidiaries = customers.filter(c => c.orgRole === 'subsidiary' || (!c.orgRole && c.id !== parentOwner?.id));
  const partners = customers.filter(c => c.orgRole === 'partner_reseller');
  const clients = customers.filter(c => c.orgRole === 'direct_client');

  const totalHierarchySpend = customers.reduce((sum, c) => sum + (c.currentSpendUsd || 0), 0);
  const totalHierarchyBudget = customers.reduce((sum, c) => sum + (c.monthlyBudgetUsd || 0), 0);
  const totalUsers = customers.reduce((sum, c) => sum + (c.users?.length || 0), 0);

  const selectedNode = customers.find(c => c.id === selectedNodeId) || parentOwner;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
        <div className="flex items-center gap-3.5">
          <AltilLogo size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Enterprise Multi-Tenant Hierarchy & Org Governance
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Parent-Subsidiary-Partner Ecosystem
              </span>
            </div>
            <p className="text-xs text-[#888888] mt-0.5">
              Governing Introsoft Corporation, its regional subsidiaries, authorized resellers, and direct client tenants.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#161616] p-1 rounded border border-[#222222] text-xs font-medium">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded transition-colors ${
                viewMode === 'tree' ? 'bg-cyan-600 text-white font-semibold' : 'text-[#888888] hover:text-white'
              }`}
            >
              Graphical Tree
            </button>
            <button
              onClick={() => setViewMode('bento')}
              className={`px-3 py-1.5 rounded transition-colors ${
                viewMode === 'bento' ? 'bg-cyan-600 text-white font-semibold' : 'text-[#888888] hover:text-white'
              }`}
            >
              Bento Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-cyan-600 text-white font-semibold' : 'text-[#888888] hover:text-white'
              }`}
            >
              Ledger Table
            </button>
          </div>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#121212] border border-[#222222] rounded-lg p-4 space-y-1">
          <div className="text-xs text-[#888888] flex items-center justify-between">
            <span>Apex Parent Group</span>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white">Introsoft Corp</div>
          <div className="text-[11px] text-cyan-400 font-mono">Root Tenant Controller</div>
        </div>

        <div className="bg-[#121212] border border-[#222222] rounded-lg p-4 space-y-1">
          <div className="text-xs text-[#888888] flex items-center justify-between">
            <span>Active Subsidiaries</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">{subsidiaries.length + 1} Orgs</div>
          <div className="text-[11px] text-blue-400 font-mono">Global Regional Entities</div>
        </div>

        <div className="bg-[#121212] border border-[#222222] rounded-lg p-4 space-y-1">
          <div className="text-xs text-[#888888] flex items-center justify-between">
            <span>Ecosystem Spend / Budget</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">${totalHierarchySpend.toLocaleString()} / ${totalHierarchyBudget.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-400 font-mono">Consolidated Ingress Ledger</div>
        </div>

        <div className="bg-[#121212] border border-[#222222] rounded-lg p-4 space-y-1">
          <div className="text-xs text-[#888888] flex items-center justify-between">
            <span>Total Tenant Users</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">{totalUsers} Users</div>
          <div className="text-[11px] text-purple-400 font-mono">RBAC & MFA Secured</div>
        </div>
      </div>

      {/* Main Graphical Tree View */}
      {viewMode === 'tree' && (
        <div className="bg-[#121212] border border-[#222222] rounded-lg p-6 space-y-8">
          <div className="flex items-center justify-between border-b border-[#222222] pb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Organizational Ecosystem Topology</h2>
              <p className="text-xs text-[#888888]">Hierarchical lineage from Introsoft Parent Corporation down to subsidiaries, reseller partners, and clients.</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#888888]">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span> Parent Owner</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Subsidiary</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Partner / Reseller</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Direct Client</span>
            </div>
          </div>

          {/* Graphical Tree Rendering */}
          <div className="space-y-6">
            {/* Level 0: Parent Root */}
            {parentOwner && (
              <div className="flex flex-col items-center">
                <div
                  onClick={() => setSelectedNodeId(parentOwner.id)}
                  className={`w-full max-w-xl bg-gradient-to-r from-cyan-950/40 to-[#181818] border-2 ${
                    selectedNode?.id === parentOwner.id ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-cyan-500/40'
                  } rounded-xl p-4 cursor-pointer hover:border-cyan-400 transition-all`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{parentOwner.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                            Parent Owner (Root)
                          </span>
                        </div>
                        <div className="text-xs text-[#888888] mt-0.5">
                          {parentOwner.country} • {parentOwner.industry} • Budget: ${parentOwner.monthlyBudgetUsd.toLocaleString()} USD/mo
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="text-emerald-400 font-bold">${parentOwner.currentSpendUsd.toLocaleString()} Spend</div>
                      <div className="text-[#888888]">{parentOwner.users?.length || 0} Users | {parentOwner.connectedAppIds.length} Apps</div>
                    </div>
                  </div>
                </div>

                {/* Connector Line */}
                <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-500/50 to-blue-500/50 my-2"></div>
              </div>
            )}

            {/* Level 1: Subsidiaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {subsidiaries.map(sub => {
                const subPartners = partners.filter(p => p.parentId === sub.id || p.industry.includes(sub.industry));
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedNodeId(sub.id)}
                    className={`bg-[#161616] border ${
                      selectedNode?.id === sub.id ? 'border-blue-500 shadow-md shadow-blue-500/20' : 'border-[#262626]'
                    } rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-all space-y-3`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-white">{sub.name}</h3>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Subsidiary Entity
                          </span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                        sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono text-[#888888] border-t border-[#222222] pt-2">
                      <div className="flex justify-between">
                        <span>Jurisdiction:</span>
                        <span className="text-white">{sub.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Budget:</span>
                        <span className="text-white">${sub.monthlyBudgetUsd.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current Spend:</span>
                        <span className="text-emerald-400">${sub.currentSpendUsd.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Child Partners/Clients:</span>
                        <span className="text-cyan-400">{subPartners.length + 2} Orgs</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid View */}
      {viewMode === 'bento' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {customers.map(cust => (
            <div
              key={cust.id}
              onClick={() => setSelectedNodeId(cust.id)}
              className="bg-[#121212] border border-[#222222] hover:border-[#333333] rounded-lg p-5 space-y-4 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase ${
                    cust.orgRole === 'parent_owner' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    cust.orgRole === 'subsidiary' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                    cust.orgRole === 'partner_reseller' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {cust.orgRole?.replace('_', ' ') || 'Direct Tenant'}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2">{cust.name}</h3>
                  <p className="text-xs text-[#888888]">{cust.industry} • {cust.country}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#181818] p-3 rounded border border-[#222222] text-xs font-mono">
                <div>
                  <span className="text-[#888888] block text-[10px]">Budget</span>
                  <span className="text-white font-bold">${cust.monthlyBudgetUsd.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#888888] block text-[10px]">Spend</span>
                  <span className="text-emerald-400 font-bold">${cust.currentSpendUsd.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Ledger View */}
      {viewMode === 'table' && (
        <div className="bg-[#121212] border border-[#222222] rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#181818] border-b border-[#222222] text-[#888888] uppercase text-[10px]">
                <th className="p-4">Organization Name</th>
                <th className="p-4">Role / Hierarchy</th>
                <th className="p-4">Jurisdiction</th>
                <th className="p-4">Tier / Status</th>
                <th className="p-4 text-right">Budget (USD)</th>
                <th className="p-4 text-right">Current Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {customers.map(cust => (
                <tr key={cust.id} className="hover:bg-[#161616]">
                  <td className="p-4 text-white font-sans font-bold">{cust.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                      {cust.orgRole || 'direct_client'}
                    </span>
                  </td>
                  <td className="p-4 text-[#888888]">{cust.country}</td>
                  <td className="p-4">
                    <span className="text-emerald-400 font-bold">{cust.tier}</span> / {cust.status}
                  </td>
                  <td className="p-4 text-right font-mono">${cust.monthlyBudgetUsd.toLocaleString()}</td>
                  <td className="p-4 text-right font-mono text-emerald-400">${cust.currentSpendUsd.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Node Inspection Drawer */}
      {selectedNode && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[#222222] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedNode.name}</h3>
                <p className="text-xs text-[#888888]">ID: {selectedNode.id} • {selectedNode.legalName || selectedNode.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase">
                {selectedNode.orgRole || 'Tenant'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 bg-[#181818] p-4 rounded-lg border border-[#222222]">
              <h4 className="text-xs font-bold uppercase text-white font-mono">Primary Contact & Governance</h4>
              <div className="text-xs space-y-1 text-[#aaaaaa]">
                <div><strong className="text-white">Name:</strong> {selectedNode.primaryContact.name}</div>
                <div><strong className="text-white">Email:</strong> {selectedNode.primaryContact.email}</div>
                <div><strong className="text-white">Phone:</strong> {selectedNode.primaryContact.phone || 'N/A'}</div>
                <div><strong className="text-white">Jurisdiction:</strong> {selectedNode.country}</div>
              </div>
            </div>

            <div className="space-y-3 bg-[#181818] p-4 rounded-lg border border-[#222222]">
              <h4 className="text-xs font-bold uppercase text-white font-mono">Quotas & Financial Ledger</h4>
              <div className="text-xs space-y-1 text-[#aaaaaa]">
                <div><strong className="text-white">Monthly Budget:</strong> ${selectedNode.monthlyBudgetUsd.toLocaleString()} USD</div>
                <div><strong className="text-white">Current Spend:</strong> ${selectedNode.currentSpendUsd.toLocaleString()} USD</div>
                <div><strong className="text-white">Rate Limit:</strong> {selectedNode.rateLimitRpm} RPM</div>
                <div><strong className="text-white">Credit Balance:</strong> ${selectedNode.billingConfig?.creditBalanceUsd || 1500} USD</div>
              </div>
            </div>

            <div className="space-y-3 bg-[#181818] p-4 rounded-lg border border-[#222222]">
              <h4 className="text-xs font-bold uppercase text-white font-mono">Statutory Officers (POPIA / GDPR)</h4>
              <div className="text-xs space-y-1 text-[#aaaaaa]">
                <div><strong className="text-white">Info Officer:</strong> {selectedNode.statutoryOfficers?.informationOfficer?.name || 'Nominated'}</div>
                <div><strong className="text-white">Reg ID:</strong> {selectedNode.statutoryOfficers?.informationOfficer?.registrationNumber || 'Pending'}</div>
                <div><strong className="text-white">DPO:</strong> {selectedNode.statutoryOfficers?.dataProtectionOfficer?.name || 'Internal'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
