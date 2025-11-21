



import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const { classes, glassClass } = useTheme();

  const handleSelectCity = (city: CitySearchResult) => {
    setQuery('');
    setResults([]);
    setIsDropdownOpen(false);
    onCitySelect(city);
  };
  
  // Debounce search input
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
    }, 500); // 500ms delay

    return () => clearTimeout(timerId);
  }, [query]);

  // Handle clicking outside to close dropdown
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
        <form onSubmit={(e) => e.preventDefault()} className="relative">
          <input
            type="text"
            value={query}
            onFocus={() => { if(results.length > 0) setIsDropdownOpen(true)}}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar cidades..."
            className={`w-full bg-gray-800 border border-gray-700 rounded-full py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-inset ${classes.ring}`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <button type="submit" className={`${classes.bg} ${classes.bgHover} rounded-full p-2 text-white`} aria-label="Pesquisar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
          </div>
        </form>

        {isDropdownOpen && (
          <div className={`absolute top-full mt-2 w-full ${glassClass} bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto`}>
            {isLoading ? (
              <p className="p-4 text-center text-gray-400">Buscando...</p>
            ) : results.length > 0 ? (
              <ul>
                {results.map((city, index) => (
                  <li key={`${city.lat}-${city.lon}-${index}`}>
                    <button onClick={() => handleSelectCity(city)} className="w-full text-left p-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-none">
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
        <button onClick={onGeolocate} className="bg-gray-700/50 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
            Minha Localização
        </button>
        {quickSearchCities.map(city => (
            <button key={city.name} onClick={() => handleSelectCity(city)} className="bg-gray-700/50 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
                {city.name}
            </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;