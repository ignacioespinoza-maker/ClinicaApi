import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CatalogosView } from '../views/CatalogosView';
import { AuthProvider } from '../context/AuthContext';
import { authService } from '../services/authService';
import { catalogoService } from '../services/catalogoService';
import type { CategoriaExamen, SignoClinico } from '../types/catalogo';

const mockCategorias: CategoriaExamen[] = [
  {
    idCategoria: 1,
    nombre: 'Ciencias Neurológicas',
    descripcion: 'Evaluaciones del sistema nervioso',
  },
  {
    idCategoria: 2,
    nombre: 'Kinesiología Física',
    descripcion: 'Evaluaciones de movilidad muscular',
  },
];

const mockSignos: SignoClinico[] = [
  {
    idSigno: 1,
    nombre: 'Prueba de Ataxia',
    descripcion: 'Pérdida de coordinación muscular',
    idCategoria: 1,
    categoria: 'Ciencias Neurológicas',
  },
  {
    idSigno: 2,
    nombre: 'Signo de Gowers',
    descripcion: 'Debilidad muscular proximal',
    idCategoria: 2,
    categoria: 'Kinesiología Física',
  },
];

describe('CatalogosView Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
      idUsuario: 2,
      nombreUsuario: 'asistente_01',
      rol: 'Asistente',
    });
    vi.spyOn(authService, 'getToken').mockReturnValue('mock_token');
    vi.spyOn(catalogoService, 'getCategorias').mockResolvedValue(mockCategorias);
    vi.spyOn(catalogoService, 'getSignos').mockResolvedValue(mockSignos);
  });

  it('renderiza la lista de categorías y permite cambiar a la pestaña de signos clínicos', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AuthProvider>
          <CatalogosView />
        </AuthProvider>
      </MemoryRouter>
    );

    // Esperar a que se carguen las categorías
    expect(await screen.findByText('Ciencias Neurológicas')).toBeInTheDocument();
    expect(screen.getByText('Kinesiología Física')).toBeInTheDocument();

    // Cambiar a la pestaña de signos
    const tabSignos = screen.getByRole('tab', { name: /signos clínicos/i });
    await user.click(tabSignos);

    expect(await screen.findByText('Prueba de Ataxia')).toBeInTheDocument();
    expect(screen.getByText('Signo de Gowers')).toBeInTheDocument();
  });

  it('permite abrir el modal y registrar una nueva categoría', async () => {
    const user = userEvent.setup();

    vi.spyOn(catalogoService, 'createCategoria').mockResolvedValueOnce({
      idCategoria: 3,
      nombre: 'Cardiología Clínica',
      descripcion: 'Pruebas cardíacas',
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <CatalogosView />
        </AuthProvider>
      </MemoryRouter>
    );

    await screen.findByText('Ciencias Neurológicas');

    // Click en Nueva Categoría
    const btnNueva = screen.getByRole('button', { name: /nueva categoría/i });
    await user.click(btnNueva);

    // Completar el formulario
    const inputNombre = screen.getByLabelText(/nombre de la categoría/i);
    await user.type(inputNombre, 'Cardiología Clínica');

    const btnGuardar = screen.getByRole('button', { name: /crear categoría/i });
    await user.click(btnGuardar);

    await waitFor(() => {
      expect(catalogoService.createCategoria).toHaveBeenCalledWith({
        nombre: 'Cardiología Clínica',
        descripcion: null,
      });
    });

    expect(await screen.findByText(/registrada exitosamente/i)).toBeInTheDocument();
  });
});

