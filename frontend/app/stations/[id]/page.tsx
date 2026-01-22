'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { MapPin, Phone, Star, ArrowLeft, Wrench, User, X } from 'lucide-react';

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
    rating: number; // Рейтинг з бази (може бути застарілим)
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
    
    // Стан для перегляду фото на весь екран
    const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            api.get(`/stations/${id}`)
               .then(res => setStation(res.data))
               .catch(err => console.error(err))
               .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-800">Завантаження...</div>;
    if (!station) return <div className="h-screen flex items-center justify-center font-bold text-gray-800">СТО не знайдено</div>;

    const services = station.services_list ? station.services_list.split(',').map(s => s.trim()) : [];

    // 🔥 Розрахунок рейтингу на льоту (щоб не показувало 0, якщо є відгуки)
    const calculatedRating = station.reviews && station.reviews.length > 0
        ? (station.reviews.reduce((acc, r) => acc + r.rating, 0) / station.reviews.length).toFixed(1)
        : station.rating || "New";

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Навігація назад */}
            <div className="absolute top-4 left-4 z-10">
                <button onClick={() => router.back()} className="bg-white/90 p-3 rounded-full shadow-lg backdrop-blur hover:bg-white transition text-black">
                    <ArrowLeft size={24}/>
                </button>
            </div>

            {/* 1. ВЕЛИКЕ ФОТО (COVER) */}
            <div 
                className="h-72 bg-gray-200 relative overflow-hidden cursor-pointer group"
                onClick={() => station.photos.length > 0 && setFullScreenImage(station.photos[0].url)}
            >
                {station.photos.length > 0 ? (
                    <img src={station.photos[0].url} alt={station.name} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                        <Wrench size={64} className="opacity-20"/>
                    </div>
                )}
                <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black/90 to-transparent"></div>
                <div className="absolute bottom-6 left-6 text-white max-w-lg">
                    <h1 className="text-3xl font-extrabold mb-2 leading-tight drop-shadow-md">{station.name}</h1>
                    <div className="flex items-center gap-2">
                        <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-md font-black flex items-center gap-1 text-sm shadow-sm">
                            <Star fill="black" size={12}/> {calculatedRating}
                        </div>
                        <span className="text-gray-200 text-sm font-bold">({station.reviews?.length || 0} відгуків)</span>
                    </div>
                </div>
            </div>

            {/* 2. КОНТЕНТ */}
            <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-10 space-y-4">
                
                {/* Картка контактів */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
                    <div className="flex gap-3">
                        <a href={`tel:${station.phone}`} className="flex-1 bg-black text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-800 shadow-lg transition transform active:scale-95">
                            <Phone size={18}/> Подзвонити
                        </a>
                        <button className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 text-black font-bold transition">
                            <MapPin size={20}/>
                        </button>
                    </div>
                    <p className="text-gray-800 text-base font-bold border-t border-gray-100 pt-4 flex items-center gap-2">
                        <MapPin size={18} className="text-blue-600"/> {station.address}
                    </p>
                </div>

                {/* Галерея (ВСІ ФОТО) */}
                {station.photos.length > 0 && (
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                        <h3 className="font-extrabold text-lg text-black mb-3">Фотографії</h3>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {/* 🔥 Виводимо ВСІ фото, включно з першим */}
                            {station.photos.map(photo => (
                                <img 
                                    key={photo.id} 
                                    src={photo.url} 
                                    onClick={() => setFullScreenImage(photo.url)}
                                    className="w-24 h-24 object-cover rounded-xl flex-shrink-0 border border-gray-200 cursor-zoom-in hover:opacity-90 transition" 
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Послуги та Опис */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    {services.length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-extrabold text-lg text-black mb-3">Послуги</h3>
                            <div className="flex flex-wrap gap-2">
                                {services.map((s, i) => (
                                    <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-blue-100">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {station.description && (
                        <div>
                            <h3 className="font-extrabold text-lg text-black mb-2">Про сервіс</h3>
                            <p className="text-gray-800 leading-relaxed text-base font-medium">{station.description}</p>
                        </div>
                    )}
                </div>

                {/* ВІДГУКИ */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10">
                    <h3 className="font-extrabold text-xl text-black mb-6 flex items-center gap-2">
                        Відгуки <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-sm">{station.reviews?.length || 0}</span>
                    </h3>
                    
                    {!station.reviews || station.reviews.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Star size={48} className="mx-auto mb-3 opacity-20"/>
                            <p className="font-medium">Ще немає відгуків</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {station.reviews.map(review => (
                                <div key={review.id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
                                                <User size={18}/>
                                            </div>
                                            <div>
                                                <span className="font-bold text-base text-black block">{review.author_name}</span>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star 
                                                            key={i} 
                                                            size={12} 
                                                            className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">{review.created_at}</span>
                                    </div>
                                    <p className="text-gray-800 text-sm leading-relaxed font-medium pl-[52px]">
                                        {review.comment}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* 🔥 LIGHTBOX (ФОТО НА ВЕСЬ ЕКРАН) */}
            {fullScreenImage && (
                <div 
                    className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
                    onClick={() => setFullScreenImage(null)}
                >
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white transition p-2 bg-white/10 rounded-full">
                        <X size={32}/>
                    </button>
                    <img 
                        src={fullScreenImage} 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()} // Щоб клік по фото не закривав
                    />
                </div>
            )}
        </div>
    );
}