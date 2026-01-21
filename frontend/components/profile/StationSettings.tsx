'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, MapPin, Loader2, Navigation } from 'lucide-react';
import Map, { Marker, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Station } from '../../app/profile/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function StationSettings() {
    const [station, setStation] = useState<Station | null>(null);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef<MapRef>(null);
    
    const [form, setForm] = useState({
        name: '', description: '', services_list: '', address: '', phone: '', lat: 50.45, lng: 30.52
    });

    useEffect(() => { fetchStation(); }, []);

    const fetchStation = async () => {
        try {
            const res = await api.get('/my-station');
            if (res.data) {
                setStation(res.data);
                setForm({
                    name: res.data.name,
                    description: res.data.description,
                    services_list: res.data.services_list || '',
                    address: res.data.address,
                    phone: res.data.phone || '',
                    lat: res.data.location?.y || 50.45,
                    lng: res.data.location?.x || 30.52
                });
            }
        } catch (e) { } finally { setLoading(false); }
    };

    // --- КАРТА (Клік замість Drag) ---
    const handleMapClick = async (event: any) => {
        const { lng, lat } = event.lngLat;
        setForm(prev => ({ ...prev, lat, lng }));

        // Отримуємо адресу (Reverse Geocoding)
        if (MAPBOX_TOKEN) {
             try {
                const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=uk`);
                const data = await res.json();
                if (data.features?.[0]) {
                    setForm(prev => ({ ...prev, address: data.features[0].place_name }));
                }
            } catch (e) { console.error(e); }
        }
    };

    // --- КНОПКА "ДЕ Я" ---
    const handleGeolocate = (evt: any) => {
        // Коли Mapbox знайшов координати, оновлюємо форму
        const { longitude, latitude } = evt.coords;
        setForm(prev => ({ ...prev, lng: longitude, lat: latitude }));
        // І відразу шукаємо адресу
        handleMapClick({ lngLat: { lng: longitude, lat: latitude } });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/my-station', form);
            setStation(res.data);
            toast.success("СТО збережено!");
        } catch (e) { toast.error("Помилка збереження"); }
    };

    // --- ФОТО ---
    const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const formData = new FormData();
        formData.append('file', e.target.files[0]);
        const tId = toast.loading("Завантаження...");
        try {
            await api.post('/my-station/photos', formData);
            toast.success("Додано", { id: tId });
            fetchStation();
        } catch (e) { toast.error("Помилка", { id: tId }); }
    };

    const handleDeletePhoto = async (id: number) => {
        if(!confirm("Видалити фото?")) return;
        await api.delete(`/my-station/photos/${id}`);
        fetchStation();
    };

    if (loading) return <Loader2 className="animate-spin mx-auto"/>;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4">
             {/* ГАЛЕРЕЯ (Без змін) */}
             {station && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-black">Фотографії СТО</h3>
                        <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-100 flex items-center gap-2">
                            <Plus size={16}/> Додати
                            <input type="file" hidden accept="image/*" onChange={handleUploadPhoto} />
                        </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {station.photos.map(p => (
                            <div key={p.id} className="relative aspect-square group rounded-xl overflow-hidden border border-gray-200">
                                <img src={p.url} className="w-full h-full object-cover"/>
                                <button onClick={() => handleDeletePhoto(p.id)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition"><Trash2/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                <h3 className="font-bold text-black text-lg">Локація та Дані</h3>
                
                {/* ОНОВЛЕНА МАПА */}
                <div className="h-72 rounded-xl overflow-hidden border border-gray-300 relative group">
                    {MAPBOX_TOKEN ? (
                         <Map
                            ref={mapRef}
                            initialViewState={{ longitude: form.lng, latitude: form.lat, zoom: 13 }}
                            // Важливо: прив'язуємо координати до стейту
                            longitude={form.lng}
                            latitude={form.lat}
                            mapStyle="mapbox://styles/mapbox/streets-v12"
                            mapboxAccessToken={MAPBOX_TOKEN}
                            onClick={handleMapClick} // 👈 Клік по карті
                            cursor="pointer"
                        >
                            {/* Кнопки керування */}
                            <NavigationControl position="top-right" showCompass={false} />
                            
                            <GeolocateControl 
                                position="top-left" 
                                onGeolocate={handleGeolocate} // 👈 Локація користувача
                                trackUserLocation
                                showUserHeading
                            />

                            <Marker 
                                longitude={form.lng} 
                                latitude={form.lat} 
                                anchor="bottom"
                            >
                                <MapPin size={40} className="text-red-600 fill-current drop-shadow-xl animate-bounce"/>
                            </Marker>
                        </Map>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">NO TOKEN</div>
                    )}
                    
                    {/* Підказка */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-bold shadow pointer-events-none opacity-0 group-hover:opacity-100 transition">
                        Натисніть на карту, щоб поставити точку
                    </div>
                </div>

                {/* Решта форми без змін */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Назва</label>
                        <input required type="text" className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-black"
                            value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Телефон</label>
                        <input required type="text" className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-black"
                            value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Адреса (автоматично)</label>
                    <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-black"
                        value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Опис та Послуги</label>
                    <textarea className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-black h-20 mb-2"
                        placeholder="Опис СТО" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <input type="text" placeholder="Послуги (Шиномонтаж...)" className="w-full p-3 bg-white border border-gray-300 rounded-xl font-medium text-black"
                        value={form.services_list} onChange={e => setForm({...form, services_list: e.target.value})} />
                </div>

                <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition flex justify-center items-center gap-2 mt-4">
                    <Save size={20}/> Зберегти налаштування
                </button>
            </form>
        </div>
    );
}