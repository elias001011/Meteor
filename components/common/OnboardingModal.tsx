
import React, { useState, useEffect } from 'react';
import { SparklesIcon, MapIcon, FileTextIcon, ChevronLeftIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface OnboardingModalProps {
    onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const { classes, glassClass } = useTheme();

    useEffect(() => {
        // Start animation on mount
        const timer = setTimeout(() => setIsVisible(true), 100);
        // Lock scroll
        document.body.style.overflow = 'hidden';
        return () => {
            clearTimeout(timer);
            document.body.style.overflow = '';
        };
    }, []);

    const handleNext = () => {
        if (step < slides.length - 1) {
            setStep(prev => prev + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        setIsVisible(false);
        // Allow animation to finish before unmounting
        setTimeout(onClose, 300);
    };

    const slides = [
        {
            title: "Bem-vindo ao Meteor",
            description: "Sua nova central de inteligência climática avançada.",
            icon: <SparklesIcon className={`w-16 h-16 ${classes.text}`} />,
            color: classes.bg
        },
        {
            title: "Poder da IA",
            description: "Converse com o Gemini sobre o clima, peça dicas de segurança e obtenha análises em tempo real do seu ambiente.",
            icon: <div className="relative">
                    <div className="absolute -inset-2 bg-cyan-500/20 rounded-full blur-lg animate-pulse"></div>
                    <SparklesIcon className="w-16 h-16 text-cyan-400 relative z-10" />
                  </div>,
            color: "bg-cyan-600"
        },
        {
            title: "Mapas & Dados",
            description: "Visualize camadas de chuva, vento e temperatura. Alterne entre provedores de dados para máxima precisão.",
            icon: <MapIcon className="w-16 h-16 text-emerald-400" />,
            color: "bg-emerald-600"
        },
        {
            title: "Transparência",
            description: "Projeto Open Source focado em privacidade. Seus dados são seus.",
            customContent: (
                 <div className="mt-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20 animate-enter">
                    <p className="text-xs text-gray-300 leading-relaxed text-center">
                        Ao utilizar o Meteor, você concorda com os <a href="https://policies-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 transition-colors font-semibold">Termos de Uso</a> e <a href="https://policies-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline decoration-cyan-500/30 transition-colors font-semibold">Política de Privacidade</a> da plataforma.
                    </p>
                </div>
            ),
            icon: <FileTextIcon className="w-16 h-16 text-purple-400" />,
            color: "bg-purple-600"
        }
    ];

    const currentSlide = slides[step];

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Background Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Modal Content */}
            <div className={`relative w-full max-w-md ${glassClass} bg-gray-900/90 rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 border border-white/10 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
                
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 flex h-1">
                    {slides.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`flex-1 transition-colors duration-500 ${idx <= step ? currentSlide.color : 'bg-gray-800'}`} 
                        />
                    ))}
                </div>

                <div className="p-8 flex flex-col items-center text-center min-h-[420px]"> 
                    
                    {/* Icon Container with Animation */}
                    <div className="flex-1 flex items-center justify-center py-6 animate-enter-pop" key={step}>
                         <div className="p-6 rounded-full bg-white/5 border border-white/5 shadow-xl relative">
                            {currentSlide.icon}
                         </div>
                    </div>

                    {/* Text Content */}
                    <div className="space-y-4 mb-6 animate-enter w-full" key={`text-${step}`}>
                        <h2 className="text-2xl font-bold text-white tracking-tight">{currentSlide.title}</h2>
                        <p className="text-gray-300 leading-relaxed text-sm">
                            {currentSlide.description}
                        </p>
                        {/* Render custom content safely */}
                        {(currentSlide as any).customContent}
                    </div>

                    {/* Navigation */}
                    <div className="w-full flex items-center justify-between mt-auto pt-2">
                        <button 
                            onClick={() => setStep(prev => Math.max(0, prev - 1))}
                            className={`p-2 rounded-full hover:bg-white/10 transition-opacity ${step === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100 text-gray-400'}`}
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>

                        <div className="flex gap-2">
                            {slides.map((_, idx) => (
                                <div key={idx} className={`w-2 h-2 rounded-full transition-colors duration-300 ${idx === step ? 'bg-white' : 'bg-gray-700'}`} />
                            ))}
                        </div>

                        <button 
                            onClick={handleNext}
                            className={`${currentSlide.color} hover:brightness-110 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg flex items-center gap-2`}
                        >
                            {step === slides.length - 1 ? 'Começar' : 'Próximo'}
                            {step !== slides.length - 1 && <ChevronLeftIcon className="w-4 h-4 rotate-180" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
