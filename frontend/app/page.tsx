'use client';

import Header from '@/components/Header';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, ShieldCheck, ArrowRight, Wrench, FileText, Search, Briefcase, AlertTriangle } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();

  // Якщо вантажиться - показуємо пустий екран або спінер
  if (isLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;

  // --- ВАРІАНТ 1: ЮЗЕР ЗАЛОГІНЕНИЙ (ДАШБОРД) ---
  if (user) {
      return (
        <div className="min-h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
          <Header />
          
          <main className="flex-1 container mx-auto px-4 py-10 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-black">Привіт, {user.username}! 👋</h1>
                <p className="text-gray-500">Оберіть, що ви хочете зробити зараз.</p>
            </div>

            {/* ВІДЖЕТИ ДЛЯ ВОДІЯ */}
            {user.role === 'driver' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Link href="/driver/map" className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-500 transition duration-300 flex flex-col items-start relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-32 bg-blue-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition"/>
                         <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-blue-200">
                             <AlertTriangle size={32} />
                         </div>
                         <h3 className="text-2xl font-extrabold text-black mb-2 relative z-10">Викликати майстра</h3>
                         <p className="text-gray-500 mb-6 relative z-10 font-medium">Зламались у дорозі? Знайдіть допомогу на карті поруч.</p>
                         <span className="mt-auto flex items-center gap-2 font-bold text-blue-600 group-hover:translate-x-2 transition relative z-10">
                             Перейти до карти <ArrowRight size={18}/>
                         </span>
                    </Link>

                    <Link href="/driver/requests" className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-purple-500 transition duration-300 flex flex-col items-start relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-32 bg-purple-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition"/>
                         <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-purple-200">
                             <FileText size={32} />
                         </div>
                         <h3 className="text-2xl font-extrabold text-black mb-2 relative z-10">Мої заявки</h3>
                         <p className="text-gray-500 mb-6 relative z-10 font-medium">Перевірте статус ваших активних ремонтів та історію.</p>
                         <span className="mt-auto flex items-center gap-2 font-bold text-purple-600 group-hover:translate-x-2 transition relative z-10">
                             Відкрити список <ArrowRight size={18}/>
                         </span>
                    </Link>
                </div>
            )}

            {/* ВІДЖЕТИ ДЛЯ МАЙСТРА */}
            {user.role === 'mechanic' && (
                <div className="grid md:grid-cols-2 gap-6">
                    <Link href="/find" className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-black transition duration-300 flex flex-col items-start relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-32 bg-gray-100 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition"/>
                         <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-gray-400">
                             <Search size={32} />
                         </div>
                         <h3 className="text-2xl font-extrabold text-black mb-2 relative z-10">Знайти замовлення</h3>
                         <p className="text-gray-500 mb-6 relative z-10 font-medium">Перегляньте стрічку заявок від водіїв поруч з вами.</p>
                         <span className="mt-auto flex items-center gap-2 font-bold text-black group-hover:translate-x-2 transition relative z-10">
                             Шукати клієнтів <ArrowRight size={18}/>
                         </span>
                    </Link>

                    <Link href="/my-jobs" className="group bg-white p-8 rounded-3xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-green-500 transition duration-300 flex flex-col items-start relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-32 bg-green-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition"/>
                         <div className="w-14 h-14 bg-green-600 text-white rounded-2xl flex items-center justify-center mb-6 relative z-10 shadow-lg shadow-green-200">
                             <Briefcase size={32} />
                         </div>
                         <h3 className="text-2xl font-extrabold text-black mb-2 relative z-10">Мої роботи</h3>
                         <p className="text-gray-500 mb-6 relative z-10 font-medium">Активні ремонти, контакти клієнтів та завершення угод.</p>
                         <span className="mt-auto flex items-center gap-2 font-bold text-green-600 group-hover:translate-x-2 transition relative z-10">
                             Відкрити кабінет <ArrowRight size={18}/>
                         </span>
                    </Link>
                </div>
            )}
          </main>
        </div>
      );
  }

  // --- ВАРІАНТ 2: ГОСТЯ (ЛЕНДІНГ) ---
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-gray-900">
      <Header />

      {/* HERO SECTION */}
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

      {/* FEATURES SECTION */}
      <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6">
              <div className="grid md:grid-cols-3 gap-12">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6"><MapPin size={32} /></div>
                      <h3 className="text-2xl font-bold mb-4">Геолокація</h3>
                      <p className="text-gray-500 leading-relaxed">Ми автоматично передаємо ваші координати найближчим майстрам.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6"><Clock size={32} /></div>
                      <h3 className="text-2xl font-bold mb-4">Швидкість</h3>
                      <p className="text-gray-500 leading-relaxed">Майстри отримують сповіщення миттєво.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                      <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6"><ShieldCheck size={32} /></div>
                      <h3 className="text-2xl font-bold mb-4">Прозорість</h3>
                      <p className="text-gray-500 leading-relaxed">Жодних прихованих платежів — ви самі обираєте найкращу пропозицію.</p>
                  </div>
              </div>
          </div>
      </section>

      <footer className="bg-white border-t border-gray-200 py-12 text-center">
        <div className="flex items-center justify-center gap-2 font-bold text-xl text-black mb-4">
            <div className="bg-black text-white p-1.5 rounded-lg"><Wrench size={20} /></div>
            <span>CarRepair</span>
        </div>
        <p className="text-gray-500 text-sm">© 2026 Всі права захищено.</p>
      </footer>
    </div>
  );
}