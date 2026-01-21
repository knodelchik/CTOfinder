'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Wrench, Car as CarIcon } from 'lucide-react';
import CarsTab from '@/components/profile/CarsTab';
import StationTab from '@/components/profile/StationTab';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'cars' | 'station'>('cars');

  // Відновлення вкладки
  useEffect(() => {
      const savedTab = localStorage.getItem('profileTab');
      if (savedTab === 'station' || savedTab === 'cars') {
          setActiveTab(savedTab);
      }
  }, []);

  const switchTab = (tab: 'cars' | 'station') => {
      setActiveTab(tab);
      localStorage.setItem('profileTab', tab);
  };

  return (
    <div className="min-h-screen bg-white pb-20 text-black">
      <Header />
      
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-extrabold mb-6 text-black">Кабінет користувача</h1>

        {/* Перемикач вкладок */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button 
                onClick={() => switchTab('cars')} 
                className={`pb-3 px-4 font-bold flex items-center gap-2 transition-colors ${
                    activeTab === 'cars' 
                    ? 'border-b-2 border-black text-black' 
                    : 'text-gray-500 hover:text-black'
                }`}
            >
                <CarIcon size={20}/> Мої авто
            </button>
            <button 
                onClick={() => switchTab('station')} 
                className={`pb-3 px-4 font-bold flex items-center gap-2 transition-colors ${
                    activeTab === 'station' 
                    ? 'border-b-2 border-black text-black' 
                    : 'text-gray-500 hover:text-black'
                }`}
            >
                <Wrench size={20}/> Моє СТО
            </button>
        </div>

        {/* Контент */}
        {activeTab === 'cars' ? <CarsTab /> : <StationTab />}
      </div>
    </div>
  );
}