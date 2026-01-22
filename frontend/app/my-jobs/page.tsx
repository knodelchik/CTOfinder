'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import api from '@/lib/api';
import { Clock, CheckCircle, Phone, Navigation, XCircle, Loader2, Star, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewModal from '@/components/ReviewModal'; // 👇 Імпорт

interface Job {
    id: number;
    offer_id: number;
    car_model: string;
    description: string;
    price: number;
    status: 'pending' | 'accepted' | 'rejected';
    client_name: string;
    client_phone: string;
    request_status: string; // new, in_progress, done
    location?: { x: number, y: number };
    has_client_review?: boolean; 
}

export default function MyJobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'history'>('active');
    
    // Для модалки
    const [reviewJob, setReviewJob] = useState<Job | null>(null);

    useEffect(() => {
        fetchMyJobs();
    }, []);

    const fetchMyJobs = async () => {
        try {
            const res = await api.get('/offers/mechanic/my-offers');
            setJobs(res.data);
        } catch (e) {
            console.error(e);
            toast.error("Не вдалося завантажити роботи");
        } finally {
            setLoading(false);
        }
    };

    const handleFinishJob = async (requestId: number) => {
        if(!confirm("Підтвердіть виконання роботи")) return;
        try {
            await api.post(`/requests/${requestId}/finish`);
            toast.success("Роботу завершено! Тепер ви можете оцінити клієнта.");
            fetchMyJobs();
            setActiveTab('history'); // Перекидаємо в історію
        } catch (e) { toast.error("Помилка завершення"); }
    };

    // --- ФІЛЬТРАЦІЯ ---
    const activeJobs = jobs.filter(j => j.status === 'accepted' && j.request_status === 'active');
    const pendingOffers = jobs.filter(j => j.status === 'pending' && j.request_status === 'new');
    // 👇 Архів: прийняті офери, де заявка вже Done
    const historyJobs = jobs.filter(j => j.status === 'accepted' && j.request_status === 'done');

    const displayedJobs = 
        activeTab === 'active' ? activeJobs : 
        activeTab === 'pending' ? pendingOffers : historyJobs;

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin"/></div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />
            <div className="max-w-2xl mx-auto p-4">
                <h1 className="text-3xl font-extrabold text-black mb-6">Кабінет Майстра</h1>

                {/* Таби */}
                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('active')} className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition whitespace-nowrap ${activeTab === 'active' ? 'bg-black text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
                        В роботі ({activeJobs.length})
                    </button>
                    <button onClick={() => setActiveTab('pending')} className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition whitespace-nowrap ${activeTab === 'pending' ? 'bg-black text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
                        Очікують ({pendingOffers.length})
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-2 rounded-xl font-bold text-xs sm:text-sm transition whitespace-nowrap ${activeTab === 'history' ? 'bg-black text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
                        Архів ({historyJobs.length})
                    </button>
                </div>

                <div className="space-y-4">
                    {displayedJobs.length === 0 && <div className="text-center py-12 text-gray-400">Список порожній</div>}

                    {displayedJobs.map(job => (
                        <div key={job.offer_id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                            {/* Статус бар збоку */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                activeTab === 'active' ? 'bg-green-500' : 
                                activeTab === 'history' ? 'bg-gray-300' : 'bg-yellow-400'
                            }`}/>

                            <div className="flex justify-between items-start mb-3 pl-2">
                                <div>
                                    <h3 className="font-extrabold text-lg text-black">{job.car_model}</h3>
                                    <div className="text-black/60 font-medium text-sm">{job.client_name}</div>
                                </div>
                                <div className="text-green-600 font-black text-xl">{job.price} ₴</div>
                            </div>

                            <p className="text-gray-600 bg-gray-50 p-3 rounded-xl text-sm mb-4 border border-gray-100 ml-2">
                                {job.description}
                            </p>

                            {/* ДІЇ: АКТИВНІ */}
                            {activeTab === 'active' && (
                                <div className="space-y-3 pl-2">
                                    <div className="flex gap-2">
                                        <a href={`tel:${job.client_phone}`} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-100">
                                            <Phone size={18}/> {job.client_phone}
                                        </a>
                                        {job.location && (
                                            <a href={`https://www.google.com/maps?q=${job.location.y},${job.location.x}`} target="_blank" className="px-4 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center hover:bg-blue-200 border border-blue-200">
                                                <Navigation size={20}/>
                                            </a>
                                        )}
                                    </div>
                                    <button onClick={() => handleFinishJob(job.id)} className="w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 shadow-lg">
                                        <CheckCircle size={18}/> Завершити
                                    </button>
                                </div>
                            )}

                            {/* ДІЇ: ОЧІКУЮТЬ */}
                            {activeTab === 'pending' && (
                                <div className="pl-2">
                                    <button className="w-full py-3 text-red-500 font-bold hover:bg-red-50 rounded-xl transition flex items-center justify-center gap-2 border border-transparent hover:border-red-100">
                                        <XCircle size={18}/> Скасувати
                                    </button>
                                </div>
                            )}

                            {/* ДІЇ: ІСТОРІЯ (ОЦІНКА) */}
                            {activeTab === 'history' && (
                                <div className="pl-2">
                                    {/* 👇 ПЕРЕВІРКА: Якщо відгук вже є, пишемо текст замість кнопки */}
                                    {job.has_client_review ? (
                                        <div className="w-full bg-gray-50 text-gray-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-gray-100">
                                            <Star size={18} className="fill-gray-400"/> Клієнт оцінений
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setReviewJob(job)}
                                            className="w-full bg-gray-100 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-50 hover:text-yellow-700 transition"
                                        >
                                            <Star size={18} className="text-yellow-500 fill-yellow-500"/> Оцінити клієнта
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Модалка для оцінки клієнта */}
            {reviewJob && (
                <ReviewModal 
                    requestId={reviewJob.id}
                    targetName={reviewJob.client_name}
                    reviewType="for_client" // 👈 Вказуємо тип
                    onClose={() => setReviewJob(null)}
                    onSuccess={() => {
                        setReviewJob(null);
                        fetchMyJobs();}}
                />
            )}
        </div>
    );
}