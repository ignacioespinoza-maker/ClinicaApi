# Bitácora de Uso de Inteligencia Artificial Generativa (AI Log)
## Asignatura: Lenguaje de Programación Web II | Trabajo 2 (UT2)

- **Estudiante:** Ignacio Espinoza
- **Herramienta de IA:** Google Antigravity AI Assistant
- **Modelo:** Gemini 3.8 Flash
- **Tipo de Plan/Cuenta:** Institucional / Developer Edition
- **Repositorio:** `ClinicaApi` (Monorepo Backend .NET 10 + Frontend React/TypeScript)

---

## 1. Declaración Formal de Uso de IA

Declaro que para el desarrollo de este proyecto integrador se utilizó la asistencia de herramientas de IA generativa con el propósito de optimizar el diseño arquitectónico, estructurar la suite de pruebas unitarias y de componentes, implementar patrones de accesibilidad WCAG 2.2 nivel AA y formular la matriz de mitigación de vulnerabilidades OWASP.

Todo el código generado fue analizado críticamente, ajustado según las restricciones de negocio y la base de datos `EvaluacionesClinicasDB`, y verificado mediante compilación, ejecución de pruebas automatizadas y auditoría de seguridad.

---

## 2. Registro Cronológico de Prompts y Decisiones por Eje de Trabajo

### Eje 1: Arquitectura Frontend y Configuración del Monorepo
- **Prompt Utilizado:**
  > *"Diseña la arquitectura frontend en React 19 con Vite y TypeScript para consumir la API de Evaluaciones Clínicas del Trabajo 1. Debe incluir una estructura limpia por capas (types, services, context, components, views, tests), con React Router, cliente HTTP centralizado con Axios, variables de entorno VITE_API_URL y soporte estricto de tipos."*
- **Respuesta de la IA:**
  Propuso una estructura basada en carpetas con Vite, Axios con interceptores y React Router v7.
- **Decisión Tomada (Aceptado / Corregido / Descartado):**
  - **Aceptado:** La separación desacoplada de la capa de servicios HTTP (`apiClient.ts`) respecto a los componentes visuales.
  - **Corregido:** Se corrigió la configuración de TypeScript (`tsconfig.app.json`) para bundler mode y se integró `vitest/globals` con `@testing-library/jest-dom`.
  - **Motivo del ajuste:** Garantizar que los tipos de Vitest y las aserciones de Testing Library compilaran limpiamente sin colisiones de nombres.

---

### Eje 2: Consumo de la API y Estrategia de Autenticación JWT
- **Prompt Utilizado:**
  > *"Genera el cliente HTTP centralizado con interceptores que adjunten el token JWT en formato Bearer, gestionen errores 401 limpiando la sesión y redirigiendo al login, capturen 403 para rutas protegidas y traduzcan respuestas 429 de Rate Limiting. Justifica el almacenamiento del token en sessionStorage frente a localStorage."*
- **Respuesta de la IA:**
  Creó `apiClient.ts` con manejo de eventos personalizados `auth:unauthorized` y `auth:forbidden`, y `authService.ts` con decodificación manual de claims JWT sin dependencias externas pesadas.
- **Decisión Tomada:**
  - **Aceptado:** La decodificación en base64 de los claims JWT para detectar el rol (`Especialista` vs `Asistente`) y el ID del usuario en cliente.
  - **Corregido:** Se adaptó la lectura del claim de rol para soportar tanto `role` corto como el URI completo de Microsoft ClaimTypes (`http://schemas.microsoft.com/ws/2008/06/identity/claims/role`).
  - **Motivo del ajuste:** El backend de ASP.NET Core emite el claim de rol bajo el esquema de identidad de Windows/WS-Security, requiriendo esa compatibilidad para no asignar roles por defecto erróneos.

---

### Eje 3: CRUD en la Interfaz, Estados y Validación de Formularios
- **Prompt Utilizado:**
  > *"Construye los componentes de interfaz para el CRUD de Evaluaciones: listado con búsqueda y filtros, detalle de diagnóstico, creación y edición con React Hook Form y Zod, y eliminación con modal accesible. Asegura los tres estados: carga, error y vacío, y maneja los errores devueltos por la API (400 ProblemDetails)."*
