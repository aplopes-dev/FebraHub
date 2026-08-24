import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CustomerCategoriesModule } from './customer-categories/customer-categories.module';
import { CustomerRepository } from './domain/repositories/customer.repository.interface';
import { PrismaCustomerRepository } from './infrastructure/database/prisma-customer.repository';
import { CreateCustomerUseCase } from './application/use-cases/create-customer/create-customer.use-case';
import { ListCustomersUseCase } from './application/use-cases/list-customers/list-customers.use-case';
import { FindCustomerByIdUseCase } from './application/use-cases/find-customer-by-id/find-customer-by-id.use-case';
import { UpdateCustomerUseCase } from './application/use-cases/update-customer/update-customer.use-case';
import { DeleteCustomerUseCase } from './application/use-cases/delete-customer/delete-customer.use-case';
import { RestoreCustomerUseCase } from './application/use-cases/restore-customer/restore-customer.use-case';
import { ListCustomersRoute } from './infrastructure/http/routes/list-customers/list-customers.route';
import { CreateCustomerRoute } from './infrastructure/http/routes/create-customer/create-customer.route';
import { RestoreCustomerRoute } from './infrastructure/http/routes/restore-customer/restore-customer.route';
import { FindCustomerByIdRoute } from './infrastructure/http/routes/find-customer-by-id/find-customer-by-id.route';
import { UpdateCustomerRoute } from './infrastructure/http/routes/update-customer/update-customer.route';
import { DeleteCustomerRoute } from './infrastructure/http/routes/delete-customer/delete-customer.route';

@Module({
  imports: [TenancyModule, CustomerCategoriesModule],
  controllers: [
    ListCustomersRoute,
    CreateCustomerRoute,
    RestoreCustomerRoute,
    FindCustomerByIdRoute,
    UpdateCustomerRoute,
    DeleteCustomerRoute,
  ],
  providers: [
    { provide: CustomerRepository, useClass: PrismaCustomerRepository },
    CreateCustomerUseCase,
    ListCustomersUseCase,
    FindCustomerByIdUseCase,
    UpdateCustomerUseCase,
    DeleteCustomerUseCase,
    RestoreCustomerUseCase,
  ],
  exports: [
    CustomerRepository,
    CreateCustomerUseCase,
    ListCustomersUseCase,
    FindCustomerByIdUseCase,
    CustomerCategoriesModule,
  ],
})
export class CustomersModule {}
