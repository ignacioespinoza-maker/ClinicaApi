using ClinicaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClinicaApi.Endpoints
{
    public static class CategoriaApi
    {
        public static void MapCategoriaApi(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/categorias")
                           .WithTags("Catálogos Clínicos")
                           .RequireAuthorization();

            // GET: Listar categorías
            group.MapGet("/", async (EvaluacionesClinicasDbContext db) =>
            {
                var categorias = await db.CategoriaExamen.ToListAsync();
                return Results.Ok(categorias);
            })
            .WithSummary("Listar Categorías")
            .WithDescription("Obtiene las clasificaciones de los exámenes médicos.");

            // GET: Detalle de categoría
            group.MapGet("/{id:int}", async (int id, EvaluacionesClinicasDbContext db) =>
            {
                var categoria = await db.CategoriaExamen.FindAsync(id);
                if (categoria == null)
                {
                    return Results.NotFound(new { Error = "Categoría no encontrada." });
                }
                return Results.Ok(categoria);
            })
            .WithSummary("Detalle de Categoría")
            .WithDescription("Obtiene la información de una categoría específica por ID.");

            // POST: Crear Categoría (Asistente y Especialista)
            group.MapPost("/", [Authorize(Roles = "Especialista,Asistente")] async (
                [FromBody] CrearCategoriaReq req,
                EvaluacionesClinicasDbContext db) =>
            {
                if (string.IsNullOrWhiteSpace(req.Nombre))
                {
                    return Results.BadRequest(new { Error = "El nombre de la categoría es obligatorio." });
                }

                var nombreNormalizado = req.Nombre.Trim();

                var existe = await db.CategoriaExamen.AnyAsync(c => c.Nombre.ToLower() == nombreNormalizado.ToLower());
                if (existe)
                {
                    return Results.BadRequest(new { Error = "Ya existe una categoría con ese nombre." });
                }

                var nuevaCategoria = new CategoriaExaman
                {
                    Nombre = nombreNormalizado,
                    Descripcion = req.Descripcion?.Trim()
                };

                db.CategoriaExamen.Add(nuevaCategoria);
                await db.SaveChangesAsync();

                return Results.Created($"/api/v1/categorias/{nuevaCategoria.IdCategoria}", nuevaCategoria);
            })
            .WithSummary("Crear Categoría de Examen")
            .WithDescription("Permite tanto a Especialistas como Asistentes registrar una nueva categoría de examen clínico.");
        }
    }

    public class CrearCategoriaReq
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
    }
}