- **Respuesta de la IA:**
  Generó `EvaluacionesListView`, `EvaluacionDetailView` y `EvaluacionFormView` integrados con Zod y componentes reutilizables.
- **Decisión Tomada:**
  - **Aceptado:** La validación client-side de formulario que previene envíos inválidos antes de tocar la red.
  - **Corregido:** Se agregaron sugerencias de resultados médicos mediante `<datalist>` y se enriqueció la vista de edición para mapear automáticamente el paciente y signo clínico seleccionado.
  - **Motivo del ajuste:** Mejorar la ergonomía de uso para profesionales médicos y agilizar la demostración en vivo de la evaluación docente.

---

### Eje 4: Accesibilidad (WCAG 2.2 Nivel AA) y Diseño Responsivo Mobile-First
- **Prompt Utilizado:**
  > *"Aplica las pautas WCAG 2.2 AA y diseño mobile-first desde 320 px a todo el frontend: landmarks semánticos, labels asociados a inputs con aria-describedby y aria-invalid, navegación por teclado con foco visible de alto contraste, modal de confirmación con atrapamiento de foco, controles táctiles mínimos de 44x44px, contraste mayor a 4.5:1 y presentación adaptable (tarjetas en móvil y tabla en escritorio)."*
- **Respuesta de la IA:**
  Proveyó `ConfirmModal.tsx`, `FeedbackAlert.tsx`, `SkipLink.tsx` y la hoja de estilos `index.css` con variables CSS de alto contraste.
- **Decisión Tomada:**
  - **Aceptado:** El diseño responsivo que conmuta entre tarjetas en móvil (`< 768px`) y tabla semántica en escritorio (`>= 768px`).
  - **Corregido:** Se reforzó el botón *Skip Link* para posicionarse en la esquina superior izquierda al recibir foco mediante tabulación, y se verificó que cada icono contara con `aria-hidden="true"`.
  - **Motivo del ajuste:** Prevenir que lectores de pantalla verbalicen nombres técnicos de SVG o iconos decorativos y asegurar el cumplimiento estricto del criterio 2.4.1 de WCAG (Bypass Blocks).

---

### Eje 5: Mitigación de Vulnerabilidades OWASP y Seguridad del Backend
- **Prompt Utilizado:**
  > *"Identifica y corrige las fallas de la API del Trabajo 1 para permitir su consumo seguro desde navegador: corregir CORS restringido a orígenes explícitos, agregar cabeceras de seguridad HTTP (X-Frame-Options, X-Content-Type-Options, Referrer-Policy), límite de tasa (Rate Limiting) en login contra fuerza bruta, y un middleware global que capture excepciones sin filtrar trazas internas."*
- **Respuesta de la IA:**
  Propuso los middlewares `SecurityHeadersMiddleware`, `GlobalErrorHandlingMiddleware` y la configuración de `Program.cs`.
- **Decisión Tomada:**
  - **Aceptado:** El middleware global de excepciones devolviendo JSON estructurado RFC 7807 sin stack traces.
  - **Corregido:** Se detectó que el endpoint POST de evaluaciones provocaba una excepción 500 debido a referencias circulares en el grafo de EF Core (`Evaluacion` -> `Paciente` -> `Evaluacions`). Se corrigió el código creando `EvaluacionDto` que retorna únicamente los campos clínicos necesarios sin ciclos.
  - **Motivo del ajuste:** Resolver un bug crítico del Trabajo 1 que impedía el flujo de creación en el frontend.

---

### Eje 6: Pruebas Automatizadas (Vitest y Playwright)
- **Prompt Utilizado:**
  > *"Genera la suite de pruebas unitarias y de componentes con Vitest y React Testing Library que cubran: login (render y validaciones), ruta protegida con bloqueo por roles, y operación de CRUD con diálogo modal. Configura además una prueba E2E con Playwright para el flujo completo login -> crear -> listar."*
- **Respuesta de la IA:**
  Generó los archivos de prueba en `src/test/` y `e2e/`.
- **Decisión Tomada:**
  - **Aceptado:** La estructura de pruebas con simulación de servicios y verificación de accesibilidad con `findByRole`.
  - **Corregido:** En `EvaluacionesListView.test.tsx`, la consulta `findByText` fallaba porque el nombre del paciente se renderizaba tanto en la tabla de escritorio como en la tarjeta móvil. Se adaptó la aserción utilizando `findAllByText` para soportar la naturaleza responsiva del componente.
  - **Motivo del ajuste:** Lograr que la suite de pruebas frontend pase al 100% reflejando el DOM responsivo real.

