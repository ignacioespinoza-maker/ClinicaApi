export type UserRole = 'Especialista' | 'Asistente';

export interface AuthUser {
  idUsuario: number;
  nombreUsuario: string;
  rol: UserRole;
  isAdmin?: boolean;
}

export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  Token?: string;
}

export interface CrearUsuarioRequest {
  nombreUsuario: string;
  password: string;
  rol: UserRole;
}
