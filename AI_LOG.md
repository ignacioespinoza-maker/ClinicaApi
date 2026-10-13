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
  - **Motivo del ajuste:** Lograr que la suite de pruebas frontend pase al 100% (10 tests de 10) reflejando el DOM responsivo real.

---

## 3. Resumen Cuantitativo de Decisiones

- **Total de prompts formulados:** 6
- **Elementos aceptados directamente:** ~75% (arquitectura de capas, esquemas Zod, estilos de alto contraste, interceptores Axios)
- **Elementos corregidos/adaptados:** ~25% (compatibilidad de claims JWT de .NET, ciclo circular de serialización JSON en backend, aserciones DOM responsivas en Testing Library, tipos de Vitest)
- **Elementos descartados:** 0% (todos los módulos generados fueron refinados e incorporados al producto final)
