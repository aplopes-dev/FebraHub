import { Module, forwardRef } from '@nestjs/common';
import { AnamnesisModule } from '../../anamnesis/anamnesis.module';
import { PatientsModule } from '../patients.module';
import { PatientAnamnesisRepository } from './domain/repositories/patient-anamnesis.repository.interface';
import { PrismaPatientAnamnesisRepository } from './infrastructure/database/prisma-patient-anamnesis.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { BuildTemplateQuestionsSnapshotService } from './application/services/build-template-questions-snapshot.service';
import { ValidatePatientAnamnesisAnswersService } from './application/services/validate-patient-anamnesis-answers.service';
import { CreatePatientAnamnesisUseCase } from './application/use-cases/create-patient-anamnesis/create-patient-anamnesis.use-case';
import { ListPatientAnamnesesUseCase } from './application/use-cases/list-patient-anamneses/list-patient-anamneses.use-case';
import { FindPatientAnamnesisByIdUseCase } from './application/use-cases/find-patient-anamnesis-by-id/find-patient-anamnesis-by-id.use-case';
import { DeletePatientAnamnesisUseCase } from './application/use-cases/delete-patient-anamnesis/delete-patient-anamnesis.use-case';
import { FindPublicAnamnesisByTokenUseCase } from './application/use-cases/find-public-anamnesis-by-token/find-public-anamnesis-by-token.use-case';
import { SubmitPublicAnamnesisUseCase } from './application/use-cases/submit-public-anamnesis/submit-public-anamnesis.use-case';
import { ListPatientAnamnesesRoute } from './infrastructure/http/routes/list-patient-anamneses/list-patient-anamneses.route';
import { FindPatientAnamnesisByIdRoute } from './infrastructure/http/routes/find-patient-anamnesis-by-id/find-patient-anamnesis-by-id.route';
import { CreatePatientAnamnesisRoute } from './infrastructure/http/routes/create-patient-anamnesis/create-patient-anamnesis.route';
import { DeletePatientAnamnesisRoute } from './infrastructure/http/routes/delete-patient-anamnesis/delete-patient-anamnesis.route';
import { FindPublicAnamnesisByTokenRoute } from './infrastructure/http/routes/find-public-anamnesis-by-token/find-public-anamnesis-by-token.route';
import { SubmitPublicAnamnesisRoute } from './infrastructure/http/routes/submit-public-anamnesis/submit-public-anamnesis.route';

@Module({
  imports: [AnamnesisModule, forwardRef(() => PatientsModule)],
  controllers: [
    ListPatientAnamnesesRoute,
    FindPatientAnamnesisByIdRoute,
    CreatePatientAnamnesisRoute,
    DeletePatientAnamnesisRoute,
    FindPublicAnamnesisByTokenRoute,
    SubmitPublicAnamnesisRoute,
  ],
  providers: [
    {
      provide: PatientAnamnesisRepository,
      useClass: PrismaPatientAnamnesisRepository,
    },
    AssertPatientExistsService,
    BuildTemplateQuestionsSnapshotService,
    ValidatePatientAnamnesisAnswersService,
    CreatePatientAnamnesisUseCase,
    ListPatientAnamnesesUseCase,
    FindPatientAnamnesisByIdUseCase,
    DeletePatientAnamnesisUseCase,
    FindPublicAnamnesisByTokenUseCase,
    SubmitPublicAnamnesisUseCase,
  ],
  exports: [
    PatientAnamnesisRepository,
    BuildTemplateQuestionsSnapshotService,
    ValidatePatientAnamnesisAnswersService,
  ],
})
export class PatientAnamnesesModule {}
