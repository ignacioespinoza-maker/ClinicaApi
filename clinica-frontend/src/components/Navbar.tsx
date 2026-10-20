import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  LogOut,
  Menu,
  X,
  Users,
  ClipboardList,
  LayoutDashboard,
  Layers,
  UserCheck,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="brand-section">
          <NavLink to="/" className="brand-logo min-touch" onClick={closeMobileMenu}>
            <Activity className="brand-icon" aria-hidden="true" size={28} />
            <span className="brand-name">Clínica Médica</span>
          </NavLink>
        </div>

        {/* Botón menú móvil (Touch target >= 44x44px) */}
        <button
          type="button"
          className="mobile-toggle min-touch"
          aria-expanded={isMobileMenuOpen}
          aria-controls="primary-navigation"
          aria-label={isMobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>

        {/* Navegación principal */}
        <nav
          id="primary-navigation"
          role="navigation"
          aria-label="Navegación principal"
          className={`nav-menu ${isMobileMenuOpen ? 'nav-menu-open' : ''}`}
        >
          <ul className="nav-list">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-link min-touch ${isActive ? 'nav-link-active' : ''}`}
                onClick={closeMobileMenu}
              >
                <LayoutDashboard size={18} aria-hidden="true" />
                <span>Panel</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/evaluaciones"
                className={({ isActive }) => `nav-link min-touch ${isActive ? 'nav-link-active' : ''}`}
                onClick={closeMobileMenu}
              >
                <ClipboardList size={18} aria-hidden="true" />
                <span>Evaluaciones</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/pacientes"
                className={({ isActive }) => `nav-link min-touch ${isActive ? 'nav-link-active' : ''}`}
                onClick={closeMobileMenu}
              >
                <Users size={18} aria-hidden="true" />
                <span>Pacientes</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/catalogos"
                className={({ isActive }) => `nav-link min-touch ${isActive ? 'nav-link-active' : ''}`}
                onClick={closeMobileMenu}
              >
                <Layers size={18} aria-hidden="true" />
                <span>Catálogos</span>
              </NavLink>
            </li>
            {isAdmin && (
              <li>
                <NavLink
                  to="/usuarios"
                  className={({ isActive }) => `nav-link min-touch ${isActive ? 'nav-link-active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <UserCheck size={18} aria-hidden="true" />
                  <span>Usuarios</span>
                </NavLink>
              </li>
            )}
          </ul>

          <div className="nav-user-panel">
            <div className="user-info">
              <span className="user-name">{user.nombreUsuario}</span>
              <span className={`role-badge role-${user.rol.toLowerCase()}`}>
                {user.rol}
              </span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-outline-danger min-touch"
              aria-label="Cerrar sesión de usuario"
            >
              <LogOut size={16} aria-hidden="true" />
              <span>Salir</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
