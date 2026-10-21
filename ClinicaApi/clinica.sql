USE [master];
GO

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

CREATE TABLE [dbo].[Usuario](
    [id_usuario] [int] IDENTITY(1,1) NOT NULL,
    [nombre_usuario] [varchar](100) NOT NULL,
    [password_hash] [varchar](255) NOT NULL,
    [rol] [varchar](20) NOT NULL DEFAULT ('Asistente'),
    CONSTRAINT [PK_Usuario] PRIMARY KEY CLUSTERED ([id_usuario] ASC),
    CONSTRAINT [UQ_Usuario_Nombre] UNIQUE NONCLUSTERED ([nombre_usuario] ASC)
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[Paciente](
    [id_paciente] [int] IDENTITY(1,1) NOT NULL,
    [rut] [varchar](12) NOT NULL,
    [nombre] [varchar](100) NOT NULL,
    [apellidos] [varchar](150) NOT NULL,
    [fecha_nacimiento] [date] NOT NULL,
    [telefono] [varchar](15) NULL,
    CONSTRAINT [PK_Paciente] PRIMARY KEY CLUSTERED ([id_paciente] ASC),
    CONSTRAINT [UQ_Paciente_Rut] UNIQUE NONCLUSTERED ([rut] ASC)
) ON [PRIMARY];
GO

CREATE TABLE [dbo].[CategoriaExamen](
    [id_categoria] [int] IDENTITY(1,1) NOT NULL,
    [nombre] [varchar](150) NOT NULL,
    [descripcion] [varchar](255) NULL,
    CONSTRAINT [PK_CategoriaExamen] PRIMARY KEY CLUSTERED ([id_categoria] ASC)
) ON [PRIMARY];
GO
 
CREATE TABLE [dbo].[SignoClinico](
    [id_signo] [int] IDENTITY(1,1) NOT NULL,
    [nombre] [varchar](150) NOT NULL,
    [descripcion] [varchar](max) NULL,
    [id_categoria] [int] NOT NULL,
    CONSTRAINT [PK_SignoClinico] PRIMARY KEY CLUSTERED ([id_signo] ASC),
    CONSTRAINT [FK_Signo_Categoria] FOREIGN KEY([id_categoria]) REFERENCES [dbo].[CategoriaExamen] ([id_categoria])
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
GO

CREATE TABLE [dbo].[Evaluacion](
    [id_evaluacion] [int] IDENTITY(1,1) NOT NULL,
    [fecha_evaluacion] [datetime] NOT NULL DEFAULT (GETDATE()),
    [observaciones] [varchar](max) NOT NULL,
    [resultado] [varchar](100) NOT NULL,
    [id_paciente] [int] NOT NULL,
    [id_usuario] [int] NOT NULL,
    [id_signo] [int] NOT NULL,
    CONSTRAINT [PK_Evaluacion] PRIMARY KEY CLUSTERED ([id_evaluacion] ASC),
    CONSTRAINT [FK_Evaluacion_Paciente] FOREIGN KEY([id_paciente]) REFERENCES [dbo].[Paciente] ([id_paciente]),
    CONSTRAINT [FK_Evaluacion_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [dbo].[Usuario] ([id_usuario]),
    CONSTRAINT [FK_Evaluacion_Signo] FOREIGN KEY([id_signo]) REFERENCES [dbo].[SignoClinico] ([id_signo])
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
GO

INSERT INTO [dbo].[Usuario] ([nombre_usuario], [password_hash], [rol]) 
VALUES 
('dr_admin', 'hash_simulado_aqui_123', 'Especialista'),
('asistente_01', 'hash_simulado_aqui_456', 'Asistente');
GO

INSERT INTO [dbo].[Paciente] ([rut], [nombre], [apellidos], [fecha_nacimiento], [telefono]) 
VALUES 
('00000000-0', 'Paciente', 'Demo 001', '19900101', NULL),
('00000001-9', 'Paciente', 'Demo 002', '19900101', NULL);
GO

INSERT INTO [dbo].[CategoriaExamen] ([nombre], [descripcion]) 
VALUES 
('Ciencias Neurológicas', 'Evaluaciones del sistema nervioso central y periférico'),
('Kinesiología Física', 'Evaluaciones de movilidad, fuerza y respuesta muscular');
GO

INSERT INTO [dbo].[SignoClinico] ([nombre], [descripcion], [id_categoria]) 
VALUES 
('Prueba de Ataxia', 'Evaluación para detectar pérdida de coordinación muscular en movimientos voluntarios', 1),
('Signo de Gowers', 'Examen físico que indica debilidad de los músculos proximales, observando cómo el paciente se levanta del suelo', 2),
('Evaluación del Cerebelo', 'Conjunto de pruebas para medir la coordinación motora, el equilibrio y la marcha', 1);
GO

INSERT INTO [dbo].[Evaluacion] ([fecha_evaluacion], [observaciones], [resultado], [id_paciente], [id_usuario], [id_signo]) 
VALUES 
('2026-08-15T10:30:00', 'Registro ficticio de demostración; no representa un caso clínico real.', 'Resultado demostrativo', 1, 1, 1),
('2026-08-20T15:45:00', 'Registro ficticio de demostración; no representa un caso clínico real.', 'Resultado demostrativo', 2, 1, 2);
GO
