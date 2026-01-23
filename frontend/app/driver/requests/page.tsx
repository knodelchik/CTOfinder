'use client';

import api from '@/lib/api';
import { useEffect, useState, useMemo } from 'react';
import { Car, ChevronDown, ChevronUp, ArrowLeft, Calendar, Star, CheckCircle, Clock, Archive, Wrench, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import ReviewModal from '@/components/ReviewModal';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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
  status: string; // new, active, done, canceled, in_progress
  created_at: string;
  offers?: Offer[];
  has_review?: boolean;
}

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [reviewConfig, setReviewConfig] = useState<{id: number, mechanicName: string} | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/my-requests');
      setRequests(res.data);
      const active = res.data.find((r: any) => ['new', 'active', 'in_progress'].includes(r.status));
      if(active) {
          setExpandedId(active.id);
          fetchOffersIfNeeded(active.id, active.offers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchOffersIfNeeded = async (reqId: number, existingOffers?: Offer[]) => {
      if(!existingOffers) {
        try {
            const res = await api.get(`/requests/${reqId}/offers`);
            setRequests(prev => prev.map(r => r.id === reqId ? { ...r, offers: res.data } : r));
        } catch (e) { console.error(e); }
      }
  };

  const toggleExpand = async (reqId: number) => {
    if (expandedId === reqId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(reqId);
    const currentReq = requests.find(r => r.id === reqId);
    if (currentReq) {
        fetchOffersIfNeeded(reqId, currentReq.offers);
    }
  };

  const handleAcceptOffer = async (offerId: number) => {
    if(!confirm("Прийняти цю пропозицію?")) return;
    try {
        await api.post(`/offers/${offerId}/accept`);
        toast.success("Майстра обрано!");
        fetchRequests(); 
    } catch (e) { toast.error("Помилка прийняття"); }
  };

  // 🔥 НОВА ФУНКЦІЯ: Завершення замовлення
  const handleFinishOrder = async (reqId: number) => {
      if(!confirm("Підтвердити виконання ремонту? Це завершить замовлення.")) return;
      try {
          await api.post(`/requests/${reqId}/finish`);
          toast.success("Замовлення завершено!");
          fetchRequests(); // Оновлюємо, щоб заявка переїхала в історію
          setActiveTab('history'); // Можна перекинути юзера в історію, щоб він побачив
      } catch (e) {
          toast.error("Помилка завершення");
      }
  };

  const handleOpenReview = (req: MyRequest) => {
    const acceptedOffer = req.offers?.find(o => o.is_accepted);
    const mechanicName = acceptedOffer ? acceptedOffer.mechanic_name : 'Майстер';
    setReviewConfig({ id: req.id, mechanicName });
  };

  const activeRequests = useMemo(() => requests.filter(r => ['new', 'active', 'in_progress'].includes(r.status)), [requests]);
  const historyRequests = useMemo(() => requests.filter(r => ['done', 'canceled'].includes(r.status)), [requests]);
  const displayedRequests = activeTab === 'active' ? activeRequests : historyRequests;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 pt-6">
      
      <div className="flex items-center gap-4 mb-6 max-w-2xl mx-auto">
        <Link href="/driver/map" className="p-3 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition">
            <ArrowLeft size={20} className="text-black"/>
        </Link>
        <h1 className="text-2xl font-extrabold text-black">Мої Заявки</h1>
      </div>

      <div className="max-w-2xl mx-auto mb-6 bg-white p-1 rounded-2xl shadow-sm border border-gray-200 flex">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
                activeTab === 'active' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
              <Wrench size={16}/> В роботі ({activeRequests.length})
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
                activeTab === 'history' ? 'bg-gray-200 text-black shadow-inner' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
              <Archive size={16}/> Архів ({historyRequests.length})
          </button>
      </div>

      {loading && <div className="text-center text-gray-500 mt-10">Завантаження...</div>}

      {!loading && displayedRequests.length === 0 && (
          <div className="text-center text-gray-400 mt-20 max-w-2xl mx-auto">
              <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'active' ? <Car size={32} className="text-gray-300"/> : <Archive size={32} className="text-gray-300"/>}
              </div>
              <p className="font-medium">
                  {activeTab === 'active' ? 'Активних заявок немає.' : 'Історія порожня.'}
              </p>
              {activeTab === 'active' && (
                  <Link href="/driver/map" className="text-black font-bold mt-4 inline-block bg-white px-6 py-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                      Створити заявку
                  </Link>
              )}
          </div>
      )}

      <div className="space-y-4 max-w-2xl mx-auto">
        {displayedRequests.map(req => {
            const isDone = req.status === 'done';
            const isActive = req.status === 'active' || req.status === 'in_progress';
            
            return (
              <div key={req.id} className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition hover:shadow-md ${isActive ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'}`}>
                
                <div onClick={() => toggleExpand(req.id)} className="p-5 flex justify-between items-center cursor-pointer bg-white">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full flex-shrink-0 ${
                            req.status === 'new' ? 'bg-gray-100 text-gray-600' : 
                            isActive ? 'bg-blue-100 text-blue-600' : 
                            isDone ? 'bg-green-100 text-green-600' : 'bg-red-50 text-red-400'
                        }`}>
                            {isDone ? <CheckCircle size={24}/> : isActive ? <Clock size={24}/> : <Car size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-black leading-tight">{req.car_model}</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 font-medium">
                                <Calendar size={12} />
                                <span>{new Date(req.created_at).toLocaleDateString()}</span>
                                <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] tracking-wide ${
                                    req.status === 'new' ? 'bg-gray-100 text-gray-600' : 
                                    isActive ? 'bg-blue-100 text-blue-700' :
                                    isDone ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                }`}>
                                    {req.status === 'new' ? 'Пошук...' : isActive ? 'В роботі' : isDone ? 'Виконано' : 'Скасовано'}
                                </span>
                            </div>
                        </div>
                    </div>
                    {expandedId === req.id ? <ChevronUp className="text-gray-400"/> : <ChevronDown className="text-gray-400"/>}
                </div>

                {expandedId === req.id && (
                    <div className="bg-gray-50 p-5 border-t border-gray-100 text-sm animate-in slide-in-from-top-2 duration-200">
                        
                        {/* БЛОК ЗАВЕРШЕННЯ (Тільки для активних "В роботі") */}
                        {isActive && (
                            <div className="mb-5 bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm text-center">
                                <h4 className="font-bold text-blue-800 mb-2">Ремонт завершено?</h4>
                                <button 
                                    onClick={() => handleFinishOrder(req.id)}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                                >
                                    <CheckSquare size={18}/> Підтвердити виконання
                                </button>
                            </div>
                        )}

                        {isDone && (
                            <div className="mb-5 bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                                {!req.has_review ? (
                                    <>
                                        <h4 className="font-bold text-black mb-2 text-base">Як все пройшло?</h4>
                                        <button onClick={() => handleOpenReview(req)} className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 transition shadow-yellow-200 shadow-lg">
                                            <Star size={18} className="fill-black"/> Оцінити роботу
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold py-2">
                                        <Star size={20} className="fill-green-600"/> Відгук надіслано
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="mb-6">
                            <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-2 tracking-wider">Деталі проблеми</h4>
                            <p className="text-gray-700 bg-white p-4 rounded-xl border border-gray-200 leading-relaxed font-medium">{req.description}</p>
                        </div>

                        <h4 className="font-bold text-gray-400 uppercase text-[10px] mb-3 tracking-wider flex justify-between items-center">
                            Пропозиції майстрів
                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{req.offers?.length || 0}</span>
                        </h4>
                        
                        {(!req.offers || req.offers.length === 0) && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                                <p className="text-gray-400 font-medium">{activeTab === 'active' ? 'Поки що пропозицій немає' : 'Історія пропозицій відсутня'}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {req.offers?.map(offer => (
                                <div key={offer.id} className={`p-4 rounded-xl border-2 transition ${offer.is_accepted ? 'bg-green-50 border-green-500 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-black text-base">{offer.mechanic_name}</div>
                                            <p className="text-xs text-gray-500 mt-1 italic">{offer.comment}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-green-700 font-black text-xl">{offer.price} ₴</div>
                                        </div>
                                    </div>

                                    {offer.is_accepted ? (
                                        <div className="mt-3 pt-3 border-t border-green-200 flex flex-col gap-2">
                                            <div className="text-xs font-bold text-green-700 uppercase tracking-wider text-center">Виконавець обраний</div>
                                            {offer.mechanic_phone && (
                                                <a href={`tel:${offer.mechanic_phone}`} className="bg-green-600 text-white w-full py-3 rounded-xl font-bold text-center hover:bg-green-700 transition shadow-lg shadow-green-200">
                                                    📞 {offer.mechanic_phone}
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        activeTab === 'active' && !isActive && (
                                            <button onClick={() => handleAcceptOffer(offer.id)} className="w-full mt-3 bg-black text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2">
                                                <CheckCircle size={16}/> Прийняти
                                            </button>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            );
        })}
      </div>

      {reviewConfig && (
        <ReviewModal 
            requestId={reviewConfig.id} 
            targetName={reviewConfig.mechanicName} 
            reviewType="for_mechanic" 
            onClose={() => setReviewConfig(null)}
            onSuccess={() => { setReviewConfig(null); fetchRequests(); }}
        />
      )}
    </div>
  );
}