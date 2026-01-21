'use client';

import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { StationData } from '@/components/StationsMap';
import { AlertTriangle, Phone, CheckCircle, RefreshCw, Wrench, MapPin, Search, CheckSquare } from 'lucide-react';
import CreateRequestModal from '@/components/CreateRequestModal';
import toast from 'react-hot-toast';

const StationsMap = dynamic(() => import('@/components/StationsMap'), { 
  ssr: false, 
  loading: () => <div className="h-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">Завантаження карти...</div>
});

interface Offer {
  id: number;
  mechanic_name: string;
  mechanic_phone: string;
  price: number;
  comment: string;
  is_accepted: boolean;
  station_address?: string;
  distance_km?: number;
  station_lat?: number;
  station_lng?: number;
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
  const [highlightedStation, setHighlightedStation] = useState<StationData | null>(null);

  const [currentLocation, setCurrentLocation] = useState<{x: number, y: number} | null>(null);

  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sos' | 'planned'>('sos');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setCurrentLocation({ x: longitude, y: latitude });
                fetchStations(latitude, longitude);
            },
            (err) => {
                console.error("Geo error:", err);
                toast("Геолокація недоступна.", { icon: '🌍' });
                fetchStations(50.45, 30.52); 
            }
        );
    }
    checkMyRequests();
  }, []);

  // ЦЕЙ БЛОК ПОВНІСТЮ ВИДАЛЕНО, ЩОБ ПРИБРАТИ НЕСКІНЧЕННІ ЗАПИТИ КОЖНІ 10 СЕКУНД

  const fetchStations = async (lat: number, lng: number) => {
    try {
      const res = await api.get('/stations/nearby', { params: { lat, lng, radius_km: 50 } });
      setStations(res.data);
    } catch (e) { console.error(e); }
  };

  const checkMyRequests = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/my-requests');
      const last = res.data[0];
      
      if (last && last.status !== 'done' && last.status !== 'canceled') {
        setActiveRequest(last);
        await fetchOffers(last.id); // Завантажуємо один раз при знаходженні
      } else {
        setActiveRequest(null);
        setOffers([]);
        setHighlightedStation(null);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const fetchOffers = async (reqId: number) => {
    setIsLoading(true); // Показуємо спіннер під час оновлення вручну
    try {
      const res = await api.get(`/requests/${reqId}/offers`);
      setOffers(res.data);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const handleAcceptOffer = async (offerId: number) => {
    if(!confirm("Прийняти цю ціну і викликати майстра?")) return;
    try {
        await api.post(`/offers/${offerId}/accept`);
        toast.success("Майстер підтверджений!");
        if (activeRequest) fetchOffers(activeRequest.id);
    } catch (e) { toast.error("Помилка при прийнятті"); }
  };

  const handleFinishOrder = async () => {
    if (!activeRequest) return;
    if (!confirm("Підтвердіть, що роботу виконано і можна закривати замовлення.")) return;

    try {
        await api.post(`/requests/${activeRequest.id}/finish`);
        toast.success("Дякуємо! Замовлення закрито.");
        setActiveRequest(null);
        setOffers([]);
        setHighlightedStation(null);
    } catch (e) {
        toast.error("Помилка при завершенні.");
    }
  };

  const handleShowOnMap = (offer: Offer) => {
      if (offer.station_lat && offer.station_lng) {
          const tempStation: StationData = {
              id: -offer.id,
              name: `Майстер: ${offer.mechanic_name}`,
              description: offer.comment,
              address: offer.station_address || "Адреса не вказана",
              phone: offer.mechanic_phone,
              location: {
                  x: offer.station_lng,
                  y: offer.station_lat
              }
          };
          setHighlightedStation(tempStation);
          setSelectedStationId(null); 
      } else {
          toast.error("У цього майстра немає координат");
      }
  };

  const openCreate = (type: 'sos' | 'planned') => {
      setModalType(type);
      setIsModalOpen(true);
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white overflow-hidden text-black">
      
      {/* ЛІВА ПАНЕЛЬ */}
      <div className="w-full md:w-[400px] border-r border-gray-200 flex flex-col bg-white shadow-xl z-10 h-1/3 md:h-full">
        <div className="p-4 border-b bg-gray-50">
            <h2 className="text-xl font-extrabold text-black">Найближчі СТО</h2>
            <div className="relative mt-2">
                <input type="text" placeholder="Пошук..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black text-black"/>
                <Search size={16} className="absolute left-3 top-2.5 text-gray-400"/>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {stations.map(s => (
                <div 
                    key={s.id}
                    onClick={() => {
                        setSelectedStationId(s.id);
                        setHighlightedStation(null);
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
                        selectedStationId === s.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-100'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-black">{s.name}</h3>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded font-bold text-gray-600 uppercase">СТО</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 flex items-center gap-1 font-medium">
                        <MapPin size={14} className="text-gray-500"/> {s.address}
                    </p>
                    <div className="mt-3 flex gap-2">
                        <a href={`tel:${s.phone}`} className="flex-1 py-1.5 bg-gray-100 text-black text-xs font-bold rounded flex items-center justify-center gap-1 hover:bg-gray-200 transition border border-gray-200">
                           <Phone size={12}/> Подзвонити
                        </a>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* ПРАВА ПАНЕЛЬ: КАРТА */}
      <div className="flex-1 relative h-2/3 md:h-full">
         <StationsMap 
            stations={stations} 
            selectedStationId={selectedStationId} 
            onSelectStation={(s) => {
                setSelectedStationId(s ? s.id : null);
                if (s) setHighlightedStation(null);
            }}
            userLocation={activeRequest ? activeRequest.location : currentLocation}
            isSos={!!activeRequest} 
            highlightedStation={highlightedStation}
         />

         {!activeRequest && (
            <div className="absolute bottom-8 right-6 flex flex-col items-end gap-3 z-20">
                <button onClick={() => openCreate('planned')} className="flex items-center gap-3 bg-white pl-4 pr-2 py-3 rounded-full shadow-xl border border-gray-300 hover:bg-gray-50 active:scale-95 transition">
                    <span className="text-sm font-bold text-gray-800">Приїду сам</span>
                    <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center"><Wrench size={20} /></div>
                </button>
                <button onClick={() => openCreate('sos')} className="flex items-center gap-3 bg-white pl-4 pr-2 py-3 rounded-full shadow-xl border border-red-200 hover:bg-red-50 active:scale-95 transition">
                    <span className="text-sm font-bold text-red-600">SOS Виклик</span>
                    <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center animate-pulse"><AlertTriangle size={24} /></div>
                </button>
            </div>
         )}

         {/* ВІКНО АКТИВНОЇ ЗАЯВКИ */}
         {activeRequest && (
            <div className="absolute top-4 right-4 md:w-96 w-[calc(100%-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-30 animate-in slide-in-from-top max-h-[80vh] flex flex-col">
                <div className={`p-4 flex justify-between items-center text-white ${activeRequest.description.includes('[SOS]') ? 'bg-red-600' : 'bg-blue-600'}`}>
                    <div className="flex items-center gap-2">
                        {isLoading ? <RefreshCw size={16} className="animate-spin"/> : <div className="w-2 h-2 bg-white rounded-full"></div>}
                        <span className="font-bold text-sm uppercase">{offers.some(o => o.is_accepted) ? 'Майстер їде!' : 'Пошук виконавця...'}</span>
                    </div>
                    {/* Кнопка оновлення вручну */}
                    <button 
                        onClick={() => fetchOffers(activeRequest.id)} 
                        className="bg-white/20 p-2 rounded-lg hover:bg-white/30 transition border border-white/20"
                        title="Оновити список пропозицій"
                    >
                        <RefreshCw size={16}/>
                    </button>
                </div>

                <div className="bg-gray-50 p-2 overflow-y-auto flex-1 scrollbar-hide">
                    {offers.length === 0 && (
                        <div className="text-center py-10 text-gray-500 text-sm">
                            <p className="font-bold text-black text-lg">Заявку створено!</p>
                            <p className="text-gray-500 mt-1 font-medium">Очікуйте оферів від майстрів поруч або оновіть список вручну.</p>
                        </div>
                    )}

                    {offers.map(offer => (
                        <div key={offer.id} className={`mb-2 p-3 rounded-xl border-2 shadow-sm transition ${offer.is_accepted ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100'}`}>
                            <div className="flex justify-between items-start mb-1">
                                <div>
                                    <span className="font-bold text-base text-black block">{offer.mechanic_name}</span>
                                    <div className="flex gap-2 mt-1">
                                        {offer.distance_km !== undefined && offer.distance_km !== null && (
                                            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-extrabold border border-blue-200">
                                                🚗 {offer.distance_km} км
                                            </span>
                                        )}
                                        
                                        {offer.station_lat && offer.station_lng && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShowOnMap(offer);
                                                }}
                                                className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-extrabold flex items-center gap-1 hover:bg-purple-200 border border-purple-200 transition"
                                            >
                                                <MapPin size={10}/> НА КАРТІ
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <span className="font-black text-green-700 text-xl">{offer.price} ₴</span>
                            </div>
                            
                            <p className="text-xs text-gray-800 my-2 bg-gray-100 p-3 rounded-lg border border-gray-200 font-medium leading-relaxed">{offer.comment}</p>

                            {offer.is_accepted ? (
                                <div className="space-y-2 animate-in fade-in">
                                    <a href={`tel:${offer.mechanic_phone}`} className="w-full bg-green-600 text-white py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-green-700 transition shadow-lg shadow-green-200">
                                        <Phone size={16} /> ПОДЗВОНИТИ: {offer.mechanic_phone}
                                    </a>
                                </div>
                            ) : (
                                <button onClick={() => handleAcceptOffer(offer.id)} className="w-full bg-black text-white py-3 rounded-xl font-black text-sm hover:bg-gray-800 flex items-center justify-center gap-2 transition shadow-lg">
                                    <CheckCircle size={16} /> ПРИЙНЯТИ
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {offers.some(o => o.is_accepted) && (
                    <div className="p-3 bg-white border-t border-gray-100">
                        <button onClick={handleFinishOrder} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-black transition shadow-xl border border-black">
                            <CheckSquare size={20} /> РОБОТУ ВИКОНАНО
                        </button>
                    </div>
                )}
            </div>
         )}
      </div>

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