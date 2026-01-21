'use client';

import Link from 'next/link';
import { Car, User, LogOut, ChevronDown, Wrench } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext'; // Використовуємо наш хук

const Header = () => {
  const { user, logout, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
      
      {/* ЛОГОТИП */}
      <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-black hover:opacity-70 transition group">
        <div className="bg-black text-white p-2 rounded-xl group-hover:rotate-12 transition transform">
            <Car size={20} />
        </div>
        <span>CarRepair</span>
      </Link>

      {/* ПРАВА ЧАСТИНА */}
      <div className="flex items-center gap-4">
        
        {/* Поки вантажиться - показуємо пусте місце або скелетон */}
        {isLoading ? (
            <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse"></div>
        ) : !user ? (
            /* ЯКЩО НЕ ВВІЙШОВ */
            <div className="flex items-center gap-2">
                <Link 
                    href="/login" 
                    className="hidden md:block px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-black hover:bg-gray-100 rounded-xl transition"
                >
                    Увійти
                </Link>
                <Link 
                    href="/register" 
                    className="px-5 py-2.5 text-sm font-bold bg-black text-white rounded-xl shadow-lg shadow-black/20 hover:bg-gray-800 hover:scale-105 active:scale-95 transition"
                >
                    Реєстрація
                </Link>
            </div>
        ) : (
            /* ЯКЩО ВВІЙШОВ */
            <div className="relative">
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-3 hover:bg-gray-100 p-1.5 pr-3 rounded-full border border-gray-200 transition"
                >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                        user.role === 'mechanic' ? 'bg-black' : 'bg-blue-600'
                    }`}>
                        {user.username[0].toUpperCase()}
                    </div>
                    <span className="font-bold text-sm hidden sm:block text-gray-700">{user.username}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Випадаюче меню */}
                {isMenuOpen && (
                    <div 
                        className="absolute right-0 top-full mt-3 w-56 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
                        onMouseLeave={() => setIsMenuOpen(false)}
                    >
                        <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                            <span className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Ваша роль</span>
                            <div className="flex items-center gap-2 mt-1">
                                {user.role === 'mechanic' ? <Wrench size={16} className="text-black"/> : <Car size={16} className="text-blue-600"/>}
                                <p className="text-sm font-bold text-black capitalize">
                                    {user.role === 'mechanic' ? 'Майстер' : 'Водій'}
                                </p>
                            </div>
                        </div>

                        <div className="p-2">
                            {user.role === 'driver' && (
                                <Link 
                                    href="/driver/requests" 
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl flex items-center gap-3 transition"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <User size={18} /> Мої заявки
                                </Link>
                            )}

                            {user.role === 'mechanic' && (
                                <Link 
                                    href="/find" 
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-black rounded-xl flex items-center gap-3 transition"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <Wrench size={18} /> Стрічка замовлень
                                </Link>
                            )}
                            
                            <button 
                                onClick={() => { logout(); setIsMenuOpen(false); }}
                                className="w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition mt-1"
                            >
                                <LogOut size={18} /> Вихід
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;