---

### Eje 7: Consumo Integral de Entidades DB, Creación de Catálogos y Gestión de Usuarios
- **Prompt Utilizado:**
  > *"Necesito que mi aplicación consuma todas las API según mi base de datos, que se pueda crear un asistente nuevo o registrar otro doctor para poder crear un registro, que el doctor pueda crear otro usuario de doctor, y que el asistente y doctor puedan crear signo clínico y categoría de examen."*
- **Respuesta de la IA:**
  1. **Backend (.NET 10 Minimal APIs):**
     - Se crearon los endpoints `POST /api/v1/categorias` y `POST /api/v1/signos` permitiendo tanto a Especialistas (Doctores) como Asistentes registrar categorías de examen y signos clínicos.
     - Se implementó `POST /api/v1/usuarios/registro` público para permitir registrarse como nuevo Asistente o Doctor.
     - Se implementó `GET /api/v1/usuarios` y `POST /api/v1/usuarios` protegido con `[Authorize(Roles = "Especialista")]` permitiendo al Doctor listar usuarios y crear nuevos usuarios de Doctor o Asistente.
     - Se implementaron endpoints de detalle `GET /{id}` en categorías, signos y pacientes.
  2. **Frontend (React 19 + TypeScript):**
     - Nueva vista accesible `CatalogosView.tsx` (`/catalogos`) para gestión y creación de Categorías de Examen y Signos Clínicos disponible para ambos roles.
     - Nueva vista protegida `UsuariosView.tsx` (`/usuarios`) exclusiva para Doctores Especialistas para dar de alta médicos y asistentes.
     - Pestaña de autoregistro en `LoginView.tsx` para permitir crear cuenta de Asistente o Doctor desde el acceso público.
     - Actualización de `Navbar.tsx` y `DashboardView.tsx` con enlaces directos, métricas actualizadas y matriz de capacidades.
  3. **Pruebas Automatizadas:**
     - 9 pruebas backend pasando en `ClinicaApi.Tests` (incluyendo cobertura de roles, creación de catálogos y gestión de usuarios).
     - 14 pruebas frontend pasando en Vitest (`src/test/`).

---

### Eje 8: Restricción de Privilegios Administrativos para Creación de Usuarios
- **Prompt Utilizado:**
  > *"Haz que solo el que está logeado como admin pueda agregar nuevos doctores y asistentes."*
- **Respuesta de la IA:**
  1. **Backend (.NET 10 Minimal APIs):**
     - En `UsuarioApi.cs`, se implementó el método de validación `IsAdmin(ClaimsPrincipal user)`.
     - Se eliminó el autoregistro público anónimo para asegurar que nadie sin credenciales pueda registrar usuarios.
     - Se reforzaron los endpoints `POST /api/v1/usuarios` y `GET /api/v1/usuarios` con verificación estricta `if (!IsAdmin(user)) return Results.Json(..., 403 Forbidden)`. Los doctores regulares y asistentes reciben 403 Forbidden al intentar crear o listar usuarios.
  2. **Frontend (React 19 + TypeScript):**
     - En `AuthContext.tsx`, se añadió la propiedad reactiva `isAdmin`.
     - En `ProtectedRoute.tsx`, se incorporó la prop `requireAdmin` que bloquea y redirige a `/acceso-denegado` a usuarios no administradores.
     - En `App.tsx`, la ruta `/usuarios` queda protegida exclusivamente para el administrador.
     - En `Navbar.tsx` y `DashboardView.tsx`, los enlaces y botones de "Gestión de Usuarios / Doctores" solo se visualizan para la sesión activa de Administrador (`dr_admin`).
     - En `LoginView.tsx`, se retiró el formulario de autoregistro externo.
  3. **Pruebas Automatizadas:**
     - 9 pruebas backend pasando en `ClinicaApi.Tests` validando que doctores no-admin y asistentes reciben 403 Forbidden.
     - 16 pruebas frontend pasando en Vitest (incluyendo pruebas de `ProtectedRoute` con `requireAdmin`).

---

