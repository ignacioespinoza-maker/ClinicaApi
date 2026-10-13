import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { FeedbackAlert } from '../components/FeedbackAlert';
import { Activity, Lock, User, LogIn, ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  nombreUsuario: z
    .string()
    .min(1, 'El nombre de usuario es obligatorio')
    .max(50, 'El usuario no puede superar 50 caracteres'),
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirigir a la ruta original si existía
  const fromLocation = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nombreUsuario: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await login(data);
      navigate(fromLocation, { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Credenciales inválidas. Verifique sus datos.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Botones de acceso rápido para la demostración en vivo de la evaluación
  const fillCredentials = (user: string, pass: string) => {
    setValue('nombreUsuario', user);
    setValue('password', pass);
    setErrorMessage(null);
  };

  return (
    <div className="login-page">
      <main className="login-card" id="main-content">
        <header className="login-header">
          <div className="login-logo-circle" aria-hidden="true">
            <Activity size={32} />
          </div>
          <h1 className="login-title">Acceso al Sistema Clínico</h1>
          <p className="login-subtitle">
            Ingrese sus credenciales profesionales para gestionar las evaluaciones médicas.
          </p>
        </header>

        {errorMessage && (
          <div className="mb-4">
            <FeedbackAlert
              type="error"
              title="Error de autenticación"
              message={errorMessage}
              onClose={() => setErrorMessage(null)}
            />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="login-form" noValidate>
          {/* Campo Nombre de Usuario */}
          <div className="form-group">
            <label htmlFor="nombreUsuario" className="form-label">
              Nombre de Usuario
            </label>
            <div className="input-wrapper">
              <User className="input-icon" aria-hidden="true" size={18} />
              <input
                id="nombreUsuario"
                type="text"
                autoComplete="username"
                className={`form-input has-icon ${errors.nombreUsuario ? 'input-error' : ''}`}
                placeholder="Ej: dr_admin o asistente_01"
                aria-required="true"
                aria-invalid={!!errors.nombreUsuario}
                aria-describedby={errors.nombreUsuario ? 'nombreUsuario-error' : undefined}
                {...register('nombreUsuario')}
              />
            </div>
            {errors.nombreUsuario && (
              <span id="nombreUsuario-error" className="field-error" role="alert">
                {errors.nombreUsuario.message}
              </span>
            )}
          </div>

          {/* Campo Contraseña */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <div className="input-wrapper">
              <Lock className="input-icon" aria-hidden="true" size={18} />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className={`form-input has-icon ${errors.password ? 'input-error' : ''}`}
                placeholder="Ingrese su contraseña"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <span id="password-error" className="field-error" role="alert">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary btn-block min-touch"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <LogIn size={18} aria-hidden="true" />
                <span>Iniciar Sesión</span>
              </>
            )}
          </button>
        </form>

        {/* Acceso rápido para la defensa / demostración docente */}
        <section className="demo-credentials-section" aria-labelledby="demo-credentials-title">
          <div className="demo-header">
            <ShieldAlert size={16} aria-hidden="true" />
            <h2 id="demo-credentials-title" className="demo-title">
              Cuentas de demostración docente:
            </h2>
          </div>
          <div className="demo-buttons">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary min-touch"
              onClick={() => fillCredentials('dr_admin', 'hash_simulado_aqui_123')}
            >
              Dr. Admin (Especialista)
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary min-touch"
              onClick={() => fillCredentials('asistente_01', 'hash_simulado_aqui_456')}
            >
              Asistente 01 (Asistente)
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
