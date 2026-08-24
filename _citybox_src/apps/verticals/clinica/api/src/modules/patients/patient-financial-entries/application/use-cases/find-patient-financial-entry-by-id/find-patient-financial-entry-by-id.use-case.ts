import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { PatientFinancialEntry } from '../../../domain/entities/patient-financial-entry.entity';
import { PatientFinancialEntryRepository } from '../../../domain/repositories/patient-financial-entry.repository.interface';
import { PatientFinancialEntryNotFoundError } from '../../../domain/errors/patient-financial-entry-not-found.error';
import { AssertPatientExistsService } from '../../services/assert-patient-exists.service';
import { HydratePatientFinancialDebitDetailService } from '../../services/hydrate-patient-financial-debit-detail.service';
import type { FindPatientFinancialEntryByIdDto } from '../../dtos/patient-financial-entry.dto';

@Injectable()
export class FindPatientFinancialEntryByIdUseCase implements IUseCase<
  FindPatientFinancialEntryByIdDto,
  PatientFinancialEntry
> {
  constructor(
    private readonly entryRepository: PatientFinancialEntryRepository,
    private readonly assertPatientExists: AssertPatientExistsService,
    private readonly hydrateDebitDetail: HydratePatientFinancialDebitDetailService,
  ) {}

  async execute(
    dto: FindPatientFinancialEntryByIdDto,
  ): Promise<PatientFinancialEntry> {
    await this.assertPatientExists.execute(
      FindPatientFinancialEntryByIdUseCase.name,
      dto.storeId,
      dto.patientId,
    );

    const entry = await this.entryRepository.findById(
      dto.storeId,
      dto.patientId,
      dto.entryId,
    );

    if (!entry) {
      throw new PatientFinancialEntryNotFoundError(
        FindPatientFinancialEntryByIdUseCase.name,
        dto.entryId,
      );
    }

    return this.hydrateDebitDetail.hydrateOne(entry);
  }
}
