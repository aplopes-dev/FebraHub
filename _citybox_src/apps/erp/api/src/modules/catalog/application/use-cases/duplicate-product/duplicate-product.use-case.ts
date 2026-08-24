import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { Product } from '../../../domain/entities/product.entity';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import type { DuplicateProductDto } from '../../dtos/product.dto';

const COPY_NAME_SUFFIX = ' (cópia)';
const COPY_SKU_SUFFIX = '-COPIA';

/**
 * Clona um produto (escalares + branches + barcodes + adicionais + sugestões).
 * Não copia imagem MinIO (`imageUrl` = null). SKU: `{sku}-COPIA` (+ sufixo numérico).
 */
@Injectable()
export class DuplicateProductUseCase implements IUseCase<
  DuplicateProductDto,
  Product
> {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: DuplicateProductDto): Promise<Product> {
    const source = await this.productRepository.findById(
      input.organizationId,
      input.productId,
    );
    if (!source) throw new ProductNotFoundError(input.productId);

    const sku = await this.resolveCopySku(input.organizationId, source.sku);
    const name = `${source.name}${COPY_NAME_SUFFIX}`.slice(0, 200);

    const clone = Product.create({
      organizationId: source.organizationId,
      name,
      sku,
      categoryId: source.categoryId,
      unitOfMeasureId: source.unitOfMeasureId,
      type: source.type,
      basePriceCents: source.basePriceCents,
      perishable: source.perishable,
      description: source.description,
      imageUrl: null,
      trackStock: source.trackStock,
      barcodes: [...source.barcodes],
      availableOnErp: source.availableOnErp,
      availableOnPdv: source.availableOnPdv,
      branchIds: [...source.branchIds],
      suppliers: source.suppliers.map((link) => ({ ...link })),
      variationFormat: source.variationFormat,
      variations: source.variations.map((link) => ({
        ...link,
        optionIds: [...link.optionIds],
        optionOverrides: link.optionOverrides.map((override) => ({
          ...override,
        })),
      })),
      addonSettings: { ...source.addonSettings },
      addonLines: source.addonLines.map((line) => ({ ...line })),
      suggestions: source.suggestions.map((link) => ({ ...link })),
    });

    return this.productRepository.save(clone);
  }

  private async resolveCopySku(
    organizationId: string,
    sourceSku: string,
  ): Promise<string> {
    const base = `${sourceSku}${COPY_SKU_SUFFIX}`.slice(0, 60);
    if (!(await this.productRepository.findBySku(organizationId, base))) {
      return base;
    }

    for (let n = 2; n < 10_000; n += 1) {
      const candidate = `${base}-${n}`.slice(0, 60);
      if (!(await this.productRepository.findBySku(organizationId, candidate))) {
        return candidate;
      }
    }

    return `${base}-${Date.now()}`.slice(0, 60);
  }
}
