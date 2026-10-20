using ClinicaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaApi.Endpoints
{
    public static class PacienteApi
    {
        public static void MapPacienteApi(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/pacientes")
                           .WithTags("Gestión de Pacientes")
                           .RequireAuthorization(new AuthorizeAttribute { Roles = "Especialista,Asistente" });

            // GET: Listar todos los pacientes
            group.MapGet("/", async (EvaluacionesClinicasDbContext db) =>
            {
                var pacientes = await db.Pacientes.ToListAsync();
                return Results.Ok(pacientes);
            })
            .WithSummary("Listar pacientes")
            .WithDescription("Obtiene la lista completa de pacientes registrados.");

            // GET: Detalle de paciente por ID
            group.MapGet("/{id:int}", async (int id, EvaluacionesClinicasDbContext db) =>
            {
                var paciente = await db.Pacientes.FindAsync(id);
                if (paciente == null)
                {
                    return Results.NotFound(new { Error = "Paciente no encontrado." });
                }
                return Results.Ok(paciente);
            })
            .WithSummary("Detalle de paciente")
            .WithDescription("Obtiene los datos de un paciente específico por ID.");

            // POST: Registrar un nuevo paciente con validación de RUT chileno (Módulo 11)
            group.MapPost("/", async (Paciente nuevoPaciente, EvaluacionesClinicasDbContext db) =>
            {
                if (string.IsNullOrWhiteSpace(nuevoPaciente.Rut))
                {
                    return Results.BadRequest(new { Error = "El RUT del paciente es obligatorio." });
                }

                if (string.IsNullOrWhiteSpace(nuevoPaciente.Nombre) || nuevoPaciente.Nombre.Trim().Length < 2)
                {
                    return Results.BadRequest(new { Error = "El Nombre del paciente debe tener al menos 2 caracteres." });
                }

                if (string.IsNullOrWhiteSpace(nuevoPaciente.Apellidos) || nuevoPaciente.Apellidos.Trim().Length < 2)
                {
                    return Results.BadRequest(new { Error = "Los Apellidos del paciente son obligatorios (mínimo 2 caracteres)." });
                }

                // Validación algorítmica de RUT Chileno (Módulo 11)
                if (!ValidarRutChileno(nuevoPaciente.Rut))
                {
                    return Results.BadRequest(new { Error = "El RUT proporcionado no es válido según el algoritmo de verificación Módulo 11 (ej: 12345678-5)." });
                }

                // Normalización de RUT al formato estándar XXXXXXXX-X
                var rutNormalizado = NormalizarRutChileno(nuevoPaciente.Rut);
                nuevoPaciente.Rut = rutNormalizado;
                nuevoPaciente.Nombre = nuevoPaciente.Nombre.Trim();
                nuevoPaciente.Apellidos = nuevoPaciente.Apellidos.Trim();
                nuevoPaciente.Telefono = string.IsNullOrWhiteSpace(nuevoPaciente.Telefono) ? null : nuevoPaciente.Telefono.Trim();

                // Validación de fecha de nacimiento
                if (nuevoPaciente.FechaNacimiento > DateOnly.FromDateTime(DateTime.Today))
                {
                    return Results.BadRequest(new { Error = "La fecha de nacimiento no puede ser una fecha futura." });
                }

                // Verificación de unicidad de RUT en la base de datos
                var rutExiste = await db.Pacientes.AnyAsync(p => p.Rut == rutNormalizado);
                if (rutExiste)
                {
                    return Results.BadRequest(new { Error = "Ya existe un paciente registrado con el RUT proporcionado." });
                }

                db.Pacientes.Add(nuevoPaciente);
                await db.SaveChangesAsync();

                return Results.Created($"/api/v1/pacientes/{nuevoPaciente.IdPaciente}", nuevoPaciente);
            })
            .WithSummary("Registrar paciente")
            .WithDescription("Permite a Asistentes y Especialistas registrar un nuevo paciente con validación estricta de RUT.");
        }

        /// <summary>
        /// Valida el RUT chileno mediante el algoritmo estándar de Módulo 11.
        /// </summary>
        public static bool ValidarRutChileno(string? rut)
        {
            if (string.IsNullOrWhiteSpace(rut)) return false;

            var limpio = rut.Replace(".", "").Replace("-", "").Trim().ToUpperInvariant();
            if (limpio.Length < 8 || limpio.Length > 9) return false;

            var cuerpo = limpio[..^1];
            var dv = limpio[^1];

            if (!long.TryParse(cuerpo, out _)) return false;

            int suma = 0;
            int factor = 2;

            for (int i = cuerpo.Length - 1; i >= 0; i--)
            {
                suma += (cuerpo[i] - '0') * factor;
                factor = factor == 7 ? 2 : factor + 1;
            }

            int resto = suma % 11;
            int dvEsperado = 11 - resto;

            char dvCalculado = dvEsperado switch
            {
                11 => '0',
                10 => 'K',
                _ => (char)('0' + dvEsperado)
            };

            return dv == dvCalculado;
        }

        /// <summary>
        /// Normaliza el RUT chileno al formato XXXXXXXX-X sin puntos.
        /// </summary>
        public static string NormalizarRutChileno(string rut)
        {
            var limpio = rut.Replace(".", "").Replace("-", "").Trim().ToUpperInvariant();
            if (limpio.Length < 2) return limpio;
            return $"{limpio[..^1]}-{limpio[^1]}";
        }
    }
}
