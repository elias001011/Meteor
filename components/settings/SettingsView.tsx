

import React, { useState, useEffect } from 'react';
import type { AppSettings, View, DataSource, AppTheme, TransparencyMode, ClockDisplayMode, BackgroundMode, MapTheme, BorderEffectMode, LayoutDensity, DesktopLayout, UnitSystem, ForecastComplexity, ForecastDetailView, ZenModeStyle, ZenModeBackground, ZenModeSound } from '../../types';
import { getSettings, resetSettings, resetCache, resetAllData, exportAppData } from '../../services/settingsService';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { 
    XIcon, LightbulbIcon, SparklesIcon, ChevronLeftIcon, GaugeIcon, 
    HeartIcon, GithubIcon, FileTextIcon, GlobeIcon, SettingsIcon, 
    DatabaseIcon, AlertTriangleIcon, MapIcon, HomeIcon, EyeIcon, MaximizeIcon,
    UserIcon, CloudIcon, LogOutIcon, LogInIcon
} from '../icons';

interface SettingsViewProps {
    settings: AppSettings;
    onSettingsChanged: (newSettings: AppSettings) => void;
    onClearHistory: () => void; 
    onOpenImport: () => void;
    onOpenChangelog: () => void;
    onOpenCitySelection: () => void;
}

type SettingsTab = 'general' | 'visual' | 'ai' | 'data' | 'about';

