'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, AlertTriangle, MapPin, Loader2, Camera, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Map, { Marker, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface CreateRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'sos' | 'planned';
}

interface Car {
    id: number;
    brand_model: string;
    license_plate: string;
}

const CreateRequestModal = ({ onClose, onSuccess, defaultType = 'sos' }: CreateRequestModalProps) => {
  const [requestType, setRequestType] = useState<'sos' | 'planned'>(defaultType);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Дані авто
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | ''>('');
  const [loadingCars, setLoadingCars] = useState(true);

  // Фото
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Локація (тільки для SOS відображення)
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // 1. Завантажуємо гараж і локацію
  useEffect(() => {
      // Авто
      api.get('/my-cars')
        .then(res => {
            setMyCars(res.data);
            if (res.data.length > 0) setSelectedCarId(res.data[0].id);
        })
        .catch(() => toast.error("Помилка завантаження авто"))
        .finally(() => setLoadingCars(false));

      // Локація (потрібна в обох випадках для пошуку майстрів поруч, 
      // але показувати карту будемо тільки для SOS)
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(pos => {
              setCoords({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
              });
          });
      }
  }, []);

  // Обробка фото
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        setFiles(prev => [...prev, ...newFiles]);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarId) return toast.error("Оберіть авто");
    if (!coords) return toast.error("Немає геолокації. Дозвольте доступ до геоданих.");
    
    setLoading(true);
    const toastId = toast.loading("Створення заявки...");

    try {
        const selectedCar = myCars.find(c => c.id === Number(selectedCarId));
        const carModelStr = selectedCar 
            ? `${selectedCar.brand_model} (${selectedCar.license_plate})` 
            : "Невідоме авто";

        // Формуємо опис залежно від типу
        const finalDescription = requestType === 'planned' 
            ? `[ПРИЇДУ САМ] ${description}` 
            : `[SOS] ${description}`;

        // 1. Створюємо заявку
        const res = await api.post('/requests', {
          category_id: 1, 
          car_model: carModelStr,
          description: finalDescription,
          lat: coords.lat,  
          lng: coords.lng  
        });

        const requestId = res.data.id;

        // 2. Завантажуємо фото (якщо є)
        if (files.length > 0) {
            toast.loading("Завантаження фото...", { id: toastId });
            await Promise.all(files.map(file => {
                const formData = new FormData();
                formData.append('file', file);
                return api.post(`/requests/${requestId}/attachments`, formData);
            }));
        }
        
        toast.success("Заявку створено!", { id: toastId });
        onSuccess();
        onClose();

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail 
        ? JSON.stringify(error.response.data.detail) 
        : 'Помилка сервера';
      toast.error("Помилка: " + msg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
      <div className="bg-white w-full sm:rounded-3xl shadow-2xl sm:max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Хедер і Таби */}
        <div className="flex border-b shrink-0">
            <button 
                type="button"
                onClick={() => setRequestType('sos')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition ${
                    requestType === 'sos' ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
            >
                <AlertTriangle size={20} /> SOS (Я став)
            </button>
            <button 
                type="button"
                onClick={() => setRequestType('planned')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition ${
                    requestType === 'planned' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
            >
                <MapPin size={20} /> Приїду сам
            </button>
        </div>

        <div className="px-6 py-3 flex justify-between items-center shrink-0">
          <h3 className="font-extrabold text-xl text-black">
            {requestType === 'sos' ? 'Екстрений виклик' : 'Пошук майстра'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition text-black">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 flex flex-col gap-4 overflow-y-auto">
          
          {/* Вибір АВТО */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Оберіть авто</label>
            {loadingCars ? (
                <div className="text-sm text-gray-400">Завантаження...</div>
            ) : myCars.length > 0 ? (
                <div className="relative">
                    <select 
                        required
                        className="w-full p-4 bg-gray-100 rounded-xl font-bold text-black focus:ring-2 ring-black outline-none appearance-none"
                        value={selectedCarId} 
                        onChange={e => setSelectedCarId(Number(e.target.value))}
                    >
                        {myCars.map(car => (
                            <option key={car.id} value={car.id}>
                                {car.brand_model} ({car.license_plate})
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                    Гараж порожній. Додайте авто в профілі.
                </div>
            )}
          </div>

          {/* Опис */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Опис проблеми</label>
            <textarea 
              required placeholder={requestType === 'sos' ? "Де ви стоїте? Що сталось?" : "Що треба зробити? Коли?"}
              className="w-full p-4 bg-gray-100 rounded-xl h-24 resize-none text-black focus:ring-2 ring-black outline-none font-medium"
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* ФОТО ЗАВАНТАЖЕННЯ */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Фото / Відео (опціонально)</label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {/* Кнопка додавання */}
                <label className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition border-2 border-dashed border-gray-300">
                    <Camera size={20} className="text-gray-400"/>
                    <input type="file" multiple accept="image/*,video/*" hidden onChange={handleFileSelect} />
                </label>

                {/* Прев'юшки */}
                {previews.map((src, i) => (
                    <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={src} className="w-full h-full object-cover" />
                        <button 
                            type="button" 
                            onClick={() => removePhoto(i)} 
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                        >
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>
          </div>

          {/* КАРТА (Тільки для SOS) */}
          {requestType === 'sos' && coords && (
             <div className="h-40 rounded-xl overflow-hidden relative border border-gray-200 shrink-0">
                 {MAPBOX_TOKEN ? (
                    <Map
                        initialViewState={{ longitude: coords.lng, latitude: coords.lat, zoom: 14 }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        mapboxAccessToken={MAPBOX_TOKEN}
                        // Дозволяємо пересувати маркер, якщо GPS схибив
                        onClick={(e) => setCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
                    >
                        <GeolocateControl position="top-left" />
                        <Marker longitude={coords.lng} latitude={coords.lat} color="red">
                             <div className="animate-bounce">
                                <MapPin size={32} className="text-red-600 fill-white"/>
                             </div>
                        </Marker>
                    </Map>
                 ) : <div className="bg-gray-100 h-full flex items-center justify-center text-xs">No Map Token</div>}
                 
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold shadow pointer-events-none whitespace-nowrap">
                    Підтвердіть місце поломки (клікніть на карту)
                 </div>
             </div>
          )}
          
          {/* Інформаційний блок для Planned */}
          {requestType === 'planned' && (
              <div className="bg-blue-50 p-3 rounded-xl flex gap-3 items-start border border-blue-100">
                  <MapPin className="text-blue-600 shrink-0" size={20} />
                  <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      Ми використаємо вашу локацію лише для пошуку майстрів поруч. 
                      Майстер побачить, що ви приїдете самі.
                  </p>
              </div>
          )}

          <button 
            type="submit" disabled={loading || myCars.length === 0}
            className={`w-full py-4 text-white font-bold rounded-xl transition text-lg mt-auto shadow-xl flex justify-center items-center gap-2 ${
                requestType === 'sos' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
            } ${myCars.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading && <Loader2 className="animate-spin" />}
            {requestType === 'sos' ? 'SOS — ВИКЛИКАТИ' : 'СТВОРИТИ ЗАЯВКУ'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestModal;