
import React, { useState, useEffect } from 'react';
import type { AppSettings, View, DataSource, AppTheme, TransparencyMode, ClockDisplayMode, BackgroundMode, MapTheme, BorderEffectMode, LayoutDensity } from '../../types';
import { getSettings, resetSettings, resetCache, resetAllData, exportAppData } from '../../services/settingsService';
import { useTheme } from '../context/ThemeContext';
import { XIcon, LightbulbIcon, SparklesIcon, ChevronLeftIcon, GaugeIcon, HeartIcon, GithubIcon, FileTextIcon, GlobeIcon } from '../icons';

interface SettingsViewProps {
    settings: AppSettings;
    onSettingsChanged: (newSettings: AppSettings) => void;
    onClearHistory: () => void; 
    // External Modal Handlers
    onOpenImport: () => void;
    onOpenChangelog: () => void;
    onOpenCitySelection: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    settings, 
    onSettingsChanged, 
    onClearHistory, 
    onOpenImport, 
    onOpenChangelog, 
    onOpenCitySelection 
}) => {
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [showPwaBanner, setShowPwaBanner] = useState(true);
    const [pixCopied, setPixCopied] = useState(false);
    
    const { classes, cardClass, isPerformanceMode, density } = useTheme();
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
                onClearHistory(); 
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
            setFeedbackMessage("Backup salvo nos downloads!");
            setTimeout(() => setFeedbackMessage(null), 3000);
        } catch (e) {
            console.error(e);
            setFeedbackMessage("Erro ao exportar dados.");
        }
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

    const transparencyOptions: { id: TransparencyMode, label: string }[] = [
        { id: 'off', label: 'Sólido' },
        { id: 'low', label: 'Híbrido' },
        { id: 'glass', label: 'Vidro' }
    ];
    
    const backgroundOptions: { id: BackgroundMode, label: string }[] = [
        { id: 'gradient', label: 'Gradiente' },
        { id: 'solid', label: 'Sólido' }
    ];
    
    const mapThemeOptions: { id: MapTheme, label: string }[] = [
        { id: 'light', label: 'Claro' },
        { id: 'dark', label: 'Escuro' }
    ];
    
    const borderEffectOptions: { id: BorderEffectMode, label: string }[] = [
        { id: 'none', label: 'Off' },
        { id: 'top', label: 'Topo' },
        { id: 'bottom', label: 'Base' }
    ];
    
    const densityOptions: { id: LayoutDensity, label: string }[] = [
        { id: 'comfortable', label: 'Normal' },
        { id: 'compact', label: 'Compacto' }
    ];

    // Consistent Select Style
    const selectStyle = `w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-2 text-white focus:ring-2 outline-none ${classes.ring} appearance-none cursor-pointer hover:bg-gray-900/80 transition-colors ${density.text}`;
    const inputStyle = `w-full bg-gray-900/50 border border-gray-600/50 rounded-xl px-4 py-2 text-white focus:ring-2 outline-none ${classes.ring} placeholder-gray-500 transition-colors ${density.text}`;
    const disabledSectionStyle = isPerformanceMode ? 'opacity-50 pointer-events-none filter grayscale' : '';

    // Re-implemented Toggle Switch with Absolute Positioning for precision and reliability on mobile
    const ToggleSwitch = ({ checked, onChange, disabled = false, activeColorClass }: { checked: boolean, onChange: () => void, disabled?: boolean, activeColorClass?: string }) => (
        <button 
            onClick={onChange}
            disabled={disabled}
            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ease-in-out focus:outline-none flex-shrink-0 ${checked ? (activeColorClass || classes.bg) : 'bg-gray-600/50'} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            aria-pressed={checked}
        >
            <span 
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transform transition-all duration-300 ease-in-out ${checked ? 'left-6' : 'left-1'}`} 
            />
        </button>
    );

    return (
        <div className={`p-4 sm:p-6 max-w-3xl mx-auto ${density.settingsGap} pb-32`}>
            <h2 className={`text-2xl font-bold text-white flex items-center gap-3 tracking-tight`}>
                Ajustes do Meteor
            </h2>

            {showPwaBanner && !window.matchMedia('(display-mode: standalone)').matches && (
                <div className={`relative overflow-hidden backdrop-blur-md border ${classes.borderFaded} ${density.padding} rounded-3xl flex items-start justify-between gap-4 shadow-lg group`}>
                    {/* Background Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${classes.gradient} opacity-10 pointer-events-none`}></div>
                    
                    <div className="flex gap-4 relative z-10">
                        <div className={`p-3 rounded-full h-fit ${classes.bg}/20 shadow-inner`}>
                            <LightbulbIcon className={`w-6 h-6 ${classes.text}`} />
                        </div>
                        <div>
                            <h4 className="font-bold text-white text-lg">Instale o Meteor</h4>
                            <p className="text-sm text-gray-200 mt-1 leading-relaxed">
                                O aplicativo funciona muito melhor quando instalado como PWA.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowPwaBanner(false)} 
                        className="text-gray-400 hover:text-white transition-colors p-1 relative z-10"
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
            <section className={`rounded-3xl ${density.padding} ${isPerformanceMode ? 'bg-gray-900' : cardClass} ${classes.borderFaded} relative overflow-hidden`}>
                 <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${classes.gradient}`}></div>
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`${classes.bg}/20 p-3 rounded-full`}>
                             <GaugeIcon className={`w-6 h-6 ${classes.text}`} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-white font-bold text-lg">Modo Desempenho</span>
                            <span className={`text-xs ${density.subtext} text-gray-400`}>Desliga efeitos visuais pesados para maior velocidade.</span>
                        </div>
                    </div>
                    <ToggleSwitch 
                        checked={settings.performanceMode} 
                        onChange={() => handleSave({ performanceMode: !settings.performanceMode })} 
                        activeColorClass={classes.bg}
                    />
                </div>
            </section>

             {/* --- IA SETTINGS (NEW) --- */}
             <section className={`rounded-3xl ${density.padding} ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}>
                    <SparklesIcon className="w-5 h-5" />
                    Inteligência Artificial
                </h3>
                <div className={density.settingsGap}>
                    <div className="flex flex-col gap-2">
                         <label className={`${density.text} text-sm font-medium text-gray-300`}>Como devo te chamar?</label>
                         <input 
                            type="text"
                            value={settings.userName || ''}
                            onChange={(e) => handleSave({ userName: e.target.value })}
                            placeholder="Seu nome ou apelido"
                            className={inputStyle}
                            maxLength={30}
                         />
                    </div>

                    <div className="flex flex-col gap-2">
                         <label className={`${density.text} text-sm font-medium text-gray-300`}>Instruções de Personalidade</label>
                         <span className="text-xs text-gray-400 mb-1">Ex: "Responda em rimas", "Seja muito formal". A IA seguirá isso dentro do possível, sem violar suas regras de segurança.</span>
                         <textarea 
                            value={settings.userAiInstructions || ''}
                            onChange={(e) => handleSave({ userAiInstructions: e.target.value })}
                            placeholder="Digite suas preferências..."
                            className={`${inputStyle} min-h-[80px] resize-none`}
                            maxLength={200}
                         />
                    </div>
                </div>
             </section>

            {/* --- CUSTOMIZATION --- */}
             <section className={`rounded-3xl ${density.padding} ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}>
                    Personalização
                </h3>
                <div className={density.settingsGap}>
                    
                    {/* Layout Density */}
                    <div>
                        <div className="flex flex-col mb-2 gap-0.5">
                            <span className={`${density.text} font-medium text-white`}>Densidade do Layout</span>
                            <span className="text-xs text-gray-400">Escolha o tamanho dos elementos da interface.</span>
                        </div>
                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                            {densityOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSave({ layoutDensity: option.id })}
                                    className={`flex-1 py-2 rounded-lg ${density.text} font-medium transition-all duration-300 ${
                                        settings.layoutDensity === option.id 
                                            ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Reduced Motion Toggle */}
                    <div className={`flex items-center justify-between pb-3 border-b border-white/5`}>
                        <div className="flex flex-col gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Remover Animações</span>
                            <span className="text-xs text-gray-400">
                                {isPerformanceMode ? 'Ativado pelo Modo Desempenho' : 'Desativa transições e movimentos.'}
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
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Tema Dinâmico</span>
                            <span className="text-xs text-gray-400">
                                Muda a cor do aplicativo com base no clima atual.
                            </span>
                        </div>
                        <ToggleSwitch 
                            checked={settings.dynamicTheme}
                            onChange={() => handleSave({ dynamicTheme: !settings.dynamicTheme })}
                            activeColorClass={classes.bg}
                        />
                    </div>

                    {/* Theme Color */}
                    <div className={`transition-opacity duration-300 ${settings.dynamicTheme ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <label className={`${density.text} font-medium text-gray-300 mb-3 block`}>
                            Cor do Tema {settings.dynamicTheme && '(Automático)'}
                        </label>
                        <div className={`flex flex-wrap ${density.itemGap}`}>
                            {themes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleSave({ themeColor: theme.id })}
                                    disabled={settings.dynamicTheme}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${theme.color} transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-transparent ${settings.themeColor === theme.id ? `ring-white scale-110 shadow-lg` : 'ring-transparent opacity-70 hover:opacity-100'}`}
                                    aria-label={`Selecionar tema ${theme.name}`}
                                    title={theme.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Background Mode */}
                    <div className={disabledSectionStyle}>
                        <div className="flex flex-col mb-2 gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Estilo do Fundo</span>
                        </div>
                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                            {backgroundOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSave({ backgroundMode: option.id })}
                                    disabled={isPerformanceMode}
                                    className={`flex-1 py-2 rounded-lg ${density.text} font-medium transition-all duration-300 ${
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
                        <div className="flex flex-col mb-2 gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Efeito LED (Borda)</span>
                        </div>
                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                            {borderEffectOptions.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleSave({ borderEffect: option.id })}
                                    disabled={isPerformanceMode}
                                    className={`flex-1 py-2 rounded-lg ${density.text} font-medium transition-all duration-300 ${
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
                    <div className={density.settingsGap}>
                        <div className={disabledSectionStyle}>
                            <div className="flex flex-col mb-2 gap-0.5">
                                <span className={`${density.text} text-white font-medium`}>Transparência (Vidro)</span>
                            </div>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {transparencyOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleSave({ transparencyMode: option.id })}
                                        disabled={isPerformanceMode}
                                        className={`flex-1 py-2 rounded-lg ${density.text} font-medium transition-all duration-300 ${
                                            settings.transparencyMode === option.id 
                                                ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {/* GLASS SCOPE SETTINGS - ADDED */}
                            {settings.transparencyMode === 'glass' && (
                                <div className="mt-3 bg-black/20 rounded-xl p-4 border border-white/5 animate-enter">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Aplicar Efeito Vidro em:</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Cabeçalho (Header)</span>
                                            <ToggleSwitch 
                                                checked={settings.glassScope.header}
                                                onChange={() => handleSave({ glassScope: { ...settings.glassScope, header: !settings.glassScope.header } })}
                                                activeColorClass={classes.bg}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Cartões e Widgets</span>
                                            <ToggleSwitch 
                                                checked={settings.glassScope.cards}
                                                onChange={() => handleSave({ glassScope: { ...settings.glassScope, cards: !settings.glassScope.cards } })}
                                                activeColorClass={classes.bg}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Menus e Sobreposições</span>
                                            <ToggleSwitch 
                                                checked={settings.glassScope.overlays}
                                                onChange={() => handleSave({ glassScope: { ...settings.glassScope, overlays: !settings.glassScope.overlays } })}
                                                activeColorClass={classes.bg}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Map Theme */}
                        <div>
                            <div className="flex flex-col mb-2 gap-0.5">
                                <span className={`${density.text} text-white font-medium`}>Tema do Mapa</span>
                            </div>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {mapThemeOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => handleSave({ mapTheme: option.id })}
                                        className={`flex-1 py-2 rounded-lg ${density.text} font-medium transition-all duration-300 ${
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

                        {/* Rain Animation Section with Intensity - Restored */}
                        <div className={`pt-4 border-t border-white/5 ${disabledSectionStyle}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className={`${density.text} text-white font-medium`}>Animação de Chuva</span>
                                    <span className="text-xs text-gray-400">Mostrar chuva na tela quando chover no local.</span>
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
                            
                            {/* Sub-setting: Intensity */}
                            {settings.rainAnimation.enabled && (
                                <div className="flex items-center justify-between pl-4 border-l-2 border-gray-700">
                                    <span className="text-xs text-gray-400">Intensidade Visual</span>
                                    <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5">
                                        <button
                                            onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, intensity: 'low' } })}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${settings.rainAnimation.intensity === 'low' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            Leve
                                        </button>
                                        <button
                                            onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, intensity: 'high' } })}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${settings.rainAnimation.intensity === 'high' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                        >
                                            Intensa
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* RESTORED SCROLLBAR SETTING */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex flex-col gap-0.5">
                                <span className={`${density.text} text-white font-medium`}>Barras de Rolagem</span>
                                <span className="text-xs text-gray-400">Mostrar scrollbars nativos do navegador.</span>
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
            <section className={`rounded-3xl ${density.padding} ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Geral</h3>
                <div className={density.settingsGap}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className={`${density.text} text-white font-medium`}>Modo Tela Cheia</span>
                            <button 
                                onClick={toggleFullscreen}
                                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg ${isFullscreen ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}
                            >
                                {isFullscreen ? 'Sair' : 'Ativar'}
                            </button>
                        </div>
                         <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex flex-col gap-0.5">
                                <span className={`${density.text} text-white font-medium`}>Iniciar em tela cheia</span>
                                <span className="text-xs text-gray-400">Entrar automaticamente ao abrir o app.</span>
                            </div>
                            <ToggleSwitch 
                                checked={settings.startFullscreen}
                                onChange={() => handleSave({ startFullscreen: !settings.startFullscreen })}
                                activeColorClass={classes.bg}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Relógio do Sistema (Topo)</span>
                            <span className="text-xs text-gray-400">Exibe o horário no cabeçalho do app.</span>
                        </div>
                        <ToggleSwitch 
                            checked={settings.showClock}
                            onChange={() => handleSave({ showClock: !settings.showClock })}
                            activeColorClass={classes.bg}
                        />
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                        <label className={`${density.text} text-sm font-medium text-gray-300`}>Horário Local da Cidade</label>
                         <span className="text-xs text-gray-400 mb-1">Quando exibir o horário local no cartão de clima.</span>
                        <select 
                            value={settings.clockDisplayMode}
                            onChange={(e) => handleSave({ clockDisplayMode: e.target.value as ClockDisplayMode })}
                            className={selectStyle}
                        >
                            <option value="always" className="bg-gray-800 text-white">Sempre mostrar</option>
                            <option value="different_zone" className="bg-gray-800 text-white">Apenas se o fuso for diferente do meu</option>
                            <option value="never" className="bg-gray-800 text-white">Nunca mostrar</option>
                        </select>
                    </div>
                </div>
            </section>

             {/* --- DATA SOURCE --- */}
             <section className={`rounded-3xl ${density.padding} ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Dados Meteorológicos</h3>
                <div className="flex flex-col gap-2">
                    <label className={`${density.text} text-sm font-medium text-gray-300`}>Fonte de Dados Preferida</label>
                    <span className="text-xs text-gray-400 mb-1">Define de onde os dados climáticos são obtidos.</span>
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
                </div>
            </section>

            {/* --- STARTUP --- */}
            <section className={`rounded-3xl ${density.padding} ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Inicialização</h3>
                <div className={density.settingsGap}>
                    <div className="flex flex-col gap-2">
                        <label className={`${density.text} text-sm font-medium text-gray-300`}>Comportamento ao abrir</label>
                        <span className="text-xs text-gray-400 mb-1">Escolha o que acontece quando você abre o Meteor.</span>
                        <select 
                            value={settings.startupBehavior}
                            onChange={(e) => {
                                const val = e.target.value as any;
                                handleSave({ startupBehavior: val });
                                if (val === 'specific_location') onOpenCitySelection();
                            }}
                            className={selectStyle}
                        >
                            <option value="idle" className="bg-gray-800 text-white">Tela Inicial (Boas-vindas)</option>
                            <option value="last_location" className="bg-gray-800 text-white">Carregar Última Localização</option>
                            <option value="specific_location" className="bg-gray-800 text-white">Carregar Localização Específica</option>
                            <option value="custom_section" className="bg-gray-800 text-white">Abrir em uma Seção (ex: Chat)</option>
                        </select>
                    </div>

                    {settings.startupBehavior === 'custom_section' && (
                         <div className="mt-1 animate-enter">
                            <label className="text-sm font-medium text-gray-300 mb-2 block">Seção Padrão</label>
                            <select 
                                value={settings.startupSection || 'weather'}
                                onChange={(e) => handleSave({ startupSection: e.target.value as View })}
                                className={selectStyle}
                            >
                                <option value="weather" className="bg-gray-800 text-white">Clima</option>
                                <option value="ai" className="bg-gray-800 text-white">IA / Chat</option>
                                <option value="map" className="bg-gray-800 text-white">Mapa</option>
                                <option value="news" className="bg-gray-800 text-white">Notícias</option>
                                <option value="tips" className="bg-gray-800 text-white">Dicas</option>
                                <option value="info" className="bg-gray-800 text-white">Informações</option>
                            </select>
                         </div>
                    )}

                    {settings.startupBehavior === 'specific_location' && (
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <div>
                                <p className="text-sm text-gray-400">Local Definido:</p>
                                <p className="font-bold text-white text-lg">
                                    {settings.specificLocation ? `${settings.specificLocation.name}, ${settings.specificLocation.country}` : 'Nenhum selecionado'}
                                </p>
                            </div>
                            <button 
                                onClick={onOpenCitySelection}
                                className={`${classes.text} text-sm hover:underline font-medium`}
                            >
                                Alterar
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* --- DONATION / SUPPORT SECTION (PIX) --- */}
            <section className={`rounded-3xl ${density.padding} ${cardClass} border-l-4 border-emerald-500 relative overflow-hidden`}>
                <div className="relative z-10">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className={`text-lg font-bold text-white mb-2 flex items-center gap-2`}>
                                <HeartIcon className="w-5 h-5 text-emerald-500 fill-emerald-500 animate-pulse" />
                                Apoie o Projeto
                            </h3>
                            <p className="text-sm text-gray-300 max-w-lg leading-relaxed mb-4">
                                O Meteor é um projeto independente e gratuito. Se você gosta do app, considere fazer uma doação via Pix para ajudar a manter os servidores e o desenvolvimento.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-xl p-4 border border-white/10 mb-4 flex flex-col gap-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Chave Pix (Aleatória)</p>
                        <code className="font-mono text-emerald-400 text-sm break-all select-all">8001be0f-4952-4ef8-b2a5-9bafe691c65c</code>
                    </div>

                    <button
                        onClick={handleCopyPix}
                        className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg group ${pixCopied ? 'bg-emerald-500 text-white shadow-emerald-900/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 hover:shadow-emerald-900/20'}`}
                    >
                        {pixCopied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Chave Copiada!</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copiar Chave Pix</span>
                            </>
                        )}
                    </button>
                </div>
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 pointer-events-none"></div>
            </section>
            
             {/* --- DATA MANAGEMENT --- */}
             <section className={`rounded-3xl ${density.padding} ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Gerenciamento de Dados</h3>
                <div className={density.settingsGap}>
                     <div className="flex items-center justify-between pb-6 border-b border-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Salvar Histórico de Chat</span>
                            <span className="text-xs text-gray-400">Mantém suas conversas salvas no dispositivo.</span>
                        </div>
                        <ToggleSwitch 
                            checked={settings.saveChatHistory}
                            onChange={() => handleSave({ saveChatHistory: !settings.saveChatHistory })}
                            activeColorClass={classes.bg}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleExport} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                            Exportar Dados
                        </button>
                        <button onClick={onOpenImport} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-sm">
                            Importar Dados
                        </button>
                    </div>

                    <div className="border-t border-white/5 pt-6 space-y-4">
                        <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            Zona de Perigo
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => handleReset('settings')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-colors">
                                Resetar Ajustes
                            </button>
                            <button onClick={() => handleReset('cache')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-colors">
                                Limpar Cache
                            </button>
                            <button onClick={() => handleReset('history')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-colors">
                                Limpar Histórico IA
                            </button>
                            <button onClick={() => handleReset('all')} className="bg-red-500/80 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold transition-colors shadow-lg shadow-red-900/20 border border-red-400/50">
                                Resetar Tudo
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- USEFUL LINKS (NEW) --- */}
            <section className={`rounded-3xl ${density.padding} ${cardClass}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Links Úteis</h3>
                <div className="grid grid-cols-1 gap-3">
                    <a href="https://policies-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className={`p-2 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-gray-700 transition-colors`}>
                            <FileTextIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">Política de Privacidade e Termos</h4>
                            <p className="text-xs text-gray-400">Leia sobre como tratamos seus dados</p>
                        </div>
                        <ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" />
                    </a>

                    <a href="https://sobre-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className={`p-2 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-gray-700 transition-colors`}>
                            <GlobeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">Sobre o Projeto</h4>
                            <p className="text-xs text-gray-400">Conheça a história e missão do Meteor</p>
                        </div>
                         <ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" />
                    </a>

                    <a href="https://github.com/elias001011/Meteor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className={`p-2 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-gray-700 transition-colors`}>
                            <GithubIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">Repositório GitHub</h4>
                            <p className="text-xs text-gray-400">Código fonte aberto e contribuições</p>
                        </div>
                         <ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" />
                    </a>
                </div>
            </section>

            {/* Enhanced Footer */}
            <div className="pt-6 pb-4">
                <button 
                    onClick={onOpenChangelog}
                    className={`w-full group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900/40 hover:bg-gray-900/80 transition-all duration-300 p-4 text-left flex items-center justify-between hover:shadow-lg hover:border-${classes.text.split('-')[1]}-500/30`}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`p-3 rounded-full bg-gradient-to-br ${classes.gradient} shadow-lg`}>
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Meteor App</p>
                            <p className="text-white font-bold">Versão 2.5.0</p>
                            <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-300 transition-colors">Desenvolvido por @elias_jrnunes</p>
                        </div>
                    </div>
                    <div className="relative z-10 bg-white/5 p-2 rounded-full text-gray-400 group-hover:text-white transition-colors group-hover:translate-x-1 transform duration-300">
                        <ChevronLeftIcon className="w-5 h-5 rotate-180" />
                    </div>
                    
                    <div className={`absolute inset-0 bg-gradient-to-r ${classes.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                </button>
            </div>
        </div>
    );
};

export default SettingsView;
