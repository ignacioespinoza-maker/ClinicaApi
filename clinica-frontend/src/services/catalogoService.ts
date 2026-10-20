import { apiClient } from './apiClient';
import type {
  CategoriaExamen,
  SignoClinico,
  CrearCategoriaRequest,
  CrearSignoRequest,
} from '../types/catalogo';

export const catalogoService = {
  async getCategorias(): Promise<CategoriaExamen[]> {
    const response = await apiClient.get<CategoriaExamen[]>('/api/v1/categorias');
    return response.data;
  },

  async getSignos(): Promise<SignoClinico[]> {
    const response = await apiClient.get<SignoClinico[]>('/api/v1/signos');
    return response.data;
  },

  async createCategoria(data: CrearCategoriaRequest): Promise<CategoriaExamen> {
    const response = await apiClient.post<CategoriaExamen>('/api/v1/categorias', data);
    return response.data;
  },

  async createSigno(data: CrearSignoRequest): Promise<SignoClinico> {
    const response = await apiClient.post<SignoClinico>('/api/v1/signos', data);
    return response.data;
  },
};
