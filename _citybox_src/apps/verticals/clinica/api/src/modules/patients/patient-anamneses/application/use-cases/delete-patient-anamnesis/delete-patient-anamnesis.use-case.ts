import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientAnamnesisRepository } from '../../../domain/repositories/patient-anamnesis.repository.interface';
import { PatientAnamnesisNotFoundError } from '../../../domain/errors/patient-anamnesis-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { DeletePatientAnamnesisDto } from '../../dtos/patient-anamnesis.dto';

@Injectable()
export class DeletePatientAnamnesisUseCase implements IUseCase<
  DeletePatientAnamnesisDto,
  void
> {
  constructor(
    private readonly anamnesisRepository: PatientAnamnesisRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: DeletePatientAnamnesisDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeletePatientAnamnesisUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.anamnesisRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.anamnesisId,
    );

    if (!existing) {
      throw new PatientAnamnesisNotFoundError(
        DeletePatientAnamnesisUseCase.name,
        dto.anamnesisId,
      );
    }

    await this.anamnesisRepository.delete(
      dto.storeId,
      dto.patientId,
      dto.anamnesisId,
    );
  }
}
