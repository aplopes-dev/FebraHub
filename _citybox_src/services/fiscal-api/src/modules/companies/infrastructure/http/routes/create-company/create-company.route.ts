import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateCompanyUseCase } from '../../../../application/use-cases/create-company/create-company.use-case';
import { RequirePermission } from '../../../../../../shared/infra/http/decorators/permissions';
import { CompanyPresenter } from '../shared/company.presenter';
import { CreateCompanyDto } from './create-company.dto';

@ApiTags('companies')
@Controller('v1/companies')
@RequirePermission('fiscal.companies.manage')
export class CreateCompanyRoute {
  constructor(private readonly createCompany: CreateCompanyUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Provisionar Emitente fiscal para uma Loja' })
  async handle(@Body() dto: CreateCompanyDto) {
    const company = await this.createCompany.execute({
      ...dto,
      address: { ...dto.address, complement: dto.address.complement ?? null },
    });
    return CompanyPresenter.toHttp(company);
  }
}
