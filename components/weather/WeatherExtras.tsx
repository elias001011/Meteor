

import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { getSettings } from '../../services/settingsService';
import type { WeatherData, ExtrasData } from '../../types';
import { fetchExtrasData } from '../../services/weatherService';
import { SunIcon, WindIcon, EyeIcon, ChevronLeftIcon, ThermometerIcon, CloudIcon } from '../icons';
import ForecastDetailModal from './ForecastDetailModal';

// Icons
const BugIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>;
const ShieldIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>;
const FlowerIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 1 4.5-4.5M7.5 12A4.5 4.5 0 1 0 12 16.5M7.5 12H9m3 4.5a4.5 4.5 0 1 1-4.5-4.5M12 16.5A4.5 4.5 0 1 0 16.5 12M12 16.5V15m4.5-3a4.5 4.5 0 1 1-4.5 4.5M16.5 12A4.5 4.5 0 1 0 12 7.5M16.5 12H15"/></svg>;
const VirusIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12h2"/><path d="M20 12h2"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="m4.93 19.07 1.41-1.41"/><path d="m17.66 6.34 1.41-1.41"/><circle cx="12" cy="12" r="5"/></svg>;
const BeachIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>;
const MoonIcon = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;

interface WeatherExtrasProps {
    data: WeatherData;
}

const WeatherExtras: React.FC<WeatherExtrasProps> = ({ data }) => {
    const { cardClass, density, classes } = useTheme();
    const settings = getSettings();
    const config = settings.extrasConfig;
    const [selectedExtra, setSelectedExtra] = useState<string | null>(null);
    const [realExtras, setRealExtras] = useState<ExtrasData | null>(null);

    // Fetch real data independently if enabled
    useEffect(() => {
        let isMounted = true;
        
        const fetchReal = async () => {
            if (!config?.enabled || (!config.showPollen && !config.showBeach)) return;
            
            try {
                const stored = localStorage.getItem('last_coords');
                if (stored) {
                    const { lat, lon } = JSON.parse(stored);
                    const result = await fetchExtrasData(lat, lon);
                    if (isMounted) setRealExtras(result);
                }
            } catch (e) {
                console.error("Failed to fetch real extras", e);
            }
        };

        fetchReal();

        return () => { isMounted = false; };
    }, [config, data.city]); // Re-fetch if city changes

    if (!config?.enabled || !data) return null;

    // --- LOGIC ---

    const getRunningStatus = () => {
        if (!config.showRunning) return null;
        const temp = data.temperature;
        const rain = data.rain_1h || 0;
        const wind = data.windSpeed;
        const humidity = data.humidity;

        if (rain > 2) return { status: 'Ruim', color: 'text-red-400', barColor: 'bg-red-500', desc: `Chuva moderada (${rain}mm). Pista escorregadia.` };
        if (temp > 32) return { status: 'Perigo', color: 'text-red-500', barColor: 'bg-red-600', desc: 'Calor extremo. Risco de insolação.' };
        if (temp > 28) return { status: 'Ruim', color: 'text-orange-400', barColor: 'bg-orange-500', desc: 'Muito quente. Hidrate-se bem.' };
        if (temp < 0) return { status: 'Ruim', color: 'text-red-400', barColor: 'bg-red-500', desc: 'Muito frio. Risco de hipotermia.' };
        if (wind > 35) return { status: 'Ruim', color: 'text-red-400', barColor: 'bg-red-500', desc: `Vento forte (${wind} km/h) contra.` };

        if (temp >= 10 && temp <= 22 && rain === 0 && wind < 15 && humidity < 85) {
            return { status: 'Perfeito', color: 'text-emerald-400', barColor: 'bg-emerald-500', desc: 'Temperatura e vento ideais.' };
        }
        return { status: 'Bom', color: 'text-green-400', barColor: 'bg-green-500', desc: 'Condições favoráveis.' };
    };

    const getDrivingStatus = () => {
        if (!config.showDriving) return null;
        const vis = data.visibility !== undefined ? data.visibility : 10000;
        const rain = data.rain_1h || 0;
        const snow = data.snow_1h || 0;
        const wind = data.windSpeed;

        if (snow > 0) return { status: 'Perigo', color: 'text-red-500', barColor: 'bg-red-600', desc: 'Gelo ou neve na pista. Evite sair.' };
        if (vis < 500) return { status: 'Perigo', color: 'text-red-500', barColor: 'bg-red-600', desc: `Neblina densa (${vis}m).` };
        if (vis < 2000) return { status: 'Ruim', color: 'text-orange-400', barColor: 'bg-orange-500', desc: 'Visibilidade reduzida. Use faróis baixos.' };
        if (rain > 5) return { status: 'Ruim', color: 'text-red-400', barColor: 'bg-red-500', desc: 'Chuva forte. Aquaplanagem provável.' };
        if (wind > 60) return { status: 'Cuidado', color: 'text-orange-400', barColor: 'bg-orange-500', desc: 'Vento lateral perigoso.' };

        return { status: 'Bom', color: 'text-green-400', barColor: 'bg-green-500', desc: 'Dirija com atenção normal.' };
    };

    const getGoldenHourStatus = () => {
        if (!config.showGoldenHour) return null;
        const now = Date.now() / 1000;
        const sunrise = data.sunrise;
        const sunset = data.sunset;

        if (now >= sunrise && now <= sunrise + 3600) {
            const timeLeft = Math.round((sunrise + 3600 - now) / 60);
            return { status: 'Agora', color: 'text-amber-400', barColor: 'bg-amber-500', desc: `Luz suave da manhã. Restam ${timeLeft} min.` };
        }
        if (now >= sunset - 3600 && now <= sunset) {
            const timeLeft = Math.round((sunset - now) / 60);
            return { status: 'Agora', color: 'text-amber-400', barColor: 'bg-amber-500', desc: `Luz dourada da tarde. Restam ${timeLeft} min.` };
        }
        return null;
    };

    const getBlueHourStatus = () => {
        if (!config.showBlueHour) return null;
        const now = Date.now() / 1000;
        const sunrise = data.sunrise;
        const sunset = data.sunset;
        
        if (now >= sunrise - 1800 && now < sunrise) {
             const timeLeft = Math.round((sunrise - now) / 60);
             return { status: 'Agora', color: 'text-blue-400', barColor: 'bg-blue-600', desc: `Hora azul da manhã. Faltam ${timeLeft} min para o sol.` };
        }
        if (now > sunset && now <= sunset + 1800) {
             const timeLeft = Math.round((sunset + 1800 - now) / 60);
             return { status: 'Agora', color: 'text-blue-400', barColor: 'bg-blue-600', desc: `Hora azul da noite. Restam ${timeLeft} min.` };
        }
        return null;
    };

    const getMosquitoStatus = () => {
        if (!config.showMosquito) return null;
        const temp = data.temperature;
        const humidity = data.humidity;
        const now = new Date();
        const hour = now.getHours();
        
        let score = 0;
        if (temp > 20 && temp < 32) score += 2;
        if (humidity > 60) score += 2;
        if (humidity > 80) score += 1;
        if ((hour >= 17 && hour <= 20) || (hour >= 5 && hour <= 8)) score += 2; 

        if (score >= 5) return { status: 'Alta', color: 'text-red-400', barColor: 'bg-red-500', desc: 'Atividade intensa. Use repelente.' };
        if (score >= 3) return { status: 'Média', color: 'text-yellow-400', barColor: 'bg-yellow-500', desc: 'Atividade moderada em áreas úmidas.' };
        return { status: 'Baixa', color: 'text-green-400', barColor: 'bg-green-500', desc: 'Condições desfavoráveis para mosquitos.' };
    };

    const getUVStatus = () => {
        if (!config.showUV || data.uvi === undefined) return null;
        const uv = data.uvi;

        if (uv > 10) return { status: 'Extremo', color: 'text-purple-500', barColor: 'bg-purple-600', desc: 'Pele queima em minutos. Evite o sol.' };
        if (uv >= 8) return { status: 'Muito Alto', color: 'text-red-500', barColor: 'bg-red-500', desc: 'Busque sombra. Protetor/Chapéu obrigatórios.' };
        if (uv >= 6) return { status: 'Alto', color: 'text-orange-400', barColor: 'bg-orange-500', desc: 'Use protetor solar FPS 30+ e óculos.' };
        if (uv >= 3) return { status: 'Moderado', color: 'text-yellow-400', barColor: 'bg-yellow-500', desc: 'Use protetor se ficar exposto por muito tempo.' };
        return { status: 'Baixo', color: 'text-green-400', barColor: 'bg-green-500', desc: 'Seguro. Proteção solar opcional.' };
    };

    // REAL DATA LOGIC: Pollen
    const getPollenStatus = () => {
        if (!config.showPollen) return null;
        
        // Use Real Data if available
        if (realExtras && realExtras.pollen) {
            const p = realExtras.pollen;
            const maxPollen = Math.max(p.alder, p.birch, p.grass, p.mugwort, p.olive, p.ragweed);
            
            if (maxPollen > 50) return { status: 'Alto', color: 'text-red-400', barColor: 'bg-red-500', desc: 'Concentração alta de pólen. Alérgicos: cuidado.' };
            if (maxPollen > 20) return { status: 'Médio', color: 'text-yellow-400', barColor: 'bg-yellow-500', desc: 'Níveis moderados. Pode causar irritação.' };
            return { status: 'Baixo', color: 'text-green-400', barColor: 'bg-green-500', desc: 'Ar limpo de alérgenos principais.' };
        }

        return null; // Don't show if no real data (better than fake)
    };

    // Flu Risk (Still Simulated based on environment as there is no direct Flu API in Open-Meteo)
    const getFluStatus = () => {
        if (!config.showFlu) return null;
        const temp = data.temperature;
        const humidity = data.humidity;
        
        if (temp < 10 && humidity < 40) {
            return { status: 'Alto', color: 'text-red-400', barColor: 'bg-red-500', desc: 'Frio e ar seco favorecem vírus. Hidrate-se.' };
        }
        if (temp < 15 || (temp > 30 && humidity > 80)) { 
             return { status: 'Médio', color: 'text-yellow-400', barColor: 'bg-yellow-500', desc: 'Condições de estresse térmico.' };
        }
        return { status: 'Baixo', color: 'text-green-400', barColor: 'bg-green-500', desc: 'Condições climáticas estáveis.' };
    };

    // REAL DATA LOGIC: Beach
    const getBeachStatus = () => {
        if (!config.showBeach) return null;

        // If we have real marine data, prioritize it
        if (realExtras && realExtras.marine && realExtras.marine.wave_height !== null) {
            const waves = realExtras.marine.wave_height;
            const waterTemp = realExtras.marine.sea_temperature;
            
            if (waves > 2.5) return { status: 'Perigo', color: 'text-red-500', barColor: 'bg-red-600', desc: `Ondas de ${waves.toFixed(1)}m. Mar agitado/ressaca.` };
            if (waves > 1.5) return { status: 'Cuidado', color: 'text-orange-400', barColor: 'bg-orange-500', desc: `Ondas de ${waves.toFixed(1)}m. Bandeira vermelha.` };
            
            let tempDesc = "";
            if (waterTemp < 18) tempDesc = "Água fria.";
            else if (waterTemp > 24) tempDesc = "Água agradável.";
            
            return { status: 'Bom', color: 'text-emerald-400', barColor: 'bg-emerald-500', desc: `Ondas: ${waves.toFixed(1)}m. ${tempDesc}` };
        }

        // Fallback or hide if inland (Open-Meteo returns null for marine on land)
        return null; 
    };

    const running = getRunningStatus();
    const driving = getDrivingStatus();
    const golden = getGoldenHourStatus();
    const blueHour = getBlueHourStatus();
    const mosquito = getMosquitoStatus();
    const uv = getUVStatus();
    const pollen = getPollenStatus();
    const flu = getFluStatus();
    const beach = getBeachStatus();

    if (!running && !driving && !golden && !blueHour && !mosquito && !uv && !pollen && !flu && !beach) return null;

    const ListCard = ({ icon, title, status, color, barColor, desc }: any) => (
        <button 
            onClick={() => setSelectedExtra(desc)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-[0.99] group text-left relative overflow-hidden"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`}></div>
            
            <div className={`p-2 rounded-xl bg-white/5 text-gray-300 group-hover:text-white transition-colors`}>
                {icon}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</span>
                    <span className={`text-sm font-bold ${color}`}>{status}</span>
                </div>
                <p className="text-sm text-gray-400 truncate group-hover:text-gray-200 transition-colors">{desc}</p>
            </div>

            <ChevronLeftIcon className="w-4 h-4 text-gray-600 rotate-180 flex-shrink-0 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
        </button>
    );

    return (
        <>
            <div className={`rounded-3xl ${density.padding} ${cardClass} animate-enter`}>
                <div className="flex items-center gap-2 mb-4 px-1">
                    <div className={`w-1 h-4 rounded-full ${classes.bg}`}></div>
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Lifestyle & Saúde</h3>
                </div>
                
                <div className="flex flex-col gap-3">
                    {running && <ListCard icon={<WindIcon className="w-5 h-5"/>} title="Corrida" {...running} />}
                    {driving && <ListCard icon={<EyeIcon className="w-5 h-5"/>} title="Dirigir" {...driving} />}
                    {golden && <ListCard icon={<SunIcon className="w-5 h-5"/>} title="Golden Hour" {...golden} />}
                    {blueHour && <ListCard icon={<MoonIcon className="w-5 h-5"/>} title="Blue Hour" {...blueHour} />}
                    {mosquito && <ListCard icon={<BugIcon className="w-5 h-5"/>} title="Mosquitos" {...mosquito} />}
                    {uv && <ListCard icon={<ShieldIcon className="w-5 h-5"/>} title="Índice UV" {...uv} />}
                    {pollen && <ListCard icon={<FlowerIcon className="w-5 h-5"/>} title="Pólen (Real)" {...pollen} />}
                    {flu && <ListCard icon={<ThermometerIcon className="w-5 h-5"/>} title="Risco Gripe" {...flu} />}
                    {beach && <ListCard icon={<BeachIcon className="w-5 h-5"/>} title="Praia/Mar (Real)" {...beach} />}
                </div>
            </div>

            <ForecastDetailModal 
                isOpen={!!selectedExtra} 
                onClose={() => setSelectedExtra(null)} 
                data={{ description: selectedExtra || '' }}
                isComplex={false} // Force simple toast mode
            />
        </>
    );
};

export default WeatherExtras;
