import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { BranchNotFoundError } from '../../../../tenancy/domain/errors/branch-not-found.error';
import { SupplierRepository } from '../../../../stock/suppliers/domain/repositories/supplier.repository.interface';
import { SupplierNotFoundError } from '../../../../stock/suppliers/domain/errors/supplier-not-found.error';
import type {
  Product,
  ProductSupplierLink,
} from '../../../domain/entities/product.entity';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductCategoryRepository } from '../../../domain/repositories/product-category.repository.interface';
import { UnitOfMeasureRepository } from '../../../domain/repositories/unit-of-measure.repository.interface';
import { VariationRepository } from '../../../domain/repositories/variation.repository.interface';
import { ProductAddonRepository } from '../../../domain/repositories/product-addon.repository.interface';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductSkuTakenError } from '../../../domain/errors/product-sku-taken.error';
import { ProductCategoryNotFoundError } from '../../../domain/errors/product-category-not-found.error';
import { UnitOfMeasureNotFoundError } from '../../../domain/errors/unit-of-measure-not-found.error';
import { normalizeBarcodes } from '../create-product/create-product.use-case';
import type { UpdateProductDto } from '../../dtos/product.dto';
import {
  resolveProductVariations,
  resolveVariationFormat,
} from '../../utils/resolve-product-variations';
import { resolveProductAddonLines } from '../../utils/resolve-product-addon-lines';
import { resolveProductSuggestions } from '../../utils/resolve-product-suggestions';

@Injectable()
export class UpdateProductUseCase implements IUseCase<
  UpdateProductDto,
  Product
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: ProductCategoryRepository,
    private readonly unitRepository: UnitOfMeasureRepository,
    private readonly branchRepository: BranchRepository,
    private readonly supplierRepository: SupplierRepository,
    private readonly variationRepository: VariationRepository,
    private readonly addonRepository: ProductAddonRepository,
  ) {}

  async execute(input: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!product) throw new ProductNotFoundError(input.id);

    const sku = input.sku.trim();
    const bySku = await this.productRepository.findBySku(
      input.organizationId,
      sku,
    );
    // Só é conflito se o SKU pertencer a OUTRO produto.
    if (bySku && bySku.id !== product.id) throw new ProductSkuTakenError(sku);

    const category = await this.categoryRepository.findById(
      input.organizationId,
      input.categoryId,
    );
    if (!category) throw new ProductCategoryNotFoundError(input.categoryId);

    if (input.unitOfMeasureId) {
      const unit = await this.unitRepository.findById(
        input.organizationId,
        input.unitOfMeasureId,
      );
      if (!unit) throw new UnitOfMeasureNotFoundError(input.unitOfMeasureId);
    }

    const variations = await resolveProductVariations(
      this.variationRepository,
      input.organizationId,
      input.variations,
    );
    const addonLines = await resolveProductAddonLines(
      this.addonRepository,
      input.organizationId,
      input.addonLines,
    );
    const suggestions = await resolveProductSuggestions(
      this.productRepository,
      input.organizationId,
      product.id,
      input.suggestions,
    );

    product.update({
      name: input.name.trim(),
      sku,
      categoryId: input.categoryId,
      unitOfMeasureId: input.unitOfMeasureId,
      type: input.type,
      basePriceCents: input.basePriceCents,
      perishable: input.perishable,
      description: input.description,
      imageUrl: input.imageUrl,
      trackStock: input.trackStock,
      barcodes: normalizeBarcodes(input.barcodes),
      availableOnErp: input.availableOnErp ?? product.availableOnErp,
      availableOnPdv: input.availableOnPdv ?? product.availableOnPdv,
      branchIds: await this.resolveBranchIds(
        input.organizationId,
        input.branchIds,
      ),
      suppliers: await this.resolveSuppliers(
        input.organizationId,
        input.suppliers,
      ),
      variationFormat: resolveVariationFormat(
        input.variationFormat,
        variations,
      ),
      variations,
      addonSettings: input.addonSettings ?? product.addonSettings,
      addonLines,
      suggestions,
    });

    return this.productRepository.save(product);
  }

  /**
   * Confere que cada unidade pertence à organização antes de gravar o vínculo.
   *
   * A FK composta do banco já barraria filial de outra empresa, mas com um erro
   * de integridade cru (500). Aqui o usuário recebe 404 dizendo qual unidade
   * não existe.
   */
  private async resolveBranchIds(
    organizationId: string,
    branchIds: string[] | undefined,
  ): Promise<string[]> {
    const unique = [...new Set((branchIds ?? []).filter(Boolean))];
    for (const branchId of unique) {
      const branch = await this.branchRepository.findById(
        organizationId,
        branchId,
      );
      if (!branch || branch.deletedAt) throw new BranchNotFoundError(branchId);
    }
    return unique;
  }

  /**
   * Confere que cada fornecedor pertence à organização e normaliza o vínculo.
   *
   * Mesma razão do `resolveBranchIds`: a FK composta barraria fornecedor de
   * outra empresa, mas com erro de integridade cru em vez de um 404 claro.
   */
  private async resolveSuppliers(
    organizationId: string,
    suppliers: ProductSupplierLink[] | undefined,
  ): Promise<ProductSupplierLink[]> {
    const byId = new Map<string, ProductSupplierLink>();
    for (const link of suppliers ?? []) {
      if (!link.supplierId) continue;
      const supplier = await this.supplierRepository.findById(
        organizationId,
        link.supplierId,
      );
      if (!supplier || supplier.deletedAt) {
        throw new SupplierNotFoundError(link.supplierId);
      }
      // O último vínculo do mesmo fornecedor vence — o formulário permite
      // linhas repetidas, e o unique do banco recusaria as duplicadas.
      byId.set(link.supplierId, {
        supplierId: link.supplierId,
        supplierCode: link.supplierCode?.trim() || null,
        conversion: link.conversion > 0 ? link.conversion : 1,
      });
    }
    return [...byId.values()];
  }
}
