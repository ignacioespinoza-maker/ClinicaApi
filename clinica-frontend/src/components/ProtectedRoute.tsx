import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  requireAdmin?: boolean;
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requireAdmin,
  children,
}) => {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="container page-content" id="main-content">
        <LoadingSkeleton message="Verificando credenciales de acceso..." />
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    // Redirige al login guardando la ruta intentada en state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la ruta requiere privilegios de Administrador
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  // Si la ruta requiere roles específicos (ej: Especialista)
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/acceso-denegado" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
