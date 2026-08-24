import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Purchase } from '../../../domain/entities/purchase.entity';
import { PurchaseAlreadyReceivedError } from '../../../domain/errors/purchase-already-received.error';
import { PurchaseEmptyLinesError } from '../../../domain/errors/purchase-empty-lines.error';
import { PurchaseNotFoundError } from '../../../domain/errors/purchase-not-found.error';
import { PurchaseRepository } from '../../../domain/repositories/purchase.repository.interface';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { StockProductLookup } from '../../../domain/repositories/stock-movement.repository.interface';
import { SupplierRepository } from '../../../suppliers/domain/repositories/supplier.repository.interface';
import { CarrierRepository } from '../../../carriers/domain/repositories/carrier.repository.interface';
import { assertPurchaseReferences } from '../assert-purchase-references';
import { buildPurchaseEntryMovement } from '../build-purchase-entry-movement';
import type { UpdatePurchaseDto } from '../../dtos/purchase.dto';

/**
 * Atualiza a compra substituindo todas as linhas (PUT).
 *
 * Compras que já geraram entrada no estoque (`stockMovementId`) são
 * imutáveis — edição e mudança de status ficam bloqueadas.
 *
 * Gera o movimento de entrada quando a compra passa a `received` com linhas
 * recebidas — no máximo uma vez (`buildPurchaseEntryMovement` + `stockMovementId`).
 */
@Injectable()
export class UpdatePurchaseUseCase implements IUseCase<
  UpdatePurchaseDto,
  Purchase
> {
  constructor(
    private readonly purchaseRepository: PurchaseRepository,
    private readonly stockRepository: StockRepository,
    private readonly supplierRepository: SupplierRepository,
    private readonly carrierRepository: CarrierRepository,
    private readonly stockProductLookup: StockProductLookup,
  ) {}

  async execute(input: UpdatePurchaseDto): Promise<Purchase> {
    if (!input.lines.length) throw new PurchaseEmptyLinesError();

    const detail = await this.purchaseRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!detail || detail.purchase.deletedAt) {
      throw new PurchaseNotFoundError(input.id);
    }

    if (detail.purchase.stockMovementId) {
      throw new PurchaseAlreadyReceivedError(input.id);
    }

    await assertPurchaseReferences(
      {
        stockRepository: this.stockRepository,
        supplierRepository: this.supplierRepository,
        carrierRepository: this.carrierRepository,
        stockProductLookup: this.stockProductLookup,
      },
      {
        organizationId: input.organizationId,
        stockId: input.stockId,
        supplierId: input.supplierId,
        carrierId: input.carrierId,
        lines: input.lines,
      },
    );

    const updated = detail.purchase.update({
      stockId: input.stockId,
      supplierId: input.supplierId,
      carrierId: input.carrierId,
      deliveryStatus: input.deliveryStatus,
      purchasedAt: input.purchasedAt,
      series: input.series,
      invoiceNumber: input.invoiceNumber,
      notes: input.notes,
      freightCents: input.freightCents,
      discountsCents: input.discountsCents,
      otherExpensesCents: input.otherExpensesCents,
      lines: input.lines,
    });

    const movement = buildPurchaseEntryMovement(updated, input.createdByUserId);

    return this.purchaseRepository.saveWithOptionalMovement(updated, movement);
  }
}
