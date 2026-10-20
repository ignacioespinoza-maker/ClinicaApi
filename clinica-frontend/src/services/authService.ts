import { apiClient, getStoredToken, setStoredToken, removeStoredToken } from './apiClient';
import type { AuthUser, LoginRequest, LoginResponse, UserRole, CrearUsuarioRequest } from '../types/auth';

interface JwtPayload {
  nameid?: string;
  sub?: string;
  unique_name?: string;
  name?: string;
  role?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
  IsAdmin?: string;
  exp?: number;
}

export function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export const authService = {
  async login(credentials: LoginRequest): Promise<{ user: AuthUser; token: string }> {
    const response = await apiClient.post<LoginResponse>('/api/v1/usuarios/login', credentials);
    const token = response.data.token || response.data.Token || '';

    if (!token) {
      throw new Error('La respuesta de la API no contiene un token válido.');
    }

    setStoredToken(token);
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('El token recibido no tiene el formato o claims esperados.');
    }

    return { user, token };
  },

  logout(): void {
    removeStoredToken();
  },

  getCurrentUser(): AuthUser | null {
    const token = getStoredToken();
    if (!token) return null;

    const payload = parseJwt(token);
    if (!payload) {
      removeStoredToken();
      return null;
    }

    // Comprobar expiración del token (exp en segundos)
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      removeStoredToken();
      return null;
    }

    const idUsuario = parseInt(payload.nameid || payload.sub || '0', 10);
    const nombreUsuario = payload.unique_name || payload.name || 'Usuario';
    const roleClaim = payload.role || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    const rol: UserRole = roleClaim === 'Especialista' ? 'Especialista' : 'Asistente';

    const isAdminClaim =
      payload.IsAdmin === 'true' ||
      nombreUsuario.toLowerCase() === 'dr_admin' ||
      nombreUsuario.toLowerCase() === 'asistente_admin' ||
      nombreUsuario.toLowerCase().includes('admin');

    return {
      idUsuario,
      nombreUsuario,
      rol,
      isAdmin: isAdminClaim,
    };
  },

  getToken(): string | null {
    return getStoredToken();
  },

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  },

  // Registro público para crear nuevo Asistente o Doctor
  async registro(data: CrearUsuarioRequest): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/api/v1/usuarios/registro', data);
    return response.data;
  },

  // Obtener lista de usuarios (Doctor / Asistente con credencial Admin)
  async getUsuarios(): Promise<AuthUser[]> {
    const response = await apiClient.get<AuthUser[]>('/api/v1/usuarios');
    return response.data;
  },

  // Creación de usuario por parte de usuario con credencial Admin
  async createUsuario(data: CrearUsuarioRequest): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/api/v1/usuarios', data);
    return response.data;
  },

  // Eliminación de usuario por parte de usuario con credencial Admin
  async deleteUsuario(id: number): Promise<{ mensaje: string }> {
    const response = await apiClient.delete<{ mensaje: string }>(`/api/v1/usuarios/${id}`);
    return response.data;
  },
};
