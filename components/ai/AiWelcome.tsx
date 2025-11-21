

import React, { useState, useEffect } from 'react';
import { SparklesIcon, InfoIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';
import { getSettings } from '../../services/settingsService';

interface AiWelcomeProps {
    onPromptSelect: (text: string) => void;
}

const AiWelcome: React.FC<AiWelcomeProps> = ({ onPromptSelect }) => {
    const { classes, density } = useTheme();
    const [greeting, setGreeting] = useState('');
    const [prompts, setPrompts] = useState<string[]>([]);
    const [showInfoModal, setShowInfoModal] = useState(false);
    
    useEffect(() => {
        const settings = getSettings();
        // Greeting Logic
        const hour = new Date().getHours();
        let greet = 'Olá';
        if (hour >= 5 && hour < 12) greet = 'Bom dia';
        else if (hour >= 12 && hour < 18) greet = 'Boa tarde';
        else greet = 'Boa noite';

        if (settings.userName && settings.userName.trim() !== '') {
            greet += `, ${settings.userName}`;
        }
        setGreeting(greet);

        // Rotating Prompts based on Day of Month (Deterministic)
        const allPrompts = [
            "Como está o clima para um churrasco hoje?",
            "Explique a previsão da semana com carisma.",
            "Vai chover no fim de semana?",
            "Crie um alerta de chuva para enviar no WhatsApp.",
            "O que é o índice UV e por que importa?",
            "Resuma as condições climáticas atuais.",
            "Qual a melhor hora para correr hoje?",
            "Curiosidades sobre tempestades solares.",
            "Como se formam os furacões?",
            "Dicas de segurança para tempestades.",
            "Qual a temperatura ideal para plantar?",
            "Me conte uma piada sobre meteorologia."
        ];
        
        // Simple deterministic rotation based on day of year
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        // Slice 3 prompts rotating daily
        const startIndex = (dayOfYear * 3) % allPrompts.length;
        const selectedPrompts = [];
        for(let i = 0; i < 3; i++) {
            selectedPrompts.push(allPrompts[(startIndex + i) % allPrompts.length]);
        }
        setPrompts(selectedPrompts);

    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-full p-6 animate-enter">
            <div className={`p-5 rounded-full bg-gradient-to-br ${classes.gradient} mb-6 shadow-lg shadow-${classes.text.split('-')[1]}-500/20`}>
                <SparklesIcon className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-3 text-center tracking-tight">{greeting}</h2>
            <p className="text-gray-400 text-center max-w-xs mb-10 leading-relaxed">
                Sou sua assistente climática inteligente. Pergunte sobre o tempo, curiosidades ou peça dicas.
            </p>

            <div className="w-full max-w-md space-y-3">
                {prompts.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onPromptSelect(prompt)}
                        className={`w-full p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-left text-sm text-gray-200 hover:text-white group relative overflow-hidden`}
                    >
                        <div className={`absolute left-0 top-0 h-full w-1 ${classes.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                        <span className="group-hover:translate-x-2 transition-transform duration-300 block">
                            "{prompt}"
                        </span>
                    </button>
                ))}
            </div>

            <button 
                onClick={() => setShowInfoModal(true)}
                className={`mt-12 flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-gray-800/50 hover:bg-gray-800 text-xs font-medium text-gray-300 hover:text-white transition-all hover:shadow-lg`}
            >
                <InfoIcon className="w-4 h-4" />
                O que a IA pode fazer?
            </button>

            {/* AI INFO MODAL */}
            {showInfoModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-enter" onClick={() => setShowInfoModal(false)}>
                    <div className="bg-gray-900 border border-gray-700 rounded-3xl max-w-sm w-full p-6 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className={`w-12 h-12 rounded-2xl ${classes.bg}/20 flex items-center justify-center mb-4`}>
                             <SparklesIcon className={`w-6 h-6 ${classes.text}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4">Capacidades da IA</h3>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li className="flex gap-3">
                                <span className={`${classes.text} font-bold`}>•</span>
                                <span><strong>Análise Climática:</strong> Acesso total aos dados de clima da sua tela atual (cache local).</span>
                            </li>
                            <li className="flex gap-3">
                                <span className={`${classes.text} font-bold`}>•</span>
                                <span><strong>Busca Web:</strong> Se precisar de notícias ou dados recentes, a IA ativa a busca automaticamente.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className={`${classes.text} font-bold`}>•</span>
                                <span><strong>Consulta Global:</strong> Pergunte sobre o tempo em Paris ou Tóquio. A IA consultará a Open-Meteo em tempo real.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className={`${classes.text} font-bold`}>•</span>
                                <span><strong>Segurança:</strong> Seus dados são processados de forma anônima e segura via Netlify Functions.</span>
                            </li>
                        </ul>
                        <button 
                            onClick={() => setShowInfoModal(false)}
                            className={`w-full mt-8 py-3.5 rounded-xl font-bold text-white ${classes.bg} ${classes.bgHover} transition-colors shadow-lg`}
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiWelcome;