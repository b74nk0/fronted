import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { api } from '../services/api';

const AuthContext = createContext();

// Tiempo de inactividad máximo en ms (30 minutos)
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

// Decodifica el payload del JWT sin librería externa
const decodeJwt = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const decoded = decodeJwt(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef(null);
  const inactivityTimer = useRef(null);
  const onSessionExpired = useRef(null);

  // ─── Registrar callback de navegación ────────────────────────────────────────
  const registerSessionExpiredCallback = useCallback((cb) => {
    onSessionExpired.current = cb;
  }, []);

  // ─── Limpiar timer ────────────────────────────────────────────────────────────
  const clearInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  };

  // ─── Cerrar sesión ───────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    clearInactivityTimer();
    try {
      await AsyncStorage.multiRemove(['user', 'token']);
      setUser(null);
      console.log('Sesión cerrada');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }, []);

  // ─── Sesión expirada ─────────────────────────────────────────────────────────
  const expireSession = useCallback(async () => {
    console.log('Sesión expirada');
    await logout();
    if (onSessionExpired.current) {
      onSessionExpired.current();
    }
  }, [logout]);

  // ─── Timer de inactividad ────────────────────────────────────────────────────
  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimer.current = setTimeout(() => {
      expireSession();
    }, INACTIVITY_TIMEOUT);
  }, [expireSession]);

  // ─── AppState — background / foreground ──────────────────────────────────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (
        appState.current === 'active' &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        backgroundTime.current = Date.now();
        clearInactivityTimer();
      }

      if (
        (appState.current === 'background' || appState.current === 'inactive') &&
        nextAppState === 'active'
      ) {
        const elapsed = backgroundTime.current ? Date.now() - backgroundTime.current : 0;
        backgroundTime.current = null;

        if (elapsed > INACTIVITY_TIMEOUT) {
          await expireSession();
        } else {
          const token = await AsyncStorage.getItem('token');
          if (token && isTokenExpired(token)) {
            await expireSession();
          } else if (user) {
            resetInactivityTimer();
          }
        }
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [expireSession, resetInactivityTimer, user]);

  // ─── Cargar sesión al iniciar ─────────────────────────────────────────────────
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');

        if (storedUser && storedToken) {
          if (isTokenExpired(storedToken)) {
            await AsyncStorage.multiRemove(['user', 'token']);
            console.log('Token expirado al iniciar');
          } else {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log('Sesión restaurada:', parsedUser.email);
          }
        }
      } catch (error) {
        console.error('Error cargando sesión:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  // ─── Iniciar timer cuando hay usuario activo ─────────────────────────────────
  useEffect(() => {
    if (user) {
      resetInactivityTimer();
    } else {
      clearInactivityTimer();
    }
    return () => clearInactivityTimer();
  }, [user, resetInactivityTimer]);

  // ─── Interceptor axios — redirigir en 401 ────────────────────────────────────
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await expireSession();
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, [expireSession]);

  // ─── Login ───────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const userData = response.data;
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', userData.token);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    resetInactivityTimer,
    registerSessionExpiredCallback,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};