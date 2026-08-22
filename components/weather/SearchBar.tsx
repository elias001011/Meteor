import React, { useEffect, useRef, useState } from 'react';
import type { CitySearchResult } from '../../types';
import { searchCities } from '../../services/weatherService';
import { MapPinIcon, SearchIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface SearchBarProps {
  onCitySelect: (city: CitySearchResult) => void;
  onGeolocate: () => void;
}

const quickCities: CitySearchResult[] = [
  { name: 'Porto Alegre', country: 'BR', state: 'Rio Grande do Sul', lat: -30.0346, lon: -51.2177 },
  { name: 'São Paulo', country: 'BR', state: 'São Paulo', lat: -23.5505, lon: -46.6333 },
  { name: 'Rio de Janeiro', country: 'BR', state: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
];

const SearchBar: React.FC<SearchBarProps> = ({ onCitySelect, onGeolocate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { classes, isAmoled } = useTheme();

  const select = (city: CitySearchResult) => {
    setQuery('');
    setResults([]);
    setOpen(false);
    onCitySelect(city);
  };

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 3) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const cities = await searchCities(normalized);
        if (active) setResults(cities);
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 420);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="space-y-2.5" ref={rootRef}>
      <form onSubmit={event => { event.preventDefault(); if (results[0]) select(results[0]); }} className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <label htmlFor="city-search" className="sr-only">Pesquisar cidade</label>
        <input
          id="city-search"
          role="combobox"
          aria-expanded={open}
          aria-controls="city-search-results"
          aria-autocomplete="list"
          value={query}
          onFocus={() => query.trim().length >= 3 && setOpen(true)}
          onChange={event => setQuery(event.target.value)}
          placeholder="Pesquise uma cidade"
          autoComplete="off"
          className={`h-[52px] w-full rounded-2xl border border-white/10 py-3.5 pl-12 pr-14 text-sm font-semibold text-white shadow-lg outline-none placeholder:font-medium placeholder:text-slate-500 focus:ring-2 ${classes.ring} ${isAmoled ? 'bg-black' : 'bg-[#0b1727]/88 backdrop-blur-xl'}`}
        />
        <button type="submit" aria-label="Pesquisar" className={`absolute right-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-xl ${classes.bg} text-white shadow-lg transition-transform active:scale-95`}>
          <SearchIcon className="h-[18px] w-[18px]" />
        </button>

        {open && (
          <div id="city-search-results" className={`absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-72 overflow-y-auto rounded-2xl border border-white/10 p-1.5 shadow-2xl ${isAmoled ? 'bg-black' : 'bg-[#081321]/95 backdrop-blur-2xl'}`} role="listbox">
            {loading ? (
              <p className="px-4 py-5 text-center text-sm font-medium text-slate-400">Buscando cidades…</p>
            ) : results.length > 0 ? results.map((city, index) => (
              <button key={`${city.lat}-${city.lon}-${index}`} type="button" role="option" aria-selected="false" onClick={() => select(city)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.06]">
                <span className="rounded-xl bg-white/[0.06] p-2 text-slate-400"><MapPinIcon className="h-4 w-4" /></span>
                <span className="min-w-0"><span className="block truncate text-sm font-bold text-white">{city.name}</span><span className="block truncate text-xs text-slate-500">{[city.state, city.country].filter(Boolean).join(', ')}</span></span>
              </button>
            )) : (
              <p className="px-4 py-5 text-center text-sm font-medium text-slate-400">Nenhuma cidade encontrada.</p>
            )}
          </div>
        )}
      </form>

      <div className="scroll-fade flex gap-2 overflow-x-auto pb-1" aria-label="Atalhos de localização">
        <button type="button" onClick={onGeolocate} className="flex flex-none items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.08]">
          <MapPinIcon className={`h-3.5 w-3.5 ${classes.text}`} /> Minha localização
        </button>
        {quickCities.map(city => <button key={city.name} type="button" onClick={() => select(city)} className="flex-none rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/[0.08] hover:text-white">{city.name}</button>)}
      </div>
    </div>
  );
};

export default SearchBar;
