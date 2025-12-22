
import React, { useEffect } from 'react';
import { XIcon, UmbrellaIcon, ThermometerIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface ForecastDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        title: string; // Ex: "14:00" ou "Segunda-feira"
        temp: number;
        icon: string;
        description: string;
        pop?: number;
    } | null;
}

const ForecastDetailModal: React.FC<ForecastDetailModalProps> = ({ isOpen, onClose, data }) => {
    const { glassClass, classes } = useTheme();

    // Lock scroll when open
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen || !data) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
            
            <div 
                className={`${glassClass} w-full max-w-sm rounded-3xl p-6 relative shadow-2xl animate-enter-pop border border-white/10`}
                onClick={e => e.stopPropagation()}
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <XIcon className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2 px-4">
                        {data.title}
                    </span>

                    <div className="text-6xl mb-4 filter drop-shadow-lg scale-110">
                        {data.icon}
                    </div>

                    <div className="flex items-center justify-center gap-1 mb-2">
                         <h2 className="text-5xl font-bold text-white tracking-tighter">
                            {Math.round(data.temp)}°
                        </h2>
                    </div>

                    <p className="text-lg font-medium text-gray-200 capitalize mb-6 px-4 py-1 rounded-full bg-white/5 border border-white/5">
                        {data.description}
                    </p>

                    <div className="w-full grid grid-cols-2 gap-3">
                        <div className="bg-gray-800/40 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-white/5">
                            <span className="text-xs text-gray-400 uppercase font-bold">Chuva</span>
                            <div className="flex items-center gap-1.5 text-blue-400">
                                <UmbrellaIcon className="w-4 h-4" />
                                <span className="font-bold text-lg">
                                    {data.pop ? Math.round(data.pop * 100) : 0}%
                                </span>
                            </div>
                        </div>
                        <div className="bg-gray-800/40 rounded-2xl p-3 flex flex-col items-center justify-center gap-1 border border-white/5">
                            <span className="text-xs text-gray-400 uppercase font-bold">Detalhes</span>
                             <div className="flex items-center gap-1.5 text-gray-200">
                                <span className="text-xs text-center leading-tight opacity-70">
                                    Toque para fechar
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForecastDetailModal;
