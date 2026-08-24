import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductFiscal } from '../../../domain/entities/product-fiscal.entity';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductFiscalRepository } from '../../../domain/repositories/product-fiscal.repository.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { ProductCategoryRepository } from '../../../domain/repositories/product-category.repository.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import type {
  FindFiscalParametersByProductIdDto,
  FiscalParametersDetail,
} from '../../dtos/product-fiscal.dto';

const EMPTY_GROUP_FIELD = { value: '', applyToAll: true };

@Injectable()
export class FindFiscalParametersByProductIdUseCase implements IUseCase<
  FindFiscalParametersByProductIdDto,
  FiscalParametersDetail
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: ProductCategoryRepository,
    private readonly productFiscalRepository: ProductFiscalRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(
    input: FindFiscalParametersByProductIdDto,
  ): Promise<FiscalParametersDetail> {
    const product = await this.productRepository.findById(
      input.organizationId,
      input.productId,
    );
    if (!product || product.deletedAt) {
      throw new ProductNotFoundError(input.productId);
    }

    const [category, fiscal, branches] = await Promise.all([
      this.categoryRepository.findById(
        input.organizationId,
        product.categoryId,
      ),
      this.productFiscalRepository.findByProductId(
        input.organizationId,
        input.productId,
      ),
      this.branchRepository.findAll(input.organizationId, {
        activeOnly: true,
      }),
    ]);

    const overrideByBranch = new Map(
      (fiscal?.branches ?? []).map((row) => [row.branchId, row] as const),
    );

    const units = branches
      .filter((branch) => !branch.deletedAt)
      .map((branch) => {
        const override = overrideByBranch.get(branch.id);
        return {
          branchId: branch.id,
          icms: override?.icms ?? '',
          pisCofins: override?.pisCofins ?? '',
          ipi: override?.ipi ?? '',
          cfop: override?.cfop ?? '',
          issqn: override?.issqn ?? '',
        };
      });

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      imageUrl: product.imageUrl,
      categoryName: category?.name ?? '',
      configured: ProductFiscal.isConfigured(fiscal),
      info: {
        ncm: fiscal?.ncm ?? '',
        origin: fiscal?.origin ?? '',
        netWeightKg: fiscal?.netWeightKg ?? 0,
        grossWeightKg: fiscal?.grossWeightKg ?? 0,
        cest: fiscal?.cest ?? '',
        fcpPercent: fiscal?.fcpPercent ?? 0,
        fcpStPercent: fiscal?.fcpStPercent ?? 0,
        fcpStRetainedPercent: fiscal?.fcpStRetainedPercent ?? 0,
        cstIbsCbs: fiscal?.cstIbsCbs ?? '',
        taxClassification: fiscal?.taxClassification ?? '',
      },
      group: {
        icms: fiscal?.icms ?? { ...EMPTY_GROUP_FIELD },
        pisCofins: fiscal?.pisCofins ?? { ...EMPTY_GROUP_FIELD },
        ipi: fiscal?.ipi ?? { ...EMPTY_GROUP_FIELD },
        cfop: fiscal?.cfop ?? { ...EMPTY_GROUP_FIELD },
        issqn: fiscal?.issqn ?? { ...EMPTY_GROUP_FIELD },
      },
      pisCofinsGroupId: fiscal?.pisCofinsGroupId ?? null,
      icmsGroupId: fiscal?.icmsGroupId ?? null,
      issqnGroupId: fiscal?.issqnGroupId ?? null,
      ipiGroupId: fiscal?.ipiGroupId ?? null,
      units,
      fiscal,
    };
  }
}
