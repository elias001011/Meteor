import React from 'react';
import type { View } from '../../types';

interface DesktopNavProps {
  activeView: View;
  setView: (view: View) => void;
  showClock: boolean;
}

const items: Array<{ label: string; view: View }> = [
  { label: 'Clima', view: 'weather' },
  { label: 'Mapa', view: 'map' },
  { label: 'Meteor IA', view: 'ai' },
  { label: 'Notícias', view: 'news' },
  { label: 'Alertas', view: 'alerts' },
  { label: 'Ajustes', view: 'settings' },
];

const DesktopNav: React.FC<DesktopNavProps> = ({ activeView, setView }) => {
  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
      {items.map(item => {
        const active = activeView === item.view || ((activeView === 'tips' || activeView === 'info') && item.view === 'weather');
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => setView(item.view)}
            aria-current={active ? 'page' : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors xl:px-3.5 ${active ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-200'}`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default DesktopNav;
