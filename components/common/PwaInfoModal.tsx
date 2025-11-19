
import React from 'react';
import { XIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface PwaInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PwaInfoModal: React.FC<PwaInfoModalProps> = ({ isOpen, onClose }) => {
    const { glassClass, classes } = useTheme();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`${glassClass} border border-gray-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <XIcon className="w-6 h-6" />
                </button>

                <h3 className="text-xl font-bold text-white mb-4">Instale o App Meteor</h3>
                
                <div className="space-y-4 text-gray-300">
                    <p>
                        O Meteor foi desenvolvido para funcionar melhor como um aplicativo instalado no seu dispositivo.
                    </p>
                    
                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <h4 className="font-bold text-white mb-2">No Android (Chrome):</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                            <li>Toque nos três pontos (Menu)</li>
                            <li>Selecione <strong>"Adicionar à tela inicial"</strong> ou "Instalar App"</li>
                        </ol>
                        <p className="text-xs text-green-400 mt-2 font-semibold">Necessário para notificações offline.</p>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <h4 className="font-bold text-white mb-2">No iOS (Safari):</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                            <li>Toque no botão <strong>Compartilhar</strong> (quadrado com seta)</li>
                            <li>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong></li>
                        </ol>
                    </div>

                    <p className="text-xs text-gray-500 italic mt-4">
                        Isso permitirá o funcionamento em tela cheia e uma melhor experiência de usuário.
                    </p>
                </div>
                
                <button 
                    onClick={onClose}
                    className={`w-full ${classes.bg} text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity mt-6`}
                >
                    Entendi
                </button>
            </div>
        </div>
    );
};

export default PwaInfoModal;