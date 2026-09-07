using ClinicaApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace ClinicaApi.Endpoints
{
    public static class SignoApi
    {
        public static void MapSignoApi(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/signos")
                           .WithTags("Catálogos Clínicos")
                           .RequireAuthorization(); // Requiere estar logueado, sin importar el rol

            // GET: Listar los signos clínicos con el nombre de su categoría
            group.MapGet("/", async (EvaluacionesClinicasDbContext db) =>
            {
                var signos = await db.SignoClinicos
                    .Include(s => s.IdCategoriaNavigation) // Traemos la relación
                    .Select(s => new {
                        s.IdSigno,
                        s.Nombre,
                        s.Descripcion,
                        Categoria = s.IdCategoriaNavigation.Nombre
                    })
                    .ToListAsync();

                return Results.Ok(signos);
            })
            .WithSummary("Listar Signos Clínicos")
            .WithDescription("Obtiene las pruebas médicas disponibles para evaluar.");
        }
    }
}