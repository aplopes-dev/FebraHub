import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PDV_ALCADA_AUTHORIZE_PERMISSION } from '../../../../../shared/infra/http/permissions/permission-catalog';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { CreateSaleOrderUseCase } from '../../../../sales/application/use-cases/create-sale-order/create-sale-order.use-case';
import type { SaleOrder } from '../../../../sales/domain/entities/sale-order.entity';
import type { SaleOrderCardPaymentType } from '../../../../sales/domain/entities/sale-order.entity';
import { PaymentMethodRepository } from '../../../../finance/payment-methods/domain/repositories/payment-method.repository.interface';
import { StockRepository } from '../../../../stock/domain/repositories/stock.repository.interface';
import { MembershipRepository } from '../../../../tenancy/domain/repositories/membership.repository.interface';
import {
  isPdvLoginEligible,
  membershipPermissionIds,
} from '../../../../tenancy/domain/pdv-membership';
import { PosCashSessionRepository } from '../../../../pos-cash-sessions/domain/repositories/pos-cash-session.repository.interface';
import { PosDeliveryOrderRepository } from '../../../../pos-delivery/domain/repositories/pos-delivery-order.repository.interface';
import {
  AlreadySoldError,
  PosDeliveryOrderNotFoundError,
} from '../../../../pos-delivery/domain/errors/pos-delivery.errors';
import { GetPosPolicyUseCase } from '../../../../pos-policies/application/use-cases/get-pos-policy/get-pos-policy.use-case';
import type {
  CreatePosSaleDto,
  CreatePosSalePaymentDto,
} from '../../dtos/create-pos-sale.dto';
import { PosSaleOperatorInvalidError } from '../../../domain/errors/pos-sale-operator-invalid.error';
import { PosSaleSellerInvalidError } from '../../../domain/errors/pos-sale-seller-invalid.error';
import { PosSalePaymentMethodInvalidError } from '../../../domain/errors/pos-sale-payment-method-invalid.error';
import { PosSalePaymentsInsufficientError } from '../../../domain/errors/pos-sale-payments-insufficient.error';
import { PosSaleCashSessionRequiredError } from '../../../domain/errors/pos-sale-cash-session-required.error';
import { PosSaleSupervisorRequiredError } from '../../../domain/errors/pos-sale-supervisor-required.error';

const SYSTEM_KEY_TO_CARD_TYPE: Record<string, SaleOrderCardPaymentType> = {
  'pm-pix': 'pix',
  'pm-cartao': 'credit',
  'pm-cartao-debito': 'debit',
};

/**
 * Fecha uma venda do PDV como `SaleOrder` `closed` + canal `pdv` (ou
 * `delivery` quando há `posDeliveryOrderId`).
 *
 * Pagamento de delivery vincula a venda ao pedido operacional **sem** marcar
 * o status como `delivered` — Concluído no Kanban é só o ciclo físico.
 *
 * `operatorId` = **userId** do Membership elegível na unidade do terminal.
 * Exige turno de caixa **open** no terminal; grava `cashSessionId` /
 * `posTerminalId` / `operatorUserId` (+ vínculo delivery) **na mesma TX**
 * da criação da SaleOrder.
 */
@Injectable()
export class CreatePosSaleUseCase implements IUseCase<
  CreatePosSaleDto,
  SaleOrder
