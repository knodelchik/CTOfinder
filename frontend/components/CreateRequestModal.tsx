'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { X, AlertTriangle, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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
  
  // Для вибору авто
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | ''>('');
  const [loadingCars, setLoadingCars] = useState(true);

  // 1. Завантажуємо машини при відкритті
  useEffect(() => {
      api.get('/my-cars')
        .then(res => {
            setMyCars(res.data);
            // Якщо є машини, обираємо першу автоматично
            if (res.data.length > 0) setSelectedCarId(res.data[0].id);
        })
        .catch(() => toast.error("Не вдалося завантажити список авто"))
        .finally(() => setLoadingCars(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarId) return toast.error("Будь ласка, оберіть авто зі списку");
    
    setLoading(true);

    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        const finalDescription = requestType === 'planned' 
            ? `[ПРИЇДУ САМ] ${description}` 
            : `[SOS] ${description}`;

        await api.post('/requests', {
          car_id: Number(selectedCarId), // Передаємо ID
          description: finalDescription,
          category_id: 1, 
          lat: latitude,  
          lng: longitude  
        });
        
        toast.success("Заявку створено! Очікуйте відповіді.");
        onSuccess();

      }, (error) => {
        console.error(error);
        toast.error("Потрібна геолокація для пошуку майстрів!");
        setLoading(false);
      });

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Помилка сервера';
      toast.error(msg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full sm:rounded-3xl shadow-2xl sm:max-w-lg overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Перемикач Типу */}
        <div className="flex border-b">
            <button 
                type="button"
                onClick={() => setRequestType('sos')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition ${
                    requestType === 'sos' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
                <AlertTriangle size={20} /> SOS (Я став)
            </button>
            <button 
                type="button"
                onClick={() => setRequestType('planned')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition ${
                    requestType === 'planned' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
            >
                <MapPin size={20} /> Приїду сам
            </button>
        </div>

        <div className="px-6 py-4 flex justify-between items-center">
          <h3 className="font-extrabold text-xl text-black">
            {requestType === 'sos' ? 'Екстрений виклик' : 'Пошук СТО (Планово)'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X size={24} className="text-black" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          {/* Вибір АВТО */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Оберіть авто</label>
            {loadingCars ? (
                <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={16}/> Завантаження гаража...</div>
            ) : myCars.length > 0 ? (
                <select 
                    required
                    className="w-full p-3 bg-gray-100 rounded-xl font-bold text-black focus:ring-2 ring-black outline-none appearance-none"
                    value={selectedCarId} 
                    onChange={e => setSelectedCarId(Number(e.target.value))}
                >
                    {myCars.map(car => (
                        <option key={car.id} value={car.id}>
                            {car.brand_model} — {car.license_plate}
                        </option>
                    ))}
                </select>
            ) : (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                    У гаражі порожньо. Спочатку додайте авто в профілі.
                </div>
            )}
          </div>

          {/* Опис */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Опис проблеми</label>
            <textarea 
              required placeholder={requestType === 'sos' ? "Де ви? Що зламалось?" : "Що треба полагодити? Коли зручно?"}
              className="w-full p-3 bg-gray-100 rounded-xl h-24 resize-none text-black focus:ring-2 ring-black outline-none font-medium"
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button 
            type="submit" disabled={loading || myCars.length === 0}
            className={`w-full py-4 text-white font-bold rounded-xl transition text-lg mt-2 shadow-lg flex justify-center items-center gap-2 ${
                requestType === 'sos' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
            } ${myCars.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading && <Loader2 className="animate-spin" />}
            {requestType === 'sos' ? 'ВИКЛИКАТИ МАЙСТРА' : 'СТВОРИТИ ЗАЯВКУ'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestModal;