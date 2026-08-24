import { Module, forwardRef } from '@nestjs/common';
import { PatientsModule } from '../patients.module';
import { PatientBodyRegionAnnotationRepository } from './domain/repositories/patient-body-region-annotation.repository.interface';
import { PrismaPatientBodyRegionAnnotationRepository } from './infrastructure/database/prisma-patient-body-region-annotation.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { CreatePatientBodyRegionAnnotationUseCase } from './application/use-cases/create-body-region-annotation/create-body-region-annotation.use-case';
import { ListPatientBodyRegionAnnotationsUseCase } from './application/use-cases/list-body-region-annotations/list-body-region-annotations.use-case';
import { DeletePatientBodyRegionAnnotationUseCase } from './application/use-cases/delete-body-region-annotation/delete-body-region-annotation.use-case';
import { CreatePatientBodyRegionAnnotationRoute } from './infrastructure/http/routes/create-body-region-annotation/create-body-region-annotation.route';
import { ListPatientBodyRegionAnnotationsRoute } from './infrastructure/http/routes/list-body-region-annotations/list-body-region-annotations.route';
import { DeletePatientBodyRegionAnnotationRoute } from './infrastructure/http/routes/delete-body-region-annotation/delete-body-region-annotation.route';

@Module({
  imports: [forwardRef(() => PatientsModule)],
  controllers: [
    ListPatientBodyRegionAnnotationsRoute,
    CreatePatientBodyRegionAnnotationRoute,
    DeletePatientBodyRegionAnnotationRoute,
  ],
  providers: [
    {
      provide: PatientBodyRegionAnnotationRepository,
      useClass: PrismaPatientBodyRegionAnnotationRepository,
    },
    AssertPatientExistsService,
    CreatePatientBodyRegionAnnotationUseCase,
    ListPatientBodyRegionAnnotationsUseCase,
    DeletePatientBodyRegionAnnotationUseCase,
  ],
})
export class PatientBodyRegionAnnotationsModule {}
