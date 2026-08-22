import React from 'react';
import type { View } from '../../types';
import { useTheme } from '../context/ThemeContext';

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
  const { classes } = useTheme();
  return (
    <nav className="hidden items-center rounded-full border border-white/[0.08] bg-white/[0.045] p-1 lg:flex" aria-label="Navegação principal">
      {items.map(item => {
        const active = activeView === item.view || ((activeView === 'tips' || activeView === 'info') && item.view === 'weather');
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => setView(item.view)}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors xl:px-4 ${active ? `${classes.bg} text-white shadow-lg` : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'}`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
};

export default DesktopNav;
