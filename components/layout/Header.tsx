
import React from 'react';
import type { View } from '../../types';
import { SparklesIcon } from '../icons';
import DesktopNav from './DesktopNav';
import Clock from '../common/Clock';

interface HeaderProps {
    activeView: View;
    setView: (view: View) => void;
    showClock: boolean;
    behavior?: 'fixed' | 'scroll';
}

const Header: React.FC<HeaderProps> = ({ activeView, setView, showClock, behavior = 'fixed' }) => {
  // behavior 'fixed' = CSS fixed (stays at top of viewport)
  // behavior 'scroll' = CSS relative (stays at top of document, scrolls away)
  
  const positionClass = behavior === 'fixed' ? 'fixed top-0 left-0 right-0' : 'relative w-full';
  
  return (
    <header className={`${positionClass} z-40 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 transition-colors duration-300`}>
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-cyan-400" />
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
