import React, { useEffect, useRef, useState } from 'react';
import { LayersIcon, ThermometerIcon, WindIcon, DropletsIcon, GaugeIcon } from '../icons';

declare var L: any;

type WeatherLayer = 'TA2' | 'CL' | 'PR' | 'PA' | 'WS10';

interface MapViewProps {
    lat: number;
    lon: number;
}

const MapView: React.FC<MapViewProps> = ({ lat, lon }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const activeLayerRef = useRef<any>(null);
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);

    // Effect for map initialization (runs only once)
    useEffect(() => {
        if (!mapContainerRef.current || typeof L === 'undefined' || mapInstanceRef.current) return;

        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([lat, lon], 10);
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        const customIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });
        
        markerRef.current = L.marker([lat, lon], { icon: customIcon }).addTo(map);
        
        mapInstanceRef.current = map;

        const resizeObserver = new ResizeObserver(() => {
            mapInstanceRef.current?.invalidateSize();
        });
        const currentContainer = mapContainerRef.current;
        if (currentContainer) resizeObserver.observe(currentContainer);

        return () => {
            if (currentContainer) resizeObserver.unobserve(currentContainer);
        };
    }, []); // Empty dependency array ensures this runs only once

    // Effect for updating map view and marker when props change
    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current) {
            const newLatLng = L.latLng(lat, lon);
            mapInstanceRef.current.setView(newLatLng, 10);
            markerRef.current.setLatLng(newLatLng);
        }
    }, [lat, lon]);

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
        <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 text-left text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors">
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute top-4 right-4 z-[401]">
                {isLayerMenuOpen && (
                    <div className="bg-white/80 backdrop-blur-md border border-gray-300/50 rounded-xl shadow-lg p-2 flex flex-col gap-1 w-48">
                        <LayerButton icon={<ThermometerIcon className="w-5 h-5 text-orange-500"/>} label="Temperatura" onClick={() => toggleWeatherLayer('TA2')} />
                        <LayerButton icon={<WindIcon className="w-5 h-5 text-cyan-500"/>} label="Vento" onClick={() => toggleWeatherLayer('WS10')} />
                        <LayerButton icon={<LayersIcon className="w-5 h-5 text-gray-500"/>} label="Nuvens" onClick={() => toggleWeatherLayer('CL')} />
                        <LayerButton icon={<DropletsIcon className="w-5 h-5 text-blue-500"/>} label="Precipitação" onClick={() => toggleWeatherLayer('PR')} />
                        <LayerButton icon={<GaugeIcon className="w-5 h-5 text-indigo-500"/>} label="Pressão" onClick={() => toggleWeatherLayer('PA')} />
                        <button onClick={() => toggleWeatherLayer(null)} className="w-full text-center text-sm text-gray-500 pt-2 mt-1 border-t border-gray-300/50 hover:text-gray-800">Limpar Camada</button>
                    </div>
                )}
                <button 
                    onClick={() => setIsLayerMenuOpen(prev => !prev)}
                    className="bg-white/80 backdrop-blur-md border border-gray-300/50 rounded-full w-12 h-12 flex items-center justify-center shadow-lg mt-2"
                    aria-label="Controle de camadas do mapa"
                >
                    <LayersIcon className="w-6 h-6 text-gray-800" />
                </button>
            </div>
        </div>
    );
};

export default MapView;