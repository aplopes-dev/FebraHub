import {
  isValidCnpj,
  isValidCpf,
  isValidDocument,
  normalizeDocument,
} from './document';

describe('normalizeDocument', () => {
  it('mantém só os dígitos', () => {
    expect(normalizeDocument('123.456.789-09')).toBe('12345678909');
    expect(normalizeDocument('11.222.333/0001-81')).toBe('11222333000181');
  });

  it('devolve string vazia quando não há dígito', () => {
    expect(normalizeDocument('abc./-')).toBe('');
  });
});

describe('isValidCpf', () => {
  it('aceita CPF válido com e sem máscara', () => {
    expect(isValidCpf('123.456.789-09')).toBe(true);
    expect(isValidCpf('12345678909')).toBe(true);
  });

  it('rejeita dígito verificador errado', () => {
    expect(isValidCpf('12345678900')).toBe(false);
  });

  it('rejeita sequências de dígitos repetidos', () => {
    // Passam no módulo 11 mas são inválidas por definição.
    for (const digit of '0123456789') {
      expect(isValidCpf(digit.repeat(11))).toBe(false);
    }
  });

  it('rejeita comprimento diferente de 11', () => {
    expect(isValidCpf('1234567890')).toBe(false);
    expect(isValidCpf('123456789099')).toBe(false);
    expect(isValidCpf('')).toBe(false);
  });

  it('rejeita CNPJ válido passado como CPF', () => {
    expect(isValidCpf('11222333000181')).toBe(false);
  });
});

describe('isValidCnpj', () => {
  it('aceita CNPJ válido com e sem máscara', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11222333000181')).toBe(true);
  });

  it('rejeita dígito verificador errado', () => {
    expect(isValidCnpj('11222333000182')).toBe(false);
  });

  it('rejeita sequências de dígitos repetidos', () => {
    for (const digit of '0123456789') {
      expect(isValidCnpj(digit.repeat(14))).toBe(false);
    }
  });

  it('rejeita comprimento diferente de 14', () => {
    expect(isValidCnpj('1122233300018')).toBe(false);
    expect(isValidCnpj('112223330001811')).toBe(false);
    expect(isValidCnpj('')).toBe(false);
  });

  it('rejeita CPF válido passado como CNPJ', () => {
    expect(isValidCnpj('12345678909')).toBe(false);
  });
});

describe('isValidDocument', () => {
  it('PF exige CPF', () => {
    expect(isValidDocument('PF', '123.456.789-09')).toBe(true);
    expect(isValidDocument('PF', '11.222.333/0001-81')).toBe(false);
  });

  it('PJ exige CNPJ', () => {
    expect(isValidDocument('PJ', '11.222.333/0001-81')).toBe(true);
    expect(isValidDocument('PJ', '123.456.789-09')).toBe(false);
  });
});
