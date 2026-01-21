'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import api from '@/lib/api';
import { UserProfile } from './types';
import { Loader2, Wrench, Car as CarIcon } from 'lucide-react';

import Garage from '@/components/profile/Garage';
import StationSettings from '@/components/profile/StationSettings';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'garage' | 'station'>('garage');

  useEffect(() => {
    api.get('/me')
       .then(res => {
           setUser(res.data);
           if (res.data.role === 'mechanic') setActiveTab('station');
       })
       .catch(e => console.error(e))
       .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-black"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />
      <div className="max-w-3xl mx-auto p-4">
        
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-extrabold text-black">Мій Профіль</h1>
            <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{user?.username}</span>
                <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                    {user?.role === 'mechanic' ? 'Майстер' : 'Водій'}
                </span>
            </div>
        </div>

        {/* ТАБИ ДЛЯ МАЙСТРА */}
        {user?.role === 'mechanic' && (
            <div className="flex p-1 bg-gray-200 rounded-xl mb-8">
                <button onClick={() => setActiveTab('station')} className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'station' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>
                    <Wrench size={18}/> Налаштування СТО
                </button>
                <button onClick={() => setActiveTab('garage')} className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'garage' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>
                    <CarIcon size={18}/> Мій Гараж
                </button>
            </div>
        )}

        {/* ВІДОБРАЖЕННЯ КОМПОНЕНТІВ */}
        {activeTab === 'garage' && <Garage />}
        
        {activeTab === 'station' && user?.role === 'mechanic' && <StationSettings />}

      </div>
    </div>
  );
}