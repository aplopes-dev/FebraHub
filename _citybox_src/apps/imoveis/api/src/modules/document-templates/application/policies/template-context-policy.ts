import type { ApiDocumentTemplateType } from '../../domain/mappers/document-template-enum.mapper';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';

export type DocumentGenerateContext = {
  leadId?: string;
  appointmentId?: string;
  transactionId?: string;
};

export type ResolvedDocumentContext = {
  kind: 'lead' | 'appointment' | 'transaction';
  leadId?: string;
  appointmentId?: string;
  transactionId?: string;
};

export function countContextIds(input: DocumentGenerateContext): number {
  return [input.leadId, input.appointmentId, input.transactionId].filter(
    (value) => Boolean(value?.trim()),
  ).length;
}

export function resolveDocumentContext(
  contextName: string,
  input: DocumentGenerateContext,
): ResolvedDocumentContext {
  const leadId = input.leadId?.trim() || undefined;
  const appointmentId = input.appointmentId?.trim() || undefined;
  const transactionId = input.transactionId?.trim() || undefined;
  const count = [leadId, appointmentId, transactionId].filter(Boolean).length;

  if (count !== 1) {
    throw new ValidatorDomainError({
      internalMessage: `Generate context must have exactly one id (got ${count})`,
      externalMessage:
        'Informe exatamente um contexto: lead, visita ou negócio.',
      context: contextName,
    });
  }

  if (appointmentId) {
    return { kind: 'appointment', appointmentId };
  }
  if (transactionId) {
    return { kind: 'transaction', transactionId };
  }
  return { kind: 'lead', leadId };
}

const APPOINTMENT_TYPES: readonly ApiDocumentTemplateType[] = ['termo-visita'];
const TRANSACTION_TYPES: readonly ApiDocumentTemplateType[] = [
  'recibo-sinal',
  'proposta-compra',
  'proposta-locacao',
];
const LEAD_TYPES: readonly ApiDocumentTemplateType[] = [
  'contrato-promessa-compra-venda',
  'contrato-locacao',
  'outro',
  'proposta-compra',
  'proposta-locacao',
  'recibo-sinal',
];

export function assertTemplateMatchesContext(
  contextName: string,
  tipo: ApiDocumentTemplateType,
  resolved: ResolvedDocumentContext,
): void {
  if (resolved.kind === 'appointment' && !APPOINTMENT_TYPES.includes(tipo)) {
    throw new ValidatorDomainError({
      internalMessage: `Template ${tipo} cannot be generated from appointment`,
      externalMessage: 'Este modelo só pode ser gerado a partir de uma visita.',
      context: contextName,
    });
  }
  if (resolved.kind === 'transaction' && !TRANSACTION_TYPES.includes(tipo)) {
    throw new ValidatorDomainError({
      internalMessage: `Template ${tipo} cannot be generated from transaction`,
      externalMessage:
        'Este modelo só pode ser gerado a partir de um negócio.',
      context: contextName,
    });
  }
  if (resolved.kind === 'lead' && !LEAD_TYPES.includes(tipo)) {
    throw new ValidatorDomainError({
      internalMessage: `Template ${tipo} cannot be generated from lead`,
      externalMessage:
        'Este modelo não pode ser gerado a partir da ficha do lead.',
      context: contextName,
    });
  }
}

export function defaultLeadDocumentKind(
  tipo: ApiDocumentTemplateType,
): 'contract' | 'other' {
  if (
    tipo === 'contrato-promessa-compra-venda' ||
    tipo === 'contrato-locacao'
  ) {
    return 'contract';
  }
  return 'other';
}

export function templatesForSurface(
  surface: 'lead' | 'appointment' | 'transaction',
): readonly ApiDocumentTemplateType[] {
  if (surface === 'appointment') return APPOINTMENT_TYPES;
  if (surface === 'transaction') return TRANSACTION_TYPES;
  return LEAD_TYPES;
}
