import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSkeleton } from './LoadingSkeleton';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
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

  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    // Usuario autenticado pero sin rol suficiente (Manejo 403 / Acceso Denegado)
    return <Navigate to="/acceso-denegado" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
