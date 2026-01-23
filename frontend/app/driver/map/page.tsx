'use client';

import api from '@/lib/api';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import { StationData } from '@/components/StationsMap';
import { AlertTriangle, Wrench, Search, ArrowRight, Loader2, RefreshCw, MapPin, Navigation } from 'lucide-react';
import CreateRequestModal from '@/components/CreateRequestModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const StationsMap = dynamic(() => import('@/components/StationsMap'), { 
  ssr: false, 
  loading: () => <div className="h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold flex-col gap-2"><Loader2 className="animate-spin text-black"/>Завантаження карти...</div>
});

// Розширений інтерфейс оферу з координатами
interface Offer {
    id: number;
    mechanic_name: string;
    price: number;
    is_accepted: boolean;
    distance_km?: number;
    station_lat?: number;
    station_lng?: number;
    station_address?: string;
    mechanic_phone?: string;
}

interface ActiveRequest {
  id: number;
  car_model: string;
  description: string;
  status: string;
  location: { x: number, y: number };
}

export default function DriverMapPage() {
  const router = useRouter();
  const [stations, setStations] = useState<StationData[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [highlightedStation, setHighlightedStation] = useState<StationData | null>(null); // 🔥 Для підсвітки майстра
  const [currentLocation, setCurrentLocation] = useState<{x: number, y: number} | null>(null);

  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]); // 🔥 Зберігаємо самі офери
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'sos' | 'planned'>('sos');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
                fetchStations(50.45, 30.52); 
            }
        );
    }
    checkMyRequests();
  }, []);

  const fetchStations = async (lat: number, lng: number) => {
    try {
      const res = await api.get('/stations/nearby', { params: { lat, lng, radius_km: 50 } });
      setStations(res.data);
    } catch (e) { console.error(e); }
  };

  const checkMyRequests = async () => {
    setIsRefreshing(true);
    try {
      const res = await api.get('/my-requests');
      const active = res.data.find((r: any) => r.status !== 'done' && r.status !== 'canceled');
      
      if (active) {
        setActiveRequest(active);
        const offersRes = await api.get(`/requests/${active.id}/offers`);
        setOffers(offersRes.data || []);
      } else {
        setActiveRequest(null);
        setOffers([]);
        setHighlightedStation(null);
      }
    } catch (e) { 
        console.error(e); 
    } finally {
        setIsRefreshing(false);
    }
  };

  // 🔥 Функція показу майстра на карті
  const showMechanicOnMap = (offer: Offer) => {
      if (offer.station_lat && offer.station_lng) {
          // Створюємо тимчасовий об'єкт станції для відображення
          const mechanicStation: StationData = {
              id: -offer.id, // Від'ємний ID, щоб не конфліктувати з реальними станціями
              name: `Майстер: ${offer.mechanic_name}`,
              address: offer.station_address || "Локація майстра",
              phone: offer.mechanic_phone || "",
              description: `Пропозиція: ${offer.price} грн`,
              location: {
                  x: offer.station_lng,
                  y: offer.station_lat
              }
          };
          setHighlightedStation(mechanicStation); // Це передасться в карту і відцентрує її
          toast.success(`Показую майстра ${offer.mechanic_name}`);
      } else {
          toast.error("У цього майстра немає координат СТО");
      }
  };

  const openCreate = (type: 'sos' | 'planned') => {
      setModalType(type);
      setIsModalOpen(true);
  };

  const handleRequestCreated = () => {
      setIsModalOpen(false);
      checkMyRequests(); 
      toast.success("Заявку створено!");
  };

  const isSosRequest = activeRequest?.description.includes('[SOS]') || false;
  const acceptedOffer = offers.find(o => o.is_accepted);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white overflow-hidden text-black">
      
      {/* ЛІВА ПАНЕЛЬ */}
      <div className="w-full md:w-[400px] border-r border-gray-200 flex flex-col bg-white shadow-xl z-10 h-1/3 md:h-full">
        <div className="p-4 border-b bg-gray-50">
            <h2 className="text-xl font-extrabold text-black">Найближчі СТО</h2>
            <div className="relative mt-2">
                <input type="text" placeholder="Пошук..." className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-black text-black shadow-sm"/>
                <Search size={16} className="absolute left-3 top-3.5 text-gray-400"/>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {stations.map(s => (
                <div 
                    key={s.id}
                    onClick={() => {
                        setSelectedStationId(s.id);
                        setHighlightedStation(null); // Скидаємо підсвітку майстра, якщо клікнули на просте СТО
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
                        selectedStationId === s.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-100'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-black">{s.name}</h3>
                        <span className="text-[10px] bg-gray-100 px-2 py-1 rounded font-bold text-gray-500 uppercase tracking-wide">СТО</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.address}</p>
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
            isSos={isSosRequest} 
            highlightedStation={highlightedStation} // 🔥 Передаємо майстра для відображення
         />

         {/* КНОПКИ СТВОРЕННЯ */}
         {!activeRequest && (
            <div className="absolute bottom-8 right-6 flex flex-col items-end gap-3 z-20 animate-in slide-in-from-bottom duration-500">
                <button onClick={() => openCreate('planned')} className="group flex items-center gap-3 bg-white pl-5 pr-2 py-2 rounded-full shadow-xl border border-gray-200 hover:border-gray-300 hover:shadow-2xl transition active:scale-95">
                    <span className="text-sm font-bold text-gray-700 group-hover:text-black">Приїду сам</span>
                    <div className="bg-gray-100 group-hover:bg-blue-600 text-gray-600 group-hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"><Wrench size={18} /></div>
                </button>
                <button onClick={() => openCreate('sos')} className="group flex items-center gap-3 bg-white pl-5 pr-2 py-2 rounded-full shadow-xl border border-red-100 hover:border-red-300 hover:shadow-2xl hover:shadow-red-100 transition active:scale-95">
                    <span className="text-sm font-bold text-red-600 group-hover:text-red-700">SOS Виклик</span>
                    <div className="bg-red-600 text-white w-12 h-12 rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-red-200"><AlertTriangle size={24} /></div>
                </button>
            </div>
         )}

         {/* 🔥 ОНОВЛЕНИЙ ВІДЖЕТ АКТИВНОЇ ЗАЯВКИ */}
         {activeRequest && (
            <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-30 animate-in slide-in-from-top duration-500">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden group">
                    <div className={`h-1.5 w-full ${isSosRequest ? 'bg-red-600' : 'bg-blue-600'}`}></div>
                    
                    <div className="p-4">
                        {/* Хедер віджета */}
                        <div className="flex justify-between items-start mb-3">
                            <div onClick={() => router.push('/driver/requests')} className="cursor-pointer">
                                <h3 className="font-extrabold text-base text-black flex items-center gap-2 hover:underline">
                                    {isSosRequest ? <AlertTriangle size={16} className="text-red-600"/> : <Wrench size={16} className="text-blue-600"/>}
                                    {activeRequest.car_model}
                                </h3>
                                <p className="text-xs text-gray-400 font-bold mt-0.5">
                                    {acceptedOffer ? 'Майстер очікує вас' : 'Пошук виконавців...'}
                                </p>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); checkMyRequests(); }}
                                className={`bg-gray-100 p-2 rounded-full hover:bg-gray-200 text-black transition ${isRefreshing ? 'animate-spin' : ''}`}
                            >
                                <RefreshCw size={16}/>
                            </button>
                        </div>

                        {/* 🔥 СПИСОК ПРОПОЗИЦІЙ (Міні-версія) */}
                        <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                            {offers.length === 0 ? (
                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold justify-center py-4">
                                    <Loader2 size={16} className={isRefreshing ? "animate-spin" : ""}/> 
                                    {isRefreshing ? "Оновлюю..." : "Очікуємо відповіді..."}
                                </div>
                            ) : (
                                <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                    {offers.map(offer => (
                                        <div key={offer.id} className={`p-3 border-b border-gray-100 last:border-0 flex justify-between items-center hover:bg-gray-100 transition ${offer.is_accepted ? 'bg-green-50' : ''}`}>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-black">{offer.mechanic_name}</span>
                                                    {offer.is_accepted && <span className="text-[10px] bg-green-200 text-green-800 px-1.5 rounded font-bold">Прийнято</span>}
                                                </div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <span className="font-bold text-green-600">{offer.price} ₴</span>
                                                    {offer.distance_km && <span>• {offer.distance_km} км</span>}
                                                </div>
                                            </div>
                                            
                                            {/* 🔥 Кнопка показу на карті */}
                                            {offer.station_lat && offer.station_lng && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showMechanicOnMap(offer);
                                                    }}
                                                    className="p-2 bg-white border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition shadow-sm"
                                                    title="Показати на карті"
                                                >
                                                    <MapPin size={16}/>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Футер */}
                        <button 
                            onClick={() => router.push('/driver/requests')}
                            className="w-full mt-3 bg-black text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-800 transition"
                        >
                            {acceptedOffer ? 'Деталі та контакти' : 'Керувати заявкою'} <ArrowRight size={14}/>
                        </button>
                    </div>
                </div>
            </div>
         )}
      </div>

      {isModalOpen && (
        <CreateRequestModal 
            defaultType={modalType} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={handleRequestCreated} 
        />
      )}
    </div>
  );
}