import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '../types/api';

const TOKEN_KEY = 'clinica_auth_jwt';

export const getStoredToken = (): string | null => {
  return sessionStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  sessionStorage.setItem(TOKEN_KEY, token);
};

export const removeStoredToken = (): void => {
  sessionStorage.removeItem(TOKEN_KEY);
};

// URL base tomada de variables de entorno (VITE_API_URL)
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5103';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Petición: Inyección centralizada de cabecera Authorization: Bearer <token>
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuesta: Normalización de errores y manejo de expiración (401), rol insuficiente (403), y rate limit (429)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        // Token expirado o inválido: limpiamos estado y redirigimos a login
        removeStoredToken();
        if (window.location.pathname !== '/login') {
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
      }

      if (status === 403) {
        // Acceso denegado por rol insuficiente
        window.dispatchEvent(new CustomEvent('auth:forbidden'));
      }

      // Normalizar mensaje de error para consumo uniforme en formularios y vistas
      let message = 'Ocurrió un error en la solicitud.';
      if (typeof data === 'string') {
        message = data;
      } else if (data?.error || data?.Error) {
        message = data.error || data.Error || message;
      } else if (data?.detail) {
        message = data.detail;
      } else if (data?.title) {
        message = data.title;
      } else if (data?.errors) {
        // Errores de validación devueltos por ASP.NET ProblemDetails
        const validationMessages = Object.values(data.errors).flat();
        if (validationMessages.length > 0) {
          message = validationMessages.join(' | ');
        }
      } else if (status === 429) {
        message = 'Ha superado el límite de intentos (Rate Limit). Por favor espere un momento antes de volver a intentar.';
      }

      return Promise.reject(new Error(message));
    } else if (error.request) {
      return Promise.reject(new Error('No se pudo conectar con el servidor clínico. Verifique que la API esté en ejecución.'));
    }

    return Promise.reject(error);
  }
);
