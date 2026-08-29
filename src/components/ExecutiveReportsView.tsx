import React from 'react';
import { FileSpreadsheet, Download, FileText, CheckCircle2, Calendar, Share2 } from 'lucide-react';
import { ExecutiveReport } from '../types';

interface ExecutiveReportsViewProps {
  reports: ExecutiveReport[];
}

export const ExecutiveReportsView: React.FC<ExecutiveReportsViewProps> = ({ reports }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">
              C-Suite Board Deliverables
            </span>
            <span className="text-xs text-emerald-400 font-mono">Automated PDF / CSV Generator</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Executive Reports & Audit Deliverables</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Download monthly SLA audit summaries, FinOps board packs, CISO threat intelligence briefings, and statutory POPIA/GDPR compliance packs.
          </p>
        </div>

        <button className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20">
          <Download className="w-4 h-4" />
          Export All Monthly Reports (ZIP)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map(rep => (
          <div key={rep.id} className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">{rep.type.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-[#666666] font-mono">{rep.period}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{rep.title}</h3>
              <p className="text-xs text-[#8890a6]">Generated at: {rep.generatedAt}</p>

              <div className="bg-[#161a26] border border-[#242c40] rounded-lg p-3 space-y-1.5 mt-3 text-xs">
                {Object.entries(rep.summaryMetrics).map(([key, val]) => (
                  <div key={key} className="flex justify-between font-mono">
                    <span className="text-[#77809a]">{key}:</span>
                    <span className="text-white font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#222636] flex items-center justify-between gap-2">
              <button className="flex-1 py-1.5 rounded bg-[#181c28] hover:bg-[#22283a] border border-[#283046] text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Download PDF
              </button>
              <button className="flex-1 py-1.5 rounded bg-[#181c28] hover:bg-[#22283a] border border-[#283046] text-white text-xs font-mono font-semibold flex items-center justify-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                Export CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
