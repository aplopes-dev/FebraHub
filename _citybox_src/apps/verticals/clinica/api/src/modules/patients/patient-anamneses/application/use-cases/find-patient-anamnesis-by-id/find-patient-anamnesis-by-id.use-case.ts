import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { PatientAnamnesis } from '../../../domain/entities/patient-anamnesis.entity';
import { PatientAnamnesisRepository } from '../../../domain/repositories/patient-anamnesis.repository.interface';
import { PatientAnamnesisNotFoundError } from '../../../domain/errors/patient-anamnesis-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { FindPatientAnamnesisByIdDto } from '../../dtos/patient-anamnesis.dto';

@Injectable()
export class FindPatientAnamnesisByIdUseCase implements IUseCase<
  FindPatientAnamnesisByIdDto,
  PatientAnamnesis
> {
  constructor(
    private readonly anamnesisRepository: PatientAnamnesisRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: FindPatientAnamnesisByIdDto): Promise<PatientAnamnesis> {
    await this.assertPatientExists.execute(
      FindPatientAnamnesisByIdUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const anamnesis = await this.anamnesisRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.anamnesisId,
    );

    if (!anamnesis) {
      throw new PatientAnamnesisNotFoundError(
        FindPatientAnamnesisByIdUseCase.name,
        dto.anamnesisId,
      );
    }

    return anamnesis;
  }
}
