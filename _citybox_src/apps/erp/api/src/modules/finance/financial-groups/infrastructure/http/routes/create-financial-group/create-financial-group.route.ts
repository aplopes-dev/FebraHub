import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateFinancialGroupUseCase } from '../../../../application/use-cases/create-financial-group/create-financial-group.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateFinancialGroupHttpDto } from '../shared/financial-group.dto';
import { FinancialGroupPresenter } from '../shared/financial-group.presenter';

@ApiTags('financial-groups')
@Controller('v1/financial-groups')
export class CreateFinancialGroupRoute {
  constructor(private readonly createGroup: CreateFinancialGroupUseCase) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Criar grupo financeiro' })
  @ApiResponse({ status: 201, description: 'Grupo criado' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateFinancialGroupHttpDto,
  ) {
    const group = await this.createGroup.execute({
      organizationId,
      name: dto.name,
      type: dto.type,
    });
    return FinancialGroupPresenter.toHttpSingle(group);
  }
}
