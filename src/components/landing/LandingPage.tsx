
import React, { useState } from 'react';
import { SparklesIcon, MapIcon, DatabaseIcon, AlertTriangleIcon, HeartIcon, ChevronLeftIcon } from '../icons';
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
                    <div className="bg-cyan-500/20 p-2 rounded-full backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        <SparklesIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white">Meteor</span>
                </div>
                <button 
                    onClick={onEnterApp}
                    className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:border-cyan-500/30 text-sm font-medium text-gray-300 hover:text-white group"
                >
                    Entrar no App
                    <ChevronLeftIcon className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-10 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none"></div>
                <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                {/* Grid Pattern Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

                <div className="relative z-10 max-w-5xl mx-auto space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/50 backdrop-blur-md shadow-lg">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">Inteligência Climática v2.5</span>
                    </div>
                    
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tighter leading-[1.1]">
                        O Clima <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.3)]">Dialoga com Você</span>.
                    </h1>
                    
                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Mais do que previsão. O Meteor usa <strong>Inteligência Artificial</strong> para transformar dados complexos em alertas acionáveis e diálogos claros, focado em salvar vidas.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                        <button 
                            onClick={onEnterApp}
                            className="w-full sm:w-auto px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            Acessar Agora
                        </button>
                        <a 
                            href="#legacy"
                            className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 hover:bg-slate-800 border border-white/10 hover:border-white/20 text-white rounded-2xl font-bold text-lg transition-all backdrop-blur-sm"
                        >
                            Nossa História
                        </a>
                    </div>
                </div>

                {/* Floating UI Mockup Hint (CSS Only Representation) */}
                <div className="mt-20 relative z-10 w-full max-w-4xl mx-auto perspective-1000">
                    <div className="relative bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-t-3xl p-4 shadow-2xl transform rotate-x-12 origin-bottom opacity-90 hover:opacity-100 hover:rotate-x-0 transition-all duration-1000 ease-out border-b-0 group overflow-hidden">
                         {/* App Header Mock */}
                         <div className="flex justify-between items-center mb-6 px-2">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            </div>
                            <div className="h-2 w-20 bg-gray-700/50 rounded-full"></div>
                         </div>
                         {/* App Content Grid Mock */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left opacity-70 grayscale group-hover:grayscale-0 transition-all duration-700">
                            {/* Weather Card */}
                            <div className="md:col-span-2 h-40 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/20 rounded-2xl p-4 relative overflow-hidden">
                                <div className="absolute top-4 left-4 w-24 h-4 bg-white/10 rounded-full"></div>
                                <div className="absolute bottom-4 right-4 text-4xl font-bold text-white/20">23°</div>
                            </div>
                            {/* Map Card */}
                            <div className="h-40 bg-slate-800/50 border border-white/5 rounded-2xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png')] opacity-10 bg-repeat space-x-8"></div>
                            </div>
                         </div>
                         {/* Chat Bubble Mock */}
                         <div className="mt-4 bg-slate-800/80 border border-white/5 rounded-2xl rounded-bl-none p-4 w-3/4">
                            <div className="w-full h-2 bg-gray-600/50 rounded-full mb-2"></div>
                            <div className="w-2/3 h-2 bg-gray-600/50 rounded-full"></div>
                         </div>
                    </div>
                     <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20"></div>
                </div>
            </section>

            {/* --- BENTO GRID FEATURES --- */}
            <section className="py-24 px-4 bg-slate-950 relative z-20 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-white">Tecnologia que Protege</h2>
                    <p className="text-slate-400 text-center max-w-2xl mx-auto mb-16">
                        Ferramentas avançadas integradas em uma interface simples, projetada para momentos críticos.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                        {/* Feature 1: AI */}
                        <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 p-8 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-all"></div>
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="bg-purple-500/20 p-3 w-fit rounded-xl mb-4">
                                        <SparklesIcon className="w-8 h-8 text-purple-400" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Cérebro Gemini 2.5</h3>
                                    <p className="text-slate-400 text-lg max-w-md">
                                        Não é apenas um app de clima. É um assistente que entende contexto. Ele não diz apenas "50mm de chuva", ele diz: <strong>"Mova seus móveis para o alto, há risco de alagamento."</strong>
                                    </p>
                                </div>
                                <div className="bg-slate-950/50 border border-white/5 rounded-lg p-3 text-sm text-purple-200 font-mono w-fit">
                                    > Analisando riscos em tempo real...
                                </div>
                            </div>
                        </div>

                        {/* Feature 2: Resilience */}
                        <div className="md:col-span-1 rounded-3xl bg-slate-900 border border-white/10 p-8 flex flex-col justify-between group hover:border-cyan-500/30 transition-colors relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                            <div>
                                <div className="bg-cyan-500/20 p-3 w-fit rounded-xl mb-4">
                                    <DatabaseIcon className="w-8 h-8 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Multi-Source Fallback</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Se a API principal falhar, o Meteor muda automaticamente para fontes alternativas (Open-Meteo) sem você perceber. Dados sempre disponíveis.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-xs font-mono text-green-400 bg-green-900/20 px-3 py-1 rounded-lg w-fit border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Sistema Online
                            </div>
                        </div>

                        {/* Feature 3: Maps */}
                        <div className="md:col-span-1 rounded-3xl bg-slate-900 border border-white/10 p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                            <div className="absolute inset-0 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png')] opacity-5 bg-repeat space-x-4 grayscale group-hover:grayscale-0 transition-all"></div>
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="bg-emerald-500/20 p-3 w-fit rounded-xl mb-4">
                                        <MapIcon className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Mapas Imersivos</h3>
                                    <p className="text-slate-400 text-sm">
                                        Visualize camadas de precipitação, nuvens e temperatura em tempo real sobre o mapa da sua cidade.
                                    </p>
                                </div>
                            </div>
                        </div>

                         {/* Feature 4: Privacy */}
                         <div className="md:col-span-2 rounded-3xl bg-gradient-to-br from-slate-900 to-black border border-white/10 p-8 flex flex-col md:flex-row items-center relative overflow-hidden gap-8">
                            <div className="relative z-10 flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-slate-800 rounded-lg border border-white/5">
                                        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Serverless & Seguro</h3>
                                </div>
                                <p className="text-slate-400 text-lg">
                                    Seus dados de localização são processados anonimamente via <strong>Netlify Functions</strong>. Nenhuma informação pessoal é armazenada em nossos servidores.
                                </p>
                            </div>
                            <div className="relative w-full md:w-1/3 h-32 md:h-full bg-slate-800/30 rounded-xl border border-dashed border-slate-700 flex items-center justify-center">
                                <div className="text-slate-600 text-xs font-mono text-center">
                                    <span className="block text-green-500 mb-1">Encrypted Tunnel</span>
                                    Client &lt;---&gt; Function &lt;---&gt; API
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ORIGIN STORY (RS ALERTA) --- */}
            <section id="legacy" className="py-24 px-4 bg-slate-950 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 bg-emerald-950/10 skew-y-2 transform origin-top-left pointer-events-none"></div>
                <div className="absolute -right-20 top-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        
                        {/* Text Content */}
                        <div className="flex-1 space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-500/30 backdrop-blur-sm">
                                <AlertTriangleIcon className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">O Legado do RS Alerta</span>
                            </div>
                            
                            <div>
                                <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
                                    Da Sala de Aula para <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Salvar Vidas.</span>
                                </h2>
                                <p className="text-slate-300 text-lg leading-relaxed">
                                    O Meteor nasceu como a evolução tecnológica do projeto <strong>RS Alerta</strong>, desenvolvido na <span className="text-white font-semibold border-b border-emerald-500/50">Escola Estadual Dr. Aldo Conte</span> (Sarandi/RS) após a catástrofe climática de 2024.
                                </p>
                            </div>

                            <div className="prose prose-invert text-slate-400">
                                <p>
                                    Estudos apontaram que, durante as enchentes, o problema não foi apenas a infraestrutura, mas a <strong>falha na comunicação do risco</strong>. Informações técnicas não chegavam de forma clara à população. O Meteor resolve isso traduzindo dados em diálogo.
                                </p>
                            </div>
                            
                            <div className="pt-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <div className="h-px w-8 bg-slate-700"></div>
                                    Equipe Original (Autores)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-300">
                                    {[
                                        "Elias Juriatti Rodrigues Nunes",
                                        "Guilherme Zatti",
                                        "Richard Albuquerque Couto",
                                        "Laísa Linke da Silva",
                                        "Fernanda Damasceno Maragno"
                                    ].map((name) => (
                                        <div key={name} className="flex items-center gap-2 group">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors"></div>
                                            <span className="group-hover:text-white transition-colors">{name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 text-xs text-emerald-400/80 font-medium bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/50 w-fit">
                                    Orientação: Profa. Franciele Pedrolo & Profa. Fabiana Oliveira
                                </div>
                            </div>
                        </div>

                        {/* Visual/Card */}
                        <div className="flex-1 w-full lg:w-auto">
                             <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 md:p-12 shadow-2xl transform md:rotate-3 hover:rotate-0 transition-all duration-500 group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 opacity-50"></div>
                                <div className="absolute top-6 right-6 bg-emerald-500/10 p-3 rounded-full group-hover:scale-110 transition-transform duration-500">
                                    <HeartIcon className="w-8 h-8 text-emerald-500 animate-pulse" />
                                </div>
                                
                                <h3 className="text-2xl font-bold text-white mb-6">Missão Humanitária</h3>
                                
                                <div className="relative">
                                    <svg className="absolute -top-4 -left-4 w-8 h-8 text-emerald-500/20" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.017C7.91243 16 7.017 16.8954 7.017 18V21H4.017V18C4.017 15.2386 6.25558 13 9.017 13H12.017C14.7784 13 17.017 15.2386 17.017 18V21H14.017ZM21 9L21 21H18V9C18 7.34315 16.6569 6 15 6H9C7.34315 6 6 7.34315 6 9V9H3V9C3 5.68629 5.68629 3 9 3H15C18.3137 3 21 5.68629 21 9Z"></path></svg>
                                    <blockquote className="text-slate-300 italic text-lg leading-relaxed relative z-10 pl-2">
                                        "A tecnologia, quando usada de forma estratégica, pode salvar vidas e mitigar danos."
                                    </blockquote>
                                </div>
                                
                                <div className="mt-8 pt-8 border-t border-slate-800 flex justify-between items-end">
                                    <div className="text-xs text-slate-500">
                                        Trecho do documento de<br/>fundamentação teórica (2025).
                                    </div>
                                    <div className="text-4xl font-bold text-slate-800 select-none">
                                        COP 30
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-slate-950 border-t border-white/5 py-12 px-4">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <p className="text-white font-bold text-lg tracking-tight">Meteor AI</p>
                        <p className="text-slate-500 text-sm mt-1">Caminhando rumo a COP 30.</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-400">
                        <button onClick={() => setLegalType('terms')} className="hover:text-cyan-400 transition-colors">Termos de Uso</button>
                        <button onClick={() => setLegalType('privacy')} className="hover:text-cyan-400 transition-colors">Política de Privacidade</button>
                        <a href="https://github.com/elias001011/Meteor" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors flex items-center gap-2">
                            GitHub
                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.42-1.305.763-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        </a>
                    </div>
                    
                    <div className="text-slate-600 text-xs text-center md:text-right">
                        &copy; 2025 Elias J. R. Nunes & Equipe RS Alerta.<br/>
                        Todos os direitos reservados.
                    </div>
                </div>
            </footer>

            <LegalModal isOpen={!!legalType} onClose={() => setLegalType(null)} type={legalType} />
        </div>
    );
};

export default LandingPage;
