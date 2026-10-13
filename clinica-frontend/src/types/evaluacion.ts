export interface Evaluacion {
  idEvaluacion: number;
  fechaEvaluacion: string;
  resultado: string;
  observaciones: string;
  idPaciente: number;
  pacienteNombre?: string;
  pacienteRut?: string;
  idSigno: number;
  signoNombre?: string;
  idUsuario: number;
  usuarioNombre?: string;
}

export interface CrearEvaluacionReq {
  observaciones: string;
  resultado: string;
  idPaciente: number;
  idSigno: number;
  idUsuario?: number;
}
