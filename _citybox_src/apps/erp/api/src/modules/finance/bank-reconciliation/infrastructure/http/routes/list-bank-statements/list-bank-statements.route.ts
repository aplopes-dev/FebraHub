import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListBankStatementsUseCase } from '../../../../application/use-cases/list-bank-statements/list-bank-statements.use-case';
import { resolvePagination } from '../../../../../../tenancy/application/pagination';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListBankStatementsQueryDto } from '../shared/bank-statement.dto';
import { BankStatementPresenter } from '../shared/bank-statement.presenter';

@ApiTags('bank-statements')
@Controller('v1/bank-statements')
export class ListBankStatementsRoute {
  constructor(private readonly listBankStatements: ListBankStatementsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({ summary: 'Listar extratos bancários importados' })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListBankStatementsQueryDto,
  ) {
    const result = await this.listBankStatements.execute({
      organizationId,
      bankAccountId: query.bankAccountId,
      status: query.status,
      page: query.page ?? 1,
      perPage: query.perPage ?? 10,
    });
    const pagination = resolvePagination(
      result.total,
      query.page,
      query.perPage,
    );
    return BankStatementPresenter.toHttpList(result, pagination);
  }
}
