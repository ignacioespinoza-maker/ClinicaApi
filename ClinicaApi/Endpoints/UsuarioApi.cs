using System.Security.Claims;
using System.Text.RegularExpressions;
using ClinicaApi.Models;
using ClinicaApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

                var token = await authService.AuthenticateAsync(request.NombreUsuario.Trim(), request.Password);

                if (token == null)
                {
                    return Results.Unauthorized();
                }

                return Results.Ok(new { Token = token });
            })
            .RequireRateLimiting("LoginLimiter")
            .WithSummary("Autenticación de usuarios (Login)")
            .WithDescription("Permite a un usuario obtener un token JWT válido ingresando sus credenciales.");

            // GET: Listar usuarios (solo accesible por Asistente o Doctor con credencial de Administrador)
            group.MapGet("/", [Authorize] async (ClaimsPrincipal user, EvaluacionesClinicasDbContext db) =>
            {
                if (!TieneCredencialAdmin(user))
                {
                    return Results.Json(
                        new { Error = "Acceso denegado: Se requiere credencial de Administrador para gestionar usuarios." },
                        statusCode: StatusCodes.Status403Forbidden
                    );
                }

                var usuarios = await db.Usuarios
                    .Select(u => new UsuarioDto
                    {
                        IdUsuario = u.IdUsuario,
                        NombreUsuario = u.NombreUsuario,
                        Rol = u.Rol,
                        IsAdmin = u.NombreUsuario.ToLower().Contains("admin") || u.Rol.ToLower() == "admin"
                    })
                    .ToListAsync();

                return Results.Ok(usuarios);
            })
            .WithSummary("Listar Usuarios")
            .WithDescription("Permite a los administradores (Doctor o Asistente con credencial admin) consultar los usuarios del sistema.");

            // POST: Creación de usuarios (SOLO Doctor o Asistente con credencial de Administrador)
            group.MapPost("/", [Authorize] async (
                [FromBody] CrearUsuarioRequest request,
                ClaimsPrincipal user,
                EvaluacionesClinicasDbContext db) =>
            {
                if (!TieneCredencialAdmin(user))
                {
                    return Results.Json(
                        new { Error = "Acceso denegado: Solamente un Doctor o Asistente con credencial de Administrador puede crear usuarios." },
                        statusCode: StatusCodes.Status403Forbidden
                    );
                }

                if (string.IsNullOrWhiteSpace(request.NombreUsuario))
                {
                    return Results.BadRequest(new { Error = "El nombre de usuario es obligatorio." });
                }

                var nombreLimpio = request.NombreUsuario.Trim();

                if (nombreLimpio.Length < 3 || nombreLimpio.Length > 50)
                {
                    return Results.BadRequest(new { Error = "El nombre de usuario debe tener entre 3 y 50 caracteres." });
                }

                // Validación de formato: alfanumérico, puntos y guiones
                if (!Regex.IsMatch(nombreLimpio, @"^[a-zA-Z0-9_.-]+$"))
                {
                    return Results.BadRequest(new { Error = "El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos." });
                }

                if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 4)
                {
                    return Results.BadRequest(new { Error = "La contraseña es obligatoria y debe tener al menos 4 caracteres." });
                }

                var rolNormalizado = string.Equals(request.Rol?.Trim(), "Especialista", StringComparison.OrdinalIgnoreCase) 
                    ? "Especialista" 
                    : "Asistente";

                var existeUsuario = await db.Usuarios.AnyAsync(u => u.NombreUsuario == nombreLimpio);
                if (existeUsuario)
                {
                    return Results.BadRequest(new { Error = "El nombre de usuario ya se encuentra registrado." });
                }

                var nuevoUsuario = new Usuario
                {
                    NombreUsuario = nombreLimpio,
                    PasswordHash = request.Password,
                    Rol = rolNormalizado
                };

                db.Usuarios.Add(nuevoUsuario);
                await db.SaveChangesAsync();

                var dto = new UsuarioDto
                {
                    IdUsuario = nuevoUsuario.IdUsuario,
                    NombreUsuario = nuevoUsuario.NombreUsuario,
                    Rol = nuevoUsuario.Rol,
                    IsAdmin = nuevoUsuario.NombreUsuario.ToLower().Contains("admin")
                };

                return Results.Created($"/api/v1/usuarios/{dto.IdUsuario}", dto);
            })
            .WithSummary("Crear usuario por Administrador")
            .WithDescription("Permite a un Asistente o Doctor con credencial de Administrador registrar nuevos usuarios.");

            // DELETE: Eliminar usuario (SOLO Doctor o Asistente con credencial de Administrador)
            group.MapDelete("/{id:int}", [Authorize] async (
                int id,
                ClaimsPrincipal user,
                EvaluacionesClinicasDbContext db) =>
            {
                if (!TieneCredencialAdmin(user))
                {
                    return Results.Json(
                        new { Error = "Acceso denegado: Solamente un Doctor o Asistente con credencial de Administrador puede eliminar usuarios." },
                        statusCode: StatusCodes.Status403Forbidden
                    );
                }

                var targetUsuario = await db.Usuarios.FindAsync(id);
                if (targetUsuario == null)
                {
                    return Results.NotFound(new { Error = "El usuario que intenta eliminar no existe." });
                }

                // Protección contra autoeliminación de la cuenta en sesión
                var currentUserIdClaim = user.FindFirstValue(ClaimTypes.NameIdentifier);
                if (int.TryParse(currentUserIdClaim, out var currentId) && currentId == id)
                {
                    return Results.BadRequest(new { Error = "No puede eliminar su propia cuenta de usuario en sesión." });
                }

                // Integridad referencial: verificar si el usuario tiene evaluaciones clínicas vinculadas
                var tieneEvaluaciones = await db.Evaluacions.AnyAsync(e => e.IdUsuario == id);
                if (tieneEvaluaciones)
                {
                    return Results.BadRequest(new { Error = "No se puede eliminar el usuario porque tiene registros de evaluaciones clínicas asociadas en el sistema." });
                }

                db.Usuarios.Remove(targetUsuario);
                await db.SaveChangesAsync();

                return Results.Ok(new { Mensaje = $"El usuario '{targetUsuario.NombreUsuario}' fue eliminado exitosamente." });
            })
            .WithSummary("Eliminar usuario por Administrador")
            .WithDescription("Permite a un Doctor o Asistente con credencial de Administrador eliminar a otro doctor o asistente.");
        }

        /// <summary>
        /// Comprueba si el usuario autenticado tiene credencial de Administrador.
        /// Se verifica si tiene el claim 'IsAdmin', si su nombre de usuario contiene 'admin' (ej: dr_admin, asistente_admin),
        /// o si tiene el rol 'Admin'.
        /// </summary>
        public static bool TieneCredencialAdmin(ClaimsPrincipal user)
        {
            var username = user.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
            var claimAdmin = user.FindFirstValue("IsAdmin");
            if (bool.TryParse(claimAdmin, out var esAdmin) && esAdmin) return true;

            return username.Contains("admin", StringComparison.OrdinalIgnoreCase)
                || user.IsInRole("Admin");
        }
    }

    public class LoginRequest
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;    
    }

    public class CrearUsuarioRequest
    {
        public string NombreUsuario { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Rol { get; set; } = "Asistente";
    }

    public class UsuarioDto
    {
        public int IdUsuario { get; set; }
        public string NombreUsuario { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public bool IsAdmin { get; set; }
    }
}
