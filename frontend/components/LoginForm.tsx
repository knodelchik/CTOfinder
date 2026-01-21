'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext'; // <--- Імпорт

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const { login } = useAuth(); // <--- Беремо функцію з контексту
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/token/pair', { username, password });
      
      // Магія! Ця функція сама збереже токени, візьме юзера і оновить Хедер
      await login(res.data); 

      if (onLoginSuccess) onLoginSuccess();
      
    } catch (err: any) {
      console.error(err);
      setError('Невірний логін або пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... (твій JSX форми залишається тим самим, тільки onSubmit={handleSubmit})
    // Якщо треба код верстки - скажи, я скину, але він такий самий
    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100">
      <h2 className="text-2xl font-extrabold text-center mb-6 text-black">Вхід</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
         {/* Поля інпутів такі самі... */}
         <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Логін</label>
            <input 
              type="text" required
              className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-black outline-none"
              value={username} onChange={e => setUsername(e.target.value)}
            />
         </div>
         <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Пароль</label>
            <input 
              type="password" required
              className="w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-black outline-none"
              value={password} onChange={e => setPassword(e.target.value)}
            />
         </div>

         {error && <p className="text-red-500 text-sm text-center">{error}</p>}

         <button 
            type="submit" disabled={loading}
            className="bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition mt-2"
         >
            {loading ? 'Вхід...' : 'Увійти'}
         </button>
      </form>
    </div>
  );
};

export default LoginForm;