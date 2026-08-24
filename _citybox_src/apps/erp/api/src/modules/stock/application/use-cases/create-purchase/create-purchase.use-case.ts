import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Purchase } from '../../../domain/entities/purchase.entity';
import { PurchaseEmptyLinesError } from '../../../domain/errors/purchase-empty-lines.error';
import { PurchaseRepository } from '../../../domain/repositories/purchase.repository.interface';
import { StockRepository } from '../../../domain/repositories/stock.repository.interface';
import { StockProductLookup } from '../../../domain/repositories/stock-movement.repository.interface';
import { SupplierRepository } from '../../../suppliers/domain/repositories/supplier.repository.interface';
import { CarrierRepository } from '../../../carriers/domain/repositories/carrier.repository.interface';
import { assertPurchaseReferences } from '../assert-purchase-references';
import { buildPurchaseEntryMovement } from '../build-purchase-entry-movement';
import type { CreatePurchaseDto } from '../../dtos/purchase.dto';

@Injectable()
export class CreatePurchaseUseCase implements IUseCase<
  CreatePurchaseDto,
  Purchase
> {
  constructor(
    private readonly purchaseRepository: PurchaseRepository,
    private readonly stockRepository: StockRepository,
    private readonly supplierRepository: SupplierRepository,
    private readonly carrierRepository: CarrierRepository,
    private readonly stockProductLookup: StockProductLookup,
  ) {}

  async execute(input: CreatePurchaseDto): Promise<Purchase> {
    if (!input.lines.length) throw new PurchaseEmptyLinesError();

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

    const purchase = Purchase.create({
      organizationId: input.organizationId,
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

    const movement = buildPurchaseEntryMovement(
      purchase,
      input.createdByUserId,
    );

    return this.purchaseRepository.saveWithOptionalMovement(purchase, movement);
  }
}
