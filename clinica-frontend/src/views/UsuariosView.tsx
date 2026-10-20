import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { ConfirmModal } from '../components/ConfirmModal';
import type { AuthUser, UserRole } from '../types/auth';
import {
  UserCheck,
  UserPlus,
  Search,
  X,
  Save,
  Lock,
  User,
  Trash2,
  ShieldCheck,
  Shield,
} from 'lucide-react';

const usuarioSchema = z.object({
  nombreUsuario: z
    .string()
    .trim()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede superar 50 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'El usuario solo puede contener letras, números, puntos, guiones y guiones bajos'),
  password: z
    .string()
    .min(4, 'La contraseña debe tener al menos 4 caracteres'),
  rol: z.enum(['Especialista', 'Asistente']),
});

type UsuarioFormData = z.infer<typeof usuarioSchema>;

export const UsuariosView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de confirmación para eliminar usuario
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nombreUsuario: '',
      password: '',
      rol: 'Especialista',
    },
  });

  const fetchUsuarios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await authService.getUsuarios();
      setUsuarios(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los usuarios.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (data: UsuarioFormData) => {
    try {
      setIsSubmitting(true);
      const nuevo = await authService.createUsuario({
        nombreUsuario: data.nombreUsuario.trim(),
        password: data.password,
        rol: data.rol as UserRole,
      });

      setUsuarios((prev) => [...prev, nuevo]);
      setFeedback({
        type: 'success',
        message: `Usuario ${nuevo.rol === 'Especialista' ? 'Doctor' : 'Asistente'} "${nuevo.nombreUsuario}" creado correctamente.`,
      });
      reset();
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || (err instanceof Error ? err.message : 'Error al registrar el usuario.');
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (u: AuthUser) => {
    setUserToDelete(u);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await authService.deleteUsuario(userToDelete.idUsuario);
      setUsuarios((prev) => prev.filter((u) => u.idUsuario !== userToDelete.idUsuario));
      setFeedback({
        type: 'success',
        message: `Usuario "${userToDelete.nombreUsuario}" eliminado exitosamente del sistema.`,
      });
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Error al eliminar el usuario.');
      setFeedback({ type: 'error', message: msg });
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const checkIsAdmin = (u: AuthUser): boolean => {
    return (
      u.isAdmin === true ||
      u.nombreUsuario.toLowerCase() === 'dr_admin' ||
      u.nombreUsuario.toLowerCase() === 'asistente_admin' ||
      u.nombreUsuario.toLowerCase().includes('admin')
    );
  };

  return (
    <main className="container page-content" id="main-content">
      {/* Encabezado */}
      <section className="page-header" aria-labelledby="usuarios-title">
        <div>
          <h1 id="usuarios-title" className="page-heading">
            Gestión de Usuarios (Doctores y Asistentes)
          </h1>
          <p className="page-subtext">
            Panel exclusivo para usuarios con credencial de Administrador (Doctor Admin y Asistente Admin) para crear y eliminar Doctores y Asistentes en la plataforma.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary min-touch"
            onClick={() => {
              setFeedback(null);
              reset();
              setIsModalOpen(true);
            }}
          >
            <UserPlus size={18} aria-hidden="true" />
            <span>Crear Doctor / Asistente</span>
          </button>
        </div>
      </section>

      {/* Alertas */}
      {feedback && (
        <FeedbackAlert
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}
      {error && <FeedbackAlert type="error" message={error} onClose={() => setError(null)} />}

      {/* Barra de Filtro */}
      <div className="filter-card">
        <div className="search-bar">
          <Search size={18} className="search-icon" aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por nombre de usuario o rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            aria-label="Buscar usuarios"
          />
          {searchTerm && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchTerm('')}
              aria-label="Limpiar búsqueda"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={3} message="Cargando usuarios registrados..." />
      ) : filteredUsuarios.length === 0 ? (
        <div className="empty-state">
          <UserCheck size={48} className="empty-icon" aria-hidden="true" />
          <h2>No se encontraron usuarios</h2>
          <p>No existen profesionales que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table" aria-label="Listado de usuarios clínicos">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Nombre de Usuario</th>
                <th scope="col">Rol Clínico</th>
                <th scope="col">Credencial</th>
                <th scope="col">Permisos del Sistema</th>
                <th scope="col" style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map((u) => {
                const esAdmin = checkIsAdmin(u);
                const esMismoUsuario =
                  u.idUsuario === currentUser?.idUsuario ||
                  u.nombreUsuario.toLowerCase() === currentUser?.nombreUsuario.toLowerCase();

                return (
                  <tr key={u.idUsuario}>
                    <td>
                      <span className="badge badge-outline">#{u.idUsuario}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={16} className="text-muted" aria-hidden="true" />
                        <strong>{u.nombreUsuario}</strong>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge role-${u.rol.toLowerCase()}`}>
                        {u.rol === 'Especialista' ? 'Doctor Especialista' : 'Asistente'}
                      </span>
                    </td>
                    <td>
                      {esAdmin ? (
                        <span className="badge badge-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={14} aria-hidden="true" />
                          <span>Admin</span>
                        </span>
                      ) : (
                        <span className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Shield size={14} aria-hidden="true" />
                          <span>Estándar</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {esAdmin ? (
                        <span className="badge badge-blue">
                          Gestión Usuarios (Crear / Eliminar) + {u.rol === 'Especialista' ? 'Evaluaciones (CRUD) + Pacientes + Catálogos' : 'Pacientes + Catálogos'}
                        </span>
                      ) : u.rol === 'Especialista' ? (
                        <span className="badge badge-outline">
                          Evaluaciones (CRUD) + Pacientes + Catálogos
                        </span>
                      ) : (
                        <span className="badge badge-outline">
                          Lectura de Evaluaciones + Pacientes + Catálogos
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {esMismoUsuario ? (
                        <span className="badge badge-outline" title="Tu cuenta actualmente activa en sesión">
                          Sesión Actual
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger min-touch"
                          onClick={() => handleOpenDelete(u)}
                          aria-label={`Eliminar usuario ${u.nombreUsuario}`}
                          title={`Eliminar usuario ${u.nombreUsuario}`}
                        >
                          <Trash2 size={16} aria-hidden="true" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: CREAR DOCTOR / ASISTENTE */}
      {isModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-usuario-title"
        >
          <div className="modal-content">
            <header className="modal-header">
              <h2 id="modal-usuario-title" className="modal-title">
                Registrar Nuevo Profesional
              </h2>
              <button
                type="button"
                className="modal-close-btn min-touch"
                onClick={() => setIsModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-body" noValidate>
              <div className="form-group">
                <label htmlFor="usuario-rol" className="form-label">
                  Rol Clínico del Usuario <span className="required-mark">*</span>
                </label>
                <select
                  id="usuario-rol"
                  className={`form-input ${errors.rol ? 'input-error' : ''}`}
                  {...register('rol')}
                >
                  <option value="Especialista">Doctor (Especialista) - Puede crear y gestionar evaluaciones médicas</option>
                  <option value="Asistente">Asistente - Puede gestionar pacientes y catálogos clínicos</option>
                </select>
                {errors.rol && (
                  <span className="field-error" role="alert">
                    {errors.rol.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="usuario-nombre" className="form-label">
                  Nombre de Usuario <span className="required-mark">*</span>
                </label>
                <div className="input-wrapper">
                  <User className="input-icon" aria-hidden="true" size={18} />
                  <input
                    id="usuario-nombre"
                    type="text"
                    className={`form-input has-icon ${errors.nombreUsuario ? 'input-error' : ''}`}
                    placeholder="Ej: dr_gonzalez o asistente_clinico"
                    aria-required="true"
                    aria-invalid={!!errors.nombreUsuario}
                    {...register('nombreUsuario')}
                  />
                </div>
                {errors.nombreUsuario && (
                  <span className="field-error" role="alert">
                    {errors.nombreUsuario.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="usuario-password" className="form-label">
                  Contraseña <span className="required-mark">*</span>
                </label>
                <div className="input-wrapper">
                  <Lock className="input-icon" aria-hidden="true" size={18} />
                  <input
                    id="usuario-password"
                    type="password"
                    className={`form-input has-icon ${errors.password ? 'input-error' : ''}`}
                    placeholder="Mínimo 4 caracteres"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <span className="field-error" role="alert">
                    {errors.password.message}
                  </span>
                )}
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary min-touch"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-touch"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  <Save size={18} aria-hidden="true" />
                  <span>{isSubmitting ? 'Registrando...' : 'Registrar Profesional'}</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* Modal Accesible de Confirmación para Eliminación */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="¿Confirmar eliminación de usuario?"
        message={`¿Está seguro de que desea eliminar al usuario "${userToDelete?.nombreUsuario}" (${userToDelete?.rol === 'Especialista' ? 'Doctor Especialista' : 'Asistente'})? Esta acción no se puede deshacer.`}
        confirmText="Sí, Eliminar Usuario"
        cancelText="Cancelar"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setUserToDelete(null);
        }}
      />
    </main>
  );
};
