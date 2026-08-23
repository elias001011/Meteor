

import React, { useState, useEffect } from 'react';
import { InfoIcon } from '../icons';
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
            "Por que a sensação térmica muda tanto?",
            "Como se formam os furacões?",
            "Dicas de segurança para tempestades.",
            "Qual a temperatura ideal para plantar?",
            "Como identificar risco de temporal?"
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
            <img src="/favicon.svg" alt="" className="mb-5 h-12 w-12" />
            
            <h2 className="mb-3 text-center text-3xl font-semibold tracking-tight text-white">{greeting}</h2>
            <p className="mb-8 max-w-sm text-center leading-relaxed text-gray-400">
                Pergunte sobre a previsão, os dados exibidos ou como se preparar para as condições do dia.
            </p>

            <div className="w-full max-w-lg border-y border-white/[0.07]">
                {prompts.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onPromptSelect(prompt)}
                        className="group relative w-full border-t border-white/[0.07] px-1 py-3.5 text-left text-sm text-gray-300 transition-colors first:border-t-0 hover:text-white"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            <button 
                onClick={() => setShowInfoModal(true)}
                className="mt-8 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
                <InfoIcon className="w-4 h-4" />
                O que a IA pode fazer?
            </button>

            {/* AI INFO MODAL */}
            {showInfoModal && (
                <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-enter" onClick={() => setShowInfoModal(false)}>
                    <div className="relative w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#15191f] p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-white mb-4">Capacidades da IA</h3>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li className="flex gap-3">
                                <span className={`${classes.text} font-bold`}>•</span>
                                <span><strong>Análise Climática:</strong> Acesso total aos dados de clima da sua tela atual (cache local).</span>
                            </li>
                            <li className="flex gap-3">
                                <span className={`${classes.text} font-bold`}>•</span>
                                <span><strong>Busca Web:</strong> Se precisar de notícias ou dados recentes, a IA ativa a Busca do Google nativa automaticamente.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className={`${classes.text} font-bold`}>•</span>
                                <span><strong>Clima Atual:</strong> Se você não informar localização, a IA usa o clima que já está na tela do app.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className={`${classes.text} font-bold`}>•</span>
                                <span><strong>Consulta Global:</strong> Pergunte sobre o tempo em qualquer cidade. A IA usa a web nativa para informações recentes e verificáveis.</span>
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
