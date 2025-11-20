
import React, { useState } from 'react';
import type { AppSettings, AppTheme } from '../../types';
import { getSettings, saveSettings, exportAppData, importAppData, resetSettings, resetCache, resetAllData } from '../../services/settingsService';
import CitySelectionModal from '../common/CitySelectionModal';
import ImportModal from './ImportModal';
import { useTheme } from '../context/ThemeContext';
import { SettingsIcon, RobotIcon, EyeIcon, DatabaseIcon, AlertTriangleIcon } from '../icons';

interface SettingsViewProps {
    settings: AppSettings;
    onSettingsChanged: (newSettings: AppSettings) => void;
    onClearHistory: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChanged, onClearHistory }) => {
    const [showCityModal, setShowCityModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const { classes } = useTheme();
    const [activeTab, setActiveTab] = useState<'ai' | 'visual' | 'data'>('ai');

    const handleSave = (updatedSettings: Partial<AppSettings>) => {
        const newSettings = { ...settings, ...updatedSettings };
        onSettingsChanged(newSettings);
    };

    const handleReset = (type: 'settings' | 'cache' | 'history' | 'all') => {
        if (!confirm("Tem certeza? Esta ação não pode ser desfeita.")) return;
        
        switch (type) {
            case 'settings': 
                resetSettings(); 
                onSettingsChanged(getSettings()); 
                setFeedbackMessage("Configurações restauradas."); 
                break;
            case 'cache': 
                resetCache(); 
                setFeedbackMessage("Cache do clima limpo."); 
                break;
            case 'history': 
                onClearHistory(); 
                setFeedbackMessage("Memória da IA apagada."); 
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
            setFeedbackMessage("Erro ao exportar dados.");
        }
    };

    const handleImport = (content: string, options: any) => {
        if (importAppData(content, options)) {
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

    const TabButton = ({ id, label }: { id: 'ai' | 'visual' | 'data', label: string }) => (
        <button 
            onClick={() => setActiveTab(id)} 
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === id 
                ? `${classes.bg} text-white shadow-lg shadow-black/20` 
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6 pb-32 animate-fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <SettingsIcon className={`w-7 h-7 ${classes.text}`} /> Ajustes
                </h2>
                <span className="px-2 py-1 rounded border border-gray-700 bg-gray-800 text-[10px] font-mono text-gray-400">v3.0</span>
            </div>

            {feedbackMessage && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 ${classes.bg} text-white px-6 py-3 rounded-full font-medium shadow-xl animate-fade-in-down flex items-center gap-2`}>
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"/> {feedbackMessage}
                </div>
            )}

            {/* Styled Tabs */}
            <div className="p-1.5 bg-gray-900/80 rounded-xl border border-gray-700/50 flex gap-1">
                <TabButton id="ai" label="IA & Chat" />
                <TabButton id="visual" label="Visual" />
                <TabButton id="data" label="Sistema" />
            </div>

            {/* --- AI TAB --- */}
            {activeTab === 'ai' && (
             <section className="space-y-6 animate-fade-in">
                 <div className={`bg-gray-800/50 rounded-2xl p-6 border ${classes.borderFaded}`}>
                    <h3 className={`text-lg font-semibold text-white mb-5 flex items-center gap-2`}>
                        <RobotIcon className={`w-5 h-5 ${classes.text}`}/> Identidade e Memória
                    </h3>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300 font-medium">Como devo te chamar?</label>
                            <input 
                                type="text" 
                                value={settings.userName || ''}
                                onChange={(e) => handleSave({ userName: e.target.value })}
                                placeholder="Ex: Elias"
                                className={`w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 outline-none transition-all ${classes.ring}`}
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm text-gray-300 font-medium">Instruções Personalizadas</label>
                            <p className="text-xs text-gray-500">Defina a personalidade ou regras para a IA (ex: "Seja breve", "Responda com rimas").</p>
                            <textarea 
                                value={settings.aiInstructions || ''}
                                onChange={(e) => handleSave({ aiInstructions: e.target.value })}
                                placeholder="Instruções do sistema..."
                                rows={3}
                                className={`w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 outline-none transition-all ${classes.ring} resize-none`}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-700/30">
                            <div>
                                <span className="text-gray-300 font-medium block">Salvar Histórico de Chat</span>
                                <span className="text-xs text-gray-500">Permite continuar conversas anteriores ao reabrir o app.</span>
                            </div>
                            <button 
                                onClick={() => handleSave({ saveChatHistory: !settings.saveChatHistory })} 
                                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${settings.saveChatHistory ? classes.bg : 'bg-gray-700'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.saveChatHistory ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* --- VISUAL TAB --- */}
            {activeTab === 'visual' && (
             <section className="space-y-6 animate-fade-in">
                <div className={`bg-gray-800/50 rounded-2xl p-6 border ${classes.borderFaded}`}>
                    <h3 className={`text-lg font-semibold text-white mb-5 flex items-center gap-2`}>
                        <EyeIcon className={`w-5 h-5 ${classes.text}`}/> Personalização
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-700/30">
                            <div className="flex flex-col">
                                <span className="text-gray-300 font-medium">Tema Dinâmico</span>
                                <span className="text-xs text-gray-500">Adapta as cores com base no clima atual.</span>
                            </div>
                            <button 
                                onClick={() => handleSave({ dynamicTheme: !settings.dynamicTheme })} 
                                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${settings.dynamicTheme ? classes.bg : 'bg-gray-700'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.dynamicTheme ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className={`transition-all duration-300 ${settings.dynamicTheme ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                            <label className="text-sm text-gray-300 mb-3 block font-medium">Cor do Tema (Manual)</label>
                            <div className="flex flex-wrap gap-4">
                                {themes.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => handleSave({ themeColor: theme.id })}
                                        disabled={settings.dynamicTheme}
                                        className={`w-12 h-12 rounded-full ${theme.color} transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-gray-800 ${settings.themeColor === theme.id ? `ring-white scale-110 shadow-lg` : 'ring-transparent opacity-70 hover:opacity-100'}`}
                                        aria-label={`Selecionar tema ${theme.name}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-5 pt-2">
                             <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-gray-300 font-medium block">Efeito Glass (Transparência)</span>
                                    <span className="text-xs text-gray-500">Nível de desfoque e transparência dos painéis.</span>
                                </div>
                                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700/50">
                                    {[{id:'off', l:'Off'}, {id:'low', l:'Min'}, {id:'glass', l:'Max'}].map((o) => (
                                        <button 
                                            key={o.id} 
                                            onClick={() => handleSave({ transparencyMode: o.id as any })} 
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${settings.transparencyMode === o.id ? `bg-gray-700 text-white shadow border border-gray-600` : 'text-gray-500 hover:text-white'}`}
                                        >
                                            {o.l}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-gray-300 font-medium block">Animação de Chuva</span>
                                    <span className="text-xs text-gray-500">Mostra gotas caindo na tela.</span>
                                </div>
                                <button 
                                    onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, enabled: !settings.rainAnimation.enabled } })} 
                                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${settings.rainAnimation.enabled ? classes.bg : 'bg-gray-700'}`}
                                >
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.rainAnimation.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* --- DATA/SYSTEM TAB --- */}
            {activeTab === 'data' && (
            <section className="space-y-6 animate-fade-in">
                <div className={`bg-gray-800/50 rounded-2xl p-6 border ${classes.borderFaded}`}>
                    <h3 className={`text-lg font-semibold text-white mb-5 flex items-center gap-2`}>
                        <DatabaseIcon className={`w-5 h-5 ${classes.text}`}/> Dados e Inicialização
                    </h3>
                    <div className="space-y-6">
                         <div className="flex flex-col gap-2">
                            <span className="text-gray-300 text-sm font-medium">Comportamento ao iniciar:</span>
                            <select 
                                value={settings.startupBehavior} 
                                onChange={(e) => handleSave({ startupBehavior: e.target.value as any })} 
                                className={`bg-gray-900 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white outline-none focus:ring-2 ${classes.ring}`}
                            >
                                <option value="idle">Mostrar tela de boas-vindas</option>
                                <option value="last_location">Carregar última localização</option>
                                <option value="specific_location">Carregar cidade fixa...</option>
                                <option value="custom_section">Ir direto para uma seção...</option>
                            </select>

                            {settings.startupBehavior === 'specific_location' && (
                                <button onClick={() => setShowCityModal(true)} className={`mt-1 text-xs hover:underline text-left font-medium ml-1 ${classes.text}`}>
                                    📍 {settings.specificLocation ? `${settings.specificLocation.name}, ${settings.specificLocation.country}` : 'Selecionar cidade padrão'}
                                </button>
                            )}

                             {settings.startupBehavior === 'custom_section' && (
                                <select 
                                    value={settings.startupSection || 'weather'} 
                                    onChange={(e) => handleSave({ startupSection: e.target.value as any })} 
                                    className={`mt-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-300 outline-none focus:border-gray-500`}
                                >
                                    <option value="weather">Previsão do Tempo</option>
                                    <option value="map">Mapa</option>
                                    <option value="ai">Assistente IA</option>
                                    <option value="news">Notícias</option>
                                </select>
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-700/30">
                             <div className="flex flex-col gap-2">
                                <span className="text-gray-300 text-sm font-medium">Fonte de Dados Principal</span>
                                <select 
                                    value={settings.weatherSource} 
                                    onChange={(e) => handleSave({ weatherSource: e.target.value as any })} 
                                    className={`bg-gray-900 border border-gray-700 rounded-xl px-3 py-3 text-sm text-white outline-none focus:ring-2 ${classes.ring}`}
                                >
                                    <option value="auto">Automático (Inteligente)</option>
                                    <option value="onecall">OpenWeather OneCall (Premium)</option>
                                    <option value="free">OpenWeather Standard (Gratuito)</option>
                                    <option value="open-meteo">Open-Meteo (Open Source)</option>
                                </select>
                                <p className="text-[10px] text-gray-500 ml-1">O sistema usa fallbacks automáticos caso a fonte principal falhe.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <button onClick={handleExport} className="bg-gray-900 hover:bg-gray-800 text-gray-300 py-3 rounded-xl text-sm transition-colors font-medium border border-gray-700 flex items-center justify-center gap-2">
                                ⬇ Exportar Backup
                            </button>
                            <button onClick={() => setShowImportModal(true)} className="bg-gray-900 hover:bg-gray-800 text-gray-300 py-3 rounded-xl text-sm transition-colors font-medium border border-gray-700 flex items-center justify-center gap-2">
                                ⬆ Restaurar Backup
                            </button>
                        </div>
                        
                        <div className="pt-6 mt-4 border-t border-red-500/20">
                             <h4 className="text-red-400 text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                                <AlertTriangleIcon className="w-4 h-4"/> Zona de Perigo
                             </h4>
                             <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button onClick={() => handleReset('settings')} className="text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-lg py-3 text-xs transition-colors">Resetar Ajustes</button>
                                    <button onClick={() => handleReset('cache')} className="text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-lg py-3 text-xs transition-colors">Limpar Cache Clima</button>
                                    <button onClick={() => handleReset('history')} className="text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-lg py-3 text-xs transition-colors">Apagar Memória IA</button>
                                    <button onClick={() => handleReset('all')} className="text-white bg-red-600/90 hover:bg-red-500 rounded-lg py-3 text-xs transition-colors font-bold shadow-lg shadow-red-900/20 sm:col-span-1">
                                        FORMATAR TUDO
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 text-center pt-2">
                                    A formatação apaga todas as preferências, históricos e caches locais.<br/>
                                    <span className="text-gray-400 font-semibold">Nota:</span> O limite diário de uso da IA não será resetado.
                                </p>
                             </div>
                        </div>
                    </div>
                </div>
            </section>
            )}
            
            {/* Footer / Credits */}
            <div className="mt-12 pt-6 border-t border-gray-800/50 text-center text-gray-600">
                <div className="flex justify-center items-center gap-2 mb-3 opacity-30">
                    <span className={`h-1.5 w-1.5 rounded-full ${classes.bg}`}></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-600"></span>
                    <span className={`h-1.5 w-1.5 rounded-full ${classes.bg}`}></span>
                </div>
                <p className="text-xs font-mono text-gray-500 mb-1">Meteor v3.0 (Stable Release)</p>
                <p className="text-xs text-gray-500">
                    Desenvolvido por <a href="https://instagram.com/elias_jrnunes" target="_blank" rel="noopener noreferrer" className={`${classes.text} hover:underline font-medium transition-colors`}>@elias_jrnunes</a>
                </p>
            </div>

            <CitySelectionModal isOpen={showCityModal} onClose={() => setShowCityModal(false)} onSelect={(city) => { handleSave({ specificLocation: city }); setShowCityModal(false); }} />
            <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImport} />
        </div>
    );
};

export default SettingsView;
