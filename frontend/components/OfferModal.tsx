'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast'; // Використовуємо тости для єдиного стилю
import { X, Loader2 } from 'lucide-react'; // Додав іконки для краси

interface OfferModalProps {
  requestId: number;
  carModel: string;
  onClose: () => void;
  onSuccess: () => void;
}

const OfferModal = ({ requestId, carModel, onClose, onSuccess }: OfferModalProps) => {
  const [price, setPrice] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/offers', {
        request_id: requestId,
        price: parseFloat(price),
        comment: comment
      });
      
      toast.success('Пропозицію надіслано!');
      onSuccess(); // Закриваємо модалку і оновлюємо список
      onClose();

    } catch (error: any) {
      console.error(error);
      
      // Обробка специфічної помилки від бекенду (якщо немає СТО)
      if (error.response?.status === 403) {
        toast.error("Спочатку створіть профіль СТО в налаштуваннях!", { duration: 5000 });
      } else if (error.response?.status === 409) {
        toast.error("Ви вже відгукнулися на цю заявку.");
      } else {
        toast.error('Помилка при відправці. Спробуйте пізніше.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        
        {/* Шапка */}
        <div className="bg-gray-50 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
              <h3 className="font-extrabold text-xl text-black">Ремонт авто</h3>
              <p className="text-sm text-gray-500 font-bold">{carModel}</p>
          </div>
          <button onClick={onClose} className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full transition text-gray-700">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
              Вартість роботи (грн)
            </label>
            <input 
              type="number" 
              required
              placeholder="500"
              className="w-full p-4 border border-gray-300 rounded-xl text-xl font-bold text-black focus:ring-2 focus:ring-black focus:border-transparent outline-none placeholder:text-gray-300 transition"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase">
              Коментар для водія
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Ваша адреса СТО підтягнеться автоматично. Тут вкажіть деталі по часу або запчастинам.
            </p>
            <textarea 
              required
              placeholder="Добрий день! Готовий взяти в роботу. Запчастини є в наявності..."
              className="w-full p-4 border border-gray-300 rounded-xl h-32 resize-none text-black font-medium focus:ring-2 focus:ring-black focus:border-transparent outline-none placeholder:text-gray-400 leading-relaxed transition"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <div className="flex gap-3 mt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 text-black font-bold bg-gray-100 hover:bg-gray-200 rounded-xl transition"
            >
              Скасувати
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-70 shadow-lg shadow-gray-200 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin"/> : 'Надіслати пропозицію'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferModal;