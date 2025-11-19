


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

  // Using a solid, specific background color to seamlessly blend with the app background 
  // while matching the PWA status bar color.
  // #131B2E is very close to bg-gray-900 (#111827) but just distinct enough.
  return (
    <header className={`fixed top-0 left-0 right-0 z-40 border-b transition-all duration-300 bg-[#131B2E] ${classes.borderFaded}`}>
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
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
      </div>
    </header>
  );
};

export default Header;