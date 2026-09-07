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

// 1. Configuración de llaves JWT (Ajuste para aceptar llaves cortas)
var rawKey = builder.Configuration["Jwt:Key"] ?? "";
var validKey = rawKey.PadRight(32, '0'); // Rellena con ceros hasta 32 caracteres si es muy corta
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(validKey))
        };
    });

builder.Services.AddAuthorization();

// 2. MITIGACIÓN OWASP: CORS (Control de orígenes)
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendSeguro", policy =>
    {
        policy.WithOrigins("https://localhost:7217") // Cambiar por la URL real de tu frontend
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. MITIGACIÓN OWASP: Rate Limiting (Límite de recursos)
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("LimiteBasico", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 100; // Máximo 100 peticiones por minuto por IP
    });
});

// 4. Agregamos servicios de OpenAPI/Scalar
builder.Services.AddOpenApi();

// 5. Inyección de Dependencias
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<IEvaluacionRepository, EvaluacionRepository>(); // Patrón Repository

// 6. Inyectamos el DbContext con la cadena de conexión
builder.Services.AddDbContext<EvaluacionesClinicasDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("miconexion")));

var app = builder.Build();

// 7. Activamos los Middlewares en el pipeline (El orden importa mucho)

// Nuestro Middleware personalizado para medir tiempos (Requisito Arquitectura)
app.UseMiddleware<RequestLoggingMiddleware>();

app.UseHttpsRedirection();

// Activamos mitigaciones OWASP
app.UseCors("FrontendSeguro");
app.UseRateLimiter();

// Seguridad
app.UseAuthentication(); // Verifica "Quién eres" (Token)
app.UseAuthorization();  // Verifica "Qué puedes hacer" (Roles)

// 8. Configuramos la interfaz gráfica para desarrollo (Scalar)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// 9. Mapeamos todos los Endpoints de la API
app.MapCategoriaApi();
app.MapEvaluacionApi();
app.MapPacienteApi();
app.MapSignoApi();
app.MapUsuarioApi();

app.Run();
public partial class Program { }