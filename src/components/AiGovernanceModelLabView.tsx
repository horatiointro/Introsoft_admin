import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Cpu,
  BarChart2,
  Lock,
  Zap,
  DollarSign
} from 'lucide-react';
import {
  AiModelGovernanceRecord,
  ModelEvalBenchmark,
  ModelLifecycleState
} from '../types';
import {
  initialAiModelGovernance,
  initialModelEvalBenchmarks
} from '../data/initialState';

export const AiGovernanceModelLabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'model_governance' | 'model_lab'>('model_governance');

  // Governance records state
  const [governanceRecords, setGovernanceRecords] = useState<AiModelGovernanceRecord[]>(initialAiModelGovernance);

  // Evaluation benchmarks state
  const [benchmarks, setBenchmarks] = useState<ModelEvalBenchmark[]>(initialModelEvalBenchmarks);

  // Interactive workload weightings state for the Evaluation Lab
  const [weights, setWeights] = useState({
    latency: 25,
    cost: 25,
    security: 25,
    accuracy: 25
  });

  const lifecycleSteps: ModelLifecycleState[] = [
    'DISCOVERED',
    'ASSESSED',
    'SECURITY_TESTED',
    'APPROVED',
    'PRODUCTION',
    'MONITORED',
    'REVIEW',
    'RETIRED'
  ];

  // Calculate weighted recommendation score for a model
  const calculateRecommendationScore = (b: ModelEvalBenchmark) => {
    const latScore = Math.max(0, 100 - b.latencyMs / 10);
    const costScore = Math.max(0, 100 - b.costPer1kTokens * 10000);
    const secScore = (b.securityScore + b.piiMaskingScore + b.promptInjectionDefenseScore) / 3;
    const accScore = (b.accuracyScore + b.reasoningScore + b.codingScore) / 3;

    const totalWeight = weights.latency + weights.cost + weights.security + weights.accuracy;
    const finalScore =
      (latScore * weights.latency +
        costScore * weights.cost +
        secScore * weights.security +
        accScore * weights.accuracy) /
      (totalWeight || 1);

    return Math.round(finalScore);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12141c] border border-[#222636] p-5 rounded-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
              AI Risk Governance & Benchmark Lab
            </span>
            <span className="text-xs text-emerald-400 font-mono">Model Lifecycle & Evaluation Matrix</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">AI Model Governance & Evaluation Lab</h1>
          <p className="text-xs text-[#8890a6] mt-0.5">
            Audit AI model lifecycles, enforce approved use cases, and run weighted benchmark evaluations across Gemini, Groq, Ollama & OpenAI.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#222636] pb-3 text-xs font-mono overflow-x-auto">
        <button
          onClick={() => setActiveTab('model_governance')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'model_governance' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          AI Model Governance Register
        </button>
        <button
          onClick={() => setActiveTab('model_lab')}
          className={`px-3.5 py-2 rounded transition-colors flex items-center gap-1.5 ${activeTab === 'model_lab' ? 'bg-blue-600 text-white font-bold' : 'text-[#8890a6] hover:text-white bg-[#141824]'}`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Model Evaluation Lab & Workload Recommender
        </button>
      </div>

      {/* 1. MODEL GOVERNANCE REGISTER */}
      {activeTab === 'model_governance' && (
        <div className="space-y-6">
          {/* Lifecycle State Pipeline */}
          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-mono font-bold text-[#77809a] uppercase">Enterprise AI Model Lifecycle Pipeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-8 gap-2">
              {lifecycleSteps.map((step, idx) => (
                <div
                  key={step}
                  className={`p-2 rounded text-center font-mono text-[10px] font-bold border ${
                    step === 'PRODUCTION'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : step === 'APPROVED' || step === 'SECURITY_TESTED'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-[#161a26] text-[#77809a] border-[#242c40]'
                  }`}
                >
                  {idx + 1}. {step}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {governanceRecords.map(rec => (
              <div key={rec.id} className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#222636] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{rec.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                        {rec.lifecycleState}
                      </span>
                    </div>
                    <p className="text-xs text-[#8890a6]">Provider: {rec.provider} | Context Window: {rec.contextWindow}</p>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-[#77809a]">Risk Rating:</span>
                    <span className="px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {rec.riskRating}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-1">
                    <span className="text-[10px] text-[#77809a] uppercase">Approved Use Cases</span>
                    <ul className="text-emerald-400 list-disc list-inside space-y-0.5">
                      {rec.approvedUseCases.map((uc, i) => <li key={i}>{uc}</li>)}
                    </ul>
                  </div>

                  <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-1">
                    <span className="text-[10px] text-[#77809a] uppercase">Prohibited Use Cases</span>
                    <ul className="text-rose-400 list-disc list-inside space-y-0.5">
                      {rec.prohibitedUseCases.map((uc, i) => <li key={i}>{uc}</li>)}
                    </ul>
                  </div>

                  <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-[#77809a]">Data Residency:</span><span className="text-white font-bold">{rec.dataResidency}</span></div>
                    <div className="flex justify-between"><span className="text-[#77809a]">PII Handling:</span><span className="text-emerald-400 font-bold">{rec.piiHandlingRating}</span></div>
                    <div className="flex justify-between"><span className="text-[#77809a]">Hallucination Rate:</span><span className="text-amber-400 font-bold">{rec.hallucinationRatePercent}%</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. MODEL EVALUATION LAB */}
      {activeTab === 'model_lab' && (
        <div className="space-y-6">
          {/* Workload Weighting Controls */}
          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Configure Workload Priority Weightings
            </h3>
            <p className="text-xs text-[#8890a6]">Adjust priority sliders to generate a mathematical model recommendation for your workload.</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
                <div className="flex justify-between"><span className="text-[#8890a6]">Latency Priority:</span><span className="text-blue-400 font-bold">{weights.latency}%</span></div>
                <input type="range" min="0" max="100" value={weights.latency} onChange={e => setWeights({ ...weights, latency: Number(e.target.value) })} className="w-full" />
              </div>
              <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
                <div className="flex justify-between"><span className="text-[#8890a6]">Cost Efficiency:</span><span className="text-emerald-400 font-bold">{weights.cost}%</span></div>
                <input type="range" min="0" max="100" value={weights.cost} onChange={e => setWeights({ ...weights, cost: Number(e.target.value) })} className="w-full" />
              </div>
              <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
                <div className="flex justify-between"><span className="text-[#8890a6]">Security & PII Defense:</span><span className="text-purple-400 font-bold">{weights.security}%</span></div>
                <input type="range" min="0" max="100" value={weights.security} onChange={e => setWeights({ ...weights, security: Number(e.target.value) })} className="w-full" />
              </div>
              <div className="bg-[#161a26] p-3 rounded-lg border border-[#242c40] space-y-2">
                <div className="flex justify-between"><span className="text-[#8890a6]">Reasoning & Accuracy:</span><span className="text-amber-400 font-bold">{weights.accuracy}%</span></div>
                <input type="range" min="0" max="100" value={weights.accuracy} onChange={e => setWeights({ ...weights, accuracy: Number(e.target.value) })} className="w-full" />
              </div>
            </div>
          </div>

          {/* Benchmark Evaluation Matrix */}
          <div className="bg-[#12141c] border border-[#222636] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Side-by-Side Model Benchmark Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#181c28] text-[#77809a] uppercase border-b border-[#242c40]">
                  <tr>
                    <th className="py-2.5 px-3">Model Candidate</th>
                    <th className="py-2.5 px-3">Avg Latency</th>
                    <th className="py-2.5 px-3">Cost / 1k Tokens</th>
                    <th className="py-2.5 px-3">Accuracy</th>
                    <th className="py-2.5 px-3">Security & PII</th>
                    <th className="py-2.5 px-3">Calculated Workload Recommendation Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e2436] text-[#b0b8d0]">
                  {benchmarks.map((b, idx) => {
                    const score = calculateRecommendationScore(b);
                    return (
                      <tr key={idx} className="hover:bg-[#161a26]">
                        <td className="py-2.5 px-3 font-semibold text-white">
                          {b.modelName}
                          <span className="block text-[10px] text-[#77809a]">{b.provider}</span>
                        </td>
                        <td className="py-2.5 px-3 text-blue-400 font-bold">{b.latencyMs}ms</td>
                        <td className="py-2.5 px-3 text-emerald-400">${b.costPer1kTokens}</td>
                        <td className="py-2.5 px-3 text-white">{b.accuracyScore}/100</td>
                        <td className="py-2.5 px-3 text-purple-400">{b.securityScore}/100</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2.5 py-1 rounded font-bold text-xs ${
                            score >= 93 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>
                            {score} / 100 Match Rating
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
      )}
    </div>
  );
};
