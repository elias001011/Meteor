
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { RobotIcon, SearchIcon, SparklesIcon, XIcon } from '../icons';

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
        "Curiosidades sobre o clima espacial"
    ];

    return (
        // pb-48 no mobile garante que o conteúdo role para cima da barra de input fixa
        <div className="flex flex-col items-center justify-center min-h-full p-6 pb-48 sm:pb-6 text-center animate-fade-in flex-1 overflow-y-auto">
            <div className="mb-8 relative group cursor-pointer" onClick={() => setShowHelp(true)}>
                <div className={`w-24 h-24 rounded-[2rem] ${classes.bg} flex items-center justify-center shadow-2xl shadow-black/50 bg-opacity-20 backdrop-blur-xl transition-transform duration-500 group-hover:scale-105 group-hover:rotate-3`}>
                    <SparklesIcon className="w-12 h-12 text-white drop-shadow-md" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-2 border border-gray-800 shadow-lg">
                    <RobotIcon className="w-5 h-5 text-gray-400" />
                </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {getGreeting()}<span className={classes.text}>{userName ? `, ${userName}` : ''}</span>.
            </h2>
            <p className="text-gray-400 max-w-xs mb-10 leading-relaxed">
                Sou o Meteor AI. Estou pronto para ajudar com clima, notícias e controle do app.
            </p>

            <div className="grid grid-cols-1 gap-3 w-full max-w-md px-2">
                {suggestions.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => onSuggestionClick(s)}
                        className="bg-gray-800/40 hover:bg-gray-800 border border-gray-700/50 hover:border-gray-600 rounded-2xl p-4 text-sm text-left text-gray-200 transition-all flex items-center gap-3 group active:scale-95"
                    >
                        <div className="p-2 rounded-full bg-gray-800/50 group-hover:bg-gray-700 transition-colors">
                             <SearchIcon className={`w-4 h-4 text-gray-500 ${classes.text.replace('text-', 'group-hover:text-')}`} />
                        </div>
                        <span className="font-medium">{s}</span>
                    </button>
                ))}

                <button 
                    onClick={() => setShowHelp(true)}
                    className="mt-4 bg-black hover:bg-gray-950 border border-gray-800/80 rounded-2xl p-4 text-sm text-left text-white transition-all flex items-center gap-3 group shadow-xl hover:shadow-2xl active:scale-95"
                >
                     <div className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                        ?
                     </div>
                     <div className="flex flex-col">
                        <span className="font-bold text-gray-200">O que posso fazer?</span>
                        <span className="text-xs text-gray-500">Toque para ver o guia completo</span>
                     </div>
                </button>
            </div>

            {showHelp && (
                // Z-Index 120 garante sobreposição sobre BottomNav (100) e MobileControls (40)
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowHelp(false)}>
                    {/* max-h-[70vh] e mb-20 no mobile garantem que o modal fique longe da parte inferior da tela */}
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full relative shadow-2xl flex flex-col max-h-[70vh] sm:max-h-[85vh] mb-20 sm:mb-0 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/95 backdrop-blur sticky top-0 z-10">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <SparklesIcon className={`w-5 h-5 ${classes.text}`} /> Guia do Meteor AI
                            </h3>
                            <button onClick={() => setShowHelp(false)} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"><XIcon className="w-5 h-5"/></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto text-sm text-gray-300 space-y-8 custom-scrollbar">
                            <section>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2"><RobotIcon className="w-4 h-4 text-gray-500"/> Como eu funciono?</h4>
                                <p className="leading-relaxed text-gray-400">Sou alimentado pelo modelo <strong>Gemini 2.5 Flash Lite</strong>. Eu tenho "consciência" do contexto do aplicativo. Quando conversamos, eu analiso:</p>
                                <ul className="mt-3 space-y-2 text-gray-400 bg-gray-800/30 p-4 rounded-xl border border-gray-800">
                                    <li className="flex gap-2"><span className={classes.text}>•</span> Sua mensagem e histórico recente.</li>
                                    <li className="flex gap-2"><span className={classes.text}>•</span> Os dados do clima na tela.</li>
                                    <li className="flex gap-2"><span className={classes.text}>•</span> Data, hora e localização.</li>
                                    <li className="flex gap-2"><span className={classes.text}>•</span> Suas preferências definidas nos ajustes.</li>
                                </ul>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-3 flex items-center gap-2"><SearchIcon className="w-4 h-4 text-gray-500"/> Comandos Automáticos</h4>
                                <p className="text-gray-400 mb-3">Eu uso ferramentas para te dar respostas melhores. Não precisa digitar o comando, basta pedir naturalmente:</p>
                                <div className="space-y-3">
                                    <div className="bg-gray-800/50 border border-gray-700/50 p-3 rounded-xl">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-semibold">Pesquisa Web</span>
                                            <span className="text-[10px] font-mono bg-cyan-900/50 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-900">CMD:SEARCH</span>
                                        </div>
                                        <p className="text-xs text-gray-500">"Quem ganhou o jogo ontem?"</p>
                                    </div>
                                    <div className="bg-gray-800/50 border border-gray-700/50 p-3 rounded-xl">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-semibold">Consultar Clima</span>
                                            <span className="text-[10px] font-mono bg-purple-900/50 text-purple-400 px-1.5 py-0.5 rounded border border-purple-900">CMD:WEATHER</span>
                                        </div>
                                        <p className="text-xs text-gray-500">"Como está o tempo em Londres?"</p>
                                    </div>
                                    <div className="bg-gray-800/50 border border-gray-700/50 p-3 rounded-xl">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-semibold">Controle do App</span>
                                            <span className="text-[10px] font-mono bg-green-900/50 text-green-400 px-1.5 py-0.5 rounded border border-green-900">CMD:THEME</span>
                                        </div>
                                        <p className="text-xs text-gray-500">"Mude o tema para roxo."</p>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl">
                                <h4 className="text-red-400 font-bold mb-2 text-xs uppercase tracking-wider">Limitações</h4>
                                <p className="text-gray-400">Para manter o Meteor gratuito, existe um limite de <strong>5 interações por dia</strong>.</p>
                                <p className="mt-2 text-xs text-gray-500">O limite reinicia automaticamente à meia-noite.</p>
                            </section>
                        </div>

                        <div className="p-4 border-t border-gray-800 bg-gray-900">
                            <button onClick={() => setShowHelp(false)} className={`w-full py-3.5 rounded-xl ${classes.bg} text-white font-bold shadow-lg hover:opacity-90 transition-all active:scale-95`}>Entendi</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiWelcome;
