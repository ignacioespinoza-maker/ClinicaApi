import { describe, it, expect } from 'vitest';
import { validarRutChileno, formatearRutChileno } from '../utils/rutValidator';

describe('RUT Chileno Validator (Módulo 11)', () => {
  it('valida correctamente RUTs chilenos válidos con dígito numérico', () => {
    expect(validarRutChileno('11.111.111-1')).toBe(true);
    expect(validarRutChileno('11111111-1')).toBe(true);
    expect(validarRutChileno('12.345.678-5')).toBe(true);
    expect(validarRutChileno('12345678-5')).toBe(true);
    expect(validarRutChileno('19.876.543-0')).toBe(true);
  });

  it('valida correctamente RUTs con dígito verificador K', () => {
    // 7.654.321-K o similar
    // Verifiquemos: cuerpo 10000000 -> 0*2+0*3+0*4+0*5+0*6+0*7+0*2+1*3 = 3. 11-3 = 8 (10000000-8)
    // Para DV K: 11 - (suma % 11) = 10 -> suma % 11 = 1
    // 10000006: 6*2 + 1*3 = 15. 15 % 11 = 4.
    // 22333444: 4*2+4*3+4*4+3*5+3*6+3*7+2*2+2*3 = 8+12+16+15+18+21+4+6 = 100. 100 % 11 = 1 -> 11-1 = 10 -> 'K'!
    expect(validarRutChileno('22.333.444-K')).toBe(true);
    expect(validarRutChileno('22333444-k')).toBe(true);
  });

  it('rechaza RUTs con dígito verificador erróneo', () => {
    expect(validarRutChileno('11111111-2')).toBe(false);
    expect(validarRutChileno('12345678-9')).toBe(false);
    expect(validarRutChileno('22333444-5')).toBe(false);
  });

  it('rechaza formatos incorrectos, vacíos o no numéricos', () => {
    expect(validarRutChileno('')).toBe(false);
    expect(validarRutChileno('123')).toBe(false);
    expect(validarRutChileno('abcdefgh-i')).toBe(false);
    expect(validarRutChileno('1234567890123')).toBe(false);
  });

  it('formatea correctamente el RUT al estándar XXXXXXXX-X', () => {
    expect(formatearRutChileno('11.111.111-1')).toBe('11111111-1');
    expect(formatearRutChileno('123456785')).toBe('12345678-5');
    expect(formatearRutChileno('22.333.444-k')).toBe('22333444-K');
  });
});

