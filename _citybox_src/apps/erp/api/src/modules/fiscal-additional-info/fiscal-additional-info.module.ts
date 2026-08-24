import { Module } from '@nestjs/common';
import { TenancyModule } from '../tenancy/tenancy.module';
import { FiscalAdditionalInfoRepository } from './domain/repositories/fiscal-additional-info.repository.interface';
import { PrismaFiscalAdditionalInfoRepository } from './infrastructure/database/prisma-fiscal-additional-info.repository';
import { ListFiscalAdditionalInfosUseCase } from './application/use-cases/list-fiscal-additional-infos/list-fiscal-additional-infos.use-case';
import { CountFiscalAdditionalInfosUseCase } from './application/use-cases/count-fiscal-additional-infos/count-fiscal-additional-infos.use-case';
import { GetFiscalAdditionalInfoUseCase } from './application/use-cases/get-fiscal-additional-info/get-fiscal-additional-info.use-case';
import { CreateFiscalAdditionalInfoUseCase } from './application/use-cases/create-fiscal-additional-info/create-fiscal-additional-info.use-case';
import { UpdateFiscalAdditionalInfoUseCase } from './application/use-cases/update-fiscal-additional-info/update-fiscal-additional-info.use-case';
import { DeleteFiscalAdditionalInfoUseCase } from './application/use-cases/delete-fiscal-additional-info/delete-fiscal-additional-info.use-case';
import { ResolveDocumentAdditionalInfoUseCase } from './application/use-cases/resolve-document-additional-info/resolve-document-additional-info.use-case';
import { FiscalAdditionalInfoRoute } from './infrastructure/http/routes/fiscal-additional-info.route';

/**
 * Informações adicionais da nota fiscal (spec erp/017). CRUD por tipo de
 * documento + `ResolveDocumentAdditionalInfoUseCase`, que concatena por destino
 * e valida o teto do XSD antes da emissão (a fiscal-api recebe texto pronto).
 */
@Module({
  imports: [TenancyModule],
  controllers: [FiscalAdditionalInfoRoute],
  providers: [
    {
      provide: FiscalAdditionalInfoRepository,
      useClass: PrismaFiscalAdditionalInfoRepository,
    },
    ListFiscalAdditionalInfosUseCase,
    CountFiscalAdditionalInfosUseCase,
    GetFiscalAdditionalInfoUseCase,
    CreateFiscalAdditionalInfoUseCase,
    UpdateFiscalAdditionalInfoUseCase,
    DeleteFiscalAdditionalInfoUseCase,
    ResolveDocumentAdditionalInfoUseCase,
  ],
  exports: [
    FiscalAdditionalInfoRepository,
    ResolveDocumentAdditionalInfoUseCase,
  ],
})
export class FiscalAdditionalInfoModule {}
