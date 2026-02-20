import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Логирование для отладки
    if (config.url?.includes('/orders') && config.method === 'post') {
      console.log('🌐 Axios Interceptor: Отправка запроса', {
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      // Не редиректим, если это запрос на логин/регистрацию — 
      // пусть ошибка отобразится пользователю на странице
      const isAuthRequest = url.includes('/auth/login') || url.includes('/auth/register');
      
      if (!isAuthRequest) {
        // Токен истёк — очищаем и редиректим на логин
        localStorage.removeItem('token');
        // Не перезагружаем, если уже на странице логина
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

