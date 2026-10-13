using ClinicaApi.Models;
using ClinicaApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ClinicaApi.Endpoints
{
    public static class EvaluacionApi
    {
        public static void MapEvaluacionApi(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/evaluaciones")
                           .WithTags("Evaluaciones Clínicas")
                           .RequireAuthorization();

            // 1. GET: Listar Evaluaciones con datos enriquecidos (DTO seguro sin ciclos circulares)
            group.MapGet("/", [Authorize(Roles = "Especialista,Asistente")] async (IEvaluacionRepository repo) =>
            {
                var evaluaciones = await repo.GetAllAsync();

                var resultado = evaluaciones.Select(e => new EvaluacionDto
                {
                    IdEvaluacion = e.IdEvaluacion,
                    FechaEvaluacion = e.FechaEvaluacion,
                    Resultado = e.Resultado,
                    Observaciones = e.Observaciones,
                    IdPaciente = e.IdPaciente,
                    PacienteNombre = e.IdPacienteNavigation != null ? $"{e.IdPacienteNavigation.Nombre} {e.IdPacienteNavigation.Apellidos}".Trim() : "Sin paciente",
                    PacienteRut = e.IdPacienteNavigation?.Rut ?? "",
                    IdSigno = e.IdSigno,
                    SignoNombre = e.IdSignoNavigation?.Nombre ?? "Sin signo",
                    IdUsuario = e.IdUsuario,
                    UsuarioNombre = e.IdUsuarioNavigation?.NombreUsuario ?? "Desconocido"
                });

                return Results.Ok(resultado);
            })
            .WithSummary("Listar Evaluaciones");

            // 2. GET Detalle por ID (Requisito CRUD Detalle)
            group.MapGet("/{id:int}", [Authorize(Roles = "Especialista,Asistente")] async (int id, IEvaluacionRepository repo) =>
            {
                var e = await repo.GetByIdAsync(id);

                if (e == null)
                    return Results.NotFound(new { Error = "Evaluación no encontrada." });

                var dto = new EvaluacionDto
                {
                    IdEvaluacion = e.IdEvaluacion,
                    FechaEvaluacion = e.FechaEvaluacion,
                    Resultado = e.Resultado,
                    Observaciones = e.Observaciones,
                    IdPaciente = e.IdPaciente,
                    PacienteNombre = e.IdPacienteNavigation != null ? $"{e.IdPacienteNavigation.Nombre} {e.IdPacienteNavigation.Apellidos}".Trim() : "Sin paciente",
                    PacienteRut = e.IdPacienteNavigation?.Rut ?? "",
                    IdSigno = e.IdSigno,
                    SignoNombre = e.IdSignoNavigation?.Nombre ?? "Sin signo",
                    IdUsuario = e.IdUsuario,
                    UsuarioNombre = e.IdUsuarioNavigation?.NombreUsuario ?? "Desconocido"
                };

                return Results.Ok(dto);
            })
            .WithSummary("Obtener Detalle de Evaluación");

            // 3. POST: Crear Evaluación
            group.MapPost("/", [Authorize(Roles = "Especialista")] async (
                [FromBody] CrearEvaluacionReq req,
                ClaimsPrincipal user,
                IEvaluacionRepository repo) =>
            {
                // Validación defensiva en servidor (OWASP Top 10 Injection/Validation)
                if (string.IsNullOrWhiteSpace(req.Resultado))
                    return Results.BadRequest(new { Error = "El resultado es obligatorio." });

                if (req.IdPaciente <= 0)
                    return Results.BadRequest(new { Error = "Debe seleccionar un paciente válido." });

                if (req.IdSigno <= 0)
                    return Results.BadRequest(new { Error = "Debe seleccionar un signo clínico válido." });

                // Si no se envía IdUsuario, se obtiene del claim JWT autenticado para evitar suplantación (OWASP BOLA)
                var idUsuarioFinal = req.IdUsuario;
                if (idUsuarioFinal <= 0)
                {
                    var claimId = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (int.TryParse(claimId, out var parsedId))
                    {
                        idUsuarioFinal = parsedId;
                    }
                }

                var nuevaEvaluacion = new Evaluacion
                {
                    Observaciones = req.Observaciones?.Trim() ?? string.Empty,
                    Resultado = req.Resultado.Trim(),
                    IdPaciente = req.IdPaciente,
                    IdSigno = req.IdSigno,
                    IdUsuario = idUsuarioFinal > 0 ? idUsuarioFinal : 1,
                    FechaEvaluacion = DateTime.Now
                };

                await repo.AddAsync(nuevaEvaluacion);

                // Cargar entidad con relaciones para DTO limpio
                var e = await repo.GetByIdAsync(nuevaEvaluacion.IdEvaluacion) ?? nuevaEvaluacion;

                var dto = new EvaluacionDto
                {
                    IdEvaluacion = e.IdEvaluacion,
                    FechaEvaluacion = e.FechaEvaluacion,
                    Resultado = e.Resultado,
                    Observaciones = e.Observaciones,
                    IdPaciente = e.IdPaciente,
                    PacienteNombre = e.IdPacienteNavigation != null ? $"{e.IdPacienteNavigation.Nombre} {e.IdPacienteNavigation.Apellidos}".Trim() : "Sin paciente",
                    PacienteRut = e.IdPacienteNavigation?.Rut ?? "",
                    IdSigno = e.IdSigno,
                    SignoNombre = e.IdSignoNavigation?.Nombre ?? "Sin signo",
                    IdUsuario = e.IdUsuario,
                    UsuarioNombre = e.IdUsuarioNavigation?.NombreUsuario ?? "Desconocido"
                };

                return Results.Created($"/api/v1/evaluaciones/{dto.IdEvaluacion}", dto);
            })
            .WithSummary("Registrar Evaluación");

            // 4. PUT: Actualizar Evaluación
            group.MapPut("/{id:int}", [Authorize(Roles = "Especialista")] async (
                int id,
                [FromBody] CrearEvaluacionReq req,
                IEvaluacionRepository repo) =>
            {
                if (string.IsNullOrWhiteSpace(req.Resultado))
                    return Results.BadRequest(new { Error = "El resultado es obligatorio." });

                if (req.IdPaciente <= 0)
                    return Results.BadRequest(new { Error = "Debe seleccionar un paciente válido." });

                if (req.IdSigno <= 0)
                    return Results.BadRequest(new { Error = "Debe seleccionar un signo clínico válido." });

                var evaluacion = await repo.GetByIdAsync(id);

                if (evaluacion == null)
                    return Results.NotFound(new { Error = "Evaluación no encontrada." });

                evaluacion.Observaciones = req.Observaciones?.Trim() ?? string.Empty;
                evaluacion.Resultado = req.Resultado.Trim();
                evaluacion.IdPaciente = req.IdPaciente;
                evaluacion.IdSigno = req.IdSigno;

                await repo.UpdateAsync(evaluacion);

                var e = await repo.GetByIdAsync(id) ?? evaluacion;

                var dto = new EvaluacionDto
                {
                    IdEvaluacion = e.IdEvaluacion,
                    FechaEvaluacion = e.FechaEvaluacion,
                    Resultado = e.Resultado,
                    Observaciones = e.Observaciones,
                    IdPaciente = e.IdPaciente,
                    PacienteNombre = e.IdPacienteNavigation != null ? $"{e.IdPacienteNavigation.Nombre} {e.IdPacienteNavigation.Apellidos}".Trim() : "Sin paciente",
                    PacienteRut = e.IdPacienteNavigation?.Rut ?? "",
                    IdSigno = e.IdSigno,
                    SignoNombre = e.IdSignoNavigation?.Nombre ?? "Sin signo",
                    IdUsuario = e.IdUsuario,
                    UsuarioNombre = e.IdUsuarioNavigation?.NombreUsuario ?? "Desconocido"
                };

                return Results.Ok(dto);
            })
            .WithSummary("Actualizar Evaluación");

            // 5. DELETE: Eliminar Evaluación
            group.MapDelete("/{id:int}", [Authorize(Roles = "Especialista")] async (int id, IEvaluacionRepository repo) =>
            {
                var evaluacion = await repo.GetByIdAsync(id);

                if (evaluacion == null)
                    return Results.NotFound(new { Error = "Evaluación no encontrada." });

                await repo.DeleteAsync(evaluacion);

                return Results.NoContent();
            })
            .WithSummary("Eliminar Evaluación");
        }
    }

    public class CrearEvaluacionReq
    {
        public string Observaciones { get; set; } = string.Empty;
        public string Resultado { get; set; } = string.Empty;
        public int IdPaciente { get; set; }
        public int IdSigno { get; set; }
        public int IdUsuario { get; set; }
    }

    public class EvaluacionDto
    {
        public int IdEvaluacion { get; set; }
        public DateTime FechaEvaluacion { get; set; }
        public string Resultado { get; set; } = string.Empty;
        public string Observaciones { get; set; } = string.Empty;
        public int IdPaciente { get; set; }
        public string PacienteNombre { get; set; } = string.Empty;
        public string PacienteRut { get; set; } = string.Empty;
        public int IdSigno { get; set; }
        public string SignoNombre { get; set; } = string.Empty;
        public int IdUsuario { get; set; }
        public string UsuarioNombre { get; set; } = string.Empty;
    }
}