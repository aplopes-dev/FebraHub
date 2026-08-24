import {
  assertTemplateMatchesContext,
  countContextIds,
  resolveDocumentContext,
} from './template-context-policy';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

describe('template-context-policy', () => {
  it('exige exatamente um contexto', () => {
    expect(countContextIds({})).toBe(0);
    expect(() => resolveDocumentContext('t', {})).toThrow(ValidatorDomainError);
    expect(() =>
      resolveDocumentContext('t', { leadId: 'l1', appointmentId: 'a1' }),
    ).toThrow(ValidatorDomainError);
  });

  it('termo de visita exige appointment', () => {
    expect(() =>
      assertTemplateMatchesContext('t', 'termo-visita', {
        kind: 'lead',
        leadId: 'l1',
      }),
    ).toThrow(ValidatorDomainError);

    expect(() =>
      assertTemplateMatchesContext('t', 'termo-visita', {
        kind: 'appointment',
        appointmentId: 'a1',
      }),
    ).not.toThrow();
  });

  it('contrato pode sair do lead', () => {
    expect(() =>
      assertTemplateMatchesContext('t', 'contrato-promessa-compra-venda', {
        kind: 'lead',
        leadId: 'l1',
      }),
    ).not.toThrow();
  });
});
