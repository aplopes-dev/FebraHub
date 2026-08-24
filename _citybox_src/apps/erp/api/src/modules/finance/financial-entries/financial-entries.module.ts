import { Module, forwardRef } from '@nestjs/common';

import { BankAccountsModule } from '../bank-accounts/bank-accounts.module';
import { ChartOfAccountsModule } from '../chart-of-accounts/chart-of-accounts.module';
import { CostCentersModule } from '../cost-centers/cost-centers.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { CustomersModule } from '../../customers/customers.module';
import { SuppliersModule } from '../../stock/suppliers/suppliers.module';
// Ciclo real e intencional entre módulos irmãos — `BankReconciliationModule`
// também importa `FinancialEntriesModule` (D2 de
// `specs/erp/006-bank-reconciliation/research.md`); quebrado com
// `forwardRef` nos dois lados (ver `research.md` R9 de
// `specs/erp/007-financeiro-ajustes-ui`, US10).
import { BankReconciliationModule } from '../bank-reconciliation/bank-reconciliation.module';

import { FinancialEntryRepository } from './domain/repositories/financial-entry.repository.interface';
import { PrismaFinancialEntryRepository } from './infrastructure/database/prisma-financial-entry.repository';
import { FinancialEntryAttachmentRepository } from './domain/repositories/financial-entry-attachment.repository.interface';
import { PrismaFinancialEntryAttachmentRepository } from './infrastructure/database/prisma-financial-entry-attachment.repository';

import { CreateFinancialEntryUseCase } from './application/use-cases/create-financial-entry/create-financial-entry.use-case';
import { ListFinancialEntriesUseCase } from './application/use-cases/list-financial-entries/list-financial-entries.use-case';
import { GetFinancialEntriesSummaryUseCase } from './application/use-cases/get-financial-entries-summary/get-financial-entries-summary.use-case';
import { FindFinancialEntryByIdUseCase } from './application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import { UpdateFinancialEntryUseCase } from './application/use-cases/update-financial-entry/update-financial-entry.use-case';
import { DeleteFinancialEntryUseCase } from './application/use-cases/delete-financial-entry/delete-financial-entry.use-case';
import { RestoreFinancialEntryUseCase } from './application/use-cases/restore-financial-entry/restore-financial-entry.use-case';
import { UploadFinancialEntryAttachmentUseCase } from './application/use-cases/upload-financial-entry-attachment/upload-financial-entry-attachment.use-case';
import { GetFinancialEntryAttachmentUseCase } from './application/use-cases/get-financial-entry-attachment/get-financial-entry-attachment.use-case';
import { DeleteFinancialEntryAttachmentUseCase } from './application/use-cases/delete-financial-entry-attachment/delete-financial-entry-attachment.use-case';

import { ListFinancialEntriesRoute } from './infrastructure/http/routes/list-financial-entries/list-financial-entries.route';
import { GetFinancialEntriesSummaryRoute } from './infrastructure/http/routes/get-financial-entries-summary/get-financial-entries-summary.route';
import { CreateFinancialEntryRoute } from './infrastructure/http/routes/create-financial-entry/create-financial-entry.route';
import { RestoreFinancialEntryRoute } from './infrastructure/http/routes/restore-financial-entry/restore-financial-entry.route';
import { FindFinancialEntryByIdRoute } from './infrastructure/http/routes/find-financial-entry-by-id/find-financial-entry-by-id.route';
import { UpdateFinancialEntryRoute } from './infrastructure/http/routes/update-financial-entry/update-financial-entry.route';
import { DeleteFinancialEntryRoute } from './infrastructure/http/routes/delete-financial-entry/delete-financial-entry.route';
import { UploadFinancialEntryAttachmentRoute } from './infrastructure/http/routes/financial-entry-attachment/upload-financial-entry-attachment.route';
import { GetFinancialEntryAttachmentRoute } from './infrastructure/http/routes/financial-entry-attachment/get-financial-entry-attachment.route';
import { DeleteFinancialEntryAttachmentRoute } from './infrastructure/http/routes/financial-entry-attachment/delete-financial-entry-attachment.route';

/**
 * Lançamentos financeiros — o contas a pagar/receber da organização.
 *
 * Importa `BankAccountsModule`/`ChartOfAccountsModule`/`CostCentersModule`/
 * `PaymentMethodsModule`/`CustomersModule`/`SuppliersModule` para conferir cada vínculo antes de
 * gravar: sem isso um id inválido só estouraria na FK do banco (500 em vez de
 * 404/422). Mesmo padrão de import completo já usado para `bankAccountId`
 * (`ChartOfAccountsModule → FinancialGroupsModule` é o precedente) — não a
 * porta mínima (`BankAccountLookup`) que `card-contracts` usa, para não
 * introduzir uma terceira convenção dentro do mesmo módulo.
 *
 * `forwardRef(() => BankReconciliationModule)` (spec `007-financeiro-ajustes-ui`
 * US10, `research.md` R9): `DeleteFinancialEntryUseCase` precisa de
 * `BankStatementMatchRepository` (dono: `bank-reconciliation`) para bloquear
 * exclusão de lançamento com conciliação ativa. `BankReconciliationModule` já
 * importa este módulo (D2 de `006-bank-reconciliation`) — sem `forwardRef` dos
 * dois lados o Nest não resolve o ciclo.
 */
@Module({
  imports: [
    BankAccountsModule,
    ChartOfAccountsModule,
    CostCentersModule,
    PaymentMethodsModule,
    CustomersModule,
    SuppliersModule,
    forwardRef(() => BankReconciliationModule),
  ],
  // Ordem importa: as rotas de caminho fixo antes de `:id`, para o Nest não
  // tratar um segmento fixo como parâmetro. `GetFinancialEntriesSummaryRoute`
  // (`GET summary`) precisa vir antes de `FindFinancialEntryByIdRoute`
  // (`GET :id`), senão `/v1/financial-entries/summary` casa com `:id`.
  controllers: [
    ListFinancialEntriesRoute,
    GetFinancialEntriesSummaryRoute,
    CreateFinancialEntryRoute,
    RestoreFinancialEntryRoute,
    FindFinancialEntryByIdRoute,
    UpdateFinancialEntryRoute,
    DeleteFinancialEntryRoute,
    UploadFinancialEntryAttachmentRoute,
    GetFinancialEntryAttachmentRoute,
    DeleteFinancialEntryAttachmentRoute,
  ],
  providers: [
    {
      provide: FinancialEntryRepository,
      useClass: PrismaFinancialEntryRepository,
    },
    {
      provide: FinancialEntryAttachmentRepository,
      useClass: PrismaFinancialEntryAttachmentRepository,
    },
    CreateFinancialEntryUseCase,
    ListFinancialEntriesUseCase,
    GetFinancialEntriesSummaryUseCase,
    FindFinancialEntryByIdUseCase,
    UpdateFinancialEntryUseCase,
    DeleteFinancialEntryUseCase,
    RestoreFinancialEntryUseCase,
    UploadFinancialEntryAttachmentUseCase,
    GetFinancialEntryAttachmentUseCase,
    DeleteFinancialEntryAttachmentUseCase,
  ],
  exports: [FinancialEntryRepository],
})
export class FinancialEntriesModule {}
