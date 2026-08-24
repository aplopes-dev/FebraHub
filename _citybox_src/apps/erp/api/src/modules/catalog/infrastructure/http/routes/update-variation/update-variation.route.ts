import { Body, Controller, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateVariationUseCase } from '../../../../application/use-cases/update-variation/update-variation.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaveVariationDto } from '../shared/variation.dto';
import { VariationPresenter } from '../shared/variation.presenter';

@ApiTags('variations')
@Controller('v1/variations')
@RequirePermission('store.catalog.manage')
export class UpdateVariationRoute {
  constructor(private readonly updateVariation: UpdateVariationUseCase) {}

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar variação do catálogo' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id') id: string,
    @Body() dto: SaveVariationDto,
  ) {
    const variation = await this.updateVariation.execute({
      organizationId,
      id,
      name: dto.name,
      calculation: dto.calculation,
      options: dto.options,
    });
    return VariationPresenter.toHttpSingle(variation);
  }
}
