import { apiClient } from './apiClient';
import type { CategoriaExamen, SignoClinico } from '../types/catalogo';

export const catalogoService = {
  async getCategorias(): Promise<CategoriaExamen[]> {
    const response = await apiClient.get<CategoriaExamen[]>('/api/v1/categorias');
    return response.data;
  },

  async getSignos(): Promise<SignoClinico[]> {
    const response = await apiClient.get<SignoClinico[]>('/api/v1/signos');
    return response.data;
  },
};
