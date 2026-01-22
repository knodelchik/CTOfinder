'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, AlertTriangle, MapPin, Loader2, Camera, Trash2, ChevronRight, ArrowLeft, CheckCircle, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import Map, { Marker, GeolocateControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface Category {
    id: number;
    name: string;
    children: Category[];
}

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

  // Локація
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // 🔥 КАТЕГОРІЇ
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPath, setSelectedPath] = useState<Category[]>([]); 

  useEffect(() => {
      // Авто
      api.get('/my-cars')
        .then(res => {
            setMyCars(res.data);
            if (res.data.length > 0) setSelectedCarId(res.data[0].id);
        })
        .catch(() => toast.error("Помилка завантаження авто"))
        .finally(() => setLoadingCars(false));

      // Категорії
      api.get('/categories/tree')
        .then(res => setCategories(res.data))
        .catch(err => console.error("Помилка категорій", err));

      // Локація
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(pos => {
              setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          });
      }
  }, []);

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

  // 🔥 Логіка вибору категорії
  const handleSelect = (category: Category) => {
      setSelectedPath([...selectedPath, category]);
  };

  // 🔥 Повернутися до конкретного кроку
  const jumpToStep = (index: number) => {
      if (index === -1) {
          setSelectedPath([]);
      } else {
          setSelectedPath(selectedPath.slice(0, index + 1));
      }
  };

  const getCurrentOptions = () => {
      if (selectedPath.length === 0) return categories;
      const lastSelected = selectedPath[selectedPath.length - 1];
      return lastSelected.children || [];
  };

  const currentOptions = getCurrentOptions();
  const isLeafNode = selectedPath.length > 0 && currentOptions.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarId) return toast.error("Оберіть авто");
    if (!coords) return toast.error("Немає геолокації");
    
    if (selectedPath.length === 0 && !description) {
        return toast.error("Оберіть поломку або напишіть коментар");
    }

    setLoading(true);
    const toastId = toast.loading("Створення заявки...");

    try {
        const selectedCar = myCars.find(c => c.id === Number(selectedCarId));
        const carModelStr = selectedCar ? `${selectedCar.brand_model} (${selectedCar.license_plate})` : "Невідоме авто";

        const categoryText = selectedPath.map(c => c.name).join(' -> ');
        const userComment = description ? `Коментар: ${description}` : '';
        const problemDesc = selectedPath.length > 0 ? `[${categoryText}] ${userComment}` : description;

        const finalDescription = requestType === 'planned' ? `[ПРИЇДУ САМ] ${problemDesc}` : `[SOS] ${problemDesc}`;
        const lastCategoryId = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1].id : 1;

        const res = await api.post('/requests', {
          category_id: lastCategoryId, 
          car_model: carModelStr,
          description: finalDescription,
          lat: coords.lat,  
          lng: coords.lng  
        });

        const requestId = res.data.id;

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
      toast.error("Помилка сервера", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
      <div className="bg-white w-full sm:rounded-3xl shadow-2xl sm:max-w-lg overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Хедер і Таби */}
        <div className="flex border-b shrink-0">
            <button type="button" onClick={() => setRequestType('sos')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition ${requestType === 'sos' ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                <AlertTriangle size={20} /> SOS
            </button>
            <button type="button" onClick={() => setRequestType('planned')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition ${requestType === 'planned' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                <MapPin size={20} /> Приїду сам
            </button>
        </div>

        <div className="px-6 py-3 flex justify-between items-center shrink-0 border-b border-gray-100">
          <h3 className="font-extrabold text-xl text-black">Нова заявка</h3>
          <button onClick={onClose}><X size={24} className="text-black"/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          {/* Вибір АВТО */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Авто</label>
            {myCars.length > 0 ? (
                <select 
                    required className="w-full p-3 bg-gray-100 rounded-xl font-bold text-black border border-transparent focus:border-black outline-none"
                    value={selectedCarId} onChange={e => setSelectedCarId(Number(e.target.value))}
                >
                    {myCars.map(car => (
                        <option key={car.id} value={car.id}>{car.brand_model} ({car.license_plate})</option>
                    ))}
                </select>
            ) : <div className="text-red-500 text-sm font-bold">Додайте авто в профілі</div>}
          </div>

          {/* 🔥 КАТЕГОРІЇ (Breadcrumbs + Fixed Height Grid) */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
             <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Оберіть проблему</label>

             {/* 1. ХЛІБНІ КРИХТИ */}
             <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                 <button 
                    type="button"
                    onClick={() => jumpToStep(-1)}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition ${selectedPath.length === 0 ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                 >
                     <Home size={14}/>
                 </button>
                 
                 {selectedPath.map((cat, index) => (
                     <div key={cat.id} className="flex items-center animate-in fade-in slide-in-from-left-2">
                         <ChevronRight size={14} className="text-gray-300 mx-1"/>
                         <button 
                            type="button"
                            onClick={() => jumpToStep(index)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition ${
                                index === selectedPath.length - 1 && !isLeafNode
                                    ? 'bg-black text-white border-black' 
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                            }`}
                         >
                            {cat.name}
                         </button>
                     </div>
                 ))}
             </div>

             {/* 🔥 ТУТ ФІКС: 
                 Ми задаємо h-[280px], щоб висота блоку не стрибала.
                 Додаємо overflow-y-auto для скролу, якщо категорій багато.
             */}
             <div className="h-[210px] overflow-y-auto pr-1 custom-scrollbar">
                {!isLeafNode ? (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200 pb-2">
                        {currentOptions.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleSelect(cat)}
                                className="bg-white p-3 rounded-xl border border-gray-200 hover:border-black hover:shadow-md transition text-left text-sm font-bold text-gray-800 flex items-center justify-between group h-[60px]" // Фіксована висота кнопок теж додає стабільності
                            >
                                <span className="line-clamp-2 leading-tight">{cat.name}</span>
                                {cat.children && cat.children.length > 0 && <ChevronRight size={16} className="text-gray-300 group-hover:text-black shrink-0"/>}
                            </button>
                        ))}
                        {currentOptions.length === 0 && categories.length === 0 && (
                            <div className="col-span-2 text-center text-gray-400 py-10 text-sm">Завантаження...</div>
                        )}
                    </div>
                ) : (
                    // Екран успіху теж має таку саму висоту, щоб не було стрибка
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle size={32}/>
                        </div>
                        <div className="text-green-800 font-extrabold text-lg">Проблему визначено!</div>
                        <div className="text-gray-500 text-sm mt-1 max-w-[200px]">{selectedPath[selectedPath.length - 1].name}</div>
                        
                        <button 
                            type="button" 
                            onClick={() => jumpToStep(selectedPath.length - 2)} 
                            className="mt-6 px-6 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-200 transition"
                        >
                            Змінити вибір
                        </button>
                    </div>
                )}
             </div>
          </div>

          {/* Опис */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Деталі (Опціонально)</label>
            <textarea 
              placeholder={requestType === 'sos' ? "Де ви стоїте? Особливості?" : "Коли зручно? Щось додати?"}
              className="w-full p-4 bg-gray-100 rounded-xl h-20 resize-none text-black focus:ring-2 ring-black outline-none font-medium text-sm"
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Фото */}
          <div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <label className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 border-2 border-dashed border-gray-300">
                    <Camera size={20} className="text-gray-400"/>
                    <input type="file" multiple accept="image/*,video/*" hidden onChange={handleFileSelect} />
                </label>

                {previews.map((src, i) => (
                    <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={src} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i)} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
            </div>
          </div>

          {/* КАРТА (SOS) */}
          {requestType === 'sos' && coords && (
             <div className="h-32 rounded-xl overflow-hidden relative border border-gray-200 shrink-0">
                 {MAPBOX_TOKEN && (
                    <Map
                        initialViewState={{ longitude: coords.lng, latitude: coords.lat, zoom: 14 }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        mapboxAccessToken={MAPBOX_TOKEN}
                        onClick={(e) => setCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
                    >
                        <GeolocateControl position="top-left" />
                        <Marker longitude={coords.lng} latitude={coords.lat} color="red">
                             <div className="animate-bounce"><MapPin size={32} className="text-red-600 fill-white"/></div>
                        </Marker>
                    </Map>
                 )}
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 px-2 py-1 rounded text-[10px] font-bold shadow pointer-events-none">Підтвердіть місце</div>
             </div>
          )}

          <button 
            type="submit" disabled={loading || myCars.length === 0}
            className={`w-full py-4 text-white font-bold rounded-xl transition text-lg mt-auto shadow-xl flex justify-center items-center gap-2 ${
                requestType === 'sos' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
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