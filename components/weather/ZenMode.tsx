

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { WeatherData, ZenModeSound } from '../../types';
import { MinimizeIcon, WindIcon, DropletsIcon, ThermometerIcon, EyeIcon } from '../icons';
import { getSettings } from '../../services/settingsService';
import { useTheme } from '../context/ThemeContext';

interface ZenModeProps {
    data: WeatherData;
    onExit: () => void;
}

// Simple Web Audio API Noise Generator
class AmbientPlayer {
    private ctx: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private source: AudioBufferSourceNode | null = null;

    constructor() {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            this.ctx = new AudioContext();
        }
    }

    private createNoiseBuffer() {
        if (!this.ctx) return null;
        const bufferSize = 2 * this.ctx.sampleRate;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = buffer.getChannelData(0);
        
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            // Brown noise filter
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 3.5; 
        }
        return buffer;
    }

    play(type: ZenModeSound, volume: number) {
        if (!this.ctx) return;
        this.stop(); // Stop previous

        if (type === 'off') return;

        this.gainNode = this.ctx.createGain();
        this.gainNode.connect(this.ctx.destination);
        // Normalize volume (0-100 to 0-1) and attenuate heavily as generated noise is loud
        this.gainNode.gain.value = (volume / 100) * 0.15; 

        if (type === 'rain') {
            const buffer = this.createNoiseBuffer();
            if (!buffer) return;

            this.source = this.ctx.createBufferSource();
            this.source.buffer = buffer;
            this.source.loop = true;
            this.source.connect(this.gainNode);
            this.source.start();
        } 
    }

    stop() {
        if (this.source) {
            try { this.source.stop(); } catch(e){}
            this.source = null;
        }
    }
}

const ZenMode: React.FC<ZenModeProps> = ({ data, onExit }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [uiVisible, setUiVisible] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const activityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<AmbientPlayer | null>(null);
    
    const settings = getSettings();
    const config = settings.zenMode || { 
        style: 'cinematic', 
        background: 'image', 
        showWeatherInfo: true, 
        ambientSound: 'off',
        volume: 50 
    };

    const { appBackgroundClass } = useTheme();

    // Init Audio
    useEffect(() => {
        audioRef.current = new AmbientPlayer();
        // Slight delay to allow interaction (browser autoplay policy)
        const timer = setTimeout(() => {
            if (audioRef.current) {
                audioRef.current.play(config.ambientSound, 50); // Default vol 50 for now
            }
        }, 500);
        return () => {
            clearTimeout(timer);
            if (audioRef.current) audioRef.current.stop();
        }
    }, [config.ambientSound]);

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

    // --- RENDER HELPERS ---

    const renderBackground = () => {
        if (config.background === 'image') {
            return (
                <div className="absolute inset-0 z-0 overflow-hidden bg-gray-900">
                    <img 
                        src={data.imageUrl} 
                        alt={data.city} 
                        onLoad={() => setImageLoaded(true)}
                        className={`w-full h-full object-cover transition-all duration-[60s] ease-linear will-change-transform ${imageLoaded ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 pointer-events-none" />
                </div>
            );
        }
        return (
            <div className={`absolute inset-0 z-0 overflow-hidden ${appBackgroundClass}`}>
                {/* Subtle animated gradient for "App" background in Zen */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 animate-pulse duration-[5s]" />
            </div>
        );
    };

    const renderWeatherFooter = () => {
        if (!config.showWeatherInfo) return null;

        return (
             <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-12 pb-safe">
                <div className={`flex flex-col md:flex-row items-end justify-between gap-6 transition-all duration-1000 ${uiVisible || config.style === 'minimal' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    
                    {/* Esquerda: Condição + Temperatura */}
                    <div className="flex items-center gap-4 md:gap-6">
                        <span className="text-5xl md:text-6xl filter drop-shadow-lg opacity-90">{data.conditionIcon}</span>
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl md:text-7xl font-bold tracking-tighter leading-none drop-shadow-xl text-white/90">
                                    {Math.round(data.temperature)}°
                                </span>
                            </div>
                            <p className="text-base md:text-xl font-medium text-gray-300 capitalize drop-shadow-md">
                                {data.condition}
                            </p>
                        </div>
                    </div>

                    {/* Direita: 3 Informações (Visual Clássico Restaurado) */}
                    <div className="flex items-center gap-6 md:gap-8 bg-black/40 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/10">
                        {/* 1. Sensação */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="p-2 bg-white/5 rounded-full mb-1">
                                <ThermometerIcon className="w-4 h-4 text-cyan-300" />
                            </div>
                            <span className="text-sm font-bold text-white">{Math.round(data.feels_like || data.temperature)}°</span>
                            <span className="text-[10px] uppercase text-gray-400 tracking-wider font-medium">Sensação</span>
                        </div>
                        
                        {/* Divider */}
                        <div className="w-[1px] h-8 bg-white/10"></div>

                        {/* 2. Vento */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="p-2 bg-white/5 rounded-full mb-1">
                                <WindIcon className="w-4 h-4 text-gray-300" />
                            </div>
                            <span className="text-sm font-bold text-white">{Math.round(data.windSpeed)} <span className="text-[10px] font-normal">km/h</span></span>
                            <span className="text-[10px] uppercase text-gray-400 tracking-wider font-medium">Vento</span>
                        </div>

                        {/* Divider */}
                        <div className="w-[1px] h-8 bg-white/10"></div>

                        {/* 3. Umidade */}
                        <div className="flex flex-col items-center gap-1">
                            <div className="p-2 bg-white/5 rounded-full mb-1">
                                <DropletsIcon className="w-4 h-4 text-blue-300" />
                            </div>
                            <span className="text-sm font-bold text-white">{data.humidity}%</span>
                            <span className="text-[10px] uppercase text-gray-400 tracking-wider font-medium">Umidade</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- STYLE: MINIMAL ---
    const renderMinimal = () => (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8">
             {/* Center Content */}
             <div className="flex flex-col items-center gap-6">
                <h1 
                    className="font-thin text-white/90 leading-none tabular-nums tracking-tight"
                    style={{ fontSize: 'clamp(60px, 20vw, 200px)', textShadow: '0 0 40px rgba(255,255,255,0.1)' }}
                >
                    {formatTime(currentTime)}
                </h1>
                <div className="h-[1px] w-24 bg-white/20"></div>
                <p className="text-lg md:text-2xl text-gray-300 font-light tracking-[0.2em] uppercase">
                    {formatDate(currentTime)}
                </p>
                
                {/* Embedded Weather for Minimal */}
                {config.showWeatherInfo && (
                    <div className="mt-12 flex items-center gap-6 bg-black/20 backdrop-blur-xl px-8 py-4 rounded-full border border-white/5 animate-enter">
                         <span className="text-2xl">{data.conditionIcon}</span>
                         <span className="text-2xl font-light text-white">{Math.round(data.temperature)}°</span>
                         <span className="text-sm text-gray-400 border-l border-white/10 pl-4 uppercase tracking-wider">{data.city}</span>
                    </div>
                )}
             </div>
        </div>
    );

    // --- STYLE: CINEMATIC (Classic) ---
    const renderCinematic = () => (
        <>
            {/* Center Clock */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <h1 
                    className="font-black tracking-tighter text-white/80 leading-none drop-shadow-2xl tabular-nums text-center"
                    style={{ fontSize: 'clamp(60px, 20vw, 250px)', textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
                >
                    {formatTime(currentTime)}
                </h1>
                <p className="text-sm md:text-2xl text-cyan-100/70 font-light uppercase tracking-[0.4em] mt-4 drop-shadow-md text-center px-4">
                    {formatDate(currentTime)}
                </p>
            </div>
            
            {/* Weather Footer */}
            {renderWeatherFooter()}
        </>
    );

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-[9999] bg-black text-white font-sans select-none overflow-hidden h-[100dvh]"
        >
            {renderBackground()}

            {/* --- TOP BAR --- */}
            <div className={`absolute top-0 left-0 right-0 z-20 p-6 md:p-10 flex justify-between items-start transition-opacity duration-1000 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex flex-col gap-1">
                     {config.style === 'cinematic' && (
                        <>
                            <h2 className="text-xl md:text-2xl font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow-md">
                                {data.city}
                            </h2>
                            <div className="h-[2px] w-8 bg-cyan-400 mt-2 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                        </>
                     )}
                     {config.ambientSound === 'rain' && (
                         <div className="flex items-center gap-2 mt-2 bg-black/30 backdrop-blur rounded-full px-3 py-1 w-fit">
                             <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                             <span className="text-[10px] uppercase font-bold text-green-400 tracking-wider">
                                 Som de Chuva
                             </span>
                         </div>
                     )}
                </div>

                <button 
                    onClick={onExit}
                    className="bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-full backdrop-blur-md transition-all duration-300 group shadow-lg"
                    title="Sair"
                >
                    <MinimizeIcon className="w-5 h-5 text-white/80 group-hover:text-white" />
                </button>
            </div>

            {/* --- CONTENT BASED ON STYLE --- */}
            {config.style === 'minimal' ? renderMinimal() : renderCinematic()}
        </div>
    );
};

export default ZenMode;