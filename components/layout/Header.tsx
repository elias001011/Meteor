
import React from 'react';
import type { View } from '../../types';
import { SparklesIcon, BellIcon } from '../icons';
import DesktopNav from './DesktopNav';
import Clock from '../common/Clock';
import { getSettings } from '../../services/settingsService'; 
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
    activeView: View;
    setView: (view: View) => void;
    showClock: boolean;
    unreadCount: number;
    onOpenNotifications: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setView, showClock, unreadCount, onOpenNotifications }) => {
  const { classes } = useTheme();
  
  // Check if history is enabled to decide whether to show the bell
  const settings = getSettings();
  const showNotifications = settings.notificationConfig.historyEnabled;

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 border-b transition-all duration-300 bg-[#131B2E] ${classes.borderFaded}`}>
      <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <SparklesIcon className={`w-6 h-6 ${classes.text}`} />
            <h1 className="text-xl font-bold text-white tracking-wider">Meteor</h1>
        </div>
        
        {/* Mobile Actions (Clock or Notification) */}
        <div className="lg:hidden flex items-center gap-3">
             {showClock && (
                 <div className="text-white font-medium text-lg">
                    <Clock />
                </div>
            )}
            
            {showNotifications && (
                <button 
                    onClick={onOpenNotifications}
                    className="relative p-2 text-gray-300 hover:text-white transition-colors"
                    aria-label="Notificações"
                >
                    <BellIcon className="w-6 h-6" />
                    {unreadCount > 0 && (
                        <span className={`absolute top-1 right-1 w-2.5 h-2.5 ${classes.bg} rounded-full border border-gray-900`}></span>
                    )}
                </button>
            )}
        </div>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-4">
            <DesktopNav activeView={activeView} setView={setView} showClock={showClock} />
             {showNotifications && (
                <button 
                    onClick={onOpenNotifications}
                    className="relative p-2 text-gray-300 hover:text-white transition-colors ml-2"
                    aria-label="Notificações"
                >
                    <BellIcon className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <span className={`absolute top-1.5 right-1.5 w-2 h-2 ${classes.bg} rounded-full border border-gray-900`}></span>
                    )}
                </button>
             )}
        </div>
      </div>
    </header>
  );
};

export default Header;