'use client';

import Map, { Marker, NavigationControl, Popup, GeolocateControl, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useRef, useState } from 'react';
import { Wrench, Car } from 'lucide-react';

// Тип даних для СТО
export interface StationData {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  location: { x: number; y: number };
}

// Оновлений інтерфейс пропсів
interface MapProps {
  stations: StationData[];
  userLocation?: { x: number; y: number } | null; // Локація SOS (червона машинка)
  
  // 👇 НОВІ ПОЛЯ, яких не вистачало
  selectedStationId?: number | null; 
  onSelectStation?: (station: StationData | null) => void;
}

const StationsMap = ({ 
  stations, 
  userLocation, 
  selectedStationId, 
  onSelectStation 
}: MapProps) => {
  
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapRef = useRef<MapRef>(null);
  
  // Внутрішній стан для попапу (щоб показувати інфо при кліку)
  const [popupInfo, setPopupInfo] = useState<StationData | null>(null);

  // 1. Ефект: Якщо прийшла локація користувача (SOS) -> летимо до неї
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({ center: [userLocation.x, userLocation.y], zoom: 13 });
    }
  }, [userLocation]);

  // 2. Ефект: Якщо вибрали станцію зі списку зліва -> летимо до неї
  useEffect(() => {
    if (selectedStationId && mapRef.current) {
      const station = stations.find(s => s.id === selectedStationId);
      if (station) {
        setPopupInfo(station); // Відкриваємо попап
        mapRef.current.flyTo({ center: [station.location.x, station.location.y], zoom: 14 });
      }
    } else {
        setPopupInfo(null); // Закриваємо попап, якщо вибір знято
    }
  }, [selectedStationId, stations]);

  if (!mapboxToken) return <div className="text-red-500 p-4">Token not found</div>;

  return (
    <div className="h-full w-full relative">
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: 50.4501,
          longitude: 30.5234,
          zoom: 11
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        attributionControl={false}
        // При кліку на порожнє місце карти - знімаємо виділення
        onClick={() => {
            if (onSelectStation) onSelectStation(null);
        }}
      >
        <GeolocateControl position="top-left" />
        <NavigationControl position="top-right" />

        {/* 1. МАРКЕР КОРИСТУВАЧА (SOS) - Червоний */}
        {userLocation && (
          <Marker longitude={userLocation.x} latitude={userLocation.y} anchor="bottom">
             <div className="relative">
                <div className="bg-red-600 p-3 rounded-full shadow-xl border-2 border-white animate-bounce">
                    <Car size={24} className="text-white" />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap z-10">
                    Я тут
                </div>
             </div>
          </Marker>
        )}

        {/* 2. МАРКЕРИ СТО */}
        {stations.map((station) => {
            const isSelected = station.id === selectedStationId;

            return (
              <Marker 
                key={station.id}
                longitude={station.location.x}
                latitude={station.location.y}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation(); // Щоб карта не ловила клік
                  if (onSelectStation) onSelectStation(station); // Кажемо батьку, що вибрали
                  setPopupInfo(station);
                }}
              >
                <div className={`p-2 rounded-xl shadow-md transition cursor-pointer border-2 border-white ${
                    isSelected 
                    ? 'bg-green-600 scale-125 z-20' // Зелений, якщо вибрано
                    : 'bg-blue-600 hover:scale-110' // Синій звичайний
                }`}>
                  <Wrench size={18} className="text-white" />
                </div>
              </Marker>
            );
        })}

        {/* 3. ПОПАП (Інфо-вікно на карті) */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.location.x}
            latitude={popupInfo.location.y}
            anchor="top"
            onClose={() => {
                setPopupInfo(null);
                if (onSelectStation) onSelectStation(null);
            }}
            className="text-black z-50"
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg">{popupInfo.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{popupInfo.address}</p>
              <a 
                href={`tel:${popupInfo.phone}`}
                className="block w-full text-center bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition"
              >
                📞 {popupInfo.phone}
              </a>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default StationsMap;