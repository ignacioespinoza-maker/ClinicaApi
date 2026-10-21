using ClinicaApi.Endpoints;
using ClinicaApi.Models;
using ClinicaApi.Services;
using ClinicaApi.Repositories;
using ClinicaApi.Middlewares;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de llaves JWT
var rawKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Falta configurar Jwt:Key mediante User Secrets o una variable de entorno.");
var keyBytes = Encoding.UTF8.GetBytes(rawKey);
if (keyBytes.Length < 32)
{
    throw new InvalidOperationException("Jwt:Key debe tener al menos 32 bytes.");
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ClinicaApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ClinicaFrontend";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
        };
    });

builder.Services.AddAuthorization();

// 2. MITIGACIÓN OWASP API8: CORS restringido a orígenes explícitos configurados
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "https://localhost:5173", "http://localhost:3000", "https://localhost:7217" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendSeguro", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. MITIGACIÓN OWASP API4: Rate Limiting (Límite de recursos y prevención de ataques de fuerza bruta)
builder.Services.AddRateLimiter(options =>
{
    // Límite general para endpoints de la API (100 peticiones / minuto)
    options.AddFixedWindowLimiter("LimiteBasico", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100;
    });

    // Límite estricto para Login (10 peticiones / minuto por IP para mitigar fuerza bruta)
    options.AddFixedWindowLimiter("LoginLimiter", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 10;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// 4. OpenAPI / Scalar para documentación de endpoints
builder.Services.AddOpenApi();

// 5. Inyección de Dependencias
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<IEvaluacionRepository, EvaluacionRepository>();

// 6. DbContext con la cadena de conexión de SQL Server
builder.Services.AddDbContext<EvaluacionesClinicasDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("miconexion")
        ?? "Server=localhost\\SQLEXPRESS;Database=EvaluacionesClinicasDB;Trusted_Connection=True;TrustServerCertificate=True;"));

var app = builder.Build();

// 7. Pipeline de Middlewares (Orden crítico de ejecución)

// Mitigación OWASP API8: Manejo global de excepciones para no filtrar trazas ni secretos
app.UseMiddleware<GlobalErrorHandlingMiddleware>();

// Mitigación OWASP API8: Cabeceras HTTP de seguridad
app.UseMiddleware<SecurityHeadersMiddleware>();

// Middleware transversal para métricas de tiempo de respuesta
app.UseMiddleware<RequestLoggingMiddleware>();

// Redirección HTTPS
app.UseHttpsRedirection();

// Activación de CORS restringido
app.UseCors("FrontendSeguro");

// Activación de Rate Limiting
app.UseRateLimiter();

// Seguridad JWT y Roles
app.UseAuthentication();
app.UseAuthorization();

// 8. Interfaz gráfica de documentación en desarrollo (Scalar)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
    app.MapGet("/", () => Results.Redirect("/scalar/v1"));
}
else
{
    app.MapGet("/", () => Results.Ok(new { Mensaje = "ClinicaApi en ejecución", Documentacion = "/scalar/v1" }));
}

// 9. Mapeo modular de Endpoints
app.MapCategoriaApi();
app.MapEvaluacionApi();
app.MapPacienteApi();
app.MapSignoApi();
app.MapUsuarioApi();

// Semilla automática para Asistente con Credencial de Administrador
using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<EvaluacionesClinicasDbContext>();
        if (!db.Usuarios.Any(u => u.NombreUsuario == "asistente_admin"))
        {
            db.Usuarios.Add(new Usuario
            {
                NombreUsuario = "asistente_admin",
                PasswordHash = "hash_simulado_asistente_admin",
                Rol = "Asistente"
            });
            db.SaveChanges();
        }
    }
    catch { /* Silencioso en caso de inicialización en pruebas */ }
}

app.Run();

public partial class Program { }