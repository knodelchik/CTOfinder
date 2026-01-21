'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import api from '@/lib/api';
import { Clock, CheckCircle, MapPin, Phone, Navigation, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Job {
    id: number;           // ID самої заявки
    offer_id: number;     // ID вашої пропозиції
    car_model: string;
    description: string;
    price: number;
    status: 'pending' | 'accepted' | 'rejected'; // Статус вашої пропозиції
    client_name: string;
    client_phone: string;
    request_status: string; // Статус самої заявки (new, in_progress, done)
    location?: { x: number, y: number };
}

export default function MyJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');

    useEffect(() => {
        fetchMyJobs();
    }, []);

    const fetchMyJobs = async () => {
        try {
            // Вам потрібно буде додати цей ендпоінт на бекенді!
            // GET /api/mechanic/my-offers
            const res = await api.get('/offers/mechanic/my-offers');
            setJobs(res.data);
        } catch (e) {
            console.error(e);
            toast.error("Не вдалося завантажити мої роботи");
        } finally {
            setLoading(false);
        }
    };

    const handleFinishJob = async (requestId: number) => {
        if(!confirm("Підтвердіть виконання роботи")) return;
        try {
            await api.post(`/requests/${requestId}/finish`);
            toast.success("Роботу завершено!");
            fetchMyJobs();
        } catch (e) { toast.error("Помилка завершення"); }
    };
console.log("Всі роботи:", jobs);

    // ВИПРАВЛЕНА ЛОГІКА ФІЛЬТРАЦІЇ:
    
    // 1. Активні: Мене вибрали (accepted) І заявка ще не закрита (done або canceled)
    const activeJobs = jobs.filter(j => 
        j.status === 'accepted' && 
        j.request_status !== 'done' && 
        j.request_status !== 'canceled'
    );

    // 2. Очікують: Я відправив (pending) І заявка все ще нова (new)
    // (Якщо заявка вже 'in_progress' або 'done', а мене не вибрали — це піде в архів, тут не показуємо)
    const pendingOffers = jobs.filter(j => 
        j.status === 'pending' && 
        j.request_status === 'new'
    );

    const displayedJobs = activeTab === 'active' ? activeJobs : pendingOffers;
    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-2xl mx-auto p-4">
                <h1 className="text-3xl font-extrabold text-black mb-6">Мої роботи</h1>

                {/* Таби */}
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <button 
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'active' ? 'bg-black text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        В роботі ({activeJobs.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('pending')}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'pending' ? 'bg-black text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Очікують ({pendingOffers.length})
                    </button>
                </div>

                <div className="space-y-4">
                    {displayedJobs.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <p>Список порожній</p>
                        </div>
                    )}

                    {displayedJobs.map(job => (
                        <div key={job.offer_id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                            
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-extrabold text-lg text-black">{job.car_model}</h3>
                                    <div className="text-green-600 font-black text-xl mt-1">{job.price} ₴</div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${activeTab === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {activeTab === 'active' ? 'Виконується' : 'Очікує клієнта'}
                                </span>
                            </div>

                            <p className="text-gray-600 bg-gray-50 p-3 rounded-xl text-sm mb-4 border border-gray-100">
                                {job.description}
                            </p>

                            {/* Якщо робота активна - показуємо контакти і кнопку фінішу */}
                            {activeTab === 'active' && (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <a href={`tel:${job.client_phone}`} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700">
                                            <Phone size={18}/> {job.client_phone}
                                        </a>
                                        {job.location && (
                                            <a 
                                                href={`https://www.google.com/maps?q=${job.location.y},${job.location.x}`}
                                                target="_blank"
                                                className="px-4 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center hover:bg-blue-200"
                                            >
                                                <Navigation size={20}/>
                                            </a>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleFinishJob(job.id)}
                                        className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800"
                                    >
                                        <CheckCircle size={18}/> Завершити замовлення
                                    </button>
                                </div>
                            )}

                            {/* Якщо це просто офер - кнопка скасування */}
                            {activeTab === 'pending' && (
                                <button className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition flex items-center justify-center gap-2">
                                    <XCircle size={18}/> Скасувати пропозицію
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}