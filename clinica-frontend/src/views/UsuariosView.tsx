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
  Users,
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
  Stethoscope,
  Eye,
  EyeOff,
  CheckCircle,
  FileText,
  UserCog,
  Filter,
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
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Especialista' | 'Asistente' | 'Admin'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modal de confirmación para eliminar usuario
  const [userToDelete, setUserToDelete] = useState<AuthUser | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nombreUsuario: '',
      password: '',
      rol: 'Especialista',
    },
  });

  const selectedRol = watch('rol');

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

  const checkIsAdmin = (u: AuthUser): boolean => {
    return (
      u.isAdmin === true ||
      u.nombreUsuario.toLowerCase() === 'dr_admin' ||
      u.nombreUsuario.toLowerCase() === 'asistente_admin' ||
      u.nombreUsuario.toLowerCase().includes('admin')
    );
  };

  const getInitials = (nombre: string): string => {
    if (!nombre) return 'US';
    const parts = nombre.split(/[_\-.]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  };

  const totalUsuarios = usuarios.length;
  const totalEspecialistas = usuarios.filter((u) => u.rol === 'Especialista').length;
  const totalAsistentes = usuarios.filter((u) => u.rol === 'Asistente').length;
  const totalAdmins = usuarios.filter((u) => checkIsAdmin(u)).length;

  const filteredUsuarios = usuarios.filter((u) => {
    const matchesSearch =
      u.nombreUsuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rol.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter === 'Especialista') return u.rol === 'Especialista';
    if (roleFilter === 'Asistente') return u.rol === 'Asistente';
    if (roleFilter === 'Admin') return checkIsAdmin(u);
    return true;
  });

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
      setShowPassword(false);
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

  return (
    <main className="container page-content" id="main-content">
      {/* Encabezado Principal */}
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
              setShowPassword(false);
              setIsModalOpen(true);
            }}
          >
            <UserPlus size={18} aria-hidden="true" />
            <span>Crear Doctor / Asistente</span>
          </button>
        </div>
      </section>

      {/* Alertas Accesibles */}
      {feedback && (
        <FeedbackAlert
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}
      {error && <FeedbackAlert type="error" message={error} onClose={() => setError(null)} />}

      {/* Tarjetas de Métricas de Personal Clínico */}
      <section className="stats-grid-4" aria-label="Resumen de usuarios y credenciales">
        <div className="stat-card">
          <div className="stat-icon-box bg-blue" aria-hidden="true">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalUsuarios}</span>
            <span className="stat-label">Usuarios Totales</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box bg-indigo" aria-hidden="true">
            <Stethoscope size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalEspecialistas}</span>
            <span className="stat-label">Doctores Especialistas</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box bg-teal" aria-hidden="true">
            <UserCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalAsistentes}</span>
            <span className="stat-label">Asistentes Clínicos</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-box bg-blue" aria-hidden="true">
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{totalAdmins}</span>
            <span className="stat-label">Con Credencial Admin</span>
          </div>
        </div>
      </section>

      {/* Barra de Filtro, Búsqueda y Segmentación */}
      <section className="search-filters-bar mb-4" aria-label="Filtros de búsqueda y roles">
        <div className="search-box">
          <label htmlFor="search-usuarios" className="sr-only">
            Buscar usuario por nombre o rol
          </label>
          <div className="input-wrapper">
            <Search className="input-icon" aria-hidden="true" size={18} />
            <input
              id="search-usuarios"
              type="search"
              placeholder="Buscar por nombre de usuario o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input has-icon"
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

        <div className="user-filter-pills" role="toolbar" aria-label="Filtrar por rol">
          <button
            type="button"
            className={`filter-pill ${roleFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setRoleFilter('ALL')}
            aria-pressed={roleFilter === 'ALL'}
          >
            <span>Todos</span>
            <span className="filter-pill-count">{totalUsuarios}</span>
          </button>
          <button
            type="button"
            className={`filter-pill ${roleFilter === 'Especialista' ? 'active' : ''}`}
            onClick={() => setRoleFilter('Especialista')}
            aria-pressed={roleFilter === 'Especialista'}
          >
            <Stethoscope size={14} aria-hidden="true" />
            <span>Especialistas</span>
            <span className="filter-pill-count">{totalEspecialistas}</span>
          </button>
          <button
            type="button"
            className={`filter-pill ${roleFilter === 'Asistente' ? 'active' : ''}`}
            onClick={() => setRoleFilter('Asistente')}
            aria-pressed={roleFilter === 'Asistente'}
          >
            <UserCheck size={14} aria-hidden="true" />
            <span>Asistentes</span>
            <span className="filter-pill-count">{totalAsistentes}</span>
          </button>
          <button
            type="button"
            className={`filter-pill ${roleFilter === 'Admin' ? 'active' : ''}`}
            onClick={() => setRoleFilter('Admin')}
            aria-pressed={roleFilter === 'Admin'}
          >
            <ShieldCheck size={14} aria-hidden="true" />
            <span>Administradores</span>
            <span className="filter-pill-count">{totalAdmins}</span>
          </button>
        </div>
      </section>

      {/* Vista de Datos: Tabla Responsiva */}
      {isLoading ? (
        <LoadingSkeleton rows={4} message="Cargando usuarios registrados..." />
      ) : filteredUsuarios.length === 0 ? (
        <div className="empty-state-box" role="status">
          <Users size={48} className="empty-icon text-muted" aria-hidden="true" />
          <h2 className="empty-title">No se encontraron usuarios</h2>
          <p className="empty-desc">
            {searchTerm || roleFilter !== 'ALL'
              ? 'No existen profesionales que coincidan con los criterios de búsqueda o filtros aplicados.'
              : 'Aún no hay usuarios adicionales en el sistema.'}
          </p>
          {(searchTerm || roleFilter !== 'ALL') && (
            <button
              type="button"
              className="btn btn-secondary min-touch mt-3"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('ALL');
              }}
            >
              <Filter size={16} aria-hidden="true" />
              <span>Restablecer Filtros</span>
            </button>
          )}
        </div>
      ) : (
        <div className="table-responsive-wrapper">
          <table className="clinical-table" aria-label="Listado de usuarios clínicos">
            <caption className="sr-only">Listado de doctores y asistentes registrados</caption>
            <thead>
              <tr>
                <th scope="col" style={{ width: '80px' }}>ID</th>
                <th scope="col">Profesional / Usuario</th>
                <th scope="col">Rol Clínico</th>
                <th scope="col">Credencial</th>
                <th scope="col">Permisos del Sistema</th>
                <th scope="col" style={{ textAlign: 'center', width: '150px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map((u) => {
                const esAdmin = checkIsAdmin(u);
                const esMismoUsuario =
                  u.idUsuario === currentUser?.idUsuario ||
                  u.nombreUsuario.toLowerCase() === currentUser?.nombreUsuario.toLowerCase();
                const initials = getInitials(u.nombreUsuario);

                return (
                  <tr key={u.idUsuario}>
                    <td>
                      <span className="badge badge-outline font-mono">#{u.idUsuario}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          className={`user-avatar-circle ${
                            u.rol === 'Especialista' ? 'user-avatar-especialista' : 'user-avatar-asistente'
                          }`}
                          aria-hidden="true"
                        >
                          {initials}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong className="user-name">{u.nombreUsuario}</strong>
                            {esAdmin && (
                              <span title="Credencial de Administrador" style={{ display: 'inline-flex' }}>
                                <ShieldCheck size={15} className="text-primary" aria-hidden="true" />
                              </span>
                            )}
                          </div>
                          <span className="text-muted text-sm">
                            {u.rol === 'Especialista' ? 'Médico Evaluador' : 'Personal Clínico'}
                          </span>
                        </div>
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
                      <div className="permission-tags-container">
                        {esAdmin && (
                          <span className="permission-tag highlight">
                            <UserCog size={12} aria-hidden="true" />
                            <span>Gestión Usuarios</span>
                          </span>
                        )}
                        {u.rol === 'Especialista' ? (
                          <span className="permission-tag">
                            <Stethoscope size={12} aria-hidden="true" />
                            <span>Evaluaciones (CRUD)</span>
                          </span>
                        ) : (
                          <span className="permission-tag">
                            <FileText size={12} aria-hidden="true" />
                            <span>Lectura Evaluaciones</span>
                          </span>
                        )}
                        <span className="permission-tag">
                          <CheckCircle size={12} aria-hidden="true" />
                          <span>Pacientes & Catálogos</span>
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {esMismoUsuario ? (
                        <span className="session-current-badge" title="Tu cuenta actualmente activa en sesión">
                          <span className="session-pulse-dot" aria-hidden="true" />
                          <span>Sesión Actual</span>
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

      {/* MODAL: REGISTRAR DOCTOR / ASISTENTE */}
      {isModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-usuario-title"
        >
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <header className="modal-header">
              <div>
                <h2 id="modal-usuario-title" className="modal-title">
                  Registrar Nuevo Profesional
                </h2>
                <p className="text-muted text-sm mt-1">
                  Alta de credenciales médicas o de asistencia para el sistema clínico
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn min-touch"
                onClick={() => {
                  setIsModalOpen(false);
                  setShowPassword(false);
                }}
                aria-label="Cerrar modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={handleSubmit(onSubmit)} className="modal-body" noValidate>
              {/* Selector Visual de Rol */}
              <div className="form-group">
                <label htmlFor="usuario-rol" className="form-label">
                  Rol Clínico del Usuario <span className="required-mark">*</span>
                </label>
                <div className="role-cards-selector mb-2" role="group" aria-label="Selección de Rol">
                  <button
                    type="button"
                    className={`role-card-option ${selectedRol === 'Especialista' ? 'selected' : ''}`}
                    onClick={() => setValue('rol', 'Especialista', { shouldValidate: true })}
                    aria-pressed={selectedRol === 'Especialista'}
                  >
                    <div className="role-card-header">
                      <Stethoscope size={18} className="text-primary" aria-hidden="true" />
                      <span>Doctor (Especialista)</span>
                    </div>
                    <p className="role-card-desc">
                      Facultado para crear, diagnosticar y gestionar evaluaciones clínicas médicas.
                    </p>
                  </button>

                  <button
                    type="button"
                    className={`role-card-option ${selectedRol === 'Asistente' ? 'selected' : ''}`}
                    onClick={() => setValue('rol', 'Asistente', { shouldValidate: true })}
                    aria-pressed={selectedRol === 'Asistente'}
                  >
                    <div className="role-card-header">
                      <UserCheck size={18} className="text-teal" aria-hidden="true" />
                      <span>Asistente Clínico</span>
                    </div>
                    <p className="role-card-desc">
                      Personal de apoyo para administración de pacientes y catálogos de especialidad.
                    </p>
                  </button>
                </div>

                <select
                  id="usuario-rol"
                  className={`form-input select-input sr-only ${errors.rol ? 'input-error' : ''}`}
                  {...register('rol')}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <option value="Especialista">Doctor (Especialista)</option>
                  <option value="Asistente">Asistente Clínico</option>
                </select>
                {errors.rol && (
                  <span className="field-error" role="alert">
                    {errors.rol.message}
                  </span>
                )}
              </div>

              {/* Nombre de Usuario */}
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
                <span className="field-hint">
                  Solo letras, números, puntos, guiones y guiones bajos (3 a 50 caracteres).
                </span>
                {errors.nombreUsuario && (
                  <span className="field-error" role="alert">
                    {errors.nombreUsuario.message}
                  </span>
                )}
              </div>

              {/* Contraseña con Toggle */}
              <div className="form-group">
                <label htmlFor="usuario-password" className="form-label">
                  Contraseña <span className="required-mark">*</span>
                </label>
                <div className="input-wrapper">
                  <Lock className="input-icon" aria-hidden="true" size={18} />
                  <input
                    id="usuario-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input has-icon ${errors.password ? 'input-error' : ''}`}
                    placeholder="Mínimo 4 caracteres"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                    title={showPassword ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                  </button>
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
                  onClick={() => {
                    setIsModalOpen(false);
                    setShowPassword(false);
                  }}
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
