
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { WeatherData } from '../../types';
import { MinimizeIcon, WindIcon, DropletsIcon, ThermometerIcon } from '../icons';

interface ZenModeProps {
    data: WeatherData;
    onExit: () => void;
}

const ZenMode: React.FC<ZenModeProps> = ({ data, onExit }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [uiVisible, setUiVisible] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Relógio
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Lógica de UI Hiding (Desaparecer interface)
    const showUI = useCallback(() => {
        setUiVisible(true);
        if (containerRef.current) containerRef.current.style.cursor = 'default';

        if (activityTimerRef.current) clearTimeout(activityTimerRef.current);

        activityTimerRef.current = setTimeout(() => {
            setUiVisible(false);
            if (containerRef.current) containerRef.current.style.cursor = 'none';
        }, 4000); // 4 segundos de inatividade
    }, []);

    useEffect(() => {
        showUI();
        const handleActivity = () => showUI();

        // Eventos para desktop e mobile
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('touchstart', handleActivity);
        window.addEventListener('click', handleActivity);
        window.addEventListener('keydown', handleActivity);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
        };
    }, [showUI]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
        const str = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-black text-white font-sans select-none overflow-hidden h-[100dvh]"
        >
            {/* --- BACKGROUND LAYER (Ken Burns Fix) --- */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-gray-900">
                 {/* 
                    Lógica de Animação Corrigida: 
                    Usamos 'transition-transform' com duração super longa (60s).
                    Quando a imagem carrega, aplicamos a escala. Isso evita o loop infinito que causa o "piscar".
                 */}
                 <img 
                    src={data.imageUrl} 
                    alt={data.city} 
                    onLoad={() => setImageLoaded(true)}
                    className={`w-full h-full object-cover transition-all duration-[60s] ease-linear will-change-transform ${imageLoaded ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}`}
                />
                
                {/* Vignette Suave (Gradientes Cinematográficos) */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
                <div className="absolute inset-0 bg-black/20 pointer-events-none" /> {/* Overlay geral para contraste do texto branco */}
            </div>

            {/* --- TOP BAR (Cidade + Botão Sair) --- */}
            <div className={`absolute top-0 left-0 right-0 z-20 p-6 md:p-10 flex justify-between items-start transition-opacity duration-1000 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow-md">
                        {data.city}
                    </h2>
                    <div className="h-[2px] w-8 bg-cyan-400 mt-2 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                </div>

                <button 
                    onClick={onExit}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-full backdrop-blur-md transition-all duration-300 group shadow-lg"
                    title="Sair"
                >
                    <MinimizeIcon className="w-5 h-5 text-white/80 group-hover:text-white" />
                </button>
            </div>

            {/* --- CENTER (Relógio Monumental) --- */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                {/* 
                    Clamp Font Size: Garante que nunca fique pequeno demais no celular, nem exploda no monitor ultrawide.
                    Min: 80px, Ideal: 25vw, Max: 320px.
                */}
                <h1 
                    className="font-black tracking-tighter text-white leading-none drop-shadow-2xl tabular-nums text-center"
                    style={{ fontSize: 'clamp(80px, 25vw, 320px)', textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
                >
                    {formatTime(currentTime)}
                </h1>
                
                <p className="text-sm md:text-2xl text-cyan-100/80 font-light uppercase tracking-[0.4em] mt-4 drop-shadow-md text-center px-4">
                    {formatDate(currentTime)}
                </p>
            </div>

            {/* --- FOOTER (Dados do Clima) --- */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12 pb-safe">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                    
                    {/* Esquerda: Condição + Temperatura (Sempre Visíveis) */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <span className="text-6xl md:text-7xl filter drop-shadow-lg">{data.conditionIcon}</span>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-6xl md:text-8xl font-bold tracking-tighter leading-none drop-shadow-xl">
                                    {Math.round(data.temperature)}°
                                </span>
                            </div>
                            <p className="text-lg md:text-2xl font-medium text-gray-200 capitalize drop-shadow-md">
                                {data.condition}
                            </p>
                        </div>
                    </div>

                    {/* Direita: Detalhes Extras (Desaparecem na inatividade para limpar a tela) */}
                    <div className={`flex items-center gap-4 md:gap-8 bg-black/40 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/5 transition-all duration-1000 ${uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-cyan-300 mb-1">
                                <ThermometerIcon className="w-4 h-4" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Sensação</span>
                            </div>
                            <span className="text-xl font-bold">{Math.round(data.feels_like || data.temperature)}°</span>
                        </div>

                        <div className="w-[1px] h-8 bg-white/20"></div>

                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-blue-300 mb-1">
                                <WindIcon className="w-4 h-4" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Vento</span>
                            </div>
                            <span className="text-xl font-bold">{Math.round(data.windSpeed)} <span className="text-xs font-normal opacity-70">km/h</span></span>
                        </div>

                        <div className="w-[1px] h-8 bg-white/20"></div>

                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-indigo-300 mb-1">
                                <DropletsIcon className="w-4 h-4" />
                                <span className="text-[10px] uppercase font-bold tracking-wider">Umidade</span>
                            </div>
                            <span className="text-xl font-bold">{data.humidity}<span className="text-xs font-normal opacity-70">%</span></span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZenMode;
