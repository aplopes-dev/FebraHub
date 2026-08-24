import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCompanyUseCase } from '../../../../application/use-cases/get-company/get-company.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CompanyPresenter } from '../shared/company.presenter';

@ApiTags('companies')
@Controller('v1/companies')
@RequirePermission('fiscal.companies.manage')
export class GetCompanyRoute {
  constructor(private readonly getCompany: GetCompanyUseCase) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obter Emitente fiscal por id' })
  async handle(@Param('id') id: string) {
    const company = await this.getCompany.execute({ companyId: id });
    return CompanyPresenter.toHttp(company);
  }
}
