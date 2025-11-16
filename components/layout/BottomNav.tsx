
import React, { useState } from 'react';
import type { View } from '../../types';
import { HomeIcon, MapIcon, NewspaperIcon, SettingsIcon, SparklesIcon, LightbulbIcon, InfoIcon, MoreHorizontalIcon } from '../icons';

interface BottomNavProps {
  activeView: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}> = ({ icon, label, isActive, onClick, className = '' }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 text-center transition-colors duration-200 ${isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-white'} ${className}`}>
    {icon}
    <span className="text-xs mt-1 truncate">{label}</span>
  </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setView }) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleMoreClick = (view: View) => {
    setView(view);
    setIsMoreMenuOpen(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 px-4">
      {isMoreMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/30 z-30" 
            onClick={() => setIsMoreMenuOpen(false)}
            aria-hidden="true"
        ></div>
      )}
      <div className="absolute bottom-24 right-4 z-40">
        {isMoreMenuOpen && (
            <div className="bg-gray-700/80 backdrop-blur-lg border border-gray-600/50 rounded-2xl shadow-lg flex flex-col items-start p-2 gap-1">
                <NavItem icon={<NewspaperIcon className="w-5 h-5" />} label="Notícias" isActive={activeView === 'news'} onClick={() => handleMoreClick('news')} className="w-full !flex-row !justify-start gap-3 !h-10 px-2" />
                <NavItem icon={<InfoIcon className="w-5 h-5" />} label="Informações" isActive={activeView === 'info'} onClick={() => handleMoreClick('info')} className="w-full !flex-row !justify-start gap-3 !h-10 px-2" />
                <NavItem icon={<SettingsIcon className="w-5 h-5" />} label="Ajustes" isActive={activeView === 'settings'} onClick={() => handleMoreClick('settings')} className="w-full !flex-row !justify-start gap-3 !h-10 px-2" />
            </div>
        )}
      </div>

      <div className="relative bottom-4 bg-gray-800/70 backdrop-blur-lg border border-gray-700/50 rounded-full max-w-lg mx-auto h-16 flex justify-around items-center shadow-lg">
        <NavItem icon={<HomeIcon className="w-6 h-6" />} label="Clima" isActive={activeView === 'weather'} onClick={() => setView('weather')} />
        <NavItem icon={<MapIcon className="w-6 h-6" />} label="Mapa" isActive={activeView === 'map'} onClick={() => setView('map')} />
        <NavItem icon={<SparklesIcon className="w-6 h-6" />} label="IA" isActive={activeView === 'ai'} onClick={() => setView('ai')} />
        <NavItem icon={<LightbulbIcon className="w-6 h-6" />} label="Dicas" isActive={activeView === 'tips'} onClick={() => setView('tips')} />
        <NavItem icon={<MoreHorizontalIcon className="w-6 h-6" />} label="Mais" isActive={isMoreMenuOpen} onClick={() => setIsMoreMenuOpen(prev => !prev)} />
      </div>
    </div>
  );
};

export default BottomNav;