'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, MapPin, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function StationTab() {
  const { user, isLoading } = useAuth();
  const mapRef = useRef<MapRef>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const [station, setStation] = useState({ 
      name: '', 
      address: '', 
      phone: '', 
      description: '',
      lat: 50.4501, 
      lng: 30.5234 
  });

  useEffect(() => {
    if (!isLoading && user) {
        loadStation();
    }
  }, [user, isLoading]);

  const loadStation = async () => {
    try {
        const res = await api.get('/my-station');
        // Логіка підстановки телефону
        if (res.status !== 204 && res.data) {
             const stationPhone = res.data.phone && res.data.phone.length > 0 
                ? res.data.phone 
                : (user?.phone || '');

             setStation({ ...res.data, phone: stationPhone, lat: res.data.location.y, lng: res.data.location.x });
        } else {
            setStation(prev => ({ ...prev, phone: user?.phone || '' }));
        }
    } catch (e) {}
  };

  const saveStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try { 
        await api.post('/my-station', station); 
        toast.success("СТО успішно збережено! Оновлюємо профіль...");
        localStorage.setItem('profileTab', 'station');
        setTimeout(() => { window.location.reload(); }, 1500);
    } catch (e) { 
        toast.error("Помилка збереження. Перевірте дані."); 
    }
  };

  const geocodeAddress = async () => {
      if (!station.address) return toast.error("Введіть адресу");
      if (!mapboxToken) return toast.error("Token error");
      const toastId = toast.loading("Шукаємо адресу...");
      try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(station.address)}.json?access_token=${mapboxToken}&country=ua&language=uk`);
          const data = await res.json();
          if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].center;
              setStation(prev => ({ ...prev, lat, lng }));
              if (mapRef.current) mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
              toast.success("Знайдено на карті!", { id: toastId });
          } else {
              toast.error("Адресу не знайдено", { id: toastId });
          }
      } catch (e) { toast.error("Помилка геокодування", { id: toastId }); }
  };

  const reverseGeocode = async (lng: number, lat: number) => {
      if (!mapboxToken) return;
      try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=uk`);
          const data = await res.json();
          if (data.features && data.features.length > 0) {
              const address = data.features[0].place_name;
              setStation(prev => ({ ...prev, address: address, lat, lng }));
              toast.success("Адресу оновлено!");
          }
      } catch (e) { console.error("Reverse geocoding failed", e); }
  };

  const onMapClick = (e: any) => {
      const { lng, lat } = e.lngLat;
      setStation(prev => ({ ...prev, lat, lng }));
      reverseGeocode(lng, lat);
  };

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        setStation(prev => ({ ...prev, lat: latitude, lng: longitude }));
        if (mapRef.current) mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15 });
        reverseGeocode(longitude, latitude);
        toast.success("Визначено поточну локацію");
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-300 animate-in fade-in">
        <h3 className="font-extrabold text-lg mb-6 text-black">Налаштування СТО</h3>
        <form onSubmit={saveStation} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-extrabold text-black mb-1">Назва сервісу</label>
                    <input className="w-full p-3 border-2 border-gray-300 rounded-lg font-bold text-black focus:border-black outline-none placeholder:text-gray-400" 
                        value={station.name} onChange={e => setStation({...station, name: e.target.value})} placeholder="Напр: СТО 'Поршень'"/>
                </div>
                <div>
                    <label className="block text-sm font-extrabold text-black mb-1">Телефон</label>
                    <input className="w-full p-3 border-2 border-gray-300 rounded-lg font-bold text-black focus:border-black outline-none" 
                        value={station.phone} onChange={e => setStation({...station, phone: e.target.value})} placeholder="+380..."/>
                </div>
            </div>

            <div>
                <label className="block text-sm font-extrabold text-black mb-1">Адреса (Введіть або оберіть на карті)</label>
                <div className="flex gap-2">
                    <input className="w-full p-3 border-2 border-gray-300 rounded-lg font-bold text-black focus:border-black outline-none" 
                        value={station.address} onChange={e => setStation({...station, address: e.target.value})} 
                        placeholder="Введіть адресу та натисніть пошук ->"
                    />
                    <button type="button" onClick={geocodeAddress} className="bg-gray-100 border-2 border-gray-300 text-black px-4 rounded-lg hover:bg-gray-200 transition font-bold" title="Знайти координати за адресою">
                        <Search size={20}/>
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-bold">Натисніть на карту, щоб автоматично визначити адресу</p>
            </div>

            <div className="h-64 w-full rounded-xl overflow-hidden border-2 border-gray-300 relative">
                <Map
                    ref={mapRef}
                    initialViewState={{ longitude: station.lng, latitude: station.lat, zoom: 13 }}
                    style={{width: '100%', height: '100%'}}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                    mapboxAccessToken={mapboxToken}
                    onClick={onMapClick}
                    cursor="crosshair"
                >
                    <NavigationControl position="top-right" />
                    <Marker longitude={station.lng} latitude={station.lat} anchor="bottom">
                        <div className="text-black drop-shadow-lg">
                            <MapPin size={40} className="fill-red-600 text-white"/>
                        </div>
                    </Marker>
                </Map>
                <button type="button" onClick={getCurrentLocation} className="absolute bottom-4 right-4 bg-white text-black p-2 rounded-lg shadow-lg font-bold text-xs flex items-center gap-2 hover:bg-gray-100 z-10">
                    <MapPin size={16}/> Моя локація
                </button>
            </div>
            
            <button type="submit" className="w-full py-4 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition shadow-lg text-lg">
                <Save size={20} /> Зберегти та Стати Майстром
            </button>
        </form>
    </div>
  );
}