import { Module } from '@nestjs/common';
import { ExternalReferralProfessionalRepository } from './domain/repositories/external-referral-professional.repository.interface';
import { PrismaExternalReferralProfessionalRepository } from './infrastructure/database/prisma-external-referral-professional.repository';
import { ListPatientExternalProfessionalsUseCase } from './application/use-cases/list-patient-external-professionals/list-patient-external-professionals.use-case';
import { CreatePatientExternalProfessionalUseCase } from './application/use-cases/create-patient-external-professional/create-patient-external-professional.use-case';
import { UpdatePatientExternalProfessionalUseCase } from './application/use-cases/update-patient-external-professional/update-patient-external-professional.use-case';
import { DeletePatientExternalProfessionalUseCase } from './application/use-cases/delete-patient-external-professional/delete-patient-external-professional.use-case';
import { ListPatientExternalProfessionalsRoute } from './infrastructure/http/routes/list-patient-external-professionals/list-patient-external-professionals.route';
import { CreatePatientExternalProfessionalRoute } from './infrastructure/http/routes/create-patient-external-professional/create-patient-external-professional.route';
import { UpdatePatientExternalProfessionalRoute } from './infrastructure/http/routes/update-patient-external-professional/update-patient-external-professional.route';
import { DeletePatientExternalProfessionalRoute } from './infrastructure/http/routes/delete-patient-external-professional/delete-patient-external-professional.route';

@Module({
  controllers: [
    ListPatientExternalProfessionalsRoute,
    CreatePatientExternalProfessionalRoute,
    UpdatePatientExternalProfessionalRoute,
    DeletePatientExternalProfessionalRoute,
  ],
  providers: [
    {
      provide: ExternalReferralProfessionalRepository,
      useClass: PrismaExternalReferralProfessionalRepository,
    },
    ListPatientExternalProfessionalsUseCase,
    CreatePatientExternalProfessionalUseCase,
    UpdatePatientExternalProfessionalUseCase,
    DeletePatientExternalProfessionalUseCase,
  ],
  exports: [ExternalReferralProfessionalRepository],
})
export class PatientExternalProfessionalsModule {}
