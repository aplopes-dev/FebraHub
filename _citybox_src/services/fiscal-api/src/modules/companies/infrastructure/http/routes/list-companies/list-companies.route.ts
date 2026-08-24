import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ListCompaniesUseCase } from '../../../../application/use-cases/list-companies/list-companies.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CompanyPresenter } from '../shared/company.presenter';

@ApiTags('companies')
@Controller('v1/companies')
@RequirePermission('fiscal.companies.manage')
export class ListCompaniesRoute {
  constructor(private readonly listCompanies: ListCompaniesUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar Emitentes fiscais' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'cnpj', required: false })
  @ApiQuery({ name: 'active', required: false })
  async handle(
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('cnpj') cnpj?: string,
    @Query('active') active?: string,
  ) {
    const result = await this.listCompanies.execute({
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      cnpj,
      active: active === undefined ? undefined : active === 'true',
    });

    return CompanyPresenter.toListHttp(result.companies, {
      total: result.total,
      page: result.page,
      perPage: result.perPage,
      totalPages: result.totalPages,
    });
  }
}
