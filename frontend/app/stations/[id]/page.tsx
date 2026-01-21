'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Phone, Star, ArrowLeft, Wrench } from 'lucide-react';
import Header from '@/components/Header';

interface Photo { id: number; url: string; }
interface Station {
    id: number;
    name: string;
    description: string;
    services_list: string;
    rating: number;
    address: string;
    phone: string;
    photos: Photo[];
}

export default function StationDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [station, setStation] = useState<Station | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            api.get(`/stations/${id}`)
               .then(res => setStation(res.data))
               .catch(err => console.error(err))
               .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-500">Завантаження...</div>;
    if (!station) return <div className="h-screen flex items-center justify-center">СТО не знайдено</div>;

    const services = station.services_list ? station.services_list.split(',').map(s => s.trim()) : [];

    return (
        <div className="min-h-screen bg-white pb-20">
            {/* Навігація назад */}
            <div className="absolute top-4 left-4 z-10">
                <button onClick={() => router.back()} className="bg-white/90 p-3 rounded-full shadow-lg backdrop-blur hover:bg-white transition">
                    <ArrowLeft size={24}/>
                </button>
            </div>

            {/* 1. ВЕЛИКЕ ФОТО (COVER) */}
            <div className="h-64 sm:h-80 bg-gray-200 relative overflow-hidden">
                {station.photos.length > 0 ? (
                    <img src={station.photos[0].url} alt={station.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <Wrench size={48} className="opacity-20"/>
                    </div>
                )}
                <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/70 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                    <h1 className="text-2xl sm:text-3xl font-extrabold">{station.name}</h1>
                    <div className="flex items-center gap-1 text-yellow-400 font-bold mt-1">
                        <Star fill="currentColor" size={16}/> {station.rating}
                    </div>
                </div>
            </div>

            {/* 2. КОНТЕНТ */}
            <div className="max-w-2xl mx-auto p-5 -mt-4 bg-white rounded-t-3xl relative z-10">
                
                {/* Адреса і Телефон */}
                <div className="flex gap-4 mb-6">
                    <a href={`tel:${station.phone}`} className="flex-1 bg-black text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800">
                        <Phone size={18}/> Подзвонити
                    </a>
                </div>
                <p className="text-gray-500 flex items-center gap-2 mb-6 text-sm">
                    <MapPin size={16}/> {station.address}
                </p>

                {/* Галерея (Решта фото) */}
                {station.photos.length > 1 && (
                    <div className="mb-8">
                        <h3 className="font-bold text-lg mb-3">Фотографії</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                            {station.photos.slice(1).map(photo => (
                                <img 
                                    key={photo.id} 
                                    src={photo.url} 
                                    className="w-32 h-32 object-cover rounded-xl flex-shrink-0 border border-gray-100 snap-center" 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Послуги */}
                {services.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-bold text-lg mb-3">Послуги</h3>
                        <div className="flex flex-wrap gap-2">
                            {services.map((s, i) => (
                                <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-bold">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Опис */}
                {station.description && (
                    <div>
                        <h3 className="font-bold text-lg mb-2">Про сервіс</h3>
                        <p className="text-gray-600 leading-relaxed">{station.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}