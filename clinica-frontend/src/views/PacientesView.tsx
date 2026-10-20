import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { pacienteService } from '../services/pacienteService';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { validarRutChileno, formatearRutChileno } from '../utils/rutValidator';
import type { Paciente } from '../types/paciente';
import {
  Users,
  UserPlus,
  Search,
  Calendar,
  Phone,
  FileBadge,
  X,
  Save,
} from 'lucide-react';

const pacienteSchema = z.object({
  rut: z
    .string()
    .min(1, 'El RUT es obligatorio')
    .refine((val) => validarRutChileno(val), {
      message: 'El RUT ingresado no es válido. Verifique el formato y dígito verificador (ej: 12345678-5 o 12.345.678-5).',
    }),
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  apellidos: z
    .string()
    .trim()
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(150, 'Los apellidos no pueden exceder 150 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Los apellidos solo pueden contener letras y espacios'),
  fechaNacimiento: z
    .string()
    .min(1, 'La fecha de nacimiento es obligatoria')
    .refine((val) => {
      const fecha = new Date(val);
      const hoy = new Date();
      return fecha <= hoy;
    }, {
      message: 'La fecha de nacimiento no puede ser una fecha futura',
    }),
  telefono: z
    .string()
    .optional()
    .refine((val) => !val || /^[0-9+-\s]{8,15}$/.test(val.trim()), {
      message: 'El teléfono debe tener un formato válido (ej: +56912345678 o 912345678)',
    }),
});

type PacienteFormData = z.infer<typeof pacienteSchema>;

