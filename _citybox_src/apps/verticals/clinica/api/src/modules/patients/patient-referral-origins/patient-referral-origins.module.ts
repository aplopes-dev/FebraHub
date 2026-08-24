import { Module } from '@nestjs/common';
import { PatientReferralOriginRepository } from './domain/repositories/patient-referral-origin.repository.interface';
import { PrismaPatientReferralOriginRepository } from './infrastructure/database/prisma-patient-referral-origin.repository';
import { ListPatientReferralOriginsUseCase } from './application/use-cases/list-patient-referral-origins/list-patient-referral-origins.use-case';
import { CreatePatientReferralOriginUseCase } from './application/use-cases/create-patient-referral-origin/create-patient-referral-origin.use-case';
import { ListPatientReferralOriginsRoute } from './infrastructure/http/routes/list-patient-referral-origins/list-patient-referral-origins.route';
import { CreatePatientReferralOriginRoute } from './infrastructure/http/routes/create-patient-referral-origin/create-patient-referral-origin.route';

@Module({
  controllers: [
    ListPatientReferralOriginsRoute,
    CreatePatientReferralOriginRoute,
  ],
  providers: [
    {
      provide: PatientReferralOriginRepository,
      useClass: PrismaPatientReferralOriginRepository,
    },
    ListPatientReferralOriginsUseCase,
    CreatePatientReferralOriginUseCase,
  ],
  exports: [PatientReferralOriginRepository],
})
export class PatientReferralOriginsModule {}
