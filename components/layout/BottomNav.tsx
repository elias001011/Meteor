
import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../../types';
import { HomeIcon, MapIcon, NewspaperIcon, SettingsIcon, SparklesIcon, LightbulbIcon, InfoIcon, MoreHorizontalIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  activeView: View;
  setView: (view: View) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
  activeColorClass: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, className = '', activeColorClass }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 text-center transition-colors duration-200 ${isActive ? activeColorClass : 'text-gray-400 hover:text-white'} ${className}`}>
    {icon}
    <span className="text-xs mt-1 truncate">{label}</span>
  </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setView }) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { classes, glassClass } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMoreClick = (view: View) => {
    setView(view);
    setIsMoreMenuOpen(false);
  }

  // Close menu when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setIsMoreMenuOpen(false);
          }
      };

      if (isMoreMenuOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [isMoreMenuOpen]);

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] px-4">
      {isMoreMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/30 z-[90]" 
            onClick={() => setIsMoreMenuOpen(false)}
            aria-hidden="true"
        ></div>
      )}

      <div className={`relative bottom-4 ${glassClass} border border-gray-700/50 rounded-full max-w-lg mx-auto h-16 flex justify-around items-center shadow-lg z-[100]`}>
        <NavItem activeColorClass={classes.text} icon={<HomeIcon className="w-6 h-6" />} label="Clima" isActive={activeView === 'weather'} onClick={() => setView('weather')} />
        <NavItem activeColorClass={classes.text} icon={<MapIcon className="w-6 h-6" />} label="Mapa" isActive={activeView === 'map'} onClick={() => setView('map')} />
        <NavItem activeColorClass={classes.text} icon={<SparklesIcon className="w-6 h-6" />} label="IA" isActive={activeView === 'ai'} onClick={() => setView('ai')} />
        <NavItem activeColorClass={classes.text} icon={<LightbulbIcon className="w-6 h-6" />} label="Dicas" isActive={activeView === 'tips'} onClick={() => setView('tips')} />
        
        {/* Anchored More Menu */}
        <div className="relative" ref={menuRef}>
            {isMoreMenuOpen && (
                <div className={`absolute bottom-full right-0 mb-3 ${glassClass} border border-gray-600/50 rounded-2xl shadow-lg flex flex-col items-start p-2 gap-1 animate-enter-pop min-w-[140px] z-[150]`}>
                    <NavItem activeColorClass={classes.text} icon={<NewspaperIcon className="w-5 h-5" />} label="Notícias" isActive={activeView === 'news'} onClick={() => handleMoreClick('news')} className="w-full !flex-row !justify-start gap-3 !h-10 px-2" />
                    <NavItem activeColorClass={classes.text} icon={<InfoIcon className="w-5 h-5" />} label="Informações" isActive={activeView === 'info'} onClick={() => handleMoreClick('info')} className="w-full !flex-row !justify-start gap-3 !h-10 px-2" />
                    <NavItem activeColorClass={classes.text} icon={<SettingsIcon className="w-5 h-5" />} label="Ajustes" isActive={activeView === 'settings'} onClick={() => handleMoreClick('settings')} className="w-full !flex-row !justify-start gap-3 !h-10 px-2" />
                </div>
            )}
            <NavItem activeColorClass={classes.text} icon={<MoreHorizontalIcon className="w-6 h-6" />} label="Mais" isActive={isMoreMenuOpen} onClick={() => setIsMoreMenuOpen(prev => !prev)} />
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
