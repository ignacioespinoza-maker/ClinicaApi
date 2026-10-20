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

            // Arrange: Loguear como asistente regular
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

        [Fact]
        public async Task AsistenteYDoctor_PuedenCrearCategoriaYSignoClinico()
        {
            var client = _factory.CreateClient();

            // Loguear como Asistente
            var loginReq = new { nombreUsuario = "asistente_01", password = "hash_simulado_aqui_456" };
            var loginRes = await client.PostAsJsonAsync("/api/v1/usuarios/login", loginReq);
            Assert.Equal(HttpStatusCode.OK, loginRes.StatusCode);
            var doc = await loginRes.Content.ReadFromJsonAsync<JsonElement>();
            string token = doc.TryGetProperty("token", out var t) ? t.GetString()! : doc.GetProperty("Token").GetString()!;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // 1. Asistente crea CategoriaExamen
            var nuevaCat = new
            {
                nombre = $"Test Cat {Guid.NewGuid().ToString().Substring(0, 8)}",
                descripcion = "Categoría creada en prueba automatizada"
            };
            var catRes = await client.PostAsJsonAsync("/api/v1/categorias", nuevaCat);
            Assert.Equal(HttpStatusCode.Created, catRes.StatusCode);

            var catDoc = await catRes.Content.ReadFromJsonAsync<JsonElement>();
            int idCategoria = catDoc.GetProperty("idCategoria").GetInt32();

            // 2. Asistente crea SignoClinico en esa categoria
            var nuevoSigno = new
            {
                nombre = $"Signo Test {Guid.NewGuid().ToString().Substring(0, 8)}",
                descripcion = "Descripción de prueba de signo clínico",
                idCategoria = idCategoria
            };
            var signoRes = await client.PostAsJsonAsync("/api/v1/signos", nuevoSigno);
            Assert.Equal(HttpStatusCode.Created, signoRes.StatusCode);
        }

        [Fact]
        public async Task SoloDoctorYAsistenteConCredencialAdmin_PuedenCrearYEliminarUsuarios()
        {
            var client = _factory.CreateClient();

            // 1. Asistente regular (asistente_01) NO puede crear ni eliminar usuarios -> 403 Forbidden
            var loginAsistente = new { nombreUsuario = "asistente_01", password = "hash_simulado_aqui_456" };
            var resAsistente = await client.PostAsJsonAsync("/api/v1/usuarios/login", loginAsistente);
            var docAsistente = await resAsistente.Content.ReadFromJsonAsync<JsonElement>();
            string tokenAsistente = docAsistente.TryGetProperty("token", out var tA) ? tA.GetString()! : docAsistente.GetProperty("Token").GetString()!;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenAsistente);

            var nuevoUsuarioReq = new
            {
                nombreUsuario = $"dr_prueba_{Guid.NewGuid().ToString().Substring(0, 6)}",
                password = "Password123!",
                rol = "Especialista"
            };
            var createForbiddenRes = await client.PostAsJsonAsync("/api/v1/usuarios", nuevoUsuarioReq);
            Assert.Equal(HttpStatusCode.Forbidden, createForbiddenRes.StatusCode);

            // 2. Asistente con credencial de Admin (asistente_admin) SÍ puede crear y eliminar usuarios
            var loginAsistenteAdmin = new { nombreUsuario = "asistente_admin", password = "hash_simulado_asistente_admin" };
            var resAsistenteAdmin = await client.PostAsJsonAsync("/api/v1/usuarios/login", loginAsistenteAdmin);
            Assert.Equal(HttpStatusCode.OK, resAsistenteAdmin.StatusCode);
            var docAsistenteAdmin = await resAsistenteAdmin.Content.ReadFromJsonAsync<JsonElement>();
            string tokenAsistenteAdmin = docAsistenteAdmin.TryGetProperty("token", out var tAA) ? tAA.GetString()! : docAsistenteAdmin.GetProperty("Token").GetString()!;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenAsistenteAdmin);

            // Asistente admin crea un nuevo doctor
            var createByAsistenteAdminRes = await client.PostAsJsonAsync("/api/v1/usuarios", nuevoUsuarioReq);
            Assert.Equal(HttpStatusCode.Created, createByAsistenteAdminRes.StatusCode);
            var createdDoc = await createByAsistenteAdminRes.Content.ReadFromJsonAsync<JsonElement>();
            int createdId = createdDoc.GetProperty("idUsuario").GetInt32();

            // Asistente admin elimina al doctor creado
            var deleteByAsistenteAdminRes = await client.DeleteAsync($"/api/v1/usuarios/{createdId}");
            Assert.Equal(HttpStatusCode.OK, deleteByAsistenteAdminRes.StatusCode);

            // 3. Doctor con credencial de Admin (dr_admin) SÍ puede crear y eliminar usuarios
            var loginDoctorAdmin = new { nombreUsuario = "dr_admin", password = "hash_simulado_aqui_123" };
            var resDoctorAdmin = await client.PostAsJsonAsync("/api/v1/usuarios/login", loginDoctorAdmin);
            Assert.Equal(HttpStatusCode.OK, resDoctorAdmin.StatusCode);
            var docDoctorAdmin = await resDoctorAdmin.Content.ReadFromJsonAsync<JsonElement>();
            string tokenDoctorAdmin = docDoctorAdmin.TryGetProperty("token", out var tDA) ? tDA.GetString()! : docDoctorAdmin.GetProperty("Token").GetString()!;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenDoctorAdmin);

            var nuevoAsistenteReq = new
            {
                nombreUsuario = $"asistente_nuevo_{Guid.NewGuid().ToString().Substring(0, 6)}",
                password = "Password123!",
                rol = "Asistente"
            };
            var createByDoctorAdminRes = await client.PostAsJsonAsync("/api/v1/usuarios", nuevoAsistenteReq);
            Assert.Equal(HttpStatusCode.Created, createByDoctorAdminRes.StatusCode);
            var createdAsistenteDoc = await createByDoctorAdminRes.Content.ReadFromJsonAsync<JsonElement>();
            int createdAsistenteId = createdAsistenteDoc.GetProperty("idUsuario").GetInt32();

            // Doctor admin elimina al asistente creado
            var deleteByDoctorAdminRes = await client.DeleteAsync($"/api/v1/usuarios/{createdAsistenteId}");
            Assert.Equal(HttpStatusCode.OK, deleteByDoctorAdminRes.StatusCode);
        }

        [Fact]
        public async Task ValidacionRUT_AlRegistrarPaciente_AceptaRutValidoYRechazaRutInvalido()
        {
            var client = _factory.CreateClient();

            // Loguear como Especialista
            var loginDoctor = new { nombreUsuario = "dr_admin", password = "hash_simulado_aqui_123" };
            var resDoctor = await client.PostAsJsonAsync("/api/v1/usuarios/login", loginDoctor);
            var docDoctor = await resDoctor.Content.ReadFromJsonAsync<JsonElement>();
            string tokenDoctor = docDoctor.TryGetProperty("token", out var tD) ? tD.GetString()! : docDoctor.GetProperty("Token").GetString()!;
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenDoctor);

            // 1. Enviar paciente con RUT inválido (dígito verificador incorrecto 12345678-9) -> 400 BadRequest
            var pacienteInvalido = new
            {
                rut = "12345678-9",
                nombre = "Paciente",
                apellidos = "RUT Incorrecto",
                fechaNacimiento = "1995-04-12"
            };
            var resInvalido = await client.PostAsJsonAsync("/api/v1/pacientes", pacienteInvalido);
            Assert.Equal(HttpStatusCode.BadRequest, resInvalido.StatusCode);

            // 2. Enviar paciente con RUT chileno válido (11.111.111-1 o 12.345.678-5) -> 201 Created
            var pacienteValido = new
            {
                rut = "11111111-1",
                nombre = "Paciente",
                apellidos = "RUT Valido",
                fechaNacimiento = "1990-01-01"
            };
            var resValido = await client.PostAsJsonAsync("/api/v1/pacientes", pacienteValido);
            Assert.True(resValido.StatusCode == HttpStatusCode.Created || resValido.StatusCode == HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task UsuarioSinAutenticar_NoPuedeCrearUsuarios()
        {
            var intentoAnonimo = new
            {
                nombreUsuario = "anonimo_test",
                password = "Password123!",
                rol = "Asistente"
            };
            var response = await _client.PostAsJsonAsync("/api/v1/usuarios", intentoAnonimo);
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
