import axios from 'axios';

const api = axios.create({
  // Тепер він бере адресу з налаштувань. 
  // Якщо налаштувань немає - за замовчуванням localhost
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// Автоматично додаємо токен до кожного запиту, якщо він є в localStorage
api.interceptors.request.use((config) => {
  // Перевіряємо, чи ми на клієнті (у браузері), бо на сервері немає localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;