import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientCategoryRepository } from '../../../domain/repositories/patient-category.repository.interface';
import { PatientCategory } from '../../../domain/entities/patient-category.entity';
import { PatientCategoryNameTakenError } from '../../../domain/errors/patient-category-name-taken.error';
import type { CreatePatientCategoryDto } from '../../dtos/patient-category.dto';

@Injectable()
export class CreatePatientCategoryUseCase implements IUseCase<
  CreatePatientCategoryDto,
  PatientCategory
> {
  constructor(private readonly repository: PatientCategoryRepository) {}

  async execute(dto: CreatePatientCategoryDto): Promise<PatientCategory> {
    const name = dto.name.trim();
    const existing = await this.repository.findByName(dto.storeId, name);
    if (existing) {
      throw new PatientCategoryNameTakenError(
        CreatePatientCategoryUseCase.name,
        name,
      );
    }

    const category = PatientCategory.create({
      storeId: dto.storeId,
      name,
      colorId: dto.colorId,
    });

    return this.repository.save(category);
  }
}
