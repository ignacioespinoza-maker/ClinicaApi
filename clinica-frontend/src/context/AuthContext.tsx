import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { AuthUser, LoginRequest } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEspecialista: boolean;
  isAsistente: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Al inicializar la app, verificar si hay un token válido guardado
    try {
      const currentUser = authService.getCurrentUser();
      const currentToken = authService.getToken();
      if (currentUser && currentToken) {
        setUser(currentUser);
        setToken(currentToken);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }

    // Escuchar eventos globales de axios interceptor (401)
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials: LoginRequest) => {
    const { user: loggedUser, token: loggedToken } = await authService.login(credentials);
    setUser(loggedUser);
    setToken(loggedToken);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const isAdmin = !!user && (
    user.isAdmin === true ||
    user.nombreUsuario.toLowerCase() === 'dr_admin' ||
    user.nombreUsuario.toLowerCase() === 'asistente_admin' ||
    user.nombreUsuario.toLowerCase().includes('admin') ||
    user.rol.toLowerCase() === 'admin' ||
    user.rol.toLowerCase() === 'administrador'
  );

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin,
    isEspecialista: user?.rol === 'Especialista',
    isAsistente: user?.rol === 'Asistente',
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
