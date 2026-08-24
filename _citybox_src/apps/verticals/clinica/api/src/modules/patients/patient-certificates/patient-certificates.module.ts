import { Module, forwardRef } from '@nestjs/common';
import { MembersModule } from '../../members/members.module';
import { PatientsModule } from '../patients.module';
import { PatientCertificateRepository } from './domain/repositories/patient-certificate.repository.interface';
import { PrismaPatientCertificateRepository } from './infrastructure/database/prisma-patient-certificate.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { CreatePatientCertificateUseCase } from './application/use-cases/create-patient-certificate/create-patient-certificate.use-case';
import { ListPatientCertificatesUseCase } from './application/use-cases/list-patient-certificates/list-patient-certificates.use-case';
import { FindPatientCertificateByIdUseCase } from './application/use-cases/find-patient-certificate-by-id/find-patient-certificate-by-id.use-case';
import { DeletePatientCertificateUseCase } from './application/use-cases/delete-patient-certificate/delete-patient-certificate.use-case';
import { ListPatientCertificatesRoute } from './infrastructure/http/routes/list-patient-certificates/list-patient-certificates.route';
import { FindPatientCertificateByIdRoute } from './infrastructure/http/routes/find-patient-certificate-by-id/find-patient-certificate-by-id.route';
import { CreatePatientCertificateRoute } from './infrastructure/http/routes/create-patient-certificate/create-patient-certificate.route';
import { DeletePatientCertificateRoute } from './infrastructure/http/routes/delete-patient-certificate/delete-patient-certificate.route';

@Module({
  imports: [forwardRef(() => PatientsModule), MembersModule],
  controllers: [
    ListPatientCertificatesRoute,
    FindPatientCertificateByIdRoute,
    CreatePatientCertificateRoute,
    DeletePatientCertificateRoute,
  ],
  providers: [
    {
      provide: PatientCertificateRepository,
      useClass: PrismaPatientCertificateRepository,
    },
    AssertPatientExistsService,
    CreatePatientCertificateUseCase,
    ListPatientCertificatesUseCase,
    FindPatientCertificateByIdUseCase,
    DeletePatientCertificateUseCase,
  ],
})
export class PatientCertificatesModule {}
