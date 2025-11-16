import React, { useEffect, useRef, useState } from 'react';
import { LayersIcon, ThermometerIcon, WindIcon } from '../icons';

declare var L: any;

type WeatherLayer = 'temp_new' | 'clouds_new' | 'precipitation_new' | 'wind_new';

const MapView: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const activeLayerRef = useRef<any>(null);
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

    useEffect(() => {
        if (!mapContainerRef.current || typeof L === 'undefined') return;

        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([-30.0346, -51.2177], 10);
            L.control.zoom({ position: 'bottomright' }).addTo(map);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
                maxZoom: 20,
                subdomains: 'abcd'
            }).addTo(map);

            const customIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
            });
            L.marker([-30.0346, -51.2177], { icon: customIcon }).addTo(map).bindPopup('Porto Alegre');
            
            mapInstanceRef.current = map;
        }

        const resizeObserver = new ResizeObserver(() => {
            mapInstanceRef.current?.invalidateSize();
        });
        const currentContainer = mapContainerRef.current;
        if (currentContainer) resizeObserver.observe(currentContainer);

        return () => {
            if (currentContainer) resizeObserver.unobserve(currentContainer);
            // Don't destroy map on component unmount to preserve state across views
        };
    }, []);

    const toggleWeatherLayer = (layerName: WeatherLayer | null) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (activeLayerRef.current) {
            map.removeLayer(activeLayerRef.current);
            activeLayerRef.current = null;
        }

        if (layerName) {
            const tileUrl = `/.netlify/functions/weather?endpoint=tile&layer=${layerName}&z={z}&x={x}&y={y}`;
            const newLayer = L.tileLayer(tileUrl, { opacity: 0.7 });
            newLayer.addTo(map);
            activeLayerRef.current = newLayer;
        }
        setIsLayerMenuOpen(false);
    };
    
    const LayerButton: React.FC<{icon: React.ReactNode, label: string, onClick:() => void}> = ({icon, label, onClick}) => (
        <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-gray-600/50 rounded-lg transition-colors">
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute top-4 right-4 z-[401]">
                {isLayerMenuOpen && (
                    <div className="bg-gray-800/80 backdrop-blur-md border border-gray-600/50 rounded-xl shadow-lg p-2 flex flex-col gap-1 w-48">
                        <LayerButton icon={<ThermometerIcon className="w-5 h-5 text-orange-400"/>} label="Temperatura" onClick={() => toggleWeatherLayer('temp_new')} />
                        <LayerButton icon={<WindIcon className="w-5 h-5 text-cyan-400"/>} label="Vento" onClick={() => toggleWeatherLayer('wind_new')} />
                        <LayerButton icon={<LayersIcon className="w-5 h-5 text-blue-400"/>} label="Nuvens" onClick={() => toggleWeatherLayer('clouds_new')} />
                        <button onClick={() => toggleWeatherLayer(null)} className="w-full text-center text-sm text-gray-400 pt-2 mt-1 border-t border-gray-600/50 hover:text-white">Limpar Camada</button>
                    </div>
                )}
                <button 
                    onClick={() => setIsLayerMenuOpen(prev => !prev)}
                    className="bg-gray-800/80 backdrop-blur-md border border-gray-600/50 rounded-full w-12 h-12 flex items-center justify-center shadow-lg mt-2"
                    aria-label="Controle de camadas do mapa"
                >
                    <LayersIcon className="w-6 h-6 text-white" />
                </button>
            </div>
        </div>
    );
};

export default MapView;