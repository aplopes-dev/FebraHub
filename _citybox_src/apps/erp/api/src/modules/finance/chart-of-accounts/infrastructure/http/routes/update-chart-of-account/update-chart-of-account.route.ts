import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateChartOfAccountUseCase } from '../../../../application/use-cases/update-chart-of-account/update-chart-of-account.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { UpdateChartOfAccountHttpDto } from '../shared/chart-of-account.dto';
import { ChartOfAccountPresenter } from '../shared/chart-of-account.presenter';

@ApiTags('chart-of-accounts')
@Controller('v1/chart-of-accounts')
export class UpdateChartOfAccountRoute {
  constructor(private readonly updateAccount: UpdateChartOfAccountUseCase) {}

  @Put(':id')
  @RequirePermission('store.finance.manage')
  @ApiOperation({ summary: 'Atualizar conta do plano de contas' })
  @ApiResponse({ status: 404, description: 'Conta ou grupo não encontrado' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateChartOfAccountHttpDto,
  ) {
    const item = await this.updateAccount.execute({
      organizationId,
      id,
      name: dto.name,
      financialGroupId: dto.financialGroupId,
      availableForPdv: dto.availableForPdv ?? false,
    });

    return ChartOfAccountPresenter.toHttpSingle(item);
  }
}
