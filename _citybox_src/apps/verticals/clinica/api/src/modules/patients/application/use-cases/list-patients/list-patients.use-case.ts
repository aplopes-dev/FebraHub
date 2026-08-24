import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../domain/repositories/patient.repository.interface';
import type {
  ListPatientsDto,
  ListPatientsResult,
} from '../../dtos/patient.dto';

@Injectable()
export class ListPatientsUseCase implements IUseCase<
  ListPatientsDto,
  ListPatientsResult
> {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute({
    storeId,
    page = 1,
    perPage = 20,
    search,
    categoryId,
    status,
    sortBy,
    sortOrder,
  }: ListPatientsDto): Promise<ListPatientsResult> {
    const skip = (page - 1) * perPage;
    const criteria = {
      skip,
      take: perPage,
      search: search?.trim() || undefined,
      categoryId: categoryId?.trim() || undefined,
      status,
      sortBy,
      sortOrder: sortOrder ?? 'asc',
    };

    const [items, total] = await Promise.all([
      this.patientRepository.findMany(storeId, criteria),
      this.patientRepository.count(storeId, criteria),
    ]);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
