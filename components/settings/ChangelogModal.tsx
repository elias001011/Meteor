

import React, { useEffect } from 'react';
import { XIcon, SparklesIcon, AlertTriangleIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface ChangelogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (city: any) => void;
}

const ChangelogModal: React.FC<any> = ({ isOpen, onClose }) => {
    const { glassClass, classes } = useTheme();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const versions = [
        {
            version: "4.3.0",
            title: "Modo Zen 2.0 & Imersão",
            changes: [
                "Modo Zen 2.0: Reformulação completa da experiência imersiva.",
                "Estilos Zen: Novo estilo 'Minimalista' moderno e centralizado, além do 'Cinemático' clássico refinado.",
                "Sons Ambientes: Gerador de som nativo (Chuva, Ruído Branco) para foco ou relaxamento.",
                "Configurações Zen: Opções para ocultar o clima, trocar o fundo (Imagem da cidade ou App) e ajustar o volume.",
                "Design: Tipografia refinada no relógio e maior opacidade para conforto visual."
            ]
        },
        {
            version: "4.2.0",
            title: "Interface, Alertas & Detalhes",
            changes: [
                "Visual de Alertas Restauração: O estilo clássico 'Red Card' (RS Alerta) voltou, agora totalmente compatível com os temas de transparência.",
                "Efeito de Chuva Calibrado: Ajuste fino na intensidade e opacidade.",
                "Pop-up Detalhado 2.0: Agora exibe rajadas de vento, ponto de orvalho, pressão e fase da lua."
            ]
        },
        {
            version: "4.1.0",
            title: "Correções e Refinamentos",
            changes: [
                "Transparência 2.0: Controle granular de efeito vidro.",
                "Unidades: Correção na exibição de F°/MPH.",
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 pb-20 backdrop-blur-sm h-screen w-screen animate-enter">
            <div 
                className={`${glassClass} w-full max-w-lg max-h-[80vh] flex flex-col rounded-3xl shadow-2xl border border-white/10 overflow-hidden pb-safe`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${classes.bg}/20`}>
                            <SparklesIcon className={`w-5 h-5 ${classes.text}`} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Sobre o Meteor</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400">Desenvolvido por</span>
                                <a href="https://instagram.com/elias_jrnunes" target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline hover:text-cyan-300 transition-colors">@elias_jrnunes</a>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <div className="relative border-l border-gray-700 ml-3 space-y-8">
                        {versions.map((v, i) => (
                            <div key={i} className="pl-6 relative">
                                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border ${i === 0 ? `bg-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]` : 'bg-gray-800 border-gray-600'}`}></div>
                                <div className="flex items-baseline gap-3 mb-1">
                                    <span className={`text-lg font-bold ${i === 0 ? 'text-white' : 'text-gray-400'}`}>v{v.version}</span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-300 mb-2">{v.title}</h4>
                                <ul className="space-y-1.5">
                                    {v.changes.map((change, idx) => (
                                        <li key={idx} className="text-sm text-gray-400 leading-relaxed flex items-start gap-2">
                                            <span className="block w-1 h-1 rounded-full bg-gray-600 mt-2 flex-shrink-0" />
                                            {change}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-gray-900/80 border-t border-white/10">
                    <a 
                        href="https://rsalerta.netlify.app" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-500/30 hover:border-red-400/50 transition-all hover:shadow-lg hover:shadow-red-900/20"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-red-500/20 p-2 rounded-full group-hover:scale-110 transition-transform">
                                <AlertTriangleIcon className="w-6 h-6 text-red-400" />
                            </div>
                            <div>
                                <p className="text-xs text-red-300 font-bold uppercase tracking-wider mb-0.5">Projeto Original</p>
                                <p className="text-white font-bold">Conheça o RS Alerta</p>
                            </div>
                        </div>
                        <div className="text-red-300 group-hover:translate-x-1 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ChangelogModal;