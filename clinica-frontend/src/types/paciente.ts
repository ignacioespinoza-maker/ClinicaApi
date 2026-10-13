export interface Paciente {
  idPaciente: number;
  rut: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono?: string | null;
}

export interface CrearPacienteReq {
  rut: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono?: string;
}
