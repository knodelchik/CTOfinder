'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import api from '@/lib/api';
import { 
    Navigation, Clock, AlertTriangle, CheckCircle, 
    Search, X, Map as MapIcon, List, SlidersHorizontal, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Map, { Marker, GeolocateControl, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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
    attachments: Attachment[];
}

export default function MechanicFindPage() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 🔥 Стейт для зберігання ID заявок, на які ми вже відгукнулись у цій сесії
  const [offeredIds, setOfferedIds] = useState<Set<number>>(new Set());

  // Фільтри та Стан
  const [activeTab, setActiveTab] = useState<'all' | 'sos' | 'planned'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [radius, setRadius] = useState(50);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showRadiusFilter, setShowRadiusFilter] = useState(false);

  // Модалка відповіді
  const [selectedReq, setSelectedReq] = useState<RequestItem | null>(null);
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');

  // Модалка перегляду фото
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  const router = useRouter();

  // 1. Отримуємо локацію
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(loc);
                fetchRequests(loc.lat, loc.lng, radius);
            }, 
            (err) => {
                console.error("Geo Error:", err);
                toast.error("Геолокація недоступна. Центруємо на Києві.");
                const defaultLoc = { lat: 50.45, lng: 30.52 };
                setUserLocation(defaultLoc);
                fetchRequests(defaultLoc.lat, defaultLoc.lng, radius);
            }
        );
    } else {
         const defaultLoc = { lat: 50.45, lng: 30.52 };
         setUserLocation(defaultLoc);
         fetchRequests(defaultLoc.lat, defaultLoc.lng, radius);
    }
  }, []);

  // 2. Логіка перемикання табів
  useEffect(() => {
      if (activeTab === 'planned') {
          setViewMode('list');
      }
  }, [activeTab]);

  // Перезавантаження при зміні радіусу
  useEffect(() => {
      if (!userLocation) return;
      const timer = setTimeout(() => {
          fetchRequests(userLocation.lat, userLocation.lng, radius);
      }, 500);
      return () => clearTimeout(timer);
  }, [radius]);

  const fetchRequests = useCallback(async (lat: number, lng: number, rad: number) => {
    setLoading(true);
    try {
        const res = await api.get('/requests/nearby', { params: { lat, lng, radius_km: rad } });
        setRequests(res.data);
    } catch (e) {
        console.error(e);
        toast.error("Не вдалося оновити стрічку");
    } finally {
        setLoading(false);
    }
  }, []);

  const handleManualRefresh = () => {
      if (userLocation) {
          fetchRequests(userLocation.lat, userLocation.lng, radius);
          toast.success("Стрічку оновлено");
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
          
          // 🔥 Додаємо ID заявки в список "відгукнутих"
          setOfferedIds(prev => new Set(prev).add(selectedReq.id));

          setSelectedReq(null);
          setPrice('');
          setComment('');

      } catch (error: any) {
          if (error.response?.status === 403) {
              if (confirm("Немає профілю СТО. Створити?")) router.push('/profile');
          } else if (error.response?.status === 409) {
              toast.error("Ви вже відгукнулись на цю заявку");
              // 🔥 Навіть якщо помилка 409 (вже існує), позначаємо як "відгукнуто"
              setOfferedIds(prev => new Set(prev).add(selectedReq.id));
              setSelectedReq(null);
          } else {
              toast.error("Помилка сервера");
          }
      }
  };

  const filteredRequests = useMemo(() => {
      return requests.filter(req => {
        const isSos = req.description.includes('[SOS]');
        if (activeTab === 'sos') return isSos;
        if (activeTab === 'planned') return !isSos;
        return true;
      });
  }, [requests, activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* ПЛАВАЮЧА КНОПКА (Мобільні) */}
      {activeTab !== 'planned' && (
        <div className="fixed bottom-24 right-4 z-40 sm:hidden">
            <button 
                onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
                className="bg-black text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold animate-in zoom-in"
            >
                {viewMode === 'list' ? <><MapIcon size={20}/> Карта</> : <><List size={20}/> Список</>}
            </button>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4">
        
        {/* ВЕРХНЯ ПАНЕЛЬ */}
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-black">Стрічка</h1>
                    <button 
                        onClick={handleManualRefresh} 
                        disabled={loading}
                        className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-black transition ${loading ? 'animate-spin' : ''}`}
                        title="Оновити список"
                    >
                        <RefreshCw size={20}/>
                    </button>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex bg-white border border-gray-200 rounded-xl p-1">
                        <button 
                            onClick={() => setViewMode('list')} 
                            className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={20}/>
                        </button>
                        <button 
                            onClick={() => activeTab !== 'planned' && setViewMode('map')} 
                            disabled={activeTab === 'planned'}
                            className={`p-2 rounded-lg transition ${viewMode === 'map' ? 'bg-gray-100 text-black shadow-sm' : 'text-gray-400'} ${activeTab === 'planned' ? 'opacity-30 cursor-not-allowed' : 'hover:text-gray-600'}`}
                        >
                            <MapIcon size={20}/>
                        </button>
                    </div>

                    <button 
                        onClick={() => setShowRadiusFilter(!showRadiusFilter)}
                        className={`p-3 rounded-xl border font-bold text-sm flex items-center gap-2 transition ${showRadiusFilter ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                    >
                        <SlidersHorizontal size={18}/> {radius} км
                    </button>
                </div>
            </div>

            {/* Слайдер радіусу */}
            {showRadiusFilter && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top-2">
                    <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                        <span>10 км</span>
                        <span>Пошук у радіусі: {radius} км</span>
                        <span>500 км</span>
                    </div>
                    <input 
                        type="range" min="10" max="500" step="10" 
                        value={radius} onChange={e => setRadius(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                    />
                </div>
            )}

            {/* ТАБИ */}
            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
                <button onClick={() => setActiveTab('all')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'all' ? 'bg-black text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}>
                    Всі
                </button>
                <button onClick={() => setActiveTab('sos')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 ${activeTab === 'sos' ? 'bg-red-600 text-white shadow' : 'text-gray-500 hover:bg-red-50'}`}>
                    <AlertTriangle size={16}/> SOS
                </button>
                <button onClick={() => setActiveTab('planned')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1 ${activeTab === 'planned' ? 'bg-blue-600 text-white shadow' : 'text-gray-500 hover:bg-blue-50'}`}>
                    <Clock size={16}/> Планові
                </button>
            </div>
        </div>

        {/* --- РЕЖИМ СПИСКУ --- */}
        {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in">
                {loading && <div className="text-center py-10 text-gray-400 flex flex-col items-center"><div className="animate-spin mb-2"><RefreshCw/></div>Завантаження...</div>}
                
                {!loading && filteredRequests.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
                        <Search size={48} className="mx-auto mb-3 opacity-20"/>
                        <p className="font-medium">
                            {activeTab === 'sos' ? 'SOS заявок немає.' : 
                             activeTab === 'planned' ? 'Планових заявок немає.' : 
                             'Заявок поруч немає.'}
                        </p>
                        <p className="text-sm mt-1 text-gray-400">Спробуйте збільшити радіус або натисніть "Оновити".</p>
                    </div>
                )}

                {filteredRequests.map(req => {
                    const isSos = req.description.includes('[SOS]');
                    const showLocation = isSos && req.location;
                    // 🔥 Перевіряємо, чи ми вже відгукнулись
                    const hasResponded = offeredIds.has(req.id);

                    return (
                        <div key={req.id} className={`bg-white p-5 rounded-3xl shadow-sm border border-gray-100 transition group ${hasResponded ? 'opacity-70 bg-gray-50' : 'hover:shadow-md'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl shrink-0 ${isSos ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {isSos ? <AlertTriangle size={24}/> : <Clock size={24}/>}
                                    </div>
                                    <div>
                                        <h3 className="font-extrabold text-lg text-black leading-tight">{req.car_model}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mt-1">
                                            <span>{new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            {req.distance_km && <span>• {req.distance_km.toFixed(1)} км</span>}
                                        </div>
                                    </div>
                                </div>
                                {isSos && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Терміново</span>}
                            </div>

                            <div className="text-sm font-medium text-gray-800 mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 leading-relaxed whitespace-pre-wrap">
                                {req.description}
                            </div>

                            {req.attachments && req.attachments.length > 0 && (
                                <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {req.attachments.map(att => (
                                        <div key={att.id} onClick={() => setFullScreenImage(att.url)} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 cursor-zoom-in group">
                                            <img src={att.url} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                                {/* 🔥 Кнопка змінює стан, якщо ми відгукнулись */}
                                <button 
                                    onClick={() => !hasResponded && setSelectedReq(req)}
                                    disabled={hasResponded}
                                    className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition text-sm ${
                                        hasResponded 
                                        ? 'bg-green-100 text-green-700 cursor-default' 
                                        : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-gray-200'
                                    }`}
                                >
                                    {hasResponded ? <><CheckCircle size={18}/> Ви відгукнулись</> : <><CheckCircle size={18}/> Відгукнутися</>}
                                </button>
                                
                                {showLocation ? (
                                    <a 
                                        href={`https://www.google.com/maps?q=${req.location!.y},${req.location!.x}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="p-3.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition border border-blue-100"
                                    >
                                        <Navigation size={20} />
                                    </a>
                                ) : (
                                    <div className="p-3.5 bg-gray-50 text-gray-300 rounded-xl cursor-not-allowed border border-gray-100" title="Локація прихована для планових заявок">
                                        <Navigation size={20} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* --- РЕЖИМ КАРТИ (ТІЛЬКИ ДЛЯ SOS) --- */}
        {viewMode === 'map' && activeTab !== 'planned' && (
             <div className="bg-gray-200 rounded-3xl overflow-hidden border border-gray-300 h-[75vh] relative shadow-inner animate-in fade-in">
                 {MAPBOX_TOKEN ? (
                    <Map
                        initialViewState={{
                            longitude: userLocation?.lng || 30.52,
                            latitude: userLocation?.lat || 50.45,
                            zoom: 10
                        }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        mapboxAccessToken={MAPBOX_TOKEN}
                    >
                        <GeolocateControl position="top-left" />
                        <NavigationControl position="top-left" />

                        {userLocation && (
                            <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="blue">
                                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pulse-ring"></div>
                            </Marker>
                        )}

                        {filteredRequests.map(req => {
                            if (!req.description.includes('[SOS]') || !req.location) return null;
                            const hasResponded = offeredIds.has(req.id);

                            return (
                                <Marker 
                                    key={req.id} 
                                    longitude={req.location.x} 
                                    latitude={req.location.y}
                                    anchor="bottom"
                                    onClick={(e) => {
                                        e.originalEvent.stopPropagation();
                                        if(!hasResponded) setSelectedReq(req);
                                    }}
                                >
                                    <div className={`cursor-pointer group relative ${hasResponded ? 'opacity-50 grayscale' : ''}`}>
                                        <div className={`p-2 rounded-full shadow-xl border-2 border-white transition ${hasResponded ? 'bg-gray-500' : 'bg-red-600 animate-bounce group-hover:scale-110'}`}>
                                            {hasResponded ? <CheckCircle size={20} className="text-white"/> : <AlertTriangle size={20} className="text-white"/>}
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                            {req.car_model} {hasResponded ? '(Відгукнуто)' : ''}
                                        </div>
                                    </div>
                                </Marker>
                            );
                        })}
                    </Map>
                 ) : <div className="flex h-full items-center justify-center text-gray-500">Карта недоступна</div>}
                 
                 <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-3 rounded-xl text-xs font-bold shadow-lg">
                     <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-red-600 rounded-full"></div> SOS Заявки</div>
                     <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Ваша позиція</div>
                     <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-500 rounded-full border border-gray-400"></div> Вже відгукнулись</div>
                 </div>
             </div>
        )}
      </div>

      {/* МОДАЛКА ВІДПОВІДІ (Offer) */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white w-full sm:rounded-3xl shadow-2xl sm:max-w-md animate-in slide-in-from-bottom duration-300 overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                             <h3 className="text-xl font-extrabold text-black">Відгук на заявку</h3>
                             <p className="text-sm text-gray-500 font-medium">{selectedReq.car_model}</p>
                        </div>
                        <button onClick={() => setSelectedReq(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
                    </div>
                    
                    <form onSubmit={handleSendOffer} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ваша ціна (грн)</label>
                            <input 
                                type="number" required autoFocus
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-black text-lg focus:ring-2 ring-black outline-none"
                                placeholder="0"
                                value={price} onChange={e => setPrice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Коментар клієнту</label>
                            <textarea 
                                required
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl font-medium text-black h-28 resize-none focus:ring-2 ring-black outline-none"
                                placeholder={selectedReq.description.includes('[SOS]') ? "Маю евакуатор, буду за 20 хв..." : "Є вільне вікно на завтра. Ціна орієнтовна..."}
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

      {/* LIGHTBOX */}
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
                onClick={(e) => e.stopPropagation()} 
              />
          </div>
      )}
    </div>
  );
}