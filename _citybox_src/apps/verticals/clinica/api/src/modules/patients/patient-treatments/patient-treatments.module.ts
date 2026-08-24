import { Module, forwardRef } from '@nestjs/common';
import { ClinicPlansModule } from '../../clinic-plans/clinic-plans.module';
import { CommissionsModule } from '../../commissions/commissions.module';
import { PatientAnamnesesModule } from '../patient-anamneses/patient-anamneses.module';
import { PatientRepository } from '../domain/repositories/patient.repository.interface';
import { PrismaPatientRepository } from '../infrastructure/database/prisma-patient.repository';
import { PatientTreatmentRepository } from './domain/repositories/patient-treatment.repository.interface';
import { PrismaPatientTreatmentRepository } from './infrastructure/database/prisma-patient-treatment.repository';
import { ListPatientTreatmentsUseCase } from './application/use-cases/list-treatments/list-treatments.use-case';
import { CreatePatientTreatmentUseCase } from './application/use-cases/create-treatment/create-treatment.use-case';
import { UpdatePatientTreatmentUseCase } from './application/use-cases/update-treatment/update-treatment.use-case';
import { DeletePatientTreatmentUseCase } from './application/use-cases/delete-treatment/delete-treatment.use-case';
import { ReorderPatientTreatmentsUseCase } from './application/use-cases/reorder-treatments/reorder-treatments.use-case';
import { FinalizePatientTreatmentUseCase } from './application/use-cases/finalize-treatment/finalize-treatment.use-case';
import { InitializePatientNutritionUseCase } from './application/use-cases/initialize-nutrition/initialize-patient-nutrition.use-case';
import { GetPatientNutritionInitiationUseCase } from './application/use-cases/initialize-nutrition/get-patient-nutrition-initiation.use-case';
import { ListPatientNutritionInitiationsUseCase } from './application/use-cases/initialize-nutrition/list-patient-nutrition-initiations.use-case';
import { ListPatientNutritionNotesUseCase } from './application/use-cases/nutrition-notes/list-patient-nutrition-notes.use-case';
import { SavePatientNutritionNoteUseCase } from './application/use-cases/nutrition-notes/save-patient-nutrition-note.use-case';
import { GetPatientNutritionNoteAttachmentUseCase } from './application/use-cases/nutrition-notes/get-patient-nutrition-note-attachment.use-case';
import { ListPatientTreatmentsRoute } from './infrastructure/http/routes/list-treatments/list-treatments.route';
import { CreatePatientTreatmentRoute } from './infrastructure/http/routes/create-treatment/create-treatment.route';
import { UpdatePatientTreatmentRoute } from './infrastructure/http/routes/update-treatment/update-treatment.route';
import { DeletePatientTreatmentRoute } from './infrastructure/http/routes/delete-treatment/delete-treatment.route';
import { ReorderPatientTreatmentsRoute } from './infrastructure/http/routes/reorder-treatments/reorder-treatments.route';
import { FinalizePatientTreatmentRoute } from './infrastructure/http/routes/finalize-treatment/finalize-treatment.route';
import { InitializePatientNutritionRoute } from './infrastructure/http/routes/initialize-nutrition/initialize-patient-nutrition.route';
import { GetPatientNutritionInitiationRoute } from './infrastructure/http/routes/initialize-nutrition/get-patient-nutrition-initiation.route';
import { ListPatientNutritionInitiationsRoute } from './infrastructure/http/routes/initialize-nutrition/list-patient-nutrition-initiations.route';
import { PatientNutritionNoteRoute } from './infrastructure/http/routes/nutrition-notes/patient-nutrition-note.route';
import { PatientNutritionNoteAttachmentRoute } from './infrastructure/http/routes/nutrition-notes/patient-nutrition-note-attachment.route';
import { PatientTreatmentFinalizationStore } from './application/ports/patient-treatment-finalization.store';
import { PrismaPatientTreatmentFinalizationStore } from './infrastructure/database/prisma-patient-treatment-finalization.store';
import { PatientNutritionInitiationStore } from './application/ports/patient-nutrition-initiation.store';
import { PrismaPatientNutritionInitiationStore } from './infrastructure/database/prisma-patient-nutrition-initiation.store';
import { PatientNutritionNoteStore } from './application/ports/patient-nutrition-note.store';
import { PrismaPatientNutritionNoteStore } from './infrastructure/database/prisma-patient-nutrition-note.store';

@Module({
  imports: [
    ClinicPlansModule,
    forwardRef(() => CommissionsModule),
    PatientAnamnesesModule,
  ],
  controllers: [
    ListPatientTreatmentsRoute,
    CreatePatientTreatmentRoute,
    ReorderPatientTreatmentsRoute,
    FinalizePatientTreatmentRoute,
    InitializePatientNutritionRoute,
    ListPatientNutritionInitiationsRoute,
    GetPatientNutritionInitiationRoute,
    PatientNutritionNoteRoute,
    PatientNutritionNoteAttachmentRoute,
    UpdatePatientTreatmentRoute,
    DeletePatientTreatmentRoute,
  ],
  providers: [
    {
      provide: PatientTreatmentRepository,
      useClass: PrismaPatientTreatmentRepository,
    },
    { provide: PatientRepository, useClass: PrismaPatientRepository },
    {
      provide: PatientTreatmentFinalizationStore,
      useClass: PrismaPatientTreatmentFinalizationStore,
    },
    {
      provide: PatientNutritionInitiationStore,
      useClass: PrismaPatientNutritionInitiationStore,
    },
    {
      provide: PatientNutritionNoteStore,
      useClass: PrismaPatientNutritionNoteStore,
    },
    ListPatientTreatmentsUseCase,
    CreatePatientTreatmentUseCase,
    UpdatePatientTreatmentUseCase,
    DeletePatientTreatmentUseCase,
    ReorderPatientTreatmentsUseCase,
    FinalizePatientTreatmentUseCase,
    InitializePatientNutritionUseCase,
    GetPatientNutritionInitiationUseCase,
    ListPatientNutritionInitiationsUseCase,
    ListPatientNutritionNotesUseCase,
    SavePatientNutritionNoteUseCase,
    GetPatientNutritionNoteAttachmentUseCase,
  ],
  exports: [PatientTreatmentRepository],
})
export class PatientTreatmentsModule {}
