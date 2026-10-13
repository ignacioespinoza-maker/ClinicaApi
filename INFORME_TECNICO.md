# Informe Técnico de Arquitectura, Seguridad y Accesibilidad
## Proyecto: Sistema de Evaluaciones Clínicas (Evaluación UT2 - LPW II)

- **Estudiante:** Ignacio Espinoza
- **Asignatura:** Lenguaje de Programación Web II
- **Unidad Temática:** UT2 - Consumo de APIs RESTful desde Frontend, Seguridad de Extremo a Extremo y Accesibilidad
- **Docente:** Enso Guidotti
- **Fecha:** Octubre 2026

---

## 1. Resumen Ejecutivo y Caso de Negocio

El presente informe detalla las decisiones de diseño arquitectónico, las medidas de mitigación de vulnerabilidades (OWASP), las garantías de accesibilidad (WCAG 2.2 nivel AA) y los controles de autorización implementados en la aplicación frontend construida con React, Vite y TypeScript, en integración directa con la API RESTful de Evaluaciones Clínicas desarrollada en .NET 10.

El caso de negocio gestiona evaluaciones clínicas y diagnósticos motores/físicos sobre pacientes atendidos, articulando:
1. **Recurso principal:** `Evaluacion` (operación CRUD completa: listado con búsqueda/filtros, detalle clínico, creación, edición y eliminación con confirmación accesible).
2. **Recursos relacionados:** `Paciente` (registro y listado), `SignoClinico` (pruebas clínicas estructuradas) y `CategoriaExamen` (clasificación diagnóstica neurológica y física).
3. **Control de acceso por roles:** `Especialista` (privilegios plenos de lectura y escritura diagnóstica) y `Asistente` (privilegios restringidos de lectura y registro de pacientes).

---

## 2. Decisiones de Diseño Arquitectónico del Frontend

### 2.1 Framework y Herramienta de Construcción
- **Elección:** React 19 con Vite 8 y TypeScript.
- **Justificación:** Vite ofrece arranque instantáneo (*HMR* ultrarrápido) y un pipeline de empaquetado optimizado mediante Rollup. TypeScript proporciona verificación estática de tipos en tiempo de compilación, eliminando fallos en tiempo de ejecución al interactuar con los contratos y DTOs de la API.

### 2.2 Estructura del Proyecto por Capas y Responsabilidades
El frontend adopta una arquitectura desacoplada por capas:
```
clinica-frontend/
├── src/
│   ├── types/          # DTOs e interfaces que reflejan el contrato de la API
│   ├── services/       # Cliente HTTP centralizado y llamadas a endpoints
│   ├── context/        # Estado global de autenticación y sesión JWT
│   ├── components/     # Componentes visuales reutilizables y accesibles
│   ├── views/          # Vistas principales de la aplicación (páginas)
│   ├── test/           # Pruebas automatizadas de componentes (Vitest)
│   ├── index.css       # Sistema de estilos accesible mobile-first
│   └── App.tsx         # Enrutamiento y control de acceso (React Router)
└── e2e/                # Pruebas de integración de extremo a extremo (Playwright)
```

### 2.3 Capa de Consumo de Servicios HTTP Centralizada
- **Cliente:** Axios configurado en `src/services/apiClient.ts` utilizando la variable de entorno `VITE_API_URL`.
- **Interceptor de Petición:** Inserta de forma transparente la cabecera `Authorization: Bearer <token>` cuando existe un token activo.
- **Interceptor de Respuesta:** 
  - Captura respuestas `401 Unauthorized` por token expirado, limpia el estado de sesión y redirige al login.
  - Captura respuestas `403 Forbidden` por rol insuficiente y emite eventos de acceso denegado.
  - Captura respuestas `429 Too Many Requests` (Rate Limiting) y traduce el error a un mensaje comprensible.
  - Normaliza errores de validación de ASP.NET ProblemDetails (`errors`) en textos legibles para la interfaz.

### 2.4 Manejo de Estado Asíncrono y Formularios
- **Formularios:** React Hook Form integrado con validación de esquemas Zod (`@hookform/resolvers/zod`). Esto permite validaciones declarativas, rendimiento óptimo sin re-renderizados innecesarios y asociación semántica de errores a campos (`aria-invalid` y `aria-describedby`).
- **Estados de Interfaz:** Cada vista implementa de forma explícita los tres estados fundamentales:
  1. *Carga:* `LoadingSkeleton` con `aria-busy="true"` y texto para lectores de pantalla.
  2. *Error:* Alertas accesibles con `role="alert"` y `aria-live="assertive"`.
  3. *Vacío:* Ilustraciones y mensajes orientativos cuando no hay datos registrados o no coinciden con los filtros.

---

## 3. Estrategia de Autenticación JWT y Almacenamiento del Token

### 3.1 Estrategia Seleccionada: `sessionStorage` con Justificación y Análisis de Riesgos

