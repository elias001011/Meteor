import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeftIcon, FileTextIcon, MapIcon, XIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface OnboardingModalProps {
    onClose: () => void;
}

const slides = [
    {
        eyebrow: 'Bem-vindo',
        title: 'Clima sem ruído.',
        description: 'Previsão, alertas e contexto prático reunidos em uma interface rápida para qualquer tela.',
        icon: 'brand',
    },
    {
        eyebrow: 'Explore',
        title: 'Dados quando você precisa.',
        description: 'Consulte mapas, compare previsões e converse com o Gemini usando o clima da cidade como contexto.',
        icon: 'map',
    },
    {
        eyebrow: 'Privacidade',
        title: 'Você continua no controle.',
        description: 'Preferências e histórico ficam neste dispositivo. Localização e microfone só são usados quando você solicita.',
        icon: 'privacy',
    },
] as const;

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
    const [step, setStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const { classes, isAmoled } = useTheme();

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setIsVisible(true);
            closeButtonRef.current?.focus();
        }, 80);
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    const finish = () => {
        setIsVisible(false);
        window.setTimeout(onClose, 180);
    };

    const next = () => {
        if (step === slides.length - 1) finish();
        else setStep(current => current + 1);
    };

    const slide = slides[step];

    const icon = slide.icon === 'brand'
        ? <img src="/favicon.svg" alt="" className="h-16 w-16" />
        : slide.icon === 'map'
            ? <MapIcon className={`h-14 w-14 ${classes.text}`} />
            : <FileTextIcon className={`h-14 w-14 ${classes.text}`} />;

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-200 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="absolute inset-0 bg-[#010305]/85 backdrop-blur-xl" aria-hidden="true" />

            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="onboarding-title"
                aria-describedby="onboarding-description"
                className={`relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl ${isAmoled ? 'bg-black' : 'bg-[#0b1524]/95'}`}
            >
                <div className="flex gap-1.5 px-6 pt-5" aria-hidden="true">
                    {slides.map((_, index) => (
                        <span key={index} className={`h-1 flex-1 rounded-full transition-colors ${index <= step ? classes.bg : 'bg-white/10'}`} />
                    ))}
                </div>

                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={finish}
                    className="absolute right-5 top-9 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label="Pular apresentação"
                >
                    <XIcon className="h-4 w-4" />
                </button>

                <div className="flex min-h-[430px] flex-col px-7 pb-7 pt-10 sm:px-9 sm:pb-9">
                    <div key={step} className="animate-enter">
                        <div className={`mb-10 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/10 ${isAmoled ? 'bg-white/5' : 'bg-[radial-gradient(circle_at_35%_20%,rgba(56,189,248,0.2),rgba(255,255,255,0.035))]'}`}>
                            {icon}
                        </div>
                        <p className="meteor-eyebrow mb-3">{slide.eyebrow}</p>
                        <h2 id="onboarding-title" className="max-w-xs text-3xl font-black tracking-[-0.045em] text-white">{slide.title}</h2>
                        <p id="onboarding-description" className="mt-4 text-sm leading-6 text-slate-400">{slide.description}</p>

                        {step === slides.length - 1 && (
                            <p className="mt-5 text-xs leading-5 text-slate-500">
                                Ao continuar, você aceita os{' '}
                                <a href="https://policies-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className={`${classes.text} underline underline-offset-4`}>Termos e a Política de Privacidade</a>.
                            </p>
                        )}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-9">
                        <button
                            type="button"
                            onClick={() => setStep(current => Math.max(0, current - 1))}
                            disabled={step === 0}
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:invisible"
                            aria-label="Voltar"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>

                        <span className="text-xs font-bold tabular-nums text-slate-600">{step + 1} / {slides.length}</span>

                        <button type="button" onClick={next} className={`flex h-11 items-center gap-2 rounded-full px-6 text-sm font-black text-white shadow-lg transition hover:brightness-110 ${classes.bg}`}>
                            {step === slides.length - 1 ? 'Começar' : 'Próximo'}
                            {step < slides.length - 1 && <ChevronLeftIcon className="h-4 w-4 rotate-180" />}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default OnboardingModal;
