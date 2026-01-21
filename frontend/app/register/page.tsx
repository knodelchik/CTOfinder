import Header from '@/components/Header';
import RegisterForm from '@/components/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <RegisterForm />
        <p className="mt-4 text-gray-500">
            Вже є акаунт? <Link href="/" className="text-blue-600 font-bold hover:underline">Увійти на головній</Link>
        </p>
      </div>
    </div>
  );
}