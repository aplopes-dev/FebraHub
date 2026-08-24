import { Module } from '@nestjs/common';
import { BackofficeStoreRepository } from './infrastructure/database/backoffice-store.repository';
import { ListMyStoresUseCase } from './application/use-cases/list-my-stores/list-my-stores.use-case';
import { ListMyStoresRoute } from './infrastructure/http/routes/list-my-stores/list-my-stores.route';

@Module({
  controllers: [ListMyStoresRoute],
  providers: [BackofficeStoreRepository, ListMyStoresUseCase],
})
export class BackofficeModule {}
