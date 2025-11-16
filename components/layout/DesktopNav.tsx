import React from 'react';
import type { View } from '../../types';
import Clock from '../common/Clock';

interface DesktopNavProps {
    activeView: View;
    setView: (view: View) => void;
}

const NavItem: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-white bg-gray-700' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}>
        {label}
    </button>
);

const DesktopNav: React.FC<DesktopNavProps> = ({ activeView, setView }) => {
    return (
        <nav className="hidden lg:flex items-center space-x-4">
            <div className="px-3 py-2 text-sm font-medium text-gray-300">
                <Clock />
            </div>
            <NavItem label="Clima" isActive={activeView === 'weather'} onClick={() => setView('weather')} />
            <NavItem label="Mapa" isActive={activeView === 'map'} onClick={() => setView('map')} />
            <NavItem label="IA" isActive={activeView === 'ai'} onClick={() => setView('ai')} />
            <NavItem label="Notícias" isActive={activeView === 'news'} onClick={() => setView('news')} />
            <NavItem label="Dicas" isActive={activeView === 'tips'} onClick={() => setView('tips')} />
            <NavItem label="Informações" isActive={activeView === 'info'} onClick={() => setView('info')} />
            <NavItem label="Ajustes" isActive={activeView === 'settings'} onClick={() => setView('settings')} />
        </nav>
    );
}

export default DesktopNav;