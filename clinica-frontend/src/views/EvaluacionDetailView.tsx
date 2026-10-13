import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { evaluacionService } from '../services/evaluacionService';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { ConfirmModal } from '../components/ConfirmModal';
import type { Evaluacion } from '../types/evaluacion';
import {
  ArrowLeft,
  Calendar,
  User,
  Stethoscope,
  FileText,
  UserCheck,
  Edit2,
  Trash2,
} from 'lucide-react';

export const EvaluacionDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isEspecialista } = useAuth();

  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de Eliminación
  const [modalOpen, setModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await evaluacionService.getById(parseInt(id, 10));
        if (isMounted) setEvaluacion(data);
      } catch (err: unknown) {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'No se pudo cargar la evaluación solicitada.';
          setError(msg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!evaluacion) return;
    try {
      setIsDeleting(true);
      await evaluacionService.delete(evaluacion.idEvaluacion);
      navigate('/evaluaciones', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la evaluación.';
      setError(msg);
      setModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="container page-content" id="main-content">
      {/* Botón Volver */}
      <div className="mb-3">
        <Link to="/evaluaciones" className="btn btn-secondary min-touch inline-flex-center">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Volver al Listado</span>
        </Link>
      </div>

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

      {isLoading ? (
        <LoadingSkeleton rows={6} message="Cargando detalles de la evaluación clínica..." />
      ) : !evaluacion ? (
        <div className="empty-state-box" role="status">
          <h2 className="empty-title">Evaluación no encontrada</h2>
          <p className="empty-desc">El registro clínico solicitado no existe o fue removido.</p>
          <Link to="/evaluaciones" className="btn btn-primary min-touch mt-3">
            Regresar a Evaluaciones
          </Link>
        </div>
      ) : (
        <article className="detail-card" aria-labelledby="eval-detail-title">
          <header className="detail-header">
            <div className="detail-title-group">
              <span className="badge badge-info">Evaluación Médica #{evaluacion.idEvaluacion}</span>
              <h1 id="eval-detail-title" className="detail-main-title">
                {evaluacion.signoNombre || 'Examen Clínico'}
              </h1>
              <p className="detail-date text-muted">
                <Calendar size={16} className="inline-icon" aria-hidden="true" />
                <span>Registrado el {formatDate(evaluacion.fechaEvaluacion)}</span>
              </p>
            </div>

            {/* Acciones de gestión */}
            {isEspecialista && (
              <div className="detail-actions">
                <Link
                  to={`/evaluaciones/${evaluacion.idEvaluacion}/editar`}
                  className="btn btn-primary min-touch"
                >
                  <Edit2 size={16} aria-hidden="true" />
                  <span>Editar</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="btn btn-danger min-touch"
                >
                  <Trash2 size={16} aria-hidden="true" />
                  <span>Eliminar</span>
                </button>
              </div>
            )}
          </header>

          <hr className="divider" />

          {/* Cuadrícula de Información Detallada */}
          <div className="detail-grid">
            {/* Sección Paciente */}
            <section className="detail-section-box" aria-labelledby="patient-info-title">
              <h2 id="patient-info-title" className="detail-section-title">
                <User size={18} className="text-primary inline-icon" aria-hidden="true" />
                <span>Información del Paciente</span>
              </h2>
              <div className="detail-info-row">
                <span className="info-label">Nombre Completo:</span>
                <span className="info-value font-semibold">
                  {evaluacion.pacienteNombre || 'Paciente registrado'}
                </span>
              </div>
              <div className="detail-info-row">
                <span className="info-label">RUT:</span>
                <span className="info-value font-mono">
                  {evaluacion.pacienteRut || 'No especificado'}
                </span>
              </div>
            </section>

            {/* Sección Prueba y Profesional */}
            <section className="detail-section-box" aria-labelledby="test-info-title">
              <h2 id="test-info-title" className="detail-section-title">
                <Stethoscope size={18} className="text-teal inline-icon" aria-hidden="true" />
                <span>Prueba y Evaluador</span>
              </h2>
              <div className="detail-info-row">
                <span className="info-label">Prueba Clínica:</span>
                <span className="info-value">{evaluacion.signoNombre || 'Signo clínico'}</span>
              </div>
              <div className="detail-info-row">
                <span className="info-label">Evaluador:</span>
                <span className="info-value flex-align">
                  <UserCheck size={16} className="inline-icon text-muted" aria-hidden="true" />
                  {evaluacion.usuarioNombre || 'dr_admin'}
                </span>
              </div>
            </section>
          </div>

          {/* Resultado y Diagnóstico */}
          <section className="detail-section-full" aria-labelledby="result-info-title">
            <h2 id="result-info-title" className="detail-section-title">
              <FileText size={18} className="text-indigo inline-icon" aria-hidden="true" />
              <span>Resultado Clínico Obtenido</span>
            </h2>
            <div className="result-highlight-box">
              <span className="result-badge-large">
                {evaluacion.resultado}
              </span>
            </div>

            <h3 className="card-subtitle mt-3">Observaciones Clínicas Detalladas:</h3>
            <div className="observations-box">
              <p>{evaluacion.observaciones}</p>
            </div>
          </section>
        </article>
      )}

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={modalOpen}
        title="¿Eliminar esta evaluación clínica?"
        message={`¿Está seguro de eliminar definitivamente la evaluación #${evaluacion?.idEvaluacion}? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar Registro"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setModalOpen(false)}
      />
    </main>
  );
};
