import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductFiscal } from '../../../domain/entities/product-fiscal.entity';
import { ProductFiscalInvalidValuesError } from '../../../domain/errors/product-fiscal-invalid-values.error';
import { ProductNotFoundError } from '../../../domain/errors/product-not-found.error';
import { ProductFiscalRepository } from '../../../domain/repositories/product-fiscal.repository.interface';
import { ProductRepository } from '../../../domain/repositories/product.repository.interface';
import { BranchRepository } from '../../../../tenancy/domain/repositories/branch.repository.interface';
import { FiscalGroupRepository } from '../../../../fiscal-defaults/domain/repositories/fiscal-group.repository.interface';
import { assertBranchesBelongToOrganization } from '../../../../stock/suppliers/application/use-cases/assert-branches-belong-to-organization';
import type { UpsertFiscalParametersDto } from '../../dtos/product-fiscal.dto';

function assertNonNegative(label: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new ProductFiscalInvalidValuesError(
      `${label} deve ser um número maior ou igual a zero`,
    );
  }
}

@Injectable()
export class UpsertFiscalParametersUseCase implements IUseCase<
  UpsertFiscalParametersDto,
  ProductFiscal
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productFiscalRepository: ProductFiscalRepository,
    private readonly branchRepository: BranchRepository,
    private readonly fiscalGroupRepository: FiscalGroupRepository,
  ) {}

  /**
   * Os FKs de grupo (`pisCofinsGroupId`/`icmsGroupId`) não são recortados por tenant
   * no banco (SET NULL numa FK composta anularia `organizationId`, que é NOT NULL). A
   * trava é aqui: o grupo referenciado deve ser da org e do tributo certo — senão a
   * nota poderia guardar um id de grupo de outra organização (achado database-review).
   */
  private async assertGroupOfType(
    organizationId: string,
    groupId: string | null | undefined,
    taxType: 'PIS_COFINS' | 'ICMS' | 'ISSQN' | 'IPI',
    label: string,
  ): Promise<void> {
    if (!groupId) return;
    const group = await this.fiscalGroupRepository.findById(
      organizationId,
      groupId,
    );
    if (!group || group.taxType !== taxType) {
      throw new ProductFiscalInvalidValuesError(
        `O grupo de ${label} selecionado não existe nesta organização.`,
      );
    }
  }

  async execute(input: UpsertFiscalParametersDto): Promise<ProductFiscal> {
    const product = await this.productRepository.findById(
      input.organizationId,
      input.productId,
    );
    if (!product || product.deletedAt) {
      throw new ProductNotFoundError(input.productId);
    }

    assertNonNegative('Peso líquido', input.info.netWeightKg);
    assertNonNegative('Peso bruto', input.info.grossWeightKg);
    assertNonNegative('FCP', input.info.fcpPercent);
    assertNonNegative('FCP ST', input.info.fcpStPercent);
    assertNonNegative('FCP ST retido', input.info.fcpStRetainedPercent);

    await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.units.map((unit) => unit.branchId),
    );

    await this.assertGroupOfType(
      input.organizationId,
      input.pisCofinsGroupId,
      'PIS_COFINS',
      'PIS/COFINS',
    );
    await this.assertGroupOfType(
      input.organizationId,
      input.icmsGroupId,
      'ICMS',
      'ICMS',
    );
    await this.assertGroupOfType(
      input.organizationId,
      input.issqnGroupId,
      'ISSQN',
      'ISSQN',
    );
    await this.assertGroupOfType(
      input.organizationId,
      input.ipiGroupId,
      'IPI',
      'IPI',
    );

    const existing = await this.productFiscalRepository.findByProductId(
      input.organizationId,
      input.productId,
    );

    // `undefined` = campo ausente no payload → mantém o vínculo atual (a tela de
    // parâmetros do produto ainda não edita o grupo; sem isto, todo save zeraria).
    // `null` = limpar explicitamente. String = definir (já validado acima).
    const resolvedPisCofinsGroupId =
      input.pisCofinsGroupId === undefined
        ? (existing?.pisCofinsGroupId ?? null)
        : input.pisCofinsGroupId;
    const resolvedIcmsGroupId =
      input.icmsGroupId === undefined
        ? (existing?.icmsGroupId ?? null)
        : input.icmsGroupId;
    const resolvedIssqnGroupId =
      input.issqnGroupId === undefined
        ? (existing?.issqnGroupId ?? null)
        : input.issqnGroupId;
    const resolvedIpiGroupId =
      input.ipiGroupId === undefined
        ? (existing?.ipiGroupId ?? null)
        : input.ipiGroupId;

    const fiscal = ProductFiscal.create(
      {
        organizationId: input.organizationId,
        productId: input.productId,
        ncm: input.info.ncm,
        origin: input.info.origin,
        netWeightKg: input.info.netWeightKg,
        grossWeightKg: input.info.grossWeightKg,
        cest: input.info.cest,
        fcpPercent: input.info.fcpPercent,
        fcpStPercent: input.info.fcpStPercent,
        fcpStRetainedPercent: input.info.fcpStRetainedPercent,
        cstIbsCbs: input.info.cstIbsCbs,
        taxClassification: input.info.taxClassification,
        icms: input.group.icms,
        pisCofins: input.group.pisCofins,
        ipi: input.group.ipi,
        cfop: input.group.cfop,
        issqn: input.group.issqn,
        pisCofinsGroupId: resolvedPisCofinsGroupId,
        icmsGroupId: resolvedIcmsGroupId,
        issqnGroupId: resolvedIssqnGroupId,
        ipiGroupId: resolvedIpiGroupId,
        branches: input.units,
        createdAt: existing?.createdAt,
      },
      existing?.id,
    );

    return this.productFiscalRepository.upsert(fiscal);
  }
}
