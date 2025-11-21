
import React, { useEffect } from 'react';
import { XIcon, InfoIcon,  } from '../icons';

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
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Última atualização: Novembro de 2025</p>
                            
                            <section>
                                <h4 className="text-white font-bold mb-2 text-base">1. Natureza do Serviço</h4>
                                <p>O Meteor é uma ferramenta de monitoramento climático baseada em Inteligência Artificial, desenvolvida como evolução do projeto acadêmico "RS Alerta". Embora nos esforcemos pela precisão técnica, as previsões meteorológicas estão sujeitas a erros inerentes à ciência. Este aplicativo <strong>não substitui</strong> os canais oficiais de Defesa Civil ou órgãos governamentais.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-2 text-base">2. Uso de IA Generativa</h4>
                                <p>As respostas geradas pelo assistente (Google Gemini) são baseadas em dados meteorológicos fornecidos em tempo real. A IA pode, ocasionalmente, apresentar imprecisões ("alucinações"). Verifique sempre informações críticas de segurança em múltiplas fontes.</p>
                            </section>
                            
                            <section>
                                <h4 className="text-white font-bold mb-2 text-base">3. Disponibilidade e Garantia</h4>
                                <p>O Meteor é um projeto disponibilizado "como está" (as-is), sem garantias de uptime de 100%. O serviço pode ser interrompido para manutenção ou devido a limites de quotas das APIs utilizadas.</p>
                            </section>
                        </>
                    ) : (
                        <>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Sua privacidade é nossa prioridade.</p>
                            <p>O Meteor foi desenhado com uma arquitetura "Privacy-First".</p>
                            
                            <section>
                                <h4 className="text-white font-bold mb-2 text-base">1. Coleta de Dados</h4>
                                <p><strong>Não coletamos</strong> dados pessoais identificáveis (nome, email, telefone) em nossos servidores. As configurações do usuário (como nome e preferências) são salvas exclusivamente no <strong>LocalStorage</strong> do seu navegador e nunca saem do seu dispositivo.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-2 text-base">2. Geolocalização</h4>
                                <p>Sua localização (Latitude/Longitude) é enviada aos nossos serviços (Netlify Functions) apenas no momento da consulta para buscar dados meteorológicos locais. Ela não é armazenada permanentemente nem compartilhada com terceiros para fins de publicidade ou rastreamento.</p>
                            </section>

                            <section>
                                <h4 className="text-white font-bold mb-2 text-base">3. Inteligência Artificial</h4>
                                <p>Ao conversar com a IA, o texto das suas mensagens e o contexto climático são enviados para a API do Google Gemini para processamento. A Google utiliza esses dados conforme seus próprios termos de serviço para IA, mas o Meteor não armazena o histórico de conversas em seus servidores (ele fica salvo apenas no seu dispositivo se a opção estiver ativada).</p>
                            </section>
                        </>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl flex justify-end">
                    <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-cyan-900/20">
                        Entendi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LegalModal;
