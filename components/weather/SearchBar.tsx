import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (city: string) => void;
    onGeolocate: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onGeolocate }) => {
  const [city, setCity] = useState('');

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (city.trim()) {
          onSearch(city);
          setCity('');
      }
  };

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Pesquisar cidades..."
          className="w-full bg-gray-800 border border-gray-700 rounded-full py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button type="submit" className="bg-cyan-500 rounded-full p-2 hover:bg-cyan-400" aria-label="Pesquisar">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
        </div>
      </form>
      <div className="flex gap-2 flex-wrap">
        <button onClick={onGeolocate} className="bg-gray-700/50 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
            Minha Localização
        </button>
        <button onClick={() => onSearch('Porto Alegre')} className="bg-gray-700/50 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
            Porto Alegre
        </button>
         <button onClick={() => onSearch('Caxias do Sul')} className="bg-gray-700/50 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
            Caxias do Sul
        </button>
        <button onClick={() => onSearch('Pelotas')} className="bg-gray-700/50 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
            Pelotas
        </button>
        <button onClick={() => onSearch('Santa Maria')} className="bg-gray-700/50 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
            Santa Maria
        </button>
        <button onClick={() => onSearch('Sarandi')} className="bg-gray-700/50 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-700 transition-colors">
            Sarandi
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
