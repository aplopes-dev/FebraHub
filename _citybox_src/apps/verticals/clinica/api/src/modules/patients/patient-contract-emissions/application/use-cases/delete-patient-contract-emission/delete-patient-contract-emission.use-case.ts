import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientContractEmissionRepository } from '../../../domain/repositories/patient-contract-emission.repository.interface';
import { PatientContractEmissionNotFoundError } from '../../../domain/errors/patient-contract-emission-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { DeletePatientContractEmissionDto } from '../../dtos/patient-contract-emission.dto';

@Injectable()
export class DeletePatientContractEmissionUseCase implements IUseCase<
  DeletePatientContractEmissionDto,
  void
> {
  constructor(
    private readonly emissionRepository: PatientContractEmissionRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: DeletePatientContractEmissionDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeletePatientContractEmissionUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.emissionRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.contractId,
    );

    if (!existing) {
      throw new PatientContractEmissionNotFoundError(
        DeletePatientContractEmissionUseCase.name,
        dto.contractId,
      );
    }

    await this.emissionRepository.delete(
      dto.storeId,
      dto.patientId,
      dto.contractId,
    );
  }
}
