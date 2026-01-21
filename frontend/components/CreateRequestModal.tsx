'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { X, Car, PenTool, AlertTriangle, MapPin } from 'lucide-react';

interface CreateRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'sos' | 'planned'; // Можемо відкрити одразу з потрібним типом
}

const CreateRequestModal = ({ onClose, onSuccess, defaultType = 'sos' }: CreateRequestModalProps) => {
  const [requestType, setRequestType] = useState<'sos' | 'planned'>(defaultType);
  const [carModel, setCarModel] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;

        // Додаємо уточнення в опис для майстра
        const finalDescription = requestType === 'planned' 
            ? `[ПРИЇДУ САМ] ${description}` 
            : `[SOS] ${description}`;

        await api.post('/requests', {
          car_model: carModel,
          description: finalDescription,
          category_id: 1, 
          lat: latitude,  
          lng: longitude  
        });
        
        onSuccess();

      }, (error) => {
        console.error(error);
        alert("Потрібна геолокація для пошуку найближчих майстрів!");
        setLoading(false);
      });

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.detail || 'Помилка';
      alert(`Помилка: ${msg}`);
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
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ваше авто</label>
            <input 
              type="text" required placeholder="Наприклад: BMW X5"
              className="w-full p-3 bg-gray-100 rounded-xl font-bold text-black focus:ring-2 ring-black outline-none"
              value={carModel} onChange={e => setCarModel(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Опис проблеми</label>
            <textarea 
              required placeholder={requestType === 'sos' ? "Де ви? Що зламалось?" : "Що треба полагодити? Коли зручно?"}
              className="w-full p-3 bg-gray-100 rounded-xl h-24 resize-none text-black focus:ring-2 ring-black outline-none"
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className={`w-full py-4 text-white font-bold rounded-xl transition text-lg mt-2 shadow-lg ${
                requestType === 'sos' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
            }`}
          >
            {loading ? 'Обробка...' : (requestType === 'sos' ? 'ВИКЛИКАТИ МАЙСТРА' : 'СТВОРИТИ ЗАЯВКУ')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateRequestModal;