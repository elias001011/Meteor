
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
        "Curiosidades sobre tempestades solares",
        "Crie um poema sobre chuva"
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in">
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

            <div className="grid grid-cols-1 gap-3 w-full max-w-md mb-8">
                {suggestions.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => onSuggestionClick(s)}
                        className="bg-gray-800/50 hover:bg-gray-700 border border-gray-700/50 rounded-xl p-3 text-sm text-left text-gray-200 transition-all flex items-center gap-3 group"
                    >
                        <SearchIcon className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                        {s}
                    </button>
                ))}
            </div>

            <button 
                onClick={() => setShowHelp(true)}
                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 underline decoration-dotted underline-offset-4"
            >
                <LightbulbIcon className="w-3 h-3" />
                O que eu posso fazer?
            </button>

            {showHelp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Capacidades do AI</h3>
                        <ul className="space-y-3 text-sm text-gray-300">
                            <li className="flex gap-2"><span className="text-cyan-400">🌐</span> <strong>Busca Web:</strong> Pesquiso notícias e fatos recentes.</li>
                            <li className="flex gap-2"><span className="text-yellow-400">🌦️</span> <strong>Clima:</strong> Consulto dados detalhados de qualquer lugar.</li>
                            <li className="flex gap-2"><span className="text-purple-400">⚙️</span> <strong>Controle:</strong> Diga "mude o tema para verde" e eu faço.</li>
                            <li className="flex gap-2"><span className="text-red-400">⚠️</span> <strong>Limitações:</strong> Posso cometer erros. Sempre verifique informações críticas.</li>
                        </ul>
                        <button onClick={() => setShowHelp(false)} className={`mt-6 w-full py-2 rounded-lg ${classes.bg} text-white font-bold`}>Entendi</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiWelcome;
