import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientContractEmissionRepository } from '../../../domain/repositories/patient-contract-emission.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type {
  ListPatientContractEmissionsDto,
  ListPatientContractEmissionsResult,
} from '../../dtos/patient-contract-emission.dto';

@Injectable()
export class ListPatientContractEmissionsUseCase implements IUseCase<
  ListPatientContractEmissionsDto,
  ListPatientContractEmissionsResult
> {
  constructor(
    private readonly emissionRepository: PatientContractEmissionRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: ListPatientContractEmissionsDto,
  ): Promise<ListPatientContractEmissionsResult> {
    await this.assertPatientExists.execute(
      ListPatientContractEmissionsUseCase.name,
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
      this.emissionRepository.findManyByPatientId(
        dto.storeId,
        dto.patientId,
        criteria,
      ),
      this.emissionRepository.countByPatientId(
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
