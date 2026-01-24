'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Phone, Star, ArrowLeft, Wrench, ShieldCheck, Clock } from 'lucide-react';
import StationReviews from '@/components/StationReviews';
import StationPortfolio from '@/components/StationPortfolio';

// Типи (можна винести в types.ts)
interface Photo { id: number; url: string; }
interface Review { 
    id: number; 
    author_name: string; 
    rating: number; 
    comment: string; 
    created_at: string; 
}
interface Station {
    id: number;
    name: string;
    description: string;
    services_list: string;
    rating: number;
    address: string;
    phone: string;
    photos: Photo[];
    reviews: Review[];
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

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-400">Завантаження профілю...</div>;
    if (!station) return <div className="h-screen flex items-center justify-center font-bold text-gray-400">СТО не знайдено</div>;

    const services = station.services_list ? station.services_list.split(',').map(s => s.trim()) : [];
    
    // Розрахунок рейтингу
    const ratingValue = station.reviews && station.reviews.length > 0
        ? (station.reviews.reduce((acc, r) => acc + r.rating, 0) / station.reviews.length).toFixed(1)
        : "New";

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Кнопка Назад */}
            <div className="fixed top-4 left-4 z-20">
                <button onClick={() => router.back()} className="bg-white/80 p-3 rounded-full shadow-lg backdrop-blur-md hover:bg-white transition text-black border border-gray-100">
                    <ArrowLeft size={24}/>
                </button>
            </div>

            {/* 1. COVER PHOTO + HEADER */}
            <div className="relative h-80 bg-gray-900">
                {station.photos.length > 0 ? (
                    <>
                        <img src={station.photos[0].url} alt={station.name} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent"></div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                        <Wrench size={80} className="text-white"/>
                    </div>
                )}
                
                <div className="absolute bottom-0 inset-x-0 p-6 pb-10">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-black text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">СТО</span>
                            {Number(ratingValue) > 4.5 && (
                                <span className="bg-yellow-400 text-black text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Star size={10} fill="black"/> Топ майстер
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-black leading-tight mb-2 drop-shadow-sm">{station.name}</h1>
                        <p className="text-gray-600 font-medium flex items-center gap-2 text-sm sm:text-base">
                            <MapPin size={18} className="text-blue-600"/> {station.address}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. ОСНОВНИЙ КОНТЕНТ */}
            <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10 space-y-6">
                
                {/* Блок Статистики (Новий!) */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-2xl font-black text-black">{ratingValue}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Рейтинг</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-2xl font-black text-black">{station.reviews?.length || 0}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Відгуків</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center">
                        <div className="text-2xl font-black text-green-600 flex justify-center"><ShieldCheck/></div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Перевірено</div>
                    </div>
                </div>

                {/* Кнопка дії */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <a href={`tel:${station.phone}`} className="w-full bg-black text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800 transition active:scale-95 shadow-lg">
                        <Phone size={20}/> Зателефонувати майстру
                    </a>
                </div>

                {/* Послуги */}
                {services.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-extrabold text-lg text-black mb-4 flex items-center gap-2">
                            <Wrench size={20} className="text-gray-400"/> Послуги
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {services.map((s, i) => (
                                <span key={i} className="bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-sm font-bold border border-gray-200">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Опис */}
                {station.description && (
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-extrabold text-lg text-black mb-3">Про майстерню</h3>
                        <p className="text-gray-600 leading-relaxed font-medium">{station.description}</p>
                    </div>
                )}

                {/* Портфоліо (Компонент) */}
                <StationPortfolio photos={station.photos} />

                {/* Відгуки (Компонент) */}
                <StationReviews reviews={station.reviews} />

            </div>
        </div>
    );
}