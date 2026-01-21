'use client';

import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { StationData } from '@/components/StationsMap';
import { AlertTriangle, Phone, CheckCircle, RefreshCw, Wrench, MapPin, Search, CheckSquare } from 'lucide-react';
import CreateRequestModal from '@/components/CreateRequestModal';

// Динамічний імпорт карти
const StationsMap = dynamic(() => import('@/components/StationsMap'), { 
  ssr: false, 
  loading: () => <div className="h-full bg-gray-100 flex items-center justify-center">Завантаження карти...</div>
});

// Типи даних
interface Offer {
  id: number;
  mechanic_name: string;
  mechanic_phone: string;
  price: number;
  comment: string;
  is_accepted: boolean;
}

interface ActiveRequest {
  id: number;
  car_model: string;
  description: string;
  status: string;
  location: { x: number, y: number };
}

export default function DriverMapPage() {
  const [stations, setStations] = useState<StationData[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  
  // Стан активної заявки
  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  
  // UI стани
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sos' | 'planned'>('sos');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Завантаження даних при старті
  useEffect(() => {
    fetchStations();
    checkMyRequests();
  }, []);

  const fetchStations = async () => {
    try {
      const res = await api.get('/stations/nearby', { params: { lat: 50.45, lng: 30.52, radius_km: 50 } });
      setStations(res.data);
    } catch (e) { console.error(e); }
  };

  // 2. Перевірка активної заявки
  const checkMyRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/my-requests');
      const last = res.data[0];
      
      // Показуємо заявку, якщо вона НЕ виконана і НЕ скасована
      // Зверни увагу: перевіряємо 'done' з твоєї моделі
      if (last && last.status !== 'done' && last.status !== 'canceled') {
        setActiveRequest(last);
        await fetchOffers(last.id);
      } else {
        setActiveRequest(null);
        setOffers([]);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchOffers = async (reqId: number) => {
    try {
      const res = await api.get(`/requests/${reqId}/offers`);
      setOffers(res.data);
    } catch (e) { console.error(e); }
  };

  // 3. Прийняти офер
  const handleAcceptOffer = async (offerId: number) => {
    if(!confirm("Прийняти цю ціну і викликати майстра?")) return;
    try {
        await api.post(`/offers/${offerId}/accept`);
        alert("Майстер підтверджений!");
        if (activeRequest) fetchOffers(activeRequest.id);
    } catch (e) { alert("Помилка при прийнятті"); }
  };

  // 4. ЗАВЕРШИТИ ЗАМОВЛЕННЯ (Нова кнопка)
  const handleFinishOrder = async () => {
    if (!activeRequest) return;
    if (!confirm("Підтвердіть, що роботу виконано і можна закривати замовлення.")) return;

    try {
        await api.post(`/requests/${activeRequest.id}/finish`);
        alert("Дякуємо! Замовлення закрито.");
        setActiveRequest(null); // Прибираємо заявку з екрану
        setOffers([]);
    } catch (e) {
        alert("Помилка при завершенні. Спробуйте ще раз.");
        console.error(e);
    }
  };

  // Відкриття модалки
  const openCreate = (type: 'sos' | 'planned') => {
      setModalType(type);
      setIsModalOpen(true);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white">
      
      {/* --- ЛІВА ПАНЕЛЬ: СПИСОК СТО --- */}
      <div className="w-full md:w-[400px] border-r border-gray-200 flex flex-col bg-white shadow-xl z-10">
        <div className="p-4 border-b bg-gray-50">
            <h2 className="text-xl font-extrabold text-black">Найближчі СТО</h2>
            <div className="relative mt-2">
                <input type="text" placeholder="Пошук..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"/>
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {stations.map(s => (
                <div 
                    key={s.id}
                    onClick={() => setSelectedStationId(s.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
                        selectedStationId === s.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-100'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900">{s.name}</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold">СТО</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin size={14}/> {s.address}
                    </p>
                    <div className="mt-3 flex gap-2">
                        <a href={`tel:${s.phone}`} className="flex-1 py-1.5 bg-gray-100 text-black text-xs font-bold rounded flex items-center justify-center gap-1 hover:bg-gray-200">
                           <Phone size={12}/> Подзвонити
                        </a>
                    </div>
                </div>
            ))}
        </div>
      </div>


      {/* --- ПРАВА ПАНЕЛЬ: КАРТА --- */}
      <div className="flex-1 relative">
         <StationsMap 
            stations={stations} 
            selectedStationId={selectedStationId} // Передаємо вибір зі списку
            onSelectStation={(s) => setSelectedStationId(s ? s.id : null)} // Зворотній зв'язок
            userLocation={activeRequest ? activeRequest.location : null}
         />

         {/* КНОПКИ СТВОРЕННЯ (Знизу справа) - Тільки якщо немає активної заявки */}
         {!activeRequest && (
            <div className="absolute bottom-8 right-6 flex flex-col items-end gap-3 z-20">
                <button 
                    onClick={() => openCreate('planned')}
                    className="flex items-center gap-3 bg-white pl-4 pr-2 py-3 rounded-full shadow-xl border border-gray-200 hover:bg-gray-50 active:scale-95 transition"
                >
                    <span className="text-sm font-bold text-gray-700">Приїду сам</span>
                    <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center">
                        <Wrench size={20} />
                    </div>
                </button>

                <button 
                    onClick={() => openCreate('sos')}
                    className="flex items-center gap-3 bg-white pl-4 pr-2 py-3 rounded-full shadow-xl border border-red-100 hover:bg-red-50 active:scale-95 transition"
                >
                    <span className="text-sm font-bold text-red-600">SOS Виклик</span>
                    <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center animate-pulse">
                        <AlertTriangle size={24} />
                    </div>
                </button>
            </div>
         )}


         {/* --- ВІКНО АКТИВНОЇ ЗАЯВКИ (Зверху справа) --- */}
         {activeRequest && (
            <div className="absolute top-4 right-4 md:w-96 w-[calc(100%-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-30 animate-in slide-in-from-top">
                {/* Шапка */}
                <div className={`p-4 flex justify-between items-center text-white ${activeRequest.description.includes('[SOS]') ? 'bg-red-600' : 'bg-blue-600'}`}>
                    <div className="flex items-center gap-2">
                        {isLoading ? <RefreshCw size={16} className="animate-spin"/> : <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                        <span className="font-bold text-sm">
                            {offers.some(o => o.is_accepted) ? 'Майстер їде!' : 'Пошук виконавця...'}
                        </span>
                    </div>
                    <button onClick={checkMyRequests} className="bg-white/20 p-1.5 rounded hover:bg-white/30 transition">
                        <RefreshCw size={14}/>
                    </button>
                </div>

                {/* Список пропозицій */}
                <div className="bg-gray-50 p-2 max-h-60 overflow-y-auto">
                    {offers.length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">
                            Чекаємо на відповіді майстрів...
                        </div>
                    )}

                    {offers.map(offer => (
                        <div key={offer.id} className={`mb-2 p-3 rounded-xl border ${offer.is_accepted ? 'bg-green-50 border-green-500' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-sm">{offer.mechanic_name}</span>
                                <span className="font-bold text-green-700">{offer.price} грн</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{offer.comment}</p>

                            {offer.is_accepted ? (
                                <div className="space-y-2">
                                    <a href={`tel:${offer.mechanic_phone}`} className="w-full bg-green-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-700">
                                        <Phone size={14} /> {offer.mechanic_phone}
                                    </a>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleAcceptOffer(offer.id)}
                                    className="w-full bg-black text-white py-2 rounded-lg font-bold text-xs hover:bg-gray-800 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle size={14} /> Прийняти
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* --- НОВА КНОПКА "ЗАМОВЛЕННЯ ВИКОНАНО" --- */}
                {/* Показуємо її, тільки якщо ми прийняли чийсь офер */}
                {offers.some(o => o.is_accepted) && (
                    <div className="p-3 bg-white border-t">
                        <button 
                            onClick={handleFinishOrder}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition shadow-lg"
                        >
                            <CheckSquare size={18} />
                            Замовлення виконано
                        </button>
                        <p className="text-[10px] text-gray-400 text-center mt-2">
                            Натисніть, коли ремонт завершено
                        </p>
                    </div>
                )}
            </div>
         )}
      </div>

      {/* Модалка */}
      {isModalOpen && (
        <CreateRequestModal 
            defaultType={modalType} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => {
                setIsModalOpen(false);
                checkMyRequests();
            }} 
        />
      )}
    </div>
  );
}