'use client';

import Map, { Marker, NavigationControl, Popup, MapRef, Source, Layer, FillExtrusionLayer, LineLayer, FillLayer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Wrench, Car, MapPin, User, Moon, Sun, TrafficCone } from 'lucide-react';
import * as turf from '@turf/turf';

export interface StationData {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  location: { x: number; y: number };
}

interface MapProps {
  stations: StationData[];
  userLocation?: { x: number; y: number } | null;
  selectedStationId?: number | null; 
  onSelectStation?: (station: StationData | null) => void;
  highlightedStation?: StationData | null;
  isSos?: boolean;
}

// --- СТИЛІ ШАРІВ ---
const buildingLayer: FillExtrusionLayer = {
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 14,
    paint: {
        'fill-extrusion-color': '#aaa',
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-base': ['get', 'min_height'],
        'fill-extrusion-opacity': 0.6
    }
};

const routeLayer: LineLayer = {
    id: 'route',
    type: 'line',
    source: 'route-source',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.8 }
};

const radiusLayer: FillLayer = {
    id: 'radius-fill',
    type: 'fill',
    source: 'radius-source',
    paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.1 }
};

const StationsMap = ({ 
  stations, 
  userLocation, 
  selectedStationId, 
  onSelectStation,
  highlightedStation,
  isSos = false
}: MapProps) => {
  
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<StationData | null>(null);
  
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [showTraffic, setShowTraffic] = useState(false);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);

  // --- МАРШРУТ ---
  useEffect(() => {
    if (userLocation && highlightedStation) {
        getRoute(userLocation, highlightedStation.location);
    } else {
        setRouteGeoJSON(null);
    }
  }, [userLocation, highlightedStation]);

  const getRoute = async (start: {x: number, y: number}, end: {x: number, y: number}) => {
      try {
          const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${start.x},${start.y};${end.x},${end.y}?steps=true&geometries=geojson&access_token=${mapboxToken}`
          );
          const json = await query.json();
          if (json.routes?.[0]) {
              setRouteGeoJSON({
                type: 'Feature',
                properties: {},
                geometry: json.routes[0].geometry
              });
          }
      } catch (error) { console.error(error); }
  };

  // --- РАДІУС ---
  const radiusGeoJSON = useMemo(() => {
      if (!userLocation) return null;
      try {
          return turf.circle([userLocation.x, userLocation.y], 50, { steps: 64, units: 'kilometers' });
      } catch (e) { return null; }
  }, [userLocation]);

  // --- 1. ГОЛОВНИЙ ЕФЕКТ: ЦЕНТРУВАННЯ НА ЮЗЕРІ ---
  useEffect(() => {
    if (userLocation && mapRef.current) {
      // Тепер flyTo спрацює, бо ми не блокуємо його через viewState
      mapRef.current.flyTo({ 
          center: [userLocation.x, userLocation.y], 
          zoom: 14, 
          pitch: 0 
      });
    }
  }, [userLocation]);

  // 2. ЦЕНТРУВАННЯ НА СТАНЦІЇ
  useEffect(() => {
    if (selectedStationId && mapRef.current) {
      const station = stations.find(s => s.id === selectedStationId);
      if (station) {
        setPopupInfo(station);
        mapRef.current.flyTo({ center: [station.location.x, station.location.y], zoom: 15, pitch: 45 });
      }
    }
  }, [selectedStationId, stations]);

  // 3. ЦЕНТРУВАННЯ НА МАЙСТРІ
  useEffect(() => {
    if (highlightedStation && mapRef.current) {
        setPopupInfo(highlightedStation);
        mapRef.current.flyTo({ 
            center: [highlightedStation.location.x, highlightedStation.location.y], 
            zoom: 15, 
            pitch: 50 
        });
    }
  }, [highlightedStation]);

  if (!mapboxToken) return <div className="text-red-500 p-4">Token not found</div>;

  return (
    <div className="h-full w-full relative group">
      <Map
        ref={mapRef}
        // ВИДАЛЕНО: ...viewState та onMove
        // ДОДАНО: initialViewState (стартова точка, поки не прилетить реальна)
        initialViewState={{
            latitude: 50.45,
            longitude: 30.52,
            zoom: 10
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={
            showTraffic 
            ? 'mapbox://styles/mapbox/traffic-day-v2' 
            : mode === 'dark' 
                ? 'mapbox://styles/mapbox/navigation-night-v1' 
                : 'mapbox://styles/mapbox/streets-v12'
        }
        mapboxAccessToken={mapboxToken}
        attributionControl={false}
        onClick={() => {
            if (onSelectStation) onSelectStation(null);
            setPopupInfo(null);
        }}
        terrain={{source: 'mapbox-dem', exaggeration: 1.5}} 
      >
        <NavigationControl position="top-right" />

        <Layer {...buildingLayer} />

        {radiusGeoJSON && (
            <Source id="radius-source" type="geojson" data={radiusGeoJSON}>
                <Layer {...radiusLayer} />
            </Source>
        )}

        {routeGeoJSON && (
            <Source id="route-source" type="geojson" data={routeGeoJSON}>
                <Layer {...routeLayer} />
            </Source>
        )}

        {/* МАРКЕР КОРИСТУВАЧА */}
        {userLocation && (
          <Marker 
            longitude={userLocation.x} 
            latitude={userLocation.y} 
            anchor="bottom"
          >
             <div className="relative">
                <div className={`p-3 rounded-full shadow-xl border-2 border-white ${
                    isSos ? 'bg-red-600 animate-bounce' : 'bg-blue-600'
                }`}>
                    {isSos ? <Car size={24} className="text-white" /> : <User size={24} className="text-white" />}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap z-10 font-bold">
                    {isSos ? 'SOS' : 'Я тут'}
                </div>
             </div>
          </Marker>
        )}

        {/* СТО */}
        {stations.map((station) => {
            if (highlightedStation && station.id === -highlightedStation.id) return null;
            const isSelected = station.id === selectedStationId;
            return (
              <Marker 
                key={station.id}
                longitude={station.location.x}
                latitude={station.location.y}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  if (onSelectStation) onSelectStation(station);
                  setPopupInfo(station);
                }}
              >
                <div className={`p-2 rounded-xl shadow-md transition cursor-pointer border-2 border-white ${
                    isSelected ? 'bg-green-600 scale-125 z-20' : 'bg-blue-600 hover:scale-110'
                }`}>
                  <Wrench size={18} className="text-white" />
                </div>
              </Marker>
            );
        })}

        {/* МАЙСТЕР */}
        {highlightedStation && (
             <Marker 
                longitude={highlightedStation.location.x}
                latitude={highlightedStation.location.y}
                anchor="bottom"
                onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    setPopupInfo(highlightedStation);
                }}
             >
                <div className="relative">
                    <div className="bg-purple-600 p-3 rounded-xl shadow-xl border-2 border-white scale-110 z-30 animate-pulse">
                        <MapPin size={24} className="text-white" />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-purple-900 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap z-40 font-bold shadow-sm">
                        Майстер
                    </div>
                </div>
             </Marker>
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.location.x}
            latitude={popupInfo.location.y}
            anchor="top"
            onClose={() => setPopupInfo(null)}
            className="text-black z-50"
            closeOnClick={false}
          >
            <div className="flex gap-2 mt-2">
    <a href={`tel:${popupInfo.phone}`} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold text-center text-xs">
        📞 Дзвінок
    </a>
    <a href={`/stations/${popupInfo.id}`} className="flex-1 bg-gray-100 text-black py-2 rounded-lg font-bold text-center text-xs hover:bg-gray-200">
        Детальніше
    </a>
</div>
          </Popup>
        )}
      </Map>

      {/* Кнопки */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
         <button 
            onClick={() => setMode(prev => prev === 'light' ? 'dark' : 'light')}
            className="bg-white p-2 rounded-lg shadow-lg border border-gray-200 hover:bg-gray-100 transition"
         >
            {mode === 'light' ? <Moon size={20} className="text-gray-700"/> : <Sun size={20} className="text-orange-500"/>}
         </button>
         <button 
            onClick={() => setShowTraffic(prev => !prev)}
            className={`p-2 rounded-lg shadow-lg border transition ${showTraffic ? 'bg-orange-100 border-orange-500' : 'bg-white border-gray-200'}`}
         >
            <TrafficCone size={20} className={showTraffic ? 'text-orange-600' : 'text-gray-400'}/>
         </button>
      </div>
    </div>
  );
};

export default StationsMap;