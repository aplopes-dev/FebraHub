import type { AppointmentEntity } from '../../../appointments/domain/entities/appointment.entity';
import type { LeadEntity } from '../../../leads/domain/entities/lead.entity';
import { PROPERTY_TYPE_LABEL } from '../../../leads/domain/mappers/lead-enum.mapper';
import type { PropertyEntity } from '../../../properties/domain/entities/property.entity';
import type { AgentProfileEntity } from '../../../settings/domain/entities/agent-profile.entity';
import type { StoreSettingsEntity } from '../../../settings/domain/entities/store-settings.entity';
import type { TransactionEntity } from '../../../transactions/domain/entities/transaction.entity';
import {
  emptyMergeSnapshot,
  type DocumentMergeSnapshot,
} from './document-variable-catalog';
import {
  formatBRL,
  formatCentsBRL,
  formatPtBrDate,
  formatPtBrTime,
  joinAddress,
} from './format-merge-values';

const LISTING_TYPE_LABEL: Record<string, string> = {
  sale: 'Venda',
  rent: 'Locação',
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix: 'PIX',
  transfer: 'Transferência (TED/DOC)',
  boleto: 'Boleto',
  cash: 'À vista',
  check: 'Cheque',
  debit: 'Cartão de débito',
  credit: 'Cartão de crédito',
  financing: 'Financiamento bancário',
  consortium: 'Consórcio',
  fgts: 'FGTS',
  'trade-in': 'Permuta / dação de imóvel',
  other: 'Outro',
};

export type MergeSnapshotSource = {
  lead?: LeadEntity | null;
  property?: PropertyEntity | null;
  appointment?: AppointmentEntity | null;
  transaction?: TransactionEntity | null;
  agent?: AgentProfileEntity | null;
  store?: StoreSettingsEntity | null;
  now?: Date;
};

export function buildMergeSnapshot(
  source: MergeSnapshotSource,
): DocumentMergeSnapshot {
  const base = emptyMergeSnapshot();
  const lead = source.lead;
  const property = source.property;
  const appointment = source.appointment;
  const transaction = source.transaction;
  const agent = source.agent;
  const store = source.store;
  const now = source.now ?? new Date();

  return {
    ...base,
    lead: {
      nome: lead?.name ?? appointment?.leadName ?? transaction?.leadName ?? '',
      telefone: lead?.phone ?? appointment?.leadPhone ?? '',
      email: lead?.email ?? appointment?.leadEmail ?? '',
      cidade: lead?.city ?? '',
    },
    imovel: {
      titulo:
        property?.name ??
        lead?.matchedProperties[0]?.propertyName ??
        lead?.propertyName ??
        transaction?.propertyName ??
        '',
      endereco: property
        ? joinAddress([
            property.address,
            property.city,
            property.state,
            property.zipCode,
          ])
        : '',
      preco: property ? formatBRL(property.cost) : '',
      tipo: property ? PROPERTY_TYPE_LABEL[property.type] ?? property.type : '',
      finalidade: property
        ? (LISTING_TYPE_LABEL[property.listingType] ?? property.listingType)
        : '',
    },
    corretor: {
      nome: agent?.name ?? '',
      creci: agent?.stateId ?? '',
      telefone: agent?.phone ?? '',
    },
    loja: { nome: store?.system.companyName ?? '' },
    visita: {
      data: formatPtBrDate(appointment?.startsAt),
      horario: formatPtBrTime(appointment?.startsAt),
      local: appointment?.location || property?.name || appointment?.title || '',
    },
    negocio: {
      tipo:
        transaction?.type === 'RENTAL'
          ? 'Locação'
          : transaction?.type === 'SALE'
            ? 'Venda'
            : '',
      valor: transaction ? formatCentsBRL(transaction.grossValueCents) : '',
      formaPagamento: transaction
        ? (PAYMENT_METHOD_LABEL[transaction.paymentMethod] ??
          transaction.paymentMethod)
        : '',
    },
    locacao: {
      locador: transaction?.rental?.landlordName ?? '',
      locatario: transaction?.rental?.tenantName ?? lead?.name ?? '',
      aluguel: transaction?.rental
        ? formatCentsBRL(transaction.rental.baseRentCents)
        : '',
    },
    data: { hoje: formatPtBrDate(now) },
  };
}
