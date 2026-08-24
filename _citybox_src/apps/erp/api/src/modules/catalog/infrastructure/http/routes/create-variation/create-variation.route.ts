import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateVariationUseCase } from '../../../../application/use-cases/create-variation/create-variation.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../shared/infra/http/decorators/tenant.decorators';
import { SaveVariationDto } from '../shared/variation.dto';
import { VariationPresenter } from '../shared/variation.presenter';

@ApiTags('variations')
@Controller('v1/variations')
@RequirePermission('store.catalog.manage')
export class CreateVariationRoute {
  constructor(private readonly createVariation: CreateVariationUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Criar variação do catálogo' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: SaveVariationDto,
  ) {
    const variation = await this.createVariation.execute({
      organizationId,
      name: dto.name,
      calculation: dto.calculation,
      options: dto.options,
    });
    return VariationPresenter.toHttpSingle(variation);
  }
}
