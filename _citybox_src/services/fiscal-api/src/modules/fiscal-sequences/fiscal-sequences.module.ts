import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/infra/prisma/prisma.module';
import { TenantAccessModule } from '../../shared/infra/tenant/tenant-access.module';
import { FiscalDocumentsModule } from '../fiscal-documents/fiscal-documents.module';

import { FiscalSequenceNumberChangeRepository } from './domain/repositories/fiscal-sequence-number-change.repository.interface';
import { PrismaFiscalSequenceNumberChangeRepository } from './infrastructure/database/prisma-fiscal-sequence-number-change.repository';
import { SequenceNumberUpdater } from './domain/repositories/sequence-number-updater.interface';
import { PrismaSequenceNumberUpdater } from './infrastructure/database/prisma-sequence-number-updater';

import { ListFiscalSequencesUseCase } from './application/use-cases/list-fiscal-sequences/list-fiscal-sequences.use-case';
import { CreateFiscalSequenceUseCase } from './application/use-cases/create-fiscal-sequence/create-fiscal-sequence.use-case';
import { UpdateSequenceNumberUseCase } from './application/use-cases/update-sequence-number/update-sequence-number.use-case';
import { SetSequenceActiveUseCase } from './application/use-cases/set-sequence-active/set-sequence-active.use-case';
import { DeleteFiscalSequenceUseCase } from './application/use-cases/delete-fiscal-sequence/delete-fiscal-sequence.use-case';

import { ListFiscalSequencesRoute } from './infrastructure/http/routes/list-fiscal-sequences/list-fiscal-sequences.route';
import { CreateFiscalSequenceRoute } from './infrastructure/http/routes/create-fiscal-sequence/create-fiscal-sequence.route';
import { UpdateSequenceNumberRoute } from './infrastructure/http/routes/update-sequence-number/update-sequence-number.route';
import { SetSequenceActiveRoute } from './infrastructure/http/routes/set-sequence-active/set-sequence-active.route';
import { DeleteFiscalSequenceRoute } from './infrastructure/http/routes/delete-fiscal-sequence/delete-fiscal-sequence.route';

/// Fachada HTTP de séries/numeração (spec erp/011). Reusa a `FiscalSequenceRepository`
/// exportada por `FiscalDocumentsModule` (mesma tabela da emissão) e a
/// `CompanyAccessPolicy` do `TenantAccessModule`.
@Module({
  imports: [PrismaModule, TenantAccessModule, FiscalDocumentsModule],
  controllers: [
    ListFiscalSequencesRoute,
    CreateFiscalSequenceRoute,
    UpdateSequenceNumberRoute,
    SetSequenceActiveRoute,
    DeleteFiscalSequenceRoute,
  ],
  providers: [
    {
      provide: FiscalSequenceNumberChangeRepository,
      useClass: PrismaFiscalSequenceNumberChangeRepository,
    },
    {
      provide: SequenceNumberUpdater,
      useClass: PrismaSequenceNumberUpdater,
    },
    ListFiscalSequencesUseCase,
    CreateFiscalSequenceUseCase,
    UpdateSequenceNumberUseCase,
    SetSequenceActiveUseCase,
    DeleteFiscalSequenceUseCase,
  ],
})
export class FiscalSequencesModule {}
