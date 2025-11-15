import React, { useEffect, useRef } from 'react';

// Since leaflet is loaded from a CDN script in index.html, we declare 'L' to be available globally.
declare var L: any;

const MapView: React.FC = () => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapContainerRef.current || typeof L === 'undefined') {
            return;
        }

        // Initialize map only once
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current).setView([-30.0346, -51.2177], 13); // Porto Alegre coordinates

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            // Define custom icon to fix potential path and anchor issues with CDN
            const customIcon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [0, -41], // Precisely align popup over the icon tip
                shadowSize: [41, 41]
            });

            // Add a marker with the custom icon and simplified content
            L.marker([-30.0346, -51.2177], { icon: customIcon }).addTo(map)
                .bindPopup('Porto Alegre')
                .openPopup();
            
            mapInstanceRef.current = map;
        }

        // Use a ResizeObserver to handle map resizing when its container becomes visible
        const resizeObserver = new ResizeObserver(() => {
            mapInstanceRef.current?.invalidateSize();
        });
        
        const currentContainer = mapContainerRef.current;
        if (currentContainer) {
            resizeObserver.observe(currentContainer);
        }

        // Handle component unmount
        return () => {
            if (currentContainer) {
                resizeObserver.unobserve(currentContainer);
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return <div ref={mapContainerRef} className="w-full h-full" />;
};

export default MapView;