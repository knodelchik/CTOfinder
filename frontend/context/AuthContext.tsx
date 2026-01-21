'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  username: string;
  role: string;
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

  // 1. При завантаженні сторінки перевіряємо, чи ми вже в системі
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          // Якщо є токен, питаємо сервер "Хто я?"
          // (Якщо ти ще не зробив ендпоінт /me, можна брати з localStorage як тимчасове рішення)
          const savedName = localStorage.getItem('user_name');
          const savedRole = localStorage.getItem('user_role');
          
          if (savedName && savedRole) {
             setUser({ username: savedName, role: savedRole });
          } else {
             // Правильний шлях: завантажити з бекенду
             const res = await api.get('/me');
             setUser({ username: res.data.username, role: res.data.role });
          }
        } catch (error) {
          console.error("Session expired");
          logout(); // Якщо токен невалідний - викидаємо
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // 2. Функція входу (викликаємо її з форми логіна)
  const login = async (tokens: { access: string, refresh: string }) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    
    // Отримуємо дані юзера
    const res = await api.get('/me');
    
    const userData = { username: res.data.username, role: res.data.role };
    setUser(userData);
    
    // Зберігаємо про всяк випадок
    localStorage.setItem('user_name', userData.username);
    localStorage.setItem('user_role', userData.role);
    
    router.push('/'); // Редирект на головну
  };

  // 3. Функція виходу
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук, щоб зручно використовувати в компонентах: const { user } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}