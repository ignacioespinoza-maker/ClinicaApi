import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginView } from '../views/LoginView';
import { AuthProvider } from '../context/AuthContext';
import { authService } from '../services/authService';

describe('LoginView Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renderiza correctamente el formulario de login y elementos de accesibilidad', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /acceso al sistema clínico/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('muestra errores de validación si los campos requeridos se dejan vacíos', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </MemoryRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/el nombre de usuario es obligatorio/i)).toBeInTheDocument();
    expect(await screen.findByText(/la contraseña es obligatoria/i)).toBeInTheDocument();
  });

  it('procesa login exitoso con credenciales válidas y actualiza sesión', async () => {
    const user = userEvent.setup();

    // Mock del authService
    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      user: {
        idUsuario: 1,
        nombreUsuario: 'dr_admin',
        rol: 'Especialista',
      },
      token: 'mock_jwt_token',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'dr_admin');
    await user.type(screen.getByLabelText(/contraseña/i), 'hash_simulado_aqui_123');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        nombreUsuario: 'dr_admin',
        password: 'hash_simulado_aqui_123',
      });
    });
  });

  it('muestra mensaje de alerta accesible (role="alert") cuando el login falla (401)', async () => {
    const user = userEvent.setup();

    vi.spyOn(authService, 'login').mockRejectedValueOnce(
      new Error('Credenciales inválidas. Verifique sus datos.')
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginView />
        </AuthProvider>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/nombre de usuario/i), 'usuario_erroneo');
    await user.type(screen.getByLabelText(/contraseña/i), 'clave_invalida');
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    const errorAlert = await screen.findByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent(/credenciales inválidas/i);
  });
});