export const PacientesView: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      rut: '',
      nombre: '',
      apellidos: '',
      fechaNacimiento: '',
      telefono: '',
    },
  });

  const fetchPacientes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await pacienteService.getAll();
      setPacientes(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar pacientes.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const filteredPacientes = pacientes.filter(
    (p) =>
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.rut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: PacienteFormData) => {
    try {
      setIsSubmitting(true);
      const nuevo = await pacienteService.create({
        rut: formatearRutChileno(data.rut),
        nombre: data.nombre.trim(),
        apellidos: data.apellidos.trim(),
        fechaNacimiento: data.fechaNacimiento,
        telefono: data.telefono?.trim() || undefined,
      });

      setFeedback({
        type: 'success',
        message: `Paciente ${nuevo.nombre} ${nuevo.apellidos} registrado exitosamente con RUT ${nuevo.rut}.`,
      });
      setIsRegisterModalOpen(false);
      reset();
      fetchPacientes();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar paciente en la API.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container page-content" id="main-content">
      <section className="page-header" aria-labelledby="pacientes-title">
        <div className="header-titles">
          <h1 id="pacientes-title" className="page-title">
            Gestión de Pacientes
          </h1>
          <p className="page-description">
            Registro y visualización de pacientes habilitados para evaluaciones diagnósticas.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn btn-primary min-touch"
          >
            <UserPlus size={18} aria-hidden="true" />
            <span>Registrar Paciente</span>
          </button>
        </div>
      </section>

      {feedback && (
        <div className="mb-4">
          <FeedbackAlert
            type={feedback.type}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        </div>
      )}

      {error && (
        <div className="mb-4">
          <FeedbackAlert
            type="error"
            title="Error"
            message={error}
            onClose={() => setError(null)}
          />
        </div>
      )}

      {/* Búsqueda */}
      <section className="search-filters-bar" aria-label="Búsqueda de pacientes">
        <div className="search-box">
          <label htmlFor="search-pacientes" className="sr-only">
            Buscar paciente por nombre o RUT
          </label>
          <div className="input-wrapper">
            <Search className="input-icon" aria-hidden="true" size={18} />
            <input
              id="search-pacientes"
              type="search"
              className="form-input has-icon"
              placeholder="Buscar paciente por nombre, apellidos o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingSkeleton rows={4} message="Cargando registro de pacientes..." />
      ) : filteredPacientes.length === 0 ? (
        <div className="empty-state-box" role="status">
          <Users size={48} className="empty-icon text-muted" aria-hidden="true" />
          <h2 className="empty-title">No hay pacientes registrados</h2>
          <p className="empty-desc">
            {searchTerm
              ? 'No hay pacientes que coincidan con el término de búsqueda ingresado.'
              : 'Empiece registrando un nuevo paciente para poder asociarle evaluaciones clínicas.'}
          </p>
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="btn btn-primary min-touch mt-3"
          >
            <UserPlus size={18} aria-hidden="true" />
            <span>Registrar Primer Paciente</span>
          </button>
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="clinical-table" aria-label="Tabla de pacientes clínicos">
            <caption className="sr-only">Listado de pacientes con RUT, nombres, fecha de nacimiento y teléfono</caption>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">RUT</th>
                <th scope="col">Nombre Completo</th>
                <th scope="col">Fecha Nacimiento</th>
                <th scope="col">Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {filteredPacientes.map((p) => (
                <tr key={p.idPaciente}>
                  <td className="font-mono text-muted">#{p.idPaciente}</td>
                  <td>
                    <span className="font-mono font-semibold">{p.rut}</span>
                  </td>
                  <td>
                    <span className="font-semibold">{p.nombre} {p.apellidos}</span>
                  </td>
                  <td>
                    <span className="text-muted">{p.fechaNacimiento}</span>
                  </td>
                  <td>
                    <span className="text-muted">{p.telefono || 'Sin registrar'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal accesible para registrar paciente */}
      {isRegisterModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-patient-title"
            className="modal-box"
          >
            <div className="modal-header">
              <h2 id="modal-patient-title" className="modal-title">
                Registrar Nuevo Paciente
              </h2>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="alert-close-btn min-touch"
                aria-label="Cerrar modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="clinical-form mt-3" noValidate>
              <div className="form-group">
                <label htmlFor="rut" className="form-label">
                  <FileBadge size={16} className="inline-icon text-primary" aria-hidden="true" />
                  <span>RUT *</span>
                </label>
                <input
                  id="rut"
                  type="text"
                  className={`form-input min-touch ${errors.rut ? 'input-error' : ''}`}
                  placeholder="Ej: 11222333-4"
                  aria-required="true"
                  aria-invalid={!!errors.rut}
                  aria-describedby={errors.rut ? 'rut-error' : undefined}
                  {...register('rut')}
                />
                {errors.rut && (
                  <span id="rut-error" className="field-error" role="alert">
                    {errors.rut.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="nombre" className="form-label">
                  <span>Nombre *</span>
                </label>
                <input
                  id="nombre"
                  type="text"
                  className={`form-input min-touch ${errors.nombre ? 'input-error' : ''}`}
                  placeholder="Ej: Carlos"
                  aria-required="true"
                  aria-invalid={!!errors.nombre}
                  aria-describedby={errors.nombre ? 'nombre-error' : undefined}
                  {...register('nombre')}
                />
                {errors.nombre && (
                  <span id="nombre-error" className="field-error" role="alert">
                    {errors.nombre.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="apellidos" className="form-label">
                  <span>Apellidos *</span>
                </label>
                <input
                  id="apellidos"
                  type="text"
                  className={`form-input min-touch ${errors.apellidos ? 'input-error' : ''}`}
                  placeholder="Ej: Méndez Rojas"
                  aria-required="true"
                  aria-invalid={!!errors.apellidos}
                  aria-describedby={errors.apellidos ? 'apellidos-error' : undefined}
                  {...register('apellidos')}
                />
                {errors.apellidos && (
                  <span id="apellidos-error" className="field-error" role="alert">
                    {errors.apellidos.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="fechaNacimiento" className="form-label">
                  <Calendar size={16} className="inline-icon text-muted" aria-hidden="true" />
                  <span>Fecha de Nacimiento *</span>
                </label>
                <input
                  id="fechaNacimiento"
                  type="date"
                  className={`form-input min-touch ${errors.fechaNacimiento ? 'input-error' : ''}`}
                  aria-required="true"
                  aria-invalid={!!errors.fechaNacimiento}
                  aria-describedby={errors.fechaNacimiento ? 'fechaNacimiento-error' : undefined}
                  {...register('fechaNacimiento')}
                />
                {errors.fechaNacimiento && (
                  <span id="fechaNacimiento-error" className="field-error" role="alert">
                    {errors.fechaNacimiento.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="telefono" className="form-label">
                  <Phone size={16} className="inline-icon text-muted" aria-hidden="true" />
                  <span>Teléfono de Contacto (Opcional)</span>
                </label>
                <input
                  id="telefono"
                  type="tel"
                  className="form-input min-touch"
                  placeholder="Ej: +56912345678"
                  {...register('telefono')}
                />
              </div>

              <div className="modal-actions mt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  disabled={isSubmitting}
                  className="btn btn-secondary min-touch"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary min-touch inline-flex-center"
                >
                  <Save size={18} aria-hidden="true" />
                  <span>{isSubmitting ? 'Registrando...' : 'Guardar Paciente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
