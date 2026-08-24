import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientAnamnesisRepository } from '../../../domain/repositories/patient-anamnesis.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type {
  ListPatientAnamnesesDto,
  ListPatientAnamnesesResult,
} from '../../dtos/patient-anamnesis.dto';

@Injectable()
export class ListPatientAnamnesesUseCase implements IUseCase<
  ListPatientAnamnesesDto,
  ListPatientAnamnesesResult
> {
  constructor(
    private readonly anamnesisRepository: PatientAnamnesisRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: ListPatientAnamnesesDto,
  ): Promise<ListPatientAnamnesesResult> {
    await this.assertPatientExists.execute(
      ListPatientAnamnesesUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 10;
    const skip = (page - 1) * perPage;
    const criteria = {
      skip,
      take: perPage,
      search: dto.search,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };

    const [items, total] = await Promise.all([
      this.anamnesisRepository.findManyByPatientId(
        dto.storeId,
        dto.patientId,
        criteria,
      ),
      this.anamnesisRepository.countByPatientId(
        dto.storeId,
        dto.patientId,
        criteria,
      ),
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
