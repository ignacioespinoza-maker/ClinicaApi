# Sistema Integral de Evaluaciones Clínicas
## Monorepo: Backend RESTful (.NET 10) + Frontend (React 19, Vite, TypeScript)

Proyecto desarrollado para la **Evaluación 2 (UT2)** de la asignatura **Lenguaje de Programación Web II**.

- **Estudiante:** Ignacio Espinoza
- **Docente:** Enso Guidotti
- **Institución:** IP / CFT 2026

---

## 1. Descripción del Proyecto

El sistema gestiona de forma integral las **Evaluaciones Clínicas** (diagnósticos de coordinación motora, pruebas de ataxia, signo de Gowers, etc.) sobre pacientes registrados, integrando:
1. **Backend RESTful:** Construido con .NET 10 Minimal APIs, Entity Framework Core, SQL Server (`EvaluacionesClinicasDB`), autenticación JWT, Rate Limiting, CORS estricto y documentación interactiva Scalar / OpenAPI.
2. **Frontend SPA:** Desarrollado con React 19, Vite 8 y TypeScript, con cliente HTTP centralizado en Axios, manejo asíncrono de estado, formularios validados con Zod, control de acceso por roles (`Especialista` y `Asistente`), diseño responsivo mobile-first y accesibilidad certificada bajo pautas **WCAG 2.2 Nivel AA**.

---

## 2. Estructura del Repositorio (Monorepo)

```text
ClinicaApi_repo/
├── ClinicaApi/                    # Backend Web API (.NET 10)
│   ├── Endpoints/                 # Minimal API Endpoints (Evaluaciones, Pacientes, Catálogos, Auth)
│   ├── Middlewares/               # Middlewares (Logging, Cabeceras de Seguridad, Error Global)
│   ├── Models/                    # Entidades y DbContext de Entity Framework Core
│   ├── Repositories/              # Patrón Repository (IEvaluacionRepository)
│   ├── Services/                  # Servicios de autenticación y lógica de negocio
│   ├── appsettings.json           # Configuración de base de datos y llaves JWT
│   └── .env.example               # Variables de entorno de referencia para el backend
├── ClinicaApi.Tests/              # Suite de Pruebas de Integración y Seguridad del Backend (xUnit)
│   └── SeguridadTests.cs          # Tests de 401, 403, CORS, Cabeceras y CRUD en API
├── clinica-frontend/              # Frontend React + TypeScript (Vite)
│   ├── src/
│   │   ├── types/                 # Interfaces y DTOs de TypeScript
│   │   ├── services/              # Cliente Axios centralizado e interceptores
│   │   ├── context/               # AuthContext con gestión de sesión JWT en sessionStorage
│   │   ├── components/            # Componentes accesibles (Navbar, ConfirmModal, FeedbackAlert, SkipLink)
│   │   ├── views/                 # Vistas (Login, Dashboard, Evaluaciones CRUD, Pacientes, Acceso Denegado)
│   │   ├── test/                  # Pruebas de componentes con Vitest y Testing Library
│   │   ├── index.css              # Sistema de estilos accesible con ratios WCAG AA y mobile-first
│   │   └── App.tsx                # Rutas y guards de autorización con React Router
│   ├── e2e/                       # Pruebas End-to-End con Playwright (Login -> Crear -> Listar)
│   └── .env.example               # Variables de entorno de referencia para el frontend
├── INFORME_TECNICO.md             # Informe técnico con decisiones de diseño y matriz OWASP
├── AI_LOG.md                      # Bitácora de uso de IA generativa (herramienta, prompts y decisiones)
├── SECURITY_EVIDENCE.md           # Evidencia verificable de controles de seguridad (401, 403, XSS, CORS)
├── ACCESSIBILITY_EVIDENCE.md      # Evidencia de accesibilidad WCAG 2.2 AA y diseño responsivo
├── TEST_EVIDENCE.md               # Reporte de resultados de suites de prueba backend y frontend
├── PRESENTACION_DEFENSA.md        # Guion y diapositivas para la exposición y demostración en vivo
└── README.md                      # Instrucciones generales de instalación y ejecución
```

---

## 3. Cuentas de Demostración y Roles del Sistema

| Usuario | Contraseña | Rol Asignado | Privilegios en el Sistema |
| :--- | :--- | :--- | :--- |
| `dr_admin` | `hash_simulado_aqui_123` | **Especialista** | Acceso pleno: Consultar, crear, editar y eliminar evaluaciones clínicas, ver detalle y registrar pacientes. |
| `asistente_01` | `hash_simulado_aqui_456` | **Asistente** | Acceso restringido: Consultar evaluaciones y catálogo clínico, registrar pacientes. Las acciones de modificación y creación de diagnósticos están bloqueadas (403). |

