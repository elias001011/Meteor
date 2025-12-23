
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
    feels_like?: number;
    uvi?: number;
    pressure?: number;
    clouds?: number;
    sunrise?: number;
    sunset?: number;
}

interface ForecastDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ExtendedData | null;
    isComplex?: boolean;
}

const ForecastDetailModal: React.FC<ForecastDetailModalProps> = ({ isOpen, onClose, data, isComplex = false }) => {
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

    const formatTime = (ts?: number) => {
        if (!ts) return '--:--';
        // Note: This displays in local browser time as we don't have timezone offset passed here easily. 
        // For V4.0 perfection we might want to pass offset, but keeping it simple for now.
        return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDER: COMPLEX MODE (Dialog) ---
    if (isComplex) {
        return createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
                <div 
                    className={`${glassClass} w-full max-w-sm rounded-3xl p-6 relative shadow-2xl border border-white/10 animate-enter-pop`}
                    onClick={e => e.stopPropagation()}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <XIcon className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center mb-6">
                        <span className="text-gray-400 font-medium text-sm uppercase tracking-wider mb-1">{data.title}</span>
                        <div className="text-5xl my-2 transform scale-125">{data.icon}</div>
                        <h2 className="text-white font-bold text-xl capitalize text-center leading-snug">{data.description}</h2>
                        <div className="flex items-center gap-3 mt-2">
                             <span className="text-4xl font-bold text-white tracking-tighter">{formatTemp(data.temp)}</span>
                             {data.temp_min !== undefined && (
                                <span className="text-xl text-gray-400 font-medium">{formatTemp(data.temp_min)}</span>
                             )}
                        </div>
                        {data.feels_like !== undefined && (
                            <p className="text-xs text-gray-400 mt-1">Sensação {formatTemp(data.feels_like)}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Wind */}
                        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                            <WindIcon className={`w-5 h-5 ${classes.text}`} />
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Vento</p>
                                <p className="text-sm font-bold text-white">{formatSpeed(data.wind_speed)}</p>
                            </div>
                        </div>

                        {/* Rain/Pop */}
                        <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                            <DropletsIcon className={`w-5 h-5 text-blue-400`} />
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Chuva</p>
                                <p className="text-sm font-bold text-white">{data.pop ? Math.round(data.pop * 100) : 0}%</p>
                            </div>
                        </div>

                         {/* Humidity */}
                         {data.humidity !== undefined && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                                <ThermometerIcon className={`w-5 h-5 text-teal-400`} />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Umidade</p>
                                    <p className="text-sm font-bold text-white">{data.humidity}%</p>
                                </div>
                            </div>
                         )}

                         {/* UV Index */}
                         {data.uvi !== undefined && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                                <SunIcon className={`w-5 h-5 text-yellow-400`} />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Índice UV</p>
                                    <p className="text-sm font-bold text-white">{Math.round(data.uvi)}</p>
                                </div>
                            </div>
                         )}
                         
                         {/* Pressure */}
                         {data.pressure !== undefined && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                                <GaugeIcon className={`w-5 h-5 text-purple-400`} />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Pressão</p>
                                    <p className="text-sm font-bold text-white">{data.pressure} hPa</p>
                                </div>
                            </div>
                         )}

                         {/* Clouds */}
                         {data.clouds !== undefined && (
                            <div className="bg-white/5 rounded-xl p-3 flex items-center gap-3">
                                <EyeIcon className={`w-5 h-5 text-gray-400`} />
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold">Nuvens</p>
                                    <p className="text-sm font-bold text-white">{data.clouds}%</p>
                                </div>
                            </div>
                         )}
                    </div>
                    
                    {/* Sunrise/Sunset for Daily */}
                    {(data.sunrise || data.sunset) && (
                         <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-gray-400">
                             {data.sunrise && <span>☀️ Nascer: {formatTime(data.sunrise)}</span>}
                             {data.sunset && <span>🌑 Pôr: {formatTime(data.sunset)}</span>}
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
