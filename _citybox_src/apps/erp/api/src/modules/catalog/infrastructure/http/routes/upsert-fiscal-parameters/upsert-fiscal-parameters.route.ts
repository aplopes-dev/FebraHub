import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertFiscalParametersUseCase } from '../../../../application/use-cases/upsert-fiscal-parameters/upsert-fiscal-parameters.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { UpsertFiscalParametersHttpDto } from '../shared/product-fiscal.dto';
import { ProductFiscalPresenter } from '../shared/product-fiscal.presenter';

@ApiTags('fiscal-parameters')
@Controller('v1/fiscal-parameters')
export class UpsertFiscalParametersRoute {
  constructor(
    private readonly upsertFiscalParameters: UpsertFiscalParametersUseCase,
  ) {}

  @Put(':productId')
  @RequirePermission('store.catalog.manage')
  @ApiOperation({ summary: 'Salvar parâmetros fiscais de um produto' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('productId') productId: string,
    @Body() dto: UpsertFiscalParametersHttpDto,
  ) {
    const fiscal = await this.upsertFiscalParameters.execute({
      organizationId,
      productId,
      info: {
        ncm: dto.info.ncm,
        origin: dto.info.origin,
        netWeightKg: dto.info.netWeightKg,
        grossWeightKg: dto.info.grossWeightKg,
        cest: dto.info.cest ?? '',
        fcpPercent: dto.info.fcpPercent ?? 0,
        fcpStPercent: dto.info.fcpStPercent ?? 0,
        fcpStRetainedPercent: dto.info.fcpStRetainedPercent ?? 0,
        cstIbsCbs: dto.info.cstIbsCbs ?? '',
        taxClassification: dto.info.taxClassification ?? '',
      },
      group: {
        icms: dto.group.icms,
        pisCofins: dto.group.pisCofins,
        ipi: dto.group.ipi,
        cfop: dto.group.cfop,
        issqn: dto.group.issqn ?? { value: '', applyToAll: true },
      },
      // undefined (campo ausente) = mantém o existente; null = limpa explicitamente.
      pisCofinsGroupId: dto.pisCofinsGroupId,
      icmsGroupId: dto.icmsGroupId,
      issqnGroupId: dto.issqnGroupId,
      ipiGroupId: dto.ipiGroupId,
      units: (dto.units ?? []).map((unit) => ({
        branchId: unit.branchId,
        icms: unit.icms ?? '',
        pisCofins: unit.pisCofins ?? '',
        ipi: unit.ipi ?? '',
        cfop: unit.cfop ?? '',
        issqn: unit.issqn ?? '',
      })),
    });
    return ProductFiscalPresenter.toHttpUpsert(fiscal);
  }
}
