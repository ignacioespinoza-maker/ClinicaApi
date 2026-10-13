import { apiClient } from './apiClient';
import type { Paciente, CrearPacienteReq } from '../types/paciente';

export const pacienteService = {
  async getAll(): Promise<Paciente[]> {
    const response = await apiClient.get<Paciente[]>('/api/v1/pacientes');
    return response.data;
  },

  async create(data: CrearPacienteReq): Promise<Paciente> {
    const response = await apiClient.post<Paciente>('/api/v1/pacientes', data);
    return response.data;
  },
};
