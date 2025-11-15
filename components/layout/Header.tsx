import React from 'react';
import type { View } from '../../types';
import { SparklesIcon } from '../icons';
import DesktopNav from './DesktopNav';

interface HeaderProps {
    activeView: View;
    setView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ activeView, setView }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-wider">Meteor</h1>
        </div>
        <DesktopNav activeView={activeView} setView={setView} />
      </div>
    </header>
  );
};

export default Header;
