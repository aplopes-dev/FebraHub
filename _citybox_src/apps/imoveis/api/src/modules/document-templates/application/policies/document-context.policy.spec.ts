import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { DocumentContextForbiddenError } from '../../domain/errors/document-context-forbidden.error';
import {
  assertTemplateMatchesContext,
  resolveDocumentContextIds,
} from './document-context.policy';

describe('document-context.policy', () => {
  it('exige exatamente um contexto', () => {
    expect(() =>
      resolveDocumentContextIds({}, 'test'),
    ).toThrow(ValidatorDomainError);
    expect(() =>
      resolveDocumentContextIds(
        { leadId: 'a', appointmentId: 'b' },
        'test',
      ),
    ).toThrow(ValidatorDomainError);
  });

  it('termo-visita só no compromisso', () => {
    expect(() =>
      assertTemplateMatchesContext('termo-visita', 'lead', 'test'),
    ).toThrow(DocumentContextForbiddenError);
    expect(() =>
      assertTemplateMatchesContext('termo-visita', 'appointment', 'test'),
    ).not.toThrow();
  });

  it('recibo e propostas só na transação', () => {
    expect(() =>
      assertTemplateMatchesContext('recibo-sinal', 'lead', 'test'),
    ).toThrow(DocumentContextForbiddenError);
    expect(() =>
      assertTemplateMatchesContext('proposta-compra', 'transaction', 'test'),
    ).not.toThrow();
  });

  it('contratos só no lead', () => {
    expect(() =>
      assertTemplateMatchesContext(
        'contrato-promessa-compra-venda',
        'appointment',
        'test',
      ),
    ).toThrow(DocumentContextForbiddenError);
    expect(() =>
      assertTemplateMatchesContext(
        'contrato-promessa-compra-venda',
        'lead',
        'test',
      ),
    ).not.toThrow();
  });
});
