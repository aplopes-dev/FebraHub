import { randomUUID } from 'crypto';
import { Company } from './company.entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

function buildCompany(): Company {
  return Company.create({
    storeId: randomUUID(),
    cnpj: '11444777000161',
    legalName: 'EMPRESA DE TESTE LTDA',
    tradeName: null,
    stateRegistration: '123456789',
    municipalRegistration: null,
    taxRegime: 'SIMPLES_NACIONAL',
    cityCodeIbge: '2913606',
    uf: 'BA',
    address: {
      street: 'Rua Teste',
      number: '1',
      complement: null,
      district: 'Centro',
      city: 'Ilheus',
      zipCode: '45650000',
    },
  });
}

/// Justificativas padrão (spec erp/023, N6).
describe('Company — justificativas padrão', () => {
  it('nasce com as duas justificativas nulas', () => {
    const company = buildCompany();
    expect(company.inutilizationJustification).toBeNull();
    expect(company.cancellationJustification).toBeNull();
  });

  it('aceita justificativa com 15+ caracteres', () => {
    const company = buildCompany();
    company.update({
      inutilizationJustification: 'Erro de digitação no valor do item.',
    });
    expect(company.inutilizationJustification).toBe(
      'Erro de digitação no valor do item.',
    );
  });

  it('recusa justificativa com menos de 15 caracteres', () => {
    const company = buildCompany();
    expect(() =>
      company.update({ cancellationJustification: 'curta demais' }),
    ).toThrow(ValidatorDomainError);
  });

  it('recusa justificativa com mais de 255 caracteres', () => {
    const company = buildCompany();
    expect(() =>
      company.update({ inutilizationJustification: 'x'.repeat(256) }),
    ).toThrow(ValidatorDomainError);
  });

  // Achado do database-reviewer: os dois testes acima usam valores "obviamente"
  // fora da faixa — nenhum pina exatamente o limite 15/255 da SEFAZ. Um `min(14)`
  // ou `max(254)` por engano passaria despercebido sem estes.
  it('recusa com exatamente 14 caracteres (um abaixo do mínimo)', () => {
    const company = buildCompany();
    expect(() =>
      company.update({ cancellationJustification: 'x'.repeat(14) }),
    ).toThrow(ValidatorDomainError);
  });

  it('aceita com exatamente 15 caracteres (o mínimo)', () => {
    const company = buildCompany();
    company.update({ cancellationJustification: 'x'.repeat(15) });
    expect(company.cancellationJustification).toHaveLength(15);
  });

  it('aceita com exatamente 255 caracteres (o máximo)', () => {
    const company = buildCompany();
    company.update({ inutilizationJustification: 'x'.repeat(255) });
    expect(company.inutilizationJustification).toHaveLength(255);
  });

  it('recusa string vazia — só `null` limpa o campo', () => {
    const company = buildCompany();
    expect(() => company.update({ inutilizationJustification: '' })).toThrow(
      ValidatorDomainError,
    );
  });

  it('null limpa uma justificativa já preenchida', () => {
    const company = buildCompany();
    company.update({
      cancellationJustification: 'Cliente desistiu da compra no mesmo dia.',
    });
    expect(company.cancellationJustification).not.toBeNull();

    company.update({ cancellationJustification: null });
    expect(company.cancellationJustification).toBeNull();
  });

  it('não altera a justificativa quando o campo não é informado no update', () => {
    const company = buildCompany();
    company.update({
      inutilizationJustification: 'Numeração pulada por engano no sistema.',
    });

    // Outro campo qualquer, sem mencionar a justificativa — undefined não deve
    // apagá-la (mesma regra do BUG-02: undefined = "não informado neste PATCH").
    company.update({ active: true });

    expect(company.inutilizationJustification).toBe(
      'Numeração pulada por engano no sistema.',
    );
  });
});

/// CSC do Emitente (spec erp/024, Parte B).
describe('Company — CSC', () => {
  it('nasce sem CSC', () => {
    const company = buildCompany();
    expect(company.hasCsc()).toBe(false);
  });

  it('setCsc grava os dois campos juntos e hasCsc passa a true', () => {
    const company = buildCompany();
    company.setCsc({ cscId: '000001', cscTokenEncrypted: 'cifrado' });
    expect(company.hasCsc()).toBe(true);
    expect(company.cscId).toBe('000001');
    expect(company.cscTokenEncrypted).toBe('cifrado');
  });

  it('clearCsc zera os dois campos juntos e hasCsc volta a false', () => {
    const company = buildCompany();
    company.setCsc({ cscId: '000001', cscTokenEncrypted: 'cifrado' });

    company.clearCsc();

    expect(company.hasCsc()).toBe(false);
    expect(company.cscId).toBeNull();
    expect(company.cscTokenEncrypted).toBeNull();
  });

  it('clearCsc é idempotente — chamar sobre um Emitente sem CSC não lança', () => {
    const company = buildCompany();
    expect(() => company.clearCsc()).not.toThrow();
    expect(company.hasCsc()).toBe(false);
  });
});
