import React, { createContext, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, X } from 'lucide-react';
import type { NavTabId } from './Sidebar';
import { getFeatureHelp, getHelpTopic } from '../data/helpTopics';

interface HelpContextValue {
  activeTab: NavTabId;
  onOpenGuide: () => void;
}

export const HelpContext = createContext<HelpContextValue>({ activeTab: 'command_centre', onOpenGuide: () => undefined });

interface InfoButtonProps {
  title?: string;
  description?: string;
  className?: string;
}

export const InfoButton: React.FC<InfoButtonProps> = ({ title, description, className = '' }) => {
  const { activeTab, onOpenGuide } = useContext(HelpContext);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const heading = buttonRef.current?.closest('h1,h2,h3');
  const inferredTitle = heading?.textContent?.replace(/\s+/g, ' ').trim() || '';
  const helpTitle = title || inferredTitle || getHelpTopic(activeTab)?.title || 'Screen information';
  const feature = getFeatureHelp(helpTitle);
  const helpDescription = description || feature?.description || getHelpTopic(activeTab)?.description || 'This section provides tools and information for the current workspace.';

  return (
    <span className={`relative inline-flex align-middle ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`More information about ${helpTitle}`}
        aria-expanded={open}
        title={`More information about ${helpTitle}`}
        onClick={(event) => {
          event.stopPropagation();
          if (!open) {
            const bounds = event.currentTarget.getBoundingClientRect();
            setPosition({ top: bounds.bottom + 8, left: Math.max(8, Math.min(bounds.left, window.innerWidth - 296)) });
          }
          setOpen(value => !value);
        }}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[#777] hover:text-blue-300 hover:bg-blue-500/10 focus:outline-none focus:ring-1 focus:ring-blue-400"
      >
        <CircleHelp className="w-3.5 h-3.5" />
      </button>
      {open && createPortal(
        <div role="dialog" aria-label={`${helpTitle} information`} style={{ top: position.top, left: position.left }} className="fixed z-[100] w-72 p-3 rounded-lg border border-[#303030] bg-[#151515] text-left text-xs text-[#c7c7c7] shadow-2xl normal-case font-normal tracking-normal whitespace-normal">
          <span className="flex items-start justify-between gap-2 mb-1.5">
            <strong className="text-white text-xs">{helpTitle}</strong>
            <button type="button" aria-label="Close information" onClick={(event) => { event.stopPropagation(); setOpen(false); }} className="text-[#777] hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </span>
          <span className="block leading-relaxed">{helpDescription}</span>
          <button type="button" onClick={() => { setOpen(false); onOpenGuide(); }} className="mt-2 text-blue-300 hover:text-blue-200 font-medium">Open full Screen Guide →</button>
        </div>,
        document.body
      )}
    </span>
  );
};
