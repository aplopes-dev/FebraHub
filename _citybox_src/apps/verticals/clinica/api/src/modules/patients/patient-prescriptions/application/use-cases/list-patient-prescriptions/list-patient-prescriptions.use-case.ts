import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientPrescriptionRepository } from '../../../domain/repositories/patient-prescription.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type {
  ListPatientPrescriptionsDto,
  ListPatientPrescriptionsResult,
} from '../../dtos/patient-prescription.dto';

@Injectable()
export class ListPatientPrescriptionsUseCase implements IUseCase<
  ListPatientPrescriptionsDto,
  ListPatientPrescriptionsResult
> {
  constructor(
    private readonly prescriptionRepository: PatientPrescriptionRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: ListPatientPrescriptionsDto,
  ): Promise<ListPatientPrescriptionsResult> {
    await this.assertPatientExists.execute(
      ListPatientPrescriptionsUseCase.name,
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
      this.prescriptionRepository.findManyByPatientId(
        dto.storeId,
        dto.patientId,
        criteria,
      ),
      this.prescriptionRepository.countByPatientId(
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
