# Evidencia de Ejecución de Pruebas Automatizadas
## Proyecto: Sistema de Evaluaciones Clínicas (UT2)

---

## 1. Suite de Pruebas del Backend (xUnit en .NET 10)

Ejecución realizada mediante `dotnet test ClinicaApi.slnx`:

```text
$ dotnet test ClinicaApi.slnx
  Determinando los proyectos que se van a restaurar...
  Todos los proyectos están actualizados para la restauración.
  ClinicaApi -> C:\...\ClinicaApi\bin\Debug\net10.0\ClinicaApi.dll
  ClinicaApi.Tests -> C:\...\ClinicaApi.Tests\bin\Debug\net10.0\ClinicaApi.Tests.dll

Serie de pruebas para ClinicaApi.Tests.dll (.NETCoreApp,Version=v10.0)
1 archivos de prueba en total coincidieron con el patrón especificado.

Pasa! ClinicaApi.Tests.SeguridadTests.Login_ConCredencialesInvalidas_Retorna401Unauthorized [212 ms]
Pasa! ClinicaApi.Tests.SeguridadTests.GetCategorias_SinTokenJWT_Retorna401Unauthorized [89 ms]
Pasa! ClinicaApi.Tests.SeguridadTests.CabecerasSeguridad_EstanPresentesEnRespuestas [95 ms]
Pasa! ClinicaApi.Tests.SeguridadTests.Login_ConCredencialesValidas_Retorna200YToken [240 ms]
Pasa! ClinicaApi.Tests.SeguridadTests.RolAsistente_NoPuedeCrearEvaluacion_Retorna403Forbidden [310 ms]
Pasa! ClinicaApi.Tests.SeguridadTests.RolEspecialista_PuedeCrearYConsultarDetalleEvaluacion [415 ms]

Correctas! - Con error: 0, Superado: 6, Omitido: 0, Total: 6, Duración: 2 s - ClinicaApi.Tests.dll (net10.0)
```

- **Total de pruebas backend:** 6 pruebas de integración y seguridad
- **Estado:** 100% superadas (6 de 6)

---

## 2. Suite de Pruebas de Componentes del Frontend (Vitest + React Testing Library)

Ejecución realizada mediante `npm test` (`npx vitest run`):

```text
$ npm test

 RUN  v5.0.4 C:/.../ClinicaApi_repo/clinica-frontend

 ✓ src/test/ProtectedRoute.test.tsx (3 tests) 111ms
   ✓ ProtectedRoute Component Tests (3)
     ✓ redirige a /login cuando el usuario no está autenticado
     ✓ redirige a /acceso-denegado (403) si el rol es Asistente e intenta acceder a ruta de Especialista
     ✓ permite el acceso si el rol es Especialista y coincide con allowedRoles

 ✓ src/test/EvaluacionesListView.test.tsx (3 tests) 967ms
   ✓ EvaluacionesListView Component Tests (CRUD) (3)
     ✓ renderiza la lista de evaluaciones con datos clínicos
     ✓ permite filtrar registros mediante la barra de búsqueda
     ✓ abre el diálogo de confirmación accesible al pulsar eliminar y procesa el borrado

 ✓ src/test/LoginView.test.tsx (4 tests) 1665ms
   ✓ LoginView Component Tests (4)
     ✓ renderiza correctamente el formulario de login y elementos de accesibilidad
     ✓ muestra errores de validación si los campos requeridos se dejan vacíos
     ✓ procesa login exitoso con credenciales válidas y actualiza sesión
     ✓ muestra mensaje de alerta accesible (role="alert") cuando el login falla (401)

 Test Files  3 passed (3)
      Tests  10 passed (10)
   Start at  15:27:30
   Duration  4.24s
```

- **Total de pruebas frontend:** 10 pruebas unitarias y de componentes
- **Cobertura de criterios:**
  1. Autenticación y Login (render, validaciones en cliente, 401 alert).
  2. Rutas protegidas y autorización basada en roles (Especialista vs Asistente con 403).
  3. Operaciones del CRUD (renderizado, búsqueda en tiempo real, confirmación accesible y eliminación).
- **Estado:** 100% superadas (10 de 10)

---

## 3. Pruebas End-to-End (Playwright)

Archivo de especificación: `clinica-frontend/e2e/evaluacion-flow.spec.ts`

- **Flujo 1:** Visita a `/login` -> Inicio de sesión como `dr_admin` -> Navegación al Dashboard -> Acceso a `/evaluaciones/nueva` -> Diligenciamiento de paciente, signo, resultado y observaciones -> Envío de formulario -> Redirección a `/evaluaciones` y verificación en DOM.
- **Flujo 2:** Inicio de sesión como `asistente_01` -> Intento de forzar URL `/evaluaciones/nueva` -> Redirección inmediata a `/acceso-denegado` (403).
- **Comando de ejecución:** `npx playwright test`
