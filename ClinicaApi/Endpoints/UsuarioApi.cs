using ClinicaApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace ClinicaApi.Endpoints
{
    public static class UsuarioApi
    {
        public static void MapUsuarioApi(this WebApplication app)
        {
            // Agrupamos los endpoints bajo una ruta base y le damos una etiqueta para Scalar/Swagger
            var group = app.MapGroup("/api/v1/usuarios").WithTags("Seguridad y Acceso");

            // POST: Endpoint de Login
            group.MapPost("/login", async ([FromBody] LoginRequest request, AuthService authService) =>
            {
                // Llamamos al servicio de autenticación que valida contra la base de datos
                var token = await authService.AuthenticateAsync(request.NombreUsuario, request.Password);

                // Si las credenciales son incorrectas (retorna null), devolvemos un 401 Unauthorized
                if (token == null)
                {
                    return Results.Unauthorized();
                }

                // Si es exitoso, devolvemos el token en formato JSON (200 OK)
                return Results.Ok(new { Token = token });
            })
            .WithSummary("Autenticación de usuarios (Login)")
            .WithDescription("Permite a un Especialista o Asistente obtener un token JWT válido ingresando su nombre de usuario y contraseña.");
        }
    }

    // DTO (Data Transfer Object) para recibir las credenciales desde el cliente
    public class LoginRequest
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;    
    }
}