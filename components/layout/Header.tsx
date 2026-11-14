import React from 'react';
import type { BorderEffectMode, View } from '../../types';
import Clock from '../common/Clock';
import { MaximizeIcon, SunIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import DesktopNav from './DesktopNav';

interface HeaderProps {
  activeView: View;
  setView: (view: View) => void;
  showClock: boolean;
  borderEffect: BorderEffectMode;
  onToggleZenMode: () => void;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setView, showClock, borderEffect, onToggleZenMode, onToggleTheme }) => {
  const { classes, isAmoled, isLight } = useTheme();
  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b border-white/[0.07] ${isAmoled ? 'bg-black' : 'bg-canvas/95 backdrop-blur-md'}`}>
      {borderEffect !== 'none' && <div className={`pointer-events-none absolute ${borderEffect === 'top' ? 'top-0' : 'bottom-0'} inset-x-0 h-px bg-gradient-to-r ${classes.gradient} opacity-45`} />}
      <div className="relative mx-auto flex h-16 max-w-[1380px] items-center justify-between gap-5 px-4 sm:px-6">
        <button type="button" onClick={() => setView('weather')} className="flex items-center gap-2.5 rounded-xl" aria-label="Abrir o clima">
          <img src="/favicon.svg" alt="" className={`h-8 w-8 ${isLight ? "brightness-[0.25]" : ""}`} />
          <span className="text-lg font-semibold tracking-[-0.025em] text-white">Meteor<span className="ml-2 align-top font-mono text-[10px] font-normal tracking-normal text-slate-400">3.0</span></span>
        </button>

        <DesktopNav activeView={activeView} setView={setView} showClock={showClock} />

        <div className="flex min-w-[4rem] items-center justify-end gap-2">
          <button type="button" onClick={onToggleTheme} aria-label={isLight ? 'Ativar tema escuro' : 'Ativar tema claro'} title={isLight ? 'Ativar tema escuro' : 'Ativar tema claro'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"><SunIcon className="h-[18px] w-[18px]" /></button>
          {showClock && <div className="hidden text-sm font-semibold tabular-nums text-slate-400 xl:block"><Clock /></div>}
          <button type="button" onClick={onToggleZenMode} className="hidden h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-white lg:flex" title="Abrir modo Zen" aria-label="Abrir modo Zen">
            <MaximizeIcon className="h-[18px] w-[18px]" />
          </button>
          {showClock && <div className="text-sm font-bold tabular-nums text-white lg:hidden"><Clock /></div>}
        </div>

      </div>
    </header>
  );
};

export default Header;