> {
  constructor(
    private readonly createSaleOrder: CreateSaleOrderUseCase,
    private readonly paymentMethodRepository: PaymentMethodRepository,
    private readonly stockRepository: StockRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly cashSessionRepository: PosCashSessionRepository,
    private readonly deliveryOrderRepository: PosDeliveryOrderRepository,
    private readonly getPosPolicy: GetPosPolicyUseCase,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: CreatePosSaleDto): Promise<SaleOrder> {
    if (!input.payments.length) {
      throw new PosSalePaymentsInsufficientError();
    }

    const openSession = await this.cashSessionRepository.findOpenByTerminal(
      input.organizationId,
      input.posTerminalId,
    );
    if (!openSession) {
      throw new PosSaleCashSessionRequiredError(input.posTerminalId);
    }

    const deliveryOrder = input.posDeliveryOrderId
      ? await this.deliveryOrderRepository.findByIdForBranch(
          input.organizationId,
          input.branchId,
          input.posDeliveryOrderId,
        )
      : null;
    if (input.posDeliveryOrderId && !deliveryOrder) {
      throw new PosDeliveryOrderNotFoundError(input.posDeliveryOrderId);
    }
    if (deliveryOrder && deliveryOrder.status === 'cancelled') {
      throw new AlreadySoldError();
    }
    if (deliveryOrder) {
      const activeSale = await this.prisma.scoped.saleOrder.findFirst({
        where: {
          organizationId: input.organizationId,
          posDeliveryOrderId: deliveryOrder.id,
          status: { not: 'cancelled' },
        },
        select: { id: true },
      });
      if (activeSale) {
        throw new AlreadySoldError();
      }
    }
    const deliveryFeeCents =
      input.deliveryFeeCents ?? deliveryOrder?.props.feeCents ?? 0;

    const membership = await this.membershipRepository.findByUser(
      input.organizationId,
      input.operatorId,
    );
    const detail = membership
      ? await this.membershipRepository.findById(
          input.organizationId,
          membership.id,
        )
      : null;
    if (!detail || !isPdvLoginEligible(detail, input.branchId)) {
      throw new PosSaleOperatorInvalidError(input.operatorId);
    }

    const sellerId = input.sellerId?.trim() || null;
    if (sellerId) {
      const sellerMembership = await this.membershipRepository.findByUser(
        input.organizationId,
        sellerId,
      );
      const sellerDetail = sellerMembership
        ? await this.membershipRepository.findById(
            input.organizationId,
            sellerMembership.id,
          )
        : null;
      if (
        !sellerDetail ||
        !sellerDetail.membership.active ||
        !sellerDetail.membership.isSeller
      ) {
        throw new PosSaleSellerInvalidError(sellerId);
      }
    }

    const paymentsWithCardType: CreatePosSalePaymentDto[] = [];
    for (const payment of input.payments) {
      const method = await this.paymentMethodRepository.findById(
        input.organizationId,
        payment.methodId,
      );
      if (!method || method.deletedAt) {
        throw new PosSalePaymentMethodInvalidError(payment.methodId);
      }

      const inferredType: SaleOrderCardPaymentType | undefined =
        payment.cardPaymentType ??
        (method.systemKey
          ? SYSTEM_KEY_TO_CARD_TYPE[method.systemKey]
          : undefined);

      paymentsWithCardType.push({
        ...payment,
        cardPaymentType: inferredType,
      });
    }

    const linesTotalCents = input.lines.reduce((sum, line) => {
      const qty = Number(line.quantity);
      return sum + Math.round(qty * line.unitPriceCents);
    }, 0);
    const discountsCents = input.discountsCents ?? 0;
    const totalCents = linesTotalCents + deliveryFeeCents - discountsCents;
    if (deliveryOrder && totalCents <= 0) {
      throw new PosSalePaymentsInsufficientError();
    }
    const paidCents = paymentsWithCardType.reduce(
      (sum, payment) => sum + payment.amountCents,
      0,
    );
    if (paidCents < totalCents) {
      throw new PosSalePaymentsInsufficientError();
    }

    await this.assertDiscountAuthorization(
      input.organizationId,
      linesTotalCents,
      discountsCents,
      input.discountAuthorizedByUserId,
    );

    const stockId = await this.resolveDefaultStockId(
      input.organizationId,
      input.branchId,
    );

    const operatorName =
      detail.user.name?.trim() ||
      detail.user.email ||
      detail.membership.pdvCode ||
      'Operador';

    return this.createSaleOrder.execute({
      organizationId: input.organizationId,
      customerId: input.customerId,
      customerName: input.customerName?.trim() || 'Consumidor Final',
      consumerDocument: input.consumerDocument,
      stockId,
      status: 'closed',
      channelId: deliveryOrder ? 'delivery' : 'pdv',
      sellerId,
      sellerName: input.sellerName,
      createdByName: operatorName,
      createdByUserId: detail.user.id,
      notes: input.notes,
      deliveryFeeCents,
      discountsCents: input.discountsCents,
      lines: input.lines,
      payments: paymentsWithCardType,
      posMeta: {
        cashSessionId: openSession.id,
        posTerminalId: input.posTerminalId,
        operatorUserId: input.operatorId,
        ...(deliveryOrder ? { posDeliveryOrderId: deliveryOrder.id } : {}),
      },
    });
  }

  private async assertDiscountAuthorization(
    organizationId: string,
    linesTotalCents: number,
    discountsCents: number,
    discountAuthorizedByUserId: string | null | undefined,
  ): Promise<void> {
    if (discountsCents <= 0 || linesTotalCents <= 0) {
      return;
    }

    const discountPercent = (discountsCents / linesTotalCents) * 100;
    const policy = await this.getPosPolicy.execute({ organizationId });
    if (!policy.requiresSupervisorForDiscount(discountPercent)) {
      return;
    }

    if (!discountAuthorizedByUserId) {
      throw new PosSaleSupervisorRequiredError('discount');
    }
    await this.resolveAuthorizer(organizationId, discountAuthorizedByUserId);
  }

  private async resolveAuthorizer(organizationId: string, userId: string) {
    const membership = await this.membershipRepository.findByUser(
      organizationId,
      userId,
    );
    const detail = membership
      ? await this.membershipRepository.findById(organizationId, membership.id)
      : null;
    if (!detail || !detail.membership.active) {
      throw new PosSaleOperatorInvalidError(userId);
    }
    const perms = membershipPermissionIds(detail);
    if (!perms.includes(PDV_ALCADA_AUTHORIZE_PERMISSION)) {
      throw new PosSaleSupervisorRequiredError('discount');
    }
    return detail;
  }

  private async resolveDefaultStockId(
    organizationId: string,
    branchId: string,
  ): Promise<string | null> {
    const stocks = await this.stockRepository.findAll(organizationId);
    const defaultForBranch = stocks.find(
      (stock) => stock.isDefault && stock.branchIds.includes(branchId),
    );
    if (defaultForBranch) return defaultForBranch.id;

    const anyForBranch = stocks.find((stock) =>
      stock.branchIds.includes(branchId),
    );
    return anyForBranch?.id ?? null;
  }
}
