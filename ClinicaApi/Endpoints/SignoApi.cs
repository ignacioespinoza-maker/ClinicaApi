using ClinicaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaApi.Endpoints
{
    public static class SignoApi
    {
        public static void MapSignoApi(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/signos")
                           .WithTags("Catálogos Clínicos")
                           .RequireAuthorization();

            // GET: Listar los signos clínicos con el nombre de su categoría
            group.MapGet("/", async (EvaluacionesClinicasDbContext db) =>
            {
                var signos = await db.SignoClinicos
                    .Include(s => s.IdCategoriaNavigation)
                    .Select(s => new SignoDto
                    {
                        IdSigno = s.IdSigno,
                        Nombre = s.Nombre,
                        Descripcion = s.Descripcion,
                        IdCategoria = s.IdCategoria,
                        Categoria = s.IdCategoriaNavigation != null ? s.IdCategoriaNavigation.Nombre : "Sin categoría"
                    })
                    .ToListAsync();

                return Results.Ok(signos);
            })
            .WithSummary("Listar Signos Clínicos")
            .WithDescription("Obtiene las pruebas médicas disponibles para evaluar.");

            // GET: Detalle de Signo Clínico por ID
            group.MapGet("/{id:int}", async (int id, EvaluacionesClinicasDbContext db) =>
            {
                var s = await db.SignoClinicos
                    .Include(sc => sc.IdCategoriaNavigation)
                    .FirstOrDefaultAsync(sc => sc.IdSigno == id);

                if (s == null)
                {
                    return Results.NotFound(new { Error = "Signo clínico no encontrado." });
                }

                var dto = new SignoDto
                {
                    IdSigno = s.IdSigno,
                    Nombre = s.Nombre,
                    Descripcion = s.Descripcion,
                    IdCategoria = s.IdCategoria,
                    Categoria = s.IdCategoriaNavigation != null ? s.IdCategoriaNavigation.Nombre : "Sin categoría"
                };

                return Results.Ok(dto);
            })
            .WithSummary("Detalle de Signo Clínico")
            .WithDescription("Obtiene los datos detallados de un signo clínico por ID.");

            // POST: Registrar Signo Clínico (Tanto Especialista como Asistente)
            group.MapPost("/", [Authorize(Roles = "Especialista,Asistente")] async (
                [FromBody] CrearSignoReq req,
                EvaluacionesClinicasDbContext db) =>
            {
                if (string.IsNullOrWhiteSpace(req.Nombre))
                {
                    return Results.BadRequest(new { Error = "El nombre del signo clínico es obligatorio." });
                }

                if (req.IdCategoria <= 0)
                {
                    return Results.BadRequest(new { Error = "Debe asociar el signo clínico a una categoría válida." });
                }

                var categoria = await db.CategoriaExamen.FindAsync(req.IdCategoria);
                if (categoria == null)
                {
                    return Results.BadRequest(new { Error = "La categoría indicada no existe en la base de datos." });
                }

                var nuevoSigno = new SignoClinico
                {
                    Nombre = req.Nombre.Trim(),
                    Descripcion = req.Descripcion?.Trim(),
                    IdCategoria = req.IdCategoria
                };

                db.SignoClinicos.Add(nuevoSigno);
                await db.SaveChangesAsync();

                var dto = new SignoDto
                {
                    IdSigno = nuevoSigno.IdSigno,
                    Nombre = nuevoSigno.Nombre,
                    Descripcion = nuevoSigno.Descripcion,
                    IdCategoria = nuevoSigno.IdCategoria,
                    Categoria = categoria.Nombre
                };

                return Results.Created($"/api/v1/signos/{dto.IdSigno}", dto);
            })
            .WithSummary("Crear Signo Clínico")
            .WithDescription("Permite a Asistentes y Especialistas registrar un nuevo signo clínico asociado a una categoría.");
        }
    }

    public class CrearSignoReq
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int IdCategoria { get; set; }
    }

    public class SignoDto
    {
        public int IdSigno { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int IdCategoria { get; set; }
        public string Categoria { get; set; } = string.Empty;
    }
}
