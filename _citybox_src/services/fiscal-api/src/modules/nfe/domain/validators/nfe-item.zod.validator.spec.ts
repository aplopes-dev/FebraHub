import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import {
  type NfeItemDto,
  validateNfeItem,
  validateNfeItems,
} from './nfe-item.zod.validator';

const CONTEXT = 'NfeItemValidatorSpec';

function baseItem(overrides: Partial<NfeItemDto> = {}): NfeItemDto {
  return {
    description: 'Produto de teste',
    ncm: '12345678',
    cfop: '5102',
    quantity: 1,
    unitValue: 10,
    totalValue: 10,
    ...overrides,
  };
}

describe('nfe-item.zod.validator (spec erp/026, FR-004)', () => {
  it('aceita um item sem PIS/COFINS/IPI/ICMS-alíquota — não-regressão', () => {
    expect(() => validateNfeItem(baseItem(), CONTEXT)).not.toThrow();
  });

  it('aceita um item com PIS/COFINS/IPI válidos', () => {
    const item = baseItem({
      icmsAliquota: 18,
      origem: '0',
      pis: { cst: '01', aliquota: 1.65 },
      cofins: { cst: '01', aliquota: 7.6 },
      ipi: { cst: '50', cEnq: '999', aliquota: 10 },
    });
    expect(() => validateNfeItem(item, CONTEXT)).not.toThrow();
  });

  it('rejeita CST de PIS fora do conjunto suportado', () => {
    const item = baseItem({ pis: { cst: '99', aliquota: 1.65 } });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('rejeita CST de COFINS fora do conjunto suportado', () => {
    const item = baseItem({ cofins: { cst: 'XX', aliquota: 1.65 } });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('rejeita CST de IPI fora do conjunto suportado (só saída, 50-55/99)', () => {
    const item = baseItem({ ipi: { cst: '00', cEnq: '999' } });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('rejeita alíquota de PIS negativa', () => {
    const item = baseItem({ pis: { cst: '01', aliquota: -1 } });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('rejeita alíquota de IPI acima de 100', () => {
    const item = baseItem({ ipi: { cst: '50', cEnq: '999', aliquota: 101 } });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('rejeita alíquota de ICMS fora de 0..100', () => {
    const item = baseItem({ icmsAliquota: 150 });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('rejeita origem fora de 0..8', () => {
    const item = baseItem({ origem: '9' });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('IPI não tributado (51-55) aceita sem alíquota', () => {
    const item = baseItem({ ipi: { cst: '51', cEnq: '999' } });
    expect(() => validateNfeItem(item, CONTEXT)).not.toThrow();
  });

  it('rejeita CST de ICMS fora do conjunto suportado', () => {
    const item = baseItem({ cst: '99' });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('rejeita CSOSN fora do conjunto suportado', () => {
    const item = baseItem({ csosn: '999' });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('rejeita item com CST e CSOSN preenchidos ao mesmo tempo (ambíguo)', () => {
    const item = baseItem({ cst: '00', csosn: '102' });
    expect(() => validateNfeItem(item, CONTEXT)).toThrow(ValidatorDomainError);
  });

  it('aceita um item Regime Normal só com CST de ICMS válido', () => {
    const item = baseItem({ cst: '00' });
    expect(() => validateNfeItem(item, CONTEXT)).not.toThrow();
  });

  it('aceita um item Simples Nacional só com CSOSN válido', () => {
    const item = baseItem({ csosn: '102' });
    expect(() => validateNfeItem(item, CONTEXT)).not.toThrow();
  });

  it('valida uma lista com item válido e item inválido — rejeita a lista inteira', () => {
    const items = [baseItem(), baseItem({ pis: { cst: '99' } })];
    expect(() => validateNfeItems(items, CONTEXT)).toThrow(
      ValidatorDomainError,
    );
  });
});
