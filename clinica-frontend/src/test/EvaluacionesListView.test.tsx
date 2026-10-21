import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { EvaluacionesListView } from '../views/EvaluacionesListView';
import { AuthProvider } from '../context/AuthContext';
import { authService } from '../services/authService';
import { evaluacionService } from '../services/evaluacionService';
import type { Evaluacion } from '../types/evaluacion';

const mockEvaluaciones: Evaluacion[] = [
  {
    idEvaluacion: 1,
    fechaEvaluacion: '2026-08-15T10:30:00',
    resultado: 'Ataxia Positiva',
    observaciones: 'Registro ficticio de demostración.',
    idPaciente: 1,
    pacienteNombre: 'Paciente Demo 001',
    pacienteRut: '00000000-0',
    idSigno: 1,
    signoNombre: 'Prueba de Ataxia',
    idUsuario: 1,
    usuarioNombre: 'dr_admin',
  },
  {
    idEvaluacion: 2,
    fechaEvaluacion: '2026-08-20T15:45:00',
    resultado: 'Signo de Gowers Presente',
    observaciones: 'Registro ficticio de demostración.',
    idPaciente: 2,
    pacienteNombre: 'Paciente Demo 002',
    pacienteRut: '00000001-9',
    idSigno: 2,
    signoNombre: 'Signo de Gowers',
    idUsuario: 1,
    usuarioNombre: 'dr_admin',
  },
];

describe('EvaluacionesListView Component Tests (CRUD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      idUsuario: 1,
      nombreUsuario: 'dr_admin',
      rol: 'Especialista',
    });
    vi.spyOn(authService, 'getToken').mockReturnValue('mock_token');
    vi.spyOn(evaluacionService, 'getAll').mockResolvedValue(mockEvaluaciones);
  });

  it('renderiza la lista de evaluaciones con datos clínicos', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <EvaluacionesListView />
        </AuthProvider>
      </MemoryRouter>
    );

    const demoOneElements = await screen.findAllByText('Paciente Demo 001');
    expect(demoOneElements.length).toBeGreaterThan(0);

    const demoTwoElements = screen.getAllByText('Paciente Demo 002');
    expect(demoTwoElements.length).toBeGreaterThan(0);

    const ataxiaElements = screen.getAllByText('Ataxia Positiva');
    expect(ataxiaElements.length).toBeGreaterThan(0);
  });

  it('permite filtrar registros mediante la barra de búsqueda', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <EvaluacionesListView />
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findAllByText('Paciente Demo 001');

    const searchInput = screen.getByPlaceholderText(/buscar por paciente/i);
    await user.type(searchInput, 'Demo 002');

    expect(screen.getAllByText('Paciente Demo 002').length).toBeGreaterThan(0);
    expect(screen.queryByText('Paciente Demo 001')).not.toBeInTheDocument();
  });

  it('abre el diálogo de confirmación accesible al pulsar eliminar y procesa el borrado', async () => {
    const user = userEvent.setup();
    vi.spyOn(evaluacionService, 'delete').mockResolvedValueOnce();

    render(
      <MemoryRouter>
        <AuthProvider>
          <EvaluacionesListView />
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findAllByText('Paciente Demo 001');

    // Pulsar botón de eliminar de la primera evaluación
    const deleteButtons = screen.getAllByLabelText(/eliminar evaluación #1/i);
    await user.click(deleteButtons[0]);

    // Verificar que el modal accesible con role="alertdialog" está abierto
    const modal = screen.getByRole('alertdialog');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/¿confirmar eliminación de evaluación clínica\?/i)).toBeInTheDocument();

    // Confirmar eliminación
    const confirmBtn = screen.getByRole('button', { name: /sí, eliminar/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(evaluacionService.delete).toHaveBeenCalledWith(1);
    });

    // Notificación de éxito mostrada
    expect(await screen.findByText(/la evaluación #1 fue eliminada exitosamente/i)).toBeInTheDocument();
  });
});
