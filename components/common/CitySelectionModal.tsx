

import React, { useEffect } from 'react';
import SearchBar from '../weather/SearchBar';
import type { CitySearchResult } from '../../types';
import { XIcon } from '../icons';
import { useTheme } from '../context/ThemeContext';

interface CitySelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (city: CitySearchResult) => void;
}

const CitySelectionModal: React.FC<CitySelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { glassClass } = useTheme();
    
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4 pb-20 backdrop-blur-sm h-screen w-screen">
            <div className={`${glassClass} border border-gray-700 rounded-2xl w-full max-w-md p-6 relative shadow-2xl`}>
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                
                <h3 className="text-xl font-bold text-white mb-4">Selecionar Localização Padrão</h3>
                <p className="text-gray-400 text-sm mb-6">
                    Pesquise a cidade que você deseja que o Meteor carregue automaticamente ao abrir.
                </p>
                
                <div className="mb-12"> 
                    <SearchBar 
                        onCitySelect={onSelect} 
                        onGeolocate={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition((pos) => {
                                    // Mock city result for current location
                                    onSelect({
                                        name: "Minha Localização Atual",
                                        country: "",
                                        lat: pos.coords.latitude,
                                        lon: pos.coords.longitude
                                    });
                                });
                            }
                        }} 
                    />
                </div>
            </div>
        </div>
    );
};

export default CitySelectionModal;