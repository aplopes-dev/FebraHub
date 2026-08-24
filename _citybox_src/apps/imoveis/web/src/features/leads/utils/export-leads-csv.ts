import { downloadCsv } from '@/features/shared/utils/download-csv';
import {
  LEAD_PAYMENT_INTENT_LABEL,
  LEAD_SOURCE_LABEL,
  LEAD_STATUS_LABEL,
  type ContactLeadDetail,
  type LeadPaymentIntent,
} from '../types';

export function formatPaymentIntentsCsv(
  intents?: readonly LeadPaymentIntent[],
): string {
  if (!intents?.length) return '';
  return intents
    .map((intent) => LEAD_PAYMENT_INTENT_LABEL[intent] ?? intent)
    .join('; ');
}

/**
 * Exporta leads para CSV com UTF-8 BOM (via `downloadCsv`) e colunas do CRM.
 */
export function exportLeadsToCSV(leads: readonly ContactLeadDetail[]): void {
  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadCsv(
    `leads_export_${dateStamp}.csv`,
    [
      'Nome',
      'Telefone',
      'Email',
      'Status',
      'Origem',
      'Intenção de pagamento',
      'Imóveis Vinculados',
      'Data de Cadastro',
    ],
    leads.map((lead) => [
      lead.name ?? '',
      lead.phone ?? '',
      lead.email ?? '',
      LEAD_STATUS_LABEL[lead.status] ?? lead.status ?? '',
      LEAD_SOURCE_LABEL[lead.leadSource] ?? lead.leadSource ?? '',
      formatPaymentIntentsCsv(lead.paymentIntents),
      lead.matchedProperties.map((p) => p.name).filter(Boolean).join('; ') ||
        lead.propertyName ||
        '',
      formatCadastroDate(lead),
    ]),
  );
}

function formatCadastroDate(lead: ContactLeadDetail): string {
  const raw = lead.createdAt?.trim();
  if (raw) {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR');
    }
  }
  const fallback = lead.lastContactedAt?.trim();
  if (fallback) {
    const d = new Date(
      fallback.length === 10 ? `${fallback}T12:00:00` : fallback,
    );
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR');
    }
  }
  return '';
}
