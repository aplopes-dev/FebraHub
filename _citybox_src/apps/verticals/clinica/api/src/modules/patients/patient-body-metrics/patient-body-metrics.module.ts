import { Module, forwardRef } from '@nestjs/common';
import { PatientsModule } from '../patients.module';
import { PatientBodyMetricRepository } from './domain/repositories/patient-body-metric.repository.interface';
import { PrismaPatientBodyMetricRepository } from './infrastructure/database/prisma-patient-body-metric.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { CreatePatientBodyMetricUseCase } from './application/use-cases/create-body-metric/create-body-metric.use-case';
import { ListPatientBodyMetricsUseCase } from './application/use-cases/list-body-metrics/list-body-metrics.use-case';
import { CreatePatientBodyMetricRoute } from './infrastructure/http/routes/create-body-metric/create-body-metric.route';
import { ListPatientBodyMetricsRoute } from './infrastructure/http/routes/list-body-metrics/list-body-metrics.route';

@Module({
  imports: [forwardRef(() => PatientsModule)],
  controllers: [ListPatientBodyMetricsRoute, CreatePatientBodyMetricRoute],
  providers: [
    {
      provide: PatientBodyMetricRepository,
      useClass: PrismaPatientBodyMetricRepository,
    },
    AssertPatientExistsService,
    CreatePatientBodyMetricUseCase,
    ListPatientBodyMetricsUseCase,
  ],
})
export class PatientBodyMetricsModule {}
