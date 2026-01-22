'use client';

import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { Car, ChevronDown, ChevronUp, ArrowLeft, Calendar, Star, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import ReviewModal from '@/components/ReviewModal';

// Типи даних
interface Offer {
  id: number;
  mechanic_name: string;
  mechanic_phone?: string;
  price: number;
  comment: string;
  is_accepted: boolean;
}

interface MyRequest {
  id: number;
  car_model: string;
  description: string;
  status: string;
  created_at: string;
  offers?: Offer[];
  has_review?: boolean;
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Стан для модалки відгуку
  const [reviewConfig, setReviewConfig] = useState<{id: number, mechanicName: string} | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/my-requests');
      setRequests(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (reqId: number) => {
    if (expandedId === reqId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(reqId);
    
    // Вантажимо офери, якщо їх ще немає
    const currentReq = requests.find(r => r.id === reqId);
    if (currentReq && !currentReq.offers) {
        try {
            const res = await api.get(`/requests/${reqId}/offers`);
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, offers: res.data } : r));
        } catch (e) { console.error(e); }
    }
  };

  const handleOpenReview = (req: MyRequest) => {
    // Шукаємо ім'я майстра серед прийнятих оферів
    const acceptedOffer = req.offers?.find(o => o.is_accepted);
    const mechanicName = acceptedOffer ? acceptedOffer.mechanic_name : 'Майстер';
    
    setReviewConfig({
        id: req.id,
        mechanicName: mechanicName
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      
      {/* Шапка */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/driver/map" className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition">
            <ArrowLeft size={24} className="text-black"/>
        </Link>
        <h1 className="text-2xl font-extrabold text-black">Мої Заявки</h1>
      </div>

      {loading && <div className="text-center text-gray-500 mt-10">Завантаження...</div>}

      {!loading && requests.length === 0 && (
          <div className="text-center text-gray-400 mt-20">
              <p>Історія порожня.</p>
              <Link href="/driver/map" className="text-blue-600 font-bold mt-2 inline-block">Створити першу заявку</Link>
          </div>
      )}

      <div className="space-y-4 max-w-2xl mx-auto">
        {requests.map(req => (
          <div key={req.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition hover:shadow-md">
            
            {/* Основна інфа (Клікабельна) */}
            <div 
                onClick={() => toggleExpand(req.id)}
                className="p-5 flex justify-between items-center cursor-pointer bg-white"
            >
                <div className="flex items-center gap-4">
                    {/* Іконка статусу */}
                    <div className={`p-3 rounded-full flex-shrink-0 ${
                        req.status === 'new' ? 'bg-blue-100 text-blue-600' : 
                        req.status === 'in_progress' ? 'bg-yellow-100 text-yellow-600' : 
                        req.status === 'done' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-400'
                    }`}>
                        {req.status === 'done' ? <CheckCircle size={24}/> : <Car size={24} />}
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-lg text-black">{req.car_model}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <Calendar size={12} />
                            <span>{new Date(req.created_at).toLocaleDateString()}</span>
                            
                            {/* Статус бейдж */}
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                                req.status === 'new' ? 'bg-blue-100 text-blue-700' : 
                                req.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                req.status === 'done' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-500'
                            }`}>
                                {req.status === 'new' ? 'Пошук' : 
                                 req.status === 'in_progress' ? 'В роботі' :
                                 req.status === 'done' ? 'Виконано' : req.status}
                            </span>
                        </div>
                    </div>
                </div>
                {expandedId === req.id ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
            </div>

            {/* Розгорнута частина */}
            {expandedId === req.id && (
                <div className="bg-gray-50 p-5 border-t border-gray-100 text-sm animate-in slide-in-from-top-2 duration-200">
                    
                    {/* БЛОК ОЦІНКИ (З'являється, якщо робота виконана) */}
                    {req.status === 'done' && (
                        <div className="mb-5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            {!req.has_review ? (
                                <div className="text-center">
                                    <h4 className="font-bold text-black mb-2">Роботу завершено!</h4>
                                    <button 
                                        onClick={() => handleOpenReview(req)}
                                        className="w-full bg-black text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition"
                                    >
                                        <Star size={18} className="fill-yellow-400 text-yellow-400"/>
                                        Оцінити майстра
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-green-600 font-bold">
                                    <Star size={18} className="fill-green-600"/>
                                    Відгук залишено. Дякуємо!
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-gray-600 mb-4 bg-white p-3 rounded-lg border border-gray-100">
                        <span className="font-bold text-black block mb-1">Опис проблеми:</span>
                        {req.description}
                    </p>

                    <h4 className="font-bold text-gray-500 uppercase text-xs mb-3">Історія пропозицій:</h4>
                    
                    {(!req.offers || req.offers.length === 0) && (
                        <p className="text-gray-400 italic">Пропозицій не було.</p>
                    )}

                    <div className="space-y-2">
                        {req.offers?.map(offer => (
                            <div key={offer.id} className={`p-3 rounded-xl border flex justify-between items-center transition ${
                                offer.is_accepted ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-gray-200'
                            }`}>
                                <div>
                                    <div className="font-bold text-black text-base">{offer.mechanic_name}</div>
                                    <div className="text-green-700 font-extrabold text-lg">{offer.price} ₴</div>
                                    <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">{offer.comment}</p>
                                </div>
                                {offer.is_accepted && (
                                    <span className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-green-200 shadow-md">
                                        Прийнято
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>

      {/* Модалка */}
      {reviewConfig && (
        <ReviewModal 
            requestId={reviewConfig.id} 
            // 👇 ВИПРАВЛЕНО ТУТ: mechanicName -> targetName
            targetName={reviewConfig.mechanicName} 
            reviewType="for_mechanic" // Явно вказуємо, що оцінюємо майстра
            onClose={() => setReviewConfig(null)}
            onSuccess={() => {
                setReviewConfig(null);
                fetchRequests(); 
            }}
        />
      )}
    </div>
  );
}