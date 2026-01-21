'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Car, User, LogOut, ChevronDown, Wrench, Map } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

const Header = () => {
  const { user, logout, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  // --- ЛОГІКА ПЕРЕМИКАННЯ ---
  // 1. Визначаємо, де ми зараз (у зоні водія чи ні)
  const isDriverSection = pathname?.startsWith('/driver');

  // 2. Куди вести при кліку
  const switchTarget = isDriverSection ? '/find' : '/driver/map';
  
  // 3. Текст кнопки
  const switchLabel = isDriverSection ? 'Кабінет Майстра' : 'Карта Водія';
  const SwitchIcon = isDriverSection ? Wrench : Map;

  return (
    <header className="h-16 border-b border-gray-200 flex items-center justify-between px-4 md:px-8 bg-white/90 backdrop-blur-md sticky top-0 z-[100] shadow-sm">
      
      {/* ЛОГОТИП */}
      <Link href="/" className="flex items-center gap-2 font-extrabold text-xl text-black hover:opacity-70 transition group">
        <div className="bg-black text-white p-2 rounded-xl group-hover:rotate-6 transition">
            <Car size={20} />
        </div>
        <span className="hidden sm:inline">CarRepair</span>
      </Link>

      <div className="flex items-center gap-4">
        {!isLoading && user ? (
            <div className="flex items-center gap-3">
                
                {/* --- КНОПКА ПЕРЕМИКАННЯ (ТІЛЬКИ ДЛЯ МАЙСТРІВ) --- */}
                {user.role === 'mechanic' && (
                    <Link 
                        href={switchTarget}
                        className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                            isDriverSection 
                                ? 'bg-black text-white hover:bg-gray-800' // Чорна кнопка (йти до Майстра)
                                : 'bg-blue-600 text-white hover:bg-blue-700' // Синя кнопка (йти до Водія)
                        }`}
                    >
                        <SwitchIcon size={14} />
                        {switchLabel}
                    </Link>
                )}

                {/* --- АВАТАРКА І МЕНЮ --- */}
                <div className="relative">
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 hover:bg-gray-100 p-1.5 pr-3 rounded-full border border-gray-200 transition"
                    >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                            user.role === 'mechanic' ? 'bg-black' : 'bg-blue-600'
                        }`}>
                            {user.username[0].toUpperCase()}
                        </div>
                        <ChevronDown size={14} className="text-gray-400"/>
                    </button>

                    {isMenuOpen && (
                        <div 
                            className="absolute right-0 top-full mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
                            onMouseLeave={() => setIsMenuOpen(false)}
                        >
                             <div className="px-5 py-4 border-b border-gray-50 bg-gray-50">
                                <p className="text-sm font-extrabold text-black">{user.username}</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className={`w-2 h-2 rounded-full ${user.role === 'mechanic' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                    <p className="text-xs text-gray-500 capitalize font-bold">
                                        {user.role === 'mechanic' ? 'Статус: Майстер' : 'Статус: Водій'}
                                    </p>
                                </div>
                            </div>

                            <div className="p-2 space-y-1">
                                <Link href="/profile" className="px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl flex items-center gap-3 transition" onClick={() => setIsMenuOpen(false)}>
                                    <User size={18} /> Профіль (Авто/СТО)
                                </Link>

                                {/* Мобільний перемикач (дублюємо тут для телефонів, ТІЛЬКИ ДЛЯ МАЙСТРІВ) */}
                                {user.role === 'mechanic' && (
                                    <Link 
                                        href={switchTarget} 
                                        className={`md:hidden px-4 py-2.5 text-sm font-bold rounded-xl flex items-center gap-3 transition ${
                                            isDriverSection ? 'bg-black text-white' : 'bg-blue-600 text-white'
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <SwitchIcon size={18} /> {switchLabel}
                                    </Link>
                                )}
                                
                                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition mt-2 border-t border-gray-100">
                                    <LogOut size={18} /> Вихід
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            <div className="flex gap-2">
                <Link href="/login" className="px-5 py-2.5 font-bold text-sm text-gray-600 hover:text-black transition">Увійти</Link>
                <Link href="/register" className="px-5 py-2.5 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition shadow-lg">Реєстрація</Link>
            </div>
        )}
      </div>
    </header>
  );
};

export default Header;