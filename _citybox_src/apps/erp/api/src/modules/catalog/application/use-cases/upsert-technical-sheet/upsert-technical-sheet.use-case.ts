import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { TechnicalSheet } from '../../../domain/entities/technical-sheet.entity';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { TechnicalSheetInvalidValuesError } from '../../../domain/errors/technical-sheet-invalid-values.error';
import { TechnicalSheetNotEligibleError } from '../../../domain/errors/technical-sheet-not-eligible.error';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { TechnicalSheetRepository } from '../../../domain/repositories/technical-sheet.repository.interface';
import type {
  UpsertTechnicalSheetDto,
  UpsertTechnicalSheetResult,
} from '../../dtos/technical-sheet.dto';

@Injectable()
export class UpsertTechnicalSheetUseCase implements IUseCase<
  UpsertTechnicalSheetDto,
  UpsertTechnicalSheetResult
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly technicalSheetRepository: TechnicalSheetRepository,
  ) {}

  async execute(
    input: UpsertTechnicalSheetDto,
  ): Promise<UpsertTechnicalSheetResult> {
    const product = await this.productRepository.findById(
      input.organizationId,
      input.productId,
    );
    if (!product || product.deletedAt) {
      throw new ProductNotFoundError(input.productId);
    }
    if (product.type === 'supply') {
      throw new TechnicalSheetNotEligibleError(input.productId);
    }

    if (
      !Number.isFinite(input.maxRemovableComponents) ||
      input.maxRemovableComponents < 0
    ) {
      throw new TechnicalSheetInvalidValuesError(
        'Remoções máximas deve ser um número maior ou igual a zero',
      );
    }
    if (!Number.isFinite(input.markupPercent) || input.markupPercent < 0) {
      throw new TechnicalSheetInvalidValuesError(
        'Markup deve ser um número maior ou igual a zero',
      );
    }

    if (
      input.productionType === 'productive_process' &&
      input.optionComponents.length > 0
    ) {
      throw new TechnicalSheetInvalidValuesError(
        'Composição por variação só é permitida em produção automática',
      );
    }

    const linkedOptionIds = new Set(
      product.variations.flatMap((variation) => variation.optionIds),
    );

    for (const row of input.optionComponents) {
      if (!linkedOptionIds.has(row.variationOptionId)) {
        throw new TechnicalSheetInvalidValuesError(
          'Opção de variação não vinculada a este produto',
        );
      }
    }

    const componentIds = [
      ...new Set([
        ...input.components.map((row) => row.componentProductId),
        ...input.optionComponents.map((row) => row.componentProductId),
      ]),
    ];

    for (const componentId of componentIds) {
      if (componentId === input.productId) {
        throw new TechnicalSheetInvalidValuesError(
          'O produto não pode ser componente de si mesmo',
        );
      }
      const component = await this.productRepository.findById(
        input.organizationId,
        componentId,
      );
      if (!component || component.deletedAt) {
        throw new TechnicalSheetInvalidValuesError(
          'Insumo da composição não encontrado',
        );
      }
      if (component.type !== 'supply') {
        throw new TechnicalSheetInvalidValuesError(
          'Componentes da ficha técnica devem ser produtos do tipo insumo',
        );
      }
    }

    for (const row of [...input.components, ...input.optionComponents]) {
      if (!Number.isFinite(row.quantity) || row.quantity < 0) {
        throw new TechnicalSheetInvalidValuesError(
          'Quantidade do componente deve ser maior ou igual a zero',
        );
      }
    }

    const existing = await this.technicalSheetRepository.findByProductId(
      input.organizationId,
      input.productId,
    );

    const sheet = TechnicalSheet.create(
      {
        organizationId: input.organizationId,
        productId: input.productId,
        productionType: input.productionType,
        maxRemovableComponents: input.maxRemovableComponents,
        markupPercent: input.markupPercent,
        components: input.components.map((row) => ({
          id: row.id ?? '',
          componentProductId: row.componentProductId,
          optional: row.optional,
          quantity: row.quantity,
          sortOrder: row.sortOrder,
        })),
        optionComponents:
          input.productionType === 'automatic'
            ? input.optionComponents.map((row) => ({
                id: row.id ?? '',
                variationOptionId: row.variationOptionId,
                componentProductId: row.componentProductId,
                optional: row.optional,
                quantity: row.quantity,
                sortOrder: row.sortOrder,
              }))
            : [],
        createdAt: existing?.createdAt,
      },
      existing?.id,
    );

    await this.technicalSheetRepository.upsert(sheet);

    if (
      input.applyBasePriceCents !== undefined &&
      Number.isFinite(input.applyBasePriceCents) &&
      input.applyBasePriceCents >= 0
    ) {
      product.update({
        name: product.name,
        sku: product.sku,
        categoryId: product.categoryId,
        unitOfMeasureId: product.unitOfMeasureId,
        type: product.type,
        basePriceCents: Math.trunc(input.applyBasePriceCents),
        perishable: product.perishable,
        description: product.description,
        imageUrl: product.imageUrl,
        trackStock: product.trackStock,
        barcodes: product.barcodes,
        availableOnErp: product.availableOnErp,
        availableOnPdv: product.availableOnPdv,
        branchIds: product.branchIds,
        suppliers: product.suppliers,
        variationFormat: product.variationFormat,
        variations: product.variations,
        addonSettings: product.addonSettings,
        addonLines: product.addonLines,
        suggestions: product.suggestions,
      });
      await this.productRepository.save(product);
    }

    const detail = await this.technicalSheetRepository.findDetailByProductId(
      input.organizationId,
      input.productId,
    );
    if (!detail) {
      throw new ProductNotFoundError(input.productId);
    }

    return { sheet, detail };
  }
}