### Eje 9: Validación Algorítmica de RUT (Módulo 11) y Habilitación de Gestión de Usuarios al Rol Doctor Especialista
- **Prompt Utilizado:**
  > *"Quiero que los rut estén validados y que dentro del rol de doctor especialista pueda agregar nuevos usuarios de asistentes y doctores y que estén todas las validaciones correctas."*
- **Respuesta de la IA:**
  1. **Validación de RUT Chileno (Módulo 11):**
     - **Frontend:** Se creó la utilidad `rutValidator.ts` con funciones de validación según el algoritmo Módulo 11 y normalización al formato `XXXXXXXX-X`. Se integró en `PacientesView.tsx` mediante `zod.refine()`.
     - **Backend:** En `PacienteApi.cs`, se implementó `ValidarRutChileno` y `NormalizarRutChileno`, rechazando con 400 Bad Request cualquier RUT con dígito verificador erróneo o formato inválido antes de tocar la base de datos.
  2. **Rol Doctor Especialista para Agregar Usuarios:**
     - En `UsuarioApi.cs`, se ajustaron los endpoints `POST /api/v1/usuarios` y `GET /api/v1/usuarios` para autorizar a todo usuario con rol `Especialista` (`[Authorize(Roles = "Especialista")]`). Los asistentes reciben 403 Forbidden.
     - En el frontend (`App.tsx`, `Navbar.tsx`, `DashboardView.tsx`, `UsuariosView.tsx`), se habilitó la navegación y gestión de usuarios para los profesionales con rol `Especialista`.
  3. **Validaciones Generales Completas:**
     - Validación estricta de nombres, apellidos, fechas no futuras y teléfonos en Pacientes.
     - Validación de formato alfanumérico (`^[a-zA-Z0-9_.-]+$`), longitud y contraseñas mínimas en Usuarios.
  4. **Pruebas Automatizadas:**
     - 10 pruebas pasando en backend (.NET xUnit en `ClinicaApi.Tests`), incluyendo pruebas de rechazo de RUT inválido y aceptación de RUT válido.
     - 24 pruebas pasando en frontend (Vitest en `src/test/`), incluyendo suite de pruebas dedicadas para `rutValidator` y `PacientesView`.

---

### Eje 10: Credencial de Administrador Compartida (Doctor Admin y Asistente Admin) para Creación y Eliminación de Usuarios
- **Prompt Utilizado:**
  > *"Quiero que un asistente tenga una credencial de admin para que solamente él junto a un doctor con credencial de admin puedan crear y eliminar a otro doctor y asistente."*
- **Respuesta de la IA:**
  1. **Backend (.NET 10 Minimal APIs):**
     - **Seeding de Usuario:** En `Program.cs`, se agregó la inicialización automática del usuario `asistente_admin` (Rol: `Asistente`) con contraseña segura hasheada.
     - **Claim JWT `IsAdmin`:** En `AuthService.cs`, se incorporó el claim personalizado `IsAdmin: "true"` para todo usuario con privilegios de administración (`dr_admin` y `asistente_admin`).
     - **Regla BFLA de Autorización:** En `UsuarioApi.cs`, se implementó la función `TieneCredencialAdmin(ClaimsPrincipal user)`. Los endpoints `GET /api/v1/usuarios`, `POST /api/v1/usuarios` y `DELETE /api/v1/usuarios/{id}` requieren obligatoriamente esta credencial. Usuarios sin credencial de admin (doctores regulares y asistentes estándar) reciben un estricto `403 Forbidden`.
     - **Endpoint de Eliminación (`DELETE /api/v1/usuarios/{id}`):** Se añadió con validaciones de seguridad:
       - Impide que un administrador elimine su propia cuenta activa (`400 Bad Request`).
       - Impide eliminar a profesionales que posean evaluaciones clínicas registradas en el historial (`400 Bad Request`), preservando la integridad referencial.
     - **Pruebas de Seguridad en Backend:** Se integraron pruebas en `ClinicaApi.Tests/SeguridadTests.cs` verificando que tanto el doctor admin (`dr_admin`) como el asistente admin (`asistente_admin`) pueden crear y eliminar usuarios, mientras que usuarios regulares reciben `403 Forbidden`.
  2. **Frontend (React 19 + TypeScript):**
     - **Servicio y Contexto:** En `authService.ts`, se incorporó `deleteUsuario(id)` y la decodificación de `isAdmin` desde el token JWT. En `AuthContext.tsx`, se expuso la bandera booleana reactiva `isAdmin`.
     - **Protección de Rutas:** En `App.tsx`, la ruta `/usuarios` se configuró con `<ProtectedRoute requireAdmin />`, permitiendo el acceso tanto a `dr_admin` (Especialista) como a `asistente_admin` (Asistente).
     - **Interfaz de Usuarios (`UsuariosView.tsx`):**
       - Muestra la credencial asignada (*Admin* con escudo vs *Estándar*).
       - Botón accesible para eliminar usuarios con diálogo modal de confirmación (`ConfirmModal`) que cumple WCAG 2.2 AA (foco automático, cierre con Escape y rol `alertdialog`).
       - Protección contra auto-eliminación en la interfaz (indicador *"Sesión Actual"*).
     - **Navegación y Demostración:**
       - En `Navbar.tsx` y `DashboardView.tsx`, el acceso a la gestión de usuarios se activa mediante `isAdmin`.
       - En `LoginView.tsx`, se agregó botón de acceso rápido para `asistente_admin` facilitando la defensa en vivo.
  3. **Pruebas Automatizadas:**
     - 10 pruebas pasando en backend (.NET xUnit en `ClinicaApi.Tests`).
     - 26 pruebas pasando en frontend (Vitest en `src/test/`), incluyendo validación de modal de eliminación y protección de sesión.

