import { Module, forwardRef } from '@nestjs/common';
import { PatientsModule } from '../patients.module';
import { CommissionsModule } from '../../commissions/commissions.module';
import { PatientFinancialEntryRepository } from './domain/repositories/patient-financial-entry.repository.interface';
import { PrismaPatientFinancialEntryRepository } from './infrastructure/database/prisma-patient-financial-entry.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { GenerateBudgetFinancialEntriesService } from './application/services/generate-budget-financial-entries.service';
import { HydratePatientFinancialDebitDetailService } from './application/services/hydrate-patient-financial-debit-detail.service';
import { ListPatientFinancialEntriesUseCase } from './application/use-cases/list-patient-financial-entries/list-patient-financial-entries.use-case';
import { CreatePatientFinancialEntryUseCase } from './application/use-cases/create-patient-financial-entry/create-patient-financial-entry.use-case';
import { FindPatientFinancialEntryByIdUseCase } from './application/use-cases/find-patient-financial-entry-by-id/find-patient-financial-entry-by-id.use-case';
import { UpdatePatientFinancialEntryUseCase } from './application/use-cases/update-patient-financial-entry/update-patient-financial-entry.use-case';
import { DeletePatientFinancialEntryUseCase } from './application/use-cases/delete-patient-financial-entry/delete-patient-financial-entry.use-case';
import { ReceivePatientFinancialEntryUseCase } from './application/use-cases/receive-patient-financial-entry/receive-patient-financial-entry.use-case';
import { UploadPatientFinancialEntryAttachmentUseCase } from './application/use-cases/upload-patient-financial-entry-attachment/upload-patient-financial-entry-attachment.use-case';
import { DeletePatientFinancialEntryAttachmentUseCase } from './application/use-cases/delete-patient-financial-entry-attachment/delete-patient-financial-entry-attachment.use-case';
import { GetPatientFinancialEntryAttachmentUseCase } from './application/use-cases/get-patient-financial-entry-attachment/get-patient-financial-entry-attachment.use-case';
import { ListPatientFinancialEntriesRoute } from './infrastructure/http/routes/list-patient-financial-entries/list-patient-financial-entries.route';
import { CreatePatientFinancialEntryRoute } from './infrastructure/http/routes/create-patient-financial-entry/create-patient-financial-entry.route';
import { FindPatientFinancialEntryByIdRoute } from './infrastructure/http/routes/find-patient-financial-entry-by-id/find-patient-financial-entry-by-id.route';
import { UpdatePatientFinancialEntryRoute } from './infrastructure/http/routes/update-patient-financial-entry/update-patient-financial-entry.route';
import { DeletePatientFinancialEntryRoute } from './infrastructure/http/routes/delete-patient-financial-entry/delete-patient-financial-entry.route';
import { ReceivePatientFinancialEntryRoute } from './infrastructure/http/routes/receive-patient-financial-entry/receive-patient-financial-entry.route';
import { PatientFinancialEntryAttachmentRoute } from './infrastructure/http/routes/patient-financial-entry-attachment/patient-financial-entry-attachment.route';

@Module({
  imports: [
    forwardRef(() => PatientsModule),
    forwardRef(() => CommissionsModule),
  ],
  controllers: [
    ListPatientFinancialEntriesRoute,
    CreatePatientFinancialEntryRoute,
    PatientFinancialEntryAttachmentRoute,
    FindPatientFinancialEntryByIdRoute,
    UpdatePatientFinancialEntryRoute,
    DeletePatientFinancialEntryRoute,
    ReceivePatientFinancialEntryRoute,
  ],
  providers: [
    {
      provide: PatientFinancialEntryRepository,
      useClass: PrismaPatientFinancialEntryRepository,
    },
    AssertPatientExistsService,
    GenerateBudgetFinancialEntriesService,
    HydratePatientFinancialDebitDetailService,
    ListPatientFinancialEntriesUseCase,
    CreatePatientFinancialEntryUseCase,
    FindPatientFinancialEntryByIdUseCase,
    UpdatePatientFinancialEntryUseCase,
    DeletePatientFinancialEntryUseCase,
    ReceivePatientFinancialEntryUseCase,
    UploadPatientFinancialEntryAttachmentUseCase,
    DeletePatientFinancialEntryAttachmentUseCase,
    GetPatientFinancialEntryAttachmentUseCase,
  ],
  exports: [GenerateBudgetFinancialEntriesService],
})
export class PatientFinancialEntriesModule {}
