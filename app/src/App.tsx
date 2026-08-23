import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import { 
  Cloud, Sun, CloudRain, Wind, MapPin, Github, Zap, Map, 
  Thermometer, Droplets, Menu, X, Globe, AlertTriangle, CloudLightning, CloudSnow, 
  CloudFog, Sparkles, ChevronRight, Heart, Cpu, Shield, Mail, Instagram, 
  ChevronDown, XCircle, CheckCircle2, ChevronLeft, Download
} from 'lucide-react';
import './App.css';

gsap.registerPlugin(ScrollTrigger);

const ANDROID_DOWNLOAD_URL = 'https://github.com/elias001011/Meteor/releases/download/android-v1.0.0/Meteor-1.0.0-universal.apk';
const WEB_LEGACY_URL = 'https://meteor-ai.netlify.app';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  wind: number;
  city: string;
  alert?: string;
  weatherCode: number;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
}

interface LightboxProps {
  images: Array<{ src: string; title: string }>;
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

// CURSOR PERSONALIZADO - CORRETO COM MIX-BLEND-MODE
const CustomCursor = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setIsVisible(true);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      const target = e.target as HTMLElement;
      setIsHovering(!!target.closest('button, a, [data-hover="true"], input, textarea, .interactive-card'));
    };
    const handleLeave = () => setIsVisible(false);
    window.addEventListener('mousemove', handleMove);
    document.body.addEventListener('mouseleave', handleLeave);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.body.removeEventListener('mouseleave', handleLeave);
    };
  }, [mouseX, mouseY]);

  if (typeof window !== 'undefined' && window.innerWidth < 1024) return null;

  return (
    <motion.div 
      style={{ x, y }} 
      className="fixed top-0 left-0 z-[9999] pointer-events-none hidden lg:block mix-blend-difference"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
    >
      <motion.div
        animate={{ 
          width: isHovering ? 64 : 40,
          height: isHovering ? 64 : 40,
          opacity: isVisible ? 1 : 0
        }}
        transition={{ type: 'spring', damping: 20, stiffness: 400 }}
        className="flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
      >
        {/* Bola branca - mix-blend-mode: difference inverte as cores automaticamente */}
        <div className="w-full h-full bg-white rounded-full" />
      </motion.div>
    </motion.div>
  );
};

// ANIMAÇÃO DE CHUVA - Apenas nos slides
const RainEffect = ({ active, inSlides }: { active: boolean, inSlides: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<GainNode[]>([]);

  useEffect(() => {
    // Inicializar áudio sintetizado como fallback
    const initSynthAudio = () => {
      if (audioContextRef.current) return;
      
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }).webkitAudioContext;
        if (!AudioContextClass) return;
        const audioContext = new AudioContextClass();
        audioContextRef.current = audioContext;
        gainNodesRef.current = [];
        
        // Criar múltiplos osciladores para simular chuva
        for (let i = 0; i < 4; i++) {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          const filter = audioContext.createBiquadFilter();
          
          osc.type = 'sine';
          osc.frequency.value = 30 + Math.random() * 50; // Frequências baixas
          filter.type = 'lowpass';
          filter.frequency.value = 100 + Math.random() * 80;
          
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(audioContext.destination);
          
          gain.gain.value = 0;
          osc.start();
          gainNodesRef.current.push(gain);
        }
      } catch {
        console.log('AudioContext não disponível');
      }
    };

    // Tentar carregar áudio externo
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.15;
      // Usar um som de chuva de boa qualidade
      audioRef.current.src = 'https://assets.mixkit.co/active_storage/sfx/2401/2401-preview.mp3';
    }

    const playAudio = () => {
      if (active && inSlides) {
        // Tentar tocar áudio externo
        if (audioRef.current) {
          audioRef.current.play().catch(() => {
            // Se falhar, usar sintetizado
            initSynthAudio();
            if (audioContextRef.current && gainNodesRef.current.length > 0) {
              gainNodesRef.current.forEach(gain => {
                gain.gain.setValueAtTime(0.03, audioContextRef.current!.currentTime);
              });
            }
          });
        } else {
          initSynthAudio();
          if (audioContextRef.current && gainNodesRef.current.length > 0) {
            gainNodesRef.current.forEach(gain => {
              gain.gain.setValueAtTime(0.03, audioContextRef.current!.currentTime);
            });
          }
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        if (audioContextRef.current && gainNodesRef.current.length > 0) {
          gainNodesRef.current.forEach(gain => {
            gain.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
          });
        }
      }
    };

    playAudio();
  }, [active, inSlides]);

  
  useEffect(() => {
    if (!active || !inSlides || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const drops: Array<{ x: number; y: number; speed: number; length: number }> = [];
    for (let i = 0; i < 80; i++) {
      drops.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: 8 + Math.random() * 12,
        length: 15 + Math.random() * 25
      });
    }
    
    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1.5;
      
      drops.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + 1, drop.y + drop.length);
        ctx.stroke();
        
        drop.y += drop.speed;
        drop.x += 0.5;
        if (drop.y > canvas.height) {
          drop.y = -drop.length;
          drop.x = Math.random() * canvas.width;
        }
      });
      
      animationId = requestAnimationFrame(animate);
    };
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, inSlides]);
  
  if (!active || !inSlides) return null;
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[5]" />;
};

