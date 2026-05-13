

import React, { useState, useRef, useEffect } from 'react';
import { XIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import type { BackupImportOptions } from '../../services/settingsService';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (fileContent: string, options: BackupImportOptions) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
    const [options, setOptions] = useState({
        importSettings: true,
        importCache: true,
        importChat: false 
    });
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { glassClass } = useTheme();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setErrorMessage(null);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setErrorMessage(null);

        const isJsonFile = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json') || file.type === '';
        if (!isJsonFile) {
            setErrorMessage('Selecione um arquivo JSON de backup.');
            return;
        }

        const maxSizeBytes = 2 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            setErrorMessage('O arquivo de backup está muito grande. Use um arquivo com até 2 MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                onImport(event.target.result as string, options);
            } else {
                setErrorMessage('O arquivo selecionado está vazio.');
            }
        };
        reader.onerror = () => {
            setErrorMessage('Não foi possível ler o arquivo selecionado.');
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4 pb-20 lg:pb-4 backdrop-blur-sm h-screen w-screen">
            <div className={`${glassClass} border border-gray-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl pb-safe`}>
                 <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <XIcon className="w-6 h-6" />
                </button>

                <h3 className="text-xl font-bold text-white mb-2">Restaurar Backup</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Escolha um arquivo JSON exportado pelo Meteor para restaurar seus dados locais.
                </p>

                {errorMessage && (
                    <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {errorMessage}
                    </div>
                )}
                
                <div className="space-y-3 mb-6">
                    <label className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={options.importSettings} 
                            onChange={e => setOptions(prev => ({...prev, importSettings: e.target.checked}))}
                            className="form-checkbox h-5 w-5 text-cyan-500 rounded border-gray-600 bg-gray-800 focus:ring-cyan-500 focus:ring-offset-gray-800"
                        />
                        <span>Configurações</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={options.importCache} 
                            onChange={e => setOptions(prev => ({...prev, importCache: e.target.checked}))}
                            className="form-checkbox h-5 w-5 text-cyan-500 rounded border-gray-600 bg-gray-800 focus:ring-cyan-500 focus:ring-offset-gray-800"
                        />
                        <span>Cache do Clima (Economiza dados)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={options.importChat} 
                            onChange={e => setOptions(prev => ({...prev, importChat: e.target.checked}))}
                            className="form-checkbox h-5 w-5 text-cyan-500 rounded border-gray-600 bg-gray-800 focus:ring-cyan-500 focus:ring-offset-gray-800"
                        />
                        <span>Histórico de Chat</span>
                    </label>
                </div>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept=".json,application/json" 
                    onChange={handleFileChange} 
                    onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                    className="hidden" 
                />
                
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-cyan-500 text-white font-bold py-3 rounded-xl hover:bg-cyan-400 transition-colors"
                >
                    Selecionar Arquivo de Backup
                </button>
            </div>
        </div>
    );
};

export default ImportModal;
