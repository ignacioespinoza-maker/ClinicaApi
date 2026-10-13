import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { evaluacionService } from '../services/evaluacionService';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { ConfirmModal } from '../components/ConfirmModal';
import type { Evaluacion } from '../types/evaluacion';
import {
  Search,
  PlusCircle,
  Eye,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  User,
  Stethoscope,
  Lock,
  RefreshCw,
  FileText,
} from 'lucide-react';

export const EvaluacionesListView: React.FC = () => {
  const { isEspecialista } = useAuth();
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterResultado, setFilterResultado] = useState('todos');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modal de Eliminación
  const [modalOpen, setModalOpen] = useState(false);
  const [evaluacionToDelete, setEvaluacionToDelete] = useState<Evaluacion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvaluaciones = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await evaluacionService.getAll();
      setEvaluaciones(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar el listado de evaluaciones.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluaciones();
  }, []);

  // Filtrado de evaluaciones
  const filteredEvaluaciones = useMemo(() => {
    return evaluaciones.filter((item) => {
      const matchesSearch =
        item.resultado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.observaciones.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.pacienteNombre && item.pacienteNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.pacienteRut && item.pacienteRut.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.signoNombre && item.signoNombre.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter =
        filterResultado === 'todos' ||
        item.resultado.toLowerCase() === filterResultado.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [evaluaciones, searchTerm, filterResultado]);

  // Paginación calculada
  const totalPages = Math.ceil(filteredEvaluaciones.length / itemsPerPage) || 1;
  const paginatedEvaluaciones = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvaluaciones.slice(start, start + itemsPerPage);
  }, [filteredEvaluaciones, currentPage, itemsPerPage]);

  const handleDeleteClick = (evaluacion: Evaluacion) => {
    setEvaluacionToDelete(evaluacion);
    setModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!evaluacionToDelete) return;

    try {
      setIsDeleting(true);
      await evaluacionService.delete(evaluacionToDelete.idEvaluacion);
      setFeedback({
        type: 'success',
        message: `La evaluación #${evaluacionToDelete.idEvaluacion} fue eliminada exitosamente.`,
      });
      setModalOpen(false);
      setEvaluacionToDelete(null);
      // Actualizar listado localmente
      setEvaluaciones((prev) => prev.filter((e) => e.idEvaluacion !== evaluacionToDelete.idEvaluacion));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar la evaluación.';
      setFeedback({ type: 'error', message: msg });
      setModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
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
      {/* Encabezado y acciones principales */}
      <section className="page-header" aria-labelledby="eval-list-title">
        <div className="header-titles">
          <h1 id="eval-list-title" className="page-title">
            Evaluaciones Clínicas
          </h1>
          <p className="page-description">
            Gestión y seguimiento de resultados médicos y diagnósticos por signos clínicos.
          </p>
        </div>

        <div className="header-actions">
          {isEspecialista ? (
            <Link to="/evaluaciones/nueva" className="btn btn-primary min-touch">
              <PlusCircle size={18} aria-hidden="true" />
              <span>Nueva Evaluación</span>
            </Link>
          ) : (
            <div className="role-restriction-hint" title="Acción reservada exclusivamente para rol Especialista">
              <span className="badge badge-warning">
                <Lock size={14} aria-hidden="true" /> Rol Asistente (Solo Lectura)
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={fetchEvaluaciones}
            className="btn btn-secondary min-touch"
            aria-label="Recargar lista de evaluaciones"
          >
            <RefreshCw size={18} aria-hidden="true" />
            <span className="hide-mobile">Actualizar</span>
          </button>
        </div>
      </section>

      {/* Alertas de Feedback */}
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
            title="Error al consultar evaluaciones"
            message={error}
            onClose={() => setError(null)}
          />
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <section className="search-filters-bar" aria-label="Búsqueda y filtros de evaluaciones">
        <div className="search-box">
          <label htmlFor="search-input" className="sr-only">
            Buscar evaluación por paciente, RUT o signo
          </label>
          <div className="input-wrapper">
            <Search className="input-icon" aria-hidden="true" size={18} />
            <input
              id="search-input"
              type="search"
              className="form-input has-icon"
              placeholder="Buscar por paciente, RUT, prueba o resultado..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="filter-box">
          <label htmlFor="filter-select" className="sr-only">
            Filtrar por resultado
          </label>
          <div className="input-wrapper">
            <Filter className="input-icon" aria-hidden="true" size={18} />
            <select
              id="filter-select"
              className="form-input has-icon select-input min-touch"
              value={filterResultado}
              onChange={(e) => {
                setFilterResultado(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="todos">Todos los resultados</option>
              <option value="Ataxia Positiva">Ataxia Positiva</option>
              <option value="Signo de Gowers Presente">Signo de Gowers Presente</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>
      </section>

      {/* Estado de Carga */}
      {isLoading ? (
        <LoadingSkeleton rows={5} message="Cargando listado de evaluaciones clínicas..." />
      ) : paginatedEvaluaciones.length === 0 ? (
        /* Estado Vacío */
        <div className="empty-state-box" role="status">
          <FileText size={48} className="empty-icon text-muted" aria-hidden="true" />
          <h2 className="empty-title">No se encontraron evaluaciones</h2>
          <p className="empty-desc">
            {searchTerm || filterResultado !== 'todos'
              ? 'No hay registros que coincidan con los filtros de búsqueda aplicados.'
              : 'Aún no se han registrado evaluaciones clínicas en la base de datos.'}
          </p>
          {isEspecialista && (
            <Link to="/evaluaciones/nueva" className="btn btn-primary min-touch mt-3">
              <PlusCircle size={18} aria-hidden="true" />
              <span>Registrar Primera Evaluación</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Vista Tabla para Pantallas Grandes (>= 768px) */}
          <div className="table-responsive-wrapper hide-mobile">
            <table className="clinical-table" aria-label="Tabla de evaluaciones clínicas">
              <caption className="sr-only">
                Listado de evaluaciones clínicas con paciente, prueba, resultado, fecha y acciones.
              </caption>
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Paciente</th>
                  <th scope="col">Signo Clínico</th>
                  <th scope="col">Resultado</th>
                  <th scope="col">Fecha</th>
                  <th scope="col" className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvaluaciones.map((item) => (
                  <tr key={item.idEvaluacion}>
                    <td className="font-mono text-muted">#{item.idEvaluacion}</td>
                    <td>
                      <div className="table-patient-cell">
                        <span className="patient-name font-semibold">
                          {item.pacienteNombre || 'Paciente registrado'}
                        </span>
                        {item.pacienteRut && (
                          <span className="patient-rut text-muted text-sm">{item.pacienteRut}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="sign-name">{item.signoNombre || 'Examen Clínico'}</span>
                    </td>
                    <td>
                      <span className="result-badge">
                        {item.resultado}
                      </span>
                    </td>
                    <td className="text-sm text-muted">
                      {formatDate(item.fechaEvaluacion)}
                    </td>
                    <td className="text-right">
                      <div className="action-buttons-group">
                        <Link
                          to={`/evaluaciones/${item.idEvaluacion}`}
                          className="btn-icon min-touch"
                          aria-label={`Ver detalle de evaluación #${item.idEvaluacion}`}
                          title="Ver Detalle"
                        >
                          <Eye size={18} aria-hidden="true" />
                        </Link>

                        {isEspecialista && (
                          <>
                            <Link
                              to={`/evaluaciones/${item.idEvaluacion}/editar`}
                              className="btn-icon text-primary min-touch"
                              aria-label={`Editar evaluación #${item.idEvaluacion}`}
                              title="Editar Evaluación"
                            >
                              <Edit2 size={18} aria-hidden="true" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(item)}
                              className="btn-icon text-danger min-touch"
                              aria-label={`Eliminar evaluación #${item.idEvaluacion}`}
                              title="Eliminar Evaluación"
                            >
                              <Trash2 size={18} aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vista de Tarjetas Mobile-First para Pantallas Pequeñas (< 768px) */}
          <div className="cards-grid-mobile show-mobile" role="feed" aria-label="Tarjetas de evaluaciones">
            {paginatedEvaluaciones.map((item) => (
              <article key={item.idEvaluacion} className="clinical-card" aria-labelledby={`card-title-${item.idEvaluacion}`}>
                <div className="card-header-row">
                  <span className="card-id font-mono">#{item.idEvaluacion}</span>
                  <span className="result-badge">{item.resultado}</span>
                </div>

                <h2 id={`card-title-${item.idEvaluacion}`} className="card-patient-title">
                  <User size={16} className="inline-icon text-primary" aria-hidden="true" />
                  <span>{item.pacienteNombre || 'Paciente registrado'}</span>
                </h2>

                <div className="card-meta">
                  {item.pacienteRut && (
                    <p className="card-rut text-sm text-muted">RUT: {item.pacienteRut}</p>
                  )}
                  <p className="card-sign">
                    <Stethoscope size={16} className="inline-icon text-teal" aria-hidden="true" />
                    <span>{item.signoNombre || 'Examen Clínico'}</span>
                  </p>
                  <p className="card-date text-sm text-muted">
                    <Calendar size={14} className="inline-icon" aria-hidden="true" />
                    <span>{formatDate(item.fechaEvaluacion)}</span>
                  </p>
                </div>

                <div className="card-actions-row">
                  <Link
                    to={`/evaluaciones/${item.idEvaluacion}`}
                    className="btn btn-sm btn-secondary min-touch"
                    aria-label={`Ver detalle completo de evaluación #${item.idEvaluacion}`}
                  >
                    <Eye size={16} aria-hidden="true" />
                    <span>Detalle</span>
                  </Link>

                  {isEspecialista && (
                    <>
                      <Link
                        to={`/evaluaciones/${item.idEvaluacion}/editar`}
                        className="btn btn-sm btn-outline-primary min-touch"
                        aria-label={`Editar evaluación #${item.idEvaluacion}`}
                      >
                        <Edit2 size={16} aria-hidden="true" />
                        <span>Editar</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(item)}
                        className="btn btn-sm btn-outline-danger min-touch"
                        aria-label={`Eliminar evaluación #${item.idEvaluacion}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        <span>Eliminar</span>
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Paginación Accesible */}
          {totalPages > 1 && (
            <nav className="pagination-bar" role="navigation" aria-label="Paginación de resultados">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary min-touch"
                aria-label="Página anterior"
              >
                Anterior
              </button>
              <span className="pagination-info" aria-current="page">
                Página {currentPage} de {totalPages} ({filteredEvaluaciones.length} resultados)
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary min-touch"
                aria-label="Página siguiente"
              >
                Siguiente
              </button>
            </nav>
          )}
        </>
      )}

      {/* Modal de Confirmación de Eliminación Accesible */}
      <ConfirmModal
        isOpen={modalOpen}
        title="¿Confirmar eliminación de evaluación clínica?"
        message={`Está a punto de eliminar de forma permanente la evaluación #${evaluacionToDelete?.idEvaluacion} correspondiente al paciente ${evaluacionToDelete?.pacienteNombre || ''}. Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setModalOpen(false);
          setEvaluacionToDelete(null);
        }}
      />
    </main>
  );
};
