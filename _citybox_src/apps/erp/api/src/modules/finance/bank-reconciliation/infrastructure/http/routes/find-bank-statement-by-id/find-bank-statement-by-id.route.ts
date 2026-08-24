import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FindBankStatementByIdUseCase } from '../../../../application/use-cases/find-bank-statement-by-id/find-bank-statement-by-id.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { BankStatementPresenter } from '../shared/bank-statement.presenter';

@ApiTags('bank-statements')
@Controller('v1/bank-statements')
export class FindBankStatementByIdRoute {
  constructor(
    private readonly findBankStatementById: FindBankStatementByIdUseCase,
  ) {}

  @Get(':id')
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Detalhar extrato bancário' })
  @ApiResponse({ status: 404, description: 'Extrato bancário não encontrado' })
  async handle(
    @OrganizationId() organizationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const bankStatement = await this.findBankStatementById.execute({
      organizationId,
      id,
    });
    return BankStatementPresenter.toHttpSingle(bankStatement);
  }
}
