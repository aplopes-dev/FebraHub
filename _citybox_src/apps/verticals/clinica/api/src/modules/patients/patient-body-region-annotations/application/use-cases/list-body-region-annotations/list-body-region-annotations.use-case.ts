import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { PatientBodyRegionAnnotation } from '../../../domain/entities/patient-body-region-annotation.entity';
import { PatientBodyRegionAnnotationRepository } from '../../../domain/repositories/patient-body-region-annotation.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { ListPatientBodyRegionAnnotationsDto } from '../../dtos/patient-body-region-annotation.dto';

@Injectable()
export class ListPatientBodyRegionAnnotationsUseCase
  implements
    IUseCase<
      ListPatientBodyRegionAnnotationsDto,
      PatientBodyRegionAnnotation[]
    >
{
  constructor(
    private readonly annotationRepository: PatientBodyRegionAnnotationRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: ListPatientBodyRegionAnnotationsDto,
  ): Promise<PatientBodyRegionAnnotation[]> {
    await this.assertPatientExists.execute(
      ListPatientBodyRegionAnnotationsUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    return this.annotationRepository.findManyByPatientId(
      dto.storeId,
      dto.patientId,
      { bodyRegionId: dto.bodyRegionId },
    );
  }
}
