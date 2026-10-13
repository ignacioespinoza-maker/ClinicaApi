# Guion y Material de Apoyo para la Exposición Final
## Evaluación UT2: Consumo de APIs RESTful, Seguridad y Accesibilidad

- **Estudiante:** Ignacio Espinoza
- **Asignatura:** Lenguaje de Programación Web II
- **Tiempo estimado:** 15 minutos (Presentación + Demostración en Vivo + Preguntas)

---

## 1. Estructura de Diapositivas (Contenido Teórico y Arquitectura)

### Diapositiva 1: Portada
- **Título:** Sistema Integral de Evaluaciones Clínicas
- **Subtítulo:** Consumo de APIs RESTful con React, Autenticación JWT, Seguridad de Extremo a Extremo y Accesibilidad WCAG 2.2 AA
- **Autor:** Ignacio Espinoza | Docente: Enso Guidotti

---

### Diapositiva 2: Caso de Negocio y Arquitectura General
- **Problema:** Gestión digital de evaluaciones neurológicas y kinesiológicas con segregación de funciones clínicas.
- **Backend (.NET 10 Minimal APIs):**
  - Entity Framework Core sobre SQL Server (`EvaluacionesClinicasDB`).
  - Patrón Repository (`IEvaluacionRepository`).
  - Middlewares propios: `RequestLoggingMiddleware`, `SecurityHeadersMiddleware`, `GlobalErrorHandlingMiddleware`.
- **Frontend (React 19 + Vite + TypeScript):**
  - Arquitectura en capas: Types, Services, Context, Components, Views.
  - Cliente HTTP centralizado con Axios e interceptores.
  - Enrutamiento protegido por roles con React Router.

---

### Diapositiva 3: Flujo de Autenticación y Autorización
- **Autenticación JWT:**
  - Login contra `/api/v1/usuarios/login` (emisión de Bearer token con 60 min de vigencia).
  - Almacenamiento en `sessionStorage` (aislado a la pestaña, mitigando persistencia en disco de `localStorage`).
  - Interceptor inyecta cabecera `Authorization: Bearer <token>`.
  - Detección de expiración (401) con cierre de sesión y redirección.
- **Autorización basada en Roles (RBAC):**
  - `Especialista`: Lectura, creación, modificación y eliminación de diagnósticos.
  - `Asistente`: Consulta de diagnósticos, catálogo de signos y registro de pacientes.
  - Doble barrera: `ProtectedRoute` en interfaz y atributo `[Authorize(Roles = "...")]` en backend.

---

### Diapositiva 4: Matriz de Seguridad OWASP Aplicada
1. **Top 10 Web Injection / XSS:** Renderizado seguro en React (sin `dangerouslySetInnerHTML`) y cabecera `X-Content-Type-Options: nosniff`.
2. **API2 Broken Authentication:** Tokens Bearer en `sessionStorage`, fuera de URLs y sin exponer en consola.
3. **API5 Broken Function Level Authorization:** Bloqueo de rutas y validación obligatoria en servidor con respuesta `403 Forbidden`.
4. **API4 Unrestricted Resource Consumption:** Rate limiting estricto de 10 peticiones/min en login contra ataques de fuerza bruta (HTTP 429).
5. **API8 Security Misconfiguration:** CORS restringido a `http://localhost:5173`, cabeceras `X-Frame-Options: DENY`, `Referrer-Policy` y errores RFC 7807 sin stack traces.
6. **API10 Unsafe Consumption:** Validación previa de formularios con esquemas Zod.

---

### Diapositiva 5: Accesibilidad WCAG 2.2 AA y Diseño Responsivo
- **Accesibilidad:**
  - Landmarks semánticos y botón *Skip Link* ("Saltar al contenido principal").
  - Formularios con etiquetas asociadas (`<label htmlFor>`), `aria-describedby` y `aria-invalid`.
  - Navegación completa por teclado con foco visible de alto contraste (3px).
  - Modal accesible `role="alertdialog"` con trampa de foco y soporte de tecla `Escape`.
  - Contraste superior a 4.5:1 (texto general 16.5:1, botones 8.5:1).
- **Diseño Mobile-First:**
  - Transformación automática de tabla a tarjetas en móviles (< 768 px).
  - Objetivos táctiles mínimos de **44 × 44 px** (`min-touch`).
  - Sin scroll horizontal ni solapamientos al aplicar zoom del 200%.

