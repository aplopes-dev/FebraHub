import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { CommissionConfigEntity } from '../../../../finance/domain/entities/commission-config.entity';
import { CommissionConfigRepository } from '../../../../finance/domain/repositories/commission-config.repository.interface';
import type { DealEntity } from '../../../../deals/domain/entities/deal.entity';
import { DealRepository } from '../../../../deals/domain/repositories/deal.repository.interface';
import type { LeadEntity } from '../../../../leads/domain/entities/lead.entity';
import { LeadNotFoundError } from '../../../../leads/domain/errors/lead-not-found.error';
import { LeadRepository } from '../../../../leads/domain/repositories/lead.repository.interface';
import type { PropertyEntity } from '../../../../properties/domain/entities/property.entity';
import { PropertyNotFoundError } from '../../../../properties/domain/errors/property-not-found.error';
import { PropertyRepository } from '../../../../properties/domain/repositories/property.repository.interface';
import type {
  RentalConfig,
  TransactionEntity,
  TransactionPaymentMethod,
  TransactionType,
} from '../../../domain/entities/transaction.entity';
import { DealAlreadyHasTransactionError } from '../../../domain/errors/deal-already-has-transaction.error';
import { PropertyUnavailableError } from '../../../domain/errors/property-unavailable.error';
import { TransactionRepository } from '../../../domain/repositories/transaction.repository.interface';
import {
  DEAL_STAGE_ON_TRANSACTION_CREATE,
  shouldAdvanceDealOnTransactionCreate,
} from '../../policies/deal-transaction-sync.policy';
import { applyDealPropertyAvailabilitySideEffects } from '../../../../deals/application/policies/deal-property-availability.side-effects';
import { buildDealTitle } from '../../../../deals/application/policies/lead-deal-sync.policy';
import { paymentMethodLabel } from '../../policies/transaction-payment-method.policy';
import { resolveDefaultSplit } from '../../policies/resolve-default-split.policy';
import { todayDateOnly } from '../../policies/transaction-date.policy';

export type OrganizationType = 'AGENCY' | 'SINGLE_AGENT';
export type ActorRole = 'ADMIN' | 'MANAGER' | 'AGENT' | 'AUTONOMOUS';

export type CreateTransactionInput = {
  storeId: string;
  type: TransactionType;
  propertyId: string;
  leadId: string;
  dealId?: string;
  grossValueCents: number;
  paymentMethod: TransactionPaymentMethod;
  sellerId: string;
  initialStatus: 'PROPOSAL' | 'CONTRACT_SIGNED';
  actorAgentId: string;
  organizationType: OrganizationType;
  actorRole: ActorRole;
  actorName: string;
};

const TYPE_LABEL: Record<TransactionType, string> = {
  SALE: 'Venda',
  RENTAL: 'Locação',
};

const DEFAULT_RENTAL_ADMIN_FEE_PERCENT = 10;
const DEFAULT_RENTAL_DUE_DAY = 10;

function isSelfServing(
  organizationType: OrganizationType,
  actorRole: ActorRole,
): boolean {
  return organizationType === 'SINGLE_AGENT' || actorRole === 'AUTONOMOUS';
}

function resolveCaptorId(
  propertyAgentId: string | null,
  input: CreateTransactionInput,
): string {
  if (isSelfServing(input.organizationType, input.actorRole)) {
    return input.actorAgentId;
  }
  return propertyAgentId ?? input.actorAgentId;
}

function resolveSellerId(input: CreateTransactionInput): string {
  if (
    isSelfServing(input.organizationType, input.actorRole) ||
    input.actorRole === 'AGENT'
  ) {
    return input.actorAgentId;
  }
  return input.sellerId;
}

/** Transação terminal encerra a negociação do deal — não bloqueia um negócio novo. */
function isDealConcludedByTransaction(transaction: TransactionEntity): boolean {
  return (
    transaction.status === 'COMPLETED' || transaction.status === 'CANCELLED'
  );
}

function isPropertyLinkedToLead(
  propertyId: string,
  lead: LeadEntity,
  deal: DealEntity | null,
): boolean {
  if (deal?.propertyId === propertyId) return true;
  return lead.matchedProperties.some((item) => item.propertyId === propertyId);
}

/**
 * `available` sempre ok; `reserved`/`occupied` só se já estiver linkado ao lead/deal
 * (indisponível para outros, mas ainda deste negócio).
 */
function assertPropertyUsableForTransaction(
  property: PropertyEntity,
  lead: LeadEntity,
  deal: DealEntity | null,
): void {
  if (property.status === 'available') return;
  if (
    (property.status === 'reserved' || property.status === 'occupied') &&
    isPropertyLinkedToLead(property.id, lead, deal)
  ) {
    return;
  }
  throw new PropertyUnavailableError(property.id, property.status);
}

