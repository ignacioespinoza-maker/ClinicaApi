import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  return (
    <main className="container page-content" id="main-content">
      <div className="error-card" role="alert" aria-labelledby="notfound-title">
        <div className="error-icon-box text-warning" aria-hidden="true">
          <AlertCircle size={64} />
        </div>
        <h1 id="notfound-title" className="error-title">
          404 - Página No Encontrada
        </h1>
        <p className="error-description">
          La ruta que ha intentado visitar no existe en este portal clínico.
        </p>
        <div className="error-actions mt-4">
          <Link to="/" className="btn btn-primary min-touch inline-flex-center">
            <Home size={18} aria-hidden="true" />
            <span>Regresar al Inicio</span>
          </Link>
        </div>
      </div>
    </main>
  );
};
