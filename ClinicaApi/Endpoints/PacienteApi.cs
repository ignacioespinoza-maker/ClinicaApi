using ClinicaApi.Models;
using Microsoft.AspNetCore.Authorization;
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

            // POST: Registrar un nuevo paciente
            group.MapPost("/", async (Paciente nuevoPaciente, EvaluacionesClinicasDbContext db) =>
            {
                // Validación básica
                if (string.IsNullOrWhiteSpace(nuevoPaciente.Rut) || string.IsNullOrWhiteSpace(nuevoPaciente.Nombre))
                    return Results.BadRequest(new { Error = "El RUT y el Nombre son obligatorios." });

                db.Pacientes.Add(nuevoPaciente);
                await db.SaveChangesAsync();

                return Results.Created($"/api/v1/pacientes/{nuevoPaciente.IdPaciente}", nuevoPaciente);
            })
            .WithSummary("Registrar paciente")
            .WithDescription("Permite a Asistentes y Especialistas registrar un nuevo paciente.");
        }
    }
}