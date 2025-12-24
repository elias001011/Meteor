
import React from 'react';
import type { View, BorderEffectMode } from '../../types';
import { SparklesIcon, MaximizeIcon } from '../icons';
import DesktopNav from './DesktopNav';
import Clock from '../common/Clock';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
    activeView: View;
    setView: (view: View) => void;
    showClock: boolean;
    borderEffect: BorderEffectMode;
    onToggleZenMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setView, showClock, borderEffect, onToggleZenMode }) => {
  const { classes, headerClass } = useTheme();

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${headerClass}`}>
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
            <SparklesIcon className={`w-6 h-6 ${classes.text}`} />
            <h1 className="text-xl font-bold text-white tracking-wider">Meteor</h1>
        </div>
        
        {/* Mobile Clock */}
        {showClock && (
             <div className="lg:hidden text-white font-medium text-lg">
                <Clock />
            </div>
        )}

        {/* Desktop Nav */}
        <DesktopNav activeView={activeView} setView={setView} showClock={showClock} />
        
        {/* Zen Mode Trigger (Desktop only here, Mobile via BottomNav) */}
        <button 
            onClick={onToggleZenMode}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors text-sm text-gray-300 hover:text-white group"
            title="Modo Zen (Imersivo)"
        >
            <MaximizeIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Zen</span>
        </button>
        
        {/* --- LED BORDER EFFECT --- */}
        {borderEffect === 'bottom' && (
            <div 
                className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r ${classes.gradient}`}
                style={{ 
                    boxShadow: `0 1px 8px -1px ${classes.hex}`,
                    opacity: 0.8
                }}
            />
        )}
        {borderEffect === 'top' && (
            <div 
                className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r ${classes.gradient}`}
                style={{ 
                    boxShadow: `0 0 15px 1px ${classes.hex}`,
                    opacity: 0.9
                }}
            />
        )}
      </div>
    </header>
  );
};

export default Header;