---

## 2. Guion Paso a Paso para la Demostración en Vivo (Live Demo Script)

Sigue este orden exacto durante la exposición ante el docente:

### Paso 1: Demostración de Navegación por Teclado y Accesibilidad
1. Abre el navegador en `http://localhost:5173/login`.
2. **Suelta el mouse** y presiona `Tab`:
   - Muestra cómo aparece el enlace *"Saltar al contenido principal"* (Skip Link).
   - Presiona `Tab` nuevamente para recorrer los inputs con su foco visible azul de 3px.
3. Presiona `Tab` hasta el botón *"Dr. Admin (Especialista)"* y pulsa `Enter` para cargar las credenciales.
4. Presiona `Enter` sobre *"Iniciar Sesión"* para ingresar al Dashboard.

### Paso 2: Demostración del CRUD Completo como Especialista
1. En el Dashboard, navega a **Evaluaciones** (o `/evaluaciones`).
2. Muestra la tabla en escritorio con los datos reales de SQL Server (`Ataxia Positiva`, `Signo de Gowers Presente`).
3. Prueba la barra de búsqueda en tiempo real escribiendo `"Ana"` o `"Ataxia"`.
4. Haz clic en **Nueva Evaluación**:
   - Selecciona un paciente del menú desplegable (recurso relacionado).
   - Selecciona un signo clínico (categorizado).
   - Escribe un resultado y una observación.
   - Guarda el registro y muestra que aparece inmediatamente en la tabla.
5. Haz clic en **Detalle** (icono de ojo) para ver la vista detallada.
6. Haz clic en **Editar** para modificar una observación.
7. Haz clic en **Eliminar**:
   - Muestra el modal accesible `ConfirmModal` (`role="alertdialog"`).
   - Presiona `Escape` para demostrar que se cancela.
   - Vuelve a presionar eliminar y confirma con `Enter`: muestra el mensaje de éxito verde.

### Paso 3: Demostración de Control de Acceso por Roles (403 Forbidden)
1. Cierra sesión haciendo clic en **Salir**.
2. Inicia sesión como **Asistente** (`asistente_01` con contraseña `hash_simulado_aqui_456`).
3. Muestra en el Navbar que el badge ahora indica **ASISTENTE**.
4. En el listado de evaluaciones, muestra que los botones de *Editar*, *Eliminar* y *Nueva Evaluación* no están disponibles o muestran restricción.
5. **Intento de elusión:** Escribe manualmente en la barra del navegador `http://localhost:5173/evaluaciones/nueva`.
   - Se evidencia que `ProtectedRoute` intercepta la petición y redirige a `/acceso-denegado` (403).
6. En la pantalla de Acceso Denegado, haz clic en el botón **"Demostrar Bloqueo 403 del Backend en Vivo"**:
   - Muestra en pantalla que la API en .NET respondió con **403 Forbidden**, confirmando que la seguridad reside en el servidor.

### Paso 4: Demostración de Neutralización de Inyecciones (XSS)
1. Inicia sesión nuevamente como Especialista.
2. Ve a Nueva Evaluación e ingresa en observaciones:
   `<script>alert('Ataque XSS');</script>`
3. Guarda el registro y abre el detalle.
4. Muestra que el texto se visualiza como texto inofensivo y que ningún script es ejecutado en el navegador.

### Paso 5: Demostración de Diseño Responsivo Mobile-First
1. Abre las herramientas de desarrollo (`F12`) y activa el emulador de dispositivos móviles (ej: iPhone o resolución de 375 px).
2. Muestra que la tabla se reorganiza limpiamente en **tarjetas verticales** legibles.
3. Muestra que los botones respetan las dimensiones táctiles de al menos 44 × 44 px sin scroll horizontal.
4. Muestra el menú móvil desplegable accesible (hamburguesa).

### Paso 6: Demostración de Pruebas Automatizadas
1. En la consola del frontend: ejecuta `npm test` y muestra que las **10 pruebas pasan al 100%**.
2. En la consola del backend: ejecuta `dotnet test` y muestra que las **6 pruebas de integración pasan al 100%**.
3. Ejecuta `npm audit` y muestra **0 vulnerabilidades**.
