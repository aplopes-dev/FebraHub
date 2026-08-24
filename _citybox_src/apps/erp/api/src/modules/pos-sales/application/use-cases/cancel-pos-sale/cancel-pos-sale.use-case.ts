import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PDV_ALCADA_AUTHORIZE_PERMISSION } from '../../../../../shared/infra/http/permissions/permission-catalog';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { BankStatementMatchRepository } from '../../../../finance/bank-reconciliation/domain/repositories/bank-statement-match.repository.interface';
import { FinancialEntryRepository } from '../../../../finance/financial-entries/domain/repositories/financial-entry.repository.interface';
import { GetPosPolicyUseCase } from '../../../../pos-policies/application/use-cases/get-pos-policy/get-pos-policy.use-case';
import type { SaleOrder } from '../../../../sales/domain/entities/sale-order.entity';
import { SaleOrderRepository } from '../../../../sales/domain/repositories/sale-order.repository.interface';
import { StockMovement } from '../../../../stock/domain/entities/stock-movement.entity';
import { StockMovementRepository } from '../../../../stock/domain/repositories/stock-movement.repository.interface';
import {
  isPdvLoginEligible,
  membershipPermissionIds,
} from '../../../../tenancy/domain/pdv-membership';
import { MembershipRepository } from '../../../../tenancy/domain/repositories/membership.repository.interface';
import { PosCashSessionRepository } from '../../../../pos-cash-sessions/domain/repositories/pos-cash-session.repository.interface';
import type { CancelPosSaleDto } from '../../dtos/cancel-pos-sale.dto';
import { PosSaleCancelForbiddenError } from '../../../domain/errors/pos-sale-cancel-forbidden.error';
import { PosSaleCashSessionRequiredError } from '../../../domain/errors/pos-sale-cash-session-required.error';
import { PosSaleNotFoundError } from '../../../domain/errors/pos-sale-not-found.error';
import { PosSaleOperatorInvalidError } from '../../../domain/errors/pos-sale-operator-invalid.error';
import { PosSaleReceivablesInUseError } from '../../../domain/errors/pos-sale-receivables-in-use.error';
import { PosSaleSupervisorRequiredError } from '../../../domain/errors/pos-sale-supervisor-required.error';

/** Permissão fina de cancelar venda no PDV. */
export const PDV_VENDA_CANCEL_PERMISSION = 'pdv.operacao.venda.cancel' as const;

/**
 * Cancela uma venda do canal `pdv`: status `cancelled`, estorno de estoque
 * (entrada reversa) e soft-delete dos recebíveis — desde que nenhum esteja
 * conciliado no extrato.
 */
@Injectable()
export class CancelPosSaleUseCase implements IUseCase<
  CancelPosSaleDto,
  SaleOrder
