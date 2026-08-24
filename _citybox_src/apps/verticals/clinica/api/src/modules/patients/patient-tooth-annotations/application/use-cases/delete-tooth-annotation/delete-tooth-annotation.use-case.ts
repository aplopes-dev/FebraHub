import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientToothAnnotationRepository } from '../../../domain/repositories/patient-tooth-annotation.repository.interface';
import { PatientToothAnnotationNotFoundError } from '../../../domain/errors/patient-tooth-annotation-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { DeletePatientToothAnnotationDto } from '../../dtos/patient-tooth-annotation.dto';

@Injectable()
export class DeletePatientToothAnnotationUseCase
  implements IUseCase<DeletePatientToothAnnotationDto, void>
{
  constructor(
    private readonly annotationRepository: PatientToothAnnotationRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: DeletePatientToothAnnotationDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeletePatientToothAnnotationUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.annotationRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.annotationId,
    );

    if (!existing) {
      throw new PatientToothAnnotationNotFoundError(
        DeletePatientToothAnnotationUseCase.name,
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
