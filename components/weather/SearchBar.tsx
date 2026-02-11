
import React, { useState, useEffect, useRef } from 'react';
import type { CitySearchResult } from '../../types';
import { searchCities } from '../../services/weatherService';
import { useTheme } from '../context/ThemeContext';

interface SearchBarProps {
    onCitySelect: (city: CitySearchResult) => void;
    onGeolocate: () => void;
}

const quickSearchCities: CitySearchResult[] = [
    { name: 'Porto Alegre', country: 'BR', state: 'Rio Grande do Sul', lat: -30.0346, lon: -51.2177 },
    { name: 'Caxias do Sul', country: 'BR', state: 'Rio Grande do Sul', lat: -29.1678, lon: -51.1794 },
    { name: 'Pelotas', country: 'BR', state: 'Rio Grande do Sul', lat: -31.7719, lon: -52.3425 },
    { name: 'Santa Maria', country: 'BR', state: 'Rio Grande do Sul', lat: -29.6842, lon: -53.8069 },
    { name: 'Sarandi', country: 'BR', state: 'Rio Grande do Sul', lat: -27.9436, lon: -52.9231 },
]

const SearchBar: React.FC<SearchBarProps> = ({ onCitySelect, onGeolocate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { classes, glassClass, transparencyMode } = useTheme();

  // Logic to keep dropdown solid unless in Glass mode
  const dropdownBgClass = transparencyMode === 'glass' 
    ? glassClass 
    : "bg-[#0f172a] border border-white/10 shadow-2xl";

  const handleSelectCity = (city: CitySearchResult) => {
    setQuery('');
    setResults([]);
    setIsDropdownOpen(false);
    onCitySelect(city);
  };
  
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setIsDropdownOpen(false);
      return;
    }

    setIsLoading(true);
    setIsDropdownOpen(true);
    const timerId = setTimeout(async () => {
      try {
        const cities = await searchCities(query);
        setResults(cities);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative" ref={searchContainerRef}>
        <form onSubmit={(e) => e.preventDefault()} className="relative overflow-hidden rounded-full">
          <input
            type="text"
            value={query}
            onFocus={() => { if(results.length > 0) setIsDropdownOpen(true)}}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar cidades..."
            className={`w-full bg-gray-900/60 border border-white/10 rounded-full py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-inset ${classes.ring} transition-all`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <button type="submit" className={`${classes.bg} ${classes.bgHover} rounded-full p-2 text-white shadow-lg`} aria-label="Pesquisar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
          </div>
        </form>

        {isDropdownOpen && (
          <div className={`absolute top-full mt-2 w-full ${dropdownBgClass} rounded-2xl z-50 max-h-60 overflow-y-auto animate-enter-pop`}>
            {isLoading ? (
              <p className="p-4 text-center text-gray-400">Buscando...</p>
            ) : results.length > 0 ? (
              <ul>
                {results.map((city, index) => (
                  <li key={`${city.lat}-${city.lon}-${index}`}>
                    <button onClick={() => handleSelectCity(city)} className="w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-none">
                      <p className="font-semibold text-white">{city.name}</p>
                      <p className="text-sm text-gray-400">{[city.state, city.country].filter(Boolean).join(', ')}</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
                query.trim().length >= 3 && <p className="p-4 text-center text-gray-400">Nenhuma cidade encontrada.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={onGeolocate} className="bg-gray-800/40 border border-white/5 text-gray-300 text-xs px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors">
            Minha Localização
        </button>
        {quickSearchCities.map(city => (
            <button key={city.name} onClick={() => handleSelectCity(city)} className="bg-gray-800/40 border border-white/5 text-gray-300 text-xs px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors">
                {city.name}
            </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