---

### Eje 11: Modernización y Rediseño Visual de Catálogos Clínicos
- **Prompt Utilizado:**
  > *"Haz que el catálogo tenga un mejor estilo."*
- **Respuesta de la IA:**
  1. **Arquitectura Visual y Componentes ([`CatalogosView.tsx`](file:///c:/Users/Alumnos/Desktop/ClinicaApi-main/clinica-frontend/src/views/CatalogosView.tsx)):**
     - **Barra Superior de Métricas (KPIs):** Se incorporaron 3 tarjetas de estadísticas resumidas con iconos clínicos: Total de Categorías de Examen (`Layers`), Total de Pruebas y Signos Médicos (`Activity`) y Categorías con Pruebas Activas (`CheckCircle2`).
     - **Selector de Modo de Visualización Dual:** Se añadió un control conmutable entre **Cuadrícula de Tarjetas Modernas (`cards`)** y **Tabla Detallada (`table`)**, permitiendo al usuario alternar según su preferencia visual o de densidad de datos.
     - **Tarjetas Interactivas de Categorías:** Diseñadas con badges de identificación `#CAT-{id}`, avatar con gradiente suave, contador dinámico de signos clínicos asociados y botón de acción rápida *"Ver signos"* que conmuta a la pestaña de signos pre-filtrada por dicha categoría.
     - **Tarjetas de Signos Clínicos:** Incorporan badges de identificación `#SIG-{id}`, pastilla de categoría disciplinar con icono, área de descripción clínica y distintivo de estado verde (*"Activo en Evaluaciones"*).
     - **Barra de Herramientas y Filtros:** Barra de búsqueda en tiempo real con botón de limpieza `[X]`, selector de categoría con recuentos por disciplina y banner informativo de filtro activo con acción de restauración inmediata.
  2. **Sistema de Estilos Accesible ([`index.css`](file:///c:/Users/Alumnos/Desktop/ClinicaApi-main/clinica-frontend/src/index.css)):**
     - Se crearon clases utilitarias scoped (`.catalog-stats-bar`, `.catalog-stat-chip`, `.catalog-toolbar`, `.catalog-cards-grid`, `.catalog-card`, `.view-mode-toggle`) manteniendo la paleta de colores de alto contraste WCAG 2.2 AA.
     - Efectos sutiles de elevación (*hover lifting*), bordes suaves y foco visible accesible.
  3. **Verificación y Compatibilidad:**
     - 26/26 pruebas unitarias y de componentes pasando al 100% en Vitest.
     - Compilación estricta con `tsc -b && vite build` completada con éxito.

---

## 3. Resumen Cuantitativo de Decisiones

- **Total de prompts formulados:** 11
- **Elementos aceptados directamente:** ~88%
- **Elementos corregidos/adaptados:** ~12%
- **Elementos descartados:** 0%
