import { Module } from '@nestjs/common';

import { GetFiscalDocumentsSummaryRoute } from './infrastructure/http/routes/get-fiscal-documents-summary/get-fiscal-documents-summary.route';
import { GetFiscalDocumentRoute } from './infrastructure/http/routes/get-fiscal-document/get-fiscal-document.route';
import { ListFiscalDocumentsRoute } from './infrastructure/http/routes/list-fiscal-documents/list-fiscal-documents.route';
import { ListFiscalDocumentEventsRoute } from './infrastructure/http/routes/list-fiscal-document-events/list-fiscal-document-events.route';
import { GetFiscalDocumentsSummaryUseCase } from './application/use-cases/get-fiscal-documents-summary/get-fiscal-documents-summary.use-case';
import { GetFiscalDocumentUseCase } from './application/use-cases/get-fiscal-document/get-fiscal-document.use-case';
import { ListFiscalDocumentsUseCase } from './application/use-cases/list-fiscal-documents/list-fiscal-documents.use-case';
import { ListFiscalDocumentEventsUseCase } from './application/use-cases/list-fiscal-document-events/list-fiscal-document-events.use-case';
import { PrismaFiscalDocumentRepository } from './infrastructure/database/prisma-fiscal-document.repository';
import { PrismaFiscalEventRepository } from './infrastructure/database/prisma-fiscal-event.repository';
import { PrismaFiscalSequenceRepository } from './infrastructure/database/prisma-fiscal-sequence.repository';
import { PrismaProviderRequestRepository } from './infrastructure/database/prisma-provider-request.repository';
import { PrismaCustomerRepository } from './infrastructure/database/prisma-customer.repository';
import { FiscalDocumentRepository } from './domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from './domain/repositories/fiscal-event.repository.interface';
import { FiscalSequenceRepository } from './domain/repositories/fiscal-sequence.repository.interface';
import { ProviderRequestRepository } from './domain/repositories/provider-request.repository.interface';
import { CustomerRepository } from './domain/repositories/customer.repository.interface';

/// Módulo Foundational: entidade base FiscalDocument + consulta genérica
/// (FR-003). Exporta os repositórios para que nfe/nfse (US1/US2) os
/// reaproveitem sem redefinir a persistência.
@Module({
  controllers: [
    // ⚠️ Ordem importa: `GetFiscalDocumentsSummaryRoute` (`GET /summary`,
    // rota literal) MUST vir antes de `GetFiscalDocumentRoute` (`GET /:id`,
    // rota dinâmica) — senão o Nest casa "summary" como `:id` primeiro.
    GetFiscalDocumentsSummaryRoute,
    GetFiscalDocumentRoute,
    ListFiscalDocumentsRoute,
    ListFiscalDocumentEventsRoute,
  ],
  providers: [
    {
      provide: FiscalDocumentRepository,
      useClass: PrismaFiscalDocumentRepository,
    },
    { provide: FiscalEventRepository, useClass: PrismaFiscalEventRepository },
    {
      provide: FiscalSequenceRepository,
      useClass: PrismaFiscalSequenceRepository,
    },
    {
      provide: ProviderRequestRepository,
      useClass: PrismaProviderRequestRepository,
    },
    { provide: CustomerRepository, useClass: PrismaCustomerRepository },
    GetFiscalDocumentsSummaryUseCase,
    GetFiscalDocumentUseCase,
    ListFiscalDocumentsUseCase,
    ListFiscalDocumentEventsUseCase,
  ],
  exports: [
    FiscalDocumentRepository,
    FiscalEventRepository,
    FiscalSequenceRepository,
    ProviderRequestRepository,
    CustomerRepository,
  ],
})
export class FiscalDocumentsModule {}
