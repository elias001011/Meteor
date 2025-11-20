
import React, { useState, useEffect } from 'react';
import type { AppSettings, View, DataSource, AppTheme, TransparencyMode, ClockDisplayMode } from '../../types';
import { getSettings, saveSettings, exportAppData, importAppData, resetSettings, resetCache, resetAllData } from '../../services/settingsService';
import CitySelectionModal from '../common/CitySelectionModal';
import ImportModal from './ImportModal';
import { useTheme } from '../context/ThemeContext';
import { XIcon, LightbulbIcon, RobotIcon } from '../icons';

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
            document.documentElement.requestFullscreen().catch(err => console.error(err));
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
        <div className="p-6 max-w-3xl mx-auto space-y-8 pb-32">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Ajustes do Meteor
            </h2>

            {showPwaBanner && !window.matchMedia('(display-mode: standalone)').matches && (
                <div className="bg-gradient-to-r from-blue-900/60 to-cyan-900/60 border border-blue-500/30 p-4 rounded-2xl flex items-start justify-between gap-4 shadow-lg">
                    <div className="flex gap-4">
                        <div className="p-2 bg-blue-500/20 rounded-full h-fit text-blue-400"><LightbulbIcon className="w-6 h-6" /></div>
                        <div>
                            <h4 className="font-bold text-white">Instale o Meteor</h4>
                            <p className="text-sm text-gray-300 mt-1">O aplicativo funciona muito melhor quando instalado como PWA.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowPwaBanner(false)} className="text-gray-400 hover:text-white transition-colors p-1"><XIcon className="w-5 h-5" /></button>
                </div>
            )}

            {feedbackMessage && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500/90 backdrop-blur-md text-white px-6 py-3 rounded-full font-medium shadow-xl animate-fade-in-down">
                    {feedbackMessage}
                </div>
            )}

            {/* --- AI PREFERENCES --- */}
             <section className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                <h3 className={`text-lg font-semibold ${classes.text} mb-4 flex items-center gap-2`}>
                    <RobotIcon className="w-5 h-5"/> Preferências da IA
                </h3>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">Como devo te chamar?</label>
                        <input 
                            type="text" 
                            value={settings.userName || ''}
                            onChange={(e) => handleSave({ userName: e.target.value })}
                            placeholder="Ex: Elias, Mestre, Visitante"
                            className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 outline-none ${classes.ring}`}
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm text-gray-300">Instruções Personalizadas</label>
                        <textarea 
                            value={settings.aiInstructions || ''}
                            onChange={(e) => handleSave({ aiInstructions: e.target.value })}
                            placeholder="Ex: Responda sempre com rimas. Seja muito técnico. Use emojis."
                            rows={3}
                            className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 outline-none ${classes.ring} resize-none`}
                        />
                        <p className="text-xs text-gray-500">A IA tentará seguir seu estilo, mantendo a segurança.</p>
                    </div>
                </div>
            </section>

            {/* --- CUSTOMIZATION --- */}
             <section className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                <h3 className={`text-lg font-semibold ${classes.text} mb-4`}>Personalização</h3>
                <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-gray-700/30">
                        <div className="flex flex-col">
                            <span className="text-gray-300">Tema Dinâmico</span>
                            <span className="text-xs text-gray-500">Muda a cor com base no clima.</span>
                        </div>
                        <button onClick={() => handleSave({ dynamicTheme: !settings.dynamicTheme })} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.dynamicTheme ? classes.bg : 'bg-gray-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.dynamicTheme ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <div className={`transition-opacity duration-300 ${settings.dynamicTheme ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
                        <label className="text-sm text-gray-300 mb-3 block">Cor do Tema</label>
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
                     <div className="flex items-center justify-between pt-4 border-t border-gray-700/30">
                            <div className="flex flex-col">
                                <span className="text-gray-300">Transparência</span>
                            </div>
                            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700/50">
                                {[{id:'off', l:'Off'}, {id:'low', l:'On'}, {id:'glass', l:'Vidro'}].map((o) => (
                                    <button key={o.id} onClick={() => handleSave({ transparencyMode: o.id as any })} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${settings.transparencyMode === o.id ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>{o.l}</button>
                                ))}
                            </div>
                        </div>
                </div>
            </section>

            {/* --- GENERAL & DATA --- */}
            <section className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                <h3 className={`text-lg font-semibold ${classes.text} mb-4`}>Dados e Geral</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300">Salvar Histórico de Chat</span>
                        <button onClick={() => handleSave({ saveChatHistory: !settings.saveChatHistory })} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.saveChatHistory ? classes.bg : 'bg-gray-600'}`}>
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.saveChatHistory ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-300">Fonte de Clima</span>
                         <select value={settings.weatherSource} onChange={(e) => handleSave({ weatherSource: e.target.value as any })} className={`bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white outline-none ${classes.ring}`}>
                            <option value="auto">Auto</option>
                            <option value="onecall">OpenWeather</option>
                            <option value="open-meteo">Open-Meteo</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button onClick={handleExport} className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl text-sm transition-colors">Exportar</button>
                        <button onClick={() => setShowImportModal(true)} className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-xl text-sm transition-colors">Importar</button>
                    </div>
                    <div className="pt-4 grid grid-cols-2 gap-3 border-t border-gray-700/30">
                        <button onClick={() => handleReset('cache')} className="text-red-400 text-sm hover:underline">Limpar Cache</button>
                        <button onClick={() => handleReset('history')} className="text-red-400 text-sm hover:underline">Limpar Chat</button>
                        <button onClick={() => handleReset('all')} className="col-span-2 text-center text-red-500 font-bold text-sm border border-red-500/30 rounded-lg py-2 hover:bg-red-500/10">Reset de Fábrica</button>
                    </div>
                </div>
            </section>

            <CitySelectionModal isOpen={showCityModal} onClose={() => setShowCityModal(false)} onSelect={(city) => { handleSave({ specificLocation: city }); setShowCityModal(false); }} />
            <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={handleImport} />
        </div>
    );
};

export default SettingsView;
