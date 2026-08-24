import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientBodyRegionAnnotationRepository } from '../../../domain/repositories/patient-body-region-annotation.repository.interface';
import { PatientBodyRegionAnnotationNotFoundError } from '../../../domain/errors/patient-body-region-annotation-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { DeletePatientBodyRegionAnnotationDto } from '../../dtos/patient-body-region-annotation.dto';

@Injectable()
export class DeletePatientBodyRegionAnnotationUseCase
  implements IUseCase<DeletePatientBodyRegionAnnotationDto, void>
{
  constructor(
    private readonly annotationRepository: PatientBodyRegionAnnotationRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: DeletePatientBodyRegionAnnotationDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeletePatientBodyRegionAnnotationUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.annotationRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.annotationId,
    );

    if (!existing) {
      throw new PatientBodyRegionAnnotationNotFoundError(
        DeletePatientBodyRegionAnnotationUseCase.name,
        dto.annotationId,
      );
    }

    await this.annotationRepository.delete(
      dto.storeId,
      dto.patientId,
      dto.annotationId,
    );
  }
}
