import { Module } from '@nestjs/common';
import { CreateClientCategoryUseCase } from './application/use-cases/create-client-category/create-client-category.use-case';
import { DeleteClientCategoryUseCase } from './application/use-cases/delete-client-category/delete-client-category.use-case';
import { ListClientCategoriesUseCase } from './application/use-cases/list-client-categories/list-client-categories.use-case';
import { UpdateClientCategoryUseCase } from './application/use-cases/update-client-category/update-client-category.use-case';
import { ClientCategoryRepository } from './domain/repositories/client-category.repository.interface';
import { PrismaClientCategoryRepository } from './infrastructure/database/prisma-client-category.repository';
import { CreateClientCategoryRoute } from './infrastructure/http/routes/create-client-category/create-client-category.route';
import { DeleteClientCategoryRoute } from './infrastructure/http/routes/delete-client-category/delete-client-category.route';
import { ListClientCategoriesRoute } from './infrastructure/http/routes/list-client-categories/list-client-categories.route';
import { UpdateClientCategoryRoute } from './infrastructure/http/routes/update-client-category/update-client-category.route';

@Module({
  controllers: [
    CreateClientCategoryRoute,
    ListClientCategoriesRoute,
    UpdateClientCategoryRoute,
    DeleteClientCategoryRoute,
  ],
  providers: [
    {
      provide: ClientCategoryRepository,
      useClass: PrismaClientCategoryRepository,
    },
    CreateClientCategoryUseCase,
    ListClientCategoriesUseCase,
    UpdateClientCategoryUseCase,
    DeleteClientCategoryUseCase,
  ],
  exports: [ClientCategoryRepository],
})
export class ClientCategoriesModule {}
