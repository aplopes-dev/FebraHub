import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpsertTechnicalSheetUseCase } from '../../../../application/use-cases/upsert-technical-sheet/upsert-technical-sheet.use-case';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpsertTechnicalSheetHttpDto } from '../shared/technical-sheet.dto';
import { TechnicalSheetPresenter } from '../shared/technical-sheet.presenter';

@ApiTags('technical-sheets')
@Controller('v1/technical-sheets')
export class UpsertTechnicalSheetRoute {
  constructor(
    private readonly upsertTechnicalSheet: UpsertTechnicalSheetUseCase,
  ) {}

  @Put(':productId')
  @ApiOperation({ summary: 'Salvar ficha técnica de um produto' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('productId') productId: string,
    @Body() dto: UpsertTechnicalSheetHttpDto,
  ) {
    const result = await this.upsertTechnicalSheet.execute({
      organizationId,
      productId,
      productionType: dto.productionType,
      maxRemovableComponents: dto.maxRemovableComponents,
      markupPercent: dto.markupPercent,
      components: dto.components ?? [],
      optionComponents: dto.optionComponents ?? [],
      applyBasePriceCents: dto.applyBasePriceCents,
    });
    return TechnicalSheetPresenter.toHttpUpsert(result);
  }
}
