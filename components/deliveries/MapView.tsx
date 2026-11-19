import React from 'react';

interface MapViewProps {
    route?: { lat: number; lng: number }[];
    currentLocation?: { lat: number; lng: number };
}

const MapView: React.FC<MapViewProps> = ({ route, currentLocation }) => {
    if (!route || route.length === 0) {
        return (
            <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-text-secondary dark:text-dark-text-secondary">No route data available.</p>
            </div>
        );
    }
    
    const allPoints = [...route, ...(currentLocation ? [currentLocation] : [])];
    const latitudes = allPoints.map(p => p.lat);
    const longitudes = allPoints.map(p => p.lng);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latRange = maxLat - minLat || 1;
    const lngRange = maxLng - minLng || 1;

    // Add some padding to the view
    const PADDING = 0.15;
    const paddedMinLat = minLat - latRange * PADDING;
    const paddedMaxLat = maxLat + latRange * PADDING;
    const paddedMinLng = minLng - lngRange * PADDING;
    const paddedMaxLng = maxLng + lngRange * PADDING;

    const paddedLatRange = paddedMaxLat - paddedMinLat;
    const paddedLngRange = paddedMaxLng - paddedMinLng;

    const getPosition = (lat: number, lng: number) => {
        const left = ((lng - paddedMinLng) / paddedLngRange) * 100;
        const top = ((paddedMaxLat - lat) / paddedLatRange) * 100;
        return { left: `${left}%`, top: `${top}%` };
    };

    const startPoint = route[0];
    const endPoint = route[route.length - 1];

    return (
        <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg relative overflow-hidden">
            {/* Route path */}
            {route.map((point, index) => (
                <div 
                    key={`route-${index}`}
                    className="absolute w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                    style={getPosition(point.lat, point.lng)}
                />
            ))}
            
            {/* Start Point (Store) */}
            <div 
                className="absolute transform -translate-x-1/2 -translate-y-full"
                style={getPosition(startPoint.lat, startPoint.lng)}
            >
                 <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                    <span className="text-xs font-bold text-primary">Store</span>
                </div>
            </div>

            {/* End Point (Customer) */}
             <div 
                className="absolute transform -translate-x-1/2 -translate-y-full"
                style={getPosition(endPoint.lat, endPoint.lng)}
            >
                 <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-bold text-green-500">Customer</span>
                </div>
            </div>

            {/* Current Location (Driver) */}
            {currentLocation && (
                <div 
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={getPosition(currentLocation.lat, currentLocation.lng)}
                >
                     <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                </div>
            )}
        </div>
    );
};

export default MapView;