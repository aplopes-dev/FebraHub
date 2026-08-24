import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { PatientToothAnnotation } from '../../../domain/entities/patient-tooth-annotation.entity';
import { PatientToothAnnotationRepository } from '../../../domain/repositories/patient-tooth-annotation.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { ListPatientToothAnnotationsDto } from '../../dtos/patient-tooth-annotation.dto';

@Injectable()
export class ListPatientToothAnnotationsUseCase
  implements IUseCase<ListPatientToothAnnotationsDto, PatientToothAnnotation[]>
{
  constructor(
    private readonly annotationRepository: PatientToothAnnotationRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: ListPatientToothAnnotationsDto,
  ): Promise<PatientToothAnnotation[]> {
    await this.assertPatientExists.execute(
      ListPatientToothAnnotationsUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    return this.annotationRepository.findManyByPatientId(
      dto.storeId,
      dto.patientId,
      { toothNumber: dto.toothNumber },
    );
  }
}
