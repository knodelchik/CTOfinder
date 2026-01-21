'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, List, PlusCircle } from 'lucide-react';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Функція для підсвічування активної кнопки
  const isActive = (path: string) => pathname === path ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Верхня шапка (залишаємо) */}
      <Header />

      {/* Основний контент сторінки */}
      <main className="flex-1 pb-20 md:pb-0 relative">
        {children}
      </main>

      {/* НИЖНЄ МЕНЮ (Мобільна навігація) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50 md:hidden">
        
        <Link href="/driver/requests" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${isActive('/driver/requests')}`}>
          <List size={24} />
          <span className="text-xs font-bold">Мої заявки</span>
        </Link>

        {/* Центральна кнопка "+" */}
        <button 
            onClick={() => document.dispatchEvent(new CustomEvent('open-create-modal'))}
            className="bg-black text-white p-4 rounded-full shadow-lg transform -translate-y-6 hover:scale-105 transition"
        >
          <PlusCircle size={32} />
        </button>

        <Link href="/driver/map" className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${isActive('/driver/map')}`}>
          <Map size={24} />
          <span className="text-xs font-bold">Карта СТО</span>
        </Link>

      </nav>
      
      {/* ДЕСКТОП МЕНЮ (Просте) */}
      <div className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r flex-col p-4 space-y-2">
         <div className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Меню водія</div>
         <Link href="/driver/requests" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${isActive('/driver/requests')}`}>
            <List size={20} /> Мої заявки
         </Link>
         <Link href="/driver/map" className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition ${isActive('/driver/map')}`}>
            <Map size={20} /> Карта СТО
         </Link>
      </div>
    </div>
  );
}