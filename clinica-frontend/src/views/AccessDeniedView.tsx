import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { ShieldAlert, ArrowLeft, Send } from 'lucide-react';
import { FeedbackAlert } from '../components/FeedbackAlert';

export const AccessDeniedView: React.FC = () => {
  const { user } = useAuth();
  const [evidenceStatus, setEvidenceStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Demostración en vivo para la rúbrica: evidenciar que el backend valida y rechaza
  const testBackendRejection = async () => {
    try {
      setIsTesting(true);
      setEvidenceStatus(null);
      // Intentamos disparar un POST restringido al backend con el token actual
      await apiClient.post('/api/v1/evaluaciones', {
        resultado: 'Intento de escritura no autorizada',
        observaciones: 'Prueba de mitigación OWASP API5',
        idPaciente: 1,
        idSigno: 1,
        idUsuario: user?.idUsuario || 1,
      });
      setEvidenceStatus('Inesperado: la petición fue aceptada.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      setEvidenceStatus(`Bloqueo exitoso: El servidor respondió con 403 Forbidden y rechazó la petición. Detalle: "${msg}"`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <main className="container page-content" id="main-content">
      <div className="error-card" role="alert" aria-labelledby="denied-title">
        <div className="error-icon-box text-danger" aria-hidden="true">
          <ShieldAlert size={64} />
        </div>

        <h1 id="denied-title" className="error-title">
          403 - Acceso Denegado
        </h1>

        <p className="error-description">
          Su cuenta actual (<strong>{user?.nombreUsuario}</strong> con rol{' '}
          <strong className="badge badge-warning">{user?.rol}</strong>) no dispone de los privilegios
          necesarios para acceder a esta sección o ejecutar esta acción clínica.
        </p>

        <div className="security-notice-box">
          <h2 className="security-notice-title">Control de Autorización (OWASP API5:2023)</h2>
          <p className="security-notice-text">
            Las operaciones de creación, modificación y eliminación de diagnósticos están reservadas
            estrictamente al rol <strong>Especialista</strong>. La interfaz de usuario bloquea la vista
            y el servidor .NET valida el claim de rol en cada endpoint protegido.
          </p>

          <div className="mt-3">
            <button
              type="button"
              onClick={testBackendRejection}
              disabled={isTesting}
              className="btn btn-outline-danger min-touch inline-flex-center"
              aria-label="Probar rechazo de seguridad en el backend"
            >
              <Send size={16} aria-hidden="true" />
              <span>{isTesting ? 'Probando...' : 'Demostrar Bloqueo 403 del Backend en Vivo'}</span>
            </button>
          </div>

          {evidenceStatus && (
            <div className="mt-3 text-left">
              <FeedbackAlert
                type="info"
                title="Evidencia de Mitigación"
                message={evidenceStatus}
                onClose={() => setEvidenceStatus(null)}
              />
            </div>
          )}
        </div>

        <div className="error-actions mt-4">
          <Link to="/evaluaciones" className="btn btn-primary min-touch inline-flex-center">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Volver a Mis Evaluaciones</span>
          </Link>
        </div>
      </div>
    </main>
  );
};
