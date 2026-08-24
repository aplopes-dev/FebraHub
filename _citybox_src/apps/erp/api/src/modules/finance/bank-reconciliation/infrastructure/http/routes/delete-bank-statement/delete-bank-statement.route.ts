import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DeleteBankStatementUseCase } from '../../../../application/use-cases/delete-bank-statement/delete-bank-statement.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';

@ApiTags('bank-statements')
@Controller('v1/bank-statements')
export class DeleteBankStatementRoute {
  constructor(
    private readonly deleteBankStatement: DeleteBankStatementUseCase,
  ) {}

  @Delete(':id')
  @HttpCode(204)
  @RequirePermission('store.finance.manage')
  @ApiOperation({
    summary: 'Excluir extrato bancário',
    description:
      'Remove o extrato, suas transações e o arquivo OFX — hard delete, para ' +
      'liberar as chaves de dedupe e permitir reimportar o arquivo. Recusado ' +
      'enquanto houver transação conciliada (FR-045).',
  })
  @ApiResponse({ status: 204, description: 'Extrato excluído' })
  @ApiResponse({ status: 404, description: 'Extrato bancário não encontrado' })
  @ApiResponse({
    status: 422,
    description: 'Extrato ainda tem transação conciliada',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.deleteBankStatement.execute({
      organizationId,
      bankStatementId: id,
    });
  }
}
