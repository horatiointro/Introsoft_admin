import React from 'react';
import { DollarSign, TrendingUp, CreditCard, PieChart, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Customer } from '../types';

interface FinOpsViewProps {
  customers: Customer[];
}

export const FinOpsView: React.FC<FinOpsViewProps> = ({ customers }) => {
  const totalSpendUsd = customers.reduce((sum, c) => sum + c.currentSpendUsd, 0);
  const totalBudgetUsd = customers.reduce((sum, c) => sum + c.monthlyBudgetUsd, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
              Financial Cloud Architecture
            </span>
            <span className="text-xs text-blue-400 font-mono">ZAR / USD Dual Currency Engine</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">AI FinOps & Enterprise Cost Management</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Real-time tracking of AI provider token burn, tenant cost allocation, budget ceiling actions, and free-tier savings.
          </p>
        </div>
      </div>

      {/* FinOps KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl">
          <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Total Platform MTD Burn</span>
          <span className="text-2xl font-bold text-white font-mono mt-1 block">${totalSpendUsd.toFixed(2)}</span>
          <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">≈ R{(totalSpendUsd * 18).toFixed(2)} ZAR</span>
        </div>

        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl">
          <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Combined Tenant Budgets</span>
          <span className="text-2xl font-bold text-blue-400 font-mono mt-1 block">${totalBudgetUsd.toFixed(2)}</span>
          <span className="text-[10px] text-blue-300 font-mono mt-0.5 block">Allocation Ceiling</span>
        </div>

        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl">
          <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Budget Utilization</span>
          <span className="text-2xl font-bold text-emerald-400 font-mono mt-1 block">
            {((totalSpendUsd / totalBudgetUsd) * 100).toFixed(1)}%
          </span>
          <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">Optimal Burn Rate</span>
        </div>

        <div className="bg-[#12141c] border border-[#222636] p-4 rounded-xl">
          <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Free Tier Savings</span>
          <span className="text-2xl font-bold text-purple-400 font-mono mt-1 block">$420.15</span>
          <span className="text-[10px] text-purple-300 font-mono mt-0.5 block">Ollama GPU Local Efficiency</span>
        </div>
      </div>

      {/* Tenant Cost Allocation Ledger */}
      <div className="bg-[#12141c] border border-[#222636] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#222636]">
          <h3 className="text-sm font-bold text-white">Tenant Cost Allocation & Budget Ceiling Ledger</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#161924] text-[10px] uppercase font-mono text-[#77809a] border-b border-[#222636]">
                <th className="p-3.5">Tenant Name</th>
                <th className="p-3.5">Contract Terms</th>
                <th className="p-3.5">MTD Spend (USD / ZAR)</th>
                <th className="p-3.5">Monthly Budget</th>
                <th className="p-3.5">100% Budget Action</th>
                <th className="p-3.5 text-right">Burn Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222636] text-xs">
              {customers.map(cust => {
                const burnPct = (cust.currentSpendUsd / cust.monthlyBudgetUsd) * 100;
                return (
                  <tr key={cust.id} className="hover:bg-[#181c28] transition-colors">
                    <td className="p-3.5 font-semibold text-white">{cust.name}</td>
                    <td className="p-3.5 font-mono text-[11px] text-[#8890a6]">
                      {cust.contractTerms?.billingTerms.toUpperCase() || 'NET 30'} • {cust.contractTerms?.currency || 'USD'}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-white">
                      ${cust.currentSpendUsd.toFixed(2)} <span className="text-[#666666] text-[10px] font-normal">(≈ R{(cust.currentSpendUsd * 18).toFixed(0)})</span>
                    </td>
                    <td className="p-3.5 font-mono text-blue-400 font-semibold">${cust.monthlyBudgetUsd}</td>
                    <td className="p-3.5 font-mono text-[11px] text-amber-300">
                      {cust.contractTerms?.budgetActionOn100Percent?.replace(/_/g, ' ') || 'switch cheaper model'}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {burnPct.toFixed(1)}% BURN
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
