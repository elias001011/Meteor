
import React, { useState, useEffect } from 'react';
import type { AppSettings, View, DataSource, AppTheme, TransparencyMode, ClockDisplayMode, BackgroundMode, MapTheme, BorderEffectMode } from '../../types';
import { getSettings, saveSettings, exportAppData, importAppData, resetSettings, resetCache, resetAllData } from '../../services/settingsService';
import CitySelectionModal from '../common/CitySelectionModal';
import ImportModal from './ImportModal';
import ChangelogModal from './ChangelogModal';
import { useTheme } from '../context/ThemeContext';
import { XIcon, LightbulbIcon, SparklesIcon, ChevronLeftIcon, GaugeIcon } from '../icons';

interface SettingsViewProps {
    settings: AppSettings;
    onSettingsChanged: (newSettings: AppSettings) => void;
    onClearHistory: () => void; // New prop for immediate clearing
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChanged, onClearHistory }) => {
    const [showCityModal, setShowCityModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showChangelogModal, setShowChangelogModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    
    // State for PWA Banner
    const [showPwaBanner, setShowPwaBanner] = useState(true);
    
    // Use Theme Context to get dynamic styles for headings/buttons
    const { classes, cardClass, isPerformanceMode } = useTheme();

    // Fullscreen state
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
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleReset = (type: 'settings' | 'cache' | 'history' | 'all') => {
        if (!confirm("Tem certeza? Esta ação é irreversível.")) return;

        switch (type) {
            case 'settings':
                resetSettings();
                const defaultSettings = getSettings();
                onSettingsChanged(defaultSettings);
                setFeedbackMessage("Configurações resetadas.");
                break;
            case 'cache':
                resetCache();
                setFeedbackMessage("Cache limpo.");
                break;
            case 'history':
                onClearHistory(); // Use the prop function
                setFeedbackMessage("Histórico da IA limpo.");
                break;
            case 'all':
                resetAllData();
                window.location.reload();
                break;
        }
        setTimeout(() => setFeedbackMessage(null), 3000);
    };

    const handleExport = () => {
        try {
            exportAppData();
            // Visual feedback is crucial for UX
            setFeedbackMessage("Backup salvo nos downloads!");
            setTimeout(() => setFeedbackMessage(null), 3000);
        } catch (e) {
            console.error(e);
            setFeedbackMessage("Erro ao exportar dados.");
        }
    };

    const handleImport = (content: string, options: any) => {
        const success = importAppData(content, options);
        if (success) {
            setFeedbackMessage("Dados importados com sucesso! Recarregando...");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            setFeedbackMessage("Falha ao importar arquivo.");
            setTimeout(() => setFeedbackMessage(null), 3000);
        }
        setShowImportModal(false);
    };
    
    const themes: { id: AppTheme, name: string, color: string }[] = [
        { id: 'cyan', name: 'Padrão', color: 'bg-cyan-500' },
        { id: 'blue', name: 'Royal', color: 'bg-blue-600' },
        { id: 'purple', name: 'Profundo', color: 'bg-purple-600' },
        { id: 'emerald', name: 'Natureza', color: 'bg-emerald-600' },
        { id: 'rose', name: 'Floral', color: 'bg-rose-600' },
        { id: 'amber', name: 'Solar', color: 'bg-amber-500' },
    ];

    const transparencyOptions: { id: TransparencyMode, label: string }[] = [
        { id: 'off', label: 'Sólido' },
        { id: 'low', label: 'Híbrido' },
        { id: 'glass', label: 'Vidro (Glass)' }
    ];
    
    const backgroundOptions: { id: BackgroundMode, label: string }[] = [
        { id: 'gradient', label: 'Elegante (Gradiente)' },
        { id: 'solid', label: 'Minimalista (Sólido)' }
    ];
    
    const mapThemeOptions: { id: MapTheme, label: string }[] = [
        { id: 'light', label: 'Claro' },
        { id: 'dark', label: 'Escuro' }
    ];
    
    const borderEffectOptions: { id: BorderEffectMode, label: string }[] = [
        { id: 'none', label: 'Desligado' },
        { id: 'top', label: 'Topo' },
        { id: 'bottom', label: 'Base' }
    ];

    // Consistent Select Style
    const selectStyle = `w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white focus:ring-2 outline-none ${classes.ring} appearance-none cursor-pointer hover:bg-gray-900/80 transition-colors`;
    const disabledSectionStyle = isPerformanceMode ? 'opacity-50 pointer-events-none filter grayscale' : '';

    // Helper for Toggle Switch
    const ToggleSwitch = ({ checked, onChange, disabled = false, activeColorClass }: { checked: boolean, onChange: () => void, disabled?: boolean, activeColorClass?: string }) => (
        <button 
            onClick={onChange}
            disabled={disabled}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${checked ? (activeColorClass || 'bg-emerald-500') : 'bg-gray-600/50'} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            aria-pressed={checked}
        >
            <div 
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} 
            />
        </button>
    );

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-8 pb-32">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                Ajustes do Meteor
            </h2>

            {/* PWA Banner Prompt */}
            {showPwaBanner && !window.matchMedia('(display-mode: standalone)').matches && (
                <div className="bg-gradient-to-r from-blue-900/80 to-cyan-900/80 backdrop-blur-md border border-blue-500/30 p-5 rounded-3xl flex items-start justify-between gap-4 shadow-lg">
                    <div className="flex gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-full h-fit text-blue-400 shadow-inner">
                            <LightbulbIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-lg">Instale o Meteor</h4>
                            <p className="text-sm text-gray-200 mt-1 leading-relaxed">
                                O aplicativo funciona muito melhor quando instalado como PWA. Você ganha tela cheia, melhor desempenho e acesso offline.
                            </p>
                            <p className="text-xs text-cyan-300 mt-2 font-medium">
                                Toque em "Compartilhar" e depois em "Adicionar à Tela de Início" (iOS) ou "Instalar App" (Android).
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowPwaBanner(false)} 
                        className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
            )}

            {feedbackMessage && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium shadow-xl border border-emerald-400/50 text-center whitespace-nowrap">
                    {feedbackMessage}
                </div>
            )}
            
            {/* --- PERFORMANCE MODE TOGGLE --- */}
            <section className={`rounded-3xl p-6 ${cardClass} border-emerald-500/30 relative overflow-hidden`}>
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-cyan-500"></div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-500/20 p-3 rounded-full">
                             <GaugeIcon className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-white font-bold text-lg">Modo Desempenho</span>
                            <span className="text-sm text-gray-400">Desliga efeitos visuais pesados para maior velocidade.</span>
                        </div>
                    </div>
                    <ToggleSwitch 
                        checked={settings.performanceMode} 
                        onChange={() => handleSave({ performanceMode: !settings.performanceMode })} 
                        activeColorClass="bg-emerald-500"
                    />
                </div>
            </section>

            {/* --- CUSTOMIZATION --- */}
             <section className={`rounded-3xl p-6 ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-6 flex items-center gap-2`}>
                    Personalização
                </h3>
                <div className="space-y-8">
                    
                    {/* Reduced Motion Toggle */}
                    <div className={`flex items-center justify-between pb-6 border-b border-white/5`}>
                        <div className="flex flex-col gap-1">
                            <span className="text-white font-medium">Remover Animações</span>
                            <span className="text-xs text-gray-400">
                                {isPerformanceMode ? 'Ativado pelo Modo Desempenho' : 'Desativa transições e movimentos da interface.'}
                            </span>
                        </div>
                        <ToggleSwitch 
                            checked={settings.reducedMotion || isPerformanceMode}
                            onChange={() => handleSave({ reducedMotion: !settings.reducedMotion })}
                            disabled={isPerformanceMode}
                            activeColorClass={classes.bg}
                        />
                    </div>

                    {/* Dynamic Theme Toggle */}
                    <div className={`flex items-center justify-between pb-6 border-b border-white/5 ${disabledSectionStyle}`}>
                        <div className="flex flex-col gap-1">
                            <span className="text-white font-medium">Tema Dinâmico</span>
                            <span className="text-xs text-gray-400">
                                {isPerformanceMode ? 'Desativado pelo Modo Desempenho' : 'Muda a cor com base no clima e na hora do dia.'}
                            </span>
                        </div>
                        <ToggleSwitch 
                            checked={settings.dynamicTheme}
                            onChange={() => handleSave({ dynamicTheme: !settings.dynamicTheme })}
                            disabled={isPerformanceMode}
                            activeColorClass={classes.bg}
                        />
                    </div>

                    {/* Theme Color */}
                    <div className={`transition-opacity duration-300 ${settings.dynamicTheme || isPerformanceMode ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <label className="text-sm font-medium text-gray-300 mb-4 block">
                            Cor do Tema {(settings.dynamicTheme || isPerformanceMode) && '(Controlado pelo Sistema)'}
                        </label>
                        <div className="flex flex-wrap gap-4">
                            {themes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleSave({ themeColor: theme.id })}
                                    disabled={settings.dynamicTheme || isPerformanceMode}
                                    className={`w-12 h-12 rounded-full ${theme.color} transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-transparent ${settings.themeColor === theme.id ? `ring-white scale-110 shadow-lg` : 'ring-transparent opacity-70 hover:opacity-100'}`}
                                    aria-label={`Selecionar tema ${theme.name}`}
                                    title={theme.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Background Mode */}
                    <div className={disabledSectionStyle}>
                        <div className="flex flex-col mb-3 gap-1">
                            <span className="text-white font-medium">Estilo do Fundo</span>
                            <span className="text-xs text-gray-400">
                                {isPerformanceMode ? 'Definido como Sólido (Desempenho)' : 'Escolha entre a aparência padrão ou minimalista.'}
                            </span>
                        </div>
                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                            {backgroundOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSave({ backgroundMode: option.id })}
                                    disabled={isPerformanceMode}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                        settings.backgroundMode === option.id 
                                            ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                     {/* Border Effect (LED) Selector */}
                     <div className={disabledSectionStyle}>
                        <div className="flex flex-col mb-3 gap-1">
                            <span className="text-white font-medium">Efeito LED (Borda)</span>
                            <span className="text-xs text-gray-400">
                                 {isPerformanceMode ? 'Desativado pelo Modo Desempenho' : 'Adiciona um brilho colorido no topo ou na base da tela.'}
                            </span>
                        </div>
                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                            {borderEffectOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSave({ borderEffect: option.id })}
                                    disabled={isPerformanceMode}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                        settings.borderEffect === option.id 
                                            ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Visual Effects */}
                    <div className="space-y-6">
                        <div className={disabledSectionStyle}>
                            <div className="flex flex-col mb-3 gap-1">
                                <span className="text-white font-medium">Transparência (Efeito Vidro)</span>
                                <span className="text-xs text-gray-400">
                                     {isPerformanceMode ? 'Desativado pelo Modo Desempenho' : 'Controle a intensidade dos efeitos visuais na interface.'}
                                </span>
                            </div>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {transparencyOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleSave({ transparencyMode: option.id })}
                                        disabled={isPerformanceMode}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                            settings.transparencyMode === option.id 
                                                ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Map Theme */}
                        <div>
                            <div className="flex flex-col mb-3 gap-1">
                                <span className="text-white font-medium">Tema do Mapa</span>
                            </div>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {mapThemeOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleSave({ mapTheme: option.id })}
                                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                                            settings.mapTheme === option.id 
                                                ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`flex items-center justify-between pt-6 border-t border-white/5 ${disabledSectionStyle}`}>
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">Animação de Chuva</span>
                                <span className="text-xs text-gray-400">
                                     {isPerformanceMode ? 'Desativado pelo Modo Desempenho' : 'Mostrar gotas na tela quando chover.'}
                                </span>
                            </div>
                            <ToggleSwitch 
                                checked={settings.rainAnimation.enabled}
                                onChange={() => handleSave({ 
                                    rainAnimation: { 
                                        ...settings.rainAnimation, 
                                        enabled: !settings.rainAnimation.enabled 
                                    } 
                                })}
                                disabled={isPerformanceMode}
                                activeColorClass={classes.bg}
                            />
                        </div>

                        {settings.rainAnimation.enabled && !isPerformanceMode && (
                             <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl">
                                <span className="text-sm text-gray-300 font-medium pl-1">Intensidade da Chuva</span>
                                <div className="flex bg-black/20 rounded-lg p-1">
                                    <button 
                                        onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, intensity: 'low' } })}
                                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${settings.rainAnimation.intensity === 'low' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Baixa
                                    </button>
                                    <button 
                                        onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, intensity: 'high' } })}
                                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${settings.rainAnimation.intensity === 'high' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        Alta
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">Barras de Rolagem</span>
                                <span className="text-xs text-gray-400">Pode ser útil em desktops.</span>
                            </div>
                            <ToggleSwitch 
                                checked={settings.showScrollbars}
                                onChange={() => handleSave({ showScrollbars: !settings.showScrollbars })}
                                activeColorClass={classes.bg}
                            />
                        </div>
                    </div>

                </div>
            </section>

            {/* --- GENERAL --- */}
            <section className={`rounded-3xl p-6 ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-6`}>Geral</h3>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-medium">Modo Tela Cheia (Agora)</span>
                            <button 
                                onClick={toggleFullscreen}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${isFullscreen ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}
                            >
                                {isFullscreen ? 'Sair' : 'Ativar'}
                            </button>
                        </div>
                         <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex flex-col gap-1">
                                <span className="text-white font-medium">Sempre iniciar em tela cheia</span>
                                <span className="text-xs text-gray-400">Entrará automaticamente ao tocar na tela.</span>
                            </div>
                            <ToggleSwitch 
                                checked={settings.startFullscreen}
                                onChange={() => handleSave({ startFullscreen: !settings.startFullscreen })}
                                activeColorClass={classes.bg}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-white font-medium">Relógio do Sistema (Topo)</span>
                        <ToggleSwitch 
                            checked={settings.showClock}
                            onChange={() => handleSave({ showClock: !settings.showClock })}
                            activeColorClass={classes.bg}
                        />
                    </div>

                    <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                        <label className="text-sm font-medium text-gray-300">Horário Local da Cidade</label>
                        <select 
                            value={settings.clockDisplayMode}
                            onChange={(e) => handleSave({ clockDisplayMode: e.target.value as ClockDisplayMode })}
                            className={selectStyle}
                        >
                            <option value="always" className="bg-gray-800 text-white">Sempre mostrar</option>
                            <option value="different_zone" className="bg-gray-800 text-white">Apenas se o fuso for diferente do meu</option>
                            <option value="never" className="bg-gray-800 text-white">Nunca mostrar</option>
                        </select>
                        <p className="text-xs text-gray-500">
                            Define quando o horário da cidade visualizada aparece no card principal.
                        </p>
                    </div>
                </div>
            </section>

             {/* --- DATA SOURCE --- */}
             <section className={`rounded-3xl p-6 ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-6`}>Dados Meteorológicos</h3>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium text-gray-300">Fonte de Dados Preferida</label>
                    <select 
                        value={settings.weatherSource}
                        onChange={(e) => handleSave({ weatherSource: e.target.value as DataSource | 'auto' })}
                        className={selectStyle}
                    >
                        <option value="auto" className="bg-gray-800 text-white">Automático (Recomendado)</option>
                        <option value="onecall" className="bg-gray-800 text-white">OpenWeather (OneCall/Pro)</option>
                        <option value="free" className="bg-gray-800 text-white">OpenWeather (Padrão/Gratuito)</option>
                        <option value="open-meteo" className="bg-gray-800 text-white">Open-Meteo (Open Source)</option>
                    </select>
                    <p className="text-xs text-gray-500">
                        Define de onde o Meteor deve tentar buscar os dados primeiro. O modo Automático gerencia limites e falhas automaticamente.
                    </p>
                </div>
            </section>

            {/* --- STARTUP --- */}
            <section className={`rounded-3xl p-6 ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-6`}>Inicialização</h3>
                <div className="space-y-6">
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-medium text-gray-300">Visualização ao abrir o app</label>
                        <select 
                            value={settings.startupBehavior}
                            onChange={(e) => {
                                const val = e.target.value as any;
                                handleSave({ startupBehavior: val });
                                if (val === 'specific_location') setShowCityModal(true);
                            }}
                            className={selectStyle}
                        >
                            <option value="idle" className="bg-gray-800 text-white">Tela Inicial (Boas-vindas)</option>
                            <option value="last_location" className="bg-gray-800 text-white">Última Localização</option>
                            <option value="specific_location" className="bg-gray-800 text-white">Localização Específica</option>
                            <option value="custom_section" className="bg-gray-800 text-white">Seção Personalizada</option>
                        </select>
                    </div>

                    {settings.startupBehavior === 'specific_location' && (
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <div>
                                <p className="text-sm text-gray-400">Local Definido:</p>
                                <p className="font-bold text-white text-lg">
                                    {settings.specificLocation ? `${settings.specificLocation.name}, ${settings.specificLocation.country}` : 'Nenhum selecionado'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowCityModal(true)}
                                className={`${classes.text} text-sm hover:underline font-medium`}
                            >
                                Alterar
                            </button>
                        </div>
                    )}

                    {settings.startupBehavior === 'custom_section' && (
                        <div className="flex flex-col gap-3">
                             <label className="text-sm font-medium text-gray-300">Seção Padrão</label>
                             <select 
                                value={settings.startupSection || 'weather'}
                                onChange={(e) => handleSave({ startupSection: e.target.value as View })}
                                className={selectStyle}
                            >
                                <option value="map" className="bg-gray-800 text-white">Mapa</option>
                                <option value="ai" className="bg-gray-800 text-white">IA</option>
                                <option value="news" className="bg-gray-800 text-white">Notícias</option>
                                <option value="tips" className="bg-gray-800 text-white">Dicas</option>
                                <option value="info" className="bg-gray-800 text-white">Informações</option>
                            </select>
                        </div>
                    )}
                </div>
            </section>
            
             {/* --- DATA MANAGEMENT --- */}
             <section className={`rounded-3xl p-6 ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-6`}>Gerenciamento de Dados</h3>
                <div className="space-y-6">
                     <div className="flex items-center justify-between pb-6 border-b border-white/5">
                        <div className="flex flex-col gap-1">
                            <span className="text-white font-medium">Salvar Histórico de Chat</span>
                            <span className="text-xs text-gray-400">Manter conversas após recarregar.</span>
                        </div>
                        <ToggleSwitch 
                            checked={settings.saveChatHistory}
                            onChange={() => handleSave({ saveChatHistory: !settings.saveChatHistory })}
                            activeColorClass={classes.bg}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Exportar
                        </button>
                        <button onClick={() => setShowImportModal(true)} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Importar
                        </button>
                    </div>

                    <div className="border-t border-white/5 pt-6 space-y-4">
                        <h4 className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            Zona de Perigo
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => handleReset('settings')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-colors">
                                Resetar Configurações
                            </button>
                            <button onClick={() => handleReset('cache')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-colors">
                                Limpar Cache (API)
                            </button>
                            <button onClick={() => handleReset('history')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-colors">
                                Limpar Histórico IA
                            </button>
                            <button onClick={() => handleReset('all')} className="bg-red-500/80 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-red-900/20 border border-red-400/50">
                                Resetar Tudo (Fábrica)
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <CitySelectionModal 
                isOpen={showCityModal}
                onClose={() => {
                    setShowCityModal(false);
                    // PROTECTION: Revert if specific location was selected but not set
                    if (!settings.specificLocation) {
                        handleSave({ startupBehavior: 'idle' });
                        setFeedbackMessage("Nenhuma localização selecionada. Configuração revertida para Tela Inicial.");
                        setTimeout(() => setFeedbackMessage(null), 4000);
                    }
                }}
                onSelect={(city) => {
                    handleSave({ specificLocation: city });
                    setShowCityModal(false);
                }}
            />

            <ImportModal 
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImport={handleImport}
            />
            
            <ChangelogModal 
                isOpen={showChangelogModal}
                onClose={() => setShowChangelogModal(false)}
            />

            {/* Enhanced Footer */}
            <div className="pt-6 pb-4">
                <button 
                    onClick={() => setShowChangelogModal(true)}
                    className={`w-full group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900/40 hover:bg-gray-900/80 transition-all duration-300 p-4 text-left flex items-center justify-between hover:shadow-lg hover:border-${classes.text.split('-')[1]}-500/30`}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`p-3 rounded-full bg-gradient-to-br ${classes.gradient} shadow-lg`}>
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Meteor App</p>
                            <p className="text-white font-bold">Versão 2.0.0</p>
                            <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-300 transition-colors">Desenvolvido por @elias_jrnunes</p>
                        </div>
                    </div>
                    <div className="relative z-10 bg-white/5 p-2 rounded-full text-gray-400 group-hover:text-white transition-colors group-hover:translate-x-1 transform duration-300">
                        <ChevronLeftIcon className="w-5 h-5 rotate-180" />
                    </div>
                    
                    {/* Glow effect on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${classes.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                </button>
            </div>
        </div>
    );
};

export default SettingsView;
