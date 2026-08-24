import { Module, forwardRef } from '@nestjs/common';
import { PatientsModule } from '../patients.module';
import { PatientToothAnnotationRepository } from './domain/repositories/patient-tooth-annotation.repository.interface';
import { PrismaPatientToothAnnotationRepository } from './infrastructure/database/prisma-patient-tooth-annotation.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { CreatePatientToothAnnotationUseCase } from './application/use-cases/create-tooth-annotation/create-tooth-annotation.use-case';
import { ListPatientToothAnnotationsUseCase } from './application/use-cases/list-tooth-annotations/list-tooth-annotations.use-case';
import { DeletePatientToothAnnotationUseCase } from './application/use-cases/delete-tooth-annotation/delete-tooth-annotation.use-case';
import { CreatePatientToothAnnotationRoute } from './infrastructure/http/routes/create-tooth-annotation/create-tooth-annotation.route';
import { ListPatientToothAnnotationsRoute } from './infrastructure/http/routes/list-tooth-annotations/list-tooth-annotations.route';
import { DeletePatientToothAnnotationRoute } from './infrastructure/http/routes/delete-tooth-annotation/delete-tooth-annotation.route';

@Module({
  imports: [forwardRef(() => PatientsModule)],
  controllers: [
    ListPatientToothAnnotationsRoute,
    CreatePatientToothAnnotationRoute,
    DeletePatientToothAnnotationRoute,
  ],
  providers: [
    {
      provide: PatientToothAnnotationRepository,
      useClass: PrismaPatientToothAnnotationRepository,
    },
    AssertPatientExistsService,
    CreatePatientToothAnnotationUseCase,
    ListPatientToothAnnotationsUseCase,
    DeletePatientToothAnnotationUseCase,
  ],
})
export class PatientToothAnnotationsModule {}
