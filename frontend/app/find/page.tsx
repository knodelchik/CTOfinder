'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import api from '@/lib/api';
import { MapPin, Navigation, Clock, AlertTriangle, CheckCircle, Search, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Attachment {
    id: number;
    url: string;
    file_type: string;
}

interface RequestItem {
    id: number;
    car_model: string;
    description: string;
    created_at: string;
    distance_km?: number;
    location?: { x: number, y: number };
    attachments: Attachment[]; // Додали фото
}

export default function MechanicFindPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'sos' | 'planned'>('all');
  
  // Модалка відповіді
  const [selectedReq, setSelectedReq] = useState<RequestItem | null>(null);
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');

  // Модалка перегляду фото
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => fetchRequests(pos.coords.latitude, pos.coords.longitude), 
            (err) => {
                toast.error("Увімкніть геолокацію!");
                fetchRequests(50.45, 30.52);
            }
        );
    } else {
         fetchRequests(50.45, 30.52);
    }
  }, []);

  const fetchRequests = async (lat: number, lng: number) => {
    try {
        const res = await api.get('/requests/nearby', { params: { lat, lng, radius_km: 100 } });
        setRequests(res.data);
    } catch (e) {
        console.error(e);
        toast.error("Не вдалося завантажити стрічку");
    } finally {
        setLoading(false);
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedReq) return;

      try {
          await api.post('/offers', {
              request_id: selectedReq.id,
              price: Number(price),
              comment: comment
          });
          toast.success("Пропозицію надіслано!");
          setSelectedReq(null);
          setPrice('');
          setComment('');
      } catch (error: any) {
          if (error.response?.status === 403) {
              if (confirm("Немає профілю СТО. Створити?")) router.push('/profile');
          } else if (error.response?.status === 409) {
              toast.error("Ви вже відгукнулись");
          } else {
              toast.error("Помилка сервера");
          }
      }
  };

  // Фільтрація заявок
  const filteredRequests = requests.filter(req => {
      const isSos = req.description.includes('[SOS]');
      if (activeTab === 'sos') return isSos;
      if (activeTab === 'planned') return !isSos;
      return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-3xl font-extrabold text-black mb-4">Замовлення поруч</h1>

        {/* ТАБИ */}
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100 mb-6">
            <button 
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'all' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                Всі
            </button>
            <button 
                onClick={() => setActiveTab('sos')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 ${activeTab === 'sos' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 hover:bg-red-50'}`}
            >
                <AlertTriangle size={16}/> SOS
            </button>
            <button 
                onClick={() => setActiveTab('planned')}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 ${activeTab === 'planned' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-blue-50'}`}
            >
                <Clock size={16}/> Планові
            </button>
        </div>

        {/* СПИСОК */}
        <div className="space-y-5">
            {!loading && filteredRequests.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Search size={48} className="mx-auto mb-3 opacity-20"/>
                    <p className="font-medium">У цій категорії заявок немає.</p>
                </div>
            )}

            {filteredRequests.map(req => {
                const isSos = req.description.includes('[SOS]');
                // Показуємо локацію ТІЛЬКИ якщо це SOS і є координати
                const showLocation = isSos && req.location && req.location.x && req.location.y;

                return (
                    <div key={req.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
                        
                        {/* Хедер */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-2xl ${isSos ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                                    {isSos ? <AlertTriangle size={24}/> : <Clock size={24}/>}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg text-black leading-tight">{req.car_model}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mt-1">
                                        <span>{new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        {req.distance_km && <span>• {req.distance_km.toFixed(1)} км від вас</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Опис */}
                        <div className="text-sm font-medium text-gray-800 mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 leading-relaxed">
                            {req.description}
                        </div>

                        {/* ФОТОГРАФІЇ (Слайдер) */}
                        {req.attachments && req.attachments.length > 0 && (
                            <div className="mb-4">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {req.attachments.map(att => (
                                        <div 
                                            key={att.id} 
                                            className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group"
                                            onClick={() => setFullScreenImage(att.url)}
                                        >
                                            <img src={att.url} className="w-full h-full object-cover transition group-hover:scale-110" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition"/>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Футер кнопок */}
                        <div className="flex items-center gap-2 mt-2">
                            <button 
                                onClick={() => setSelectedReq(req)}
                                className="flex-1 bg-black text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-gray-200 text-sm"
                            >
                                <CheckCircle size={18} /> Запропонувати
                            </button>
                            
                            {/* Кнопка навігації */}
                            {showLocation ? (
                                <a 
                                    href={`https://www.google.com/maps?q=${req.location!.y},${req.location!.x}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition border border-blue-100"
                                    title="Маршрут до клієнта"
                                >
                                    <Navigation size={20} />
                                </a>
                            ) : (
                                <div className="p-3.5 bg-gray-50 text-gray-300 rounded-xl cursor-not-allowed border border-gray-100" title="Клієнт приїде сам">
                                    <Navigation size={20} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* МОДАЛКА ВІДПОВІДІ */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white w-full sm:rounded-3xl shadow-2xl sm:max-w-md animate-in slide-in-from-bottom duration-300 overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-extrabold text-black">Відгук на заявку</h3>
                        <button onClick={() => setSelectedReq(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                    </div>
                    
                    <form onSubmit={handleSendOffer} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ціна (грн)</label>
                            <input 
                                type="number" required autoFocus
                                className="w-full p-3 bg-gray-100 rounded-xl font-bold text-black text-lg focus:ring-2 ring-black outline-none"
                                placeholder="0"
                                value={price} onChange={e => setPrice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Коментар</label>
                            <textarea 
                                required
                                className="w-full p-3 bg-gray-100 rounded-xl font-medium text-black h-24 resize-none focus:ring-2 ring-black outline-none"
                                placeholder={selectedReq.description.includes('[SOS]') ? "Виїжджаю, буду за 15 хв..." : "Можу прийняти вас сьогодні о 14:00..."}
                                value={comment} onChange={e => setComment(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="w-full py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg mt-2">
                            Надіслати пропозицію
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* МОДАЛКА ФОТО (LIGHTBOX) */}
      {fullScreenImage && (
          <div 
            className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur flex items-center justify-center p-4 animate-in fade-in cursor-zoom-out"
            onClick={() => setFullScreenImage(null)}
          >
              <button className="absolute top-4 right-4 text-white p-2 bg-white/10 rounded-full hover:bg-white/20">
                  <X size={32}/>
              </button>
              <img 
                src={fullScreenImage} 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()} // Щоб клік по фото не закривав його
              />
          </div>
      )}
    </div>
  );
}