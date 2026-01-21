'use client';

import { useState } from 'react';
import api from '@/lib/api';

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
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Помилка при відправці.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        
        {/* Шапка стала контрастнішою */}
        <div className="bg-gray-100 px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-xl text-black">Ремонт {carModel}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black text-2xl transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
          <div>
            <label className="block text-base font-bold text-black mb-2">
              Вартість роботи (грн)
            </label>
            <input 
              type="number" 
              required
              placeholder="Наприклад: 500"
              className="w-full p-4 border-2 border-gray-300 rounded-xl text-xl font-bold text-black focus:border-black focus:outline-none placeholder:text-gray-400"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-base font-bold text-black mb-2">
              Повідомлення клієнту
            </label>
            <p className="text-sm text-gray-600 mb-2">
              Напишіть, що входить у ціну, та <strong>адресу вашого СТО</strong>, якщо клієнт має приїхати сам.
            </p>
            <textarea 
              required
              placeholder="Привіт! Можу прийняти вас сьогодні. Приїжджайте на вул. Механізаторів 12, бокс 5..."
              className="w-full p-4 border-2 border-gray-300 rounded-xl h-32 resize-none text-black text-base focus:border-black focus:outline-none placeholder:text-gray-400 leading-relaxed"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <div className="flex gap-4 mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 text-gray-700 font-bold hover:bg-gray-200 rounded-xl transition text-lg"
            >
              Скасувати
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-70 text-lg shadow-lg"
            >
              {loading ? 'Відправка...' : 'Надіслати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfferModal;