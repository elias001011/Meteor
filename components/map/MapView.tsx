
import React, { useEffect, useRef } from 'react';

// Since leaflet is loaded from a CDN script in index.html, we declare 'L' to be available globally.
declare var L: any;

const MapView: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        // Initialize map only once
        if (mapContainerRef.current && !mapInstanceRef.current) {
            // Check if Leaflet is loaded
            if (typeof L === 'undefined') {
                console.error("Leaflet is not loaded.");
                return;
            }

            const map = L.map(mapContainerRef.current).setView([-30.0346, -51.2177], 13); // Porto Alegre coordinates

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Add a marker
            L.marker([-30.0346, -51.2177]).addTo(map)
                .bindPopup('Porto Alegre, RS')
                .openPopup();
            
            mapInstanceRef.current = map;
        }

        // Handle component unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return <div ref={mapContainerRef} className="w-full h-full" />;
};

export default MapView;
