
import React, { useState } from 'react';
import { SparklesIcon, MapIcon, DatabaseIcon, AlertTriangleIcon, HeartIcon } from '../icons';
import LegalModal from '../common/LegalModal';

interface LandingPageProps {
    onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
    const [legalType, setLegalType] = useState<'terms' | 'privacy' | null>(null);

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden selection:bg-cyan-500/30">
            {/* --- NAV --- */}
            <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="bg-cyan-500/20 p-2 rounded-full backdrop-blur-md border border-cyan-500/30">
                        <SparklesIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">Meteor</span>
                </div>
                <button 
                    onClick={onEnterApp}
                    className="hidden sm:block px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-gray-300"
                >
                    Entrar no App
                </button>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-10 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
                <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 border border-slate-700/50 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Inteligência Climática v2.5</span>
                    </div>
                    
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tighter leading-[1.1]">
                        O Clima <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">Dialoga com Você</span>.
                    </h1>
                    
                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Mais do que previsão. O Meteor usa Inteligência Artificial para transformar dados complexos em alertas acionáveis e diálogos claros.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <button 
                            onClick={onEnterApp}
                            className="w-full sm:w-auto px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-1"
                        >
                            Acessar Agora
                        </button>
                        <a 
                            href="#legacy"
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 hover:bg-slate-800 border border-white/10 text-white rounded-2xl font-bold text-lg transition-all"
                        >
                            Nossa História
                        </a>
                    </div>
                </div>

                {/* Floating UI Mockup Hint */}
                <div className="mt-16 relative z-10 w-full max-w-5xl mx-auto perspective-1000">
                    <div className="relative bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-t-3xl p-2 sm:p-4 shadow-2xl transform rotate-x-12 origin-bottom opacity-80 hover:opacity-100 hover:rotate-x-0 transition-all duration-1000 ease-out border-b-0">
                         <div className="flex gap-2 mb-4 px-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                            <div className="h-32 bg-white/5 rounded-xl animate-pulse"></div>
                            <div className="h-32 bg-white/5 rounded-xl animate-pulse delay-100"></div>
                            <div className="h-32 bg-white/5 rounded-xl animate-pulse delay-200"></div>
                         </div>
                    </div>
                     <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-950 to-transparent z-20"></div>
                </div>
            </section>

            {/* --- BENTO GRID FEATURES --- */}
            <section className="py-24 px-4 bg-slate-950 relative z-20">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">Tecnologia que Salva Vidas</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        {/* Feature 1: AI */}
                        <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] group-hover:bg-purple-500/30 transition-all"></div>
                            <SparklesIcon className="w-12 h-12 text-purple-400 mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">Cérebro Gemini 2.5</h3>
                            <p className="text-slate-400 text-lg max-w-md">
                                Não é apenas um app de clima. É um assistente que entende contexto. Pergunte "Posso lavar roupa?" ou "Há risco de enchente?" e receba respostas humanas.
                            </p>
                        </div>

                        {/* Feature 2: Resilience */}
                        <div className="md:col-span-1 rounded-3xl bg-slate-900 border border-white/10 p-8 flex flex-col justify-between group hover:border-cyan-500/30 transition-colors">
                            <DatabaseIcon className="w-10 h-10 text-cyan-400" />
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">Multi-Source Fallback</h3>
                                <p className="text-slate-400 text-sm">
                                    Se a API principal falhar, o Meteor muda automaticamente para fontes alternativas (Open-Meteo) sem você perceber.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-xs font-mono text-green-400 bg-green-900/20 px-3 py-1 rounded-lg w-fit">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                99.9% Uptime
                            </div>
                        </div>

                        {/* Feature 3: Maps */}
                        <div className="md:col-span-1 rounded-3xl bg-slate-900 border border-white/10 p-8 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png')] opacity-5 bg-repeat space-x-4"></div>
                            <div className="relative z-10">
                                <MapIcon className="w-10 h-10 text-emerald-400 mb-6" />
                                <h3 className="text-xl font-bold text-white mb-2">Mapas Imersivos</h3>
                                <p className="text-slate-400 text-sm">
                                    Visualize camadas de precipitação, nuvens e temperatura em tempo real sobre o mapa da sua cidade.
                                </p>
                            </div>
                        </div>

                         {/* Feature 4: Privacy */}
                         <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900 to-black border border-white/10 p-8 flex items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-slate-800 rounded-lg">
                                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Arquitetura Serverless & Segura</h3>
                                </div>
                                <p className="text-slate-400 text-lg">
                                    Seus dados de localização são processados anonimamente via Netlify Functions. Nenhuma informação pessoal é armazenada em nossos servidores.
                                </p>
                            </div>
                            <div className="absolute right-0 bottom-0 w-1/3 h-full bg-gradient-to-l from-cyan-900/10 to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ORIGIN STORY (RS ALERTA) --- */}
            <section id="legacy" className="py-24 px-4 bg-slate-950 relative">
                <div className="absolute inset-0 bg-emerald-900/5 skew-y-3 transform origin-top-left pointer-events-none"></div>
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row gap-12 items-center">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/30 border border-emerald-500/30">
                                <AlertTriangleIcon className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">O Legado do RS Alerta</span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                                Da Sala de Aula para <br />
                                <span className="text-emerald-400">Salvar Vidas.</span>
                            </h2>
                            <p className="text-slate-300 text-lg leading-relaxed">
                                O Meteor nasceu como evolução do projeto <strong>RS Alerta</strong>, desenvolvido na <span className="text-white font-semibold">Escola Estadual Dr. Aldo Conte</span> (Sarandi/RS) após a catástrofe climática de 2024.
                            </p>
                            <p className="text-slate-400 leading-relaxed">
                                Identificamos que o problema não era apenas a chuva, mas a <strong>falha na comunicação do risco</strong>. Nosso objetivo é traduzir dados técnicos em linguagem humana, preparando a sociedade para os desafios climáticos do futuro.
                            </p>
                            
                            <div className="pt-6">
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Equipe Original (RS Alerta)</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Elias Juriatti Rodrigues Nunes</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Guilherme Zatti</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Richard Albuquerque Couto</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Laísa Linke da Silva</div>
                                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Fernanda Damasceno Maragno</div>
                                    <div className="col-span-2 text-xs text-slate-500 mt-2">Orientação: Profa. Franciele Pedrolo & Profa. Fabiana Oliveira</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                             <div className="relative rounded-2xl bg-slate-900 border border-slate-700 p-6 md:p-10 shadow-2xl transform md:rotate-3 hover:rotate-0 transition-all duration-500">
                                <div className="absolute top-4 right-4">
                                    <HeartIcon className="w-8 h-8 text-emerald-500 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-4">Missão Humanitária</h3>
                                <blockquote className="text-slate-300 italic border-l-4 border-emerald-500 pl-4 my-6">
                                    "A tecnologia, quando usada de forma estratégica, pode salvar vidas e mitigar danos."
                                </blockquote>
                                <p className="text-sm text-slate-400">
                                    — Trecho do documento de fundamentação teórica do projeto, 2025.
                                </p>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-slate-950 border-t border-white/5 py-12 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <p className="text-white font-bold text-lg">Meteor AI</p>
                        <p className="text-slate-500 text-sm">Caminhando rumo a COP 30.</p>
                    </div>
                    <div className="flex gap-6 text-sm text-slate-400">
                        <button onClick={() => setLegalType('terms')} className="hover:text-white transition-colors">Termos de Uso</button>
                        <button onClick={() => setLegalType('privacy')} className="hover:text-white transition-colors">Política de Privacidade</button>
                        <a href="https://github.com/elias001011/Meteor" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
                    </div>
                    <div className="text-slate-600 text-xs">
                        &copy; 2025 Elias J. R. Nunes & Equipe RS Alerta.
                    </div>
                </div>
            </footer>

            <LegalModal isOpen={!!legalType} onClose={() => setLegalType(null)} type={legalType} />
        </div>
    );
};

export default LandingPage;
