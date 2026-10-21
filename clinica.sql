-- =========================================================================================
-- PROYECTO: SISTEMA INTEGRAL DE EVALUACIONES CLÍNICAS (CLINICA API)
-- ASIGNATURA: LENGUAJE DE PROGRAMACIÓN WEB II | EVALUACIÓN UT2
-- ESTUDIANTE: IGNACIO ESPINOZA
-- MOTOR: MICROSOFT SQL SERVER 2019 / 2022 / AZURE SQL
-- SCRIPT: CREACIÓN Y CARGA INICIAL DE LA BASE DE DATOS [EvaluacionesClinicasDB]
-- FECHA DE ACTUALIZACIÓN: OCTUBRE 2026
-- =========================================================================================

USE [master];
GO

-- 1. Eliminación y recreación limpia de la base de datos
IF DB_ID('EvaluacionesClinicasDB') IS NOT NULL
BEGIN
    ALTER DATABASE [EvaluacionesClinicasDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [EvaluacionesClinicasDB];
END
GO

CREATE DATABASE [EvaluacionesClinicasDB];
GO

USE [EvaluacionesClinicasDB];
GO

-- =========================================================================================
-- TABLA 1: [dbo].[Usuario]
-- DESCRIPCIÓN: Almacena los profesionales clínicos y administrativos del sistema.
-- ROLES CLÍNICOS: 'Especialista' (Doctor facultado para evaluaciones) y 'Asistente' (Personal de apoyo).
-- CREDENCIAL ADMIN: Columna explícita [es_admin] (1 = Administrador facultado, 0 = Estándar).
-- AUDITORÍA Y CONTACTO: [nombre_completo], [email], [activo] (borrado lógico), [fecha_creacion], [ultimo_acceso].
-- =========================================================================================
CREATE TABLE [dbo].[Usuario](
    [id_usuario] [int] IDENTITY(1,1) NOT NULL,
    [nombre_usuario] [varchar](100) NOT NULL,
    [password_hash] [varchar](255) NOT NULL,
    [rol] [varchar](20) NOT NULL DEFAULT ('Asistente'),
    [es_admin] [bit] NOT NULL DEFAULT (0),
    [nombre_completo] [varchar](150) NULL,
    [email] [varchar](150) NULL,
    [activo] [bit] NOT NULL DEFAULT (1),
    [fecha_creacion] [datetime2] NOT NULL DEFAULT (GETDATE()),
    [ultimo_acceso] [datetime2] NULL,
    CONSTRAINT [PK_Usuario] PRIMARY KEY CLUSTERED ([id_usuario] ASC),
    CONSTRAINT [UQ_Usuario_Nombre] UNIQUE NONCLUSTERED ([nombre_usuario] ASC),
    CONSTRAINT [UQ_Usuario_Email] UNIQUE NONCLUSTERED ([email] ASC) WHERE [email] IS NOT NULL,
    CONSTRAINT [CK_Usuario_Rol] CHECK ([rol] IN ('Especialista', 'Asistente'))
) ON [PRIMARY];
GO

-- =========================================================================================
-- TABLA 2: [dbo].[Paciente]
-- DESCRIPCIÓN: Almacena el registro de pacientes atendidos en la clínica.
-- RESTRICCIONES: El RUT es único y debe cumplir el algoritmo Módulo 11 (XXXXXXXX-X).
-- =========================================================================================
CREATE TABLE [dbo].[Paciente](
    [id_paciente] [int] IDENTITY(1,1) NOT NULL,
    [rut] [varchar](12) NOT NULL,
    [nombre] [varchar](100) NOT NULL,
    [apellidos] [varchar](150) NOT NULL,
    [fecha_nacimiento] [date] NOT NULL,
    [telefono] [varchar](15) NULL,
    CONSTRAINT [PK_Paciente] PRIMARY KEY CLUSTERED ([id_paciente] ASC),
    CONSTRAINT [UQ_Paciente_Rut] UNIQUE NONCLUSTERED ([rut] ASC),
    CONSTRAINT [CK_Paciente_FechaNacimiento] CHECK ([fecha_nacimiento] <= GETDATE())
) ON [PRIMARY];
GO

-- =========================================================================================
-- TABLA 3: [dbo].[CategoriaExamen]
-- DESCRIPCIÓN: Catálogo de especialidades o áreas de examen físico/neurológico.
-- GESTIÓN: Puede ser creada y consultada por Doctores Especialistas y Asistentes.
-- =========================================================================================
CREATE TABLE [dbo].[CategoriaExamen](
    [id_categoria] [int] IDENTITY(1,1) NOT NULL,
    [nombre] [varchar](150) NOT NULL,
    [descripcion] [varchar](255) NULL,
    CONSTRAINT [PK_CategoriaExamen] PRIMARY KEY CLUSTERED ([id_categoria] ASC),
    CONSTRAINT [UQ_Categoria_Nombre] UNIQUE NONCLUSTERED ([nombre] ASC)
) ON [PRIMARY];
GO
 
-- =========================================================================================
-- TABLA 4: [dbo].[SignoClinico]
-- DESCRIPCIÓN: Pruebas, maniobras o signos clínicos asociados a una categoría de examen.
-- RELACIONES: Llave foránea hacia [CategoriaExamen] con restricción de integridad referencial.
-- GESTIÓN: Puede ser creada y consultada por Doctores Especialistas y Asistentes.
-- =========================================================================================
CREATE TABLE [dbo].[SignoClinico](
    [id_signo] [int] IDENTITY(1,1) NOT NULL,
    [nombre] [varchar](150) NOT NULL,
    [descripcion] [varchar](max) NULL,
    [id_categoria] [int] NOT NULL,
    CONSTRAINT [PK_SignoClinico] PRIMARY KEY CLUSTERED ([id_signo] ASC),
    CONSTRAINT [FK_Signo_Categoria] FOREIGN KEY([id_categoria]) 
        REFERENCES [dbo].[CategoriaExamen] ([id_categoria]) 
        ON UPDATE CASCADE 
        ON DELETE NO ACTION
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
GO

-- =========================================================================================
-- TABLA 5: [dbo].[Evaluacion]
-- DESCRIPCIÓN: Registro central de la evaluación clínica diagnóstica aplicada al paciente.
-- REGLA DE NEGOCIO: Exclusiva para creación y edición por Doctores Especialistas.
-- INTEGRIDAD: Si un usuario tiene evaluaciones registradas, NO puede ser eliminado del sistema.
-- =========================================================================================
CREATE TABLE [dbo].[Evaluacion](
    [id_evaluacion] [int] IDENTITY(1,1) NOT NULL,
    [fecha_evaluacion] [datetime] NOT NULL DEFAULT (GETDATE()),
    [observaciones] [varchar](max) NOT NULL,
    [resultado] [varchar](100) NOT NULL,
    [id_paciente] [int] NOT NULL,
    [id_usuario] [int] NOT NULL,
    [id_signo] [int] NOT NULL,
    CONSTRAINT [PK_Evaluacion] PRIMARY KEY CLUSTERED ([id_evaluacion] ASC),
    CONSTRAINT [FK_Evaluacion_Paciente] FOREIGN KEY([id_paciente]) 
        REFERENCES [dbo].[Paciente] ([id_paciente])
        ON UPDATE CASCADE
        ON DELETE NO ACTION,
    CONSTRAINT [FK_Evaluacion_Usuario] FOREIGN KEY([id_usuario]) 
        REFERENCES [dbo].[Usuario] ([id_usuario])
        ON UPDATE CASCADE
        ON DELETE NO ACTION,
    CONSTRAINT [FK_Evaluacion_Signo] FOREIGN KEY([id_signo]) 
        REFERENCES [dbo].[SignoClinico] ([id_signo])
        ON UPDATE CASCADE
        ON DELETE NO ACTION
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
GO

-- =========================================================================================
-- ÍNDICES DE RENDIMIENTO (Performance Optimization)
-- =========================================================================================
CREATE NONCLUSTERED INDEX [IX_Usuario_Rol]
    ON [dbo].[Usuario]([rol] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_Usuario_EsAdmin]
    ON [dbo].[Usuario]([es_admin] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_Usuario_Activo]
    ON [dbo].[Usuario]([activo] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_SignoClinico_Categoria] 
    ON [dbo].[SignoClinico]([id_categoria] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_Evaluacion_Paciente] 
    ON [dbo].[Evaluacion]([id_paciente] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_Evaluacion_Usuario] 
    ON [dbo].[Evaluacion]([id_usuario] ASC);
GO

CREATE NONCLUSTERED INDEX [IX_Evaluacion_Signo] 
    ON [dbo].[Evaluacion]([id_signo] ASC);
GO

-- =========================================================================================
-- DATOS SEMILLA (Seed Data)
-- =========================================================================================

-- 1. Usuarios:
--    - dr_admin: Doctor Especialista con Credencial de Administrador
--    - asistente_admin: Asistente Clínico con Credencial de Administrador
--    - asistente_01: Asistente Clínico Estándar (Sin privilegios de gestión de usuarios)
INSERT INTO [dbo].[Usuario] ([nombre_usuario], [password_hash], [rol], [es_admin], [nombre_completo], [email], [activo])
VALUES 
('dr_admin', 'hash_simulado_aqui_123', 'Especialista', 1, 'Dr. Roberto Admin', 'dr.admin@clinica.cl', 1),
('asistente_admin', 'hash_simulado_asistente_admin', 'Asistente', 1, 'Asistente Jefe Admin', 'asistente.admin@clinica.cl', 1),
('asistente_01', 'hash_simulado_aqui_456', 'Asistente', 0, 'Asistente Clínico 01', 'asistente01@clinica.cl', 1);
GO

-- 2. Pacientes (datos completamente ficticios para demostración):
INSERT INTO [dbo].[Paciente] ([rut], [nombre], [apellidos], [fecha_nacimiento], [telefono]) 
VALUES 
('00000000-0', 'Paciente', 'Demo 001', '1990-01-01', NULL),
('00000001-9', 'Paciente', 'Demo 002', '1990-01-01', NULL);
GO

-- 3. Categorías de Examen Clínico:
INSERT INTO [dbo].[CategoriaExamen] ([nombre], [descripcion]) 
VALUES 
('Ciencias Neurológicas', 'Evaluaciones del sistema nervioso central y periférico'),
('Kinesiología Física', 'Evaluaciones de movilidad, fuerza y respuesta muscular');
GO

-- 4. Signos Clínicos y Pruebas Médicas:
INSERT INTO [dbo].[SignoClinico] ([nombre], [descripcion], [id_categoria]) 
VALUES 
('Prueba de Ataxia', 'Evaluación para detectar pérdida de coordinación muscular en movimientos voluntarios', 1),
('Signo de Gowers', 'Examen físico que indica debilidad de los músculos proximales, observando cómo el paciente se levanta del suelo', 2),
('Evaluación del Cerebelo', 'Conjunto de pruebas para medir la coordinación motora, el equilibrio y la marcha', 1);
GO

-- 5. Evaluaciones Clínicas Iniciales:
INSERT INTO [dbo].[Evaluacion] ([fecha_evaluacion], [observaciones], [resultado], [id_paciente], [id_usuario], [id_signo]) 
VALUES 
('2026-08-15T10:30:00', 'Registro ficticio de demostración; no representa un caso clínico real.', 'Resultado demostrativo', 1, 1, 1),
('2026-08-20T15:45:00', 'Registro ficticio de demostración; no representa un caso clínico real.', 'Resultado demostrativo', 2, 1, 2);
GO

-- =========================================================================================
-- CONSULTAS DE VERIFICACIÓN
-- =========================================================================================
SELECT 'Usuarios' AS Entidad, COUNT(*) AS Total FROM [dbo].[Usuario]
UNION ALL
SELECT 'Pacientes', COUNT(*) FROM [dbo].[Paciente]
UNION ALL
SELECT 'Categorias', COUNT(*) FROM [dbo].[CategoriaExamen]
UNION ALL
SELECT 'Signos', COUNT(*) FROM [dbo].[SignoClinico]
UNION ALL
SELECT 'Evaluaciones', COUNT(*) FROM [dbo].[Evaluacion];
GO
