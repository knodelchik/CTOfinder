'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Імпорт контексту
import toast from 'react-hot-toast'; // Імпорт тостів

const RegisterForm = () => {
  const router = useRouter();
  const { login } = useAuth(); // Беремо функцію входу з контексту
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    role: 'driver' // 'driver' або 'mechanic'
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Валідація телефону (проста)
    if (formData.phone.length < 10) {
        toast.error("Введіть коректний номер телефону");
        setLoading(false);
        return;
    }

    try {
      // 1. Спроба реєстрації
      // toast.promise показує красивий статус завантаження
      await toast.promise(
        api.post('/auth/register', {
            ...formData,
            telegram_id: null
        }),
        {
           loading: 'Створення акаунту...',
           success: <b>Успішно! Входимо в систему...</b>,
           error: (err) => {
             // Якщо помилка бекенду - показуємо її текст
             if (err.response?.data?.username) return "Цей логін вже зайнятий";
             if (err.response?.data?.phone) return "Цей телефон вже використовується";
             return "Помилка реєстрації. Спробуйте інший логін.";
           },
        }
      );

      // 2. Якщо реєстрація пройшла (помилки не було) - Автоматичний Вхід
      const loginRes = await api.post('/token/pair', {
        username: formData.username,
        password: formData.password
      });

      // 3. Зберігаємо сесію через AuthContext (він сам перекине на потрібну сторінку)
      await login(loginRes.data);

    } catch (err: any) {
        console.error("Registration error:", err);
        // Тут нічого не робимо, бо toast.promise вже показав помилку у блоці error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
      <h2 className="text-3xl font-extrabold text-center mb-6 text-black">Реєстрація</h2>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        
        {/* Вибір Ролі */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-2">
            <button
                type="button"
                className={`flex-1 py-2 rounded-lg font-bold transition ${formData.role === 'driver' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                onClick={() => setFormData({...formData, role: 'driver'})}
            >
                🚗 Я Водій
            </button>
            <button
                type="button"
                className={`flex-1 py-2 rounded-lg font-bold transition ${formData.role === 'mechanic' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}
                onClick={() => setFormData({...formData, role: 'mechanic'})}
            >
                🛠️ Я Майстер
            </button>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Логін (Нікнейм)</label>
          <input 
            type="text" required
            className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black outline-none transition"
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Телефон</label>
          <input 
            type="tel" required
            placeholder="+380..."
            className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black outline-none transition"
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase">Пароль</label>
           <input 
            type="password" required
            className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black outline-none transition"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>
        
        <button 
          type="submit" disabled={loading}
          className="bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition mt-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Обробка...' : 'Створити акаунт'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;