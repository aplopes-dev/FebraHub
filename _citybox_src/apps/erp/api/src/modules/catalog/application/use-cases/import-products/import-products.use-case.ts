import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { Product } from '../../../domain/entities/product.entity';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductCategoryRepository } from '../../../domain/repositories/product-category.repository.interface';
import { UnitOfMeasureRepository } from '../../../domain/repositories/unit-of-measure.repository.interface';
import type {
  ImportProductsDto,
  ImportProductsResult,
} from '../../dtos/product.dto';
import {
  parseProductImportWorkbook,
  PRODUCT_IMPORT_MAX_BYTES,
} from '../../utils/product-import-xlsx';

@Injectable()
export class ImportProductsUseCase implements IUseCase<
  ImportProductsDto,
  ImportProductsResult
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: ProductCategoryRepository,
    private readonly unitRepository: UnitOfMeasureRepository,
  ) {}

  async execute(input: ImportProductsDto): Promise<ImportProductsResult> {
    if (input.buffer.byteLength > PRODUCT_IMPORT_MAX_BYTES) {
      throw new ValidatorDomainError({
        internalMessage: `Product import file exceeds ${PRODUCT_IMPORT_MAX_BYTES} bytes`,
        externalMessage: 'Arquivo excede o limite de 5 MB',
        context: ImportProductsUseCase.name,
      });
    }

    const parsed = await parseProductImportWorkbook(input.buffer);
    const errors = [...parsed.errors];
    let created = 0;

    const branchIds = input.branchId ? [input.branchId] : [];

    for (const row of parsed.rows) {
      try {
        const existing = await this.productRepository.findBySku(
          input.organizationId,
          row.sku,
        );
        if (existing) {
          errors.push({
            row: row.row,
            message: `Linha ${row.row}: SKU "${row.sku}" já existe`,
          });
          continue;
        }

        const category = await this.categoryRepository.findByName(
          input.organizationId,
          row.categoryName,
        );
        if (!category) {
          errors.push({
            row: row.row,
            message: `Linha ${row.row}: categoria "${row.categoryName}" não encontrada`,
          });
          continue;
        }

        let unitOfMeasureId: string | null = null;
        if (row.unitAbbreviation) {
          const unit = await this.unitRepository.findByAbbreviation(
            input.organizationId,
            row.unitAbbreviation,
          );
          if (!unit) {
            errors.push({
              row: row.row,
              message: `Linha ${row.row}: unidade "${row.unitAbbreviation}" não encontrada`,
            });
            continue;
          }
          unitOfMeasureId = unit.id;
        }

        const product = Product.create({
          organizationId: input.organizationId,
          name: row.name,
          sku: row.sku,
          categoryId: category.id,
          unitOfMeasureId,
          type: row.type,
          basePriceCents: row.basePriceCents,
          description: row.description,
          trackStock: row.trackStock,
          availableOnErp: row.availableOnErp,
          availableOnPdv: row.availableOnPdv,
          branchIds,
        });

        await this.productRepository.save(product);
        created += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao importar linha';
        errors.push({ row: row.row, message: `Linha ${row.row}: ${message}` });
      }
    }

    return {
      created,
      failed: errors.length,
      errors,
    };
  }
}
