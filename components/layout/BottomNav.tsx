import React, { useEffect, useRef, useState } from 'react';
import type { View } from '../../types';
import { BellIcon, HomeIcon, MapIcon, MaximizeIcon, MoreHorizontalIcon, NewspaperIcon, SettingsIcon, SparklesIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  activeView: View;
  setView: (view: View) => void;
  onToggleZenMode: () => void;
}

interface NavButtonProps {
  active: boolean;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ active, label, icon, onClick }) => {
  const { classes } = useTheme();
  return (
    <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={`flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[10px] font-bold transition-colors ${active ? `${classes.text} bg-white/[0.07]` : 'text-slate-500 hover:text-slate-200'}`}>
      {icon}<span className="max-w-full truncate px-1">{label}</span>
    </button>
  );
};

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setView, onToggleZenMode }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { classes, isAmoled } = useTheme();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const choose = (view: View) => { setView(view); setOpen(false); };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] px-2 pb-safe lg:hidden" ref={menuRef}>
      {open && (
        <>
          <button type="button" className="fixed inset-0 -z-10 bg-black/55 backdrop-blur-[2px]" onClick={() => setOpen(false)} aria-label="Fechar menu" />
          <div className={`absolute bottom-[5.25rem] right-3 w-56 rounded-3xl border border-white/10 p-2 shadow-2xl ${isAmoled ? 'bg-black' : 'bg-[#0a1525]/95 backdrop-blur-2xl'}`}>
            <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Mais opções</p>
            {[
              { view: 'alerts' as View, label: 'Alertas meteorológicos', icon: <BellIcon className="h-5 w-5" /> },
              { view: 'settings' as View, label: 'Ajustes', icon: <SettingsIcon className="h-5 w-5" /> },
            ].map(item => (
              <button key={item.view} type="button" onClick={() => choose(item.view)} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition-colors ${activeView === item.view ? `${classes.text} bg-white/[0.07]` : 'text-slate-300 hover:bg-white/[0.06]'}`}>
                {item.icon}{item.label}
              </button>
            ))}
            <div className="my-1 border-t border-white/[0.07]" />
            <button type="button" onClick={() => { onToggleZenMode(); setOpen(false); }} className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold text-slate-300 hover:bg-white/[0.06]">
              <MaximizeIcon className="h-5 w-5" /> Modo Zen
            </button>
          </div>
        </>
      )}

      <nav className={`mx-auto flex max-w-xl items-center gap-1 rounded-[1.5rem] border border-white/10 p-1.5 shadow-[0_18px_55px_rgba(0,0,0,0.55)] ${isAmoled ? 'bg-black' : 'bg-[#07111f]/94 backdrop-blur-2xl'}`} aria-label="Navegação principal">
        <NavButton label="Clima" active={activeView === 'weather' || activeView === 'tips' || activeView === 'info'} onClick={() => choose('weather')} icon={<HomeIcon className="h-5 w-5" />} />
        <NavButton label="Mapa" active={activeView === 'map'} onClick={() => choose('map')} icon={<MapIcon className="h-5 w-5" />} />
        <NavButton label="Meteor IA" active={activeView === 'ai'} onClick={() => choose('ai')} icon={<SparklesIcon className="h-5 w-5" />} />
        <NavButton label="Notícias" active={activeView === 'news'} onClick={() => choose('news')} icon={<NewspaperIcon className="h-5 w-5" />} />
        <NavButton label="Mais" active={open || activeView === 'alerts' || activeView === 'settings'} onClick={() => setOpen(value => !value)} icon={<MoreHorizontalIcon className="h-5 w-5" />} />
      </nav>
    </div>
  );
};

export default BottomNav;
