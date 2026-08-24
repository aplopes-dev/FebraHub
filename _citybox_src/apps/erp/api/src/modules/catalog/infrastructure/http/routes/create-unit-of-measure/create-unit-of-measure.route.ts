import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUnitOfMeasureUseCase } from '../../../../application/use-cases/create-unit-of-measure/create-unit-of-measure.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaveUnitOfMeasureDto } from '../shared/unit-of-measure.dto';
import { UnitOfMeasurePresenter } from '../shared/catalog-support.presenter';

@ApiTags('units-of-measure')
@Controller('v1/units-of-measure')
@RequirePermission('store.catalog.manage')
export class CreateUnitOfMeasureRoute {
  constructor(private readonly createUnit: CreateUnitOfMeasureUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Criar unidade de medida' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: SaveUnitOfMeasureDto,
  ) {
    const unit = await this.createUnit.execute({
      organizationId,
      name: dto.name,
      abbreviation: dto.abbreviation,
      kind: dto.kind,
      decimalPlaces: dto.decimalPlaces,
      active: dto.active,
    });
    return UnitOfMeasurePresenter.toHttpSingle(unit);
  }
}
