import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListBankAccountsUseCase } from '../../../../application/use-cases/list-bank-accounts/list-bank-accounts.use-case';
import { RequirePermission } from '../../../../../../../shared/infra/http/decorators/permissions';
import { OrganizationId } from '../../../../../../../shared/infra/http/decorators/tenant.decorators';
import { ListBankAccountsQueryDto } from '../shared/bank-account.dto';
import { BankAccountPresenter } from '../shared/bank-account.presenter';

@ApiTags('bank-accounts')
@Controller('v1/bank-accounts')
export class ListBankAccountsRoute {
  constructor(private readonly listBankAccounts: ListBankAccountsUseCase) {}

  @Get()
  @RequirePermission('org.view')
  @ApiOperation({
    summary: 'Listar contas bancárias',
    description:
      '`tabCounts` conta o cadastro inteiro da organização, ignorando a busca.',
  })
  async handle(
    @OrganizationId() organizationId: string,
    @Query() query: ListBankAccountsQueryDto,
  ) {
    const result = await this.listBankAccounts.execute({
      organizationId,
      tab: query.tab,
      search: query.search?.trim() || undefined,
      page: query.page,
      perPage: query.perPage,
    });
    return BankAccountPresenter.toHttpList(result);
  }
}
