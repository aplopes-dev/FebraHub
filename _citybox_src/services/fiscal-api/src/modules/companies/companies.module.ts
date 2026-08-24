import { Module } from '@nestjs/common';
import { CreateCompanyRoute } from './infrastructure/http/routes/create-company/create-company.route';
import { GetCompanyRoute } from './infrastructure/http/routes/get-company/get-company.route';
import { ListCompaniesRoute } from './infrastructure/http/routes/list-companies/list-companies.route';
import { UpdateCompanyRoute } from './infrastructure/http/routes/update-company/update-company.route';
import { SetCscRoute } from './infrastructure/http/routes/set-csc/set-csc.route';
import { ClearCscRoute } from './infrastructure/http/routes/clear-csc/clear-csc.route';
import { CreateCompanyUseCase } from './application/use-cases/create-company/create-company.use-case';
import { GetCompanyUseCase } from './application/use-cases/get-company/get-company.use-case';
import { ListCompaniesUseCase } from './application/use-cases/list-companies/list-companies.use-case';
import { UpdateCompanyUseCase } from './application/use-cases/update-company/update-company.use-case';
import { SetCscUseCase } from './application/use-cases/set-csc/set-csc.use-case';
import { ClearCscUseCase } from './application/use-cases/clear-csc/clear-csc.use-case';
import { PrismaCompanyRepository } from './infrastructure/database/prisma-company.repository';
import { CompanyRepository } from './domain/repositories/company.repository.interface';
import { TenantAccessModule } from '../../shared/infra/tenant/tenant-access.module';

@Module({
  imports: [TenantAccessModule],
  controllers: [
    CreateCompanyRoute,
    GetCompanyRoute,
    ListCompaniesRoute,
    UpdateCompanyRoute,
    SetCscRoute,
    ClearCscRoute,
  ],
  providers: [
    { provide: CompanyRepository, useClass: PrismaCompanyRepository },
    CreateCompanyUseCase,
    GetCompanyUseCase,
    ListCompaniesUseCase,
    UpdateCompanyUseCase,
    SetCscUseCase,
    ClearCscUseCase,
  ],
  exports: [CompanyRepository],
})
export class CompaniesModule {}
