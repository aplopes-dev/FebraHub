import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateUnitOfMeasureUseCase } from '../../../../application/use-cases/update-unit-of-measure/update-unit-of-measure.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaveUnitOfMeasureDto } from '../shared/unit-of-measure.dto';
import { UnitOfMeasurePresenter } from '../shared/catalog-support.presenter';

@ApiTags('units-of-measure')
@Controller('v1/units-of-measure')
@RequirePermission('store.catalog.manage')
export class UpdateUnitOfMeasureRoute {
  constructor(private readonly updateUnit: UpdateUnitOfMeasureUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar unidade de medida' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: SaveUnitOfMeasureDto,
  ) {
    const unit = await this.updateUnit.execute({
      organizationId,
      id,
      name: dto.name,
      abbreviation: dto.abbreviation,
      kind: dto.kind,
      decimalPlaces: dto.decimalPlaces ?? 0,
      active: dto.active ?? true,
    });
    return UnitOfMeasurePresenter.toHttpSingle(unit);
  }
}
