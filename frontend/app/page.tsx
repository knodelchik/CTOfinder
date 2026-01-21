'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, MapPin, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // 1. АВТО-РЕДИРЕКТ: Якщо юзер вже залогінений - кидаємо його в кабінет
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'driver') {
        router.push('/driver/map');
      } else if (user.role === 'mechanic') {
        router.push('/find');
      }
    }
  }, [user, isLoading, router]);

  // Поки думаємо куди перекинути - показуємо спінер (або нічого)
  if (isLoading) return null; 

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
      <Header />

      {/* --- HERO SECTION (Перший екран) --- */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-6">
                Працюємо по всій Україні 🇺🇦
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight text-black">
                Зламалися в дорозі? <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Допомога за 1 клік.
                </span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                Сервіс миттєвого пошуку автомеханіків та евакуаторів. 
                Ми знаходимо найближчу допомогу, поки ви залишаєтесь у безпеці.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link 
                    href="/register" 
                    className="px-8 py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-xl shadow-black/20 flex items-center gap-2"
                >
                    Створити акаунт <ArrowRight size={20}/>
                </Link>
                <Link 
                    href="/login" 
                    className="px-8 py-4 bg-gray-100 text-black rounded-xl font-bold text-lg hover:bg-gray-200 transition"
                >
                    Увійти
                </Link>
            </div>
        </div>
        
        {/* Декоративний фон */}
        <div className="absolute top-0 left-0 w-full h-full opacity-30 -z-10 pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
      </section>

      {/* --- FEATURES SECTION (Переваги) --- */}
      <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-12">
                  
                  {/* Картка 1 */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
                          <MapPin size={32} />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Геолокація</h3>
                      <p className="text-gray-500 leading-relaxed">
                          Вам не треба пояснювати, де ви. Ми автоматично передаємо ваші координати найближчим майстрам.
                      </p>
                  </div>

                  {/* Картка 2 */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                          <Clock size={32} />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Швидкість</h3>
                      <p className="text-gray-500 leading-relaxed">
                          Майстри отримують сповіщення миттєво. Середній час очікування відповіді — менше 2 хвилин.
                      </p>
                  </div>

                  {/* Картка 3 */}
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                          <ShieldCheck size={32} />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Прозорість</h3>
                      <p className="text-gray-500 leading-relaxed">
                          Ви бачите ціну ремонту заздалегідь. Жодних прихованих платежів — ви самі обираєте найкращу пропозицію.
                      </p>
                  </div>

              </div>
          </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-gray-200 py-12 text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-xl text-black mb-4">
            <div className="bg-black text-white p-1.5 rounded-lg">
                <Wrench size={20} />
            </div>
            <span>CarRepair</span>
        </div>
        <p className="text-gray-500 text-sm">
            © 2026 Всі права захищено. Зроблено для водіїв.
        </p>
      </footer>
    </div>
  );
}