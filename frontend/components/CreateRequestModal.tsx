'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { 
    X, AlertTriangle, MapPin, Loader2, Camera, Trash2, 
    ChevronRight, CheckCircle, Home, Car as CarIcon, Info 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Map, { Marker, GeolocateControl, MapRef } from 'react-map-gl';
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

interface CarData {
    id: number;
    brand_model: string;
    license_plate: string;
}

export default function CreateRequestModal({ onClose, onSuccess, defaultType = 'sos' }: CreateRequestModalProps) {
  const [requestType, setRequestType] = useState<'sos' | 'planned'>(defaultType);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- АВТО ---
  const [myCars, setMyCars] = useState<CarData[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [manualCarModel, setManualCarModel] = useState('');
  const [carsLoading, setCarsLoading] = useState(true);

  // --- ФОТО ---
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // --- ЛОКАЦІЯ ---
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  // --- КАТЕГОРІЇ ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedPath, setSelectedPath] = useState<Category[]>([]); 
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
      // 1. Завантажуємо авто
      api.get('/my-cars')
        .then(res => {
            setMyCars(res.data);
            if (res.data.length > 0) setSelectedCarId(res.data[0].id);
        })
        .catch(() => toast.error("Не вдалося завантажити гараж"))
        .finally(() => setCarsLoading(false));

      // 2. Завантажуємо дерево категорій
      api.get('/categories/tree')
        .then(res => setCategories(res.data))
        .catch(err => console.error("Помилка категорій", err))
        .finally(() => setCategoriesLoading(false));

      // 3. Отримуємо локацію
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              err => toast.error("Дозвольте доступ до геолокації")
          );
      }
  }, []);

  // --- ФОТО ХЕНДЛЕРИ ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const newFiles = Array.from(e.target.files);
        if (files.length + newFiles.length > 5) return toast.error("Максимум 5 фото");
        
        setFiles(prev => [...prev, ...newFiles]);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // --- КАТЕГОРІЇ ХЕНДЛЕРИ ---
  const handleCategorySelect = (category: Category) => {
      setSelectedPath([...selectedPath, category]);
  };

  const jumpToCategoryStep = (index: number) => {
      if (index === -1) setSelectedPath([]);
      else setSelectedPath(selectedPath.slice(0, index + 1));
  };

  const getCurrentCategories = () => {
      if (selectedPath.length === 0) return categories;
      const lastSelected = selectedPath[selectedPath.length - 1];
      return lastSelected.children || [];
  };

  const currentOptions = getCurrentCategories();
  const isLeafNode = selectedPath.length > 0 && currentOptions.length === 0;

  // --- САБМІТ ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валідація авто
    const selectedCar = myCars.find(c => c.id === selectedCarId);
    // Якщо вибрано авто з гаража - беремо його назву, інакше те що ввів юзер
    const finalCarModel = selectedCarId && selectedCar 
        ? `${selectedCar.brand_model} (${selectedCar.license_plate})` 
        : manualCarModel;

    if (!finalCarModel) return toast.error("Вкажіть автомобіль");
    if (!coords) return toast.error("Немає геолокації");
    
    // Формування опису
    const categoryText = selectedPath.map(c => c.name).join(' -> ');
    const userComment = description ? `Коментар: ${description}` : '';
    // Якщо категорії вибрані - додаємо їх в опис
    const problemDesc = selectedPath.length > 0 ? `[${categoryText}] ${userComment}` : description;
    
    if (!problemDesc) return toast.error("Опишіть проблему або виберіть категорію");

    const finalDescription = requestType === 'planned' ? `[ПРИЇДУ САМ] ${problemDesc}` : `[SOS] ${problemDesc}`;
    
    // Останній ID категорії або null
    const lastCategoryId = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1].id : null;

    setLoading(true);
    const toastId = toast.loading("Створення заявки...");

    try {
        // 1. Створюємо заявку
        const res = await api.post('/requests', {
          category_id: lastCategoryId, 
          car_model: finalCarModel,
          car_id: selectedCarId, // 🔥 Відправляємо ID для прив'язки до гаража
          description: finalDescription,
          is_sos: requestType === 'sos', // 🔥 Явно вказуємо тип
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
        
        toast.success("Заявку успішно створено!", { id: toastId });
        onSuccess();
        onClose();

    } catch (error: any) {
      console.error("Submission error:", error);
      
      // 🔥 ВИПРАВЛЕНА ОБРОБКА ПОМИЛОК
      let errorMessage = "Помилка сервера";
      
      if (error.response?.data?.detail) {
          const detail = error.response.data.detail;
          if (Array.isArray(detail)) {
              // Якщо це масив помилок валідації (Pydantic/Ninja)
              errorMessage = `Перевірте дані: ${detail.map((e: any) => e.msg || 'Помилка').join(', ')}`;
          } else if (typeof detail === 'string') {
              errorMessage = detail;
          } else {
              errorMessage = JSON.stringify(detail);
          }
      }
      
      toast.error(errorMessage, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full sm:rounded-3xl shadow-2xl sm:max-w-lg overflow-hidden flex flex-col max-h-[95vh] animate-in slide-in-from-bottom duration-300">
        
        {/* ТАБИ ТИПУ ЗАЯВКИ */}
        <div className="flex border-b border-gray-100 shrink-0">
            <button 
                type="button" 
                onClick={() => setRequestType('sos')} 
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-extrabold text-sm uppercase tracking-wider transition ${
                    requestType === 'sos' ? 'bg-red-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
            >
                <AlertTriangle size={18} /> SOS Виклик
            </button>
            <button 
                type="button" 
                onClick={() => setRequestType('planned')} 
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-extrabold text-sm uppercase tracking-wider transition ${
                    requestType === 'planned' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
            >
                <MapPin size={18} /> Плановий візит
            </button>
        </div>

        {/* ХЕДЕР */}
        <div className="px-6 py-4 flex justify-between items-center shrink-0 border-b border-gray-100">
          <h3 className="font-extrabold text-xl text-black">Нова заявка</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><X size={20} className="text-black"/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-4 flex flex-col gap-5 overflow-y-auto custom-scrollbar bg-white">
          
          {/* 1. ВИБІР АВТО */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block flex justify-between">
                Автомобіль
                {carsLoading && <Loader2 size={12} className="animate-spin"/>}
            </label>
            
            {myCars.length > 0 ? (
                <div className="space-y-2">
                    {/* Список авто з гаража */}
                    {myCars.map(car => (
                        <div 
                            key={car.id}
                            onClick={() => setSelectedCarId(car.id)}
                            className={`p-3 rounded-xl border-2 cursor-pointer flex items-center justify-between transition group ${
                                selectedCarId === car.id 
                                ? 'border-black bg-gray-50' 
                                : 'border-gray-100 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${selectedCarId === car.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    <CarIcon size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-black">{car.brand_model}</div>
                                    <div className="text-xs text-gray-500 bg-gray-100 px-1.5 rounded inline-block font-mono mt-0.5">{car.license_plate}</div>
                                </div>
                            </div>
                            {selectedCarId === car.id && <CheckCircle size={20} className="text-black fill-white"/>}
                        </div>
                    ))}
                    
                    {/* Кнопка "Інше" */}
                    <div 
                        onClick={() => setSelectedCarId(null)}
                        className={`p-3 rounded-xl border-2 border-dashed cursor-pointer text-center text-sm font-bold transition ${
                            selectedCarId === null ? 'border-black bg-gray-50 text-black' : 'border-gray-200 text-gray-400 hover:border-gray-400'
                        }`}
                    >
                        Інше авто (Вказати вручну)
                    </div>
                </div>
            ) : (
                <div className="text-center py-2 text-sm text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">Гараж порожній</div>
            )}

            {/* Поле ручного вводу */}
            {(selectedCarId === null || myCars.length === 0) && (
                <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                    <input 
                        className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl font-bold text-black focus:border-black outline-none transition"
                        placeholder="Напр. BMW X5 2018"
                        value={manualCarModel}
                        onChange={e => setManualCarModel(e.target.value)}
                        autoFocus
                    />
                </div>
            )}
          </div>

          {/* 2. КАТЕГОРІЇ (ДЕРЕВО) */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative">
             <label className="text-xs font-bold text-gray-400 uppercase mb-3 block">Що сталося?</label>

             {/* Хлібні крихти */}
             <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                 <button 
                    type="button"
                    onClick={() => jumpToCategoryStep(-1)}
                    className={`flex items-center justify-center w-8 h-8 rounded-full transition ${selectedPath.length === 0 ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
                    title="На початок"
                 >
                     <Home size={14}/>
                 </button>
                 
                 {selectedPath.map((cat, index) => (
                     <div key={cat.id} className="flex items-center animate-in fade-in slide-in-from-left-2">
                         <ChevronRight size={14} className="text-gray-300 mx-1"/>
                         <button 
                            type="button"
                            onClick={() => jumpToCategoryStep(index)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
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

             {/* Сітка категорій (фіксована висота) */}
             <div className="h-[200px] overflow-y-auto custom-scrollbar pr-1">
                {categoriesLoading ? (
                    <div className="h-full flex items-center justify-center text-gray-400 gap-2"><Loader2 className="animate-spin"/></div>
                ) : !isLeafNode ? (
                    <div className="grid grid-cols-2 gap-2 animate-in fade-in zoom-in-95 duration-200 pb-2">
                        {currentOptions.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategorySelect(cat)}
                                className="bg-white p-3 rounded-xl border border-gray-200 hover:border-black hover:shadow-md transition text-left text-xs font-bold text-gray-800 flex items-center justify-between group h-[60px]"
                            >
                                <span className="line-clamp-2 leading-tight pr-1">{cat.name}</span>
                                {cat.children && cat.children.length > 0 && <ChevronRight size={14} className="text-gray-300 group-hover:text-black shrink-0"/>}
                            </button>
                        ))}
                        {currentOptions.length === 0 && categories.length === 0 && (
                            <div className="col-span-2 text-center text-gray-400 py-10 text-xs">Категорії відсутні</div>
                        )}
                    </div>
                ) : (
                    // Стан "Вибрано"
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 bg-white rounded-xl border border-gray-100">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle size={24}/>
                        </div>
                        <div className="text-green-800 font-extrabold text-sm">Категорію обрано</div>
                        <div className="text-gray-500 text-xs mt-1 max-w-[200px] font-medium">{selectedPath[selectedPath.length - 1].name}</div>
                        
                        <button 
                            type="button" 
                            onClick={() => jumpToCategoryStep(selectedPath.length - 2)} 
                            className="mt-4 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                        >
                            Змінити
                        </button>
                    </div>
                )}
             </div>
          </div>

          {/* 3. ОПИС */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Коментар</label>
            <textarea 
              placeholder={requestType === 'sos' ? "Де ви стоїте? Які симптоми?" : "Коли зручно? Побажання до сервісу?"}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl h-24 resize-none text-black focus:border-black outline-none font-medium text-sm transition"
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* 4. ФОТО */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Фото / Відео</label>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                <label className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 border-2 border-dashed border-gray-300 transition hover:border-gray-400">
                    <Camera size={24} className="text-gray-400"/>
                    <span className="text-[10px] text-gray-400 font-bold mt-1">Додати</span>
                    <input type="file" multiple accept="image/*,video/*" hidden onChange={handleFileSelect} />
                </label>

                {previews.map((src, i) => (
                    <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group shadow-sm">
                        <img src={src} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i)} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition backdrop-blur-sm">
                            <Trash2 size={20}/>
                        </button>
                    </div>
                ))}
            </div>
          </div>

          {/* 5. КАРТА (Тільки для SOS і якщо є координати) */}
          {requestType === 'sos' && coords && (
             <div className="h-40 rounded-xl overflow-hidden relative border border-gray-200 shrink-0 shadow-sm">
                 {MAPBOX_TOKEN ? (
                    <Map
                        initialViewState={{ longitude: coords.lng, latitude: coords.lat, zoom: 14 }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        mapboxAccessToken={MAPBOX_TOKEN}
                        onClick={(e) => setCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
                    >
                        <GeolocateControl position="top-left" />
                        <Marker longitude={coords.lng} latitude={coords.lat} anchor="bottom">
                             <div className="relative">
                                 <MapPin size={40} className="text-red-600 fill-white drop-shadow-xl animate-bounce"/>
                                 <div className="w-2 h-2 bg-black/20 rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 blur-sm"></div>
                             </div>
                        </Marker>
                    </Map>
                 ) : <div className="bg-gray-100 h-full flex items-center justify-center text-xs text-gray-400">Карта недоступна</div>}
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-lg pointer-events-none text-black">
                    Натисніть на карту, щоб уточнити місце
                 </div>
             </div>
          )}

          {/* КНОПКА ДІЇ */}
          <button 
            type="submit" 
            disabled={loading || (myCars.length === 0 && !manualCarModel)}
            className={`w-full py-4 text-white font-black rounded-xl transition text-lg mt-2 shadow-xl hover:shadow-2xl active:scale-[0.98] flex justify-center items-center gap-2 ${
                requestType === 'sos' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-black hover:bg-gray-800 shadow-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? <Loader2 className="animate-spin" /> : requestType === 'sos' ? 'SOS — ВИКЛИКАТИ' : 'СТВОРИТИ ЗАЯВКУ'}
          </button>
        </form>
      </div>
    </div>
  );
}