using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace ClinicaApi.Tests
{
    public class SeguridadTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public SeguridadTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task Login_ConCredencialesInvalidas_Retorna401Unauthorized()
        {
            // Arrange: Preparamos datos falsos
            var request = new { nombreUsuario = "usuario_falso", password = "clave_incorrecta" };

            // Act: Disparamos la petición POST
            var response = await _client.PostAsJsonAsync("/api/v1/usuarios/login", request);

            // Assert: Verificamos que devuelva 401 Unauthorized
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task GetCategorias_SinTokenJWT_Retorna401Unauthorized()
        {
            // Act: Intentamos acceder sin token
            var response = await _client.GetAsync("/api/v1/categorias");

            // Assert: Verificamos que devuelva 401 Unauthorized
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task CabecerasSeguridad_EstanPresentesEnRespuestas()
        {
            // Act: Petición cualquiera
            var response = await _client.GetAsync("/api/v1/usuarios/login");

            // Assert: Mitigación OWASP API8
            Assert.True(response.Headers.Contains("X-Content-Type-Options"));
            Assert.Equal("nosniff", response.Headers.GetValues("X-Content-Type-Options").First());
            Assert.True(response.Headers.Contains("X-Frame-Options"));
            Assert.Equal("DENY", response.Headers.GetValues("X-Frame-Options").First());
        }

        [Fact]
        public async Task Login_ConCredencialesValidas_Retorna200YToken()
        {
            // Arrange: Credenciales de seed
            var request = new { nombreUsuario = "dr_admin", password = "hash_simulado_aqui_123" };

            // Act
            var response = await _client.PostAsJsonAsync("/api/v1/usuarios/login", request);

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var content = await response.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(content.TryGetProperty("token", out var tokenProp) || content.TryGetProperty("Token", out tokenProp));
            Assert.False(string.IsNullOrWhiteSpace(tokenProp.GetString()));
        }

        [Fact]
        public async Task RolAsistente_NoPuedeCrearEvaluacion_Retorna403Forbidden()
        {
            var client = _factory.CreateClient();

            // Arrange: Loguear como asistente
            var loginReq = new { nombreUsuario = "asistente_01", password = "hash_simulado_aqui_456" };
            var loginRes = await client.PostAsJsonAsync("/api/v1/usuarios/login", loginReq);
            Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
            var doc = await loginRes.Content.ReadFromJsonAsync<JsonElement>();
            string token = doc.TryGetProperty("token", out var t) ? t.GetString()! : doc.GetProperty("Token").GetString()!;

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // Act: Intentar crear evaluación siendo Asistente
            var nueva = new
            {
                observaciones = "Prueba rol asistente",
                resultado = "Normal",
                idPaciente = 1,
                idSigno = 1,
                idUsuario = 2
            };
            var res = await client.PostAsJsonAsync("/api/v1/evaluaciones", nueva);

            // Assert: 403 Forbidden (OWASP API5: Broken Function Level Authorization)
            Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
        }

        [Fact]
        public async Task RolEspecialista_PuedeCrearYConsultarDetalleEvaluacion()
        {
            var client = _factory.CreateClient();

            // Arrange: Loguear como Especialista
            var loginReq = new { nombreUsuario = "dr_admin", password = "hash_simulado_aqui_123" };
            var loginRes = await client.PostAsJsonAsync("/api/v1/usuarios/login", loginReq);
            Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
            var doc = await loginRes.Content.ReadFromJsonAsync<JsonElement>();
            string token = doc.TryGetProperty("token", out var t) ? t.GetString()! : doc.GetProperty("Token").GetString()!;

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // Act: Crear evaluación siendo Especialista
            var nueva = new
            {
                observaciones = "Evaluación automatizada de prueba",
                resultado = "Resultado Normal Test",
                idPaciente = 1,
                idSigno = 1,
                idUsuario = 1
            };
            var postRes = await client.PostAsJsonAsync("/api/v1/evaluaciones", nueva);
            Assert.Equal(HttpStatusCode.Created, postRes.StatusCode);

            var createdDoc = await postRes.Content.ReadFromJsonAsync<JsonElement>();
            int createdId = createdDoc.GetProperty("idEvaluacion").GetInt32();

            // Act: Consultar detalle
            var getDetailRes = await client.GetAsync($"/api/v1/evaluaciones/{createdId}");
            Assert.Equal(HttpStatusCode.OK, getDetailRes.StatusCode);
        }
    }
}