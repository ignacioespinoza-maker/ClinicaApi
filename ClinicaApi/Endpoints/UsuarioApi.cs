using ClinicaApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaApi.Endpoints
{
    public static class UsuarioApi
    {
        public static void MapUsuarioApi(this WebApplication app)
        {
            var group = app.MapGroup("/api/v1/usuarios").WithTags("Seguridad y Acceso");

            // POST: Endpoint de Login con Rate Limiting dedicado contra ataques de fuerza bruta (OWASP API4)
            group.MapPost("/login", async ([FromBody] LoginRequest request, AuthService authService) =>
            {
                if (string.IsNullOrWhiteSpace(request.NombreUsuario) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return Results.BadRequest(new { Error = "El nombre de usuario y la contraseña son obligatorios." });
                }

                var token = await authService.AuthenticateAsync(request.NombreUsuario, request.Password);

                if (token == null)
                {
                    return Results.Unauthorized();
                }

                return Results.Ok(new { Token = token });
            })
            .RequireRateLimiting("LoginLimiter")
            .WithSummary("Autenticación de usuarios (Login)")
            .WithDescription("Permite a un Especialista o Asistente obtener un token JWT válido ingresando su nombre de usuario y contraseña.");
        }
    }

    public class LoginRequest
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;    
    }
}