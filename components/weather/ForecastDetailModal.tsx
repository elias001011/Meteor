
import React from 'react';
import { UmbrellaIcon } from '../icons';

interface ForecastDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        title: string;
        temp: number;
        icon: string;
        description: string;
        pop?: number;
    } | null;
}

const ForecastDetailModal: React.FC<ForecastDetailModalProps> = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center cursor-default" 
            onClick={onClose}
        >
            {/* Invisible layer to catch outside clicks without blocking visuals */}
            <div className="absolute inset-0 bg-transparent" />
            
            {/* Mini Floating Popup - Solid & Modern */}
            <div 
                className="bg-gray-900 border border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl px-6 py-5 relative animate-fast-pop flex flex-col items-center gap-3 text-center pointer-events-auto min-w-[180px]"
                onClick={(e) => e.stopPropagation()} 
            >
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800 pb-2 w-full">
                    {data.title}
                </span>
                
                <div className="flex items-center justify-center gap-3">
                     <span className="text-4xl filter drop-shadow-lg transform scale-110">{data.icon}</span>
                     <span className="text-4xl font-bold text-white tracking-tighter">{Math.round(data.temp)}°</span>
                </div>
                
                <div className="flex flex-col gap-1 w-full">
                    <span className="text-sm font-bold text-cyan-400 capitalize leading-tight bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-900/50">
                        {data.description}
                    </span>
                    
                    {typeof data.pop === 'number' && data.pop > 0 && (
                        <div className="flex items-center justify-center gap-1.5 text-blue-400 mt-1">
                            <UmbrellaIcon className="w-3 h-3" />
                            <span className="text-xs font-bold">{Math.round(data.pop * 100)}%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForecastDetailModal;
