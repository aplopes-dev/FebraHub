import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientCertificateRepository } from '../../../domain/repositories/patient-certificate.repository.interface';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type {
  ListPatientCertificatesDto,
  ListPatientCertificatesResult,
} from '../../dtos/patient-certificate.dto';

@Injectable()
export class ListPatientCertificatesUseCase implements IUseCase<
  ListPatientCertificatesDto,
  ListPatientCertificatesResult
> {
  constructor(
    private readonly certificateRepository: PatientCertificateRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(
    dto: ListPatientCertificatesDto,
  ): Promise<ListPatientCertificatesResult> {
    await this.assertPatientExists.execute(
      ListPatientCertificatesUseCase.name,
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
      this.certificateRepository.findManyByPatientId(
        dto.storeId,
        dto.patientId,
        criteria,
      ),
      this.certificateRepository.countByPatientId(
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
