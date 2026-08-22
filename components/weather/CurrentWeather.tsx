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
    <section className={`relative min-h-[27rem] overflow-hidden rounded-[2rem] border border-white/10 text-white shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:min-h-[31rem] ${isAmoled ? 'bg-black' : 'bg-[#0b1a2c]'}`}>
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
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,8,16,0.18)_0%,rgba(3,8,16,0.38)_42%,rgba(3,8,16,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.16),transparent_28rem)]" />

      <div className="relative z-10 flex min-h-[27rem] flex-col justify-between p-5 sm:min-h-[31rem] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/80">
              <MapPinIcon className="h-4 w-4" /> Agora em
            </p>
            <h2 className="text-3xl font-black tracking-[-0.035em] drop-shadow-lg sm:text-4xl">{data.city}</h2>
            <p className="mt-1 capitalize text-sm font-medium text-white/75">{data.country} · {date}</p>
          </div>
          {showClock && (
            <div className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-sm font-bold backdrop-blur-md" aria-label={`Horário local ${localTime}`}>
              {localTime} <span className="font-medium text-white/55">local</span>
            </div>
          )}
        </div>

        <div>
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-start">
                <span className="text-[5.6rem] font-black leading-[0.82] tracking-[-0.075em] drop-shadow-xl sm:text-[7rem]">{temp(data.temperature)}</span>
                <span className="mt-1 text-3xl font-semibold text-white/75">°</span>
              </div>
              <p className="mt-4 text-xl font-bold capitalize drop-shadow-md">{data.condition}</p>
              {typeof data.feels_like === 'number' && <p className="mt-1 text-sm font-medium text-white/65">Sensação de {temp(data.feels_like)}°</p>}
            </div>
            <span className="pb-2 text-5xl drop-shadow-lg sm:text-6xl" aria-hidden="true">{data.conditionIcon}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-md">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-white/60"><WindIcon className="h-4 w-4" /> Vento</p>
              <p className="mt-1 text-base font-bold">{speed} {speedUnit}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-md">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-white/60"><DropletsIcon className="h-4 w-4" /> Umidade</p>
              <p className="mt-1 text-base font-bold">{data.humidity}%</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-black/25 p-3 backdrop-blur-md sm:col-span-1">
              <p className="text-xs font-semibold text-white/60">Pressão</p>
              <p className="mt-1 text-base font-bold">{data.pressure} hPa</p>
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
