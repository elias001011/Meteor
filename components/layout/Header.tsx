import React from 'react';
import type { BorderEffectMode, View } from '../../types';
import Clock from '../common/Clock';
import { MaximizeIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import DesktopNav from './DesktopNav';

interface HeaderProps {
  activeView: View;
  setView: (view: View) => void;
  showClock: boolean;
  borderEffect: BorderEffectMode;
  onToggleZenMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setView, showClock, borderEffect, onToggleZenMode }) => {
  const { classes, isAmoled } = useTheme();
  return (
    <header className={`fixed inset-x-0 top-0 z-40 border-b border-white/[0.08] ${isAmoled ? 'bg-black' : 'bg-[#06101d]/88 backdrop-blur-2xl'}`}>
      <div className="relative mx-auto flex h-20 max-w-[1540px] items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => setView('weather')} className="flex items-center gap-2.5 rounded-xl" aria-label="Abrir o clima">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.055] shadow-lg">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
          </span>
          <span className="text-lg font-black tracking-[-0.035em] text-white sm:text-xl">Meteor</span>
        </button>

        <DesktopNav activeView={activeView} setView={setView} showClock={showClock} />

        <div className="flex min-w-[4rem] items-center justify-end gap-2">
          {showClock && <div className="hidden text-sm font-semibold tabular-nums text-slate-400 xl:block"><Clock /></div>}
          <button type="button" onClick={onToggleZenMode} className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white lg:flex" title="Abrir modo Zen" aria-label="Abrir modo Zen">
            <MaximizeIcon className="h-[18px] w-[18px]" />
          </button>
          {showClock && <div className="text-sm font-bold tabular-nums text-white lg:hidden"><Clock /></div>}
        </div>

        {borderEffect !== 'none' && <div className={`absolute ${borderEffect === 'top' ? 'top-0' : 'bottom-0'} left-6 right-6 h-px bg-gradient-to-r ${classes.gradient} opacity-45`} />}
      </div>
    </header>
  );
};

export default Header;
