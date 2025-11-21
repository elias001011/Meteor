
import React, { useEffect } from 'react';
import { XIcon, InfoIcon } from '../icons';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy' | null;
}

const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen || !type) return null;

    const title = type === 'terms' ? 'Termos de Uso' : 'Política de Privacidade';

    return (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md animate-enter">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative">
                <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 rounded-t-2xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <InfoIcon className="w-5 h-5 text-cyan-400" />
                        {title}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="overflow-y-auto p-6 text-slate-300 space-y-6 custom-scrollbar leading-relaxed text-sm">
                    {type === 'terms' ? (
                        <>
                            <p><strong>Última atualização: Novembro de 2025</strong></p>
                            <p>Bem-vindo ao Meteor. Ao utilizar nosso aplicativo, você concorda com os seguintes termos:</p>
                            
                            <section>
                                <h4 className="text-white font-bold mb-2">1. Natureza do Serviço</h4>
                                <p>O Meteor é uma ferramenta de monitoramento climático baseada em IA. Embora nos esforcemos pela precisão, as previsões meteorológicas estão sujeitas a erros. Este aplicativo <strong>não substitui</strong> os canais oficiais de Defesa Civil.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-2">2. Uso de IA</h4>
                                <p>As respostas geradas pelo assistente (Google Gemini) são baseadas em dados fornecidos. A IA pode cometer erros (alucinações). Verifique informações críticas sobre segurança.</p>
                            </section>
                            
                            <section>
                                <h4 className="text-white font-bold mb-2">3. Disponibilidade</h4>
                                <p>O Meteor é um projeto open-source e educacional. Não garantimos uptime de 100% ou suporte técnico contínuo.</p>
                            </section>
                        </>
                    ) : (
                        <>
                            <p><strong>Sua privacidade é nossa prioridade.</strong></p>
                            <p>O Meteor foi desenhado com uma arquitetura "Privacy-First".</p>
                            
                            <section>
                                <h4 className="text-white font-bold mb-2">1. Coleta de Dados</h4>
                                <p><strong>Não coletamos</strong> dados pessoais identificáveis (nome, email, telefone) em nossos servidores. As configurações do usuário (como nome e preferências) são salvas exclusivamente no <strong>LocalStorage</strong> do seu navegador.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-2">2. Localização</h4>
                                <p>Sua localização (Latitude/Longitude) é enviada aos nossos serviços (Netlify Functions) apenas para buscar dados meteorológicos. Ela não é armazenada permanentemente nem compartilhada com terceiros para fins de publicidade.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-2">3. Inteligência Artificial</h4>
                                <p>Ao conversar com a IA, o texto das suas mensagens é enviado para a API do Google Gemini. Não envie informações sensíveis ou privadas no chat.</p>
                            </section>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
