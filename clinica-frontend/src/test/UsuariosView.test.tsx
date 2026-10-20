import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { UsuariosView } from '../views/UsuariosView';
import { AuthProvider } from '../context/AuthContext';
import { authService } from '../services/authService';
import type { AuthUser } from '../types/auth';

const mockUsuarios: AuthUser[] = [
  {
    idUsuario: 1,
    nombreUsuario: 'dr_admin',
    rol: 'Especialista',
    isAdmin: true,
  },
  {
    idUsuario: 2,
    nombreUsuario: 'asistente_01',
    rol: 'Asistente',
    isAdmin: false,
  },
  {
    idUsuario: 3,
    nombreUsuario: 'asistente_admin',
    rol: 'Asistente',
    isAdmin: true,
  },
];

describe('UsuariosView Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      idUsuario: 1,
      nombreUsuario: 'dr_admin',
      rol: 'Especialista',
      isAdmin: true,
    });
    vi.spyOn(authService, 'getToken').mockReturnValue('mock_token');
    vi.spyOn(authService, 'getUsuarios').mockResolvedValue(mockUsuarios);
  });

  it('renderiza la lista de usuarios con sus roles y credenciales', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <UsuariosView />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('dr_admin')).toBeInTheDocument();
    expect(screen.getByText('asistente_01')).toBeInTheDocument();
    expect(screen.getByText('asistente_admin')).toBeInTheDocument();
    expect(screen.getByText('Doctor Especialista')).toBeInTheDocument();
    expect(screen.getAllByText('Asistente').length).toBeGreaterThan(0);
    expect(screen.getByText('Sesión Actual')).toBeInTheDocument();
  });

  it('permite a un usuario administrador crear un nuevo usuario Doctor Especialista', async () => {
    const user = userEvent.setup();

    vi.spyOn(authService, 'createUsuario').mockResolvedValueOnce({
      idUsuario: 4,
      nombreUsuario: 'dr_nuevo',
      rol: 'Especialista',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <UsuariosView />
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findByText('dr_admin');

    // Click en Crear Doctor / Asistente
    const btnCrear = screen.getByRole('button', { name: /crear doctor \/ asistente/i });
    await user.click(btnCrear);

    // Completar el formulario
    const inputNombre = screen.getByLabelText(/nombre de usuario/i);
    await user.type(inputNombre, 'dr_nuevo');

    const inputPass = screen.getByLabelText(/contraseña/i);
    await user.type(inputPass, 'Clave1234!');

    const btnSubmit = screen.getByRole('button', { name: /registrar profesional/i });
    await user.click(btnSubmit);

    await waitFor(() => {
      expect(authService.createUsuario).toHaveBeenCalledWith({
        nombreUsuario: 'dr_nuevo',
        password: 'Clave1234!',
        rol: 'Especialista',
      });
    });

    expect(await screen.findByText(/creado correctamente/i)).toBeInTheDocument();
  });

  it('permite eliminar a un usuario mostrando el modal accesible de confirmación', async () => {
    const user = userEvent.setup();

    vi.spyOn(authService, 'deleteUsuario').mockResolvedValueOnce({
      mensaje: "Usuario 'asistente_01' eliminado con éxito.",
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <UsuariosView />
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findByText('asistente_01');

    // Click en el botón de eliminar del usuario asistente_01
    const btnEliminar = screen.getByRole('button', { name: /eliminar usuario asistente_01/i });
    await user.click(btnEliminar);

    // Verificar que el diálogo modal accesible se abre
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('¿Confirmar eliminación de usuario?')).toBeInTheDocument();

    // Confirmar eliminación en el modal
    const btnConfirmar = screen.getByRole('button', { name: /sí, eliminar usuario/i });
    await user.click(btnConfirmar);

    await waitFor(() => {
      expect(authService.deleteUsuario).toHaveBeenCalledWith(2);
    });

    // Verificar mensaje de éxito
    expect(await screen.findByText(/eliminado exitosamente/i)).toBeInTheDocument();
    // Verificar que asistente_01 ya no está en la tabla
    expect(screen.queryByText('asistente_01')).not.toBeInTheDocument();
  });

  it('no permite eliminar la propia cuenta en sesión y muestra badge Sesión Actual', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <UsuariosView />
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findByText('dr_admin');

    // No debe existir botón para eliminar dr_admin
    expect(screen.queryByRole('button', { name: /eliminar usuario dr_admin/i })).not.toBeInTheDocument();
    expect(screen.getByText('Sesión Actual')).toBeInTheDocument();
  });
});
