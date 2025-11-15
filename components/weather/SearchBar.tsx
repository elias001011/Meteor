
import React from 'react';

const SearchBar: React.FC = () => {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          placeholder="Pesquisar cidades..."
          className="w-full bg-gray-800 border border-gray-700 rounded-full py-3 px-5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button className="bg-cyan-500 rounded-full p-2 hover:bg-cyan-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="bg-gray-700/50 text-gray-300 text-sm px-4 py-1 rounded-full hover:bg-gray-700">
            Porto Alegre (POA)
        </button>
         <button className="bg-gray-700/50 text-gray-300 text-sm px-4 py-1 rounded-full hover:bg-gray-700">
            Minha Localização
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