---

## 4. Requisitos Previos

- [.NET 10 SDK](https://dotnet.microsoft.com/download) (o .NET 8/9/10 compatible)
- [Microsoft SQL Server](https://www.microsoft.com/sql-server/) (ej: `SQLEXPRESS` o LocalDB)
- [Node.js](https://nodejs.org/) v20+ y `npm` v10+

---

## 5. Instrucciones de Instalación y Ejecución

### Paso 1: Configurar la Base de Datos SQL Server
1. Abre SQL Server Management Studio o ejecuta mediante `sqlcmd`:
   ```bash
   sqlcmd -S ".\SQLEXPRESS" -E -i "ClinicaApi/clinica.sql"
   ```
2. La base de datos `EvaluacionesClinicasDB` se creará con las tablas `Usuario`, `Paciente`, `CategoriaExamen`, `SignoClinico` y `Evaluacion`, junto con sus registros semilla.

### Paso 2: Ejecutar el Backend (.NET 10)
1. Navega a la carpeta del backend:
   ```bash
   cd ClinicaApi
   ```
2. Revisa o copia el archivo de variables:
   ```bash
   copy .env.example .env
   ```
3. Inicia la API:
   ```bash
   dotnet run
   ```
4. El backend quedará disponible en:
   - **HTTPS:** `https://localhost:7217`
   - **HTTP:** `http://localhost:5103`
   - **Documentación Interactiva (Scalar):** `https://localhost:7217/scalar/v1`

### Paso 3: Ejecutar el Frontend (React + Vite)
1. En una nueva terminal, navega al directorio del frontend:
   ```bash
   cd clinica-frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Copia el archivo `.env.example` a `.env` (si aún no existe):
   ```bash
   copy .env.example .env
   ```
4. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
5. Abre en tu navegador: [http://localhost:5173](http://localhost:5173)

---

## 6. Ejecución de Pruebas Automatizadas

### Pruebas del Backend (xUnit)
Desde la raíz del repositorio o dentro de `ClinicaApi.Tests`:
```bash
dotnet test ClinicaApi.slnx
```
> Ejecuta 6 pruebas de integración que validan: autenticación fallida (401), acceso sin token (401), presencia de cabeceras de seguridad HTTP, login exitoso con emisión de JWT (200), restricción de rol Asistente (403 Forbidden), y flujo de creación/detalle por Especialista (201/200).

### Pruebas de Componentes del Frontend (Vitest)
Dentro de la carpeta `clinica-frontend`:
```bash
npm test
```
> Ejecuta 10 pruebas unitarias que cubren: render y validación accesible de login (Zod), interceptor de errores 401 con `role="alert"`, guards de rutas protegidas y autorización por roles (403), y operación de CRUD con diálogo modal de confirmación accesible.

### Auditoría de Seguridad de Dependencias
Dentro de la carpeta `clinica-frontend`:
```bash
npm audit
```
> Verifica que el bundle no contiene vulnerabilidades conocidas en dependencias de terceros (0 vulnerabilidades).

---

## 7. Documentación Complementaria de Entrega

Para la revisión exhaustiva y la rúbrica de evaluación, consulta los siguientes documentos en la raíz del repositorio:
- [INFORME_TECNICO.md](file:///./INFORME_TECNICO.md): Decisiones de arquitectura, justificación del almacenamiento del token y matriz detallada de mitigación OWASP.
- [AI_LOG.md](file:///./AI_LOG.md): Declaración y bitácora transparente de uso de IA generativa (prompts, modelo, plan y decisiones).
- [SECURITY_EVIDENCE.md](file:///./SECURITY_EVIDENCE.md): Evidencias verificables de respuestas 401, 403, Rate Limiting (429), XSS neutralizado y cabeceras HTTP.
- [ACCESSIBILITY_EVIDENCE.md](file:///./ACCESSIBILITY_EVIDENCE.md): Registro de revisión manual con teclado, lector de pantalla y diseño mobile-first WCAG 2.2 AA.
- [TEST_EVIDENCE.md](file:///./TEST_EVIDENCE.md): Registro de salida de pruebas automatizadas frontend y backend.
- [PRESENTACION_DEFENSA.md](file:///./PRESENTACION_DEFENSA.md): Diapositivas sintetizadas y guion paso a paso para la demostración en vivo de 15 minutos.
