import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Para desarrollo local
const getBaseURL = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8080/api';
  }
  return 'http://192.168.1.100:8080/api'; // Cambia por tu IP
};

const API_URL = getBaseURL();

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar el token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('📤 Request to:', config.url);
      console.log('🔑 Token:', token.substring(0, 20) + '...');
    } else {
      console.warn('⚠️ No token found for request:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response from:', response.config.url, '- Status:', response.status);
    return response;
  },
  async (error) => {
    console.error('❌ Request failed:', error.config?.url);
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;