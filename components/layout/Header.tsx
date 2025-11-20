
import React from 'react';
import type { View } from '../../types';
import { SparklesIcon } from '../icons';
import DesktopNav from './DesktopNav';
import Clock from '../common/Clock';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
    activeView: View;
    setView: (view: View) => void;
    showClock: boolean;
}

const Header: React.FC<HeaderProps> = ({ activeView, setView, showClock }) => {
  const { classes } = useTheme();

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-[#131B2E] border-b border-gray-800 shadow-sm`}>
      {/* Thin colored line at the very top for theme branding */}
      <div className={`absolute top-0 left-0 w-full h-[2px] ${classes.bg}`} />
      
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between relative">
        <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => setView('weather')}>
            <div className={`p-1.5 rounded-lg bg-gray-800 group-hover:bg-gray-700 transition-colors`}>
                <SparklesIcon className={`w-5 h-5 ${classes.text}`} />
            </div>
            <h1 className="text-lg font-bold text-white tracking-wide">Meteor</h1>
        </div>
        
        {/* Mobile Clock */}
        {showClock && (
             <div className="lg:hidden text-gray-200 font-medium text-base tracking-wide bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700/50">
                <Clock />
            </div>
        )}

        {/* Desktop Nav */}
        <DesktopNav activeView={activeView} setView={setView} showClock={showClock} />
      </div>
    </header>
  );
};

export default Header;