| Estrategia | Ventajas | Riesgos de Seguridad | Mitigación Aplicada en el Proyecto |
| :--- | :--- | :--- | :--- |
| **`sessionStorage` (Seleccionada)** | El token se aísla a la pestaña activa del navegador y se destruye automáticamente al cerrarla. No persiste indefinidamente en disco. Inmune a ataques CSRF al enviarse por cabecera `Authorization`. | Vulnerable si existiera una inyección de script malicioso (XSS). | **Erradicación de XSS:** No se utiliza `dangerouslySetInnerHTML`; React escapa todo el texto por defecto; validación de esquema en entradas y respuestas; cabecera `Content-Security-Policy`. |
| **`localStorage` (Descartada)** | Persiste entre pestañas y reinicios. | Persistencia indefinida del token en disco, aumentando la ventana de ataque ante robo de dispositivo o malware local. | No aplicable (descartado por exceso de persistencia). |
| **`HttpOnly Cookie` (Alternativa)** | Inaccesible desde JavaScript (mitiga XSS directo). | Requiere mitigar CSRF (tokens SameSite y anti-CSRF), configuración estricta de dominios y certificados cruzados en desarrollo. | No aplicable para este consumo SPA desacoplado; Bearer en header es estándar en REST. |

### 3.2 Ciclo de Vida del Token
- **Expiración:** El token tiene una vida útil corta emitida por el backend (60 minutos).
- **Inspección de expiración en cliente:** Antes de usar el token, el cliente decodifica el claim `exp`. Si está vencido, lo destruye de inmediato.
- **Logout Seguro:** Limpia `sessionStorage`, resetea el contexto en memoria y redirige a `/login`.

---

## 4. Matriz de Riesgos Mitigados (OWASP Top 10)

Se mitigaron formalmente **6 riesgos** de seguridad (4 del lado cliente y 2 del lado servidor), superando el mínimo exigido de 5 riesgos (3 en cliente).

| # | Riesgo de Seguridad | Referencia OWASP | Lado | Ubicación en el Código | Mitigación Implementada | Evidencia Verificable |
| :-: | :--- | :--- | :-: | :--- | :--- | :--- |
| **1** | **Cross-Site Scripting (XSS)** | Top 10 Web: Injection | Cliente | `src/views/*`, `src/components/*` | Se prohibió el uso de `dangerouslySetInnerHTML`. Todos los datos del paciente y diagnóstico se renderizan como nodos de texto escapados por React. Adicionalmente, el servidor inyecta la cabecera `X-Content-Type-Options: nosniff`. | Inyección de `<script>alert('xss')</script>` en observaciones es renderizada textualmente sin ejecutarse. |
| **2** | **Robo o Filtración de Tokens** | API2:2023 Broken Authentication | Cliente | `src/services/apiClient.ts`, `src/services/authService.ts` | Almacenamiento limitado a `sessionStorage`, token transmitido exclusivamente en cabecera HTTP Bearer (nunca en query strings o URLs), y limpieza inmediata del token ante respuestas 401 o cierre de sesión. No se imprimen tokens en `console.log`. | Inspección de URLs de navegación y llamadas de red: el token nunca viaja en la URL. `sessionStorage` se limpia en logout. |
| **3** | **Control de Acceso a Nivel de Función** | API5:2023 Broken Function Level Authorization | Ambos | `src/components/ProtectedRoute.tsx`, `ClinicaApi/Endpoints/EvaluacionApi.cs` | **Cliente:** Rutas protegidas (`/evaluaciones/nueva`, `/editar`) restringidas a rol `Especialista`. Ocultamiento condicional de acciones destructivas.<br>**Servidor:** Atributo `[Authorize(Roles = "Especialista")]` en endpoints POST, PUT, DELETE. | Prueba unitaria y test E2E: Usuario `asistente_01` es bloqueado en frontend hacia `/acceso-denegado` y el backend rechaza con código HTTP `403 Forbidden`. |
| **4** | **Consumo de Respuestas Inseguras y Validación** | API10:2023 Unsafe Consumption / Web Injection | Cliente | `src/views/EvaluacionFormView.tsx`, `src/types/evaluacion.ts` | Validación estricta con esquemas Zod en formularios antes del envío y tipado riguroso de las respuestas recibidas. Manejo seguro de campos nulos o inesperados. | Intento de enviar campos con tipos incorrectos es interceptado antes de la petición con mensajes asociados accesibles. |
| **5** | **Fuerza Bruta y Consumo sin Límites** | API4:2023 Unrestricted Resource Consumption | Ambos | `ClinicaApi/Program.cs`, `ClinicaApi/Endpoints/UsuarioApi.cs`, `src/services/apiClient.ts` | **Servidor:** Middleware `AddRateLimiter` con limitador estricto `LoginLimiter` (máximo 10 peticiones/minuto por IP en `/api/v1/usuarios/login`).<br>**Cliente:** Captura de código HTTP 429 con mensaje instructivo de espera. | Peticiones consecutivas superando el límite devuelven HTTP 429 Too Many Requests. |
| **6** | **Configuración Insegura (CORS, Cabeceras y Errores)** | API8:2023 Security Misconfiguration | Servidor | `ClinicaApi/Program.cs`, `ClinicaApi/Middlewares/*` | **CORS:** Restringido explícitamente al origen del frontend (`http://localhost:5173`).<br>**Cabeceras:** Middleware propio inyecta `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.<br>**Manejo de Errores:** Middleware global que captura excepciones y devuelve RFC 7807 sin trazas internas ni cadenas de conexión. | Prueba automatizada `CabecerasSeguridad_EstanPresentesEnRespuestas` superada en la suite xUnit. |

---

## 5. Accesibilidad (WCAG 2.2 Nivel AA) y Diseño Responsivo

### 5.1 Cumplimiento de Criterios WCAG 2.2 AA
1. **HTML Semántico y Landmarks:**
   - Estructura delimitada con `<header>`, `<nav role="navigation">`, `<main id="main-content">`, `<section>` y `<footer role="contentinfo">`.
   - Jerarquía lógica estricta de encabezados (`<h1>` único por vista, seguido de `<h2>` y `<h3>`).
   - Botón accesible *Skip Link* ("Saltar al contenido principal") en la parte superior para usuarios de teclado.
2. **Formularios Accesibles:**
   - Cada campo cuenta con su etiqueta asociada mediante `<label htmlFor="...">`.
   - Los errores se vinculan directamente mediante `aria-describedby` y el estado se marca con `aria-invalid="true"`.
   - Mensajes de error y estados dinámicos anunciados a lectores de pantalla mediante `aria-live="polite"` o `role="alert"`.
3. **Navegación por Teclado y Foco Visible:**
   - Anillo de foco de alto contraste `:focus-visible` (3px sólido con offset de 2px).
   - Diálogo modal de confirmación con captura de foco (*focus trap*), soporte de tecla `Escape` y retorno del foco al elemento desencadenador.
4. **Contraste de Color:**
   - Texto principal (`#0f172a`) sobre fondo claro (`#ffffff`): ratio **16.5:1** (supera con holgura el mínimo de 4.5:1).
   - Botón primario (`#1e40af`): ratio **8.5:1** (cumple nivel AAA para texto normal).
   - Mensajes de peligro (`#b91c1c`): ratio **6.5:1**.
   - Ninguna información depende únicamente del color: los resultados médicos combinan texto explícito e iconos con texto descriptivo.
