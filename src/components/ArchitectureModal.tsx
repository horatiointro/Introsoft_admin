import React from 'react';
import { AltilLogo } from './AltilLogo';
import {
  X,
  Layers,
  ArrowDown,
  Shield,
  Server,
  AppWindow,
  Cpu,
  CheckCircle2,
  Lock,
  GitFork,
  Zap
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#111111] border border-[#222222] rounded max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-[#e5e5e5]">
        {/* Header with Company Logo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222222] bg-[#111111] sticky top-0 z-10">
          <div className="flex items-center space-x-3.5">
            <AltilLogo size="lg" />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Introsoft ALTIL 3-Layer Architecture
              </h2>
              <p className="text-xs text-[#888888]">
                Governed abstraction between consuming applications and underlying AI infrastructure
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#888888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Key Principle Banner */}
          <div className="p-4 rounded bg-[#141414] border border-blue-500/30 text-[#e5e5e5] text-xs leading-relaxed flex items-start space-x-3">
            <Shield className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-semibold mb-1 font-mono text-[11px] uppercase tracking-wider">
                Core Architectural Principle: Provider Independence
              </strong>
              Applications do not know or care which AI provider is serving the request. You can swap from
              <span className="text-blue-400 font-mono mx-1">Ollama → Groq</span> or
              <span className="text-blue-400 font-mono mx-1">Groq → Gemini</span> with zero code changes in consuming apps.
            </div>
          </div>

          {/* Layer 1 */}
          <div className="border border-[#222222] bg-[#141414] rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a0a0a] text-blue-300 border border-[#222222] uppercase font-mono">
                  Layer 1
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <AppWindow className="w-4 h-4 text-blue-400" />
                  Consumers (Introsoft Applications)
                </h3>
              </div>
              <span className="text-xs text-[#888888] font-mono">Consumes ALTIL API only</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
              {['Introsoft Website', 'FinEduca', 'SafeCircle', 'Cash Creators', 'MVI Secure', 'Future Apps'].map(app => (
                <div key={app} className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] font-mono text-[11px] text-[#e5e5e5]">
                  {app}
                </div>
              ))}
            </div>
          </div>

          {/* Arrow Down Connector */}
          <div className="flex flex-col items-center justify-center my-1">
            <div className="text-[10px] font-mono text-blue-400 bg-[#0a0a0a] px-3 py-1 rounded border border-[#222222] flex items-center space-x-1.5 shadow-sm">
              <span>POST /api/v1/orchestrate (Capability / Task + API Key)</span>
              <ArrowDown className="w-3 h-3 text-blue-400" />
            </div>
          </div>

          {/* Layer 2 */}
          <div className="border border-blue-500/40 bg-[#141414] rounded p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase font-mono">
                  Layer 2
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  ALTIL AI Orchestration & Governance Engine
                </h3>
              </div>
              <span className="text-xs text-green-400 font-mono flex items-center gap-1">
                <span>●</span> High Availability Router
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { title: 'Authentication', desc: 'App identity & key validation', icon: Lock },
                { title: 'Model Routing', desc: 'Primary & fallback chains', icon: GitFork },
                { title: 'AI Policies', desc: 'Financial data & PII redaction', icon: Shield },
                { title: 'Usage & Quotas', desc: 'Rate limiting & token budgets', icon: Zap },
                { title: 'Model Manager', desc: 'Provider-to-model decoupling', icon: Cpu },
                { title: 'Health Monitor', desc: 'Live latency & cluster probes', icon: CheckCircle2 },
                { title: 'Audit Trail', desc: 'Privacy-preserving immutable logs', icon: Layers },
                { title: 'Capability Engine', desc: 'Task-level orchestration', icon: Server }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="p-2.5 rounded bg-[#0a0a0a] border border-[#222222] flex flex-col space-y-1">
                    <div className="flex items-center space-x-1.5 text-blue-400 font-semibold font-mono text-[11px]">
                      <Icon className="w-3.5 h-3.5 text-blue-400" />
                      <span>{item.title}</span>
                    </div>
                    <p className="text-[10px] text-[#888888]">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Arrow Down Connector */}
          <div className="flex flex-col items-center justify-center my-1">
            <div className="text-[10px] font-mono text-green-400 bg-[#0a0a0a] px-3 py-1 rounded border border-[#222222] flex items-center space-x-1.5 shadow-sm">
              <span>Optimized Egress Dispatch (Local LPU / GPU / Enterprise Cloud)</span>
              <ArrowDown className="w-3 h-3 text-green-400" />
            </div>
          </div>

          {/* Layer 3 */}
          <div className="border border-[#222222] bg-[#141414] rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0a0a0a] text-[#888888] border border-[#222222] uppercase font-mono">
                  Layer 3
                </span>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-400" />
                  AI Infrastructure & Providers
                </h3>
              </div>
              <span className="text-xs text-[#888888] font-mono">Decoupled execution engines</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222]">
                <div className="font-semibold text-white mb-1 font-mono text-xs">Ollama Cluster</div>
                <div className="text-[11px] text-[#888888]">Local GPU Cluster</div>
                <div className="mt-2 text-[10px] text-blue-400 font-mono">qwen3.6:16k, sec-analyst</div>
              </div>
              <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222]">
                <div className="font-semibold text-white mb-1 font-mono text-xs">Groq Cloud LPU</div>
                <div className="text-[11px] text-[#888888]">Ultra-fast inference</div>
                <div className="mt-2 text-[10px] text-orange-400 font-mono">llama-3.3-70b, deepseek-r1</div>
              </div>
              <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222]">
                <div className="font-semibold text-white mb-1 font-mono text-xs">Google Gemini</div>
                <div className="text-[11px] text-[#888888]">Multimodal & 2M Context</div>
                <div className="mt-2 text-[10px] text-green-400 font-mono">gemini-2.5-flash / pro</div>
              </div>
              <div className="p-3 rounded bg-[#0a0a0a] border border-[#222222]">
                <div className="font-semibold text-white mb-1 font-mono text-xs">Future Providers</div>
                <div className="text-[11px] text-[#888888]">OpenRouter / On-Prem</div>
                <div className="mt-2 text-[10px] text-[#666666] font-mono">Custom OpenAI API</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#222222] bg-[#111111] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
          >
            Close Architecture View
          </button>
        </div>
      </div>
    </div>
  );
};
