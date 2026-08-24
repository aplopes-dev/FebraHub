import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { DocumentContextForbiddenError } from '../../domain/errors/document-context-forbidden.error';
import type { ApiDocumentTemplateType } from '../../domain/mappers/document-template-enum.mapper';

export type DocumentGenerateContextIds = {
  leadId?: string;
  appointmentId?: string;
  transactionId?: string;
};

export type ResolvedDocumentContextKind = 'lead' | 'appointment' | 'transaction';

export type ResolvedDocumentContextIds = {
  kind: ResolvedDocumentContextKind;
  leadId?: string;
  appointmentId?: string;
  transactionId?: string;
};

const APPOINTMENT_TYPES: ReadonlySet<ApiDocumentTemplateType> = new Set([
  'termo-visita',
]);

const TRANSACTION_TYPES: ReadonlySet<ApiDocumentTemplateType> = new Set([
  'recibo-sinal',
  'proposta-compra',
  'proposta-locacao',
]);

const LEAD_TYPES: ReadonlySet<ApiDocumentTemplateType> = new Set([
  'contrato-promessa-compra-venda',
  'contrato-locacao',
  'outro',
]);

export const CONTRACT_TEMPLATE_TYPES: ReadonlySet<ApiDocumentTemplateType> =
  new Set(['contrato-promessa-compra-venda', 'contrato-locacao']);

export function resolveDocumentContextIds(
  input: DocumentGenerateContextIds,
  context: string,
): ResolvedDocumentContextIds {
  const leadId = input.leadId?.trim() || undefined;
  const appointmentId = input.appointmentId?.trim() || undefined;
  const transactionId = input.transactionId?.trim() || undefined;
  const count = [leadId, appointmentId, transactionId].filter(Boolean).length;
  if (count !== 1) {
    throw new ValidatorDomainError({
      internalMessage: 'Expected exactly one of leadId, appointmentId, transactionId',
      externalMessage:
        'Informe exatamente um contexto: lead, compromisso ou transação.',
      context,
    });
  }
  if (leadId) return { kind: 'lead', leadId };
  if (appointmentId) return { kind: 'appointment', appointmentId };
  return { kind: 'transaction', transactionId };
}

export function assertTemplateMatchesContext(
  tipo: ApiDocumentTemplateType,
  kind: ResolvedDocumentContextKind,
  context: string,
): void {
  const allowed =
    (kind === 'appointment' && APPOINTMENT_TYPES.has(tipo)) ||
    (kind === 'transaction' && TRANSACTION_TYPES.has(tipo)) ||
    (kind === 'lead' && LEAD_TYPES.has(tipo));
  if (!allowed) {
    throw new DocumentContextForbiddenError(
      context,
      `Template type ${tipo} is not valid for ${kind} context`,
    );
  }
}

export function defaultLeadDocumentKind(
  tipo: ApiDocumentTemplateType,
): 'contract' | 'other' {
  return CONTRACT_TEMPLATE_TYPES.has(tipo) ? 'contract' : 'other';
}
