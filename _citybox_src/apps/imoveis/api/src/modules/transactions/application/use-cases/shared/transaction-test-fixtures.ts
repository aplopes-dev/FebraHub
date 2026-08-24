import type {
  CommissionSplit,
  RentalConfig,
  TransactionPaymentMethod,
  TransactionStatus,
  TransactionType,
} from '../../../domain/entities/transaction.entity';
import type {
  CreateTransactionPayload,
  TransactionRepository,
} from '../../../domain/repositories/transaction.repository.interface';
import { buildCommissionSplit } from '../../policies/commission-split.math';

export const TEST_STORE = 'store-1';

export function makeSplit(
  grossValueCents: number,
  commissionPercent = 6,
): CommissionSplit {
  return buildCommissionSplit(grossValueCents, commissionPercent, {
    agencyPercent: 40,
    captorPercent: 30,
    sellerPercent: 30,
  });
}

export function makeRental(
  overrides: Partial<RentalConfig> = {},
): RentalConfig {
  return {
    landlordName: 'Proprietário',
    tenantName: 'Inquilino',
    baseRentCents: 300_000,
    condoCents: 0,
    iptuCents: 0,
    adminFeePercent: 10,
    dueDay: 10,
    payoutStatus: 'AWAITING_PAYMENT',
    receivedCents: 300_000,
    deductions: [],
    ...overrides,
  };
}

export type SeedTransactionOverrides = {
  storeId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  title?: string;
  propertyId?: string | null;
  propertyName?: string;
  leadId?: string | null;
  leadName?: string | null;
  dealId?: string | null;
  captorId?: string;
  sellerId?: string | null;
  grossValueCents?: number;
  paymentMethod?: TransactionPaymentMethod;
  commissionPercent?: number;
  rental?: RentalConfig | null;
};

/** Cria uma transação direto no repositório, sem passar pelo use case de criação. */
export async function seedTransaction(
  repo: TransactionRepository,
  overrides: SeedTransactionOverrides = {},
) {
  const grossValueCents = overrides.grossValueCents ?? 1_000_000;
  const commissionPercent = overrides.commissionPercent ?? 6;
  const payload: CreateTransactionPayload = {
    storeId: overrides.storeId ?? TEST_STORE,
    type: overrides.type ?? 'SALE',
    status: overrides.status ?? 'PROPOSAL',
    title: overrides.title ?? 'Venda — Casa Pontal',
    propertyId:
      overrides.propertyId !== undefined ? overrides.propertyId : 'prop-1',
    propertyName: overrides.propertyName ?? 'Casa Pontal',
    leadId: overrides.leadId !== undefined ? overrides.leadId : 'lead-1',
    leadName: overrides.leadName ?? 'Mariana Souza',
    dealId: overrides.dealId ?? null,
    captorId: overrides.captorId ?? 'ana-helena',
    sellerId:
      overrides.sellerId !== undefined ? overrides.sellerId : 'bruno-costa',
    grossValueCents,
    paymentMethod: overrides.paymentMethod ?? 'pix',
    commissionPercent,
    split: makeSplit(grossValueCents, commissionPercent),
    splitSource: 'GLOBAL',
    rental: overrides.rental ?? null,
    activity: {
      at: '2026-07-01',
      actorName: 'Ana Helena',
      message: 'TRANSACTION_CREATED — Negócio criado.',
    },
  };
  return repo.create(payload);
}
