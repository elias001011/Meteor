

import React, { useEffect, useRef, useState } from 'react';
import { LayersIcon, ThermometerIcon, WindIcon, DropletsIcon, GaugeIcon } from '../icons';
import type { MapTheme } from '../../types';

declare var L: any;

type WeatherLayer = 'TA2' | 'CL' | 'PR0' | 'APM' | 'WS10';
type BaseLayer = 'standard' | 'relief';

interface MapViewProps {
    lat?: number;
    lon?: number;
    theme?: MapTheme;
}

const MapView: React.FC<MapViewProps> = ({ lat, lon, theme = 'dark' }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const activeOverlayRef = useRef<any>(null);
    const tileLayerRef = useRef<any>(null); // Ref to currently active base tile layer
    const layerMenuRef = useRef<HTMLDivElement>(null);
    
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
    const [activeBaseLayer, setActiveBaseLayer] = useState<BaseLayer>('standard');
    const [activeOverlay, setActiveOverlay] = useState<WeatherLayer | null>(null);

    // Default view (Brazil)
    const DEFAULT_CENTER = [-14.2350, -51.9253];
    const DEFAULT_ZOOM = 4;

    // Initialize Map
    useEffect(() => {
        if (!mapContainerRef.current || typeof L === 'undefined' || mapInstanceRef.current) return;

        const initialCenter = lat !== undefined && lon !== undefined ? [lat, lon] : DEFAULT_CENTER;
        const initialZoom = lat !== undefined && lon !== undefined ? 10 : DEFAULT_ZOOM;

        const map = L.map(mapContainerRef.current, { 
            zoomControl: false,
            layers: [] // We will add layers dynamically
        }).setView(initialCenter, initialZoom);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        
        mapInstanceRef.current = map;

        const resizeObserver = new ResizeObserver(() => {
            mapInstanceRef.current?.invalidateSize();
        });
        const currentContainer = mapContainerRef.current;
        if (currentContainer) resizeObserver.observe(currentContainer);

        return () => {
            if (currentContainer) resizeObserver.unobserve(currentContainer);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Handle Tile Layer updates based on Theme & ActiveBaseLayer
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Determine Tile URL based on Theme and Selection
        let tileUrl = '';
        let attribution = '';

        if (activeBaseLayer === 'relief') {
             tileUrl = '/.netlify/functions/weather?endpoint=relief&z={z}&x={x}&y={y}';
             attribution = '&copy; OpenWeather';
        } else {
            if (theme === 'dark') {
                tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
                attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
            } else {
                tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
                attribution = '&copy; OpenStreetMap contributors';
            }
        }

        // Remove existing base layer
        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        // Add new layer
        const newLayer = L.tileLayer(tileUrl, {
            attribution,
            maxZoom: 19,
            errorTileUrl: '' // Don't show broken images for missing tiles
        });
        
        // Handle relief errors specially
        if (activeBaseLayer === 'relief') {
            newLayer.on('tileerror', () => {
                console.warn("Relief layer failed (likely paid API).");
            });
        }

        newLayer.addTo(map);
        
        // Ensure overlay is always on top of base layer
        if (activeOverlayRef.current) {
             activeOverlayRef.current.bringToFront();
        }
        
        tileLayerRef.current = newLayer;

    }, [theme, activeBaseLayer]);


    // Effect for updating map view and marker when props change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (lat !== undefined && lon !== undefined) {
            const newLatLng = L.latLng(lat, lon);
            map.setView(newLatLng, 10);

            if (markerRef.current) {
                markerRef.current.setLatLng(newLatLng);
            } else {
                const customIcon = L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
                });
                markerRef.current = L.marker([lat, lon], { icon: customIcon }).addTo(map);
            }
        } else {
            map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
        }
    }, [lat, lon]);

    // Handle clicking outside to close layer menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (layerMenuRef.current && !layerMenuRef.current.contains(event.target as Node)) {
                setIsLayerMenuOpen(false);
            }
        };
        if (isLayerMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isLayerMenuOpen]);

    const toggleWeatherLayer = (layerName: WeatherLayer) => {
        const map = mapInstanceRef.current;
        if (!map) return;
        
        const isTurningOff = activeOverlay === layerName;
        
        if (activeOverlayRef.current) {
            map.removeLayer(activeOverlayRef.current);
            activeOverlayRef.current = null;
        }
        
        if (isTurningOff) {
            setActiveOverlay(null);
        } else {
            const tileUrl = `/.netlify/functions/weather?endpoint=tile&layer=${layerName}&z={z}&x={x}&y={y}`;
            const newLayer = L.tileLayer(tileUrl, { 
                opacity: 0.7, 
                zIndex: 10,
                errorTileUrl: '' 
            });
            
            newLayer.on('tileerror', () => {
                console.warn(`Layer ${layerName} failed to load.`);
                if (map.hasLayer(newLayer)) {
                    map.removeLayer(newLayer);
                    if (activeOverlayRef.current === newLayer) {
                        activeOverlayRef.current = null;
                        setActiveOverlay(null);
                    }
                }
            });

            newLayer.addTo(map);
            activeOverlayRef.current = newLayer;
            setActiveOverlay(layerName);
        }
    };

    const switchBaseLayer = (layer: BaseLayer) => {
        setActiveBaseLayer(layer);
    };
    
    const LayerButton: React.FC<{icon: React.ReactNode, label: string, onClick:() => void, isActive?: boolean}> = ({icon, label, onClick, isActive}) => (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 text-left text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-colors ${isActive ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : ''}`}>
            {icon}
            <span>{label}</span>
        </button>
    );

    const RadioButton: React.FC<{label: string, value: BaseLayer, checked: boolean, onChange: (value: BaseLayer) => void}> = ({label, value, checked, onChange}) => (
        <label className="flex items-center gap-3 cursor-pointer text-gray-300 px-3 py-2 rounded-md hover:bg-white/10 w-full transition-colors">
            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${checked ? 'border-cyan-500' : 'border-gray-500'}`}>
                {checked && <div className="w-2 h-2 rounded-full bg-cyan-500" />}
            </div>
            <input 
                type="radio" 
                name="base-layer"
                value={value}
                checked={checked}
                onChange={() => onChange(value)}
                className="hidden"
            />
            {label}
        </label>
    );

    return (
        <div className="w-full h-full relative bg-slate-900">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
            
            {/* Layer Control */}
            <div className="absolute top-4 right-4 z-[401]" ref={layerMenuRef}>
                <div className="relative">
                    <button 
                        onClick={() => setIsLayerMenuOpen(prev => !prev)}
                        className="bg-gray-900/80 backdrop-blur-md border border-gray-700 hover:bg-gray-800 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-colors"
                        aria-label="Controle de camadas do mapa"
                        aria-expanded={isLayerMenuOpen}
                    >
                        <LayersIcon className="w-6 h-6" />
                    </button>
                    {isLayerMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-gray-600 rounded-xl shadow-2xl p-3 flex flex-col gap-2 w-64 animate-enter-pop">
                            <div className="p-1">
                                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 px-2">Mapa Base</h4>
                                <div className="flex flex-col items-start gap-1">
                                    <RadioButton label="Padrão" value="standard" checked={activeBaseLayer === 'standard'} onChange={switchBaseLayer} />
                                    <RadioButton label="Relevo" value="relief" checked={activeBaseLayer === 'relief'} onChange={switchBaseLayer} />
                                </div>
                            </div>

                            <hr className="border-gray-700/50"/>
                            
                            <div className="p-1">
                                <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 px-2">Sobreposições do Clima</h4>
                                <div className="flex flex-col gap-1">
                                    <LayerButton icon={<ThermometerIcon className="w-5 h-5 text-orange-400"/>} label="Temperatura" onClick={() => toggleWeatherLayer('TA2')} isActive={activeOverlay === 'TA2'}/>
                                    <LayerButton icon={<WindIcon className="w-5 h-5 text-cyan-400"/>} label="Vento" onClick={() => toggleWeatherLayer('WS10')} isActive={activeOverlay === 'WS10'} />
                                    <LayerButton icon={<LayersIcon className="w-5 h-5 text-gray-400"/>} label="Nuvens" onClick={() => toggleWeatherLayer('CL')} isActive={activeOverlay === 'CL'}/>
                                    <LayerButton icon={<DropletsIcon className="w-5 h-5 text-blue-400"/>} label="Precipitação" onClick={() => toggleWeatherLayer('PR0')} isActive={activeOverlay === 'PR0'}/>
                                    <LayerButton icon={<GaugeIcon className="w-5 h-5 text-indigo-400"/>} label="Pressão" onClick={() => toggleWeatherLayer('APM')} isActive={activeOverlay === 'APM'}/>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapView;