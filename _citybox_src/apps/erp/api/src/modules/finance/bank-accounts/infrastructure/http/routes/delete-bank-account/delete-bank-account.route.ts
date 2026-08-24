import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteBankAccountUseCase } from '../../../../application/use-cases/delete-bank-account/delete-bank-account.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('bank-accounts')
@Controller('v1/bank-accounts')
export class DeleteBankAccountRoute {
  constructor(private readonly deleteBankAccount: DeleteBankAccountUseCase) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Excluir conta bancária',
    description:
      'Soft-delete: lançamentos e pagamentos já registrados continuam apontando para ela.',
  })
  @ApiResponse({ status: 204, description: 'Conta bancária excluída' })
  @ApiResponse({ status: 404, description: 'Conta bancária não encontrada' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteBankAccount.execute({ organizationId, id });
  }
}
