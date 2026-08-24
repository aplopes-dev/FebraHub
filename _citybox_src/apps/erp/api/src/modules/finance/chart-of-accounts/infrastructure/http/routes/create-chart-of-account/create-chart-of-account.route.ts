import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateChartOfAccountUseCase } from '../../../../application/use-cases/create-chart-of-account/create-chart-of-account.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { CreateChartOfAccountHttpDto } from '../shared/chart-of-account.dto';
import { ChartOfAccountPresenter } from '../shared/chart-of-account.presenter';

@ApiTags('chart-of-accounts')
@Controller('v1/chart-of-accounts')
export class CreateChartOfAccountRoute {
  constructor(private readonly createAccount: CreateChartOfAccountUseCase) {}

  @Post()
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Criar conta do plano de contas' })
  @ApiResponse({ status: 201, description: 'Conta criada' })
  @ApiResponse({ status: 404, description: 'Grupo financeiro não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Body() dto: CreateChartOfAccountHttpDto,
  ) {
    const item = await this.createAccount.execute({
      organizationId,
      name: dto.name,
      financialGroupId: dto.financialGroupId,
      availableForPdv: dto.availableForPdv,
    });

    return ChartOfAccountPresenter.toHttpSingle(item);
  }
}
