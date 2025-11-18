
import React, { useState, useEffect } from 'react';
import type { AppSettings, View, DataSource } from '../../types';
import { getSettings, saveSettings, exportAppData, importAppData, resetSettings, resetCache, resetAllData } from '../../services/settingsService';
import CitySelectionModal from '../common/CitySelectionModal';
import ImportModal from './ImportModal';

interface SettingsViewProps {
    onSettingsChanged: (newSettings: AppSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onSettingsChanged }) => {
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [showCityModal, setShowCityModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    // Fullscreen state
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    useEffect(() => {
        const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const handleSave = (updatedSettings: Partial<AppSettings>) => {
        const newSettings = { ...settings, ...updatedSettings };
        setSettings(newSettings);
        saveSettings(newSettings);
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
                const def = getSettings();
                setSettings(def);
                onSettingsChanged(def);
                setFeedbackMessage("Configurações resetadas.");
                break;
            case 'cache':
                resetCache();
                setFeedbackMessage("Cache limpo.");
                break;
            case 'history':
                setFeedbackMessage("Histórico da IA limpo (recarregue a página).");
                break;
            case 'all':
                resetAllData();
                window.location.reload();
                break;
        }
        setTimeout(() => setFeedbackMessage(null), 3000);
    };

    const handleImport = (content: string, options: any) => {
        const success = importAppData(content, options);
        if (success) {
            setFeedbackMessage("Dados importados com sucesso! Recarregando...");
            setTimeout(() => window.location.reload(), 1500);
        } else {
            setFeedbackMessage("Falha ao importar arquivo.");
        }
        setShowImportModal(false);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-8 pb-32">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                Ajustes do Meteor
            </h2>

            {feedbackMessage && (
                <div className="bg-green-500/20 text-green-300 p-3 rounded-lg text-center font-medium border border-green-500/50">
                    {feedbackMessage}
                </div>
            )}

            {/* --- GENERAL --- */}
            <section className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Geral</h3>
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-300">Como a IA deve te chamar?</label>
                        <input 
                            type="text" 
                            value={settings.userName}
                            onChange={(e) => handleSave({ userName: e.target.value })}
                            placeholder="Seu nome ou apelido"
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-300">Modo Tela Cheia (Agora)</span>
                            <button 
                                onClick={toggleFullscreen}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isFullscreen ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
                            >
                                {isFullscreen ? 'Sair' : 'Ativar'}
                            </button>
                        </div>
                         <div className="flex items-center justify-between pt-2 border-t border-gray-700/30">
                            <div className="flex flex-col">
                                <span className="text-gray-300">Sempre iniciar em tela cheia</span>
                                <span className="text-xs text-gray-500">Entrará automaticamente ao tocar na tela.</span>
                            </div>
                            <button 
                                onClick={() => handleSave({ startFullscreen: !settings.startFullscreen })}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.startFullscreen ? 'bg-cyan-600' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.startFullscreen ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-gray-300">Exibir Horário</span>
                        <button 
                            onClick={() => handleSave({ showClock: !settings.showClock })}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${settings.showClock ? 'bg-cyan-600' : 'bg-gray-600'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${settings.showClock ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>
                </div>
            </section>

             {/* --- DATA SOURCE --- */}
             <section className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Dados Meteorológicos</h3>
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">Fonte de Dados Preferida</label>
                    <select 
                        value={settings.weatherSource}
                        onChange={(e) => handleSave({ weatherSource: e.target.value as DataSource | 'auto' })}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    >
                        <option value="auto">Automático (Recomendado)</option>
                        <option value="onecall">OpenWeather (OneCall/Pro)</option>
                        <option value="free">OpenWeather (Padrão/Gratuito)</option>
                        <option value="open-meteo">Open-Meteo (Open Source)</option>
                    </select>
                    <p className="text-xs text-gray-500">
                        Define de onde o Meteor deve tentar buscar os dados primeiro. O modo Automático gerencia limites e falhas automaticamente.
                    </p>
                </div>
            </section>

            {/* --- STARTUP --- */}
            <section className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Inicialização</h3>
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-300">Visualização ao abrir o app</label>
                        <select 
                            value={settings.startupBehavior}
                            onChange={(e) => {
                                const val = e.target.value as any;
                                handleSave({ startupBehavior: val });
                                if (val === 'specific_location') setShowCityModal(true);
                            }}
                            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value="idle">Tela Inicial (Boas-vindas)</option>
                            <option value="last_location">Última Localização</option>
                            <option value="specific_location">Localização Específica</option>
                            <option value="custom_section">Seção Personalizada</option>
                        </select>
                    </div>

                    {settings.startupBehavior === 'specific_location' && (
                        <div className="flex items-center justify-between bg-gray-900/50 p-3 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-400">Local Definido:</p>
                                <p className="font-medium text-white">
                                    {settings.specificLocation ? `${settings.specificLocation.name}, ${settings.specificLocation.country}` : 'Nenhum selecionado'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowCityModal(true)}
                                className="text-cyan-400 text-sm hover:underline"
                            >
                                Alterar
                            </button>
                        </div>
                    )}

                    {settings.startupBehavior === 'custom_section' && (
                        <div className="flex flex-col gap-2">
                             <label className="text-sm text-gray-300">Seção Padrão</label>
                             <select 
                                value={settings.startupSection || 'weather'}
                                onChange={(e) => handleSave({ startupSection: e.target.value as View })}
                                className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            >
                                <option value="map">Mapa</option>
                                <option value="ai">IA</option>
                                <option value="news">Notícias</option>
                                <option value="tips">Dicas</option>
                                <option value="info">Informações</option>
                            </select>
                        </div>
                    )}
                </div>
            </section>

            {/* --- AI --- */}
            <section className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Inteligência Artificial</h3>
                <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">Instruções Personalizadas</label>
                    <p className="text-xs text-gray-500 mb-2">
                        Tudo o que você escrever aqui será enviado para a IA como uma "regra" de comportamento extra. Ex: "Seja sarcástico", "Fale sempre em rimas", "Responda como um meteorologista técnico".
                    </p>
                    <textarea 
                        value={settings.aiCustomInstructions}
                        onChange={(e) => handleSave({ aiCustomInstructions: e.target.value })}
                        placeholder="Digite suas instruções personalizadas para a IA..."
                        rows={4}
                        className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
                    />
                </div>
            </section>

             {/* --- DATA MANAGEMENT --- */}
             <section className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Gerenciamento de Dados</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button onClick={exportAppData} className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors">
                        Exportar Dados
                    </button>
                    <button onClick={() => setShowImportModal(true)} className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-medium transition-colors">
                        Importar Dados
                    </button>
                </div>

                <div className="border-t border-gray-700/50 pt-4 space-y-3">
                    <h4 className="text-red-400 text-sm font-bold uppercase tracking-wider mb-2">Zona de Perigo</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <button onClick={() => handleReset('settings')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-2 rounded-lg text-sm transition-colors">
                            Resetar Configurações
                        </button>
                        <button onClick={() => handleReset('cache')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-2 rounded-lg text-sm transition-colors">
                            Limpar Cache (API)
                        </button>
                        <button onClick={() => handleReset('history')} className="border border-red-500/30 text-red-300 hover:bg-red-500/10 py-2 rounded-lg text-sm transition-colors">
                            Limpar Histórico IA
                        </button>
                        <button onClick={() => handleReset('all')} className="bg-red-500/80 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-red-900/20">
                            Resetar Tudo (Fábrica)
                        </button>
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
        </div>
    );
};

export default SettingsView;
