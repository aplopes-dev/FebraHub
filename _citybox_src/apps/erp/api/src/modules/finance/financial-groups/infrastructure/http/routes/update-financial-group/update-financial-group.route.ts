import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateFinancialGroupUseCase } from '../../../../application/use-cases/update-financial-group/update-financial-group.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateFinancialGroupHttpDto } from '../shared/financial-group.dto';
import { FinancialGroupPresenter } from '../shared/financial-group.presenter';

@ApiTags('financial-groups')
@Controller('v1/financial-groups')
export class UpdateFinancialGroupRoute {
  constructor(private readonly updateGroup: UpdateFinancialGroupUseCase) {}

  @Put(':id')
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Atualizar grupo financeiro' })
  @ApiResponse({ status: 404, description: 'Grupo não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancialGroupHttpDto,
  ) {
    const group = await this.updateGroup.execute({
      organizationId,
      id,
      name: dto.name,
      type: dto.type,
    });
    return FinancialGroupPresenter.toHttpSingle(group);
  }
}
