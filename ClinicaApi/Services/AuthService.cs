using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ClinicaApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ClinicaApi.Services
{
    public class AuthService
    {
        private readonly EvaluacionesClinicasDbContext _context;
        private readonly IConfiguration _config;

        public AuthService(EvaluacionesClinicasDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        public async Task<string?> AuthenticateAsync(string username, string password)
        {
            // 1. Buscar al usuario en la base de datos
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.NombreUsuario == username && u.PasswordHash == password);

            // Si las credenciales son inválidas, retornamos null
            if (usuario == null) return null;

            // 2. Configurar la llave de seguridad (Truco para aceptar llaves cortas)
            string rawKey = _config["Jwt:Key"] ?? "";
            string validKey = rawKey.PadRight(32, '0'); // Rellena con ceros hasta alcanzar el tamaño requerido

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(validKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // 3. Crear los "Claims" (Datos dentro del token)
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                new Claim(ClaimTypes.Name, usuario.NombreUsuario),
                new Claim(ClaimTypes.Role, usuario.Rol) // Asignamos el rol: Especialista o Asistente
            };

            // 4. Construir el Token JWT
            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(60), // Expira en 1 hora
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}