import { Module } from '@nestjs/common';

import { FinancialAccountRepository } from './accounts/domain/repositories/financial-account.repository.interface';
import { PrismaFinancialAccountRepository } from './accounts/infrastructure/database/prisma-financial-account.repository';
import { ListFinancialAccountsUseCase } from './accounts/application/use-cases/list-financial-account/list-financial-accounts.use-case';
import { CreateFinancialAccountUseCase } from './accounts/application/use-cases/create-financial-account/create-financial-account.use-case';
import { UpdateFinancialAccountUseCase } from './accounts/application/use-cases/update-financial-account/update-financial-account.use-case';
import { DeleteFinancialAccountUseCase } from './accounts/application/use-cases/delete-financial-account/delete-financial-account.use-case';
import { ListFinancialAccountsRoute } from './accounts/infrastructure/http/routes/list-financial-accounts/list-financial-accounts.route';
import { CreateFinancialAccountRoute } from './accounts/infrastructure/http/routes/create-financial-account/create-financial-account.route';
import { UpdateFinancialAccountRoute } from './accounts/infrastructure/http/routes/update-financial-account/update-financial-account.route';
import { DeleteFinancialAccountRoute } from './accounts/infrastructure/http/routes/delete-financial-account/delete-financial-account.route';

import { FinancialCategoryRepository } from './categories/domain/repositories/financial-category.repository.interface';
import { PrismaFinancialCategoryRepository } from './categories/infrastructure/database/prisma-financial-category.repository';
import { ListFinancialCategoriesUseCase } from './categories/application/use-cases/list-financial-category/list-financial-categories.use-case';
import { CreateFinancialCategoryUseCase } from './categories/application/use-cases/create-financial-category/create-financial-category.use-case';
import { UpdateFinancialCategoryUseCase } from './categories/application/use-cases/update-financial-category/update-financial-category.use-case';
import { DeleteFinancialCategoryUseCase } from './categories/application/use-cases/delete-financial-category/delete-financial-category.use-case';
import { ListFinancialCategoriesRoute } from './categories/infrastructure/http/routes/list-financial-categories/list-financial-categories.route';
import { CreateFinancialCategoryRoute } from './categories/infrastructure/http/routes/create-financial-category/create-financial-category.route';
import { UpdateFinancialCategoryRoute } from './categories/infrastructure/http/routes/update-financial-category/update-financial-category.route';
import { DeleteFinancialCategoryRoute } from './categories/infrastructure/http/routes/delete-financial-category/delete-financial-category.route';

