/**
 * Validador y formateador de RUT chileno con algoritmo de Módulo 11.
 */

export function validarRutChileno(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;

  // Limpiar cualquier carácter que no sea dígito o k/K
  const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();

  // El RUT chileno tiene entre 8 y 9 caracteres (7 u 8 dígitos de cuerpo + 1 dígito verificador)
  if (limpio.length < 8 || limpio.length > 9) {
    return false;
  }

  const cuerpo = limpio.slice(0, -1);
  const dvIngresado = limpio.slice(-1);

  // El cuerpo debe ser estrictamente numérico
  if (!/^\d+$/.test(cuerpo)) {
    return false;
  }

  // Algoritmo Módulo 11
  let suma = 0;
  let factor = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const resto = suma % 11;
  const dvEsperado = 11 - resto;

  let dvCalculado = '';
  if (dvEsperado === 11) {
    dvCalculado = '0';
  } else if (dvEsperado === 10) {
    dvCalculado = 'K';
  } else {
    dvCalculado = dvEsperado.toString();
  }

  return dvIngresado === dvCalculado;
}

export function formatearRutChileno(rut: string): string {
  const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 2) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  return `${cuerpo}-${dv}`;
}

