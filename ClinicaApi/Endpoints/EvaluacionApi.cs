using ClinicaApi.Models;
using ClinicaApi.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaApi.Endpoints
{
    public static class EvaluacionApi
    {
        public static void MapEvaluacionApi(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/evaluaciones")
                           .WithTags("Evaluaciones Clínicas")
                           .RequireAuthorization();

            // 1. GET: Usando el Repositorio
            group.MapGet("/", [Authorize(Roles = "Especialista,Asistente")] async (IEvaluacionRepository repo) =>
            {
                var evaluaciones = await repo.GetAllAsync();

                // Filtramos los datos a mostrar
                var resultado = evaluaciones.Select(e => new {
                    e.IdEvaluacion,
                    e.FechaEvaluacion,
                    e.Resultado,
                    e.Observaciones
                });

                return Results.Ok(resultado);
            })
            .WithSummary("Listar Evaluaciones");

            // 2. POST: Usando el Repositorio
            group.MapPost("/", [Authorize(Roles = "Especialista")] async ([FromBody] CrearEvaluacionReq req, IEvaluacionRepository repo) =>
            {
                if (string.IsNullOrWhiteSpace(req.Resultado))
                    return Results.BadRequest(new { Error = "El resultado es obligatorio." });

                var nuevaEvaluacion = new Evaluacion
                {
                    Observaciones = req.Observaciones,
                    Resultado = req.Resultado,
                    IdPaciente = req.IdPaciente,
                    IdSigno = req.IdSigno,
                    IdUsuario = req.IdUsuario,
                    FechaEvaluacion = DateTime.Now
                };

                await repo.AddAsync(nuevaEvaluacion);

                return Results.Created($"/api/v1/evaluaciones/{nuevaEvaluacion.IdEvaluacion}", nuevaEvaluacion);
            })
            .WithSummary("Registrar Evaluación");

            // 3. PUT: Usando el Repositorio
            group.MapPut("/{id:int}", [Authorize(Roles = "Especialista")] async (int id, [FromBody] CrearEvaluacionReq req, IEvaluacionRepository repo) =>
            {
                var evaluacion = await repo.GetByIdAsync(id);

                if (evaluacion == null)
                    return Results.NotFound(new { Error = "Evaluación no encontrada." });

                evaluacion.Observaciones = req.Observaciones;
                evaluacion.Resultado = req.Resultado;
                evaluacion.IdPaciente = req.IdPaciente;
                evaluacion.IdSigno = req.IdSigno;

                await repo.UpdateAsync(evaluacion);

                return Results.Ok(evaluacion);
            })
            .WithSummary("Actualizar Evaluación");

            // 4. DELETE: Usando el Repositorio
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
}