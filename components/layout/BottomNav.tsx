
import React, { useState, useEffect, useRef } from 'react';
import type { View } from '../../types';
import { HomeIcon, MapIcon, NewspaperIcon, SettingsIcon, SparklesIcon, LightbulbIcon, BellIcon, MoreHorizontalIcon, MaximizeIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface BottomNavProps {
  activeView: View;
  setView: (view: View) => void;
  onToggleZenMode: () => void;
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
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 text-center transition-all duration-200 ${isActive ? activeColorClass : 'text-gray-400 hover:text-white'} ${className}`}>
    {icon}
    <span className="text-[10px] mt-1 truncate font-medium">{label}</span>
  </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setView, onToggleZenMode }) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { classes, headerClass, glassClass } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMoreClick = (view: View) => {
    setView(view);
    setIsMoreMenuOpen(false);
  }
  
  const handleZenClick = () => {
      onToggleZenMode();
      setIsMoreMenuOpen(false);
  }

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setIsMoreMenuOpen(false);
          }
      };
      if (isMoreMenuOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreMenuOpen]);

  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] px-4">
      {isMoreMenuOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[90] animate-fade-in" onClick={() => setIsMoreMenuOpen(false)} />
      )}

      {/* Unified Nav Container using Header Class for consistency */}
      <div className={`relative bottom-4 ${headerClass} rounded-full max-w-lg mx-auto h-16 flex justify-around items-center z-[100] px-2`}>
        <NavItem activeColorClass={classes.text} icon={<HomeIcon className="w-6 h-6" />} label="Clima" isActive={activeView === 'weather'} onClick={() => setView('weather')} />
        <NavItem activeColorClass={classes.text} icon={<MapIcon className="w-6 h-6" />} label="Mapa" isActive={activeView === 'map'} onClick={() => setView('map')} />
        <NavItem activeColorClass={classes.text} icon={<SparklesIcon className="w-6 h-6" />} label="IA" isActive={activeView === 'ai'} onClick={() => setView('ai')} />
        <NavItem activeColorClass={classes.text} icon={<LightbulbIcon className="w-6 h-6" />} label="Dicas" isActive={activeView === 'tips'} onClick={() => setView('tips')} />
        
        {/* Floating More Menu Container */}
        <div className="relative flex items-center justify-center" ref={menuRef}>
            {/* The menu needs to stay mounted to animate out, but for React simple implementation we use conditional rendering.
                Added 'animate-fast-pop' for snappy entry as requested. Using glassClass to match context logic. */}
            {isMoreMenuOpen && (
                <div className={`absolute bottom-full right-0 mb-4 ${glassClass} rounded-2xl flex flex-col items-start p-2 gap-1 animate-fast-pop min-w-[160px] z-[150] shadow-2xl`}>
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 w-full mb-1">Menu</div>
                    <NavItem activeColorClass={classes.text} icon={<NewspaperIcon className="w-5 h-5" />} label="Notícias" isActive={activeView === 'news'} onClick={() => handleMoreClick('news')} className="w-full !flex-row !justify-start gap-4 !h-11 px-3 hover:bg-white/5 rounded-xl" />
                    <NavItem activeColorClass={classes.text} icon={<BellIcon className="w-5 h-5" />} label="Alertas" isActive={activeView === 'alerts'} onClick={() => handleMoreClick('alerts')} className="w-full !flex-row !justify-start gap-4 !h-11 px-3 hover:bg-white/5 rounded-xl" />
                    <NavItem activeColorClass={classes.text} icon={<SettingsIcon className="w-5 h-5" />} label="Ajustes" isActive={activeView === 'settings'} onClick={() => handleMoreClick('settings')} className="w-full !flex-row !justify-start gap-4 !h-11 px-3 hover:bg-white/5 rounded-xl" />
                    
                    {/* Zen Mode Button - Added Separator before it */}
                    <div className="w-full border-t border-white/5 my-1"></div>
                    <button onClick={handleZenClick} className="w-full flex items-center gap-4 px-3 h-11 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors group">
                        <MaximizeIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-medium">Zen Mode</span>
                    </button>
                </div>
            )}
            {/* Toggle Button: Rotates when open */}
            <button 
                onClick={() => setIsMoreMenuOpen(prev => !prev)} 
                className={`flex flex-col items-center justify-center w-16 text-center transition-all duration-300 ${isMoreMenuOpen ? classes.text : 'text-gray-400 hover:text-white'}`}
            >
                <div className={`transition-transform duration-300 ${isMoreMenuOpen ? 'rotate-90' : 'rotate-0'}`}>
                    <MoreHorizontalIcon className="w-6 h-6" />
                </div>
                <span className="text-[10px] mt-1 truncate font-medium">Mais</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
