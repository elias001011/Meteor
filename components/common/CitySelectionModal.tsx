import React from 'react';
import type { CitySearchResult } from '../../types';
import { XIcon } from '../icons';

interface CitySelectionModalProps {
    results: CitySearchResult[];
    onSelect: (city: CitySearchResult) => void;
    onClose: () => void;
}

const CitySelectionModal: React.FC<CitySelectionModalProps> = ({ results, onSelect, onClose }) => {
    // Prevent background click from closing if the user clicks on the modal content
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="city-selection-title"
        >
            <div className="bg-gray-800 border border-gray-700 rounded-3xl shadow-xl w-full max-w-md animate-fade-in-up">
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 id="city-selection-title" className="text-lg font-bold">Selecione uma Cidade</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 rounded-full hover:bg-gray-700 transition-colors"
                        aria-label="Fechar seleção de cidade"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <ul className="p-2 max-h-[60vh] overflow-y-auto">
                    {results.map((city, index) => (
                        <li key={`${city.lat}-${city.lon}-${index}`}>
                            <button onClick={() => onSelect(city)} className="w-full text-left p-3 rounded-lg hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                <p className="font-semibold text-white">{city.name}</p>
                                <p className="text-sm text-gray-400">{[city.state, city.country].filter(Boolean).join(', ')}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
             <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default CitySelectionModal;
