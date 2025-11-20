
import React from 'react';
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
    const { glassClass, classes } = useTheme();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
            <div className={`${glassClass} border border-gray-700 rounded-3xl w-full max-w-md p-8 relative shadow-2xl`}>
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
                >
                    <XIcon className="w-6 h-6" />
                </button>
                
                <h3 className="text-2xl font-bold text-white mb-2">Definir Local Padrão</h3>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    O Meteor carregará os dados desta cidade automaticamente sempre que você abrir o aplicativo.
                </p>
                
                <div className="mb-4"> 
                    <SearchBar 
                        onCitySelect={onSelect} 
                        onGeolocate={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition((pos) => {
                                    // Mock city result for current location
                                    onSelect({
                                        name: "Localização Atual",
                                        country: "",
                                        lat: pos.coords.latitude,
                                        lon: pos.coords.longitude
                                    });
                                });
                            }
                        }} 
                    />
                </div>
                
                <div className="text-center mt-6">
                    <button onClick={onClose} className={`text-sm ${classes.text} hover:underline`}>Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default CitySelectionModal;
