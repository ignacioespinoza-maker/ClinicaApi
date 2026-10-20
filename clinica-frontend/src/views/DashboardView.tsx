import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { evaluacionService } from '../services/evaluacionService';
import { pacienteService } from '../services/pacienteService';
import { catalogoService } from '../services/catalogoService';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import {
  ClipboardList,
  Users,
  Stethoscope,
  PlusCircle,
  ShieldCheck,
  CheckCircle,
  Lock,
  Layers,
  UserCheck,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user, isEspecialista, isAdmin } = useAuth();
  const [stats, setStats] = useState<{
    evaluacionesCount: number;
    pacientesCount: number;
    signosCount: number;
    categoriasCount: number;
  }>({
    evaluacionesCount: 0,
    pacientesCount: 0,
    signosCount: 0,
    categoriasCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [evals, pacs, signs, cats] = await Promise.all([
          evaluacionService.getAll().catch(() => []),
          pacienteService.getAll().catch(() => []),
          catalogoService.getSignos().catch(() => []),
          catalogoService.getCategorias().catch(() => []),
        ]);
        if (isMounted) {
          setStats({
            evaluacionesCount: evals.length,
            pacientesCount: pacs.length,
            signosCount: signs.length,
            categoriasCount: cats.length,
          });
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="container page-content" id="main-content">
      {/* Encabezado del Dashboard con bienvenida */}
      <section className="dashboard-hero" aria-labelledby="dashboard-title">
        <div className="hero-text">
          <h1 id="dashboard-title" className="hero-heading">
            Bienvenido(a), <span className="highlight-name">{user?.nombreUsuario}</span>
          </h1>
          <p className="hero-subtext">
            Panel de control clínico. Sesión activa con rol:{' '}
            <strong className={`role-badge role-${user?.rol.toLowerCase()}`}>
              {user?.rol === 'Especialista' ? 'Doctor Especialista' : 'Asistente'}
            </strong>
          </p>
        </div>
        <div className="hero-actions">
          {isEspecialista && (
            <Link to="/evaluaciones/nueva" className="btn btn-primary min-touch">
              <PlusCircle size={18} aria-hidden="true" />
              <span>Nueva Evaluación</span>
            </Link>
          )}
          {isAdmin && (
            <Link to="/usuarios" className="btn btn-outline-primary min-touch">
              <UserCheck size={18} aria-hidden="true" />
              <span>Gestión Doctores / Usuarios</span>
            </Link>
          )}
          <Link to="/catalogos" className="btn btn-secondary min-touch">
            <Layers size={18} aria-hidden="true" />
            <span>Catálogos Clínicos</span>
          </Link>
        </div>
      </section>

      {/* Métricas y Contadores */}
      {isLoading ? (
        <LoadingSkeleton rows={2} message="Cargando estadísticas del sistema..." />
      ) : (
        <section className="stats-grid" aria-label="Resumen de estadísticas del sistema">
          <div className="stat-card">
            <div className="stat-icon-box bg-blue" aria-hidden="true">
              <ClipboardList size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.evaluacionesCount}</span>
              <span className="stat-label">Evaluaciones Clínicas</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box bg-teal" aria-hidden="true">
              <Users size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.pacientesCount}</span>
              <span className="stat-label">Pacientes Registrados</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box bg-indigo" aria-hidden="true">
              <Stethoscope size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.signosCount}</span>
              <span className="stat-label">Pruebas y Signos Clínicos</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-box bg-blue" aria-hidden="true" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <Layers size={26} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats.categoriasCount}</span>
              <span className="stat-label">Categorías de Examen</span>
            </div>
          </div>
        </section>
      )}

      {/* Matriz de capacidades por rol para la demostración docente */}
      <section className="role-capabilities-section" aria-labelledby="role-caps-title">
        <h2 id="role-caps-title" className="section-title">
          <ShieldCheck size={22} className="text-primary inline-icon" aria-hidden="true" />
          <span>Matriz de Autorización y Capacidades Clínicas</span>
        </h2>
        <div className="capabilities-grid">
          <div className="capability-card">
            <h3 className="card-subtitle">Permisos según su Rol ({user?.rol})</h3>
            <ul className="capability-list">
              <li className="cap-item">
                <CheckCircle size={18} className="text-success" aria-hidden="true" />
                <span>Listar y consultar evaluaciones médicas y pacientes</span>
              </li>
              <li className="cap-item">
                <CheckCircle size={18} className="text-success" aria-hidden="true" />
                <span><strong>Crear Categorías de Examen y Signos Clínicos</strong> (Asistente y Doctor)</span>
              </li>
              <li className="cap-item">
                <CheckCircle size={18} className="text-success" aria-hidden="true" />
                <span>Registrar nuevos pacientes en el sistema</span>
              </li>
              <li className="cap-item">
                {isEspecialista ? (
                  <>
                    <CheckCircle size={18} className="text-success" aria-hidden="true" />
                    <span><strong>Crear, editar y eliminar evaluaciones</strong> (Doctor Especialista)</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} className="text-danger" aria-hidden="true" />
                    <span className="text-muted">Crear y modificar evaluaciones (Exclusivo Especialista)</span>
                  </>
                )}
              </li>
              <li className="cap-item">
                {isAdmin ? (
                  <>
                    <CheckCircle size={18} className="text-success" aria-hidden="true" />
                    <span><strong>Crear y eliminar otros Doctores y Asistentes</strong> (Credencial Administrador)</span>
                  </>
                ) : (
                  <>
                    <Lock size={18} className="text-danger" aria-hidden="true" />
                    <span className="text-muted">Crear y eliminar usuarios (Exclusivo Doctor Admin y Asistente Admin)</span>
                  </>
                )}
              </li>
            </ul>
          </div>

          <div className="capability-card">
            <h3 className="card-subtitle">Controles de Seguridad OWASP Aplicados</h3>
            <ul className="capability-list">
              <li className="cap-item">
                <span className="badge-owasp">API2</span>
                <span>Tokens JWT en SessionStorage con Bearer HTTP y expiración estricta</span>
              </li>
              <li className="cap-item">
                <span className="badge-owasp">API5</span>
                <span>Autorización BFLA: bloqueo de rutas privadas y validación backend (403)</span>
              </li>
              <li className="cap-item">
                <span className="badge-owasp">API4</span>
                <span>Rate Limiting por IP para mitigar ataques de fuerza bruta</span>
              </li>
              <li className="cap-item">
                <span className="badge-owasp">API8</span>
                <span>CORS restringido a orígenes explícitos y cabeceras de seguridad HTTP</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
};
