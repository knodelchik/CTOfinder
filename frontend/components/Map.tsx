'use client';

import Map, { Marker, NavigationControl, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useState } from 'react';
import { Car } from 'lucide-react';

// Тип даних, який ми чекаємо від батька
export interface RequestData {
  id: number;
  car_model: string;
  description: string;
  price?: number; // Може не бути
  location: { x: number; y: number };
}

interface MapProps {
  requests: RequestData[]; // Карта приймає масив заявок
}

const KYIV_COORDS = {
  latitude: 50.4501,
  longitude: 30.5234,
  zoom: 11
};

const MapComponent = ({ requests }: MapProps) => {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);

  if (!mapboxToken) return <div className="text-red-500 p-4">Token not found</div>;

  return (
    <div className="h-full w-full relative">
      <Map
        initialViewState={KYIV_COORDS}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={mapboxToken}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />

        {/* Малюємо маркери, які передала батьківська сторінка */}
        {requests.map((req) => (
          <Marker 
            key={req.id}
            longitude={req.location.x}
            latitude={req.location.y}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedRequest(req);
            }}
          >
            <div className="bg-white p-2 rounded-full shadow-lg hover:scale-110 transition cursor-pointer group">
              <Car size={18} className="text-black group-hover:text-blue-600" />
            </div>
          </Marker>
        ))}

        {/* Спливаюче вікно */}
        {selectedRequest && (
          <Popup
            longitude={selectedRequest.location.x}
            latitude={selectedRequest.location.y}
            anchor="top"
            onClose={() => setSelectedRequest(null)}
            closeOnClick={false}
            className="text-black" // Важливо, бо темна тема карти робить текст білим
          >
            <div className="p-1 min-w-[140px]">
              <h3 className="font-bold text-sm">{selectedRequest.car_model}</h3>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{selectedRequest.description}</p>
              <button className="w-full bg-blue-600 text-white text-xs py-1.5 rounded font-medium hover:bg-blue-700">
                Деталі
              </button>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default MapComponent;