function buildDefaultRental(
  grossValueCents: number,
  tenantName: string,
): RentalConfig {
  return {
    landlordName: 'Proprietário',
    tenantName,
    baseRentCents: grossValueCents,
    condoCents: 0,
    iptuCents: 0,
    adminFeePercent: DEFAULT_RENTAL_ADMIN_FEE_PERCENT,
    dueDay: DEFAULT_RENTAL_DUE_DAY,
    payoutStatus: 'AWAITING_PAYMENT',
    receivedCents: 0,
    deductions: [],
  };
}

@Injectable()
export class CreateTransactionUseCase implements IUseCase<
  CreateTransactionInput,
  TransactionEntity
> {
  constructor(
    private readonly transactions: TransactionRepository,
    private readonly properties: PropertyRepository,
    private readonly leads: LeadRepository,
    private readonly commissionConfigs: CommissionConfigRepository,
    private readonly deals: DealRepository,
  ) {}

  async execute(input: CreateTransactionInput): Promise<TransactionEntity> {
    const property = await this.properties.findById(
      input.storeId,
      input.propertyId,
    );
    if (!property) throw new PropertyNotFoundError(input.propertyId);

    const lead = await this.leads.findById(input.storeId, input.leadId);
    if (!lead) throw new LeadNotFoundError(input.leadId);

    let deal =
      input.dealId != null
        ? await this.deals.findById(input.storeId, input.dealId)
        : await this.deals.findActiveByLeadId(input.storeId, input.leadId);

    assertPropertyUsableForTransaction(property, lead, deal);

    if (deal && deal.status !== 'active') {
      deal = await this.createFreshDeal(lead, property, input);
    } else if (deal) {
      const existing = await this.transactions.findByDealId(
        input.storeId,
        deal.id,
      );
      if (existing && !isDealConcludedByTransaction(existing)) {
        throw new DealAlreadyHasTransactionError(deal.id);
      }
      if (existing) {
        deal = await this.createFreshDeal(lead, property, input);
      }
    }

    const captorId = resolveCaptorId(property.agentId, input);
    const sellerId = resolveSellerId(input);

    const config =
      (await this.commissionConfigs.getByStoreId(input.storeId)) ??
      CommissionConfigEntity.default(input.storeId);
    const commissionPercent = config.defaultCommissionPercent;

    const { split, splitSource } = resolveDefaultSplit(
      {
        grossValueCents: input.grossValueCents,
        commissionPercent,
        captorId,
        sellerId,
      },
      config,
    );

    const transaction = await this.transactions.create({
      storeId: input.storeId,
      type: input.type,
      status: input.initialStatus,
      title: `${TYPE_LABEL[input.type]} — ${property.name}`,
      propertyId: property.id,
      propertyName: property.name,
      leadId: lead.id,
      leadName: lead.name,
      dealId: deal?.id ?? null,
      captorId,
      sellerId,
      grossValueCents: input.grossValueCents,
      paymentMethod: input.paymentMethod,
      commissionPercent,
      split,
      splitSource,
      rental:
        input.type === 'RENTAL'
          ? buildDefaultRental(input.grossValueCents, lead.name)
          : null,
      activity: {
        at: todayDateOnly(),
        actorName: input.actorName,
        message: `TRANSACTION_CREATED — Negócio criado. Meio de pagamento previsto: ${paymentMethodLabel(input.paymentMethod)}.`,
      },
    });

    const shouldAdvance =
      Boolean(deal) && shouldAdvanceDealOnTransactionCreate(deal!);
    if (deal && shouldAdvance) {
      await this.deals.updateStage(input.storeId, deal.id, {
        stage: DEAL_STAGE_ON_TRANSACTION_CREATE,
      });
      await this.deals.update(input.storeId, deal.id, { type: input.type });
    } else if (deal) {
      await this.deals.update(input.storeId, deal.id, { type: input.type });
    }

    await applyDealPropertyAvailabilitySideEffects(
      input.storeId,
      {
        previousPropertyId: property.id,
        nextPropertyId: property.id,
        nextStage: shouldAdvance
          ? DEAL_STAGE_ON_TRANSACTION_CREATE
          : (deal?.stage ?? 'property_selected'),
      },
      {
        properties: this.properties,
        transactions: this.transactions,
      },
    );

    return transaction;
  }

  /** Negócio novo para uma negociação nova do mesmo lead (imóvel/type próprios). */
  private async createFreshDeal(
    lead: LeadEntity,
    property: PropertyEntity,
    input: CreateTransactionInput,
  ): Promise<DealEntity> {
    return this.deals.create({
      storeId: input.storeId,
      leadId: lead.id,
      propertyId: property.id,
      propertyName: property.name,
      leadName: lead.name,
      type: input.type,
      stage: DEAL_STAGE_ON_TRANSACTION_CREATE,
      title: buildDealTitle(lead.name, property.name),
      agentId: lead.agentId ?? null,
    });
  }
}
