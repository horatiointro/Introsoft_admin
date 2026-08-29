import React from 'react';
import { Workflow, Zap, CheckCircle2, AlertTriangle, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import { WorkflowRule } from '../types';

interface AutomationViewProps {
  workflows: WorkflowRule[];
}

export const AutomationView: React.FC<AutomationViewProps> = ({ workflows }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
              Orchestration Engine
            </span>
            <span className="text-xs text-emerald-400 font-mono">Event-Driven Automation Rules</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Automation & Workflow Rules Engine</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Configure automated policies for budget ceiling actions, SLA latency escalations, PII breach alerts, and automatic provider failovers.
          </p>
        </div>

        <button className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Rule
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {workflows.map(wf => (
          <div key={wf.id} className="bg-[#12141c] border border-[#222636] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-400">{wf.id}</span>
                <span className="text-sm font-bold text-white">{wf.name}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-blue-500/20 text-blue-300">
                  Trigger: {wf.triggerEvent.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[#8890a6]">{wf.description}</p>
              <div className="text-[11px] font-mono text-emerald-400 mt-1">
                Condition: <span className="text-white">{wf.condition}</span> → Action: <span className="text-purple-300">{wf.action.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right text-[10px] font-mono text-[#666666]">
                <div>Last Triggered:</div>
                <div className="text-white">{wf.lastTriggered || 'Never'}</div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#181c28] border border-[#283046]">
                <ToggleRight className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 font-bold">ENABLED</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
