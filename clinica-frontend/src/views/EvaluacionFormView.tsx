import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { evaluacionService } from '../services/evaluacionService';
import { pacienteService } from '../services/pacienteService';
import { catalogoService } from '../services/catalogoService';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import type { Paciente } from '../types/paciente';
import type { SignoClinico } from '../types/catalogo';
import {
  ArrowLeft,
  Save,
  User,
  Stethoscope,
  FileCheck,
  FileText,
} from 'lucide-react';

// Esquema de validación en cliente con Zod
const evaluacionSchema = z.object({
  idPaciente: z.coerce
    .number({ invalid_type_error: 'Debe seleccionar un paciente' })
    .positive('Debe seleccionar un paciente válido'),
  idSigno: z.coerce
    .number({ invalid_type_error: 'Debe seleccionar una prueba o signo clínico' })
    .positive('Debe seleccionar un signo clínico válido'),
  resultado: z
    .string()
    .min(3, 'El resultado debe tener al menos 3 caracteres')
    .max(100, 'El resultado no puede exceder 100 caracteres'),
  observaciones: z
    .string()
    .min(5, 'Las observaciones deben contener al menos 5 caracteres')
    .max(2000, 'Las observaciones no pueden exceder 2000 caracteres'),
});

type EvaluacionFormData = z.infer<typeof evaluacionSchema>;

