

import React, { useState, useEffect } from 'react';
import type { AppSettings, AppTheme, TransparencyMode, ClockDisplayMode } from '../../types';
import { getSettings, saveSettings, exportAppData, importAppData, resetSettings, resetCache, resetAllData } from '../../services/settingsService';
import CitySelectionModal from '../common/CitySelectionModal';
import ImportModal from './ImportModal';
import { useTheme } from '../context/ThemeContext';
import { XIcon, LightbulbIcon, RobotIcon, SettingsIcon, DatabaseIcon, EyeIcon } from '../icons';

interface SettingsViewProps {
    settings: AppSettings;
    onSettingsChanged: (newSettings: AppSettings) => void;
    onClearHistory: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSettingsChanged, onClearHistory }) => {
    const [showCityModal, setShowCityModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
    const [showPwaBanner, setShowPwaBanner] = useState(true);
    const { classes } = useTheme();
    const [activeTab, setActiveTab] = useState<'ai' | 'visual' | 'data'>('ai');

    const handleSave = (updatedSettings: Partial<AppSettings>) => {
        const newSettings = { ...settings, ...updatedSettings };
        onSettingsChanged(newSettings);
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

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6 pb-32">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <SettingsIcon className="w-7 h-7 text-gray-400" /> Ajustes
            </h2>

            {feedbackMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium shadow-xl animate-fade-in-down">
                    {feedbackMessage}
                </div>
            )}

            {/* Tabs */}
            <div className="flex p-1 space-x-1 bg-gray-800/50 rounded-xl">
                <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'ai' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>IA & Chat</button>
                <button onClick={() => setActiveTab('visual')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'visual' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>Visual</button>
                <button onClick={() => setActiveTab('data')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'data' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>Sistema</button>
            </div>

            {/* --- AI TAB --- */}
            {activeTab === 'ai' && (
             <section className="space-y-6 animate-fade-in">
                 <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                    <h3 className={`text-lg font-semibold ${classes.text} mb-4 flex items-center gap-2`}>
                        <RobotIcon className="w-5 h-5"/> Identidade e Memória
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-300">Como devo te chamar?</label>
                            <input 
                                type="text" 
                                value={settings.userName || ''}
                                onChange={(e) => handleSave({ userName: e.target.value })}
                                placeholder="Ex: Elias"
                                className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 outline-none ${classes.ring}`}
                            />
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm text-gray-300">Instruções Personalizadas</label>
                            <textarea 
                                value={settings.aiInstructions || ''}
                                onChange={(e) => handleSave({ aiInstructions: e.target.value })}
                                placeholder="Ex: Responda sempre com rimas."
                                rows={3}
                                className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 outline-none ${classes.ring} resize-none`}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-700/30">
                            <span className="text-gray-300">Salvar Histórico de Chat</span>
                            <button onClick={() => handleSave({ saveChatHistory: !settings.saveChatHistory })} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.saveChatHistory ? classes.bg : 'bg-gray-600'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.saveChatHistory ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                         {settings.saveChatHistory && (
                             <button onClick={() => handleReset('history')} className="text-red-400 text-xs hover:underline w-full text-right">Limpar histórico agora</button>
                         )}
                    </div>
                </div>
            </section>
            )}

            {/* --- VISUAL TAB --- */}
            {activeTab === 'visual' && (
             <section className="space-y-6 animate-fade-in">
                <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                    <h3 className={`text-lg font-semibold ${classes.text} mb-4 flex items-center gap-2`}>
                        <EyeIcon className="w-5 h-5"/> Interface
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-700/30">
                            <div className="flex flex-col">
                                <span className="text-gray-300">Tema Dinâmico</span>
                                <span className="text-xs text-gray-500">Muda a cor com base no clima atual.</span>
                            </div>
                            <button onClick={() => handleSave({ dynamicTheme: !settings.dynamicTheme })} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.dynamicTheme ? classes.bg : 'bg-gray-600'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.dynamicTheme ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        <div className={`transition-opacity duration-300 ${settings.dynamicTheme ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                            <label className="text-sm text-gray-300 mb-3 block">Cor Manual</label>
                            <div className="flex flex-wrap gap-3">
                                {themes.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => handleSave({ themeColor: theme.id })}
                                        disabled={settings.dynamicTheme}
                                        className={`w-10 h-10 rounded-full ${theme.color} transition-transform hover:scale-110 focus:outline-none ring-2 ring-offset-2 ring-offset-gray-800 ${settings.themeColor === theme.id ? `ring-white scale-110` : 'ring-transparent'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                             <div className="flex items-center justify-between">
                                <span className="text-gray-300">Transparência (Glass)</span>
                                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700/50">
                                    {[{id:'off', l:'Off'}, {id:'low', l:'Min'}, {id:'glass', l:'Max'}].map((o) => (
                                        <button key={o.id} onClick={() => handleSave({ transparencyMode: o.id as any })} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${settings.transparencyMode === o.id ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>{o.l}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Relógio no Topo</span>
                                <button onClick={() => handleSave({ showClock: !settings.showClock })} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.showClock ? classes.bg : 'bg-gray-600'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.showClock ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Barra de Rolagem</span>
                                <button onClick={() => handleSave({ showScrollbars: !settings.showScrollbars })} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.showScrollbars ? classes.bg : 'bg-gray-600'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.showScrollbars ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                     <span className="text-gray-300">Animação de Chuva</span>
                                     <span className="text-xs text-gray-500">Pode afetar o desempenho.</span>
                                </div>
                                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700/50">
                                     <button onClick={() => handleSave({ rainAnimation: { ...settings.rainAnimation, enabled: false } })} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${!settings.rainAnimation.enabled ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Off</button>
                                     <button onClick={() => handleSave({ rainAnimation: { enabled: true, intensity: 'low' } })} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${settings.rainAnimation.enabled && settings.rainAnimation.intensity === 'low' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Low</button>
                                     <button onClick={() => handleSave({ rainAnimation: { enabled: true, intensity: 'high' } })} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${settings.rainAnimation.enabled && settings.rainAnimation.intensity === 'high' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>High</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            )}

            {/* --- DATA/SYSTEM TAB --- */}
            {activeTab === 'data' && (
            <section className="space-y-6 animate-fade-in">
                <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                    <h3 className={`text-lg font-semibold ${classes.text} mb-4 flex items-center gap-2`}>
                        <DatabaseIcon className="w-5 h-5"/> Dados e Armazenamento
                    </h3>
                    <div className="space-y-5">
                         <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-gray-300">Fonte de Dados</span>
                                <span className="text-xs text-gray-500">Escolha o provedor do clima.</span>
                            </div>
                             <select value={settings.weatherSource} onChange={(e) => handleSave({ weatherSource: e.target.value as any })} className={`bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white outline-none ${classes.ring}`}>
                                <option value="auto">Auto (Recomendado)</option>
                                <option value="onecall">OpenWeather</option>
                                <option value="open-meteo">Open-Meteo</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                             <div className="flex flex-col">
                                <span className="text-gray-300">Relógio do Card</span>
                                <span className="text-xs text-gray-500">Quando mostrar o horário local do clima.</span>
                            </div>
                             <select value={settings.clockDisplayMode} onChange={(e) => handleSave({ clockDisplayMode: e.target.value as any })} className={`bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white outline-none ${classes.ring}`}>
                                <option value="always">Sempre</option>
                                <option value="different_zone">Fuso Diferente</option>
                                <option value="never">Nunca</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button onClick={handleExport} className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl text-sm transition-colors font-medium">Exportar Backup</button>
                            <button onClick={() => setShowImportModal(true)} className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl text-sm transition-colors font-medium">Importar Backup</button>
                        </div>
                        
                        <div className="pt-4 border-t border-gray-700/30">
                             <h4 className="text-red-400 text-sm font-bold mb-3">Zona de Perigo</h4>
                             <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleReset('cache')} className="text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg py-2 text-xs transition-colors">Limpar Cache</button>
                                <button onClick={() => handleReset('all')} className="text-white bg-red-600 hover:bg-red-500 rounded-lg py-2 text-xs transition-colors font-bold">Reset de Fábrica</button>
                             </div>
                        </div>
                    </div>
                </div>
            </section>
            )}

            <CitySelectionModal isOpen={showCityModal} onClose={() => setShowCityModal(false)} onSelect={(city) => { handleSave({ specificLocation: city }); setShowCityModal(false); }} />
            <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImport} />
        </div>
    );
};

export default SettingsView;