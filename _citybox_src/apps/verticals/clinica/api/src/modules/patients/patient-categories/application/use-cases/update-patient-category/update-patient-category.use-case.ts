import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientCategoryRepository } from '../../../domain/repositories/patient-category.repository.interface';
import { PatientCategory } from '../../../domain/entities/patient-category.entity';
import { PatientCategoryNotFoundError } from '../../../domain/errors/patient-category-not-found.error';
import { PatientCategoryNameTakenError } from '../../../domain/errors/patient-category-name-taken.error';
import type { UpdatePatientCategoryDto } from '../../dtos/patient-category.dto';

@Injectable()
export class UpdatePatientCategoryUseCase implements IUseCase<
  UpdatePatientCategoryDto,
  PatientCategory
> {
  constructor(private readonly repository: PatientCategoryRepository) {}

  async execute(dto: UpdatePatientCategoryDto): Promise<PatientCategory> {
    const category = await this.repository.findById(dto.storeId, dto.id);
    if (!category) {
      throw new PatientCategoryNotFoundError(
        UpdatePatientCategoryUseCase.name,
        dto.id,
      );
    }

    const name = dto.name.trim();
    const existing = await this.repository.findByName(dto.storeId, name);
    if (existing && existing.id !== dto.id) {
      throw new PatientCategoryNameTakenError(
        UpdatePatientCategoryUseCase.name,
        name,
      );
    }

    category.update({ name, colorId: dto.colorId });
    return this.repository.save(category);
  }
}
