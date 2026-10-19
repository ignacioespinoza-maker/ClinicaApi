import { test, expect } from '@playwright/test';

test.describe('Flujo End-to-End: Login, Crear y Listar Evaluación Clínica', () => {
  test('Flujo completo: Iniciar sesión como Especialista, registrar evaluación y verificar en el listado', async ({ page }) => {
    // 1. Visitar página de login
    await page.goto('/login');
    await expect(page).toHaveTitle(/Clínica Médica/i);

    // 2. Llenar credenciales de Especialista
    await page.fill('#nombreUsuario', 'dr_admin');
    await page.fill('#password', 'hash_simulado_aqui_123');

    // 3. Iniciar sesión
    await page.click('button[type="submit"]');

    // 4. Verificar redirección al Dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('#dashboard-title')).toBeVisible();

    // 5. Navegar a Nueva Evaluación
    await page.click('a[href="/evaluaciones/nueva"]');
    await expect(page).toHaveURL('/evaluaciones/nueva');
    await expect(page.locator('#form-title')).toContainText('Registrar Nueva Evaluación Clínica');

    // 6. Completar formulario con validación
    await page.selectOption('#idPaciente', { index: 1 });
    await page.selectOption('#idSigno', { index: 1 });
    await page.fill('#resultado', 'Diagnóstico Automatizado Playwright E2E');
    await page.fill('#observaciones', 'Observación clínica verificada en flujo de prueba de integración de extremo a extremo.');

    // 7. Enviar formulario
    await page.click('button[type="submit"]');

    // 8. Verificar redirección a /evaluaciones y presencia del registro creado
    await expect(page).toHaveURL('/evaluaciones');
    await expect(page.locator('body')).toContainText('Diagnóstico Automatizado Playwright E2E');
  });

  test('Flujo de Control de Acceso: Asistente es bloqueado (403) al intentar ingresar a creación', async ({ page }) => {
    // 1. Login como Asistente
    await page.goto('/login');
    await page.fill('#nombreUsuario', 'asistente_01');
    await page.fill('#password', 'hash_simulado_aqui_456');
    await page.click('button[type="submit"]');

    // 2. Verificar ingreso al panel como Asistente
    await expect(page).toHaveURL('/');
    await expect(page.locator('.role-asistente').last()).toBeVisible();

    // 3. Intentar forzar navegación a la URL privada de creación
    await page.goto('/evaluaciones/nueva');

    // 4. Verificar redirección a Acceso Denegado (403)
    await expect(page).toHaveURL('/acceso-denegado');
    await expect(page.locator('#denied-title')).toContainText('403 - Acceso Denegado');
  });
});