// LOGO METEOR
const MeteorIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.94 14.32c.32-.08.66-.03.94.13.32.18.58.49.73.85.14.36.14.76 0 1.12-.15.35-.4.66-.73.84-.28.16-.62.21-.94.13l-2.42-.64-2.42.64c-.32.08-.66-.03-.94-.13-.32-.18-.58-.49-.73-.85-.14-.36-.14-.76 0 1.12.15-.35.4-.66.73-.84.28-.16.62.21.94-.13l2.42.64Z"/>
    <path d="M19.03 5.27c.32-.08.66-.03.94.13.32.18.58.49.73.85.14.36.14.76 0 1.12-.15.35-.4.66-.73.84-.28.16-.62.21-.94.13l-2.42-.64-2.42.64c-.32.08-.66-.03-.94-.13-.32-.18-.58-.49-.73-.85-.14-.36-.14-.76 0 1.12.15-.35.4-.66.73-.84.28-.16.62.21.94-.13l2.42.64Z"/>
    <path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/>
    <path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
  </svg>
);

// Typewriter
const TypewriterText = ({ text, className = "" }: { text: string, className?: string }) => {
  const [displayText, setDisplayText] = useState("");
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= text.length) { setDisplayText(text.slice(0, i)); i++; }
      else clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [text]);
  return <span className={className}>{displayText}<span className="animate-pulse">|</span></span>;
};

// Lightbox com animações completas
const Lightbox = ({ images, currentIndex, onClose, onNext, onPrev }: LightboxProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10 transition-colors"
        >
          <X className="w-8 h-8" />
        </motion.button>
        
        <motion.button 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          onClick={(e) => { e.stopPropagation(); onPrev(); }} 
          className="absolute left-4 p-3 text-white/70 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-all"
        >
          <ChevronLeft className="w-8 h-8" />
        </motion.button>
        
        <motion.div 
          key={currentIndex}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="max-w-5xl max-h-[80vh] px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <img src={images[currentIndex].src} alt={images[currentIndex].title} className="max-w-full max-h-[70vh] object-contain rounded-lg" />
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center text-white mt-4 text-lg font-medium"
          >
            {images[currentIndex].title}
          </motion.p>
          <p className="text-center text-white/50 text-sm">{currentIndex + 1} / {images.length}</p>
        </motion.div>
        
        <motion.button 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          onClick={(e) => { e.stopPropagation(); onNext(); }} 
          className="absolute right-4 p-3 text-white/70 hover:text-white bg-white/10 rounded-full hover:bg-white/20 transition-all"
        >
          <ChevronRight className="w-8 h-8" />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

// Weather Hook
const useWeather = () => {
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cities = [
      { name: 'Porto Alegre', lat: -30.0331, lon: -51.2300 },
      { name: 'Caxias do Sul', lat: -29.1678, lon: -51.1794 },
      { name: 'Pelotas', lat: -31.7719, lon: -52.3425 },
      { name: 'Santa Maria', lat: -29.6842, lon: -53.8069 },
      { name: 'Passo Fundo', lat: -28.2622, lon: -52.4092 },
      { name: 'Gramado', lat: -29.3789, lon: -50.8760 },
      { name: 'Bento Gonçalves', lat: -29.1707, lon: -51.5186 },
    ];

    const fetchAll = async () => {
      const results: Record<string, WeatherData> = {};
      for (const city of cities) {
        try {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=America/Sao_Paulo`);
          if (!res.ok) continue;
          const data = await res.json() as OpenMeteoResponse;
          const codes: Record<number, string> = { 0: 'Céu Limpo', 1: 'Parcialmente Limpo', 2: 'Parcialmente Nublado', 3: 'Nublado', 45: 'Nevoeiro', 48: 'Nevoeiro', 51: 'Garoa', 53: 'Garoa', 55: 'Garoa Intensa', 61: 'Chuva', 63: 'Chuva', 65: 'Chuva Intensa', 71: 'Neve', 73: 'Neve', 75: 'Neve Intensa', 95: 'Tempestade', 96: 'Tempestade com granizo', 99: 'Tempestade forte' };
          const code = data.current.weather_code;
          const temp = Math.round(data.current.temperature_2m);
          let alert = undefined;
          if (code >= 95) alert = 'Tempestade';
          else if (code >= 65) alert = 'Chuva Intensa';
          else if (temp >= 35) alert = 'Onda de Calor';
          else if (temp <= 5) alert = 'Frio Intenso';
          results[city.name] = { temp, condition: codes[code] || 'Variável', humidity: data.current.relative_humidity_2m, wind: Math.round(data.current.wind_speed_10m), city: city.name, weatherCode: code, alert };
        } catch {
          // Mantém os cartões já carregados quando uma cidade falha isoladamente.
        }
      }
      setWeatherData(results);
      setLoading(false);
    };
    fetchAll();
    const interval = setInterval(fetchAll, 600000);
    return () => clearInterval(interval);
  }, []);

  return { weatherData, loading };
};

// Weather Card
const WeatherCardPremium = ({ data }: { data?: WeatherData }) => {
  if (!data) return null;
  const getIcon = (code: number) => {
    if (code <= 1) return <Sun className="w-8 h-8" />;
    if (code <= 3) return <Cloud className="w-8 h-8" />;
    if (code <= 48) return <CloudFog className="w-8 h-8" />;
    if (code <= 67) return <CloudRain className="w-8 h-8" />;
    if (code <= 77) return <CloudSnow className="w-8 h-8" />;
    if (code <= 99) return <CloudLightning className="w-8 h-8" />;
    return <Cloud className="w-8 h-8" />;
  };
  const getGradient = (code: number) => {
    if (code >= 95) return 'from-slate-600 to-slate-700';
    if (code >= 51) return 'from-blue-600 to-blue-700';
    if (code >= 1) return 'from-emerald-600 to-emerald-700';
    return 'from-amber-500 to-orange-600';
  };
  return (
    <motion.div 
      whileHover={{ scale: 1.05, rotateY: 5 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`interactive-card bg-gradient-to-br ${getGradient(data.weatherCode)} text-white rounded-3xl p-6 shadow-2xl w-full max-w-[260px]`}
    >
      <div className="flex items-center justify-between mb-4"><div><p className="text-lg font-bold">{data.city}</p><p className="text-xs opacity-75">{data.condition}</p></div>{getIcon(data.weatherCode)}</div>
      <div className="text-5xl font-black mb-2">{data.temp}°</div>
      <div className="flex gap-4 text-sm opacity-80"><span className="flex items-center gap-1"><Droplets className="w-4 h-4" /> {data.humidity}%</span><span className="flex items-center gap-1"><Wind className="w-4 h-4" /> {data.wind}km/h</span></div>
      {data.alert && <div className="mt-4 bg-white/20 rounded-xl px-3 py-2 text-sm font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {data.alert}</div>}
    </motion.div>
  );
};

// Navbar
const NavBar = ({ rainEnabled, setRainEnabled }: { rainEnabled: boolean, setRainEnabled: (v: boolean) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { 
    const handleScroll = () => setScrolled(window.scrollY > 50); 
    window.addEventListener('scroll', handleScroll, { passive: true }); 
    return () => window.removeEventListener('scroll', handleScroll); 
  }, []);
  
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offset = window.innerWidth < 1024 ? 100 : 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const targetPosition = elementPosition - offset;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
  };
  
  const navLinks = [{ href: '#hero', label: 'Início' }, { href: '#tragedy', label: 'A Tragédia' }, { href: '#rsalerta', label: 'RSAlerta' }, { href: '#meteor', label: 'Meteor' }, { href: '#download', label: 'Download' }, { href: '#more-info', label: 'Sobre' }];
  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 flex flex-col items-center pointer-events-none transition-all duration-300 ${scrolled ? 'p-4' : 'p-0'}`}>
        <motion.div 
          animate={{ 
            width: scrolled ? '96%' : '100%',
            maxWidth: scrolled ? '1400px' : '100%',
            marginTop: scrolled ? '8px' : '0px',
            borderRadius: scrolled ? '12px' : '0px',
            backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0)',
            backdropFilter: scrolled ? 'blur(12px)' : 'blur(0px)',
            boxShadow: scrolled ? '0 10px 30px rgba(0,0,0,0.1)' : 'none',
            paddingLeft: scrolled ? '24px' : '32px',
            paddingRight: scrolled ? '24px' : '32px',
          }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeInOut' }}
          className="pointer-events-auto flex items-center justify-between h-11 lg:h-12 w-full border-white/10"
        >
          <a href="#hero" onClick={(e) => handleNavClick(e, '#hero')} className={`flex items-center gap-2 font-bold text-lg lg:text-xl transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
            <MeteorIcon className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-500" /><span>Meteor</span>
          </a>
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className={`text-sm font-medium transition-colors hover:text-emerald-500 ${scrolled ? 'text-gray-600' : 'text-white/80'}`}>{link.label}</a>)}
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRainEnabled(!rainEnabled)} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md border ${rainEnabled ? 'bg-emerald-500 border-emerald-500 text-white' : scrolled ? 'bg-gray-800 border-gray-800 text-white hover:bg-gray-700' : 'bg-white/20 backdrop-blur-sm border-white/50 text-white hover:bg-white/30'}`}
            >
              <CloudRain className="w-3.5 h-3.5" />{rainEnabled ? 'Chuva ON' : 'Chuva OFF'}
            </motion.button>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href={ANDROID_DOWNLOAD_URL}
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md"
            >
              <Download className="w-3.5 h-3.5" />Baixar Android
            </motion.a>
          </div>
          <button className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-gray-900' : 'text-white'}`} onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </motion.div>

        {/* Menu Mobile em Expansão Vertical */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0, transformOrigin: 'top' }}
              animate={{ 
                opacity: 1, 
                scaleY: 1,
              }}
              exit={{ opacity: 0, scaleY: 0, transformOrigin: 'top' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`pointer-events-auto bg-white shadow-xl border border-gray-100 rounded-2xl lg:hidden ${
                scrolled ? 'w-[96%] max-w-[1400px] mx-auto mt-2' : 'w-full'
              }`}
            >
              <div className="p-6 flex flex-col gap-1">
                {navLinks.map((link, i) => (
                  <motion.a 
                    key={link.href} 
                    href={link.href} 
                    onClick={(e) => {
                      handleNavClick(e, link.href);
                      setIsOpen(false);
                    }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="py-3 px-4 text-gray-900 font-bold hover:bg-emerald-50 rounded-xl transition-colors flex items-center justify-between group"
                  >
                    {link.label}
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </motion.a>
                ))}
                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl flex flex-col gap-3">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-900">Efeito de Chuva</span>
                      <button 
                        onClick={() => setRainEnabled(!rainEnabled)}
                        className={`px-4 py-2 rounded-full text-xs font-black transition-all ${rainEnabled ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-200'}`}
                      >
                        {rainEnabled ? 'LIGADO' : 'DESLIGADO'}
                      </button>
                   </div>
                   <motion.a 
                    href={ANDROID_DOWNLOAD_URL}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-200"
                  >
                    <Download className="w-4 h-4" />Baixar Android v1
                    </motion.a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

function App() {
  const mainRef = useRef<HTMLDivElement>(null);
  const { weatherData, loading } = useWeather();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [rainEnabled, setRainEnabled] = useState(false);
  const [inSlides, setInSlides] = useState(false);

  // Hero + 8 slides (índice 0 = hero, 1-8 = slides)
  const bgImages = ['/hero_day_valley.jpg', '/scene_sun_cloud.jpg', '/scene_storm.jpg', '/scene_night_stars.jpg', '/scene_city_dusk.jpg', '/scene_forest_mist.jpg', '/scene_rain_valley.jpg', '/scene_snow_mountain.jpg', '/scene_tree.jpg'];
  const allScreenshots = useMemo(() => [{ src: '/screenshots/BoasVindasMeteor.png', title: 'Boas-vindas' }, { src: '/screenshots/ClimaPágina.png', title: 'Previsão' }, { src: '/screenshots/ConversaçãoIA.png', title: 'Meteor AI' }, { src: '/screenshots/Mapa.png', title: 'Mapas' }, { src: '/screenshots/Alertas-Meteor.png', title: 'Alertas' }, { src: '/screenshots/BoasVindasIA.png', title: 'IA' }, { src: '/screenshots/ConfiguraçõesVisuais.png', title: 'Configurações' }, { src: '/screenshots/Dicas-Meteor.png', title: 'Dicas' }, { src: '/screenshots/PopUPDetalhadoSobreClima.png', title: 'Detalhes' }, { src: '/screenshots/ZenMode1.png', title: 'Zen' }, { src: '/screenshots/ZenMode2.png', title: 'Zen Noite' }, { src: '/screenshots/AbadeNotícias.png', title: 'Notícias' }, { src: '/screenshots/TelaInicialRSALERTA.png', title: 'RSAlerta' }, { src: '/screenshots/RSALERTATELA2.png', title: 'RSAlerta 2' }, { src: '/screenshots/DicasDeSustentabilidadeRSALERTA.png', title: 'RSAlerta Dicas' }], []);

  const slides = useMemo(() => [
    { id: 'tragedy', label: 'A Tragédia', title: 'A maior catástrofe climática do RS', desc: 'Em maio de 2024, o Rio Grande do Sul enfrentou seu maior desastre climático. 183 mortes confirmadas, 25 desaparecidos, 540 mil desalojados. 478 municípios atingidos de 497 totais. O bloqueio atmosférico no Pacífico Sul, combinado ao El Niño, trouxe chuvas torrenciais sem precedentes desde 1910.', city: 'Porto Alegre', stats: [{ icon: AlertTriangle, value: '183', label: 'Mortes', color: 'text-red-400' }, { icon: MapPin, value: '540mil', label: 'Desalojados', color: 'text-blue-400' }, { icon: Map, value: '478', label: 'Cidades', color: 'text-emerald-400' }] },
    { id: 'rsalerta', label: 'RSAlerta', title: 'O início da jornada', desc: 'O RSAlerta nasceu da Mostra Científica da Escola Estadual Dr. Aldo Conte em 2024, como resposta imediata às enchentes. Uma plataforma básica de alertas desenvolvida por estudantes para proteger sua comunidade.', city: 'Caxias do Sul', features: ['Alertas básicos', 'Notícias integradas', 'Dicas de segurança', 'Interface simples'] },
    { id: 'limitation', label: 'Limitações', title: 'As barreiras do RSAlerta', desc: 'Sem IA generativa, sem mapas interativos, sem previsão horária detalhada. A interface era limitada, as informações não eram contextualizadas, e o sistema não conseguia antecipar eventos com precisão.', city: 'Pelotas', stats: [{ icon: XCircle, value: 'Sem IA', label: 'Gen.', color: 'text-gray-400' }, { icon: XCircle, value: 'Sem Mapa', label: 'Interativo', color: 'text-gray-400' }, { icon: XCircle, value: 'Básico', label: 'Visual', color: 'text-gray-400' }] },
    { id: 'meteor', label: 'Meteor', title: 'Clima nativo no Android', desc: 'O Meteor agora tem um aplicativo Flutter oficial com Material 3, tema AMOLED, mapas, notícias e IA contextual. As credenciais sensíveis permanecem no backend e nunca são embarcadas no APK.', city: 'Santa Maria', features: ['Flutter + Material 3', 'IA Contextual', 'Mapas Interativos', 'Tema AMOLED'] },
    { id: 'porque', label: 'Por que Meteor?', title: 'Informação que ajuda a decidir', desc: 'Previsões horárias e diárias, métricas detalhadas e insights explicáveis transformam dados meteorológicos em orientações práticas. O projeto continua gratuito e aberto.', city: 'Passo Fundo', stats: [{ icon: CheckCircle2, value: '100%', label: 'Gratuito', color: 'text-emerald-400' }, { icon: CheckCircle2, value: '24/7', label: 'Disponível', color: 'text-emerald-400' }, { icon: CheckCircle2, value: 'Open', label: 'Source', color: 'text-emerald-400' }] },
    { id: 'alertas', label: 'Alertas', title: 'Você escolhe quando ser avisado', desc: 'No Android, notificações opt-in cobrem eventos severos, chuva próxima e resumo diário. Horário de silêncio, preferências individuais e deduplicação evitam alertas repetitivos.', city: 'Gramado', features: ['Push opt-in', 'Resumo diário', 'Horário de silêncio', 'Preferências por alerta'] },
    { id: 'futuro', label: 'O Futuro', title: 'A v1 é só o começo', desc: 'O aplicativo Android inaugura a nova fase do Meteor. A versão web exibida nesta página é legada e será reconstruída com uma experiência alinhada ao app Flutter.', city: 'Bento Gonçalves', stats: [{ icon: Zap, value: 'v1', label: 'Android', color: 'text-amber-400' }, { icon: Shield, value: 'FCM', label: 'Push', color: 'text-blue-400' }, { icon: Globe, value: 'Web', label: 'Em evolução', color: 'text-green-400' }] },
    { id: 'download', label: 'Download', title: 'Meteor Android v1', desc: 'Baixe o APK oficial assinado para Android. A versão web permanece disponível como legado enquanto uma nova experiência está em desenvolvimento.', city: 'Porto Alegre', download: true },
  ], []);

  // Detectar quando mostrar a chuva
  // Hero (100vh) + 8 slides pinned (~220vh cada) = ~18 viewports total
  // Para antes dos botões de download (aproximadamente no final do slide 8)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      // Para no final do slide Download, antes dos botões de download
      const rainShouldShow = scrollY < (windowHeight * 18.5);
      setInSlides(rainShouldShow);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-content', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: 'power3.out' });
      
      slides.forEach((_slide, index) => {
        const sectionEl = document.querySelector(`.slide-${index}`);
        const leftEl = document.querySelector(`.slide-${index}-left`);
        const rightEl = document.querySelector(`.slide-${index}-right`);
        
        if (!sectionEl) return;
        
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionEl,
            start: 'top top',
            end: '+=120%',
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
          }
        });
        
        tl.fromTo(leftEl, { x: index % 2 === 0 ? -100 : 100, opacity: 0 }, { x: 0, opacity: 1, ease: 'power2.out', duration: 0.3 }, 0);
        tl.fromTo(rightEl, { x: index % 2 === 0 ? 100 : -100, opacity: 0 }, { x: 0, opacity: 1, ease: 'power2.out', duration: 0.3 }, 0.1);
        tl.to(leftEl, { x: index % 2 === 0 ? -50 : 50, opacity: 0, ease: 'power2.in', duration: 0.2 }, 0.8);
        tl.to(rightEl, { x: index % 2 === 0 ? 50 : -50, opacity: 0, ease: 'power2.in', duration: 0.2 }, 0.8);
      });

      gsap.utils.toArray<HTMLElement>('.animate-on-scroll').forEach((el) => { 
        gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, scrollTrigger: { trigger: el, start: 'top 85%' }}); 
      });
    }, mainRef);

    return () => ctx.revert();
  }, [slides]);

  const openLightbox = (index: number) => { setCurrentImageIndex(index); setLightboxOpen(true); };
  const nextImage = useCallback(() => setCurrentImageIndex((prev) => (prev + 1) % allScreenshots.length), [allScreenshots.length]);
  const prevImage = useCallback(() => setCurrentImageIndex((prev) => (prev - 1 + allScreenshots.length) % allScreenshots.length), [allScreenshots.length]);

  return (
    <div ref={mainRef} className="bg-white">
      <CustomCursor />
      <RainEffect active={rainEnabled} inSlides={inSlides} />
      <NavBar rainEnabled={rainEnabled} setRainEnabled={setRainEnabled} />
      
      {lightboxOpen && <Lightbox images={allScreenshots} currentIndex={currentImageIndex} onClose={() => setLightboxOpen(false)} onNext={nextImage} onPrev={prevImage} />}
      
      {/* HERO */}
      <section id="hero" className="relative min-h-screen w-full overflow-hidden">
        <img src={bgImages[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-20">
            <div className="hero-content">
              {/* DESKTOP */}
              <div className="hidden lg:block max-w-2xl">
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="bg-white/95 backdrop-blur-md rounded-3xl p-10 shadow-2xl border border-white/20 interactive-card"
                >
                  <p className="text-emerald-600 font-mono text-sm tracking-[0.3em] uppercase mb-6">Inteligência Climática</p>
                  <h1 className="font-display text-5xl lg:text-6xl font-black text-gray-900 mb-4 leading-[1.05]">
                    <TypewriterText text="Previsões precisas," /><br />
                    <span className="text-emerald-700 font-serif italic">proteção real.</span>
                  </h1>
                  <p className="text-gray-700 text-lg mb-8 max-w-lg leading-relaxed">
                    Dados meteorológicos em tempo real com IA generativa para proteger 
                    o Rio Grande do Sul contra eventos climáticos extremos.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <motion.a 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={ANDROID_DOWNLOAD_URL}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-lg"
                    >
                      <Download className="w-5 h-5" />Baixar Android v1
                    </motion.a>
                    <motion.a 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={WEB_LEGACY_URL}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gray-100 text-gray-800 font-bold hover:bg-gray-200 transition-all"
                    >
                      <Globe className="w-5 h-5" />Web Legacy
                    </motion.a>
                  </div>
                </motion.div>
              </div>
              {/* MOBILE */}
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="lg:hidden text-center text-white pt-16"
              >
                <p className="text-emerald-400 font-mono text-sm tracking-[0.3em] uppercase mb-4">Inteligência Climática</p>
                <h1 className="font-display text-4xl sm:text-5xl font-black mb-4 leading-[1.05]">
                  <TypewriterText text="Previsões precisas," /><br />
                  <span className="text-emerald-400 font-serif italic">proteção real.</span>
                </h1>
                <p className="text-white/90 text-lg mb-8 max-w-md mx-auto">Dados meteorológicos com IA para proteger o RS contra eventos climáticos extremos.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <motion.a 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={ANDROID_DOWNLOAD_URL}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-emerald-600 text-white font-bold"
                  >
                    <Download className="w-5 h-5" />Baixar Android v1
                  </motion.a>
                  <motion.a 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href={WEB_LEGACY_URL}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/20 text-white font-bold backdrop-blur-sm border border-white/30"
                  >
                    <Globe className="w-5 h-5" />Web Legacy
                  </motion.a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        {/* Explore centralizado */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-white/80"
        >
          <span className="text-xs uppercase tracking-wider font-medium">Explore</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </section>

      {/* SLIDES 2-8 */}
      {slides.map((slide, index) => (
        <section key={slide.id} id={slide.id} className={`slide-${index} relative h-screen w-full overflow-hidden`}>
          <img src={bgImages[index + 1]} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80" />
          <div className="relative z-10 h-full flex items-center">
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
                <div className={`slide-${index}-left text-white ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <p className="text-emerald-400 font-mono text-xs sm:text-sm tracking-[0.3em] uppercase mb-2 sm:mb-4">{slide.label}</p>
                  <h2 className="font-display text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-6 leading-[1.1]">{slide.title}</h2>
                  <p className="text-white/90 text-base sm:text-lg mb-6 sm:mb-8 max-w-lg leading-relaxed">{slide.desc}</p>
                  {slide.stats && (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-md">
                      {slide.stats.map((stat, i: number) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ scale: 1.1, y: -5 }}
                          className="interactive-card bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-2 sm:p-4 border border-white/20 text-center cursor-pointer"
                        >
                          <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                          <div className="text-lg sm:text-2xl font-black text-white">{stat.value}</div>
                          <div className="text-[10px] sm:text-xs text-white/70">{stat.label}</div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {slide.features && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md">
                      {slide.features.map((feat: string, i: number) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ scale: 1.05, x: 5 }}
                          className="interactive-card flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-white/10 cursor-pointer"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-xs sm:text-sm font-medium">{feat}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
                <div className={`slide-${index}-right ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="hidden lg:flex justify-center">{!loading && weatherData[slide.city] && <WeatherCardPremium data={weatherData[slide.city]} />}</div>
                  <div className="lg:hidden flex justify-center mt-8">{!loading && weatherData[slide.city] && <WeatherCardPremium data={weatherData[slide.city]} />}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CARD DOWNLOADS */}
      <section id="download-cards" className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-16">
            <p className="text-emerald-600 font-mono text-xs sm:text-sm tracking-[0.3em] uppercase mb-2 sm:mb-4">Download</p>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-white">Escolha sua plataforma</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              { href: ANDROID_DOWNLOAD_URL, icon: Download, title: "Meteor Android v1", desc: "Aplicativo Flutter oficial e assinado", color: "from-emerald-500 to-teal-700", badge: "PRINCIPAL", border: false },
              { href: WEB_LEGACY_URL, icon: Globe, title: "Meteor Web Legacy", desc: "Nova versão web em desenvolvimento", color: "from-gray-700 to-gray-900", badge: "LEGACY", border: true }
            ].map((card, i) => (
              <motion.a 
                key={i}
                whileHover={{ y: -12, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={card.href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`interactive-card group relative bg-gradient-to-br ${card.color} rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white ${card.border ? 'border border-gray-600' : ''} overflow-hidden`}
              >
                {card.badge && <div className="absolute top-2 right-2 bg-white/20 px-2 py-0.5 rounded text-xs font-bold">{card.badge}</div>}
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <card.icon className="w-8 sm:w-10 h-8 sm:h-10 mb-3 sm:mb-4" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">{card.title}</h3>
                <p className="text-white/80 text-xs sm:text-sm mb-3 sm:mb-4">{card.desc}</p>
                <span className="inline-flex items-center text-sm font-medium group-hover:gap-2 transition-all">
                  Acessar <ChevronRight className="w-4 h-4 ml-1" />
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section id="comparison" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-on-scroll text-center max-w-3xl mx-auto mb-8 sm:mb-16">
            <p className="text-emerald-600 font-mono text-xs sm:text-sm tracking-[0.3em] uppercase mb-2 sm:mb-4">Evolução</p>
            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black text-gray-900 mb-4 sm:mb-6">RSAlerta vs Meteor</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-16">
            <motion.div 
              whileHover={{ scale: 1.03, y: -10 }}
              className="animate-on-scroll interactive-card group cursor-pointer" 
              onClick={() => openLightbox(12)}
            >
              <p className="text-center text-gray-500 font-bold mb-4 uppercase tracking-wider">RSAlerta (2024)</p>
              <div className="bg-white rounded-3xl p-4 shadow-xl overflow-hidden group-hover:shadow-2xl transition-shadow">
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src="/screenshots/TelaInicialRSALERTA.png" 
                  alt="RSAlerta" 
                  className="w-full rounded-2xl" 
                />
              </div>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.03, y: -10 }}
              className="animate-on-scroll interactive-card group cursor-pointer" 
              onClick={() => openLightbox(0)}
            >
              <p className="text-center text-emerald-600 font-bold mb-4 uppercase tracking-wider">Meteor Web Legacy (2025)</p>
              <div className="bg-white rounded-3xl p-4 shadow-xl ring-2 ring-emerald-500/20 overflow-hidden group-hover:shadow-2xl transition-shadow">
                <motion.img 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  src="/screenshots/BoasVindasMeteor.png" 
                  alt="Meteor" 
                  className="w-full rounded-2xl" 
                />
              </div>
            </motion.div>
          </div>
          <div className="animate-on-scroll bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-8 sm:mb-16">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-black text-gray-900 uppercase">Funcionalidade</th>
                    <th className="px-6 py-5 text-center text-sm font-black text-gray-500 uppercase">RSAlerta</th>
                    <th className="px-6 py-5 text-center text-sm font-black text-emerald-600 uppercase">Meteor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {['Interface Moderna', 'IA contextual (Gemini)', 'Mapas Interativos', 'Previsão Horária e Diária', 'Aplicativo Flutter oficial', 'Notícias Integradas', 'Tema AMOLED', 'Alertas push opt-in', 'Backend sem chaves no APK', 'Código aberto'].map((feature, i) => (
                    <motion.tr 
                      key={i} 
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      className="transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{feature}</td>
                      <td className="px-6 py-4 text-center">{i === 5 ? <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" /> : <XCircle className="w-5 h-5 text-gray-300 mx-auto" />}</td>
                      <td className="px-6 py-4 text-center"><CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="animate-on-scroll">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 text-center mb-2">Galeria do Meteor Web Legacy</h3>
            <p className="text-center text-gray-500 mb-6 sm:mb-8">Screenshots preservadas da versão web anterior. Uma nova experiência está em desenvolvimento.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4">
              {allScreenshots.map((shot, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -10, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="interactive-card group cursor-pointer" 
                  onClick={() => openLightbox(i)}
                >
                  <div className="bg-white rounded-2xl p-2 shadow-lg hover:shadow-xl transition-all overflow-hidden">
                    <motion.img 
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                      src={shot.src} 
                      alt={shot.title} 
                      className="w-full rounded-xl aspect-[9/16] object-cover" 
                    />
                    <p className="text-center text-xs font-bold text-gray-700 mt-2 truncate px-1">{shot.title}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MORE INFO */}
      <section id="more-info" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="animate-on-scroll text-center max-w-3xl mx-auto mb-16">
            <p className="text-emerald-600 font-mono text-sm tracking-[0.3em] uppercase mb-4">Recursos</p>
            <h2 className="font-display text-4xl font-black text-gray-900 mb-6">Tudo o que você precisa</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-4xl mx-auto">
            <motion.div 
              whileHover={{ y: -12, scale: 1.02, rotateX: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="interactive-card animate-on-scroll bg-gradient-to-br from-emerald-50 to-green-50 rounded-3xl p-8 border border-emerald-100 shadow-lg hover:shadow-2xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mb-6 mx-auto">
                <Thermometer className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-4 text-center">Previsão Avançada</h3>
              <ul className="space-y-3">
                {['Previsão Horária & Diária completa', 'Múltiplas fontes com fallback', 'Qualidade do Ar em tempo real', 'Animações de chuva calibradas'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    </motion.div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              whileHover={{ y: -12, scale: 1.02, rotateX: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="interactive-card animate-on-scroll bg-gradient-to-br from-violet-50 to-purple-50 rounded-3xl p-8 border border-violet-100 shadow-lg hover:shadow-2xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center mb-6 mx-auto">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-4 text-center">Experiência Imersiva</h3>
              <ul className="space-y-3">
                {['Material 3 no Android', 'Tema AMOLED', 'Cards e navegação nativos', 'Preferências locais'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <motion.div whileHover={{ scale: 1.2, rotate: 10 }}>
                      <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                    </motion.div>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Open Source - Interativo */}
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="animate-on-scroll bg-gray-900 rounded-3xl p-8 lg:p-12 mb-12 interactive-card"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 text-emerald-400 text-xs font-black uppercase tracking-wider mb-4">
                  <Github className="w-4 h-4" />Open Source
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Código aberto</h3>
                <p className="text-gray-400 mb-6">Desenvolvido publicamente no GitHub. Contribuições são bem-vindas!</p>
                <motion.a 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href="https://github.com/elias001011/Meteor" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-900 font-bold hover:bg-gray-100 transition-all"
                >
                  <Github className="w-5 h-5" />Ver no GitHub
                </motion.a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Cpu, label: 'React 19', color: 'text-green-400', desc: 'v19.0' },
                  { icon: Sparkles, label: 'Gemini AI', color: 'text-violet-400', desc: 'Server-side' },
                  { icon: Shield, label: 'MIT License', color: 'text-blue-400', desc: 'Open Source' },
                  { icon: Heart, label: 'Feito no RS', color: 'text-rose-400', desc: 'Brasil' }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ scale: 1.1, y: -5, rotateY: 10 }}
                    whileTap={{ scale: 0.95 }}
                    className="interactive-card bg-gray-800 rounded-2xl p-5 text-center hover:bg-gray-700 transition-colors cursor-pointer group"
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                    >
                      <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                    </motion.div>
                    <div className="text-lg font-bold text-white">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CONTATO */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h3 className="font-display text-3xl lg:text-4xl font-black text-white mb-4">Entre em contato</h3>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">Tem dúvidas, sugestões ou quer contribuir? Fale conosco!</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="mailto:elias.juriatti@outlook.com" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all interactive-card"
            >
              <Mail className="w-5 h-5" />elias.juriatti@outlook.com
            </motion.a>
            <motion.a 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              href="https://instagram.com/elias_jrnunes" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gray-800 text-white font-bold hover:bg-gray-700 transition-all interactive-card"
            >
              <Instagram className="w-5 h-5" />@elias_jrnunes
            </motion.a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <MeteorIcon className="w-8 h-8 text-emerald-500" />
                <span className="font-bold text-2xl text-white">Meteor</span>
              </div>
              <p className="text-gray-500 text-sm mb-4">Inteligência climática potencializada por IA. Desenvolvido para o Rio Grande do Sul.</p>
              <div className="flex gap-3">
                {[
                  { href: "https://github.com/elias001011/Meteor", icon: Github },
                  { href: "https://instagram.com/elias_jrnunes", icon: Instagram },
                  { href: "mailto:elias.juriatti@outlook.com", icon: Mail }
                ].map((social, i) => (
                  <motion.a 
                    key={i}
                    whileHover={{ scale: 1.2, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    href={social.href}
                    target={social.href.startsWith('mailto') ? undefined : "_blank"}
                    rel={social.href.startsWith('mailto') ? undefined : "noopener noreferrer"}
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all interactive-card"
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <motion.li whileHover={{ x: 3 }} className="transition-transform">
                  <a href={ANDROID_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Android v1</a>
                </motion.li>
                <motion.li whileHover={{ x: 3 }} className="transition-transform">
                  <a href={WEB_LEGACY_URL} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Web Legacy</a>
                </motion.li>
                <motion.li whileHover={{ x: 3 }} className="transition-transform">
                  <a href="https://github.com/elias001011/Meteor/releases/tag/android-v1.0.0" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Notas da versão</a>
                </motion.li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Desenvolvedores</h4>
              <ul className="space-y-2 text-sm">
                <motion.li whileHover={{ x: 3 }} className="transition-transform">
                  <a href="https://github.com/elias001011/Meteor" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">GitHub</a>
                </motion.li>
                <motion.li whileHover={{ x: 3 }} className="transition-transform">
                  <a href="https://github.com/elias001011/Meteor#readme" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Documentação</a>
                </motion.li>
                <motion.li whileHover={{ x: 3 }} className="transition-transform">
                  <a href="https://github.com/elias001011/Meteor/issues" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Reportar Bug</a>
                </motion.li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <motion.li whileHover={{ x: 3 }} className="transition-transform">
                  <a href="https://policies-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Privacidade</a>
                </motion.li>
                <motion.li whileHover={{ x: 3 }} className="transition-transform">
                  <a href="https://policies-meteor-ai.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Termos de Uso</a>
                </motion.li>
                <motion.li whileHover={{ x: 3 }} className="transition-transform">
                  <a href="https://github.com/elias001011/Meteor/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Licença MIT</a>
                </motion.li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-600 text-sm">© 2024-2026 Meteor. Desenvolvido por <a href="https://instagram.com/elias_jrnunes" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white">@elias_jrnunes</a></p>
            <p className="text-gray-600 text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />Dados: Open-Meteo API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
