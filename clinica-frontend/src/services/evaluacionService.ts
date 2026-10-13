import { apiClient } from './apiClient';
import type { Evaluacion, CrearEvaluacionReq } from '../types/evaluacion';

export const evaluacionService = {
  async getAll(): Promise<Evaluacion[]> {
    const response = await apiClient.get<Evaluacion[]>('/api/v1/evaluaciones');
    return response.data;
  },

  async getById(id: number): Promise<Evaluacion> {
    const response = await apiClient.get<Evaluacion>(`/api/v1/evaluaciones/${id}`);
    return response.data;
  },

  async create(data: CrearEvaluacionReq): Promise<Evaluacion> {
    const response = await apiClient.post<Evaluacion>('/api/v1/evaluaciones', data);
    return response.data;
  },

  async update(id: number, data: CrearEvaluacionReq): Promise<Evaluacion> {
    const response = await apiClient.put<Evaluacion>(`/api/v1/evaluaciones/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/evaluaciones/${id}`);
  },
};
