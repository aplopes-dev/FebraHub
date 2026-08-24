import { Module, forwardRef } from '@nestjs/common';
import { PatientCategoriesModule } from './patient-categories/patient-categories.module';
import { PatientReferralOriginsModule } from './patient-referral-origins/patient-referral-origins.module';
import { PatientExternalProfessionalsModule } from './patient-external-professionals/patient-external-professionals.module';
import { PatientBudgetsModule } from './patient-budgets/patient-budgets.module';
import { PatientAnamnesesModule } from './patient-anamneses/patient-anamneses.module';
import { PatientFilesModule } from './patient-files/patient-files.module';
import { PatientFinancialEntriesModule } from './patient-financial-entries/patient-financial-entries.module';
import { PatientContractEmissionsModule } from './patient-contract-emissions/patient-contract-emissions.module';
import { PatientPrescriptionsModule } from './patient-prescriptions/patient-prescriptions.module';
import { PatientCertificatesModule } from './patient-certificates/patient-certificates.module';
import { PatientToothAnnotationsModule } from './patient-tooth-annotations/patient-tooth-annotations.module';
import { PatientBodyRegionAnnotationsModule } from './patient-body-region-annotations/patient-body-region-annotations.module';
import { PatientBodyMetricsModule } from './patient-body-metrics/patient-body-metrics.module';
import { PatientTreatmentsModule } from './patient-treatments/patient-treatments.module';
import { TreatmentEvolutionsModule } from './treatment-evolutions/treatment-evolutions.module';
import { ClinicPlansModule } from '../clinic-plans/clinic-plans.module';
import { PatientRepository } from './domain/repositories/patient.repository.interface';
import { PrismaPatientRepository } from './infrastructure/database/prisma-patient.repository';
import { ValidatePatientReferencesService } from './application/services/validate-patient-references.service';
import { CreatePatientUseCase } from './application/use-cases/create-patient/create-patient.use-case';
import { UpdatePatientUseCase } from './application/use-cases/update-patient/update-patient.use-case';
import { FindPatientByIdUseCase } from './application/use-cases/find-patient-by-id/find-patient-by-id.use-case';
import { ListPatientsUseCase } from './application/use-cases/list-patients/list-patients.use-case';
import { UpdatePatientStatusUseCase } from './application/use-cases/update-patient-status/update-patient-status.use-case';
import { UploadPatientPhotoUseCase } from './application/use-cases/upload-patient-photo/upload-patient-photo.use-case';
import { GetPatientPhotoUseCase } from './application/use-cases/get-patient-photo/get-patient-photo.use-case';
import { DeletePatientPhotoUseCase } from './application/use-cases/delete-patient-photo/delete-patient-photo.use-case';
import { ListPatientsRoute } from './infrastructure/http/routes/list-patients/list-patients.route';
import { CreatePatientRoute } from './infrastructure/http/routes/create-patient/create-patient.route';
import { GetPatientByIdRoute } from './infrastructure/http/routes/get-patient-by-id/get-patient-by-id.route';
import { UpdatePatientRoute } from './infrastructure/http/routes/update-patient/update-patient.route';
import { UpdatePatientStatusRoute } from './infrastructure/http/routes/update-patient-status/update-patient-status.route';
import { PatientPhotoRoute } from './infrastructure/http/routes/patient-photo/patient-photo.route';

@Module({
  imports: [
    PatientCategoriesModule,
    PatientReferralOriginsModule,
    PatientExternalProfessionalsModule,
    forwardRef(() => PatientBudgetsModule),
    PatientAnamnesesModule,
    PatientFilesModule,
    PatientFinancialEntriesModule,
    PatientContractEmissionsModule,
    PatientPrescriptionsModule,
    PatientCertificatesModule,
    PatientToothAnnotationsModule,
    PatientBodyRegionAnnotationsModule,
    PatientBodyMetricsModule,
    PatientTreatmentsModule,
    TreatmentEvolutionsModule,
    ClinicPlansModule,
  ],
  controllers: [
    ListPatientsRoute,
    CreatePatientRoute,
    GetPatientByIdRoute,
    UpdatePatientRoute,
    UpdatePatientStatusRoute,
    PatientPhotoRoute,
  ],
  providers: [
    { provide: PatientRepository, useClass: PrismaPatientRepository },
    ValidatePatientReferencesService,
    CreatePatientUseCase,
    UpdatePatientUseCase,
    FindPatientByIdUseCase,
    ListPatientsUseCase,
    UpdatePatientStatusUseCase,
    UploadPatientPhotoUseCase,
    GetPatientPhotoUseCase,
    DeletePatientPhotoUseCase,
  ],
  exports: [PatientRepository],
})
export class PatientsModule {}