import { FinancialEntryRepository } from './entries/domain/repositories/financial-entry.repository.interface';
import { PrismaFinancialEntryRepository } from './entries/infrastructure/database/prisma-financial-entry.repository';
import { ListFinancialEntriesUseCase } from './entries/application/use-cases/list-financial-entries/list-financial-entries.use-case';
import { StatsFinancialEntriesUseCase } from './entries/application/use-cases/stats-financial-entries/stats-financial-entries.use-case';
import { EntriesByPaymentMethodUseCase } from './entries/application/use-cases/entries-by-payment-method/entries-by-payment-method.use-case';
import { CreateFinancialEntryUseCase } from './entries/application/use-cases/create-financial-entry/create-financial-entry.use-case';
import { FindFinancialEntryByIdUseCase } from './entries/application/use-cases/find-financial-entry-by-id/find-financial-entry-by-id.use-case';
import { UpdateFinancialEntryUseCase } from './entries/application/use-cases/update-financial-entry/update-financial-entry.use-case';
import { DeleteFinancialEntryUseCase } from './entries/application/use-cases/delete-financial-entry/delete-financial-entry.use-case';
import { ReceiveFinancialEntryUseCase } from './entries/application/use-cases/receive-financial-entry/receive-financial-entry.use-case';
import { PayFinancialEntryUseCase } from './entries/application/use-cases/pay-financial-entry/pay-financial-entry.use-case';
import { CancelFinancialEntryUseCase } from './entries/application/use-cases/cancel-financial-entry/cancel-financial-entry.use-case';
import { UpdateFinancialEntryRecurrenceUseCase } from './entries/application/use-cases/update-financial-entry-recurrence/update-financial-entry-recurrence.use-case';
import { GenerateFinancialEntryOnAppointmentCompleteService } from './entries/application/services/generate-financial-entry-on-appointment-complete.service';
import { StatsFinancialEntriesRoute } from './entries/infrastructure/http/routes/stats-financial-entries/stats-financial-entries.route';
import { EntriesByPaymentMethodRoute } from './entries/infrastructure/http/routes/entries-by-payment-method/entries-by-payment-method.route';
import { UpdateFinancialEntryRecurrenceRoute } from './entries/infrastructure/http/routes/update-financial-entry-recurrence/update-financial-entry-recurrence.route';
import { ListFinancialEntriesRoute } from './entries/infrastructure/http/routes/list-financial-entries/list-financial-entries.route';
import { CreateFinancialEntryRoute } from './entries/infrastructure/http/routes/create-financial-entry/create-financial-entry.route';
import { FindFinancialEntryByIdRoute } from './entries/infrastructure/http/routes/find-financial-entry-by-id/find-financial-entry-by-id.route';
import { UpdateFinancialEntryRoute } from './entries/infrastructure/http/routes/update-financial-entry/update-financial-entry.route';
import { DeleteFinancialEntryRoute } from './entries/infrastructure/http/routes/delete-financial-entry/delete-financial-entry.route';
import { ReceiveFinancialEntryRoute } from './entries/infrastructure/http/routes/receive-financial-entry/receive-financial-entry.route';
import { PayFinancialEntryRoute } from './entries/infrastructure/http/routes/pay-financial-entry/pay-financial-entry.route';
import { CancelFinancialEntryRoute } from './entries/infrastructure/http/routes/cancel-financial-entry/cancel-financial-entry.route';

@Module({
  controllers: [
    // Accounts
    ListFinancialAccountsRoute,
    CreateFinancialAccountRoute,
    UpdateFinancialAccountRoute,
    DeleteFinancialAccountRoute,
    // Categories
    ListFinancialCategoriesRoute,
    CreateFinancialCategoryRoute,
    UpdateFinancialCategoryRoute,
    DeleteFinancialCategoryRoute,
    // Entries — specific paths before :id
    StatsFinancialEntriesRoute,
    EntriesByPaymentMethodRoute,
    UpdateFinancialEntryRecurrenceRoute,
    ListFinancialEntriesRoute,
    CreateFinancialEntryRoute,
    FindFinancialEntryByIdRoute,
    UpdateFinancialEntryRoute,
    DeleteFinancialEntryRoute,
    ReceiveFinancialEntryRoute,
    PayFinancialEntryRoute,
    CancelFinancialEntryRoute,
  ],
  providers: [
    {
      provide: FinancialAccountRepository,
      useClass: PrismaFinancialAccountRepository,
    },
    {
      provide: FinancialCategoryRepository,
      useClass: PrismaFinancialCategoryRepository,
    },
    {
      provide: FinancialEntryRepository,
      useClass: PrismaFinancialEntryRepository,
    },
    ListFinancialAccountsUseCase,
    CreateFinancialAccountUseCase,
    UpdateFinancialAccountUseCase,
    DeleteFinancialAccountUseCase,
    ListFinancialCategoriesUseCase,
    CreateFinancialCategoryUseCase,
    UpdateFinancialCategoryUseCase,
    DeleteFinancialCategoryUseCase,
    ListFinancialEntriesUseCase,
    StatsFinancialEntriesUseCase,
    EntriesByPaymentMethodUseCase,
    CreateFinancialEntryUseCase,
    FindFinancialEntryByIdUseCase,
    UpdateFinancialEntryUseCase,
    DeleteFinancialEntryUseCase,
    ReceiveFinancialEntryUseCase,
    PayFinancialEntryUseCase,
    CancelFinancialEntryUseCase,
    UpdateFinancialEntryRecurrenceUseCase,
    GenerateFinancialEntryOnAppointmentCompleteService,
  ],
  exports: [
    FinancialEntryRepository,
    FinancialAccountRepository,
    FinancialCategoryRepository,
    GenerateFinancialEntryOnAppointmentCompleteService,
  ],
})
export class FinancialModule {}
