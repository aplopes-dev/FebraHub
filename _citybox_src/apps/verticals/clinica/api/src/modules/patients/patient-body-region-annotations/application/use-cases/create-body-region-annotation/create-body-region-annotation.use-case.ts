import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientBodyRegionAnnotation } from '../../../domain/entities/patient-body-region-annotation.entity';
import { PatientBodyRegionAnnotationRepository } from '../../../domain/repositories/patient-body-region-annotation.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { CreatePatientBodyRegionAnnotationDto } from '../../dtos/patient-body-region-annotation.dto';

@Injectable()
export class CreatePatientBodyRegionAnnotationUseCase
  implements
    IUseCase<CreatePatientBodyRegionAnnotationDto, PatientBodyRegionAnnotation>
{
  constructor(
    private readonly annotationRepository: PatientBodyRegionAnnotationRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: CreatePatientBodyRegionAnnotationDto,
  ): Promise<PatientBodyRegionAnnotation> {
    await this.assertPatientExists.execute(
      CreatePatientBodyRegionAnnotationUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const annotation = PatientBodyRegionAnnotation.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      bodyRegionId: dto.input.bodyRegionId,
      content: dto.input.content.trim(),
      professionalId: dto.input.professionalId?.trim() ?? '',
      professionalName: dto.input.professionalName.trim(),
    });

    return this.annotationRepository.save(annotation);
  }
}
