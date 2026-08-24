import { Module, forwardRef } from '@nestjs/common';
import { MembersModule } from '../../members/members.module';
import { PatientsModule } from '../patients.module';
import { PatientPrescriptionRepository } from './domain/repositories/patient-prescription.repository.interface';
import { PrismaPatientPrescriptionRepository } from './infrastructure/database/prisma-patient-prescription.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { ValidatePatientPrescriptionService } from './application/services/validate-patient-prescription.service';
import { CreatePatientPrescriptionUseCase } from './application/use-cases/create-patient-prescription/create-patient-prescription.use-case';
import { UpdatePatientPrescriptionUseCase } from './application/use-cases/update-patient-prescription/update-patient-prescription.use-case';
import { ListPatientPrescriptionsUseCase } from './application/use-cases/list-patient-prescriptions/list-patient-prescriptions.use-case';
import { FindPatientPrescriptionByIdUseCase } from './application/use-cases/find-patient-prescription-by-id/find-patient-prescription-by-id.use-case';
import { DeletePatientPrescriptionUseCase } from './application/use-cases/delete-patient-prescription/delete-patient-prescription.use-case';
import { ListPatientPrescriptionsRoute } from './infrastructure/http/routes/list-patient-prescriptions/list-patient-prescriptions.route';
import { CreatePatientPrescriptionRoute } from './infrastructure/http/routes/create-patient-prescription/create-patient-prescription.route';
import { UpdatePatientPrescriptionRoute } from './infrastructure/http/routes/update-patient-prescription/update-patient-prescription.route';
import { FindPatientPrescriptionByIdRoute } from './infrastructure/http/routes/find-patient-prescription-by-id/find-patient-prescription-by-id.route';
import { DeletePatientPrescriptionRoute } from './infrastructure/http/routes/delete-patient-prescription/delete-patient-prescription.route';

@Module({
  imports: [forwardRef(() => PatientsModule), MembersModule],
  controllers: [
    ListPatientPrescriptionsRoute,
    CreatePatientPrescriptionRoute,
    UpdatePatientPrescriptionRoute,
    FindPatientPrescriptionByIdRoute,
    DeletePatientPrescriptionRoute,
  ],
  providers: [
    {
      provide: PatientPrescriptionRepository,
      useClass: PrismaPatientPrescriptionRepository,
    },
    AssertPatientExistsService,
    ValidatePatientPrescriptionService,
    CreatePatientPrescriptionUseCase,
    UpdatePatientPrescriptionUseCase,
    ListPatientPrescriptionsUseCase,
    FindPatientPrescriptionByIdUseCase,
    DeletePatientPrescriptionUseCase,
  ],
})
export class PatientPrescriptionsModule {}