5. **Idioma:**
   - Atributo `lang="es"` definido en el elemento `<html>`.

### 5.2 Diseño Responsivo Mobile-First
- **Viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`.
- **Adaptabilidad fluida:** Maquetación sin scroll horizontal desde **320 px** de ancho (móviles compactos) hasta pantallas ultra-anchas.
- **Transformación de tablas a tarjetas:** En pantallas móviles (< 768 px), la tabla de evaluaciones se transforma automáticamente en un listado de tarjetas interactivas optimizadas para visualización táctil.
- **Tamaño de objetivos táctiles (Target Size):** Todos los botones, enlaces y selectores cumplen el tamaño mínimo de **44 × 44 px** (`min-touch`) exigido por las pautas WCAG.
- **Soporte de zoom:** El contenido se reorganiza sin pérdida de funcionalidad al ampliar el texto hasta el 200%.

---

## 6. Ajustes Realizados a la API del Trabajo 1

En cumplimiento del requisito del enunciado: *"Si la API del Trabajo 1 presenta fallas que impiden su consumo, el o la estudiante debe corregirlas como parte de este trabajo y dejar esos ajustes documentados en el repositorio"*, se realizaron las siguientes correcciones en `ClinicaApi`:

1. **Corrección de CORS:** Se reemplazó el origen estático por la lectura de configuración permitiendo el puerto `http://localhost:5173` de Vite.
2. **Incorporación del Endpoint Detalle (`GET /api/v1/evaluaciones/{id}`):** La API original solo disponía del listado general. Se implementó el endpoint individual para permitir la consulta detallada y la carga inicial del formulario de edición.
3. **Resolución de Ciclos de Referencia JSON en Entity Framework:** Al registrar o actualizar evaluaciones, el endpoint devolvía la entidad EF Core directamente, provocando excepciones circulares (`JsonException: A possible object cycle was detected`). Se implementó el DTO `EvaluacionDto` que aísla las entidades y desacopla la respuesta.
4. **Protección contra Suplantación de Usuario (OWASP BOLA):** Si la petición POST no especifica `idUsuario`, se extrae directamente del claim del JWT autenticado (`ClaimTypes.NameIdentifier`).
5. **Middleware de Seguridad y Manejo de Errores:** Se agregaron `SecurityHeadersMiddleware` (cabeceras de seguridad) y `GlobalErrorHandlingMiddleware` (prevención de fuga de stack traces en formato RFC 7807).

---

## 7. Conclusión
El sistema resultante ofrece una experiencia clínica robusta, intuitiva y accesible, con una separación estricta de responsabilidades entre cliente y servidor. Las medidas de seguridad OWASP protegen los activos de información en ambas capas, garantizando que el frontend sea seguro ante entradas indebidas y que la API valide rigurosamente cada operación.
