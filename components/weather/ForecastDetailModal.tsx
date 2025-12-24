
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XIcon, WindIcon, DropletsIcon, GaugeIcon, SunIcon, ThermometerIcon, EyeIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import { getSettings } from '../../services/settingsService';

interface ExtendedData {
    title?: string;
    temp?: number;
    temp_min?: number;
    icon?: string;
    description: string;
    pop?: number;
    // Extended fields
    humidity?: number;
    wind_speed?: number;
    wind_gust?: number;
    wind_deg?: number;
    feels_like?: number;
    uvi?: number;
    pressure?: number;
    clouds?: number;
    sunrise?: number;
    sunset?: number;
    rain?: number;
    dew_point?: number;
    moon_phase?: number;
    summary?: string;
}

interface ForecastDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ExtendedData | null;
    isComplex?: boolean;
    isDaily?: boolean; // New prop to switch display logic (Max/Min vs Current)
}

const ForecastDetailModal: React.FC<ForecastDetailModalProps> = ({ isOpen, onClose, data, isComplex = false, isDaily = false }) => {
    const [mounted, setMounted] = useState(false);
    const { glassClass, classes } = useTheme();
    const settings = getSettings();
    const unitSystem = settings.unitSystem || 'metric';

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);
    
    // Auto-close logic ONLY for simple toast mode
    useEffect(() => {
        if (isOpen && data && !isComplex) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000); // 3 seconds for toast
            return () => clearTimeout(timer);
        }
    }, [isOpen, data, onClose, isComplex]);

    if (!isOpen || !data || !mounted) return null;

    // --- Helpers for Unit Conversion & Display ---
    const formatTemp = (t?: number) => {
        if (t === undefined) return '--';
        const val = unitSystem === 'imperial' ? (t * 9/5) + 32 : t;
        return `${Math.round(val)}°${unitSystem === 'imperial' ? 'F' : 'C'}`;
    };

    const formatSpeed = (s?: number) => {
        if (s === undefined) return '--';
        const val = unitSystem === 'imperial' ? s * 0.621371 : s;
        return `${Math.round(val)} ${unitSystem === 'imperial' ? 'mph' : 'km/h'}`;
    };

    const degreesToCardinal = (deg?: number): string => {
        if (deg === undefined) return '';
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.round(deg / 45) % 8];
    };

    const formatTime = (ts?: number) => {
        if (!ts) return '--:--';
        return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDER: COMPLEX MODE (Dialog) ---
    if (isComplex) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                <div 
                    className={`${glassClass} w-full max-w-sm rounded-3xl p-6 relative shadow-2xl border border-white/10 animate-enter-pop max-h-[90vh] overflow-y-auto custom-scrollbar`}
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center mb-6">
                        <span className="text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">{data.title}</span>
                        <div className="text-5xl my-2 transform scale-125 drop-shadow-lg">{data.icon}</div>
                        <h2 className="text-white font-bold text-xl capitalize text-center leading-snug">{data.description}</h2>
                        
                        <div className="flex flex-col items-center mt-2">
                             {/* Temperature Display Logic: Daily shows High/Low, Hourly shows Current */}
                             {isDaily ? (
                                <div className="flex gap-4">
                                     <div className="flex flex-col items-center">
                                         <span className="text-xs text-gray-400 uppercase">Max</span>
                                         <span className="text-3xl font-bold text-white">{formatTemp(data.temp)}</span>
                                     </div>
                                     {data.temp_min !== undefined && (
                                         <div className="flex flex-col items-center">
                                             <span className="text-xs text-gray-400 uppercase">Min</span>
                                             <span className="text-3xl font-bold text-gray-300">{formatTemp(data.temp_min)}</span>
                                         </div>
                                     )}
                                </div>
                             ) : (
                                <span className="text-4xl font-bold text-white tracking-tighter">{formatTemp(data.temp)}</span>
                             )}
                        </div>

                        {data.feels_like !== undefined && !isDaily && (
                            <p className="text-xs text-gray-400 mt-1">Sensação {formatTemp(data.feels_like)}</p>
                        )}
                        {data.summary && (
                             <p className="text-xs text-gray-300 mt-3 text-center italic bg-white/5 px-3 py-2 rounded-lg leading-relaxed">"{data.summary}"</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Wind & Gust */}
                        <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                                <WindIcon className={`w-4 h-4 ${classes.text}`} />
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Vento</p>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-sm font-bold text-white">
                                    {formatSpeed(data.wind_speed)} <span className="text-xs font-normal text-gray-400">{degreesToCardinal(data.wind_deg)}</span>
                                </p>
                                {data.wind_gust !== undefined && (
                                    <p className="text-[10px] text-red-300">Rajada: {formatSpeed(data.wind_gust)}</p>
                                )}
                            </div>
                        </div>

                        {/* Rain/Pop */}
                        <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                             <div className="flex items-center gap-2 mb-1">
                                <DropletsIcon className={`w-4 h-4 text-blue-400`} />
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Precipitação</p>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">{data.pop ? Math.round(data.pop * 100) : 0}%</span>
                                {data.rain !== undefined && (
                                    <span className="text-[10px] text-blue-300">{data.rain}mm</span>
                                )}
                            </div>
                        </div>

                         {/* Humidity & Dew Point */}
                         {(data.humidity !== undefined || data.dew_point !== undefined) && (
                            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                     <ThermometerIcon className={`w-4 h-4 text-teal-400`} />
                                     <p className="text-[10px] text-gray-500 uppercase font-bold">Umidade</p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{data.humidity}%</p>
                                    {data.dew_point !== undefined && (
                                         <p className="text-[10px] text-teal-200">Orvalho: {formatTemp(data.dew_point)}</p>
                                    )}
                                </div>
                            </div>
                         )}

                         {/* UV Index */}
                         {data.uvi !== undefined && (
                            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                                 <div className="flex items-center gap-2 mb-1">
                                    <SunIcon className={`w-4 h-4 text-yellow-400`} />
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Índice UV</p>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{Math.round(data.uvi)}</p>
                                    <p className="text-[10px] text-gray-400">{data.uvi > 2 ? (data.uvi > 5 ? (data.uvi > 7 ? 'Muito Alto' : 'Alto') : 'Moderado') : 'Baixo'}</p>
                                </div>
                            </div>
                         )}
                         
                         {/* Pressure */}
                         {data.pressure !== undefined && (
                            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                                 <div className="flex items-center gap-2 mb-1">
                                    <GaugeIcon className={`w-4 h-4 text-purple-400`} />
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Pressão</p>
                                </div>
                                <p className="text-sm font-bold text-white">{data.pressure} hPa</p>
                            </div>
                         )}

                         {/* Clouds */}
                         {data.clouds !== undefined && (
                            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <EyeIcon className={`w-4 h-4 text-gray-400`} />
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Nuvens</p>
                                </div>
                                <p className="text-sm font-bold text-white">{data.clouds}%</p>
                            </div>
                         )}
                    </div>
                    
                    {/* Astro Info */}
                    {(data.sunrise || data.sunset || (data.moon_phase !== undefined)) && (
                         <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-y-2 text-xs text-gray-400">
                             {data.sunrise && <span className="flex items-center gap-1">☀️ Nascer: <span className="text-white">{formatTime(data.sunrise)}</span></span>}
                             {data.sunset && <span className="flex items-center gap-1">🌑 Pôr: <span className="text-white">{formatTime(data.sunset)}</span></span>}
                             {data.moon_phase !== undefined && (
                                 <span className="col-span-2 mt-1 text-center bg-gray-800/50 py-1 rounded">
                                     Lua: {data.moon_phase === 0 || data.moon_phase === 1 ? 'Nova' : (data.moon_phase === 0.5 ? 'Cheia' : (data.moon_phase < 0.5 ? 'Crescente' : 'Minguante'))} ({data.moon_phase})
                                 </span>
                             )}
                         </div>
                    )}
                </div>
            </div>,
            document.body
        );
    }

    // --- RENDER: SIMPLE MODE (Toast) ---
    return createPortal(
        <div className="fixed bottom-24 left-0 right-0 z-[9999] pointer-events-none flex justify-center px-4">
            <div className="bg-gray-900 border border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.6)] px-6 py-3 rounded-full animate-fast-pop flex items-center justify-center min-w-[140px] max-w-[80%]">
                <span className="text-white font-bold capitalize text-sm tracking-wide text-center truncate">
                    {data.description}
                </span>
            </div>
        </div>,
        document.body
    );
};

export default ForecastDetailModal;
