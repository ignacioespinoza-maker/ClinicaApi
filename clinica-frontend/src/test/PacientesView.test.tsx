import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PacientesView } from '../views/PacientesView';
import { AuthProvider } from '../context/AuthContext';
import { authService } from '../services/authService';
import { pacienteService } from '../services/pacienteService';
import type { Paciente } from '../types/paciente';

const mockPacientes: Paciente[] = [
  {
    idPaciente: 1,
    rut: '00000000-0',
    nombre: 'Paciente',
    apellidos: 'Demo 001',
    fechaNacimiento: '1990-01-01',
  },
];

describe('PacientesView Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      idUsuario: 1,
      nombreUsuario: 'dr_admin',
      rol: 'Especialista',
    });
    vi.spyOn(authService, 'getToken').mockReturnValue('mock_token');
    vi.spyOn(pacienteService, 'getAll').mockResolvedValue(mockPacientes);
  });

  it('renderiza la lista de pacientes registrados', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <PacientesView />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Paciente Demo 001')).toBeInTheDocument();
    expect(screen.getByText('00000000-0')).toBeInTheDocument();
  });

  it('muestra mensaje de error si se ingresa un RUT con dígito verificador inválido', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <PacientesView />
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findByText('Paciente Demo 001');

    // Abrir modal
    const btnNuevo = screen.getByRole('button', { name: /registrar paciente/i });
    await user.click(btnNuevo);

    // Escribir RUT inválido (DV erróneo)
    const inputRut = screen.getByLabelText(/^rut \*/i);
    await user.type(inputRut, '12345678-9');

    const inputNombre = screen.getByLabelText(/^nombre \*/i);
    await user.type(inputNombre, 'Juan');

    const inputApellidos = screen.getByLabelText(/^apellidos \*/i);
    await user.type(inputApellidos, 'Pérez');

    const inputFecha = screen.getByLabelText(/^fecha de nacimiento \*/i);
    await user.type(inputFecha, '1990-01-01');

    // Intentar guardar
    const btnGuardar = screen.getByRole('button', { name: /guardar paciente/i });
    await user.click(btnGuardar);

    // Esperar mensaje de error de RUT
    expect(await screen.findByText(/el rut ingresado no es válido/i)).toBeInTheDocument();
  });

  it('permite registrar paciente exitosamente cuando el RUT es válido', async () => {
    const user = userEvent.setup();

    vi.spyOn(pacienteService, 'create').mockResolvedValueOnce({
      idPaciente: 2,
      rut: '12345678-5',
      nombre: 'María',
      apellidos: 'Gómez',
      fechaNacimiento: '1992-06-15',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <PacientesView />
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findByText('Paciente Demo 001');

    // Abrir modal
    const btnNuevo = screen.getByRole('button', { name: /registrar paciente/i });
    await user.click(btnNuevo);

    // Escribir datos con RUT chileno válido
    await user.type(screen.getByLabelText(/^rut \*/i), '12345678-5');
    await user.type(screen.getByLabelText(/^nombre \*/i), 'María');
    await user.type(screen.getByLabelText(/^apellidos \*/i), 'Gómez');
    await user.type(screen.getByLabelText(/^fecha de nacimiento \*/i), '1992-06-15');

    const btnGuardar = screen.getByRole('button', { name: /guardar paciente/i });
    await user.click(btnGuardar);

    await waitFor(() => {
      expect(pacienteService.create).toHaveBeenCalledWith({
        rut: '12345678-5',
        nombre: 'María',
        apellidos: 'Gómez',
        fechaNacimiento: '1992-06-15',
        telefono: undefined,
      });
    });

    expect(await screen.findByText(/registrado exitosamente/i)).toBeInTheDocument();
  });
});
