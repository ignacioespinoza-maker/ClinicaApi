# Evidencia de Accesibilidad (WCAG 2.2 Nivel AA) y Diseño Responsivo
## Proyecto: Sistema de Evaluaciones Clínicas (UT2)

---

## 1. Cumplimiento de Pautas WCAG 2.2 Nivel AA

| Criterio WCAG 2.2 | Nivel | Descripción del Requisito | Implementación en el Proyecto | Estado |
| :--- | :-: | :--- | :--- | :-: |
| **1.1.1 Non-text Content** | A | Todo contenido no textual posee alternativa equivalente. | Todos los iconos Lucide incluyen `aria-hidden="true"` cuando son decorativos, o texto descriptivo y `aria-label` cuando son interactivos. | **Cumplido** |
| **1.3.1 Info and Relationships** | A | La información y estructura se determinan por código. | Landmarks semánticos (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`), encabezados jerárquicos (`h1`, `h2`, `h3`), tablas con `<caption>` y `<th scope="col">`. | **Cumplido** |
| **1.4.1 Use of Color** | A | El color no es el único medio para transmitir información. | Los resultados clínicos presentan badges textuales explícitos acompañados de iconos semánticos. | **Cumplido** |
| **1.4.3 Contrast (Minimum)** | AA | Ratio de contraste de al menos 4.5:1 en texto normal. | Texto principal sobre fondo blanco tiene ratio de **16.5:1**. Botón primario `#1e40af` tiene ratio de **8.5:1**. Botón de peligro `#b91c1c` tiene ratio de **6.5:1**. | **Cumplido** |
| **1.4.4 Resize Text** | AA | El texto se amplía hasta 200% sin pérdida de contenido. | Unidades relativas (`rem`, `%`), layouts fluidos con Flexbox/Grid y contenedor sin overflow horizontal forzado. | **Cumplido** |
| **2.1.1 Keyboard** | A | Toda la funcionalidad es operable mediante teclado. | Navegación completa con teclas `Tab`, `Shift+Tab`, `Enter`, `Espacio` y `Escape`. | **Cumplido** |
| **2.4.1 Bypass Blocks** | A | Mecanismo para saltar bloques repetitivos. | Componente `SkipLink.tsx` accesible en primer foco ("Saltar al contenido principal"). | **Cumplido** |
| **2.4.7 Focus Visible** | AA | El indicador de foco es claramente visible. | Estilo `:focus-visible` con anillo de 3px sólido azul `#2563eb` y offset de 2px en todos los elementos interactivos. | **Cumplido** |
| **2.5.8 Target Size (Minimum)** | AA | Objetivos táctiles de al menos 24x24 px (proyecto aplica 44x44 px). | Clase utilitaria `.min-touch` aplicada a botones, selectores y enlaces asegurando mínimo **44 × 44 px**. | **Cumplido** |
| **3.1.1 Language of Page** | A | Idioma predeterminado definido en la página. | `<html lang="es">` declarado en `index.html`. | **Cumplido** |
| **3.3.2 Labels or Instructions** | A | Formularios con etiquetas e instrucciones claras. | Cada `<input>`, `<select>` y `<textarea>` tiene su `<label htmlFor="...">` y texto de ayuda `.field-hint`. | **Cumplido** |
| **4.1.3 Status Messages** | AA | Mensajes de estado anunciados por tecnologías de asistencia. | Notificaciones y alertas utilizan `role="status"` o `role="alert"` con `aria-live="polite"` o `aria-live="assertive"`. | **Cumplido** |

---

## 2. Registro de Revisión Manual con Teclado

Se ejecutó una prueba de navegación integral prescindiendo totalmente del mouse:

1. **Ruta `/login`:**
   - Al presionar `Tab`, el foco ingresa ordenadamente: *Skip Link* -> *Campo Nombre de Usuario* -> *Campo Contraseña* -> *Botón Iniciar Sesión* -> *Botones Demo*.
   - El anillo de foco es nítido e inconfundible.
   - Presionar `Enter` en cualquier botón demo carga las credenciales y al presionar `Enter` en el formulario se procesa la autenticación.
2. **Navegación en Barra Superior (`Navbar`):**
   - El foco recorre el logotipo, enlaces *Panel*, *Evaluaciones*, *Pacientes* y finalmente el botón *Salir*.
3. **Listado de Evaluaciones y Diálogo Modal (`ConfirmModal`):**
   - Al tabular sobre el botón *Eliminar* y pulsar `Enter`, se abre el modal accesible con `role="alertdialog"`.
   - El foco es capturado (*focus trap*) de inmediato dentro del modal en el botón de confirmación.
   - Tabular circula únicamente entre *Cancelar* y *Sí, Eliminar*.
   - Al pulsar la tecla `Escape`, el modal se cierra y el foco regresa al botón que lo originó.

---

## 3. Registro de Revisión con Lector de Pantalla (NVDA / Narrador)

- **Landmarks identificados:** El lector anuncia correctamente las zonas *"Encabezado de página"*, *"Navegación principal"*, *"Contenido principal"* y *"Pie de página"*.
- **Asociación de Errores en Formularios:**
  - Al posicionarse en un campo inválido, el lector verbaliza: *"Nombre de Usuario, obligatorio, inválido, El nombre de usuario es obligatorio"*.
  - Esto se debe al vínculo semántico entre `aria-invalid="true"` y `aria-describedby="nombreUsuario-error"`.
- **Anuncios Dinámicos de Alertas:**
  - La eliminación exitosa de un registro dispara un mensaje en la región `aria-live="polite"`, anunciado sin interrumpir la lectura actual del usuario.

---

## 4. Auditoría de Diseño Responsivo Mobile-First

Se verificó el comportamiento visual y funcional en tres rangos de resolución:

### 4.1 Móvil Compacto (320 px a 390 px)
- La tabla de evaluaciones se oculta de forma fluida y se activa la presentación en **tarjetas verticales** (`clinical-card`).
- Cada tarjeta presenta el identificador, resultado con badge contrastado, nombre del paciente, prueba, fecha y botones con target táctil mayor a 44x44 px.
- Cero scroll horizontal (`width: 100%`, `overflow-x: hidden`).
- Menú de navegación colapsado en botón hamburguesa con atributo `aria-expanded`.

### 4.2 Tableta (768 px a 1023 px)
- Se activa la tabla clínica con scroll horizontal interno delimitado (`table-responsive-wrapper`) en caso de celdas extensas.
- El panel de estadísticas del Dashboard se distribuye en una grilla de 3 columnas fluidas.

### 4.3 Escritorio (1024 px en adelante)
- Máxima legibilidad con contenedor centrado a `max-width: 1200px`.
- Tabla completa con acciones directas alineadas a la derecha.
