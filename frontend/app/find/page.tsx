'use client';

import Header from '@/components/Header';
import LoginForm from '@/components/LoginForm';
import OfferModal from '@/components/OfferModal';
import api from '@/lib/api';
import { useEffect, useState } from 'react';
import { Car, MapPin, Filter } from 'lucide-react';

interface RequestData {
  id: number;
  car_model: string;
  description: string;
  created_at: string;
  location: { x: number; y: number };
}

export default function FindPage() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  
  // 1. "Живий" радіус (для UI, оновлюється миттєво)
  const [radius, setRadius] = useState(50);
  
  // 2. "Відкладений" радіус (для API, оновлюється із затримкою)
  const [debouncedRadius, setDebouncedRadius] = useState(50);

  // --- МАГІЯ DEBOUNCE ⏳ ---
  useEffect(() => {
    // Встановлюємо таймер на 600 мс
    const handler = setTimeout(() => {
      setDebouncedRadius(radius);
    }, 600);

    // Якщо користувач знову порухав повзунок до того, як пройшло 600 мс,
    // ми скасовуємо попередній таймер.
    return () => {
      clearTimeout(handler);
    };
  }, [radius]); // Спрацьовує при кожному русі повзунка


  // Функція запиту (залежить тепер від debouncedRadius)
  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await api.get('/requests/nearby', {
        params: { 
            lat: 50.4501, 
            lng: 30.5234, 
            radius_km: debouncedRadius // <--- Використовуємо відкладене значення
        }
      });
      
      setRequests(res.data);
      setNeedsLogin(false);
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        setNeedsLogin(true);
      } else {
        setError('Не вдалося з\'єднатися з сервером.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      setNeedsLogin(true);
      return; 
    }
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRadius]); // <--- Запит летить тільки коли "заспокоївся" радіус

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      
      {needsLogin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <LoginForm onLoginSuccess={() => fetchRequests()} />
        </div>
      )}

      {selectedRequest && (
        <OfferModal 
          requestId={selectedRequest.id}
          carModel={selectedRequest.car_model}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {
            setSelectedRequest(null);
            alert("✅ Пропозицію відправлено клієнту!");
          }}
        />
      )}

      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-extrabold text-black">Стрічка замовлень 🛠️</h1>
            
            <div className="bg-gray-100 p-4 rounded-2xl flex items-center gap-4 w-full md:w-auto shadow-sm">
                <div className="flex items-center gap-2 font-bold text-gray-700 min-w-[120px]">
                    <Filter size={20} />
                    {/* Показуємо живий радіус, щоб було видно, що ми тягнемо */}
                    <span>{radius} км</span>
                </div>
                <input 
                    type="range" 
                    min="10" 
                    max="1000"
                    step="10"
                    value={radius}
                    // Оновлюємо тільки UI змінну
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black"
                />
            </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl mb-6 border border-red-200 font-medium">
            ⚠️ {error}
          </div>
        )}

        {loading && <div className="text-center py-10 text-black font-medium animate-pulse">Оновлення стрічки...</div>}

        <div className="space-y-6">
          {!loading && requests.length === 0 && !error && (
             <div className="text-center py-12 text-gray-800 border-2 border-dashed border-gray-300 rounded-xl">
               <p className="text-lg font-bold">В радіусі {debouncedRadius} км заявок немає</p>
               <p className="text-gray-600">Спробуйте збільшити радіус пошуку</p>
             </div>
          )}

          {requests.map((req) => (
            <div key={req.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 hover:border-black transition group animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="bg-black p-2 rounded-lg text-white">
                        <Car size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-black">{req.car_model}</h3>
                </div>
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide border border-green-200">
                  Нове
                </span>
              </div>
              
              <p className="mt-4 text-gray-900 leading-relaxed text-lg font-medium">
                {req.description}
              </p>
              
              <div className="mt-6 flex items-center gap-6 text-sm text-gray-600 border-t border-gray-100 pt-4 font-medium">
                 <div className="flex items-center gap-1">
                    <MapPin size={18} className="text-black" />
                    <span>Десь поруч</span>
                 </div>
                 
                 <button 
                    onClick={() => setSelectedRequest(req)}
                    className="ml-auto bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md active:scale-95 text-base"
                 >
                    Запропонувати ремонт
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}