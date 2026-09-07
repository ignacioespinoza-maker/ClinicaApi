using System.Diagnostics;

namespace ClinicaApi.Middlewares
{
    public class RequestLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestLoggingMiddleware> _logger;

        public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Inicia un cronómetro antes de procesar la petición
            var watch = Stopwatch.StartNew();

            // Pasa la petición al siguiente paso (tus endpoints)
            await _next(context);

            // Detiene el cronómetro cuando la respuesta ya está lista
            watch.Stop();

            // Registra en la consola el tiempo que tardó
            _logger.LogInformation($"[MIDDLEWARE PROPIO] {context.Request.Method} {context.Request.Path} respondió {context.Response.StatusCode} en {watch.ElapsedMilliseconds} ms");
        }
    }
}