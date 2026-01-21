import axios from 'axios';

// Створюємо інстанс axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. ПЕРЕХОПЛЮВАЧ ЗАПИТІВ (Request Interceptor)
// Перед кожним запитом ми ліземо в localStorage і додаємо токен
// lib/api.ts

// ... імпорти та створення api ...

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 👇 ДОДАЙ ЦЕЙ БЛОК 👇
    // Якщо дані - це FormData (файл), видаляємо Content-Type,
    // щоб браузер сам підставив правильний multipart/form-data з boundary
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ... (response interceptor залишається без змін)

// 2. ПЕРЕХОПЛЮВАЧ ВІДПОВІДЕЙ (Response Interceptor)
// Якщо сервер відповів помилкою, ми перевіряємо, чи це 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Якщо помилка 401 (Не авторизований) і ми ще не пробували повторити запит
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // ТУТ МОЖНА БУЛО Б ЗРОБИТИ REFRESH TOKEN (складніший варіант)
      // Але для початку зробимо надійний вихід із системи:
      
      console.warn("Session expired. Logging out...");
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Перенаправляємо на логін, якщо ми ще не там
        if (window.location.pathname !== '/login') {
             window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;