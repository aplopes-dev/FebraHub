import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientBodyMetricRepository } from '../../../domain/repositories/patient-body-metric.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type {
  ListPatientBodyMetricsDto,
  ListPatientBodyMetricsResult,
} from '../../dtos/patient-body-metric.dto';

@Injectable()
export class ListPatientBodyMetricsUseCase
  implements IUseCase<ListPatientBodyMetricsDto, ListPatientBodyMetricsResult>
{
  constructor(
    private readonly bodyMetricRepository: PatientBodyMetricRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: ListPatientBodyMetricsDto,
  ): Promise<ListPatientBodyMetricsResult> {
    await this.assertPatientExists.execute(
      ListPatientBodyMetricsUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 10;
    const skip = (page - 1) * perPage;
    const criteria = {
      skip,
      take: perPage,
      sortBy: dto.sortBy,
      sortOrder: dto.sortOrder,
    };

    const [items, total] = await Promise.all([
      this.bodyMetricRepository.findManyByPatientId(
        dto.storeId,
        dto.patientId,
        criteria,
      ),
      this.bodyMetricRepository.countByPatientId(
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
