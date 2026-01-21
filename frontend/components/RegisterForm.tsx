'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

const RegisterForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    role: 'driver' // 'driver' або 'mechanic'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Реєструємось
      await api.post('/auth/register', {
        ...formData,
        telegram_id: null // Поки що не використовуємо
      });
// 1. Реєструємось
      const regRes = await api.post('/auth/register', { ...formData, telegram_id: null });
      
      // 2. Логінимось
      const tokenRes = await api.post('/token/pair', {
        username: formData.username,
        password: formData.password
      });

      localStorage.setItem('access_token', tokenRes.data.access);
      localStorage.setItem('refresh_token', tokenRes.data.refresh);
      
      // 3. Зберігаємо роль та ім'я (ми їх вже знаємо з форми)
      localStorage.setItem('user_role', formData.role);
      localStorage.setItem('user_name', formData.username);

      router.push('/');
      
    } catch (err: any) {
        console.error(err);
        const msg = err.response?.data?.detail || 'Помилка реєстрації';
        setError(msg);
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
          <label className="text-xs font-bold text-gray-500 uppercase">Логін</label>
          <input 
            type="text" required
            className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black outline-none text-black"
            value={formData.username}
            onChange={e => setFormData({...formData, username: e.target.value})}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Телефон</label>
          <input 
            type="tel" required
            placeholder="+380..."
            className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black outline-none text-black"
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
        </div>
        
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase">Пароль</label>
           <input 
            type="password" required
            className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-black outline-none text-blackпо"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>
        
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
        <button 
          type="submit" disabled={loading}
          className="bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition mt-2 text-lg"
        >
          {loading ? 'Створення...' : 'Створити акаунт'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;