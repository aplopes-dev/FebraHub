import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientCategoryRepository } from '../../../domain/repositories/patient-category.repository.interface';
import { PatientCategoryNotFoundError } from '../../../domain/errors/patient-category-not-found.error';
import { PatientCategoryIsProtectedError } from '../../../domain/errors/patient-category-is-protected.error';
import { PatientCategoryHasPatientsError } from '../../../domain/errors/patient-category-has-patients.error';
import type { DeletePatientCategoryDto } from '../../dtos/patient-category.dto';

@Injectable()
export class DeletePatientCategoryUseCase implements IUseCase<
  DeletePatientCategoryDto,
  void
> {
  constructor(private readonly repository: PatientCategoryRepository) {}

  async execute(dto: DeletePatientCategoryDto): Promise<void> {
    const category = await this.repository.findById(dto.storeId, dto.id);
    if (!category) {
      throw new PatientCategoryNotFoundError(
        DeletePatientCategoryUseCase.name,
        dto.id,
      );
    }

    if (category.isProtected) {
      throw new PatientCategoryIsProtectedError(
        DeletePatientCategoryUseCase.name,
        dto.id,
      );
    }

    const patientCount = await this.repository.countPatients(
      dto.storeId,
      dto.id,
    );
    if (patientCount > 0) {
      throw new PatientCategoryHasPatientsError(
        DeletePatientCategoryUseCase.name,
        dto.id,
      );
    }

    await this.repository.delete(dto.storeId, dto.id);
  }
}
