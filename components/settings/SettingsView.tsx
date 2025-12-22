

import React, { useState, useEffect } from 'react';
import type { AppSettings, View, DataSource, AppTheme, TransparencyMode, ClockDisplayMode, BackgroundMode, MapTheme, BorderEffectMode, LayoutDensity, DesktopLayout } from '../../types';
import { getSettings, resetSettings, resetCache, resetAllData, exportAppData } from '../../services/settingsService';
import { useTheme } from '../context/ThemeContext';
import { 
    XIcon, LightbulbIcon, SparklesIcon, ChevronLeftIcon, GaugeIcon, 
    HeartIcon, GithubIcon, FileTextIcon, GlobeIcon, SettingsIcon, 
    DatabaseIcon, AlertTriangleIcon, MapIcon, HomeIcon, EyeIcon 
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
    
    // We now use glassClass directly for the floating menu to match the BottomNav/Header perfectly
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

    const desktopLayoutOptions: { id: DesktopLayout, label: string }[] = [
        { id: '25-75', label: '25/75 (Mapa)' },
        { id: '40-60', label: '40/60 (Padrão)' },
        { id: '50-50', label: '50/50 (Dividido)' }
    ];

    // Estilos Utilitários Refinados para "Deep Dark"
    const selectStyle = `w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 focus:ring-2 outline-none ${classes.ring} appearance-none cursor-pointer hover:bg-white/5 transition-colors ${density.text}`;
    const inputStyle = `w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 focus:ring-2 outline-none ${classes.ring} placeholder-gray-500 transition-colors ${density.text}`;
    const disabledSectionStyle = isPerformanceMode ? 'opacity-50 pointer-events-none filter grayscale' : '';
    const optionClass = "bg-slate-900 text-white py-2"; // Garante que o menu dropdown não seja branco

    // Floating Menu Style Logic
    const floatingMenuClass = glassClass;

    const ToggleSwitch = ({ checked, onChange, disabled = false, activeColorClass }: { checked: boolean, onChange: () => void, disabled?: boolean, activeColorClass?: string }) => (
        <button 
            onClick={onChange}
            disabled={disabled}
            className={`relative w-12 h-7 rounded-full transition-all duration-300 ease-in-out focus:outline-none flex-shrink-0 active:scale-95 ${checked ? (activeColorClass || classes.bg) + ` shadow-[0_0_10px_rgba(0,0,0,0.3)]` : 'bg-gray-700'} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:brightness-110'}`}
            aria-pressed={checked}
        >
            <span 
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transform transition-all duration-300 ease-in-out ${checked ? 'left-6' : 'left-1'}`} 
            />
        </button>
    );

    const TabButton = ({ id, label, icon }: { id: SettingsTab, label: string, icon: React.ReactNode }) => {
        const isActive = activeTab === id;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 font-medium text-sm flex-shrink-0 relative overflow-hidden group active:scale-95
                    ${isActive 
                        ? `${classes.bg} text-white shadow-lg` 
                        : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
            >
                <div className="relative z-10 flex items-center gap-2">
                    {icon}
                    <span className="whitespace-nowrap">{label}</span>
                </div>
            </button>
        );
    };

    // --- SEÇÕES DE CONTEÚDO ---

    const renderGeneral = () => (
        <div className={`space-y-6 animate-enter`}>
            {/* MODO DESEMPENHO (Pinned) */}
            <section 
                className={`${cardClass} rounded-3xl ${density.padding} relative overflow-hidden border-l-4 transition-transform hover:scale-[1.005]`}
                style={{ borderLeftColor: classes.hex }}
            >
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`${classes.bg}/20 p-3 rounded-full`}>
                             <GaugeIcon className={`w-6 h-6 ${classes.text}`} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-white font-bold text-lg">Modo Desempenho</span>
                            <span className={`text-xs ${density.subtext} text-gray-400`}>Prioriza velocidade sobre efeitos visuais.</span>
                        </div>
                    </div>
                    <ToggleSwitch checked={settings.performanceMode} onChange={() => handleSave({ performanceMode: !settings.performanceMode })} activeColorClass={classes.bg} />
                </div>
            </section>

            {/* INICIALIZAÇÃO */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}>
                    <HomeIcon className="w-5 h-5" /> Inicialização
                </h3>
                <div className={density.settingsGap}>
                    <div className="flex flex-col gap-2">
                        <label className={`${density.text} text-sm font-medium text-gray-300`}>Comportamento ao abrir</label>
                        <select 
                            value={settings.startupBehavior}
                            onChange={(e) => {
                                const val = e.target.value as any;
                                handleSave({ startupBehavior: val });
                                if (val === 'specific_location') onOpenCitySelection();
                            }}
                            className={selectStyle}
                        >
                            <option value="idle" className={optionClass}>Tela Inicial (Boas-vindas)</option>
                            <option value="last_location" className={optionClass}>Carregar Última Localização</option>
                            <option value="specific_location" className={optionClass}>Carregar Localização Específica</option>
                            <option value="custom_section" className={optionClass}>Abrir em uma Seção (ex: Chat)</option>
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
                                <option value="weather" className={optionClass}>Clima</option>
                                <option value="ai" className={optionClass}>IA / Chat</option>
                                <option value="map" className={optionClass}>Mapa</option>
                                <option value="news" className={optionClass}>Notícias</option>
                                <option value="tips" className={optionClass}>Dicas</option>
                                <option value="info" className={optionClass}>Informações</option>
                            </select>
                         </div>
                    )}

                    {settings.startupBehavior === 'specific_location' && (
                        <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                            <div>
                                <p className="text-sm text-gray-400">Local Definido:</p>
                                <p className="font-bold text-white text-lg">
                                    {settings.specificLocation ? `${settings.specificLocation.name}, ${settings.specificLocation.country}` : 'Nenhum selecionado'}
                                </p>
                            </div>
                            <button onClick={onOpenCitySelection} className={`${classes.text} text-sm hover:underline font-medium active:scale-95 transition-transform`}>
                                Alterar
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* SISTEMA E INTERFACE */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}>
                    <SettingsIcon className="w-5 h-5" /> Sistema & Interface
                </h3>
                <div className={density.settingsGap}>
                    <div className="flex items-center justify-between">
                        <span className={`${density.text} text-white font-medium`}>Modo Tela Cheia</span>
                        <button 
                            onClick={toggleFullscreen}
                            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 ${isFullscreen ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'}`}
                        >
                            {isFullscreen ? 'Sair' : 'Ativar'}
                        </button>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Iniciar em tela cheia</span>
                            <span className="text-xs text-gray-400">Entrar automaticamente ao abrir.</span>
                        </div>
                        <ToggleSwitch checked={settings.startFullscreen} onChange={() => handleSave({ startFullscreen: !settings.startFullscreen })} activeColorClass={classes.bg} />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Relógio no Topo</span>
                            <span className="text-xs text-gray-400">Exibe o horário no cabeçalho.</span>
                        </div>
                        <ToggleSwitch checked={settings.showClock} onChange={() => handleSave({ showClock: !settings.showClock })} activeColorClass={classes.bg} />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Barras de Rolagem</span>
                            <span className="text-xs text-gray-400">Mostrar scrollbars nativos.</span>
                        </div>
                        <ToggleSwitch checked={settings.showScrollbars} onChange={() => handleSave({ showScrollbars: !settings.showScrollbars })} activeColorClass={classes.bg} />
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                        <label className={`${density.text} text-sm font-medium text-gray-300`}>Horário Local da Cidade (Card)</label>
                        <select 
                            value={settings.clockDisplayMode}
                            onChange={(e) => handleSave({ clockDisplayMode: e.target.value as ClockDisplayMode })}
                            className={selectStyle}
                        >
                            <option value="always" className={optionClass}>Sempre mostrar</option>
                            <option value="different_zone" className={optionClass}>Apenas se o fuso for diferente</option>
                            <option value="never" className={optionClass}>Nunca mostrar</option>
                        </select>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderVisual = () => (
        <div className={`space-y-6 animate-enter`}>
            {/* TEMAS E CORES */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}>
                    <EyeIcon className="w-5 h-5" /> Cores e Tema
                </h3>
                <div className={density.settingsGap}>
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex flex-col gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Tema Dinâmico</span>
                            <span className="text-xs text-gray-400">Muda a cor com base no clima atual.</span>
                        </div>
                        <ToggleSwitch checked={settings.dynamicTheme} onChange={() => handleSave({ dynamicTheme: !settings.dynamicTheme })} activeColorClass={classes.bg} />
                    </div>

                    <div className={`transition-opacity duration-300 ${settings.dynamicTheme ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <label className={`${density.text} font-medium text-gray-300 mb-3 block`}>Cor Principal</label>
                        <div className={`flex flex-wrap ${density.itemGap}`}>
                            {themes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => handleSave({ themeColor: theme.id })}
                                    disabled={settings.dynamicTheme}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${theme.color} transition-transform active:scale-95 focus:outline-none ring-2 ring-offset-2 ring-offset-transparent ${settings.themeColor === theme.id ? `ring-white scale-110 shadow-lg` : 'ring-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                                    title={theme.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* WEATHER INSIGHTS */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                 <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Resumo do Clima (Insights)</h3>
                 <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col gap-0.5">
                        <span className={`${density.text} text-white font-medium`}>Habilitar Resumos</span>
                        <span className="text-xs text-gray-400">Destaques e recomendações no topo da tela.</span>
                    </div>
                    <ToggleSwitch 
                        checked={settings.weatherInsights.enabled}
                        onChange={() => handleSave({ weatherInsights: { ...settings.weatherInsights, enabled: !settings.weatherInsights.enabled } })}
                        activeColorClass={classes.bg}
                    />
                </div>
                {settings.weatherInsights.enabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 pl-4 border-l-2 border-gray-700">
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Estilo Visual</label>
                            <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5">
                                <button onClick={() => handleSave({ weatherInsights: { ...settings.weatherInsights, style: 'container' } })} className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${settings.weatherInsights.style === 'container' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Caixa</button>
                                <button onClick={() => handleSave({ weatherInsights: { ...settings.weatherInsights, style: 'clean' } })} className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${settings.weatherInsights.style === 'clean' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Limpo</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1">Conteúdo</label>
                            <select 
                                value={settings.weatherInsights.content}
                                onChange={(e) => handleSave({ weatherInsights: { ...settings.weatherInsights, content: e.target.value as any } })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 outline-none"
                            >
                                <option value="both" className={optionClass}>Ambos</option>
                                <option value="highlight" className={optionClass}>Apenas Destaque</option>
                                <option value="recommendation" className={optionClass}>Apenas Recomendação</option>
                            </select>
                        </div>
                    </div>
                )}
            </section>

            {/* EFEITOS AVANÇADOS */}
            <section className={`${cardClass} rounded-3xl ${density.padding} ${disabledSectionStyle}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Efeitos e Layout</h3>
                <div className={density.settingsGap}>
                    {/* Background & Border */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Estilo do Fundo</label>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {backgroundOptions.map((opt) => (
                                    <button key={opt.id} onClick={() => handleSave({ backgroundMode: opt.id })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${settings.backgroundMode === opt.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Borda LED</label>
                            <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {borderEffectOptions.map((opt) => (
                                    <button key={opt.id} onClick={() => handleSave({ borderEffect: opt.id })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${settings.borderEffect === opt.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Transparência */}
                    <div className="pt-4 border-t border-white/5">
                         <div className="flex flex-col mb-2 gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Transparência (Efeito Vidro)</span>
                        </div>
                        <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                            {transparencyOptions.map((opt) => (
                                <button key={opt.id} onClick={() => handleSave({ transparencyMode: opt.id })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${settings.transparencyMode === opt.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>{opt.label}</button>
                            ))}
                        </div>
                        {settings.transparencyMode === 'glass' && (
                            <div className="mt-3 bg-black/20 rounded-xl p-4 border border-white/5">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Aplicar em:</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center"><span className="text-xs text-gray-300">Cabeçalho</span><ToggleSwitch checked={settings.glassScope.header} onChange={() => handleSave({ glassScope: { ...settings.glassScope, header: !settings.glassScope.header } })} activeColorClass={classes.bg} /></div>
                                    <div className="flex justify-between items-center"><span className="text-xs text-gray-300">Cartões</span><ToggleSwitch checked={settings.glassScope.cards} onChange={() => handleSave({ glassScope: { ...settings.glassScope, cards: !settings.glassScope.cards } })} activeColorClass={classes.bg} /></div>
                                    <div className="flex justify-between items-center"><span className="text-xs text-gray-300">Overlays</span><ToggleSwitch checked={settings.glassScope.overlays} onChange={() => handleSave({ glassScope: { ...settings.glassScope, overlays: !settings.glassScope.overlays } })} activeColorClass={classes.bg} /></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Layout & Mapa */}
                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <div>
                             <label className={`${density.text} text-sm font-medium text-gray-300 mb-2 block`}>Densidade da Interface</label>
                             <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {densityOptions.map((opt) => (
                                    <button key={opt.id} onClick={() => handleSave({ layoutDensity: opt.id })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${settings.layoutDensity === opt.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                         <div>
                             <label className={`${density.text} text-sm font-medium text-gray-300 mb-2 block`}>Tema do Mapa</label>
                             <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {mapThemeOptions.map((opt) => (
                                    <button key={opt.id} onClick={() => handleSave({ mapTheme: opt.id })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${settings.mapTheme === opt.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="hidden lg:block">
                             <label className={`${density.text} text-sm font-medium text-gray-300 mb-2 block`}>Layout Desktop (Proporção)</label>
                             <div className="flex bg-black/20 rounded-xl p-1 border border-white/5">
                                {desktopLayoutOptions.map((opt) => (
                                    <button key={opt.id} onClick={() => handleSave({ desktopLayout: opt.id })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${settings.desktopLayout === opt.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Rain & Motion */}
                    <div className="pt-4 border-t border-white/5 space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className={`${density.text} text-white font-medium`}>Animação de Chuva</span>
                            </div>
                            <ToggleSwitch checked={settings.rainAnimation.enabled} onChange={() => handleSave({ rainAnimation: { ...settings.rainAnimation, enabled: !settings.rainAnimation.enabled } })} activeColorClass={classes.bg} />
                        </div>
                        {settings.rainAnimation.enabled && (
                             <div className="flex items-center justify-between pl-4 border-l-2 border-gray-700">
                                <span className="text-xs text-gray-400">Intensidade</span>
                                <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/5">
                                    <button onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, intensity: 'low' } })} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${settings.rainAnimation.intensity === 'low' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Leve</button>
                                    <button onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, intensity: 'high' } })} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${settings.rainAnimation.intensity === 'high' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Forte</button>
                                </div>
                            </div>
                        )}
                         <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className={`${density.text} text-white font-medium`}>Reduzir Movimento</span>
                                <span className="text-xs text-gray-400">Desativa transições.</span>
                            </div>
                            <ToggleSwitch checked={settings.reducedMotion} onChange={() => handleSave({ reducedMotion: !settings.reducedMotion })} activeColorClass={classes.bg} />
                        </div>
                    </div>

                </div>
            </section>
        </div>
    );

    const renderAi = () => (
        <div className={`space-y-6 animate-enter`}>
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}>
                    <SparklesIcon className="w-5 h-5" /> Perfil da IA
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
                         <span className="text-xs text-gray-400 mb-1">Ex: "Responda em rimas", "Seja formal". A IA tentará seguir.</span>
                         <textarea 
                            value={settings.userAiInstructions || ''}
                            onChange={(e) => handleSave({ userAiInstructions: e.target.value })}
                            placeholder="Digite suas preferências..."
                            className={`${inputStyle} min-h-[100px] resize-none`}
                            maxLength={200}
                         />
                         
                         {/* CLÁUSULA DE SEGURANÇA (Solicitada) */}
                         <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mt-2 flex items-start gap-3 backdrop-blur-sm">
                            <AlertTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <strong className="text-yellow-400 text-sm block">Política de Segurança & Diretrizes Éticas</strong> 
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    O Meteor utiliza IA generativa avançada. Para garantir a segurança de todos:
                                </p>
                                <ul className="list-disc list-inside text-xs text-gray-400 leading-relaxed pl-1">
                                    <li>Prompts maliciosos, ofensivos ou ilegais serão bloqueados.</li>
                                    <li>Tentativas de contornar filtros de segurança (jailbreak) são proibidas.</li>
                                    <li>A IA priorizará sempre respostas seguras e úteis.</li>
                                </ul>
                            </div>
                         </div>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderData = () => (
        <div className={`space-y-6 animate-enter`}>
             <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4 flex items-center gap-2`}>
                    <DatabaseIcon className="w-5 h-5" /> Gerenciamento
                </h3>
                <div className={density.settingsGap}>
                    <div className="flex flex-col gap-2">
                        <label className={`${density.text} text-sm font-medium text-gray-300`}>Fonte Preferida</label>
                        <select 
                            value={settings.weatherSource}
                            onChange={(e) => handleSave({ weatherSource: e.target.value as DataSource | 'auto' })}
                            className={selectStyle}
                        >
                            <option value="auto" className={optionClass}>Automático (Recomendado)</option>
                            <option value="onecall" className={optionClass}>OpenWeather (OneCall/Pro)</option>
                            <option value="free" className={optionClass}>OpenWeather (Padrão/Gratuito)</option>
                            <option value="open-meteo" className={optionClass}>Open-Meteo (Open Source)</option>
                        </select>
                    </div>

                     <div className="flex items-center justify-between pb-6 border-b border-white/5 pt-4">
                        <div className="flex flex-col gap-0.5">
                            <span className={`${density.text} text-white font-medium`}>Salvar Histórico de Chat</span>
                            <span className="text-xs text-gray-400">Mantém conversas no dispositivo.</span>
                        </div>
                        <ToggleSwitch 
                            checked={settings.saveChatHistory}
                            onChange={() => handleSave({ saveChatHistory: !settings.saveChatHistory })}
                            activeColorClass={classes.bg}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={handleExport} className="bg-black/20 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-medium transition-all active:scale-95 hover:shadow-lg flex items-center justify-center gap-2 text-sm">
                            Exportar Dados
                        </button>
                        <button onClick={onOpenImport} className="bg-black/20 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl font-medium transition-all active:scale-95 hover:shadow-lg flex items-center justify-center gap-2 text-sm">
                            Importar Dados
                        </button>
                    </div>

                    <div className="border-t border-white/5 pt-6 space-y-4">
                        <h4 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            Zona de Perigo
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button onClick={() => handleReset('settings')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-all active:scale-95">
                                Resetar Ajustes
                            </button>
                            <button onClick={() => handleReset('cache')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-all active:scale-95">
                                Limpar Cache
                            </button>
                            <button onClick={() => handleReset('history')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-3 rounded-xl text-sm transition-all active:scale-95">
                                Limpar Histórico IA
                            </button>
                            <button onClick={() => handleReset('all')} className="bg-red-500/80 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-red-900/20 border border-red-400/50">
                                Resetar Tudo
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );

    const renderAbout = () => (
        <div className={`space-y-6 animate-enter`}>
            {/* PIX DONATION - FORCE THEME BORDER COLOR */}
            <section 
                className={`${cardClass} rounded-3xl ${density.padding} border-l-4 relative overflow-hidden transition-transform hover:scale-[1.005]`}
                style={{ borderLeftColor: classes.hex }}
            >
                <div className="relative z-10">
                    <h3 className={`text-lg font-bold text-white mb-2 flex items-center gap-2`}>
                        <HeartIcon className={`w-5 h-5 ${classes.text} fill-current animate-pulse`} />
                        Apoie o Projeto
                    </h3>
                    <p className="text-sm text-gray-300 max-w-lg leading-relaxed mb-4">
                        O Meteor é um projeto independente. Considere fazer uma doação via Pix para ajudar a manter os servidores e o desenvolvimento.
                    </p>

                    <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-4 flex flex-col gap-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Chave Pix (Aleatória)</p>
                        <code className={`font-mono ${classes.text} text-sm break-all select-all`}>8001be0f-4952-4ef8-b2a5-9bafe691c65c</code>
                    </div>

                    <button
                        onClick={handleCopyPix}
                        className={`w-full font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 group ${pixCopied ? `${classes.bg} text-white` : `${classes.bg}/10 ${classes.text} border ${classes.borderFaded} hover:${classes.bg} hover:text-white`}`}
                    >
                        {pixCopied ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>Chave Copiada!</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2-2v1"></path></svg>
                                <span>Copiar Chave Pix</span>
                            </>
                        )}
                    </button>
                </div>
                <div className={`absolute top-0 right-0 w-32 h-32 ${classes.bg}/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 pointer-events-none`}></div>
            </section>

            {/* LINKS */}
            <section className={`${cardClass} rounded-3xl ${density.padding}`}>
                <h3 className={`text-lg font-bold ${classes.text} mb-4`}>Links Úteis</h3>
                <div className="grid grid-cols-1 gap-3">
                    <a href="https://policies-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition-all active:scale-95 group hover:shadow-lg">
                        <div className={`p-2 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-gray-700 transition-colors`}>
                            <FileTextIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">Política de Privacidade</h4>
                            <p className="text-xs text-gray-400">Termos de uso e dados</p>
                        </div>
                        <ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" />
                    </a>
                    <a href="https://sobre-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition-all active:scale-95 group hover:shadow-lg">
                        <div className={`p-2 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-gray-700 transition-colors`}>
                            <GlobeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">Sobre o Projeto</h4>
                            <p className="text-xs text-gray-400">História e missão</p>
                        </div>
                         <ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" />
                    </a>
                    <a href="https://github.com/elias001011/Meteor" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition-all active:scale-95 group hover:shadow-lg">
                        <div className={`p-2 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white group-hover:bg-gray-700 transition-colors`}>
                            <GithubIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">GitHub</h4>
                            <p className="text-xs text-gray-400">Código fonte aberto</p>
                        </div>
                         <ChevronLeftIcon className="w-4 h-4 text-gray-500 rotate-180" />
                    </a>
                </div>
            </section>

             {/* FOOTER BUTTON */}
             <div className="pt-2">
                <button 
                    onClick={onOpenChangelog}
                    className={`w-full group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900/60 hover:bg-gray-900/80 transition-all duration-300 p-4 text-left flex items-center justify-between hover:shadow-lg hover:border-${classes.text.split('-')[1]}-500/30 active:scale-95`}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={`p-3 rounded-full bg-gradient-to-br ${classes.gradient} shadow-lg`}>
                            <SparklesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Meteor App</p>
                            <p className="text-white font-bold">Versão 3.3.0</p>
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

    return (
        <div className={`p-4 sm:p-6 max-w-3xl mx-auto ${density.settingsGap} pb-32`}>
            {/* Título */}
            <h2 className={`text-2xl font-bold text-white flex items-center gap-3 tracking-tight`}>
                Ajustes
            </h2>

            {/* HEADER ALERTS & GLOBAL CONTROLS */}
            <div className="space-y-4">
                {showPwaBanner && !window.matchMedia('(display-mode: standalone)').matches && (
                    <div className={`relative overflow-hidden backdrop-blur-md border ${classes.borderFaded} ${density.padding} bg-gray-900/60 rounded-3xl flex items-start justify-between gap-4 shadow-lg group transition-transform hover:scale-[1.01]`}>
                        <div className={`absolute inset-0 bg-gradient-to-r ${classes.gradient} opacity-10 pointer-events-none`}></div>
                        <div className="flex gap-4 relative z-10">
                            <div className={`p-3 rounded-full h-fit ${classes.bg}/20 shadow-inner`}>
                                <LightbulbIcon className={`w-6 h-6 ${classes.text}`} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-lg">Instale o Meteor</h4>
                                <p className="text-sm text-gray-200 mt-1 leading-relaxed">
                                    Instale como App para melhor experiência.
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowPwaBanner(false)} className="text-gray-400 hover:text-white transition-colors p-1 relative z-10 active:scale-90"><XIcon className="w-5 h-5" /></button>
                    </div>
                )}

                {feedbackMessage && (
                    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] bg-emerald-600/90 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium shadow-xl border border-emerald-400/50 text-center whitespace-nowrap animate-enter-pop">
                        {feedbackMessage}
                    </div>
                )}
            </div>

            {/* --- TAB NAVIGATION (FLUTUANTE & TEMÁTICO) --- */}
            <div className="sticky top-4 z-30 mb-8 flex justify-center">
                 <div className={`${floatingMenuClass} rounded-full p-1.5 shadow-2xl flex gap-1 overflow-x-auto max-w-full scrollbar-hide`}>
                    <TabButton id="general" label="Geral" icon={<SettingsIcon className="w-4 h-4" />} />
                    <TabButton id="visual" label="Visual" icon={<EyeIcon className="w-4 h-4" />} />
                    <TabButton id="ai" label="IA" icon={<SparklesIcon className="w-4 h-4" />} />
                    <TabButton id="data" label="Dados" icon={<DatabaseIcon className="w-4 h-4" />} />
                    <TabButton id="about" label="Sobre" icon={<HeartIcon className="w-4 h-4" />} />
                </div>
            </div>

            {/* --- ACTIVE TAB CONTENT --- */}
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