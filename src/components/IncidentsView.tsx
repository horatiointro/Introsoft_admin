import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  Plus,
  ShieldAlert,
  Search,
  ChevronRight
} from 'lucide-react';
import { Incident, ProblemRecord } from '../types';

interface IncidentsViewProps {
  incidents: Incident[];
  problems: ProblemRecord[];
  onAddIncident?: (inc: Incident) => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  problems
}) => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(incidents[0] || null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
              ITIL Aligned Service Management
            </span>
            <span className="text-xs text-blue-400 font-mono">PIR & Root Cause Ledger</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Incident & Problem Management Centre</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Track active platform outages, latency spikes, commander escalations, Post-Incident Reviews (PIR), and root cause problem records.
          </p>
        </div>

        <button className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/20">
          <Plus className="w-4 h-4" />
          Declare Major Incident (P1/P2)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents List */}
        <div className="lg:col-span-1 bg-[#12141c] border border-[#222636] rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Active & Historic Incidents ({incidents.length})
          </h2>

          <div className="space-y-2">
            {incidents.map(inc => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#1e2436] border-blue-500 text-white shadow-md'
                      : 'bg-[#161924] border-[#222636] text-[#8890a6] hover:bg-[#1a1e2c]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-blue-400">{inc.id}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        inc.severity === 'P1_CRITICAL'
                          ? 'bg-red-500/20 text-red-400'
                          : inc.severity === 'P2_HIGH'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {inc.severity.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-white line-clamp-2">{inc.title}</h3>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-[#666666]">
                    <span>Commander: {inc.commander}</span>
                    <span className="capitalize text-emerald-400 font-mono">{inc.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Incident Detail & PIR */}
        <div className="lg:col-span-2 bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-5">
          {selectedIncident ? (
            <>
              <div className="border-b border-[#222636] pb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-blue-400">{selectedIncident.id}</span>
                    <span className="text-xs text-[#666666]">• Started: {selectedIncident.startTime}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedIncident.title}</h2>
                  <p className="text-xs text-[#8890a6] mt-1">{selectedIncident.summary}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                    selectedIncident.status === 'resolved'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {selectedIncident.status}
                </span>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Real-time Incident Event Timeline
                </h3>
                <div className="space-y-2 border-l-2 border-[#222636] ml-2 pl-4">
                  {selectedIncident.timeline.map((event, idx) => (
                    <div key={idx} className="relative text-xs">
                      <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-blue-500" />
                      <div className="font-mono text-[10px] text-blue-400">{event.timestamp} • {event.author}</div>
                      <div className="text-white mt-0.5">{event.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Post Incident Review (PIR) */}
              {selectedIncident.postIncidentReview && (
                <div className="bg-[#161a26] border border-[#283046] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#283046] pb-2">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Statutory Post-Incident Review (PIR)
                    </h3>
                    <span className="text-[10px] font-mono text-[#8890a6]">
                      Owner: {selectedIncident.postIncidentReview.owner}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[#77809a] font-semibold block">Root Cause Analysis:</span>
                      <p className="text-white mt-0.5">{selectedIncident.postIncidentReview.rootCause}</p>
                    </div>

                    <div>
                      <span className="text-[#77809a] font-semibold block">Customer & SLA Impact:</span>
                      <p className="text-white mt-0.5">{selectedIncident.postIncidentReview.customerImpact}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Corrective Actions</span>
                        <ul className="list-disc list-inside text-emerald-300 mt-1 space-y-0.5">
                          {selectedIncident.postIncidentReview.correctiveActions.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#77809a] uppercase font-semibold block">Preventive Action Plan</span>
                        <ul className="list-disc list-inside text-blue-300 mt-1 space-y-0.5">
                          {selectedIncident.postIncidentReview.preventiveActions.map((act, i) => (
                            <li key={i}>{act}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-xs text-[#666666]">
              Select an incident from the ledger to inspect live timeline and PIR details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