const SettingsView: React.FC<SettingsViewProps> = ({ 
    settings, 
    onSettingsChanged, 
    onClearHistory, 
    onOpenImport, 
    onOpenChangelog, 
    onOpenCitySelection 
}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [showPwaBanner, setShowPwaBanner] = useState(true);
    const [pixCopied, setPixCopied] = useState(false);
    
    const { classes, density, isPerformanceMode, cardClass, glassClass } = useTheme();
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const handleSave = (updatedSettings: Partial<AppSettings>) => {
        const newSettings = { ...settings, ...updatedSettings };
        onSettingsChanged(newSettings);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {});
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    };

    const handleReset = (type: 'settings' | 'cache' | 'history' | 'all') => {
        if (!confirm("Tem certeza? Esta ação é irreversível.")) return;
        switch (type) {
            case 'settings': resetSettings(); onSettingsChanged(getSettings()); setFeedbackMessage("Configurações resetadas."); break;
            case 'cache': resetCache(); setFeedbackMessage("Cache limpo."); break;
            case 'history': onClearHistory(); setFeedbackMessage("Histórico da IA limpo."); break;
            case 'all': resetAllData(); window.location.reload(); break;
        }
        setTimeout(() => setFeedbackMessage(null), 3000);
    };

    const handleExport = () => {
        exportAppData();
        setFeedbackMessage("Backup salvo nos downloads!");
        setTimeout(() => setFeedbackMessage(null), 3000);
    };

    const handleCopyPix = () => {
        navigator.clipboard.writeText("8001be0f-4952-4ef8-b2a5-9bafe691c65c");
        setPixCopied(true);
        setTimeout(() => setPixCopied(false), 2000);
    };
    
    const themes: { id: AppTheme, name: string, color: string }[] = [
        { id: 'cyan', name: 'Padrão', color: 'bg-cyan-500' },
        { id: 'blue', name: 'Royal', color: 'bg-blue-600' },
        { id: 'purple', name: 'Profundo', color: 'bg-purple-600' },
        { id: 'emerald', name: 'Natureza', color: 'bg-emerald-600' },
        { id: 'rose', name: 'Floral', color: 'bg-rose-600' },
        { id: 'amber', name: 'Solar', color: 'bg-amber-500' },
    ];

    const backgroundOptions: { id: BackgroundMode, label: string }[] = [
        { id: 'gradient', label: 'Gradiente' },
        { id: 'solid', label: 'Sólido' }
    ];

    const borderEffectOptions: { id: BorderEffectMode, label: string }[] = [
        { id: 'none', label: 'Nenhum' },
        { id: 'top', label: 'Topo' },
        { id: 'bottom', label: 'Base' }
    ];

    const densityOptions: { id: LayoutDensity, label: string }[] = [
        { id: 'comfortable', label: 'Confortável' },
        { id: 'compact', label: 'Compacto' }
    ];

    const mapThemeOptions: { id: MapTheme, label: string }[] = [
        { id: 'dark', label: 'Escuro' },
        { id: 'light', label: 'Claro' }
    ];

    const desktopLayoutOptions: { id: DesktopLayout, label: string }[] = [
        { id: '25-75', label: 'Lateral (25/75)' },
        { id: '40-60', label: 'Balanceado (40/60)' },
        { id: '50-50', label: 'Dividido (50/50)' }
    ];
    
    // Zen Mode Options
    const zenStyles: { id: ZenModeStyle, label: string }[] = [
        { id: 'cinematic', label: 'Cinemático' },
        { id: 'minimal', label: 'Minimalista' }
    ];
    
    const zenBackgrounds: { id: ZenModeBackground, label: string }[] = [
        { id: 'image', label: 'Imagem (Cidade)' },
        { id: 'app', label: 'Fundo do App' }
    ];

    const selectStyle = `w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-gray-200 focus:ring-2 outline-none ${classes.ring} appearance-none cursor-pointer hover:bg-white/5 transition-colors ${density.text}`;
    const inputStyle = `w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-gray-200 focus:ring-2 outline-none ${classes.ring} placeholder-gray-500 transition-colors ${density.text}`;
    const optionClass = "bg-slate-900 text-white py-2";

    const ToggleSwitch = ({ checked, onChange, disabled = false, activeColorClass }: { checked: boolean, onChange: () => void, disabled?: boolean, activeColorClass?: string }) => (
        <button 
            onClick={onChange}
            disabled={disabled}
            className={`relative w-12 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none flex-shrink-0 active:scale-95 ${checked ? (activeColorClass || classes.bg) + ` shadow-[0_0_10px_rgba(0,0,0,0.3)]` : 'bg-gray-700'} ${disabled ? 'cursor-not-allowed opacity-40 saturate-0' : 'cursor-pointer hover:brightness-110'}`}
        >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transform transition-all duration-300 ease-in-out ${checked ? 'left-6' : 'left-1'}`} />
        </button>
    );

    const TabButton = ({ id, label, icon }: { id: SettingsTab, label: string, icon: React.ReactNode }) => {
        const isActive = activeTab === id;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-medium text-sm flex-shrink-0 relative overflow-hidden group active:scale-95
                    ${isActive ? `${classes.bg} text-white shadow-lg` : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
            >
                <div className="relative z-10 flex items-center gap-2">{icon}<span className="whitespace-nowrap">{label}</span></div>
            </button>
        );
    };

    const DisabledOverlay = ({ children }: { children?: React.ReactNode }) => (
        <div className="relative">
            <div className="absolute inset-0 z-10 bg-gray-900/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center border border-white/5">
                <span className="text-[10px] font-bold text-white bg-black/60 px-2 py-1 rounded border border-white/10">Controlado pelo Modo Desempenho</span>
            </div>
            <div className="opacity-40 pointer-events-none grayscale">{children}</div>
        </div>
    );

    // Helper to determine the active "Main" transparency tab (Off, Transparent, Glass)
    const activeTransparencyTab = settings.transparencyMode === 'glass' ? 'glass' : (settings.transparencyMode === 'off' ? 'off' : 'transparent');

    const renderGeneral = () => (
        <div className={`space-y-6 animate-enter`}>
            {/* 1. Instale o Meteor */}
            {showPwaBanner && !window.matchMedia('(display-mode: standalone)').matches && (
                <div className={`relative overflow-hidden backdrop-blur-md border ${classes.borderFaded} ${density.padding} bg-gray-900/60 rounded-3xl flex items-start justify-between gap-4 shadow-lg group`}>
                    <div className="flex gap-4 relative z-10">
                        <div className={`p-3 rounded-full h-fit ${classes.bg}/20 shadow-inner`}><LightbulbIcon className={`w-6 h-6 ${classes.text}`} /></div>
                        <div><h4 className="font-bold text-white text-lg">Instale o Meteor</h4><p className="text-sm text-gray-200 mt-1">Instale como App para melhor experiência.</p></div>
                    </div>
                    <button onClick={() => setShowPwaBanner(false)} className="text-gray-400 hover:text-white"><XIcon className="w-5 h-5" /></button>
                </div>
            )}

            {/* 2. Modo Desempenho (Renamed) */}
            <section className={`${cardClass} rounded-3xl ${density.padding} border-l-4`} style={{ borderLeftColor: classes.hex }}>
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-white font-bold text-lg">Modo Desempenho</span>
                        <span className={`text-xs ${density.subtext} text-gray-400`}>Desliga transparências, blur e animações para máxima velocidade.</span>
                    </div>
                    <ToggleSwitch checked={settings.performanceMode} onChange={() => handleSave({ performanceMode: !settings.performanceMode })} activeColorClass={classes.bg} />
                </div>
            </section>

            {/* 3. Inicialização */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}><HomeIcon className="w-5 h-5" /> Inicialização</h3>
                <div className={density.settingsGap}>
                    <div className="flex flex-col gap-2">
                        <label className={`${density.text} text-sm font-medium text-gray-300`}>Comportamento ao abrir</label>
                        <select value={settings.startupBehavior} onChange={(e) => { const val = e.target.value as any; handleSave({ startupBehavior: val }); if (val === 'specific_location' && !settings.specificLocation) onOpenCitySelection(); }} className={selectStyle}>
                            <option value="idle" className={optionClass}>Tela Inicial (Boas-vindas)</option>
                            <option value="last_location" className={optionClass}>Carregar Última Localização</option>
                            <option value="specific_location" className={optionClass}>Carregar Localização Específica</option>
                            <option value="custom_section" className={optionClass}>Abrir em uma Seção (ex: Chat)</option>
                        </select>
                    </div>
                    
                    {/* Seletor de Seção Específica */}
                    {settings.startupBehavior === 'custom_section' && (
                        <div className="flex flex-col gap-2 animate-enter pl-4 border-l-2 border-gray-700">
                            <label className={`${density.text} text-sm font-medium text-gray-300`}>Selecione a Seção</label>
                            <select 
                                value={settings.startupSection || 'weather'} 
                                onChange={(e) => handleSave({ startupSection: e.target.value as View })} 
                                className={selectStyle}
                            >
                                <option value="weather" className={optionClass}>Clima</option>
                                <option value="map" className={optionClass}>Mapa</option>
                                <option value="ai" className={optionClass}>IA (Chat)</option>
                                <option value="news" className={optionClass}>Notícias</option>
                                <option value="tips" className={optionClass}>Dicas</option>
                                <option value="info" className={optionClass}>Informações</option>
                            </select>
                        </div>
                    )}

                    {/* Seletor de Local Específico com Validação */}
                    {settings.startupBehavior === 'specific_location' && (
                        <div className={`flex items-center justify-between bg-black/20 p-4 rounded-xl border ${!settings.specificLocation ? 'border-red-500/50' : 'border-white/5'} mt-2 animate-enter`}>
                            <div>
                                <p className="text-sm text-gray-400">Local Padrão:</p>
                                <p className={`font-bold ${!settings.specificLocation ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                    {settings.specificLocation?.name || '⚠️ Nenhum selecionado!'}
                                </p>
                            </div>
                            <button onClick={onOpenCitySelection} className={`${classes.text} text-sm hover:underline font-bold`}>
                                {settings.specificLocation ? 'Alterar' : 'Selecionar'}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Sistema & Interface */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}><SettingsIcon className="w-5 h-5" /> Sistema & Interface</h3>
                <div className={density.settingsGap}>
                    <div className="flex items-center justify-between">
                        <span className={`${density.text} text-white font-medium`}>Modo Tela Cheia</span>
                        <button onClick={toggleFullscreen} className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg ${isFullscreen ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white'}`}>{isFullscreen ? 'Sair' : 'Ativar'}</button>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className={`${density.text} text-white font-medium`}>Iniciar em tela cheia</span>
                        <ToggleSwitch checked={settings.startFullscreen} onChange={() => handleSave({ startFullscreen: !settings.startFullscreen })} activeColorClass={classes.bg} />
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className={`${density.text} text-white font-medium`}>Relógio no Topo</span>
                        <ToggleSwitch checked={settings.showClock} onChange={() => handleSave({ showClock: !settings.showClock })} activeColorClass={classes.bg} />
                    </div>
                    <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                        <label className={`${density.text} text-sm font-medium text-gray-300`}>Horário Local da Cidade (Card)</label>
                        <select value={settings.clockDisplayMode} onChange={(e) => handleSave({ clockDisplayMode: e.target.value as ClockDisplayMode })} className={selectStyle}>
                            <option value="always" className={optionClass}>Sempre mostrar</option>
                            <option value="different_zone" className={optionClass}>Apenas se o fuso for diferente</option>
                            <option value="never" className={optionClass}>Nunca mostrar</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className={`${density.text} text-white font-medium`}>Barras de Rolagem</span>
                        <ToggleSwitch checked={settings.showScrollbars} onChange={() => handleSave({ showScrollbars: !settings.showScrollbars })} activeColorClass={classes.bg} />
                    </div>

                    {/* Unidades de Medida - V4.0 Feature */}
                    <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                         <label className={`${density.text} text-sm font-medium text-gray-300`}>Sistema de Unidades</label>
                         <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                            <button onClick={() => handleSave({ unitSystem: 'metric' })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${settings.unitSystem !== 'imperial' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>Métrico (°C, km/h)</button>
                            <button onClick={() => handleSave({ unitSystem: 'imperial' })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${settings.unitSystem === 'imperial' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>Imperial (°F, mph)</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderVisual = () => (
        <div className={`space-y-6 animate-enter`}>
            {/* 1. Cores e Tema */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}><EyeIcon className="w-5 h-5" /> Cores e Tema</h3>
                <div className={density.settingsGap}>
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <span className={`${density.text} text-white font-medium`}>Tema Dinâmico</span>
                        <ToggleSwitch checked={settings.dynamicTheme} onChange={() => handleSave({ dynamicTheme: !settings.dynamicTheme })} activeColorClass={classes.bg} />
                    </div>
                    <div className={`${settings.dynamicTheme ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <label className={`${density.text} font-medium text-gray-300 mb-3 block`}>Cor Principal</label>
                        <div className={`flex flex-wrap ${density.itemGap}`}>
                            {themes.map((theme) => (
                                <button key={theme.id} onClick={() => handleSave({ themeColor: theme.id })} className={`w-12 h-12 rounded-full ${theme.color} ring-2 ${settings.themeColor === theme.id ? `ring-white scale-110` : 'ring-transparent opacity-70'} transition-all`} aria-label={`Selecionar cor ${theme.name}`}/>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

             {/* 2. Resumo do Clima (Insights) */}
             <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}><LightbulbIcon className="w-5 h-5" /> Resumo do Clima</h3>
                <div className={density.settingsGap}>
                    <div className="flex items-center justify-between">
                        <span className={`${density.text} text-white font-medium`}>Habilitar Resumos</span>
                        <ToggleSwitch checked={settings.weatherInsights.enabled} onChange={() => handleSave({ weatherInsights: { ...settings.weatherInsights, enabled: !settings.weatherInsights.enabled } })} activeColorClass={classes.bg} />
                    </div>
                    {settings.weatherInsights.enabled && (
                        <div className="space-y-4 pt-4 border-t border-white/5 animate-enter">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-2">Estilo Visual</label>
                                    <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                        <button onClick={() => handleSave({ weatherInsights: { ...settings.weatherInsights, style: 'container' } })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${settings.weatherInsights.style === 'container' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>Caixa</button>
                                        <button onClick={() => handleSave({ weatherInsights: { ...settings.weatherInsights, style: 'clean' } })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${settings.weatherInsights.style === 'clean' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>Limpo</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-2">Conteúdo</label>
                                    <select value={settings.weatherInsights.content} onChange={(e) => handleSave({ weatherInsights: { ...settings.weatherInsights, content: e.target.value as any } })} className={selectStyle}>
                                        <option value="both" className={optionClass}>Ambos</option>
                                        <option value="highlight" className={optionClass}>Apenas Destaque</option>
                                        <option value="recommendation" className={optionClass}>Apenas Rec.</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={`${density.text} text-gray-300 font-medium`}>Marcador pulsante</span>
                                <ToggleSwitch checked={settings.weatherInsights.showPulse} onChange={() => handleSave({ weatherInsights: { ...settings.weatherInsights, showPulse: !settings.weatherInsights.showPulse } })} activeColorClass={classes.bg} />
                            </div>
                        </div>
                    )}
                </div>
            </section>
            
            {/* 2.5 Modo Zen (Novo v4.3) */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}><MaximizeIcon className="w-5 h-5" /> Modo Zen</h3>
                <div className={density.settingsGap}>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Estilo Visual</label>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {zenStyles.map((style) => (
                                    <button 
                                        key={style.id} 
                                        onClick={() => handleSave({ zenMode: { ...settings.zenMode, style: style.id } })} 
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-medium ${settings.zenMode.style === style.id ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                                    >
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Fundo</label>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {zenBackgrounds.map((bg) => (
                                    <button 
                                        key={bg.id} 
                                        onClick={() => handleSave({ zenMode: { ...settings.zenMode, background: bg.id } })} 
                                        className={`flex-1 py-2.5 rounded-lg text-xs font-medium ${settings.zenMode.background === bg.id ? 'bg-white/10 text-white' : 'text-gray-400'}`}
                                    >
                                        {bg.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                        <div>
                            <span className={`${density.text} text-white font-medium block`}>Exibir Detalhes do Clima</span>
                            <span className="text-[10px] text-gray-500">Mostra temperatura e condições no rodapé.</span>
                        </div>
                        <ToggleSwitch checked={settings.zenMode.showWeatherInfo} onChange={() => handleSave({ zenMode: { ...settings.zenMode, showWeatherInfo: !settings.zenMode.showWeatherInfo } })} activeColorClass={classes.bg} />
                    </div>
                    
                    <div className="pt-2 border-t border-white/5">
                        <label className={`${density.text} text-sm font-medium text-gray-300 mb-2 block`}>Som Ambiente</label>
                        <select 
                            value={settings.zenMode.ambientSound} 
                            onChange={(e) => handleSave({ zenMode: { ...settings.zenMode, ambientSound: e.target.value as ZenModeSound } })} 
                            className={selectStyle}
                        >
                            <option value="off" className={optionClass}>Desligado</option>
                            <option value="rain" className={optionClass}>Chuva Suave (Gerado)</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">Sons gerados em tempo real (sem download).</p>
                    </div>
                </div>
            </section>

             {/* 3. Detalhes (V4.0) */}
             <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}><SettingsIcon className="w-5 h-5" /> Detalhes</h3>
                <div className={density.settingsGap}>
                    {/* Visualização Complexa */}
                    <div className="flex items-center justify-between">
                        <div>
                            <span className={`${density.text} text-white font-medium block`}>Previsão Detalhada</span>
                            <span className="text-[10px] text-gray-500">Exibe pop-up com UV, Vento e mais detalhes.</span>
                        </div>
                        <ToggleSwitch checked={settings.forecastComplexity === 'advanced'} onChange={() => handleSave({ forecastComplexity: settings.forecastComplexity === 'advanced' ? 'basic' : 'advanced' })} activeColorClass={classes.bg} />
                    </div>
                     {settings.forecastComplexity === 'advanced' && (
                        <div className="pl-4 border-l-2 border-gray-700 animate-enter mt-2 space-y-4">
                             <div>
                                <label className="text-xs text-gray-400 block mb-2">Onde exibir detalhes?</label>
                                <select value={settings.forecastDetailView} onChange={(e) => handleSave({ forecastDetailView: e.target.value as ForecastDetailView })} className={selectStyle}>
                                    <option value="both" className={optionClass}>Ambos (Horária + Diária)</option>
                                    <option value="forecast_only" className={optionClass}>Apenas Horária</option>
                                    <option value="daily_only" className={optionClass}>Apenas Diária</option>
                                </select>
                             </div>
                             <div className="flex items-center justify-between">
                                <span className={`${density.text} text-gray-300 font-medium text-sm`}>Exibir rótulo "Detalhes"</span>
                                <ToggleSwitch checked={settings.showDetailLabel} onChange={() => handleSave({ showDetailLabel: !settings.showDetailLabel })} activeColorClass={classes.bg} />
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Efeitos e Layout */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Efeitos e Layout</h3>
                <div className={density.settingsGap}>
                    {/* Background & Border */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Estilo do Fundo</label>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {backgroundOptions.map((opt) => (<button key={opt.id} onClick={() => handleSave({ backgroundMode: opt.id })} className={`flex-1 py-2.5 rounded-lg text-xs font-medium ${settings.backgroundMode === opt.id ? 'bg-white/10 text-white' : 'text-gray-400'}`}>{opt.label}</button>))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Borda LED</label>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {borderEffectOptions.map((opt) => (<button key={opt.id} onClick={() => handleSave({ borderEffect: opt.id })} className={`flex-1 py-2.5 rounded-lg text-xs font-medium ${settings.borderEffect === opt.id ? 'bg-white/10 text-white' : 'text-gray-400'}`}>{opt.label}</button>))}
                            </div>
                        </div>
                    </div>

                    {/* Transparência (Hierarchical Logic) */}
                    <div className="pt-4 border-t border-white/5">
                        <label className={`${density.text} text-sm font-medium text-gray-300 mb-2 block`}>Transparência e Vidro</label>
                        
                        {isPerformanceMode ? (
                            <DisabledOverlay>
                                 <div className="flex bg-black/20 rounded-xl p-1 border border-white/5 mb-3 h-12"></div>
                            </DisabledOverlay>
                        ) : (
                            <>
                                {/* 1. Main Mode Selection */}
                                <div className="flex bg-black/20 rounded-xl p-1 border border-white/5 mb-3 overflow-x-auto">
                                    <button 
                                        onClick={() => handleSave({ transparencyMode: 'off' })} 
                                        className={`flex-1 min-w-[70px] py-2.5 rounded-lg text-xs font-medium transition-all ${activeTransparencyTab === 'off' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400'}`}
                                    >
                                        Sólido
                                    </button>
                                    <button 
                                        onClick={() => handleSave({ transparencyMode: settings.transparencyMode === 'balanced' ? 'balanced' : 'subtle' })} 
                                        className={`flex-1 min-w-[70px] py-2.5 rounded-lg text-xs font-medium transition-all ${activeTransparencyTab === 'transparent' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400'}`}
                                    >
                                        Transparente
                                    </button>
                                    <button 
                                        onClick={() => handleSave({ transparencyMode: 'glass' })} 
                                        className={`flex-1 min-w-[70px] py-2.5 rounded-lg text-xs font-medium transition-all ${activeTransparencyTab === 'glass' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400'}`}
                                    >
                                        Vidro (Blur)
                                    </button>
                                </div>

                                {/* 2. Sub-options for Transparent Mode */}
                                {activeTransparencyTab === 'transparent' && (
                                    <div className="pl-4 border-l-2 border-gray-700 animate-enter mb-3">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Intensidade</h4>
                                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5 w-fit">
                                            <button onClick={() => handleSave({ transparencyMode: 'subtle' })} className={`px-4 py-2 rounded-lg text-xs font-medium ${settings.transparencyMode === 'subtle' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>Sutil (96%)</button>
                                            <button onClick={() => handleSave({ transparencyMode: 'balanced' })} className={`px-4 py-2 rounded-lg text-xs font-medium ${settings.transparencyMode === 'balanced' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>Equilibrado (93%)</button>
                                        </div>
                                    </div>
                                )}

                                {/* 3. Scope Toggles for Transparent AND Glass Modes */}
                                {(activeTransparencyTab === 'glass' || activeTransparencyTab === 'transparent') && !settings.performanceMode && (
                                    <div className="pl-4 border-l-2 border-gray-700 space-y-2 animate-enter">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Aplicar Efeito em:</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5"><input type="checkbox" checked={settings.glassScope.header} onChange={() => handleSave({ glassScope: { ...settings.glassScope, header: !settings.glassScope.header } })} className="accent-cyan-500 w-4 h-4" /><span className="text-sm text-gray-300">Cabeçalho (Header)</span></label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5"><input type="checkbox" checked={settings.glassScope.cards} onChange={() => handleSave({ glassScope: { ...settings.glassScope, cards: !settings.glassScope.cards } })} className="accent-cyan-500 w-4 h-4" /><span className="text-sm text-gray-300">Cartões e Widgets</span></label>
                                            <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-white/5"><input type="checkbox" checked={settings.glassScope.overlays} onChange={() => handleSave({ glassScope: { ...settings.glassScope, overlays: !settings.glassScope.overlays } })} className="accent-cyan-500 w-4 h-4" /><span className="text-sm text-gray-300">Menus e Sobreposições</span></label>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Density & Map */}
                    <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                         <div>
                             <label className={`${density.text} text-sm font-medium text-gray-300 mb-2 block`}>Densidade</label>
                             <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {densityOptions.map((opt) => (<button key={opt.id} onClick={() => handleSave({ layoutDensity: opt.id })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${settings.layoutDensity === opt.id ? 'bg-white/10 text-white' : 'text-gray-400'}`}>{opt.label}</button>))}
                            </div>
                        </div>
                         <div>
                             <label className={`${density.text} text-sm font-medium text-gray-300 mb-2 block`}>Tema do Mapa</label>
                             <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {mapThemeOptions.map((opt) => (<button key={opt.id} onClick={() => handleSave({ mapTheme: opt.id })} className={`flex-1 py-2 rounded-lg text-xs font-medium ${settings.mapTheme === opt.id ? 'bg-white/10 text-white' : 'text-gray-400'}`}>{opt.label}</button>))}
                            </div>
                        </div>
                    </div>

                    {/* Layout Desktop */}
                    <div className="hidden lg:block pt-2">
                         <label className={`${density.text} text-sm font-medium text-gray-300 mb-2 block`}>Layout da Tela</label>
                         <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                            {desktopLayoutOptions.map((opt) => (<button key={opt.id} onClick={() => handleSave({ desktopLayout: opt.id })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${settings.desktopLayout === opt.id ? 'bg-white/10 text-white' : 'text-gray-400'}`}>{opt.label}</button>))}
                        </div>
                    </div>

                    {/* Animations */}
                    <div className="pt-4 border-t border-white/5 space-y-3">
                         <div className="flex items-center justify-between">
                            <span className={`${density.text} text-white font-medium`}>Remover Animações</span>
                            {isPerformanceMode ? (
                                <span className="text-xs text-gray-500 bg-black/20 px-2 py-1 rounded">Desligado (Perf.)</span>
                            ) : (
                                <ToggleSwitch checked={settings.reducedMotion} onChange={() => handleSave({ reducedMotion: !settings.reducedMotion })} activeColorClass={classes.bg} />
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className={`${density.text} text-white font-medium`}>Animação de Chuva</span>
                            <ToggleSwitch checked={settings.rainAnimation.enabled} onChange={() => handleSave({ rainAnimation: { ...settings.rainAnimation, enabled: !settings.rainAnimation.enabled } })} activeColorClass={classes.bg} />
                        </div>
                        
                        {settings.rainAnimation.enabled && (
                             isPerformanceMode ? (
                                 <DisabledOverlay>
                                     <div className="flex items-center justify-between pl-4 border-l-2 border-gray-700">
                                         <span className="text-xs text-gray-400">Intensidade Visual</span>
                                         <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5 h-8 w-24"></div>
                                     </div>
                                 </DisabledOverlay>
                             ) : (
                                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-700">
                                    <span className="text-xs text-gray-400">Intensidade Visual</span>
                                    <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5">
                                        <button onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, intensity: 'low' } })} className={`px-4 py-1.5 rounded text-xs font-medium ${settings.rainAnimation.intensity === 'low' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Leve</button>
                                        <button onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, intensity: 'high' } })} className={`px-4 py-1.5 rounded text-xs font-medium ${settings.rainAnimation.intensity === 'high' ? 'bg-white/10 text-white' : 'text-gray-500'}`}>Forte</button>
                                    </div>
                                </div>
                             )
                        )}
                    </div>
                </div>
            </section>
        </div>
    );

    const renderAi = () => (
        <div className={`space-y-6 animate-enter`}>
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}><SparklesIcon className="w-5 h-5" /> Perfil da IA</h3>
                <div className={density.settingsGap}>
                    <div className="flex flex-col gap-2">
                         <label className={`${density.text} text-sm font-medium text-gray-300`}>Como devo te chamar?</label>
                         <input type="text" value={settings.userName || ''} onChange={(e) => handleSave({ userName: e.target.value })} placeholder="Seu nome ou apelido" className={inputStyle} maxLength={30} />
                    </div>
                    <div className="flex flex-col gap-2">
                         <label className={`${density.text} text-sm font-medium text-gray-300`}>Instruções de Personalidade</label>
                         <textarea value={settings.userAiInstructions || ''} onChange={(e) => handleSave({ userAiInstructions: e.target.value })} placeholder="Ex: Seja engraçada, Fale como um pirata..." className={`${inputStyle} min-h-[100px] resize-none`} maxLength={200} />
                         <p className="text-xs text-gray-500">Nota: Instruções que tentem burlar as diretrizes de segurança ou solicitar injeção de prompt serão ignoradas pelo modelo.</p>
                    </div>
                </div>
            </section>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                <AlertTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <strong className="text-yellow-400 text-sm block">Política de Segurança & Diretrizes Éticas</strong> 
                    <p className="text-xs text-gray-300 leading-relaxed">
                        O Meteor utiliza modelos de IA generativa avançados. É estritamente proibido tentar realizar "jailbreak", injeção de prompt, ou utilizar a IA para gerar conteúdo de ódio, discriminação ou atividades ilegais. O sistema possui filtros de segurança ativos.
                    </p>
                </div>
             </div>
        </div>
    );

    const renderData = () => {
        const { user, isLoggedIn, login, logout, userData, identityError } = useAuth();
        
        return (
        <div className={`space-y-6 animate-enter`}>
            {/* Card de Conta e Nuvem */}
            <section className={`${cardClass} rounded-3xl ${density.padding} border border-blue-500/20`}>
                <h3 className={`text-lg font-bold text-blue-400 mb-4 flex items-center gap-2`}>
                    <CloudIcon className="w-5 h-5" /> Conta e Nuvem
                </h3>
                
                {identityError ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                        <p className="text-yellow-200 text-sm mb-2">
                            <strong>Serviço Temporariamente Indisponível</strong>
                        </p>
                        <p className="text-gray-400 text-sm">
                            O sistema de autenticação está em manutenção. 
                            Tente novamente mais tarde.
                        </p>
                    </div>
                ) : !isLoggedIn ? (
                    <div className="space-y-4">
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">Você não está conectado</p>
                                    <p className="text-sm text-gray-500">Entre para sincronizar seus dados</p>
                                </div>
                            </div>
                            <button 
                                onClick={login}
                                className={`w-full ${classes.bg} hover:brightness-110 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all`}
                            >
                                <LogInIcon className="w-4 h-4" />
                                Entrar / Criar Conta
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Com uma conta, seus dados (configurações, histórico de chat, cidades favoritas) 
                            são sincronizados na nuvem e acessíveis de qualquer dispositivo.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{user?.email}</p>
                                    <p className="text-sm text-emerald-400">Conectado</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-white">{userData?.favoriteCities?.length || 0}</p>
                                <p className="text-xs text-gray-500">Cidades Salvas</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-white">{userData?.aiChatHistory?.length || 0}</p>
                                <p className="text-xs text-gray-500">Mensagens IA</p>
                            </div>
                        </div>
                        
                        <button 
                            onClick={logout}
                            className="w-full border border-red-500/30 text-red-400 hover:bg-red-500/10 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                        >
                            <LogOutIcon className="w-4 h-4" />
                            Sair da Conta
                        </button>
                    </div>
                )}
            </section>

             <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}><DatabaseIcon className="w-5 h-5" /> Gerenciamento Local</h3>
                <div className={density.settingsGap}>
                    <div className="flex flex-col gap-2">
                        <label className={`${density.text} text-sm font-medium text-gray-300`}>Fonte Preferida</label>
                        <select value={settings.weatherSource} onChange={(e) => handleSave({ weatherSource: e.target.value as DataSource | 'auto' })} className={selectStyle}>
                            <option value="auto" className={optionClass}>Automático (Recomendado)</option>
                            <option value="onecall" className={optionClass}>OpenWeather (OneCall/Pro)</option>
                            <option value="free" className={optionClass}>OpenWeather (Padrão/Gratuito)</option>
                            <option value="open-meteo" className={optionClass}>Open-Meteo (Open Source)</option>
                        </select>
                    </div>
                     <div className="flex items-center justify-between pb-6 border-b border-white/5 pt-4">
                        <span className={`${density.text} text-white font-medium`}>Salvar Histórico de Chat</span>
                        <ToggleSwitch checked={settings.saveChatHistory} onChange={() => handleSave({ saveChatHistory: !settings.saveChatHistory })} activeColorClass={classes.bg} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleExport} className="bg-black/20 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-colors">Exportar Dados</button>
                        <button onClick={onOpenImport} className="bg-black/20 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 text-sm transition-colors">Importar Dados</button>
                    </div>
                    <div className="border-t border-white/5 pt-6 space-y-4">
                        <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2">Zona de Perigo</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => handleReset('settings')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-colors">Resetar Ajustes</button>
                            <button onClick={() => handleReset('cache')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-colors">Limpar Cache</button>
                            <button onClick={() => handleReset('history')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-colors">Limpar Histórico IA</button>
                            <button onClick={() => handleReset('all')} className="bg-red-500/80 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-900/20 border border-red-400/50 transition-colors">Resetar Tudo</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
    };

    const renderAbout = () => (
        <div className={`space-y-6 animate-enter`}>
            <section className={`${cardClass} rounded-3xl ${density.padding} border-l-4 relative overflow-hidden`} style={{ borderLeftColor: classes.hex }}>
                <div className="relative z-10">
                    <h3 className={`text-lg font-bold text-white mb-2 flex items-center gap-2`}>
                        <HeartIcon className={`w-5 h-5 ${classes.text} fill-current ${!isPerformanceMode && !settings.reducedMotion ? 'animate-pulse' : ''}`} /> 
                        Apoie o Projeto
                    </h3>
                    <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-4 flex flex-col gap-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Chave Pix (Aleatória)</p>
                        <code className={`font-mono ${classes.text} text-sm break-all select-all`}>8001be0f-4952-4ef8-b2a5-9bafe691c65c</code>
                    </div>
                    <button onClick={handleCopyPix} className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg group ${pixCopied ? `${classes.bg} text-white` : `${classes.bg}/10 ${classes.text} border ${classes.borderFaded} hover:${classes.bg} hover:text-white`}`}>{pixCopied ? 'Chave Copiada!' : 'Copiar Chave Pix'}</button>
                </div>
            </section>
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Links Úteis</h3>
                <div className="grid grid-cols-1 gap-3">
                    <a href="https://policies-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition-all"><div className={`p-2 rounded-lg bg-gray-800 text-gray-400`}><FileTextIcon className="w-5 h-5" /></div><div className="flex-1"><h4 className="text-sm font-bold text-white">Política de Privacidade</h4></div><ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" /></a>
                    <a href="https://sobre-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition-all"><div className={`p-2 rounded-lg bg-gray-800 text-gray-400`}><GlobeIcon className="w-5 h-5" /></div><div className="flex-1"><h4 className="text-sm font-bold text-white">Sobre o Projeto</h4></div><ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" /></a>
                    <a href="https://github.com/elias001011/Meteor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition-all"><div className={`p-2 rounded-lg bg-gray-800 text-gray-400`}><GithubIcon className="w-5 h-5" /></div><div className="flex-1"><h4 className="text-sm font-bold text-white">GitHub</h4></div><ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" /></a>
                </div>
            </section>
             <div className="pt-2 pb-6">
                <button onClick={onOpenChangelog} className={`w-full group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60 hover:bg-gray-900/80 transition-all p-4 text-left flex items-center justify-between`}>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`p-3 rounded-full bg-gradient-to-br ${classes.gradient} shadow-lg`}><SparklesIcon className="w-5 h-5 text-white" /></div>
                        <div><p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Meteor App</p><p className="text-white font-bold">Versão 5.2.0 (Dev)</p><p className="text-xs text-gray-500 mt-0.5">Desenvolvido por @elias_jrnunes</p></div>
                    </div>
                    <ChevronLeftIcon className="w-5 h-5 rotate-180 text-gray-500" />
                </button>
            </div>
        </div>
    );

    return (
        <div className={`p-4 sm:p-6 max-w-3xl mx-auto ${density.settingsGap} pb-32`}>
            <h2 className={`text-2xl font-bold text-white flex items-center gap-3 tracking-tight`}>Ajustes</h2>
            {feedbackMessage && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium shadow-xl border border-emerald-400/50 animate-enter-pop">{feedbackMessage}</div>}
            
            <div className="sticky top-4 z-30 mb-8 flex justify-center">
                 <div className={`${glassClass} rounded-full p-1.5 shadow-2xl flex gap-1 overflow-x-auto max-w-full scrollbar-hide`}>
                    <TabButton id="general" label="Geral" icon={<SettingsIcon className="w-4 h-4" />} />
                    <TabButton id="visual" label="Visual" icon={<EyeIcon className="w-4 h-4" />} />
                    <TabButton id="ai" label="IA" icon={<SparklesIcon className="w-4 h-4" />} />
                    <TabButton id="data" label="Dados" icon={<DatabaseIcon className="w-4 h-4" />} />
                    <TabButton id="about" label="Sobre" icon={<HeartIcon className="w-4 h-4" />} />
                </div>
            </div>

            <div className="min-h-[300px]">
                {activeTab === 'general' && renderGeneral()}
                {activeTab === 'visual' && renderVisual()}
                {activeTab === 'ai' && renderAi()}
                {activeTab === 'data' && renderData()}
                {activeTab === 'about' && renderAbout()}
            </div>
        </div>
    );
};

export default SettingsView;