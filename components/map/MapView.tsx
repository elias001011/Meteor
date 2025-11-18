
import React, { useEffect, useRef, useState } from 'react';
import { LayersIcon, ThermometerIcon, WindIcon, DropletsIcon, GaugeIcon } from '../icons';

declare var L: any;

type WeatherLayer = 'TA2' | 'CL' | 'PR0' | 'APM' | 'WS10';
type BaseLayer = 'standard' | 'relief';

interface MapViewProps {
    lat?: number;
    lon?: number;
}

const MapView: React.FC<MapViewProps> = ({ lat, lon }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const activeOverlayRef = useRef<any>(null);
    const baseLayersRef = useRef<{ [key in BaseLayer]?: any }>({});
    const layerMenuRef = useRef<HTMLDivElement>(null);
    
    const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
    const [activeBaseLayer, setActiveBaseLayer] = useState<BaseLayer>('standard');
    const [activeOverlay, setActiveOverlay] = useState<WeatherLayer | null>(null);

    // Default view (Brazil)
    const DEFAULT_CENTER = [-14.2350, -51.9253];
    const DEFAULT_ZOOM = 4;

    // Effect for map initialization (runs only once)
    useEffect(() => {
        if (!mapContainerRef.current || typeof L === 'undefined' || mapInstanceRef.current) return;

        baseLayersRef.current.standard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
            maxZoom: 19
        });
        
        baseLayersRef.current.relief = L.tileLayer('/.netlify/functions/weather?endpoint=relief&z={z}&x={x}&y={y}', {
             attribution: '&copy; <a href="https://openweathermap.org/" target="_blank">OpenWeather</a>',
             maxZoom: 19,
             errorTileUrl: '' // Don't show broken image icon
        }).on('tileerror', () => {
            console.warn("Relief layer failed to load (likely paid API).");
        });
        
        const hasCoords = lat !== undefined && lon !== undefined;
        const initialCenter = hasCoords ? [lat, lon] : DEFAULT_CENTER;
        const initialZoom = hasCoords ? 10 : DEFAULT_ZOOM;

        const map = L.map(mapContainerRef.current, { 
            zoomControl: false,
            layers: [baseLayersRef.current.standard] // Default layer
        }).setView(initialCenter, initialZoom);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Only create marker if we have initial coords
        if (hasCoords) {
            const customIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
            });
            markerRef.current = L.marker([lat, lon], { icon: customIcon }).addTo(map);
        }
        
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

    // Effect for updating map view and marker when props change
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (lat !== undefined && lon !== undefined) {
            // We have specific coordinates
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
            // No coordinates (reset to default view)
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
                errorTileUrl: '' // Don't show ugly broken image icons
            });
            
            // Graceful degradation: If the tile layer fails (e.g., 401 Unauthorized because it's a paid layer), remove it.
            newLayer.on('tileerror', () => {
                console.warn(`Layer ${layerName} failed to load (API limit or paid feature). Removing layer.`);
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
        const map = mapInstanceRef.current;
        if (!map || activeBaseLayer === layer) return;
        
        const currentLayer = baseLayersRef.current[activeBaseLayer];
        const newLayer = baseLayersRef.current[layer];

        if (currentLayer) map.removeLayer(currentLayer);
        if (newLayer) map.addLayer(newLayer);
        
        setActiveBaseLayer(layer);
    };
    
    const LayerButton: React.FC<{icon: React.ReactNode, label: string, onClick:() => void, isActive?: boolean}> = ({icon, label, onClick, isActive}) => (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 text-left text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors ${isActive ? 'bg-cyan-100/80 font-semibold text-cyan-800' : ''}`}>
            {icon}
            <span>{label}</span>
        </button>
    );

    const RadioButton: React.FC<{label: string, value: BaseLayer, checked: boolean, onChange: (value: BaseLayer) => void}> = ({label, value, checked, onChange}) => (
        <label className="flex items-center gap-2 cursor-pointer text-gray-800 px-3 py-1 rounded-md hover:bg-gray-200/50 w-full">
            <input 
                type="radio" 
                name="base-layer"
                value={value}
                checked={checked}
                onChange={() => onChange(value)}
                className="form-radio h-4 w-4 text-cyan-600 border-gray-400 focus:ring-cyan-500"
            />
            {label}
        </label>
    );

    return (
        <div className="w-full h-full relative">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute top-4 right-4 z-[401]" ref={layerMenuRef}>
                <div className="relative">
                    <button 
                        onClick={() => setIsLayerMenuOpen(prev => !prev)}
                        className="bg-white/80 backdrop-blur-md border border-gray-300/50 rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                        aria-label="Controle de camadas do mapa"
                        aria-expanded={isLayerMenuOpen}
                    >
                        <LayersIcon className="w-6 h-6 text-gray-800" />
                    </button>
                    {isLayerMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white/80 backdrop-blur-md border border-gray-300/50 rounded-xl shadow-lg p-2 flex flex-col gap-1 w-56">
                            <div className="p-2">
                                <h4 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Mapa Base</h4>
                                <div className="flex flex-col items-start gap-1">
                                    <RadioButton label="Padrão" value="standard" checked={activeBaseLayer === 'standard'} onChange={switchBaseLayer} />
                                    <RadioButton label="Relevo" value="relief" checked={activeBaseLayer === 'relief'} onChange={switchBaseLayer} />
                                </div>
                            </div>

                            <hr className="my-1 border-gray-300/50"/>
                            
                            <div className="p-2">
                                <h4 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Sobreposições do Clima</h4>
                                <div className="flex flex-col gap-1">
                                    <LayerButton icon={<ThermometerIcon className="w-5 h-5 text-orange-500"/>} label="Temperatura" onClick={() => toggleWeatherLayer('TA2')} isActive={activeOverlay === 'TA2'}/>
                                    <LayerButton icon={<WindIcon className="w-5 h-5 text-cyan-500"/>} label="Vento" onClick={() => toggleWeatherLayer('WS10')} isActive={activeOverlay === 'WS10'} />
                                    <LayerButton icon={<LayersIcon className="w-5 h-5 text-gray-500"/>} label="Nuvens" onClick={() => toggleWeatherLayer('CL')} isActive={activeOverlay === 'CL'}/>
                                    <LayerButton icon={<DropletsIcon className="w-5 h-5 text-blue-500"/>} label="Precipitação" onClick={() => toggleWeatherLayer('PR0')} isActive={activeOverlay === 'PR0'}/>
                                    <LayerButton icon={<GaugeIcon className="w-5 h-5 text-indigo-500"/>} label="Pressão" onClick={() => toggleWeatherLayer('APM')} isActive={activeOverlay === 'APM'}/>
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
