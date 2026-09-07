using ClinicaApi.Models;
using Microsoft.AspNetCore.Authorization;
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
        }
    }
}