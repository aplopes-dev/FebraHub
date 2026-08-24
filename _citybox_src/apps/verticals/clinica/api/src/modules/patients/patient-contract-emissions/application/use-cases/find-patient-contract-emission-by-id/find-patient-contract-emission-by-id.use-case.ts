import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientContractEmission } from '../../../domain/entities/patient-contract-emission.entity';
import { PatientContractEmissionRepository } from '../../../domain/repositories/patient-contract-emission.repository.interface';
import { PatientContractEmissionNotFoundError } from '../../../domain/errors/patient-contract-emission-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { FindPatientContractEmissionByIdDto } from '../../dtos/patient-contract-emission.dto';

@Injectable()
export class FindPatientContractEmissionByIdUseCase implements IUseCase<
  FindPatientContractEmissionByIdDto,
  PatientContractEmission
> {
  constructor(
    private readonly emissionRepository: PatientContractEmissionRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: FindPatientContractEmissionByIdDto,
  ): Promise<PatientContractEmission> {
    await this.assertPatientExists.execute(
      FindPatientContractEmissionByIdUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const emission = await this.emissionRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.contractId,
    );

    if (!emission) {
      throw new PatientContractEmissionNotFoundError(
        FindPatientContractEmissionByIdUseCase.name,
        dto.contractId,
      );
    }

    return emission;
  }
}
