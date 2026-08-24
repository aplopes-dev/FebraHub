import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientToothAnnotation } from '../../../domain/entities/patient-tooth-annotation.entity';
import { PatientToothAnnotationRepository } from '../../../domain/repositories/patient-tooth-annotation.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { CreatePatientToothAnnotationDto } from '../../dtos/patient-tooth-annotation.dto';

@Injectable()
export class CreatePatientToothAnnotationUseCase
  implements IUseCase<CreatePatientToothAnnotationDto, PatientToothAnnotation>
{
  constructor(
    private readonly annotationRepository: PatientToothAnnotationRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: CreatePatientToothAnnotationDto,
  ): Promise<PatientToothAnnotation> {
    await this.assertPatientExists.execute(
      CreatePatientToothAnnotationUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const annotation = PatientToothAnnotation.create({
      storeId: dto.storeId,
      patientId: dto.patientId,
      toothNumber: dto.input.toothNumber,
      content: dto.input.content.trim(),
      professionalId: dto.input.professionalId?.trim() ?? '',
      professionalName: dto.input.professionalName.trim(),
    });

    return this.annotationRepository.save(annotation);
  }
}
