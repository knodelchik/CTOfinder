'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// 1. Інтерфейс користувача (включає нові поля)
interface User {
  id: number;
  username: string;
  role: 'driver' | 'mechanic';
  phone: string; 
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (tokens: { access: string, refresh: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 1. При завантаженні сторінки перевіряємо токен і завантажуємо профіль
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
           // Запитуємо повні дані профілю з бекенду
           const res = await api.get('/me');
           
           // Зберігаємо в стейт, явно вказуючи типи
           setUser({
             id: res.data.id,
             username: res.data.username,
             role: res.data.role as 'driver' | 'mechanic', // Виправляємо помилку типу
             phone: res.data.phone
           });

        } catch (error) {
          console.error("Session expired or fetch error", error);
          logout(); 
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 2. Функція входу
  const login = async (tokens: { access: string, refresh: string }) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    
    // Одразу після збереження токенів тягнемо дані юзера
    try {
      const res = await api.get('/me');
      
      const userData: User = { 
        id: res.data.id,
        username: res.data.username, 
        role: res.data.role as 'driver' | 'mechanic', // Кастуємо тип
        phone: res.data.phone 
      };
      
      setUser(userData);
      
      // Ми більше не зберігаємо дані юзера в localStorage (лише токени),
      // щоб дані завжди були актуальні з бази.
      
      router.push('/'); 
    } catch (e) {
      console.error("Login fetch error", e);
    }
  };

  // 3. Функція виходу
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Видаляти user_name/role більше не треба, бо ми їх і не зберігаємо
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}