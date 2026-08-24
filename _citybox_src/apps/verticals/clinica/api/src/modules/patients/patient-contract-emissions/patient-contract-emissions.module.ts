import { Module, forwardRef } from '@nestjs/common';
import { ContractModelsModule } from '../../contract-models/contract-models.module';
import { PatientsModule } from '../patients.module';
import { PatientBudgetsModule } from '../patient-budgets/patient-budgets.module';
import { PatientContractEmissionRepository } from './domain/repositories/patient-contract-emission.repository.interface';
import { PrismaPatientContractEmissionRepository } from './infrastructure/database/prisma-patient-contract-emission.repository';
import { AssertPatientExistsService } from './application/services/assert-patient-exists.service';
import { CreatePatientContractEmissionUseCase } from './application/use-cases/create-patient-contract-emission/create-patient-contract-emission.use-case';
import { UpdatePatientContractEmissionUseCase } from './application/use-cases/update-patient-contract-emission/update-patient-contract-emission.use-case';
import { ListPatientContractEmissionsUseCase } from './application/use-cases/list-patient-contract-emissions/list-patient-contract-emissions.use-case';
import { FindPatientContractEmissionByIdUseCase } from './application/use-cases/find-patient-contract-emission-by-id/find-patient-contract-emission-by-id.use-case';
import { DeletePatientContractEmissionUseCase } from './application/use-cases/delete-patient-contract-emission/delete-patient-contract-emission.use-case';
import { ListPatientContractEmissionsRoute } from './infrastructure/http/routes/list-patient-contract-emissions/list-patient-contract-emissions.route';
import { CreatePatientContractEmissionRoute } from './infrastructure/http/routes/create-patient-contract-emission/create-patient-contract-emission.route';
import { UpdatePatientContractEmissionRoute } from './infrastructure/http/routes/update-patient-contract-emission/update-patient-contract-emission.route';
import { FindPatientContractEmissionByIdRoute } from './infrastructure/http/routes/find-patient-contract-emission-by-id/find-patient-contract-emission-by-id.route';
import { DeletePatientContractEmissionRoute } from './infrastructure/http/routes/delete-patient-contract-emission/delete-patient-contract-emission.route';

@Module({
  imports: [
    ContractModelsModule,
    forwardRef(() => PatientsModule),
    forwardRef(() => PatientBudgetsModule),
  ],
  controllers: [
    ListPatientContractEmissionsRoute,
    CreatePatientContractEmissionRoute,
    UpdatePatientContractEmissionRoute,
    FindPatientContractEmissionByIdRoute,
    DeletePatientContractEmissionRoute,
  ],
  providers: [
    {
      provide: PatientContractEmissionRepository,
      useClass: PrismaPatientContractEmissionRepository,
    },
    AssertPatientExistsService,
    CreatePatientContractEmissionUseCase,
    UpdatePatientContractEmissionUseCase,
    ListPatientContractEmissionsUseCase,
    FindPatientContractEmissionByIdUseCase,
    DeletePatientContractEmissionUseCase,
  ],
  exports: [PatientContractEmissionRepository],
})
export class PatientContractEmissionsModule {}
