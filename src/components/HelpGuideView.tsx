import React, { useMemo, useState } from 'react';
import { BookOpen, Search, ArrowRight } from 'lucide-react';
import type { NavTabId } from './Sidebar';
import { HELP_TOPICS } from '../data/helpTopics';
import { InfoButton } from './InfoButton';

interface HelpGuideViewProps {
  onNavigate: (tab: NavTabId) => void;
}

export const HelpGuideView: React.FC<HelpGuideViewProps> = ({ onNavigate }) => {
  const [query, setQuery] = useState('');
  const groupedTopics = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    const filtered = HELP_TOPICS.filter(topic => !normalized || [topic.title, topic.category, topic.description, ...topic.features.flatMap(feature => [feature.title, feature.description])].join(' ').toLocaleLowerCase().includes(normalized));
    return filtered.reduce<Record<string, typeof HELP_TOPICS>>((groups, topic) => {
      (groups[topic.category] ||= []).push(topic);
      return groups;
    }, {});
  }, [query]);

  return (
    <section className="space-y-6" aria-labelledby="screen-guide-title">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-300 mb-2"><BookOpen className="w-4 h-4" /><span className="text-[10px] uppercase tracking-[0.18em] font-bold">ALTIL Help Centre</span></div>
          <h1 id="screen-guide-title" className="text-2xl font-semibold text-white flex items-center gap-2">Project Overview & Screen Guide <InfoButton title="Project Overview & Screen Guide" description="Browse what ALTIL does, what each screen offers, and what the main sections and tools are for." /></h1>
          <p className="text-sm text-[#999] mt-2 max-w-3xl">ALTIL governs AI services across tenants and applications, combining gateway configuration, operations, security, compliance, service management, and cost oversight.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#666]" />
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search screens and capabilities" aria-label="Search screen guide" className="w-full rounded-lg bg-[#111] border border-[#303030] py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-blue-500" />
        </div>
      </header>

      <div className="rounded-lg border border-[#282828] bg-[#111] p-4 text-xs text-[#aaa] leading-relaxed">
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-1.5">How to read this guide <InfoButton title="How to read this guide" description="Use search to find a screen, tab, or capability. Screen cards navigate directly to that workspace; each feature has its own information button." /></h2>
        Use the global scope selector to focus supported work on a company, tenant, or application. Some areas combine backend-backed records with local or sample UI data; a simulated or live-looking value does not by itself confirm an external integration is connected.
      </div>

      {(Object.entries(groupedTopics) as [string, typeof HELP_TOPICS][]).map(([category, topics]) => (
        <section key={category} className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#777] flex items-center gap-1.5">{category} <InfoButton title={category} description={`Screens in the ${category} area of ALTIL.`} /></h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {topics.map(topic => (
              <article key={topic.id} className="rounded-lg border border-[#282828] bg-[#101010] p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">{topic.title} <InfoButton title={topic.title} description={topic.description} /></h3>
                  <button onClick={() => onNavigate(topic.id)} className="shrink-0 flex items-center gap-1 text-[11px] text-blue-300 hover:text-white">Open screen <ArrowRight className="w-3 h-3" /></button>
                </div>
                <p className="text-xs leading-relaxed text-[#999] mt-2">{topic.description}</p>
                {topic.features.length > 0 && <div className="mt-3 pt-3 border-t border-[#242424] grid gap-2">
                  {topic.features.map(feature => <div key={feature.title} className="flex items-start gap-1.5">
                    <InfoButton title={feature.title} description={feature.description} className="mt-0.5 shrink-0" />
                    <p className="text-[11px] leading-relaxed text-[#888]"><span className="text-[#c5c5c5] font-medium">{feature.title}:</span> {feature.description}</p>
                  </div>)}
                </div>}
              </article>
            ))}
          </div>
        </section>
      ))}
      {Object.keys(groupedTopics).length === 0 && <p className="text-sm text-[#888] py-8 text-center">No screens or capabilities matched “{query}”.</p>}
    </section>
  );
};
