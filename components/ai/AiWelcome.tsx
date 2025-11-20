

import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { RobotIcon, SearchIcon, SparklesIcon, LightbulbIcon } from '../icons';

interface AiWelcomeProps {
    userName?: string;
    onSuggestionClick: (text: string) => void;
}

const AiWelcome: React.FC<AiWelcomeProps> = ({ userName, onSuggestionClick }) => {
    const { classes } = useTheme();
    const [showHelp, setShowHelp] = useState(false);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    const suggestions = [
        "Como estará o tempo no fim de semana?",
        "Notícias sobre tecnologia hoje",
        "Curiosidades sobre tempestades solares"
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in pb-32">
            <div className="mb-6 relative">
                <div className={`w-20 h-20 rounded-full ${classes.bg} flex items-center justify-center shadow-xl bg-opacity-20 backdrop-blur-xl`}>
                    <SparklesIcon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gray-800 rounded-full p-1.5 border border-gray-700">
                    <RobotIcon className="w-4 h-4 text-gray-400" />
                </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
                {getGreeting()}{userName ? `, ${userName}` : ''}.
            </h2>
            <p className="text-gray-400 max-w-xs mb-8">
                Sou o Meteor AI. Posso buscar na web, ver o clima e controlar o app para você.
            </p>

            <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                {suggestions.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => onSuggestionClick(s)}
                        className="bg-gray-800/50 hover:bg-gray-700 border border-gray-700/50 rounded-xl p-4 text-sm text-left text-gray-200 transition-all flex items-center gap-3 group"
                    >
                        <SearchIcon className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                        {s}
                    </button>
                ))}

                {/* "What can I do?" as the 4th card, stylized differently */}
                <button 
                    onClick={() => setShowHelp(true)}
                    className="bg-black hover:bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm text-left text-white transition-all flex items-center gap-3 group shadow-lg"
                >
                     <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-gray-700 transition-colors">
                        ?
                     </div>
                    <span className="font-medium">O que eu posso fazer?</span>
                </button>
            </div>

            {showHelp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 text-cyan-400" /> Meteor AI
                        </h3>
                        <div className="space-y-4 text-sm text-gray-300">
                            <div className="flex gap-3">
                                <div className="bg-gray-700/50 p-2 rounded-lg h-fit"><span className="text-lg">🌐</span></div>
                                <div>
                                    <strong className="text-white block">Busca Web Inteligente</strong>
                                    Pesquiso notícias, resultados de jogos e fatos recentes.
                                </div>
                            </div>
                             <div className="flex gap-3">
                                <div className="bg-gray-700/50 p-2 rounded-lg h-fit"><span className="text-lg">🌦️</span></div>
                                <div>
                                    <strong className="text-white block">Dados Climáticos</strong>
                                    Analiso o clima de qualquer lugar com dados técnicos.
                                </div>
                            </div>
                             <div className="flex gap-3">
                                <div className="bg-gray-700/50 p-2 rounded-lg h-fit"><span className="text-lg">⚙️</span></div>
                                <div>
                                    <strong className="text-white block">Comandos de App</strong>
                                    Posso mudar o tema ou configurações. Tente "Mude o tema para Roxo".
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setShowHelp(false)} className={`mt-6 w-full py-3 rounded-xl ${classes.bg} text-white font-bold hover:opacity-90 transition-opacity`}>Entendi</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiWelcome;