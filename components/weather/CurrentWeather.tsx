import React, { useEffect, useState } from 'react';
import type { ClockDisplayMode, UnitSystem, WeatherData } from '../../types';
import { DropletsIcon, MapPinIcon, WindIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface CurrentWeatherProps {
  data: WeatherData;
  clockDisplayMode: ClockDisplayMode;
  unitSystem: UnitSystem;
}

const safeExternalUrl = (value?: string): string | undefined => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data, clockDisplayMode, unitSystem }) => {
  const [localTime, setLocalTime] = useState('');
  const [imageMode, setImageMode] = useState<'primary' | 'fallback' | 'hidden'>('primary');
  const { isAmoled } = useTheme();

  useEffect(() => setImageMode('primary'), [data.imageUrl]);

  useEffect(() => {
    const updateTime = () => {
      const targetTime = new Date(Date.now() + (data.timezoneOffset || 0) * 1000);
      setLocalTime(`${targetTime.getUTCHours().toString().padStart(2, '0')}:${targetTime.getUTCMinutes().toString().padStart(2, '0')}`);
    };
    updateTime();
    const interval = window.setInterval(updateTime, 60_000);
    return () => window.clearInterval(interval);
  }, [data.timezoneOffset]);

  const date = new Date((data.dt + (data.timezoneOffset || 0)) * 1000).toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC'
  });
  const userOffset = new Date().getTimezoneOffset() * -60;
  const showClock = clockDisplayMode === 'always' || (clockDisplayMode === 'different_zone' && Math.abs(userOffset - (data.timezoneOffset || 0)) > 120);
  const temp = (value: number) => unitSystem === 'imperial' ? Math.round(value * 9 / 5 + 32) : Math.round(value);
  const speed = unitSystem === 'imperial' ? Math.round(data.windSpeed * 0.621371) : Math.round(data.windSpeed);
  const speedUnit = unitSystem === 'imperial' ? 'mph' : 'km/h';
  const attribution = imageMode === 'primary' ? data.imageAttribution : undefined;
  const photographerUrl = safeExternalUrl(attribution?.photographerUrl);
  const photoUrl = safeExternalUrl(attribution?.photoUrl);

  return (
    <section className={`relative min-h-[23rem] overflow-hidden rounded-2xl border border-white/[0.08] text-white sm:min-h-[26rem] ${isAmoled ? 'bg-black' : 'bg-[#111419]'}`}>
      <img
        key={data.imageUrl}
        src={data.imageUrl}
        alt={`Céu em ${data.city}`}
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => {
          const image = event.currentTarget;
          if (data.imageFallbackUrl && image.dataset.fallbackApplied !== 'true') {
            image.dataset.fallbackApplied = 'true';
            setImageMode('fallback');
            image.src = data.imageFallbackUrl;
            return;
          }
          setImageMode('hidden');
          image.style.display = 'none';
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,10,0.2)_0%,rgba(5,7,10,0.42)_42%,rgba(5,7,10,0.96)_100%)]" />

      <div className="relative z-10 flex min-h-[23rem] flex-col justify-between p-5 sm:min-h-[26rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/70"><MapPinIcon className="h-3.5 w-3.5" /> Agora</p>
            <h2 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{data.city}</h2>
            <p className="mt-1 capitalize text-xs text-white/65">{data.country} · {date}</p>
          </div>
          {showClock && (
            <div className="rounded-lg border border-white/15 bg-black/35 px-2.5 py-1.5 text-xs font-semibold" aria-label={`Horário local ${localTime}`}>
              {localTime} <span className="font-medium text-white/55">local</span>
            </div>
          )}
        </div>

        <div>
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-start">
                <span className="text-[4.5rem] font-medium leading-[0.85] tracking-[-0.07em] sm:text-[5.4rem]">{temp(data.temperature)}</span>
                <span className="mt-1 text-2xl font-medium text-white/65">°</span>
              </div>
              <p className="mt-3 text-base font-medium capitalize">{data.condition}</p>
              {typeof data.feels_like === 'number' && <p className="mt-1 text-xs text-white/60">Sensação de {temp(data.feels_like)}°</p>}
            </div>
            <span className="pb-2 text-4xl sm:text-5xl" aria-hidden="true">{data.conditionIcon}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-black/35 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] text-white/55"><WindIcon className="h-3.5 w-3.5" /> Vento</p>
              <p className="mt-1 text-sm font-semibold">{speed} {speedUnit}</p>
            </div>
            <div className="rounded-lg bg-black/35 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[11px] text-white/55"><DropletsIcon className="h-3.5 w-3.5" /> Umidade</p>
              <p className="mt-1 text-sm font-semibold">{data.humidity}%</p>
            </div>
            <div className="rounded-lg bg-black/35 px-3 py-2.5">
              <p className="text-[11px] text-white/55">Pressão</p>
              <p className="mt-1 text-sm font-semibold">{data.pressure} hPa</p>
            </div>
          </div>

          {attribution && (
            <p className="mt-3 text-[10px] font-medium text-white/45">
              Foto por{' '}
              {photographerUrl ? (
                <a href={photographerUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-white/25 underline-offset-2 hover:text-white">
                  {attribution.photographer || attribution.source}
                </a>
              ) : (attribution.photographer || attribution.source)}
              {photoUrl && <>{' '}em <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-white/25 underline-offset-2 hover:text-white">Unsplash</a></>}
            </p>
          )}
          {imageMode === 'fallback' && <p className="mt-3 text-[10px] font-medium text-white/45">Imagem de apoio · Picsum Photos</p>}
        </div>
      </div>
    </section>
  );
};

export default CurrentWeather;
