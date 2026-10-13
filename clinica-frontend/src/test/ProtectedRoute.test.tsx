import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';
import { authService } from '../services/authService';

describe('ProtectedRoute Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('redirige a /login cuando el usuario no está autenticado', () => {
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(null);
    vi.spyOn(authService, 'getToken').mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/privado']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<div>Vista de Login</div>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/privado" element={<div>Contenido Protegido</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Vista de Login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Protegido')).not.toBeInTheDocument();
  });

  it('redirige a /acceso-denegado (403) si el rol es Asistente e intenta acceder a ruta de Especialista', () => {
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      idUsuario: 2,
      nombreUsuario: 'asistente_01',
      rol: 'Asistente',
    });
    vi.spyOn(authService, 'getToken').mockReturnValue('mock_token');

    render(
      <MemoryRouter initialEntries={['/evaluaciones/nueva']}>
        <AuthProvider>
          <Routes>
            <Route path="/acceso-denegado" element={<div>Página 403 Acceso Denegado</div>} />
            <Route element={<ProtectedRoute allowedRoles={['Especialista']} />}>
              <Route path="/evaluaciones/nueva" element={<div>Formulario Especialista</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Página 403 Acceso Denegado')).toBeInTheDocument();
    expect(screen.queryByText('Formulario Especialista')).not.toBeInTheDocument();
  });

  it('permite el acceso si el rol es Especialista y coincide con allowedRoles', () => {
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      idUsuario: 1,
      nombreUsuario: 'dr_admin',
      rol: 'Especialista',
    });
    vi.spyOn(authService, 'getToken').mockReturnValue('mock_token');

    render(
      <MemoryRouter initialEntries={['/evaluaciones/nueva']}>
        <AuthProvider>
          <Routes>
            <Route path="/acceso-denegado" element={<div>Página 403 Acceso Denegado</div>} />
            <Route element={<ProtectedRoute allowedRoles={['Especialista']} />}>
              <Route path="/evaluaciones/nueva" element={<div>Formulario Especialista</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Formulario Especialista')).toBeInTheDocument();
    expect(screen.queryByText('Página 403 Acceso Denegado')).not.toBeInTheDocument();
  });
});