export const EvaluacionFormView: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [signos, setSignos] = useState<SignoClinico[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EvaluacionFormData>({
    resolver: zodResolver(evaluacionSchema),
    defaultValues: {
      idPaciente: 0,
      idSigno: 0,
      resultado: '',
      observaciones: '',
    },
  });

  // Carga de catálogos y datos iniciales si es edición
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setIsLoadingCatalogs(true);
        setApiError(null);

        const [pacs, signs] = await Promise.all([
          pacienteService.getAll(),
          catalogoService.getSignos(),
        ]);

        if (!isMounted) return;
        setPacientes(pacs);
        setSignos(signs);

        if (isEditMode && id) {
          const evalData = await evaluacionService.getById(parseInt(id, 10));
          if (isMounted) {
            reset({
              idPaciente: evalData.idPaciente,
              idSigno: evalData.idSigno,
              resultado: evalData.resultado,
              observaciones: evalData.observaciones,
            });
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Error al cargar los catálogos o la evaluación.';
          setApiError(msg);
        }
      } finally {
        if (isMounted) setIsLoadingCatalogs(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: EvaluacionFormData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      if (isEditMode && id) {
        await evaluacionService.update(parseInt(id, 10), data);
      } else {
        await evaluacionService.create(data);
      }

      navigate('/evaluaciones', { replace: true });
    } catch (err: unknown) {
      // Captura y presentación de errores de validación devueltos por la API (400 o 422)
      const msg = err instanceof Error ? err.message : 'Error al guardar la evaluación médica.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container page-content" id="main-content">
      <div className="mb-3">
        <Link to="/evaluaciones" className="btn btn-secondary min-touch inline-flex-center">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Volver al Listado</span>
        </Link>
      </div>

      <header className="page-header" aria-labelledby="form-title">
        <div className="header-titles">
          <h1 id="form-title" className="page-title">
            {isEditMode ? `Editar Evaluación #${id}` : 'Registrar Nueva Evaluación Clínica'}
          </h1>
          <p className="page-description">
            Complete los campos médicos para asentar el registro en la ficha del paciente.
          </p>
        </div>
      </header>

      {apiError && (
        <div className="mb-4">
          <FeedbackAlert
            type="error"
            title="Error al procesar la evaluación"
            message={apiError}
            onClose={() => setApiError(null)}
          />
        </div>
      )}

      {isLoadingCatalogs ? (
        <LoadingSkeleton rows={5} message="Cargando formulario y catálogos clínicos..." />
      ) : (
        <div className="form-card">
          <form onSubmit={handleSubmit(onSubmit)} className="clinical-form" noValidate>
            {/* Selector de Paciente (Recurso Relacionado) */}
            <div className="form-group">
              <label htmlFor="idPaciente" className="form-label">
                <User size={16} className="inline-icon text-primary" aria-hidden="true" />
                <span>Paciente *</span>
              </label>
              <select
                id="idPaciente"
                className={`form-input select-input min-touch ${errors.idPaciente ? 'input-error' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.idPaciente}
                aria-describedby={errors.idPaciente ? 'idPaciente-error' : 'idPaciente-desc'}
                {...register('idPaciente')}
              >
                <option value="0">-- Seleccione un paciente --</option>
                {pacientes.map((p) => (
                  <option key={p.idPaciente} value={p.idPaciente}>
                    {p.nombre} {p.apellidos} (RUT: {p.rut})
                  </option>
                ))}
              </select>
              <span id="idPaciente-desc" className="field-hint">
                Seleccione el paciente al que corresponde esta prueba diagnóstica.
              </span>
              {errors.idPaciente && (
                <span id="idPaciente-error" className="field-error" role="alert">
                  {errors.idPaciente.message}
                </span>
              )}
            </div>

            {/* Selector de Signo Clínico (Catálogo Relacionado) */}
            <div className="form-group">
              <label htmlFor="idSigno" className="form-label">
                <Stethoscope size={16} className="inline-icon text-teal" aria-hidden="true" />
                <span>Prueba / Signo Clínico *</span>
              </label>
              <select
                id="idSigno"
                className={`form-input select-input min-touch ${errors.idSigno ? 'input-error' : ''}`}
                aria-required="true"
                aria-invalid={!!errors.idSigno}
                aria-describedby={errors.idSigno ? 'idSigno-error' : 'idSigno-desc'}
                {...register('idSigno')}
              >
                <option value="0">-- Seleccione una prueba médica --</option>
                {signos.map((s) => (
                  <option key={s.idSigno} value={s.idSigno}>
                    {s.nombre} {s.categoria ? `[${s.categoria}]` : ''}
                  </option>
                ))}
              </select>
              <span id="idSigno-desc" className="field-hint">
                Indique la evaluación física o prueba neurológica realizada.
              </span>
              {errors.idSigno && (
                <span id="idSigno-error" className="field-error" role="alert">
                  {errors.idSigno.message}
                </span>
              )}
            </div>

            {/* Campo Resultado */}
            <div className="form-group">
              <label htmlFor="resultado" className="form-label">
                <FileCheck size={16} className="inline-icon text-indigo" aria-hidden="true" />
                <span>Resultado Obtenido *</span>
              </label>
              <input
                id="resultado"
                type="text"
                list="resultado-sugerencias"
                className={`form-input min-touch ${errors.resultado ? 'input-error' : ''}`}
                placeholder="Ej: Ataxia Positiva, Signo de Gowers Presente, Normal..."
                aria-required="true"
                aria-invalid={!!errors.resultado}
                aria-describedby={errors.resultado ? 'resultado-error' : 'resultado-desc'}
                {...register('resultado')}
              />
              <datalist id="resultado-sugerencias">
                <option value="Ataxia Positiva" />
                <option value="Signo de Gowers Presente" />
                <option value="Coordinación Normal" />
                <option value="Requiere Seguimiento Kinesiológico" />
                <option value="Negativo" />
              </datalist>
              <span id="resultado-desc" className="field-hint">
                Diagnóstico sintetizado o respuesta de la prueba.
              </span>
              {errors.resultado && (
                <span id="resultado-error" className="field-error" role="alert">
                  {errors.resultado.message}
                </span>
              )}
            </div>

            {/* Campo Observaciones */}
            <div className="form-group">
              <label htmlFor="observaciones" className="form-label">
                <FileText size={16} className="inline-icon text-muted" aria-hidden="true" />
                <span>Observaciones Clínicas y Hallazgos *</span>
              </label>
              <textarea
                id="observaciones"
                rows={5}
                className={`form-input textarea-input ${errors.observaciones ? 'input-error' : ''}`}
                placeholder="Describa el comportamiento motor, respuesta reflejo o sintomatología observada durante el examen..."
                aria-required="true"
                aria-invalid={!!errors.observaciones}
                aria-describedby={errors.observaciones ? 'observaciones-error' : undefined}
                {...register('observaciones')}
              />
              {errors.observaciones && (
                <span id="observaciones-error" className="field-error" role="alert">
                  {errors.observaciones.message}
                </span>
              )}
            </div>

            {/* Botones de Envío */}
            <div className="form-actions-row">
              <Link to="/evaluaciones" className="btn btn-secondary min-touch">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary min-touch inline-flex-center"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <Save size={18} aria-hidden="true" />
                    <span>{isEditMode ? 'Actualizar Evaluación' : 'Guardar Evaluación'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};
