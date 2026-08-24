import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFinancialEntryRepository } from '../../../domain/repositories/patient-financial-entry.repository.interface';
import { PatientFinancialEntryNotFoundError } from '../../../domain/errors/patient-financial-entry-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import type { DeletePatientFinancialEntryDto } from '../../dtos/patient-financial-entry.dto';

@Injectable()
export class DeletePatientFinancialEntryUseCase implements IUseCase<
  DeletePatientFinancialEntryDto,
  void
> {
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
  ) {}

  async execute(dto: DeletePatientFinancialEntryDto): Promise<void> {
    await this.assertPatientExists.execute(
      DeletePatientFinancialEntryUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const existing = await this.entryRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.entryId,
    );

    if (!existing) {
      throw new PatientFinancialEntryNotFoundError(
        DeletePatientFinancialEntryUseCase.name,
        dto.entryId,
      );
    }

    await this.entryRepository.delete(dto.storeId, dto.patientId, dto.entryId);
  }
}
