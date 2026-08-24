import { OperationNature } from './operation-nature.entity';

const ORG = 'org-1';

function make(
  overrides: Partial<Parameters<typeof OperationNature.create>[0]> = {},
) {
  return OperationNature.create({
    organizationId: ORG,
    name: 'Devolução para Fornecedor',
    description: null,
    cfopRules: [{ fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' }],
    groupRules: [],
    ...overrides,
  });
}

describe('OperationNature (entidade, spec erp/020)', () => {
  it('cria uma natureza válida', () => {
    const nature = make();
    expect(nature.name).toBe('Devolução para Fornecedor');
    expect(nature.keepBenefitInUf).toBe(false);
    expect(nature.cfopRules).toHaveLength(1);
  });

  it('força keepBenefitInUf = false nesta fatia (FR-009)', () => {
    const nature = make();
    expect(nature.keepBenefitInUf).toBe(false);
  });

  it('recusa nome vazio', () => {
    expect(() => make({ name: '   ' })).toThrow();
  });

  it('recusa descrição acima de 300 caracteres', () => {
    expect(() => make({ description: 'x'.repeat(301) })).toThrow();
  });

  it('recusa CFOP "De" que não é de entrada', () => {
    expect(() =>
      make({
        cfopRules: [{ fromCfop: '5102', toCfop: '5202', icmsLivre: 'AMBOS' }],
      }),
    ).toThrow();
  });

  it('recusa CFOP "Para" que não é de saída', () => {
    expect(() =>
      make({
        cfopRules: [{ fromCfop: '1102', toCfop: '1101', icmsLivre: 'AMBOS' }],
      }),
    ).toThrow();
  });

  it('recusa duplicata exata (mesmo fromCfop + mesma condição)', () => {
    expect(() =>
      make({
        cfopRules: [
          { fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' },
          { fromCfop: '1102', toCfop: '5201', icmsLivre: 'AMBOS' },
        ],
      }),
    ).toThrow();
  });

  it('aceita mesmo fromCfop com condições diferentes (geral + exceção)', () => {
    const nature = make({
      cfopRules: [
        { fromCfop: '1102', toCfop: '5202', icmsLivre: 'AMBOS' },
        { fromCfop: '1102', toCfop: '5201', icmsLivre: 'SIM' },
      ],
    });
    expect(nature.cfopRules).toHaveLength(2);
  });

  it('recusa regra de grupo sem from/to', () => {
    expect(() =>
      make({
        groupRules: [{ taxType: 'ICMS', fromGroupId: '', toGroupId: 'x' }],
      }),
    ).toThrow();
  });

  it('atualiza mantendo a organização e regenerando updatedAt', () => {
    const nature = make();
    const updated = nature.update({
      name: 'Devolução revisada',
      description: 'nova',
      cfopRules: [{ fromCfop: '2102', toCfop: '6202', icmsLivre: 'NAO' }],
      groupRules: [],
    });
    expect(updated.name).toBe('Devolução revisada');
    expect(updated.description).toBe('nova');
    expect(updated.cfopRules[0].fromCfop).toBe('2102');
    expect(updated.organizationId).toBe(ORG);
  });
});
