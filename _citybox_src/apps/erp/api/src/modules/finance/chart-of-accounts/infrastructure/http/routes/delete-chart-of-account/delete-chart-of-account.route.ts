import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteChartOfAccountUseCase } from '../../../../application/use-cases/delete-chart-of-account/delete-chart-of-account.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('chart-of-accounts')
@Controller('v1/chart-of-accounts')
export class DeleteChartOfAccountRoute {
  constructor(private readonly deleteAccount: DeleteChartOfAccountUseCase) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Excluir conta do plano de contas',
    description: 'Soft-delete: a conta some das listagens, mas não é apagada.',
  })
  @ApiResponse({ status: 204, description: 'Conta excluída' })
  @ApiResponse({ status: 404, description: 'Conta não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteAccount.execute({ organizationId, id });
  }
}
