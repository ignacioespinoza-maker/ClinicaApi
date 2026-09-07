using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace ClinicaApi.Tests
{
    public class SeguridadTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public SeguridadTests(WebApplicationFactory<Program> factory)
        {
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
    }
}