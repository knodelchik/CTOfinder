'use client';

import Header from '@/components/Header';
import LoginForm from '@/components/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-black mb-2">З поверненням! 👋</h1>
                <p className="text-gray-500">Увійдіть, щоб керувати заявками</p>
            </div>
            
            {/* Вставляємо нашу форму, вона вже має всю логіку */}
            <LoginForm />

            <p className="text-center mt-6 text-gray-500 text-sm">
                Ще немає акаунту?{' '}
                <Link href="/register" className="text-black font-bold hover:underline">
                    Зареєструватися
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
}