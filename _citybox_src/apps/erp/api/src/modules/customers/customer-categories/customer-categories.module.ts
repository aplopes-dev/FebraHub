import { Module } from '@nestjs/common';
import { CustomerCategoryRepository } from './domain/repositories/customer-category.repository.interface';
import { PrismaCustomerCategoryRepository } from './infrastructure/database/prisma-customer-category.repository';
import { CreateCustomerCategoryUseCase } from './application/use-cases/create-customer-category/create-customer-category.use-case';
import { UpdateCustomerCategoryUseCase } from './application/use-cases/update-customer-category/update-customer-category.use-case';
import { DeleteCustomerCategoryUseCase } from './application/use-cases/delete-customer-category/delete-customer-category.use-case';
import { ListCustomerCategoriesUseCase } from './application/use-cases/list-customer-categories/list-customer-categories.use-case';
import { FindCustomerCategoryByIdUseCase } from './application/use-cases/find-customer-category-by-id/find-customer-category-by-id.use-case';
import { CreateCustomerCategoryRoute } from './infrastructure/http/routes/create-customer-category/create-customer-category.route';
import { ListCustomerCategoriesRoute } from './infrastructure/http/routes/list-customer-categories/list-customer-categories.route';
import { FindCustomerCategoryByIdRoute } from './infrastructure/http/routes/find-customer-category-by-id/find-customer-category-by-id.route';
import { UpdateCustomerCategoryRoute } from './infrastructure/http/routes/update-customer-category/update-customer-category.route';
import { DeleteCustomerCategoryRoute } from './infrastructure/http/routes/delete-customer-category/delete-customer-category.route';

@Module({
  controllers: [
    ListCustomerCategoriesRoute,
    CreateCustomerCategoryRoute,
    FindCustomerCategoryByIdRoute,
    UpdateCustomerCategoryRoute,
    DeleteCustomerCategoryRoute,
  ],
  providers: [
    {
      provide: CustomerCategoryRepository,
      useClass: PrismaCustomerCategoryRepository,
    },
    CreateCustomerCategoryUseCase,
    UpdateCustomerCategoryUseCase,
    DeleteCustomerCategoryUseCase,
    ListCustomerCategoriesUseCase,
    FindCustomerCategoryByIdUseCase,
  ],
  exports: [CustomerCategoryRepository, ListCustomerCategoriesUseCase],
})
export class CustomerCategoriesModule {}
