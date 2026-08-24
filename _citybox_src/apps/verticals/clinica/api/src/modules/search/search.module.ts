import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { SalesFunnelsModule } from '../sales/funnels/funnels.module';
import { GlobalSearchUseCase } from './application/use-cases/global-search/global-search.use-case';
import { SearchRepository } from './infrastructure/database/search.repository';
import { PrismaSearchRepository } from './infrastructure/database/prisma-search.repository';
import { GlobalSearchRoute } from './infrastructure/http/routes/global-search/global-search.route';

@Module({
  imports: [PrismaModule, SalesFunnelsModule],
  controllers: [GlobalSearchRoute],
  providers: [
    { provide: SearchRepository, useClass: PrismaSearchRepository },
    GlobalSearchUseCase,
  ],
})
export class SearchModule {}
