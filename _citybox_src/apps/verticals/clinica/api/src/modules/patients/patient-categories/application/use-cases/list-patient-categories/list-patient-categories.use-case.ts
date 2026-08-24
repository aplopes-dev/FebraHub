import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientCategoryRepository } from '../../../domain/repositories/patient-category.repository.interface';
import type { PatientCategory } from '../../../domain/entities/patient-category.entity';
import type { ListPatientCategoriesDto } from '../../dtos/patient-category.dto';

@Injectable()
export class ListPatientCategoriesUseCase implements IUseCase<
  ListPatientCategoriesDto,
  PatientCategory[]
> {
  constructor(private readonly repository: PatientCategoryRepository) {}

  async execute(dto: ListPatientCategoriesDto): Promise<PatientCategory[]> {
    return this.repository.findAll(dto.storeId);
  }
}
