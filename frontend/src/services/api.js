import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем токен к каждому запросу
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('📤 Запрос к:', config.url);
    console.log('🔑 Токен:', token);

    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log('✅ Заголовок Authorization установлен:', `Token ${token}`);
    } else {
      console.log('❌ Токен не найден');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем обработку ответов
api.interceptors.response.use(
  (response) => {
    console.log('✅ Ответ получен:', response.status);
    return response;
  },
  (error) => {
    console.log('❌ Ошибка ответа:', error.response?.status);
    return Promise.reject(error);
  }
);

export default api;