> {
  constructor(
    private readonly saleOrderRepository: SaleOrderRepository,
    private readonly stockMovementRepository: StockMovementRepository,
    private readonly cashSessionRepository: PosCashSessionRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly getPosPolicy: GetPosPolicyUseCase,
    private readonly financialEntryRepository: FinancialEntryRepository,
    private readonly bankStatementMatchRepository: BankStatementMatchRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(input: CancelPosSaleDto): Promise<SaleOrder> {
    const detail = await this.saleOrderRepository.findById(
      input.organizationId,
      input.saleId,
    );
    if (!detail || detail.saleOrder.deletedAt) {
      throw new PosSaleNotFoundError(input.saleId);
    }

    const sale = detail.saleOrder;
    if (sale.status === 'cancelled') {
      return sale;
    }

    if (sale.channelId !== 'pdv' && sale.channelId !== 'delivery') {
      throw new PosSaleCancelForbiddenError('channel is not pdv or delivery');
    }

    const posMeta = await this.prisma.scoped.saleOrder.findFirst({
      where: { id: input.saleId, organizationId: input.organizationId },
      select: { posTerminalId: true, posDeliveryOrderId: true },
    });
    if (
      !posMeta?.posTerminalId ||
      posMeta.posTerminalId !== input.posTerminalId
    ) {
      throw new PosSaleCancelForbiddenError('terminal mismatch');
    }

    const openSession = await this.cashSessionRepository.findOpenByTerminal(
      input.organizationId,
      input.posTerminalId,
    );
    if (!openSession) {
      throw new PosSaleCashSessionRequiredError(input.posTerminalId);
    }

    const operator = await this.resolveOperator(
      input.organizationId,
      input.operatorId,
      input.branchId,
    );
    const operatorPerms = membershipPermissionIds(operator);
    if (!operatorPerms.includes(PDV_VENDA_CANCEL_PERMISSION)) {
      throw new PosSaleCancelForbiddenError('missing venda.cancel');
    }

    const policy = await this.getPosPolicy.execute({
      organizationId: input.organizationId,
    });
    if (policy.cancellationRequiresSupervisor) {
      if (!input.authorizedByUserId) {
        throw new PosSaleSupervisorRequiredError();
      }
      await this.resolveAuthorizer(
        input.organizationId,
        input.authorizedByUserId,
      );
    } else if (input.authorizedByUserId) {
      await this.resolveAuthorizer(
        input.organizationId,
        input.authorizedByUserId,
      );
    }

    await this.softDeleteReceivables(input.organizationId, input.saleId);

    if (sale.stockMovementId && sale.stockId) {
      await this.reverseStockOutbound(
        input.organizationId,
        sale,
        input.operatorId,
      );
    }

    const cancelled = sale.updateStatus('cancelled');
    const deliveryOrderId = posMeta.posDeliveryOrderId;
    if (deliveryOrderId) {
      await this.prisma.scoped.$transaction(async (tx) => {
        await tx.saleOrder.update({
          where: { id: sale.id },
          data: { status: 'cancelled' },
        });
        // Reabre o operacional para nova cobrança (não cancela o Kanban).
        const delivery = await tx.posDeliveryOrder.findFirst({
          where: { id: deliveryOrderId, organizationId: input.organizationId },
          select: { fulfillment: true, status: true },
        });
        if (delivery && delivery.status === 'delivered') {
          await tx.posDeliveryOrder.update({
            where: { id: deliveryOrderId },
            data: {
              status:
                delivery.fulfillment === 'delivery' ? 'dispatched' : 'preparing',
            },
          });
        }
      });
    }
    return this.saleOrderRepository.saveWithOptionalMovement(cancelled, null);
  }

  private async softDeleteReceivables(
    organizationId: string,
    saleId: string,
  ): Promise<void> {
    const rows = await this.prisma.scoped.financialEntry.findMany({
      where: {
        organizationId,
        saleOrderId: saleId,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (rows.length === 0) return;

    const ids = rows.map((row) => row.id);
    const reconciled =
      await this.bankStatementMatchRepository.findActiveFinancialEntryIds(
        organizationId,
        ids,
      );
    if (reconciled.size > 0) {
      throw new PosSaleReceivablesInUseError(saleId);
    }

    const deletedAt = new Date();
    for (const id of ids) {
      await this.financialEntryRepository.softDelete(
        organizationId,
        id,
        deletedAt,
      );
    }
  }

  private async reverseStockOutbound(
    organizationId: string,
    sale: SaleOrder,
    operatorUserId: string,
  ): Promise<void> {
    if (!sale.stockMovementId || !sale.stockId) return;

    const outbound = await this.stockMovementRepository.findById(
      organizationId,
      sale.stockMovementId,
    );
    if (!outbound) return;

    const reversal = StockMovement.create({
      organizationId,
      stockId: sale.stockId,
      type: 'entrada',
      operatedAt: new Date(),
      createdByUserId: operatorUserId,
      sourceType: 'sale',
      sourceId: sale.id,
      lines: outbound.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        costCents: line.costCents,
      })),
    });

    await this.stockMovementRepository.createWithBalances(reversal);
  }

  private async resolveOperator(
    organizationId: string,
    userId: string,
    branchId: string,
  ) {
    const membership = await this.membershipRepository.findByUser(
      organizationId,
      userId,
    );
    const detail = membership
      ? await this.membershipRepository.findById(organizationId, membership.id)
      : null;
    if (!detail || !isPdvLoginEligible(detail, branchId)) {
      throw new PosSaleOperatorInvalidError(userId);
    }
    return detail;
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
      throw new PosSaleCancelForbiddenError('authorizer inactive');
    }
    const perms = membershipPermissionIds(detail);
    if (!perms.includes(PDV_ALCADA_AUTHORIZE_PERMISSION)) {
      throw new PosSaleCancelForbiddenError('authorizer missing alcada');
    }
    return detail;
  }
}
