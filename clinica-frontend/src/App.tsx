import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { SkipLink } from './components/SkipLink';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { EvaluacionesListView } from './views/EvaluacionesListView';
import { EvaluacionDetailView } from './views/EvaluacionDetailView';
import { EvaluacionFormView } from './views/EvaluacionFormView';
import { PacientesView } from './views/PacientesView';
import { CatalogosView } from './views/CatalogosView';
import { UsuariosView } from './views/UsuariosView';
import { AccessDeniedView } from './views/AccessDeniedView';
import { NotFoundView } from './views/NotFoundView';

// Redirección si ya está autenticado e intenta ir a login
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  return (
    <div className="app-layout">
      <SkipLink />
      <Navbar />

      <div className="main-content-wrapper">
        <Routes>
          {/* Ruta Pública: Login */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginView />
              </PublicOnlyRoute>
            }
          />

          {/* Rutas Protegidas para Especialista y Asistente */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardView />} />
            <Route path="/evaluaciones" element={<EvaluacionesListView />} />
            <Route path="/evaluaciones/:id" element={<EvaluacionDetailView />} />
            <Route path="/pacientes" element={<PacientesView />} />
            <Route path="/catalogos" element={<CatalogosView />} />
            <Route path="/acceso-denegado" element={<AccessDeniedView />} />
          </Route>

          {/* Rutas Protegidas EXCLUSIVAS para Doctor Especialista (Crear y Editar Evaluaciones Clínicas) */}
          <Route element={<ProtectedRoute allowedRoles={['Especialista']} />}>
            <Route path="/evaluaciones/nueva" element={<EvaluacionFormView />} />
            <Route path="/evaluaciones/:id/editar" element={<EvaluacionFormView />} />
          </Route>

          {/* Ruta Protegida EXCLUSIVA para Administradores (Doctor Admin y Asistente Admin) */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/usuarios" element={<UsuariosView />} />
          </Route>

          {/* Ruta 404 */}
          <Route path="*" element={<NotFoundView />} />
        </Routes>
      </div>

      <footer className="main-footer" role="contentinfo">
        <div className="container footer-container">
          <p className="footer-text">
            &copy; 2026 Clínica Médica | Sistema de Evaluaciones Clínicas. Evaluación UT2 - Lenguaje de Programación Web II.
          </p>
          <div className="footer-badges">
            <span className="badge badge-outline">WCAG 2.2 Nivel AA</span>
            <span className="badge badge-outline">OWASP API Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
